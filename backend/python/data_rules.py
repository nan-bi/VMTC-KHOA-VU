"""Shared financial validation, source integrity and Vietnam business dates.

These functions are the server authority. Browser validation remains a preview;
neither Python nor the browser fills missing discounts or package allocations.
All money is integer VND and quantities use six-place integer arithmetic.
"""
import json
import math
import re
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from revenue_engine import (numeric, integer, safe, scaled_quantity, sum_quantity,
                            gross_amount, MAX_SAFE)

PROVENANCE = {'source_file', 'source_sheet', 'source_row', 'source_file_hash',
              'file_hash', 'source_hash', 'ingested_at'}
AMOUNTS = {'quantity', 'completed_qty', 'unit_price_vnd', 'completed_gross_vnd',
           'completed_net_vnd', 'discount_vnd', 'discount_known', 'in_snapshot',
           'package_allocation_vnd', 'gross_order_vnd', 'net_order_vnd', 'revision',
           'is_synthetic'}
EDIT_FIELDS = ['patient_name', 'patient_dob', 'patient_age', 'service_code', 'service_name', 'ordered_at', 'completed_at',
               'status', 'quantity', 'completed_qty', 'unit_price_vnd',
               'discount_known', 'discount_vnd', 'price_mode', 'package_id',
               'package_allocation_vnd', 'ordering_dept', 'performing_dept',
               'performing_room', 'imaging_doctor', 'clinical_doctor',
               'ordering_doctor_name', 'performing_doctor_name', 'drug_cost_vnd',
               'material_cost_vnd', 'in_snapshot', 'encounter_type', 'location',
               'result_returned_at', 'birads']
NUMERIC_FIELDS = {'patient_age', 'quantity', 'completed_qty', 'unit_price_vnd', 'discount_known',
                  'discount_vnd', 'package_allocation_vnd', 'in_snapshot',
                  'drug_cost_vnd', 'material_cost_vnd', 'birads'}


def number(value):
    """JS Number-compatible conversion for already checked source quantities."""
    if value is None or value == '':
        return 0
    try:
        return float(value)
    except (ValueError, TypeError):
        return float('nan')


def json_text(value):
    # Compact Unicode encoding is also used to preserve compound group keys.
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)


def identifier(value):
    return isinstance(value, str) and 0 < len(value) <= 160 and value == value.strip()


def is_date_only(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        return False
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def is_timestamp(value):
    if is_date_only(value):
        return True
    if not isinstance(value, str):
        return False
    match = re.fullmatch(r'(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})', value)
    if not match or not is_date_only(match[1]):
        return False
    if int(match[2]) >= 24 or int(match[3]) >= 60 or int(match[4] or 0) >= 60:
        return False
    zone = match[5]
    if zone != 'Z':
        hour, minute = int(zone[1:3]), int(zone[4:6])
        if hour > 14 or minute >= 60 or (hour == 14 and minute != 0):
            return False
    try:
        datetime.fromisoformat(value.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False


def instant(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=timezone.utc) if is_date_only(value) else datetime.fromisoformat(value.replace('Z', '+00:00'))


def business_date(value):
    if not is_timestamp(value):
        return None
    if is_date_only(value):
        return value
    return instant(value).astimezone(timezone(timedelta(hours=7))).date().isoformat()


def normalize_date(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if not math.isfinite(value) or value < 1 or value > 2958465:
            return None
        milliseconds = math.floor((value - 25569) * 86400000 + .5)
        try:
            stamp = datetime(1970, 1, 1) + timedelta(milliseconds=milliseconds)
            return stamp.isoformat(timespec='milliseconds') + '+07:00'
        except OverflowError:
            return None
    return value


def sum_money(values):
    total = 0
    for value in values:
        if not integer(value):
            raise ValueError('Giá trị tiền không hợp lệ.')
        total += int(Decimal(str(value)))
    return safe(total)


def signature(row):
    values = []
    for key in sorted(set(row) - PROVENANCE):
        value = row[key]
        if key in AMOUNTS and numeric(value):
            n = Decimal(str(value))
            value = int(n) if n == n.to_integral_value() else float(n)
        values.append([key, value])
    return json_text(values)


def validate(rows, catalog, suspected_duplicates=False):
    """Keep first identical row, quarantine every conflicting key and visit.

    Returned indices always address the supplied array, even when some rows
    are invalid. A conflicting group is never resolved by file order.
    """
    codes = {item['code'] for item in catalog}
    entries = [dict(row=row, index=i, reasons=[]) for i, row in enumerate(rows)]
    groups, visit_patients = {}, {}
    valid, issues, duplicates = [], [], []
    for entry in entries:
        row, errors = entry['row'], entry['reasons']
        if not isinstance(row, dict):
            errors.append('Dòng dữ liệu không hợp lệ')
            continue
        for key in ['order_id', 'patient_id', 'visit_id']:
            if not identifier(row.get(key)):
                errors.append(f'Mã {key} phải là chuỗi không trống; giữ số 0 đầu')
        if row.get('service_code') not in codes:
            errors.append('Mã dịch vụ chưa có trong danh mục')
        if not numeric(row.get('quantity')) or not 0 < number(row.get('quantity')) <= 1e9:
            errors.append('Số lượng phải lớn hơn 0 và trong giới hạn')
        try:
            scaled_quantity(row.get('quantity'))
        except ValueError:
            errors.append('Số lượng hỗ trợ tối đa 6 chữ số thập phân.')
        if not integer(row.get('unit_price_vnd')) or number(row.get('unit_price_vnd')) < 0:
            errors.append('Đơn giá phải là số nguyên VND hợp lệ')
        if not is_timestamp(row.get('ordered_at')):
            errors.append('Ngày chỉ định phải là ISO hợp lệ và có múi giờ nếu có giờ')
        if row.get('status') not in ['HOANTHANH', 'HUY', 'CHODUYET', 'CHOTHUCHIEN']:
            errors.append('Trạng thái chưa được hỗ trợ')
        for key in ['in_snapshot', 'discount_known']:
            value = row.get(key)
            if isinstance(value, bool) or value not in [0, 1, '0', '1']:
                errors.append(f'{key} bắt buộc là 0 hoặc 1')
        if row.get('price_mode') not in ['MUALE', 'THEMNGOAIGOI', 'TRONGGOI']:
            errors.append('price_mode chưa hợp lệ')
        discount = row.get('discount_vnd')
        if discount is not None and (not integer(discount) or number(discount) < 0):
            errors.append('Giảm giá không hợp lệ')
        if row.get('status') == 'HOANTHANH':
            if not is_timestamp(row.get('completed_at')):
                errors.append('Thiếu ngày hoàn thành hợp lệ')
            if is_timestamp(row.get('ordered_at')) and is_timestamp(row.get('completed_at')) and instant(row['completed_at']) < instant(row['ordered_at']):
                errors.append('Hoàn thành trước chỉ định')
            quantity = row.get('completed_qty')
            if not numeric(quantity) or not 0 < number(quantity) <= number(row.get('quantity')):
                errors.append('Số lượng hoàn thành không hợp lệ')
            try:
                if not integer(row.get('completed_gross_vnd')) or number(row.get('completed_gross_vnd')) != gross_amount(quantity, row.get('unit_price_vnd')):
                    errors.append('Thành tiền không khớp số lượng hoàn thành × đơn giá')
            except ValueError:
                errors.append('Không tính được thành tiền an toàn')
            net = row.get('completed_net_vnd')
            if net is not None and (not integer(net) or not 0 <= number(net) <= number(row.get('completed_gross_vnd'))):
                errors.append('Giá trị sau giảm nằm ngoài khoảng hợp lệ')
            known = number(row.get('discount_known'))
            if known == 0 and net is not None:
                errors.append('Chưa biết giảm giá nhưng đã có giá trị sau giảm')
            if known == 1 and net is not None:
                if row.get('price_mode') == 'TRONGGOI':
                    if not identifier(row.get('package_id')) or not integer(row.get('package_allocation_vnd')) or number(net) != number(row.get('package_allocation_vnd')):
                        errors.append('Giá trị gói phải khớp phân bổ và có mã gói')
                elif not integer(discount) or number(net) != number(row.get('completed_gross_vnd')) - number(discount):
                    errors.append('Sau giảm không khớp trước giảm trừ giảm giá')
        elif ((row.get('completed_qty') is not None and (not numeric(row['completed_qty']) or number(row['completed_qty']) != 0)) or
              (row.get('completed_gross_vnd') is not None and number(row['completed_gross_vnd']) != 0) or row.get('completed_net_vnd') is not None):
            errors.append('Chưa hoàn thành nhưng có sản lượng hoặc giá trị hoàn thành')
        if identifier(row.get('order_id')):
            groups.setdefault(row['order_id'], []).append(entry)
        if identifier(row.get('visit_id')) and identifier(row.get('patient_id')):
            visit_patients.setdefault(row['visit_id'], set()).add(row['patient_id'])
    for group in groups.values():
        if len({signature(e['row']) for e in group}) > 1:
            for entry in group:
                entry['reasons'].append('Trùng mã chỉ định nhưng khác nội dung; cách ly toàn bộ nhóm')
    events = {}
    for entry in entries:
        row = entry['row']
        if not isinstance(row, dict) or not identifier(row.get('patient_id')) or not identifier(row.get('visit_id')) or not is_timestamp(row.get('ordered_at')):
            continue
        key = json_text([row.get(k) for k in ['patient_id', 'visit_id', 'service_code', 'ordered_at']])
        events.setdefault(key, []).append(entry)
    if suspected_duplicates:
        for group in events.values():
            if len({e['row'].get('order_id') for e in group}) > 1:
                for entry in group:
                    entry['reasons'].append('Nghi trùng dịch vụ cùng bệnh nhân/lượt/thời điểm nhưng khác khóa; đối soát trước khi tính')
    accepted = set()
    for entry in entries:
        row, errors = entry['row'], entry['reasons']
        if isinstance(row, dict) and len(visit_patients.get(row.get('visit_id'), set())) > 1:
            errors.append('Một lượt khám bị gán cho nhiều bệnh nhân')
        if errors:
            issues.append(dict(key=f"{(row or {}).get('order_id') or 'row'}-{entry['index']}" if isinstance(row, dict) else f"row-{entry['index']}", **entry))
            continue
        if row['order_id'] in accepted:
            duplicates.append(dict(row=row, index=entry['index']))
        else:
            accepted.add(row['order_id'])
            valid.append(row)
    try:
        completed = [r for r in valid if r.get('status') == 'HOANTHANH']
        sum_money(r.get('completed_gross_vnd') for r in completed)
        sum_money(r['completed_net_vnd'] for r in completed if r.get('completed_net_vnd') is not None)
        sum_quantity(r.get('completed_qty') for r in completed)
    except ValueError as error:
        for row in valid:
            issues.append(dict(key='overflow-' + row['order_id'], row=row, index=rows.index(row), reasons=[str(error)]))
        valid = []
    return dict(valid=valid, issues=issues, duplicates=duplicates)


def aggregate(rows, catalog, start, end):
    if not is_date_only(start) or not is_date_only(end) or start >= end:
        raise ValueError('Khoảng ngày báo cáo không hợp lệ.')
    def in_range(value):
        day = business_date(value)
        return day is not None and start <= day < end
    completed = [r for r in rows if r.get('status') == 'HOANTHANH' and in_range(r.get('completed_at')) and number(r.get('in_snapshot')) == 1]
    ordered = [r for r in rows if in_range(r.get('ordered_at'))]
    by_code = {}
    for row in completed:
        by_code.setdefault(row.get('service_code'), []).append(row)
    table = []
    for service in catalog:
        matched = by_code.get(service['code'], [])
        table.append(dict(service, qty=sum_quantity(r['completed_qty'] for r in matched),
                          gross=sum_money(r['completed_gross_vnd'] for r in matched),
                          net=sum_money(r['completed_net_vnd'] for r in matched if r.get('completed_net_vnd') is not None),
                          missing=sum(r.get('completed_net_vnd') is None for r in matched), rows=matched))
    return dict(table=table, completed=completed, ordered=ordered,
                qty=sum_quantity(r['qty'] for r in table), gross=sum_money(r['gross'] for r in table),
                net=sum_money(r['net'] for r in table), missing=sum(r['missing'] for r in table),
                patients=len({r.get('patient_id') for r in ordered}), visits=len({r.get('visit_id') for r in ordered}),
                late=sum(r.get('status') == 'HOANTHANH' and in_range(r.get('completed_at')) and number(r.get('in_snapshot')) != 1 for r in rows))


def edited_row(before, patch, catalog):
    for key in patch:
        if key not in EDIT_FIELDS:
            raise ValueError(f'Không sửa trực tiếp cột {key}; giữ liên kết mã và nguồn gốc.')
    row = dict(before)
    for key, value in patch.items():
        row[key] = (None if value is None or value == '' else value) if key in NUMERIC_FIELDS else (value.strip() or None if isinstance(value, str) else value)
    def changed(key):
        return row.get(key) != before.get(key)
    if changed('service_code'):
        service = next((c for c in catalog if c['code'] == row['service_code']), None)
        if not service:
            raise ValueError('Mã dịch vụ chưa có trong danh mục.')
        row.update(service_name=service['name'], group=service['group'])
    if changed('quantity') or changed('unit_price_vnd'):
        row['gross_order_vnd'] = gross_amount(row.get('quantity'), row.get('unit_price_vnd'))
    finance_changed = any(changed(k) for k in ['quantity', 'unit_price_vnd', 'completed_qty', 'status', 'discount_known', 'discount_vnd', 'price_mode', 'package_id', 'package_allocation_vnd'])
    if finance_changed:
        if row.get('status') == 'HOANTHANH':
            row['completed_gross_vnd'] = gross_amount(row.get('completed_qty'), row.get('unit_price_vnd'))
            if number(row.get('discount_known')) != 1:
                row['completed_net_vnd'] = None
            elif row.get('price_mode') == 'TRONGGOI':
                row['completed_net_vnd'] = int(Decimal(str(row['package_allocation_vnd']))) if integer(row.get('package_allocation_vnd')) else None
            else:
                row['completed_net_vnd'] = row['completed_gross_vnd'] - int(Decimal(str(row['discount_vnd']))) if integer(row.get('discount_vnd')) else None
        else:
            row.update(completed_qty=0, completed_at=None, completed_gross_vnd=0, completed_net_vnd=None)
        if number(row.get('discount_known')) != 1 or row.get('gross_order_vnd') is None:
            row['net_order_vnd'] = None
        elif row.get('price_mode') == 'TRONGGOI':
            row['net_order_vnd'] = int(Decimal(str(row['package_allocation_vnd']))) if integer(row.get('package_allocation_vnd')) else None
        else:
            row['net_order_vnd'] = number(row['gross_order_vnd']) - number(row['discount_vnd']) if integer(row.get('discount_vnd')) else None
    if changed('completed_at'):
        row['completed_week'] = None
    if changed('ordered_at'):
        row['ordered_week'] = None
    if row.get('patient_age') is not None and (not integer(row['patient_age']) or not 0 <= number(row['patient_age']) <= 130):
        raise ValueError('Tuổi phải là số nguyên từ 0 đến 130 hoặc để trống.')
    if row.get('birads') is not None and number(row['birads']) not in range(7):
        raise ValueError('BI-RADS phải là giá trị cấu trúc 0–6 hoặc để trống.')
    for field in ['drug_cost_vnd', 'material_cost_vnd']:
        if row.get(field) is not None and (not integer(row[field]) or number(row[field]) < 0):
            raise ValueError('Chi phí phải là số nguyên VND không âm hoặc để trống.')
    return row
