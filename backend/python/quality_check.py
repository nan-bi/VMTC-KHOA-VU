"""Compare local classifications and exact prices with independently reviewed rows.

Never train from this evaluation file. A passing subset is not a passing dataset.
"""
from collections import defaultdict
from decimal import Decimal
from classification import ROUTES, train_model, predict, validate_config
from revenue_engine import calculate
from data_rules import integer, number


def source_key(row):
    return (row.get('source_file'), row.get('source_sheet') or 'CANONICAL', str(row.get('source_row')))


def evaluate_quality(rows, standards, config=None, blocked_count=0):
    config = config or {}
    validate_config(config)
    if not isinstance(standards, list) or not standards or len(standards) > 100000:
        raise ValueError('Bảng chuẩn cần từ 1 đến 100.000 dòng đã xác nhận.')
    if not integer(blocked_count) or number(blocked_count) < 0:
        raise ValueError('Số dòng lỗi chưa hợp lệ.')
    actual = defaultdict(list)
    for row in rows:
        actual[source_key(row)].append(row)
    expected, seen = [], set()
    for item in standards:
        if (not isinstance(item, dict) or not isinstance(item.get('source_file'), str)
                or not item['source_file'].strip() or not integer(item.get('source_row'))
                or number(item['source_row']) < 1 or item.get('expected_route') not in ROUTES
                or not isinstance(item.get('expected_service_code'), str) or not item['expected_service_code'].strip()
                or not integer(item.get('expected_revenue_vnd')) or number(item['expected_revenue_vnd']) < 0):
            raise ValueError('Bảng chuẩn cần nguồn file/sheet/dòng, expected_route, expected_service_code và expected_revenue_vnd nguyên VND không âm.')
        key = source_key(item)
        if key in seen:
            raise ValueError('Bảng chuẩn trùng file/sheet/dòng; cần đối soát trước.')
        seen.add(key)
        expected.append(item)
    model = train_model(config.get('routingExamples'))
    errors, matched, classification_errors, unavailable = [], 0, 0, 0
    absolute_error, reference_total = 0, 0
    for item in expected:
        candidates = actual.get(source_key(item), [])
        expected_revenue = int(Decimal(str(item['expected_revenue_vnd'])))
        reference_total += abs(expected_revenue)
        reasons, label, revenue = [], None, None
        if len(candidates) != 1:
            reasons.append('Không tìm thấy dòng nguồn duy nhất')
        else:
            matched += 1
            row = candidates[0]
            result = predict(row, model)
            label = result['label']
            if row.get('service_code') != item['expected_service_code']:
                reasons.append('Khác mã dịch vụ chuẩn')
            if label is not None:
                if result['included']:
                    calculated = calculate([row], config)
                    revenue = None if calculated['missingRecords'] else calculated['knownRevenue']
                else:
                    revenue = 0
        if label != item['expected_route']:
            reasons.append('Khác nhãn luồng chuẩn hoặc chưa xác nhận')
        if reasons:
            classification_errors += 1
        if revenue is None:
            unavailable += 1
            reasons.append('Chưa xác định doanh thu')
        else:
            absolute_error += abs(revenue - expected_revenue)
            if revenue != expected_revenue:
                reasons.append('Khác doanh thu chuẩn')
        if reasons:
            errors.append(dict(source_file=item['source_file'], source_sheet=item.get('source_sheet') or 'CANONICAL',
                               source_row=item['source_row'], expected_route=item['expected_route'], actual_route=label,
                               expected_revenue_vnd=expected_revenue, actual_revenue_vnd=revenue, reasons=reasons))
    extra = sum(len(values) for key, values in actual.items() if key not in seen)
    complete = not extra and not unavailable and matched == len(expected) and not blocked_count
    class_rate = Decimal(classification_errors) * 100 / len(expected)
    financial_rate = (Decimal(absolute_error) * 100 / reference_total if reference_total else
                      Decimal(0) if not absolute_error else None)
    passed = complete and class_rate < Decimal('0.05') and financial_rate is not None and financial_rate < Decimal('0.05')
    return dict(targetPercent=0.05, passed=passed, complete=complete, expectedRows=len(expected),
                matchedRows=matched, extraRows=extra, blockedRows=blocked_count, classificationErrors=classification_errors,
                classificationErrorPercent=float(class_rate), absoluteRevenueErrorVnd=absolute_error,
                revenueErrorPercent=float(financial_rate) if financial_rate is not None and not unavailable else None,
                unavailableRevenueRows=unavailable, errors=errors)
