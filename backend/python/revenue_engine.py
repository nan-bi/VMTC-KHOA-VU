"""Local price/quantity engine. Standard library only; no database or network."""
import json
import math
import re
import sys
import time
from decimal import Decimal, InvalidOperation

MAX_SAFE = 9007199254740991
SCALE = 1000000
KINDS = {'EXAM': 'Khám', 'US': 'Siêu âm vú', 'XR2': 'X-quang vú 2D',
         'XR3': 'X-quang vú 3D', 'OTHER': 'Dịch vụ khác'}
DEFAULT_KINDS = {'SYN-DV001': 'EXAM', 'SYN-DV002': 'EXAM', 'SYN-DV005': 'XR2',
                 'SYN-DV006': 'XR3', **{'SYN-DV' + x: 'US' for x in ['008', '009', '010', '011']}}
BILLING_TYPES = {'SKTQ', 'SLUT1', 'SLUT2', 'OTHER', 'UNKNOWN', 'RETAIL'}


def numeric(value):
    if isinstance(value, bool) or value is None:
        return False
    if isinstance(value, (int, float)):
        return math.isfinite(value)
    return isinstance(value, str) and re.fullmatch(r'-?\d+(?:\.\d{1,6})?', value) is not None


def integer(value):
    if not numeric(value):
        return False
    number = Decimal(str(value))
    return number == number.to_integral_value() and abs(number) <= MAX_SAFE


def safe(value):
    if abs(value) > MAX_SAFE:
        raise ValueError('Tổng vượt giới hạn số nguyên an toàn; không được phát hành báo cáo.')
    return int(value)


def scaled_quantity(value):
    if not numeric(value) or abs(Decimal(str(value))) > 1000000000:
        raise ValueError('Số lượng không hợp lệ hoặc vượt giới hạn.')
    number = Decimal(str(value))
    if number * SCALE != (number * SCALE).to_integral_value():
        raise ValueError('Số lượng hỗ trợ tối đa 6 chữ số thập phân.')
    return int(number * SCALE)


def sum_quantity(values):
    total = safe(sum(scaled_quantity(value) for value in values))
    return total // SCALE if total % SCALE == 0 else total / SCALE


def gross_amount(quantity, price):
    if not integer(price) or Decimal(str(price)) < 0:
        raise ValueError('Đơn giá phải là số nguyên VND an toàn.')
    scaled = scaled_quantity(quantity)
    if scaled < 0:
        raise ValueError('Số lượng không được âm.')
    return safe((scaled * int(Decimal(str(price))) + SCALE // 2) // SCALE)


def kind_of(row, config):
    return config.get('serviceKinds', DEFAULT_KINDS).get(row['service_code'], 'OTHER')


def billing_type(row, config):
    mode, package = row.get('price_mode'), row.get('package_id')
    if mode == 'THEMNGOAIGOI' or (mode == 'MUALE' and not package):
        return 'RETAIL'
    if mode != 'TRONGGOI' or not package:
        return 'UNKNOWN'
    group = config.get('packageTypes', {}).get(package)
    if group not in {'SKTQ', 'SLUT1', 'SLUT2', 'OTHER'}:
        return 'UNKNOWN'
    if group == 'SLUT1' and kind_of(row, config) not in {'EXAM', 'US'}:
        return 'UNKNOWN'
    return group


def applied_rate(row, group, config):
    if group == 'UNKNOWN':
        return None, 'Chờ phân loại gói'
    configured = config.get('rates', {}).get(row['service_code'], {}).get(group)
    if configured is not None:
        if not integer(configured) or Decimal(str(configured)) < 0:
            raise ValueError('Đơn giá cấu hình không hợp lệ.')
        return int(Decimal(str(configured))), 'Đơn giá cấu hình'
    if group == 'RETAIL':
        price = row.get('unit_price_vnd')
        return (int(Decimal(str(price))), 'Đơn giá nguồn') if integer(price) else (None, 'Thiếu đơn giá')
    allocation = row.get('package_allocation_vnd')
    if allocation is None or not integer(allocation):
        return None, 'Thiếu giá/phân bổ gói'
    quantity = scaled_quantity(row['completed_qty'])
    amount = int(Decimal(str(allocation))) * SCALE
    if quantity <= 0 or amount % quantity:
        return None, 'Phân bổ chưa xác định được đơn giá nguyên VND'
    return safe(amount // quantity), 'Phân bổ nguồn / số lượng'


def calculate(rows, config=None):
    config = config or {}
    groups = {}
    for row in rows:
        if row.get('status') != 'HOANTHANH' or str(row.get('in_snapshot')) not in {'1', '1.0'}:
            continue
        group = billing_type(row, config)
        price, basis = applied_rate(row, group, config)
        key = json.dumps([row['service_code'], group, price, basis], ensure_ascii=False, separators=(',', ':'))
        if key not in groups:
            groups[key] = dict(key=key, code=row['service_code'], name=row['service_name'],
                               kind=kind_of(row, config), type=group, price=price, basis=basis,
                               quantities=[], amounts=[], recordCount=0)
        groups[key]['quantities'].append(row['completed_qty'])
        if price is not None:
            groups[key]['amounts'].append(gross_amount(row['completed_qty'], price))
        groups[key]['recordCount'] += 1
    lines = []
    for group in groups.values():
        quantity = sum_quantity(group.pop('quantities'))
        amounts = group.pop('amounts')
        lines.append(dict(group, qty=quantity, revenue=None if group['price'] is None
                          else safe(sum(amounts))))
    totals = []
    for kind, label in KINDS.items():
        matched = [row for row in lines if row['kind'] == kind]
        if kind == 'OTHER' and not matched:
            continue
        missing = [row for row in matched if row['revenue'] is None]
        totals.append(dict(kind=kind, label=label, qty=sum_quantity(row['qty'] for row in matched),
                           knownRevenue=safe(sum(row['revenue'] for row in matched if row['revenue'] is not None)),
                           missingQty=sum_quantity(row['qty'] for row in missing),
                           missingRecords=sum(row['recordCount'] for row in missing)))
    return dict(rulesVersion='PRICE-QTY-2', lines=lines, totals=totals,
                knownRevenue=safe(sum(row['knownRevenue'] for row in totals)),
                missingQty=sum_quantity(row['missingQty'] for row in totals),
                missingRecords=sum(row['missingRecords'] for row in totals))


def main():
    # JSON stdin/stdout keeps data off command lines and disk. No PHI is logged.
    try:
        payload = json.load(sys.stdin)
        started = time.perf_counter()
        value = calculate(payload['rows'], payload.get('config'))
        result = {'ok': True, 'value': value, 'computeMs': round((time.perf_counter() - started) * 1000, 3)}
    except (ValueError, TypeError, KeyError, InvalidOperation, OverflowError):
        result = {'ok': False, 'error': 'Dữ liệu tính Python không hợp lệ hoặc vượt giới hạn.'}
    sys.stdout.write(json.dumps(result, ensure_ascii=False, separators=(',', ':'), allow_nan=False))


if __name__ == '__main__':
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    main()
