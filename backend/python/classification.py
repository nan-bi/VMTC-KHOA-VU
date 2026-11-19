"""Local department classification and tariff service calculation.

Naive Bayes produces suggestions only. An unresolved department pair is never
included in revenue until a user has explicitly confirmed that exact pair.
"""
import math
import re
import unicodedata
from collections import Counter
from copy import deepcopy

from data_rules import (aggregate, business_date, json_text, number, sum_money,
                        sum_quantity, integer)
from patient_identity import patient_group_key, validate_identity_notes
from revenue_engine import calculate, kind_of, billing_type, DEFAULT_KINDS, KINDS

AI_VERSION = 'VU-REVENUE-NB-1'
ROUTES = ['VU_INTERNAL', 'VU_OUTBOUND', 'VU_INBOUND', 'EXTERNAL_UNRELATED']
DEPARTMENTS = {'VU', 'CDHA', 'KSKTQ', 'NOITRU', 'GPB', 'DITRUYEN', 'NGOAI',
               'TAOHINH', 'UNGBUOU', 'XATRI', 'YHHN', 'XETNGHIEM', 'GAYME',
               'GIAMNHE', 'DINHDUONG', 'PHCN', 'TAMLY', 'HTSS', 'SAN', 'NOI'}
ALIASES = {'KHOA-VU': 'VU', 'KHOA-CDHA': 'CDHA', 'KHOA-SKTQ': 'KSKTQ',
           'SKTQ': 'KSKTQ', 'KHOA-GMHS': 'GAYME', 'GMHS': 'GAYME',
           'KHOA-UNGBUOU': 'UNGBUOU'}
NAMES = {'KHOA VU': 'VU', 'CHUYEN KHOA VU': 'VU',
         'KHOA CHAN DOAN HINH ANH': 'CDHA', 'TRUNG TAM CHAN DOAN HINH ANH': 'CDHA',
         'KHOA XET NGHIEM': 'XETNGHIEM', 'TRUNG TAM XET NGHIEM': 'XETNGHIEM',
         'KHOA SUC KHOE TONG QUAT': 'KSKTQ', 'SUC KHOE TONG QUAT': 'KSKTQ',
         'KHOA UNG BUOU': 'UNGBUOU'}
BILLING_NAMES = {'SKTQ': 'Gói SKTQ', 'SLUT1': 'Combo SLUT 1', 'SLUT2': 'Combo SLUT 2',
                 'OTHER': 'Gói khác', 'UNKNOWN': 'Chờ phân loại', 'RETAIL': 'CK/lẻ ngoài gói'}
ROUTE_NAMES = {'INTERNAL': 'Vú chỉ định · Vú thực hiện', 'OUTBOUND': 'Vú chỉ định · khoa khác thực hiện',
               'INBOUND': 'Khoa khác chỉ định · Vú thực hiện', 'EXTERNAL': 'Ngoài phạm vi Khoa Vú',
               'UNKNOWN': 'Chưa rõ khoa · cần đối soát'}


def department(value):
    if not isinstance(value, str):
        return None
    text = value.strip().upper()
    key = ALIASES.get(text, text)
    return key if key in DEPARTMENTS else None


def normalize_dept(value):
    value = '' if value is None else str(value)
    value = ''.join(c for c in unicodedata.normalize('NFD', value) if not '\u0300' <= c <= '\u036f')
    return re.sub(r'\s+', ' ', value.replace('đ', 'd').replace('Đ', 'D').upper().strip())


def resolve_dept(value):
    return department(value) or NAMES.get(normalize_dept(value))


def pair_key(row):
    return json_text([normalize_dept(row.get('ordering_dept')), normalize_dept(row.get('performing_dept'))])


def route(a, b):
    if not a or not b:
        return None
    if a == 'VU':
        return 'VU_INTERNAL' if b == 'VU' else 'VU_OUTBOUND'
    return 'VU_INBOUND' if b == 'VU' else 'EXTERNAL_UNRELATED'


def tokens(row):
    values = ['pair=' + pair_key(row)] * 8
    for key in ['ordering_dept', 'performing_dept']:
        text = normalize_dept(row.get(key))
        values.append(key + '=' + text)
        values.extend(key + ':' + item for item in re.split(r'[^A-Z0-9]+', text) if item)
    return values


def validate_learning(examples=None):
    examples = [] if examples is None else examples
    if not isinstance(examples, list) or len(examples) > 2000:
        raise ValueError('Tối đa 2.000 cặp khoa đã xác nhận.')
    seen = set()
    for item in examples:
        if not isinstance(item, dict) or any(not isinstance(item.get(k), str) or not item[k].strip() or len(item[k]) > 200 for k in ['ordering_dept', 'performing_dept']) or item.get('label') not in ROUTES or not isinstance(item.get('reason'), str) or len(item['reason'].strip()) < 8:
            raise ValueError('Nhãn học cần đủ hai khoa, phân loại và lý do ít nhất 8 ký tự.')
        a, b = resolve_dept(item['ordering_dept']), resolve_dept(item['performing_dept'])
        known, label = route(a, b), item['label']
        if ((known and known != label) or
            (a == 'VU' and label not in ['VU_INTERNAL', 'VU_OUTBOUND']) or
            (a and a != 'VU' and label in ['VU_INTERNAL', 'VU_OUTBOUND']) or
            (b == 'VU' and label not in ['VU_INTERNAL', 'VU_INBOUND']) or
            (b and b != 'VU' and label in ['VU_INTERNAL', 'VU_INBOUND'])):
            raise ValueError('Nhãn mâu thuẫn khoa đã nhận diện. Sửa dữ liệu nguồn trước.')
        key = pair_key(item)
        if key in seen:
            raise ValueError('Cặp khoa có nhiều nhãn; cần đối soát.')
        seen.add(key)


def train_model(examples=None):
    examples = examples or []
    validate_learning(examples)
    departments = ['VU', 'CDHA', 'KSKTQ', 'XETNGHIEM', 'GAYME', 'UNGBUOU', 'GPB', 'NOI']
    base = [dict(ordering_dept=a, performing_dept=b, label=route(a, b)) for a in departments for b in departments]
    counts = {label: Counter() for label in ROUTES}
    documents = Counter()
    vocabulary = set()
    for item in base + examples:
        label = item['label']
        documents[label] += 1
        words = tokens(item)
        counts[label].update(words)
        vocabulary.update(words)
    return dict(version=AI_VERSION, documents=documents, counts=counts,
                totals={key: sum(value.values()) for key, value in counts.items()},
                vocabulary=vocabulary, examples={pair_key(e): e for e in examples},
                trainingCount=len(base) + len(examples), reviewedCount=len(examples))


def predict(row, model):
    words = [t for t in tokens(row) if t in model['vocabulary']]
    scores = []
    for label in ROUTES:
        score = math.log((model['documents'][label] + 1) / (model['trainingCount'] + len(ROUTES)))
        score += sum(math.log((model['counts'][label][t] + 1) / (model['totals'][label] + len(model['vocabulary']))) for t in words)
        scores.append((label, score))
    scores.sort(key=lambda item: -item[1])
    denominator = sum(math.exp(value - scores[0][1]) for _, value in scores)
    known = route(resolve_dept(row.get('ordering_dept')), resolve_dept(row.get('performing_dept')))
    review = model['examples'].get(pair_key(row))
    label = known or (review['label'] if review else None)
    return dict(label=label, suggestion=scores[0][0], score=1 / denominator,
                source='Danh mục khoa chuẩn' if known else 'Cặp khoa đã xác nhận' if review else 'AI gợi ý · cần xác nhận',
                included=label in ['VU_INTERNAL', 'VU_OUTBOUND'], pending=not label, version=AI_VERSION)


def revenue_scope(rows, config=None):
    model = train_model((config or {}).get('routingExamples'))
    records = [dict(row=row, **predict(row, model)) for row in rows]
    return dict(records=records, reviewedCount=model['reviewedCount'],
                included=[r['row'] for r in records if r['included']],
                pending=[r for r in records if r['pending']],
                excluded=[r for r in records if not r['pending'] and not r['included']])


def breast_aggregate(rows, catalog, start, end, config=None):
    scope = revenue_scope(rows, config)
    stats = aggregate(scope['included'], catalog, start, end)
    def in_period(row):
        day = business_date(row.get('completed_at'))
        return row.get('status') == 'HOANTHANH' and number(row.get('in_snapshot')) == 1 and day is not None and start <= day < end
    stats.update(revenueScope='ORDERING_VU', scopeLabel='Khoa Vú chỉ định · bao gồm khoa khác thực hiện',
                 classification=dict(version=AI_VERSION, reviewedPairs=scope['reviewedCount'],
                                     included=sum(in_period(r) for r in scope['included']),
                                     excluded=sum(in_period(r['row']) for r in scope['excluded']),
                                     pending=sum(in_period(r['row']) for r in scope['pending'])))
    return stats


def validate_config(config, catalog=None):
    if not isinstance(config, dict):
        raise ValueError('Cấu hình bóc tách không hợp lệ.')
    from service_catalog import extend_catalog
    extend_catalog([], config)
    package_types = config.get('packageTypes', {})
    kinds = config.get('serviceKinds', DEFAULT_KINDS)
    if not isinstance(package_types, dict) or any(v not in ['SKTQ', 'SLUT1', 'SLUT2', 'OTHER', 'UNKNOWN'] for v in package_types.values()) or not isinstance(kinds, dict) or any(v not in KINDS for v in kinds.values()):
        raise ValueError('Cấu hình bóc tách không hợp lệ.')
    rates = config.get('rates', {})
    if not isinstance(rates, dict):
        raise ValueError('Bảng đơn giá không hợp lệ.')
    for code, groups in rates.items():
        if catalog is not None and code not in {r['code'] for r in catalog}:
            raise ValueError('Mã dịch vụ trong bảng giá chưa có trong danh mục.')
        if not isinstance(groups, dict):
            raise ValueError('Nhóm đơn giá không hợp lệ.')
        for kind, value in groups.items():
            if kind == 'UNKNOWN' or kind not in BILLING_NAMES or (value is not None and (not integer(value) or number(value) < 0)):
                raise ValueError('Đơn giá phải là số nguyên VND không âm; để trống nếu dùng giá nguồn.')
    validate_identity_notes(config.get('identityNotes'))
    validate_learning(config.get('routingExamples'))


def selected_rows(rows, config=None, department_id='VU'):
    ordering_scope = department_id in ['ORDERING_VU', 'ORDERING_OTHER', 'ORDERING_ALL']
    scope = revenue_scope(rows, config) if ordering_scope else None
    source = (scope['included'] if department_id == 'ORDERING_VU' else
              [r['row'] for r in scope['excluded']] if department_id == 'ORDERING_OTHER' else
              [r['row'] for r in scope['records'] if not r['pending']] if department_id == 'ORDERING_ALL' else rows)
    return [r for r in source if r.get('status') == 'HOANTHANH' and number(r.get('in_snapshot')) == 1 and (department_id == 'ALL' or ordering_scope or resolve_dept(r.get('performing_dept')) == department_id)]


def summarize(rows):
    return dict(rows=rows, qty=sum_quantity(r.get('completed_qty') for r in rows),
                visits=len({r.get('visit_id') for r in rows}),
                gross=sum_money(r.get('completed_gross_vnd') for r in rows),
                net=sum_money(r['completed_net_vnd'] for r in rows if r.get('completed_net_vnd') is not None),
                missing=sum(r.get('completed_net_vnd') is None for r in rows))


def service_calculation(completed, config=None, department_id='VU'):
    config = config or {}
    validate_config(config)
    rows = selected_rows(completed, config, department_id)
    families, prices, combos = [], [], {}
    for kind, label in KINDS.items():
        if kind == 'OTHER':
            continue
        matched = [r for r in rows if kind_of(r, config) == kind]
        buckets = {key: summarize([r for r in matched if billing_type(r, config) == key]) for key in BILLING_NAMES}
        families.append(dict(kind=kind, label=label, **summarize(matched), buckets=buckets))
        for group, bucket in buckets.items():
            codes = dict.fromkeys(r['service_code'] for r in bucket['rows'])
            for code in codes:
                own = [r for r in bucket['rows'] if r['service_code'] == code]
                allocations = [r for r in own if r.get('price_mode') == 'TRONGGOI']
                prices.append(dict(key=code + '-' + group, kind=kind, type=group, code=code,
                                   name=own[0].get('service_name'), **summarize(own),
                                   prices=sorted({number(r.get('unit_price_vnd')) for r in own}),
                                   unitAllocations=sorted({number(r['package_allocation_vnd']) / number(r['completed_qty']) for r in allocations if r.get('package_allocation_vnd') is not None}),
                                   allocation=sum_money(r['package_allocation_vnd'] for r in allocations if r.get('package_allocation_vnd') is not None),
                                   missingAllocation=sum(r.get('package_allocation_vnd') is None for r in allocations), packageRows=len(allocations)))
    for row in rows:
        group = billing_type(row, config)
        if group not in ['SLUT1', 'SLUT2']:
            continue
        key = json_text([patient_group_key(row), row.get('visit_id'), row.get('package_id')])
        combos.setdefault(key, dict(key=key, type=group, package_id=row.get('package_id'), visit_id=row.get('visit_id'), rows=[]))['rows'].append(row)
    warnings = []
    for combo in combos.values():
        kinds = {kind_of(r, config) for r in combo['rows']}
        missing = []
        if 'EXAM' not in kinds:
            missing.append('khám')
        if 'US' not in kinds:
            missing.append('siêu âm')
        if combo['type'] == 'SLUT2' and not kinds.intersection({'XR2', 'XR3'}):
            missing.append('X-quang 2D/3D')
        if missing:
            warnings.append(dict(combo, missing=missing))
    try:
        revenue = calculate(rows, config)
    except ValueError as error:
        revenue = dict(error=str(error))
    return dict(families=families, prices=prices, warnings=warnings, revenue=revenue,
                unclassified=sum(len(f['buckets']['UNKNOWN']['rows']) for f in families),
                outOfScope=sum(kind_of(r, config) == 'OTHER' for r in rows))


def revenue_snapshot(completed, config=None, department_id='ORDERING_VU'):
    config = config or {}
    validate_config(config)
    result = calculate(selected_rows(completed, config, department_id), config)
    return dict(department=department_id, configuration=deepcopy(config), **result)


def finance_routes(rows, config=None):
    buckets = {key: [] for key in ROUTE_NAMES}
    mapping = dict(VU_INTERNAL='INTERNAL', VU_OUTBOUND='OUTBOUND', VU_INBOUND='INBOUND', EXTERNAL_UNRELATED='EXTERNAL')
    for record in revenue_scope(rows, config)['records']:
        row = record['row']
        if row.get('status') == 'HOANTHANH' and number(row.get('in_snapshot')) == 1:
            buckets[mapping.get(record['label'], 'UNKNOWN')].append(row)
    return [dict(key=key, label=ROUTE_NAMES[key], rows=own, qty=sum_quantity(r['completed_qty'] for r in own), gross=sum_money(r['completed_gross_vnd'] for r in own)) for key, own in buckets.items()]
