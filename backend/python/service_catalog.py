def extend_catalog(base, config=None):
    additions = (config or {}).get('additionalServices', [])
    if not isinstance(additions, list) or len(additions) > 5000:
        raise ValueError('Danh mục bổ sung tối đa5.000 dịch vụ.')
    codes = {r['code'] for r in base}
    for item in additions:
        if (not isinstance(item, dict) or any(not isinstance(item.get(key), str) or not item[key].strip() or len(item[key]) > 300 for key in ['code', 'name', 'group']) or item['code'] in codes):
            raise ValueError('Dịch vụ bổ sung cần mã, tên, nhóm và không trùng mã danh mục.')
        codes.add(item['code'])
    return base + additions
