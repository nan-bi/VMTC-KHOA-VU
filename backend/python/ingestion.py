"""Excel/CSV import and repeat-safe reconciliation; uploaded bytes stay in RAM."""
import base64
import csv
import hashlib
import io
import json
import re
import zipfile
import unicodedata
from datetime import datetime, timezone
from pathlib import PurePosixPath

from data_rules import (PROVENANCE, normalize_date, json_text, validate,
                        gross_amount, integer, number)
from classification import revenue_scope

FILE_LIMIT = 100 * 1024 * 1024
TOTAL_LIMIT = 500 * 1024 * 1024
ROW_LIMIT = 100000
REQUIRED = ['order_id', 'patient_id', 'visit_id', 'service_code', 'ordering_dept',
            'performing_dept', 'ordered_at', 'quantity', 'completed_qty',
            'unit_price_vnd', 'status', 'price_mode', 'discount_known', 'in_snapshot']
ALIASES = {'Thời điểm trả kết quả': 'result_returned_at', 'Ngày trả kết quả': 'result_returned_at',
           'Bác sĩ thực hiện': 'performing_doctor_name', 'Mã bác sĩ chỉ định': 'ordering_doctor_id',
           'Mã bác sĩ thực hiện': 'performing_doctor_id', 'Bác sĩ chỉ định': 'ordering_doctor_name',
           'Tên gói dịch vụ': 'package_name', 'Tên gói': 'package_name',
           'Mã chỉ định': 'order_id', 'Mã chỉ định HIS': 'order_id', 'his_order_id': 'order_id',
           'Mã BN': 'patient_id', 'Mã lượt': 'visit_id', 'Mã DV': 'service_code', 'Tên DV': 'service_name',
           'Khoa chỉ định': 'ordering_dept', 'Khoa thực hiện': 'performing_dept', 'Phòng thực hiện': 'performing_room',
           'Ngày chỉ định': 'ordered_at', 'Ngày hoàn thành': 'completed_at', 'Số lượng': 'quantity',
           'Số lượng hoàn thành': 'completed_qty', 'Đơn giá': 'unit_price_vnd', 'Trạng thái': 'status',
           'Chế độ giá': 'price_mode', 'Đã biết giảm giá': 'discount_known', 'Trong snapshot': 'in_snapshot',
           'Thành tiền chỉ định': 'gross_order_vnd', 'Thành tiền hoàn thành': 'completed_gross_vnd',
           'Sau giảm hoàn thành': 'completed_net_vnd', 'Giảm giá': 'discount_vnd', 'Mã gói': 'package_id',
           'Phân bổ gói': 'package_allocation_vnd',
           'SL chỉ định': 'quantity', 'SL hoàn thành': 'completed_qty',
           'Đơn giá VND': 'unit_price_vnd', 'Trước giảm VND': 'completed_gross_vnd',
           'Giảm VND': 'discount_vnd', 'Sau giảm đã biết VND': 'completed_net_vnd'}


# Input column labels are independent from the fixed report template.
OPTIONAL_FIELDS = {'service_name', 'completed_at', 'result_returned_at',
                   'performing_room', 'ordering_doctor_id', 'ordering_doctor_name',
                   'performing_doctor_id', 'performing_doctor_name', 'package_id',
                   'package_name', 'gross_order_vnd', 'completed_gross_vnd',
                   'completed_net_vnd', 'discount_vnd', 'package_allocation_vnd'}
IMPORT_FIELDS = set(REQUIRED) | OPTIONAL_FIELDS


def canonical_key(value):
    return ALIASES.get(value, value)


def column_profile(profiles, columns, filename, sheet):
    if not isinstance(profiles, list) or len(profiles) > 500:
        raise ValueError('Tối đa 500 cấu trúc cột mỗi lần nhập.')
    candidates = [p for p in profiles if isinstance(p, dict) and isinstance(p.get('columns'), list) and sorted(p['columns']) == sorted(columns)
                  and (p.get('learned') is True or (p.get('file') == filename and p.get('sheet') == sheet))]
    explicit = [p for p in candidates if p.get('learned') is not True]
    candidates = explicit or candidates
    if not candidates:
        return None
    if len({json_text(p.get('mapping')) for p in candidates}) != 1:
        raise ValueError('Cấu trúc này có ánh xạ mâu thuẫn; xác nhận lại cột của sheet.')
    profile = candidates[-1]
    mapping = profile.get('mapping')
    if not isinstance(mapping, dict) or not mapping or any(k not in columns or v not in IMPORT_FIELDS for k, v in mapping.items()):
        raise ValueError('Ánh xạ cột không hợp lệ; không được ánh xạ thông tin truy vết.')
    if not isinstance(profile.get('reason'), str) or len(profile['reason'].strip()) < 8:
        raise ValueError('Xác nhận ánh xạ cần lý do ít nhất 8 ký tự.')
    targets = [mapping.get(key, canonical_key(key)) for key in columns]
    if len(targets) != len(set(targets)):
        raise ValueError('Nhiều cột cùng ánh xạ một trường. Hãy kiểm tra lại.')
    return dict(columns=columns, mapping=mapping, reason=profile['reason'].strip())


def inspect_schema(rows, internal_keys=False):
    columns = list(rows[0]) if rows else []
    mapped = [ALIASES.get(key, key) for key in columns]
    return dict(columns=columns, mapped=mapped,
                missing=[key for key in REQUIRED if not (internal_keys and key == 'order_id') and key not in mapped],
                collisions=[key for i, key in enumerate(mapped) if key in mapped[:i]])


def adapt_rows(rows, filename, *, sheet=None, hash_value=None, row_numbers=None, ingested_at=None, internal_keys=None):
    schema = inspect_schema(rows, internal_keys is not None)
    if schema['missing'] or schema['collisions']:
        raise ValueError(f"{filename}: thiếu cột {', '.join(schema['missing']) or 'không'}; cột ánh xạ trùng {', '.join(schema['collisions']) or 'không'}.")
    adapted = []
    for index, item in enumerate(rows):
        row = {ALIASES.get(key, key): value for key, value in item.items()}
        if internal_keys is not None and not row.get('order_id'):
            row['order_id'] = internal_keys[index]
        row['status'] = {'CHO_THUC_HIEN': 'CHOTHUCHIEN'}.get(row.get('status'), row.get('status'))
        row['price_mode'] = {'MUA_LE': 'MUALE', 'PHAT_SINH_NGOAI_GOI': 'THEMNGOAIGOI', 'TRONG_GOI': 'TRONGGOI'}.get(row.get('price_mode'), row.get('price_mode'))
        row['ordered_at'] = normalize_date(row.get('ordered_at'))
        row['completed_at'] = normalize_date(row.get('completed_at'))
        if row.get('result_returned_at') is not None:
            row['result_returned_at'] = normalize_date(row['result_returned_at'])
        row.update(file_hash=hash_value, source_file=filename,
                   source_row=row_numbers[index] if row_numbers is not None else index + 2)
        if sheet:
            row['source_sheet'] = sheet
        if hash_value:
            row['source_file_hash'] = hash_value
        if ingested_at:
            row['ingested_at'] = ingested_at
        adapted.append(row)
    return dict(schema=schema, rows=adapted)


def value_present(value):
    return value is not None and value != ''


def csv_grid(raw):
    csv.field_size_limit(FILE_LIMIT)
    # Try UTF-8 first and retain leading zero identifiers. Numeric business
    # fields may be strings; the exact-money parser handles them without floats.
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = raw.decode('cp1258')
    sample = text[:65536]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
    except csv.Error:
        dialect = csv.excel
    for row in csv.reader(io.StringIO(text), dialect):
        yield [None if item == '' else item for item in row]


def xlsx_sheets(raw):
    # Read-only/data-only never runs Excel macros or formulas. Reject expanded
    # archives well beyond configured upload limits before XML is decompressed.
    from openpyxl import load_workbook
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        if sum(item.file_size for item in archive.infolist()) > 1024 * 1024 * 1024:
            raise ValueError('Workbook giải nén vượt giới hạn 1 GB.')
    book = load_workbook(io.BytesIO(raw), read_only=True, data_only=True, keep_links=False)
    try:
        for sheet in book.worksheets:
            if sheet.max_row and sheet.max_row > ROW_LIMIT + 31 or sheet.max_column and sheet.max_column > 301:
                yield sheet.title, None, 'Phạm vi sheet quá lớn; cần thu gọn vùng dữ liệu.', 0
                continue
            def cells(ws=sheet):
                for row in ws.iter_rows():
                    values = []
                    for cell in row:
                        value = cell.value
                        values.append(value)
                    yield values
            yield sheet.title, cells(), None, 1462 if book.epoch.year == 1904 else 0
    finally:
        book.close()


def xls_sheets(raw):
    import xlrd
    book = xlrd.open_workbook(file_contents=raw, on_demand=True)
    try:
        for sheet in book.sheets():
            if sheet.nrows > ROW_LIMIT + 31 or sheet.ncols > 301:
                yield sheet.name, None, 'Phạm vi sheet quá lớn; cần thu gọn vùng dữ liệu.', 0
            else:
                def cells(ws=sheet):
                    for i in range(ws.nrows):
                        yield [xlrd.xldate_as_datetime(cell.value, book.datemode)
                               if cell.ctype == xlrd.XL_CELL_DATE else
                               None if cell.value == '' else cell.value
                               for cell in ws.row(i)]
                yield sheet.name, cells(), None, 1462 if book.datemode else 0
    finally:
        book.release_resources()


def header_key(value):
    text = ''.join(c for c in unicodedata.normalize('NFD', str(value or '').strip().lower()) if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', text.replace('đ', 'd')).strip()


def detect_header(grid, first):
    """Score source labels, never require a fully populated financial schema."""
    known = {header_key(k) for k in ALIASES} | {header_key(k) for k in REQUIRED}
    anchors = {'chi tieu', 'gia tri', 'don vi', 'dien giai', 'ma', 'ma viec', 'ma kpi',
               'ma kich ban', 'ma luot gia lap', 'ma dong gia lap', 'ma doi chieu',
               'ma nguon', 'nguon', 'trang thai', 'ma dich chua duyet', 'diem nghen',
               'uu tien de xuat', 'sl chi dinh', 'sl hoan thanh', 'don gia vnd'}
    best, score = first, -1
    for i in range(first, min(first + 30, len(grid))):
        cells = [str(v).strip() for v in grid[i] if value_present(v)]
        keys = [header_key(v) for v in cells]
        matches = sum(k in known or k in anchors for k in keys)
        candidate = matches * 100 + sum(len(v) <= 60 and not re.match(r'^[-+]?\d', v) for v in cells)
        if candidate > score:
            best, score = i, candidate
    return best


def reference_kind(headers):
    keys = {header_key(h) for h in headers}
    mapped = {ALIASES.get(h, h) for h in headers}
    financial = {'quantity', 'completed_qty', 'unit_price_vnd', 'completed_gross_vnd', 'completed_net_vnd', 'gross_order_vnd'}
    if len(mapped & financial) >= 2 or keys & {'sl chi dinh', 'sl hoan thanh', 'don gia vnd', 'sau giam da biet vnd'}:
        return 'FINANCIAL_PENDING', 'Tài chính · thiếu liên kết dịch vụ'
    if keys & {'ma kpi', 'tu so cach tinh', 'quan the mau so'}:
        return 'KPI', 'Định nghĩa KPI'
    if keys & {'ma doi chieu', 'ma dich chua duyet'}:
        return 'MAPPING', 'Danh mục ánh xạ cần xác nhận'
    if keys & {'ma luot gia lap', 'trang thai luot'}:
        return 'ENCOUNTERS', 'Lượt / quy trình'
    if keys & {'chi tieu'} and keys & {'gia tri'}:
        return 'SUMMARY', 'Bảng tổng hợp'
    return 'REFERENCE', 'Bảng tham chiếu / nghiệp vụ'


def staged_table(grid, header_index, filename, sheet, digest):
    width = max((len(r) for r in grid[header_index:]), default=0)
    header = grid[header_index]
    headers, seen = [], set()
    for c in range(width):
        name = str(header[c]).strip() if c < len(header) and value_present(header[c]) else f'Cột chưa đặt tên {c + 1}'
        base = name
        while name in seen:
            name += f' ({c + 1})'
        seen.add(name);headers.append(name)
    records, physical = [], []
    for i in range(header_index + 1, len(grid)):
        if not any(value_present(v) for v in grid[i]):
            continue
        records.append({h: (v.isoformat() if isinstance(v, datetime) else v)
                        for h, v in zip(headers, grid[i])})
        physical.append(i + 1)
    kind, label = reference_kind(headers)
    missing = inspect_schema([dict.fromkeys(headers)], True)['missing']
    return dict(file=filename, sheet=sheet, hash=digest, category=kind, label=label,
                headerRow=header_index + 1, columns=headers, rows=records, sourceRows=physical,
                missing=missing, reason='Chưa đưa vào doanh thu: cần đủ cột và liên kết nguồn.' if kind == 'FINANCIAL_PENDING'
                else 'Lưu riêng để tra cứu; không phải dòng dịch vụ đủ điều kiện tính doanh thu.')


def ingest_file(payload):
    filename = payload.get('name')
    folder = payload.get('folder') is True
    analyze_all = payload.get('analyzeAll') is True
    if not isinstance(filename, str) or not filename or len(filename) > 2000:
        raise ValueError('Tên file không hợp lệ.')
    extension = PurePosixPath(filename.replace('\\', '/')).suffix.lower()
    if extension not in ['.xlsx', '.xls', '.csv']:
        raise ValueError(f'{filename}: chỉ hỗ trợ Excel / CSV.')
    encoded = payload.get('content')
    if not isinstance(encoded, str) or len(encoded) > (FILE_LIMIT * 4 // 3 + 8):
        raise ValueError(f'{filename}: mỗi file tối đa 100 MB.')
    try:
        raw = base64.b64decode(encoded, validate=True)
    except ValueError:
        raise ValueError('Nội dung file không hợp lệ.') from None
    if len(raw) > FILE_LIMIT:
        raise ValueError(f'{filename}: mỗi file tối đa 100 MB.')
    digest = hashlib.sha256(raw).hexdigest()
    ingested_at = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    rows, skipped, sheet_names, schema, tables, applied_profiles = [], [], [], None, [], []
    try:
        if extension == '.csv':
            sheets = [('Sheet1', csv_grid(raw), None, 0)]
        elif extension == '.xls':
            sheets = xls_sheets(raw)
        else:
            sheets = xlsx_sheets(raw)
        # File mode prefers CANONICAL. Loading only sheet descriptors avoids
        # materializing the entire workbook before sheet selection.
        if not folder and not analyze_all and extension == '.xlsx':
            from openpyxl import load_workbook
            probe = load_workbook(io.BytesIO(raw), read_only=True, data_only=True, keep_links=False)
            preferred = 'CANONICAL' if 'CANONICAL' in probe.sheetnames else probe.sheetnames[0]
            probe.close()
        elif not folder and not analyze_all and extension == '.xls':
            import xlrd
            probe = xlrd.open_workbook(file_contents=raw, on_demand=True)
            preferred = 'CANONICAL' if 'CANONICAL' in probe.sheet_names() else probe.sheet_names()[0]
            probe.release_resources()
        else:
            preferred = None
        for sheet_name, iterator, sheet_error, epoch_offset in sheets:
            if preferred is not None and sheet_name != preferred:
                continue
            try:
                if sheet_error:
                    raise ValueError(sheet_error)
                grid = []
                for i, item in enumerate(iterator):
                    if i >= ROW_LIMIT + 31 or len(item) > 301:
                        raise ValueError('Phạm vi sheet quá lớn; cần thu gọn vùng dữ liệu.')
                    grid.append(item)
                # Exclude leading blank spreadsheet rows just as decode_range
                # begins at the first occupied cell; preserve physical indices.
                first = next((i for i, r in enumerate(grid) if any(value_present(v) for v in r)), None)
                if first is None:
                    raise ValueError('Sheet rỗng.')
                header_index = detect_header(grid, first) if analyze_all else first
                if folder and not analyze_all:
                    for i in range(first, min(first + 30, len(grid))):
                        keys = [str(v) for v in grid[i] if value_present(v)]
                        if keys and not inspect_schema([dict.fromkeys(keys)], True)['missing']:
                            header_index = i
                            break
                if analyze_all:
                    raw_headers = [str(v).strip() for v in grid[header_index] if value_present(v)]
                    if len(set(raw_headers)) != len(raw_headers):
                        raise ValueError('Có tiêu đề cột trùng.')
                    table = staged_table(grid, header_index, filename, sheet_name, digest)
                    try:
                        profile = column_profile(payload.get('columnMappings', []), table['columns'], filename, sheet_name)
                    except ValueError as error:
                        table.update(mappingError=str(error), reason=str(error) + ' Chưa cộng doanh thu; xác nhận lại ánh xạ cột.')
                        tables.append(table)
                        continue
                    mapping = profile['mapping'] if profile else {}
                    mapped_headers = [mapping.get(key, key) for key in table['columns']]
                    schema_check = inspect_schema([dict.fromkeys(mapped_headers)], True)
                    if schema_check['missing'] or schema_check['collisions']:
                        if sum(len(t['rows']) for t in tables) + len(table['rows']) + len(rows) > ROW_LIMIT:
                            raise OverflowError('Vượt giới hạn tổng dòng một lần phân tích.')
                        tables.append(table)
                        continue
                headers = ['' if v is None else str(v).strip() for v in grid[header_index]]
                mapping = mapping if analyze_all else {}
                if analyze_all and profile:
                    applied_profiles.append(dict(profile, file=filename, sheet=sheet_name))
                nonempty = [v for v in headers if v]
                if len(set(nonempty)) != len(nonempty):
                    raise ValueError('Có tiêu đề cột trùng.')
                data, physical = [], []
                for i in range(header_index + 1, len(grid)):
                    values = grid[i]
                    if not any(value_present(v) for v in values):
                        continue
                    if any(value_present(value) and (c >= len(headers) or not headers[c]) for c, value in enumerate(values)):
                        raise ValueError(f'Dòng {i + 1} có dữ liệu ở cột không có tiêu đề.')
                    item = {h: values[c] if c < len(values) else None for c, h in enumerate(headers) if h}
                    # Normalize known date fields before hashing, using the workbook's
                    # calendar. Never shift numeric identifiers, quantities or prices.
                    for key, value in item.items():
                        date_field = ALIASES.get(mapping.get(key, key), mapping.get(key, key)) in {'ordered_at', 'completed_at', 'result_returned_at'}
                        if isinstance(value, datetime):
                            from openpyxl.utils.datetime import to_excel
                            value = to_excel(value)
                        elif date_field and epoch_offset and isinstance(value, (int, float)) and not isinstance(value, bool):
                            value += epoch_offset
                        item[key] = value
                    data.append(item)
                    physical.append(i + 1)
                if not data or len(data) > ROW_LIMIT:
                    raise ValueError('Sheet phải có từ 1 đến 100.000 dòng dữ liệu.')
                internal = ['LOCAL-' + hashlib.sha256(json_text([[k, row[k]] for k in sorted(set(row) - PROVENANCE)]).encode('utf-8')).hexdigest() for row in data]
                mapped_data = [{mapping.get(key, key): value for key, value in row.items()} for row in data]
                parsed = adapt_rows(mapped_data, filename, sheet=sheet_name, hash_value=digest,
                                    row_numbers=physical, ingested_at=ingested_at, internal_keys=internal)
                if len(rows) + len(parsed['rows']) > ROW_LIMIT:
                    raise OverflowError('Vượt giới hạn tổng dòng một lần phân tích.')
                rows.extend(parsed['rows'])
                schema = parsed['schema']
                sheet_names.append(sheet_name)
            except (ValueError, TypeError) as error:
                if not folder and not analyze_all:
                    raise ValueError(f'{filename}: {error}') from None
                skipped.append(dict(file=filename, sheet=sheet_name, reason=str(error)))
    except (ValueError, zipfile.BadZipFile, OSError) as error:
        if not folder and not analyze_all:
            raise ValueError(str(error)) from None
        skipped.append(dict(file=filename, sheet='', reason='Không đọc được workbook: ' + str(error)))
    if not folder and skipped and not rows and not tables:
        raise ValueError(f"{filename}: {skipped[0]['reason']}")
    files = [dict(file=filename, sheet=', '.join(sheet_names), hash=digest, count=len(rows), schema=schema, referenceTables=tables, columnMappings=applied_profiles, serviceSheets=sheet_names)] if rows or tables else []
    return dict(rows=rows, files=files, skippedSheets=skipped)


def normalize_incoming(row):
    result = dict(row)
    for key in ['ordered_at', 'completed_at', 'ingested_at']:
        result[key] = normalize_date(row.get(key))
    order_id = row.get('order_id')
    if result.get('his_order_id') is None and order_id and not re.match(r'^(SYN-|SIM-|LOCAL-)', str(order_id)) and not number(row.get('is_synthetic')):
        result['his_order_id'] = order_id
    if row.get('status') == 'HOANTHANH':
        try:
            if result.get('completed_gross_vnd') is None:
                result['completed_gross_vnd'] = gross_amount(result.get('completed_qty'), result.get('unit_price_vnd'))
        except ValueError:
            pass
        if result.get('completed_net_vnd') is None and number(result.get('discount_known')) == 1:
            if result.get('price_mode') == 'TRONGGOI' and integer(result.get('package_allocation_vnd')):
                result['completed_net_vnd'] = int(number(result['package_allocation_vnd']))
            elif result.get('price_mode') in ['MUALE', 'THEMNGOAIGOI'] and integer(result.get('completed_gross_vnd')) and integer(result.get('discount_vnd')):
                result['completed_net_vnd'] = int(number(result['completed_gross_vnd'])) - int(number(result['discount_vnd']))
    return result


def prepare_import(loaded, state, catalog):
    seen, accepted, skipped = set(state['hashes']), [], []
    stored = {(f.get('hash'), t.get('sheet')) for f in state.get('imports', []) for t in f.get('referenceTables', [])}
    handled = {(r.get('source_file_hash'), r.get('source_sheet')) for r in state['rows']}
    handled.update((f['hash'], sheet) for f in state.get('imports', []) for sheet in f.get('serviceSheets', []))
    for file in loaded['files']:
        if file['hash'] in seen:
            new_tables = [t for t in file.get('referenceTables', []) if (file['hash'], t['sheet']) not in stored]
            new_sheets = [sheet for sheet in file.get('serviceSheets', []) if (file['hash'], sheet) not in handled and (file['hash'], sheet) in stored]
            promoted_count = sum(r.get('source_file_hash') == file['hash'] and r.get('source_file') == file['file'] and r.get('source_sheet') in new_sheets for r in loaded['rows'])
            if new_tables or promoted_count:
                accepted.append(dict(file, count=promoted_count, serviceSheets=new_sheets, referenceTables=new_tables))
                handled.update((file['hash'], sheet) for sheet in new_sheets)
                stored.update((file['hash'], t['sheet']) for t in new_tables)
            else:
                skipped.append(file)
        else:
            seen.add(file['hash'])
            accepted.append(file)
            handled.update((file['hash'], sheet) for sheet in file.get('serviceSheets', []))
            stored.update((file['hash'], t['sheet']) for t in file.get('referenceTables', []))
    # Index sources once. Never merge two patients merely because names match.
    by_source = {}
    for row in loaded['rows']:
        by_source.setdefault((row.get('source_file_hash'), row.get('source_file')), []).append(row)
    incoming = [r for file in accepted for r in ([r for r in by_source.get((file['hash'], file['file']), []) if r.get('source_sheet') in file['serviceSheets']] if 'serviceSheets' in file else by_source.get((file['hash'], file['file']), []))[:file['count']]]
    rows = [normalize_incoming(row) for row in incoming]
    checked = validate(state['rows'] + rows, catalog, suspected_duplicates=True)
    offset = len(state['rows'])
    duplicates = [r for r in checked['duplicates'] if r['index'] >= offset]
    skip = {r['index'] - offset for r in duplicates}
    retained = [r for i, r in enumerate(rows) if i not in skip]
    if len(state['rows']) + len(retained) > ROW_LIMIT:
        raise ValueError(f"Kho dữ liệu tối đa 100.000 dòng; hiện có {len(state['rows'])} dòng. Chưa nhập thêm dữ liệu.")
    scope = revenue_scope(retained, state.get('serviceCalculation'))
    return dict(classification=dict(included=len(scope['included']), excluded=len(scope['excluded']), pending=len(scope['pending'])),
                skippedSheets=loaded.get('skippedSheets') or [], referenceTables=[t for f in accepted for t in f.get('referenceTables', [])], rows=retained, files=accepted, skippedFiles=skipped,
                hashes=list(dict.fromkeys(f['hash'] for f in accepted if f['hash'] not in state['hashes'])), duplicateCount=len(duplicates), readCount=len(loaded['rows']),
                issues=[e for e in checked['issues'] if e['index'] >= offset],
                existingConflicts=[e for e in checked['issues'] if e['index'] < offset], baseRevision=state['revision'])
