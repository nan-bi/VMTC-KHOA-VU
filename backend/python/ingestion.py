"""Excel/CSV import and repeat-safe reconciliation; uploaded bytes stay in RAM."""
import base64
import csv
import hashlib
import io
import json
import re
import zipfile
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
           'Phân bổ gói': 'package_allocation_vnd'}


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
                yield sheet.title, None, 'Phạm vi sheet quá lớn; cần thu gọn vùng dữ liệu.'
                continue
            def cells(ws=sheet):
                from openpyxl.utils.datetime import to_excel
                for row in ws.iter_rows():
                    values = []
                    for cell in row:
                        value = cell.value
                        # Match the former SheetJS serial-date normalization.
                        if isinstance(value, datetime):
                            value = to_excel(value, book.epoch)
                        values.append(value)
                    yield values
            yield sheet.title, cells(), None
    finally:
        book.close()


def xls_sheets(raw):
    import xlrd
    book = xlrd.open_workbook(file_contents=raw, on_demand=True)
    try:
        for sheet in book.sheets():
            if sheet.nrows > ROW_LIMIT + 31 or sheet.ncols > 301:
                yield sheet.name, None, 'Phạm vi sheet quá lớn; cần thu gọn vùng dữ liệu.'
            else:
                yield sheet.name, ([None if value == '' else value for value in sheet.row_values(i)] for i in range(sheet.nrows)), None
    finally:
        book.release_resources()


def ingest_file(payload):
    filename = payload.get('name')
    folder = payload.get('folder') is True
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
    rows, skipped, sheet_names, schema = [], [], [], None
    try:
        if extension == '.csv':
            sheets = [('Sheet1', csv_grid(raw), None)]
        elif extension == '.xls':
            sheets = xls_sheets(raw)
        else:
            sheets = xlsx_sheets(raw)
        # File mode prefers CANONICAL. Loading only sheet descriptors avoids
        # materializing the entire workbook before sheet selection.
        if not folder and extension == '.xlsx':
            from openpyxl import load_workbook
            probe = load_workbook(io.BytesIO(raw), read_only=True, data_only=True, keep_links=False)
            preferred = 'CANONICAL' if 'CANONICAL' in probe.sheetnames else probe.sheetnames[0]
            probe.close()
        elif not folder and extension == '.xls':
            import xlrd
            probe = xlrd.open_workbook(file_contents=raw, on_demand=True)
            preferred = 'CANONICAL' if 'CANONICAL' in probe.sheet_names() else probe.sheet_names()[0]
            probe.release_resources()
        else:
            preferred = None
        for sheet_name, iterator, sheet_error in sheets:
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
                header_index = first
                if folder:
                    for i in range(first, min(first + 30, len(grid))):
                        keys = [str(v) for v in grid[i] if value_present(v)]
                        if keys and not inspect_schema([dict.fromkeys(keys)], True)['missing']:
                            header_index = i
                            break
                headers = ['' if v is None else str(v).strip() for v in grid[header_index]]
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
                    data.append({h: values[c] if c < len(values) else None for c, h in enumerate(headers) if h})
                    physical.append(i + 1)
                if not data or len(data) > ROW_LIMIT:
                    raise ValueError('Sheet phải có từ 1 đến 100.000 dòng dữ liệu.')
                internal = None
                if folder:
                    internal = ['LOCAL-' + hashlib.sha256(json_text([[k, row[k]] for k in sorted(set(row) - PROVENANCE)]).encode('utf-8')).hexdigest() for row in data]
                parsed = adapt_rows(data, filename, sheet=sheet_name, hash_value=digest,
                                    row_numbers=physical, ingested_at=ingested_at, internal_keys=internal)
                if len(rows) + len(parsed['rows']) > ROW_LIMIT:
                    raise OverflowError('Vượt giới hạn tổng dòng một lần phân tích.')
                rows.extend(parsed['rows'])
                schema = parsed['schema']
                sheet_names.append(sheet_name)
            except (ValueError, TypeError) as error:
                if not folder:
                    raise ValueError(f'{filename}: {error}') from None
                skipped.append(dict(file=filename, sheet=sheet_name, reason=str(error)))
    except (ValueError, zipfile.BadZipFile, OSError) as error:
        if not folder:
            raise ValueError(str(error)) from None
        skipped.append(dict(file=filename, sheet='', reason='Không đọc được workbook: ' + str(error)))
    files = [dict(file=filename, sheet=', '.join(sheet_names), hash=digest, count=len(rows), schema=schema)] if rows else []
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
    for file in loaded['files']:
        if file['hash'] in seen:
            skipped.append(file)
        else:
            seen.add(file['hash'])
            accepted.append(file)
    # Index sources once. Never merge two patients merely because names match.
    by_source = {}
    for row in loaded['rows']:
        by_source.setdefault((row.get('source_file_hash'), row.get('source_file')), []).append(row)
    incoming = [r for file in accepted for r in by_source.get((file['hash'], file['file']), [])[:file['count']]]
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
                skippedSheets=loaded.get('skippedSheets') or [], rows=retained, files=accepted, skippedFiles=skipped,
                hashes=[f['hash'] for f in accepted], duplicateCount=len(duplicates), readCount=len(loaded['rows']),
                issues=[e for e in checked['issues'] if e['index'] >= offset],
                existingConflicts=[e for e in checked['issues'] if e['index'] < offset], baseRevision=state['revision'])
