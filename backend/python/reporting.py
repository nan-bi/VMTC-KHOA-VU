"""DATA_KHOAVU report model and XLSX serialization.

Rows are verified before export. Totals are cached SUM formulas over the main
service lines, and secondary sections are explanatory, never added twice.
The generated workbook is an in-memory ZIP; no upload or report temp file.
"""
import io
import json
import math
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

from data_rules import validate, business_date, integer, number, sum_money, sum_quantity
from classification import department, BILLING_NAMES

TEMPLATE_VERSION = 'DATA-KHOAVU-1'
IMAGING = ['Siêu âm vú', 'Siêu âm vi mạch', 'X-quang vú', 'MRI vú', 'Chẩn đoán hình ảnh khác']
PENDING_RULES = json.loads(Path(__file__).with_name('pending_rules.json').read_text(encoding='utf-8-sig'))


def col_name(index):
    name = ''
    index += 1
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(65 + remainder) + name
    return name


def doctor(row, kind):
    keys = ['imaging_doctor', 'performing_doctor_name', 'performing_doctor_id'] if kind == 'imaging' else ['clinical_doctor', 'ordering_doctor_name', 'ordering_doctor_id']
    return next((row[key] for key in keys if row.get(key)), None)


def text(value):
    return value.strip() if isinstance(value, str) and value.strip() else None


def known_money(value):
    return int(number(value)) if integer(value) and number(value) >= 0 else None


def unique(values):
    return list(dict.fromkeys(values))


def template_report(options):
    rows, catalog = options['rows'], options['catalog']
    meta, detail, service_revenue = options.get('meta') or {}, options.get('detail', False), options.get('serviceRevenue')
    checked = validate(rows, catalog)
    if checked['issues'] or checked['duplicates']:
        raise ValueError('Bản xuất theo mẫu chỉ nhận dòng đã đối soát, không trùng.')
    if any(r.get('status') != 'HOANTHANH' or number(r.get('in_snapshot')) != 1 for r in rows):
        raise ValueError('Bản xuất theo mẫu chỉ nhận dịch vụ hoàn thành trong snapshot.')
    groups = {c['code']: c.get('group') for c in catalog}
    def group_of(row):
        return groups.get(row['service_code'])
    clinical_doctors = unique(['BS MỘT', 'BS HAI', 'BS BA', 'BS BỐN', 'BS MƯỜI', 'BS NHẤT'] + [value for r in rows if (value := text(doctor(r, 'clinical')))])
    imaging_doctors = unique(['BS TƯ', 'BS NĂM', 'BS SÁU', 'BS BẢY', 'BS TÁM', 'BS CHÍN'] + [value for r in rows if group_of(r) in IMAGING and (value := text(doctor(r, 'imaging')))])
    if any(group_of(r) in IMAGING and not text(doctor(r, 'imaging')) for r in rows):
        imaging_doctors.append('Chưa rõ BS CĐHA')
    if any(not text(doctor(r, 'clinical')) for r in rows):
        clinical_doctors.append('Chưa rõ BS lâm sàng')
    count = 6 + len(imaging_doctors) + len(clinical_doctors)
    main = dict(name='CHI_TIET_THEO_MAU' if detail else 'DATA_KHOAVU', rows=[], styles=[], heights=[], merges=[],
                widths=[7, 46, 22, 15, 19, 23] + [14] * (count - 6), freeze=dict(rows=2, columns=3))
    def add(values=None, style=0, height=24):
        main['rows'].append([] if values is None else values)
        main['styles'].append(style)
        main['heights'].append(height)
        return len(main['rows'])
    def merge(row, first, last):
        if last > first:
            main['merges'].append(f'{col_name(first)}{row}:{col_name(last)}{row}')
    add(['STT', 'DỊCH VỤ', 'MÃ DỊCH VỤ', 'SỐ LƯỢNG', 'GIÁ (VND)', 'THÀNH TIỀN (VND)', 'CÔNG VIỆC BÁC SĨ CĐHA'] + [None] * (len(imaging_doctors) - 1) + ['CÔNG VIỆC BÁC SĨ LÂM SÀNG'], 1, 34)
    add([None] * 6 + imaging_doctors + clinical_doctors, 1, 36)
    for column in range(6):
        main['merges'].append(f'{col_name(column)}1:{col_name(column)}2')
    merge(1, 6, 5 + len(imaging_doctors))
    merge(1, 6 + len(imaging_doctors), count - 1)
    services = {}
    for row in rows:
        key = (row['service_code'], number(row['unit_price_vnd']))
        if key not in services:
            service = next((c for c in catalog if c['code'] == row['service_code']), {})
            services[key] = dict(code=key[0], price=key[1], name=row.get('service_name') or service.get('name') or key[0], rows=[])
        services[key]['rows'].append(row)
    # Service codes are canonical identifiers; lexicographic order matches
    # existing catalogue codes. Distinct unit prices remain distinct rows.
    sorted_services = sorted(services.values(), key=lambda s: (s['code'], s['price']))
    for index, service in enumerate(sorted_services):
        def workload(names, kind):
            eligible = [r for r in service['rows'] if kind != 'imaging' or group_of(r) in IMAGING]
            suffix = 'CĐHA' if kind == 'imaging' else 'lâm sàng'
            return [sum_quantity(r['completed_qty'] for r in eligible if (text(doctor(r, kind)) or 'Chưa rõ BS ' + suffix) == name) if eligible else None for name in names]
        add([index + 1, service['name'], service['code'], sum_quantity(r['completed_qty'] for r in service['rows']),
             service['price'], sum_money(r['completed_gross_vnd'] for r in service['rows'])] + workload(imaging_doctors, 'imaging') + workload(clinical_doctors, 'clinical'), 0, 42)
    total_row = add(['TỔNG DOANH THU TRƯỚC GIẢM'], 2, 30)
    merge(total_row, 0, 2)
    main['rows'][total_row - 1] += [None] * (count - 1)
    for column in [3, 5] + list(range(6, count)):
        values = [r[column] for r in main['rows'][2:total_row - 1] if column < len(r) and type(r[column]) in (int, float)]
        formula = f'SUM({col_name(column)}3:{col_name(column)}{total_row - 1})' if total_row > 3 else '0'
        main['rows'][total_row - 1][column] = dict(formula=formula, value=sum_money(values) if column == 5 else sum_quantity(values))
    # JavaScript sparse array holes serialize as null; explicit nulls above
    # preserve the report model and cached formula positions exactly.
    notice = add(['Công việc bác sĩ tính theo đơn vị dịch vụ, không phải số ca. CĐHA và lâm sàng là hai góc nhìn, không cộng hai nhóm cột.'], 3, 32)
    merge(notice, 0, count - 1)
    def section(title, headers, items, note=None, color=4):
        add([], 0, 12)
        heading = add([title], color, 28)
        merge(heading, 0, count - 1)
        if note:
            notice = add([note], 3, 34)
            merge(notice, 0, count - 1)
        if headers is not None:
            add(headers, 1, 32)
        if items:
            for item in items:
                add(item, 0, 32)
        else:
            empty = add(['Chưa có dữ liệu phù hợp trong phạm vi xuất.'], 3, 26)
            merge(empty, 0, count - 1)
    outbound = [r for r in rows if department(r.get('ordering_dept')) == 'VU' and department(r.get('performing_dept')) and department(r.get('performing_dept')) != 'VU']
    if not detail:
        section('CÁC CHỈ ĐỊNH KHÁC ĐÃ HOÀN THÀNH', ['TÊN BÁC SĨ', 'MÃ DỊCH VỤ', 'TÊN DỊCH VỤ', 'SỐ LƯỢNG', 'GIÁ (VND)', 'THÀNH TIỀN (VND)', 'KHOA THỰC HIỆN'],
                [[doctor(r, 'clinical'), r['service_code'], r.get('service_name'), number(r['completed_qty']), number(r['unit_price_vnd']), number(r['completed_gross_vnd']), r.get('performing_dept')] for r in outbound], 'Vú chỉ định, khoa khác làm. Các dòng này đã có trong bảng chính, không cộng lần nữa.')
        blood = [r for r in rows if r.get('specimen_type') in ['BLOOD', 'MAU']]
        section('XÉT NGHIỆM MÁU', ['STT', 'PID', 'TÊN DỊCH VỤ', 'SỐ LƯỢNG', 'GIÁ (VND)', 'THÀNH TIỀN (VND)'],
                [[i + 1, r.get('patient_id'), r.get('service_name'), number(r['completed_qty']), number(r['unit_price_vnd']), number(r['completed_gross_vnd'])] for i, r in enumerate(blood)], 'Chỉ nhận specimen_type = BLOOD / MAU. Không suy xét nghiệm máu từ tên nhóm Xét nghiệm hỗ trợ.', 5)
        upsell = [r for r in rows if department(r.get('ordering_dept')) == 'KSKTQ' and r.get('price_mode') == 'THEMNGOAIGOI']
        section('UPSALE KSKTQ', ['STT', 'DỊCH VỤ', 'SỐ LƯỢNG', 'GIÁ (VND)', 'THÀNH TIỀN (VND)', 'MÃ LƯỢT'],
                [[i + 1, r.get('service_name'), number(r['completed_qty']), number(r['unit_price_vnd']), number(r['completed_gross_vnd']), r.get('visit_id')] for i, r in enumerate(upsell)], 'Chỉ lấy dòng phát sinh ngoài gói do KSKTQ chỉ định; đã nằm trong bảng chính.', 6)
        days = sorted({business_date(r.get('completed_at')) for r in rows if group_of(r) in ['Siêu âm vú', 'Siêu âm vi mạch', 'X-quang vú']})
        daily = []
        for i, day in enumerate(days):
            own = [r for r in rows if business_date(r.get('completed_at')) == day]
            ultrasound = [r for r in own if group_of(r) in ['Siêu âm vú', 'Siêu âm vi mạch']]
            xray = [r for r in own if group_of(r) == 'X-quang vú']
            age_known = bool(xray) and all(type(r.get('patient_age')) in (int, float) and math.isfinite(r['patient_age']) for r in xray)
            daily.append([i + 1, day, len({r.get('visit_id') for r in ultrasound}), None, None, None, None,
                          len({r.get('visit_id') for r in xray}), len({r.get('visit_id') for r in xray if r['patient_age'] > 40}) if age_known else None])
        section('SIÊU ÂM TẦNG 4 VÀ TẦNG 7', ['STT', 'NGÀY', 'LƯỢT SIÊU ÂM', 'PR2', 'PR3', 'PR4', 'PR5', 'LƯỢT CHỤP XQ', 'XQ >40'], daily,
                'Lượt = distinct visit_id trong ngày. Chưa có ánh xạ tầng và PR2–PR5 nên để trống; XQ >40 chỉ tính nếu đủ patient_age.', 4)
        costs = [[i + 1, business_date(r.get('completed_at')), f"{r.get('patient_id')} / {r.get('visit_id')}", number(r['completed_gross_vnd']), known_money(r.get('drug_cost_vnd')), known_money(r.get('material_cost_vnd')), number(r['unit_price_vnd']), r.get('order_id')] for i, r in enumerate(rows)]
        section('DOANH THU VÀ CHI PHÍ DỊCH VỤ', ['STT', 'NGÀY/THÁNG/NĂM', 'PID/VISIT', 'DOANH THU TRƯỚC GIẢM', 'DƯỢC (VND)', 'VTTH (VND)', 'GIÁ (VND)', 'MÃ CHỈ ĐỊNH'], costs,
                'Mỗi dòng là một chỉ định; cùng lượt có thể có nhiều dòng. Chi phí thiếu để trống, không tự trừ chi phí thành lợi nhuận.', 5)
        visits = {}
        for row in rows:
            if group_of(row) == 'Khám vú':
                key = (doctor(row, 'clinical'), business_date(row.get('completed_at')))
                visits.setdefault(key, set()).add(row.get('visit_id'))
        section('SỐ LƯỢT KHÁM BÁC SĨ', ['TÊN BÁC SĨ', 'NGÀY/THÁNG/NĂM', 'SỐ LƯỢT KHÁM'], [[key[0], key[1], len(ids)] for key, ids in visits.items()],
                'Đếm distinct visit_id theo bác sĩ và ngày; không suy số ngày công từ số dịch vụ.', 6)
        section('CHUYÊN KHOA KHÁC', ['TÊN DỊCH VỤ', 'ĐƠN VỊ DỊCH VỤ', 'BÁC SĨ', 'ĐIỀU DƯỠNG/KỸ THUẬT VIÊN'],
                [[r.get('service_name'), number(r['completed_qty']), doctor(r, 'imaging'), r.get('technician_name') or None] for r in outbound],
                'Không có tên người thực hiện hoặc KTV thì để trống. Đã nằm trong bảng chính.')
        for title in ['SỰ CỐ', 'BỆNH NHÂN THEO DÕI', 'ĐÀO TẠO']:
            section(title, None, [], 'Nguồn tài chính hiện tại chưa cung cấp dữ liệu nghiệp vụ cho mục này.', 5)
        section('NỘI TRÚ', ['STT', 'PID', 'MÃ LƯỢT', 'DỊCH VỤ', 'SỐ LƯỢNG', 'THÀNH TIỀN (VND)'],
                [[i + 1, r.get('patient_id'), r.get('visit_id'), r.get('service_name'), number(r['completed_qty']), number(r['completed_gross_vnd'])] for i, r in enumerate([r for r in rows if r.get('encounter_type') == 'NOITRU'])],
                'Chỉ nhận encounter_type = NOITRU; không suy nội trú từ khoa chỉ định.')
    known_net = [r for r in rows if r.get('completed_net_vnd') is not None]
    missing_net = len(rows) - len(known_net)
    info_rows = [['Thuộc tính', 'Nội dung'], ['Mẫu xuất', TEMPLATE_VERSION],
                 ['Loại bản xuất', 'Chi tiết theo bộ lọc' if detail else 'Báo cáo cuối theo mẫu DATA_KHOAVU'],
                 ['Kỳ', f"{meta.get('from') or 'Chưa có'} → trước {meta.get('toExclusive') or 'Chưa có'} · Asia/Ho_Chi_Minh"],
                 ['Phạm vi', meta.get('scope') or 'Dịch vụ hoàn thành của nguồn đang xem'], ['Bộ lọc', meta.get('filter') or 'Tất cả'],
                 ['Snapshot', meta.get('id') or None], ['SHA-256 snapshot', meta.get('sha256') or None],
                 ['Trạng thái', meta.get('status') or 'Dữ liệu đã tính, chưa phải phê duyệt bệnh viện'],
                 ['Tổng trước giảm VND', sum_money(r['completed_gross_vnd'] for r in rows)],
                 ['Sau giảm / phân bổ đã biết VND', sum_money(r['completed_net_vnd'] for r in known_net)],
                 ['Dòng thiếu sau giảm / phân bổ', missing_net],
                 ['Lưu ý tiền', 'Thành tiền ở sheet đầu là trước giảm, không phải thực thu. Phân bổ gói nằm trong sau giảm đã biết. Không cộng các khối chi tiết vào tổng đầu.'],
                 ['Lưu ý bác sĩ', 'Hai nhóm công việc độc lập, đơn vị = completed_qty. Cột chưa rõ giữ số lượng chưa có bác sĩ.'],
                 ['Mức giá', 'Tách dòng theo mã dịch vụ + đơn giá thực tế; không lấy giá danh mục để tính thay.'],
                 ['Các ô trống', 'Thiếu dữ liệu hoặc không áp dụng; khác với số 0.'],
                 ['Cập nhật Excel', 'Tổng bảng đầu dùng SUM. Các khối khác là bản chụp dữ liệu, không tự cập nhật khi sửa bảng.']]
    headers = ['Mã chỉ định', 'Mã BN', 'Mã lượt', 'Mã dịch vụ', 'Tên dịch vụ', 'Nhóm', 'Ngày hoàn thành', 'Số lượng hoàn thành', 'Đơn giá VND', 'Thành tiền trước giảm VND', 'Sau giảm / phân bổ VND', 'Chế độ giá', 'Khoa chỉ định', 'Khoa thực hiện', 'BS CĐHA / thực hiện', 'BS lâm sàng / chỉ định', 'File nguồn', 'Sheet nguồn', 'Dòng nguồn', 'SHA-256 file', 'Dược VND', 'VTTH VND']
    evidence = [[r.get('order_id'), r.get('patient_id'), r.get('visit_id'), r['service_code'], r.get('service_name'), group_of(r), r.get('completed_at'), number(r['completed_qty']), number(r['unit_price_vnd']), number(r['completed_gross_vnd']), None if r.get('completed_net_vnd') is None else number(r['completed_net_vnd']), r.get('price_mode'), r.get('ordering_dept'), r.get('performing_dept'), doctor(r, 'imaging'), doctor(r, 'clinical'), r.get('source_file') or None, r.get('source_sheet') or None, r.get('source_row'), r.get('source_file_hash') or None, known_money(r.get('drug_cost_vnd')), known_money(r.get('material_cost_vnd'))] for r in rows]
    trace_sheet = dict(name='CHI_TIET_NGUON', rows=[headers] + evidence, styles=[1] + [0] * len(evidence), heights=[36] + [32] * len(evidence), merges=[], widths=[46 if i in [4, 16, 19] else 30 if i == 2 else 23 for i in range(len(headers))], freeze=dict(rows=1, columns=3), autoFilter=f'A1:V{len(evidence) + 1}')
    info_rows.extend(['CHỜ KHOA XÁC NHẬN · ' + name, note] for name, note in PENDING_RULES)
    info = dict(name='THONG_TIN', rows=info_rows, styles=[1] + [0] * (len(info_rows) - 1), heights=[28] + [42] * (len(info_rows) - 1), merges=[], widths=[40, 120], freeze=dict(rows=1, columns=0))
    extra = []
    if service_revenue:
        data = [['Dịch vụ', 'Nhóm giá', 'Đơn giá VND', 'SL thực hiện', 'Doanh thu VND', 'Căn cứ đơn giá']]
        data += [[r['name'], BILLING_NAMES[r['type']], r['price'], r['qty'], r['revenue'], r['basis']] for r in service_revenue['lines']]
        data += [['TỔNG PHẦN ĐỦ GIÁ', None, None, None, service_revenue['knownRevenue']], ['DÒNG CHƯA ĐỦ GIÁ / PHÂN LOẠI', service_revenue['missingRecords']], ['Lưu ý', 'Giá và số lượng tại thời điểm chốt; không cộng thêm tổng trước giảm hoặc giá gói cha.']]
        extra.append(dict(name='GIA_X_SO_LUONG', rows=data, styles=[1] + [0] * (len(data) - 1), heights=[36] * len(data), merges=[], widths=[50, 28, 23, 20, 25, 48], freeze=dict(rows=1, columns=0)))
        missing = [[r.get('source_file'), r.get('source_row'), r.get('service_name'), 'Thiếu sau giảm / phân bổ'] for r in rows if r.get('completed_net_vnd') is None]
        quality = [['Nguồn', 'Dòng', 'Dịch vụ / nội dung', 'Cần xử lý']] + missing + [[None, None, r['name'] + ' / ' + BILLING_NAMES[r['type']], r['basis']] for r in service_revenue['lines'] if r['revenue'] is None] + [[None, None, name, note] for name, note in PENDING_RULES]
        extra.append(dict(name='KIEM_LOI', rows=quality, styles=[1] + [0] * (len(quality) - 1), heights=[48] * len(quality), merges=[], widths=[40, 12, 50, 100], freeze=dict(rows=1, columns=0)))
    all_revenue=options.get('allRevenue')
    if all_revenue:
        def add_all_sheet(name,header,records,widths):
            data=[header]+records
            extra.append(dict(name=name,rows=data,styles=[1]+[0]*(len(data)-1),heights=[36]*len(data),merges=[],widths=widths,freeze=dict(rows=1,columns=0)))
        for key,name in [('byOrdering','DT_KHOA_CHI_DINH'),('byPerforming','DT_KHOA_THUC_HIEN'),('byBilling','DT_NHOM_GIA')]:
            add_all_sheet(name,['Khoa / nhóm','Dòng dịch vụ','Số lượng','Doanh thu đủ giá VND','Dòng chưa đủ giá'],[[r['label'],r['records'],r['qty'],r['knownRevenue'],r['missingRecords']] for r in all_revenue[key]]+[['TỔNG PHẦN ĐỦ GIÁ',None,None,all_revenue['revenue']['knownRevenue']],['Không cộng các sheet khoa với nhau; cùng nguồn dịch vụ.'],['Dòng chưa xác định khoa, chưa cộng',all_revenue['pendingRecords']]],[55,22,22,30,25])
        add_all_sheet('DT_TAT_CA_DICH_VU',['Mã dịch vụ','Dịch vụ','Nhóm giá','Đơn giá VND','Số lượng','Doanh thu VND','Căn cứ'],[[r['code'],r['name'],BILLING_NAMES[r['type']],r['price'],r['qty'],r['revenue'],r['basis']] for r in all_revenue['revenue']['lines']],[25,65,28,24,20,28,45])
    return dict(version=TEMPLATE_VERSION, sheets=[main, trace_sheet, info] + extra, mainTotalRow=total_row,
                summary=dict(rows=len(rows), service_price_rows=len(sorted_services), gross=sum_money(r['completed_gross_vnd'] for r in rows), known_net=sum_money(r['completed_net_vnd'] for r in known_net), missing_net=missing_net), meta=meta)


def xml(value):
    value = '' if value is None else str(value)
    return escape(re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', value), {'"': '&quot;'})


def xml_number(value):
    if not math.isfinite(value):
        raise ValueError('Giá trị Excel không hợp lệ.')
    return str(int(value)) if value == int(value) else str(value)


def sheet_xml(sheet):
    columns = len(sheet['widths'])
    pane = ''
    if sheet.get('freeze'):
        freeze = sheet['freeze']
        active = 'bottomRight' if freeze['columns'] else 'bottomLeft'
        pane = f'<pane xSplit="{freeze["columns"]}" ySplit="{freeze["rows"]}" topLeftCell="{col_name(freeze["columns"])}{freeze["rows"] + 1}" activePane="{active}" state="frozen"/>'
    data = []
    for ri, row in enumerate(sheet['rows']):
        cells = []
        style = sheet['styles'][ri] or 0
        for ci in range(columns):
            value = row[ci] if ci < len(row) else None
            ref = col_name(ci) + str(ri + 1)
            prefix = f'<c r="{ref}"'
            numeric_style = 7 if style == 2 else 8
            if value is None:
                cell = f'{prefix} s="{style}"/>'
            elif isinstance(value, dict) and value.get('formula'):
                cell = f'{prefix} s="{numeric_style}"><f>{xml(value["formula"])}</f><v>{xml_number(value["value"])}</v></c>'
            elif type(value) in (int, float):
                cell = f'{prefix} s="{numeric_style}"><v>{xml_number(value)}</v></c>'
            else:
                if len(str(value).encode('utf-16-le')) // 2 > 32767:
                    raise ValueError('Ô dữ liệu vượt giới hạn Excel 32.767 ký tự.')
                cell = f'{prefix} s="{style}" t="inlineStr"><is><t xml:space="preserve">{xml(value)}</t></is></c>'
            cells.append(cell)
        data.append(f'<row r="{ri + 1}" ht="{sheet["heights"][ri] or 24}" customHeight="1">' + ''.join(cells) + '</row>')
    cols = ''.join(f'<col min="{i + 1}" max="{i + 1}" width="{w}" customWidth="1"/>' for i, w in enumerate(sheet['widths']))
    filters = f'<autoFilter ref="{sheet["autoFilter"]}"/>' if sheet.get('autoFilter') else ''
    merges = f'<mergeCells count="{len(sheet["merges"])}">' + ''.join(f'<mergeCell ref="{ref}"/>' for ref in sheet['merges']) + '</mergeCells>' if sheet['merges'] else ''
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + f'<dimension ref="A1:{col_name(columns - 1)}{len(sheet["rows"])}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0">{pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="24"/><cols>{cols}</cols><sheetData>' + ''.join(data) + f'</sheetData>{filters}{merges}<printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="8"/></worksheet>'


def template_workbook(options):
    report = template_report(options)
    memory = io.BytesIO()
    namespace = 'http://schemas.openxmlformats.org/'
    types = '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    types += ''.join(f'<Override PartName="/xl/worksheets/sheet{i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(len(report['sheets']))) + '</Types>'
    workbook = '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="' + namespace + 'spreadsheetml/2006/main" xmlns:r="' + namespace + 'officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>'
    workbook += ''.join(f'<sheet name="{xml(s["name"])}" sheetId="{i + 1}" r:id="rId{i + 1}"/>' for i, s in enumerate(report['sheets'])) + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'
    relationships = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    relationships += ''.join(f'<Relationship Id="rId{i + 1}" Type="{namespace}officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i + 1}.xml"/>' for i in range(len(report['sheets'])))
    relationships += f'<Relationship Id="rId{len(report["sheets"]) + 1}" Type="{namespace}officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    with zipfile.ZipFile(memory, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('[Content_Types].xml', types)
        archive.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + namespace + 'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        archive.writestr('xl/workbook.xml', workbook)
        archive.writestr('xl/_rels/workbook.xml.rels', relationships)
        archive.writestr('xl/styles.xml', Path(__file__).with_name('workbook_styles.xml').read_bytes())
        for i, sheet in enumerate(report['sheets']):
            archive.writestr(f'xl/worksheets/sheet{i + 1}.xml', sheet_xml(sheet))
    return report, memory.getvalue()
