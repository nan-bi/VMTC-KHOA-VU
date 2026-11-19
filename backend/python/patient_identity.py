"""Conservative identity grouping. Never use PID alone to merge cases."""
import json
import re
import unicodedata
from datetime import date, datetime, timedelta

def identity_name(value):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', value).strip()).lower() if isinstance(value, str) else ''

def birth_date(value):
    if not isinstance(value, str): return None
    text = value.strip()
    match = re.fullmatch(r'(\d{2})/(\d{2})/(\d{4})', text)
    if match: text = f'{match[3]}-{match[2]}-{match[1]}'
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', text): return None
    try: return date.fromisoformat(text).isoformat()
    except ValueError: return None

def identity_profile(row):
    from data_rules import business_date, integer
    name, dob, day = identity_name(row.get('patient_name')), birth_date(row.get('patient_dob')), business_date(row.get('ordered_at'))
    value = row.get('patient_age')
    age = int(float(value)) if integer(value) and 0 <= float(value) <= 130 else None
    expected = None
    if dob and day:
        expected = int(day[:4]) - int(dob[:4]) - (day[5:] < dob[5:])
    mismatch = expected is not None and (expected < 0 or expected > 130 or (age is not None and expected != age))
    return dict(name=name, dob=dob, age=age, mismatch=mismatch, complete=bool(name and dob and age is not None and expected is not None and not mismatch))

def patient_group_key(row):
    from data_rules import json_text
    p = identity_profile(row)
    parts = ['VERIFIED', row.get('patient_id'), p['name'], p['dob']] if p['complete'] else ['SEPARATE', *[row.get(k) for k in ['patient_id','visit_id','order_id','source_file','source_sheet','source_row']]]
    return json_text(parts)

def identity_review(rows):
    from data_rules import json_text, business_date
    groups, notes = {}, []
    for i, row in enumerate(rows):
        if not isinstance(row, dict) or not isinstance(row.get('patient_id'), str): continue
        groups.setdefault(row['patient_id'], []).append(dict(row=row, index=i, **identity_profile(row)))
    for pid, items in groups.items():
        names, dates = {p['name'] for p in items if p['name']}, {p['dob'] for p in items if p['dob']}
        conflict = len(names)>1 or len(dates)>1 or any(p['mismatch'] for p in items)
        incomplete = any(not p['complete'] for p in items)
        if not conflict and not (len(items)>1 and incomplete): continue
        profiles = sorted({json_text([p['name'],p['dob'],p['age'],business_date(p['row'].get('ordered_at'))]) for p in items})
        displays = list(dict.fromkeys(f"{p['row'].get('patient_name') or 'Thiếu tên'} · {p['row'].get('patient_dob') or 'Thiếu ngày sinh'} · tuổi {p['row'].get('patient_age') if p['row'].get('patient_age') is not None else 'chưa có'}" for p in items))
        notes.append(dict(key=json_text([pid,profiles,len(items)]), patient_id=pid,status='CONFLICT' if conflict else 'INCOMPLETE',count=len(items),rowIndices=[p['index'] for p in items],message='PID có tên/ngày sinh khác nhau hoặc tuổi không khớp ngày sinh; giữ riêng các hồ sơ.' if conflict else 'PID lặp nhưng thiếu tên, tuổi hoặc ngày sinh đầy đủ; chưa đủ căn cứ gộp hồ sơ.',profiles=displays))
    return notes

def validate_identity_notes(notes=None):
    notes = [] if notes is None else notes
    if not isinstance(notes,list) or len(notes)>2000: raise ValueError('Tối đa 2.000 ghi chú định danh.')
    seen=set()
    for n in notes:
        if not isinstance(n,dict) or not isinstance(n.get('key'),str) or len(n['key'])>100000 or not isinstance(n.get('note'),str) or not 8<=len(n['note'].strip())<=2000 or n.get('status') not in ['OPEN','REVIEWED'] or n['key'] in seen:
            raise ValueError('Ghi chú cần nội dung ít nhất 8 ký tự, trạng thái hợp lệ và không trùng.')
        seen.add(n['key'])
