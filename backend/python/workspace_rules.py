"""Pure, permission-checked workspace transitions.

SQLite revision locking and persistence remain in the Node adapter. This module
calculates the next state in isolation; a failed or stale transition writes
nothing. Browser-supplied report totals, actor names and audit times are ignored.
"""
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from data_rules import validate, edited_row, EDIT_FIELDS, aggregate
from department_revenue import all_revenue_snapshot
from classification import validate_config, breast_aggregate, revenue_snapshot
from service_catalog import extend_catalog

ALLOWED_STATE = {'version', 'revision', 'rows', 'excluded', 'imports', 'hashes',
                 'logs', 'report', 'archivedReports', 'skippedDuplicates',
                 'dataEdits', 'serviceCalculation', 'calculationHistory', 'installedDemoBatches'}
SOURCE_KEYS = ['rows', 'excluded', 'imports', 'hashes', 'skippedDuplicates',
               'serviceCalculation', 'installedDemoBatches']
MISSING = object()


class TransitionError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def fail(message, status=400):
    raise TransitionError(message, status)


def stamp():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def without(value, fields):
    return {key: item for key, item in (value or {}).items() if key not in fields}


def equal(a, b):
    # Python considers bool equal to int; business JSON state must not.
    if type(a) is not type(b) and not (type(a) in (int, float) and type(b) in (int, float)):
        return False
    if isinstance(a, dict):
        return a.keys() == b.keys() and all(equal(a[k], b[k]) for k in a)
    if isinstance(a, list):
        return len(a) == len(b) and all(equal(x, y) for x, y in zip(a, b))
    return a == b


def field_equal(a, b, key):
    return equal(a.get(key, MISSING), b.get(key, MISSING))


def transition(current, supplied, user, catalog, expected_revision):
    if expected_revision != current['revision']:
        fail('Dữ liệu đã đổi ở phiên khác. Tải lại trước khi lưu.', 409)
    role = user.get('role')
    if role not in ['admin', 'editor', 'reviewer']:
        fail('Tài khoản chỉ được xem dữ liệu.', 403)
    next_state = deepcopy(supplied)
    if (not isinstance(next_state, dict) or next_state.get('version') != 1 or
        next_state.get('revision') != current['revision'] or
        not isinstance(next_state.get('rows'), list) or len(next_state['rows']) > 100000 or
        any(not isinstance(next_state.get(k), list) for k in ['excluded', 'imports', 'hashes', 'logs'])):
        fail('Cấu trúc dữ liệu không hợp lệ.')
    if set(next_state) - ALLOWED_STATE:
        fail('Trường trạng thái không được hỗ trợ.')
    if any(not isinstance(r, dict) for r in next_state['rows']):
        fail('Dòng dữ liệu không hợp lệ.')
    catalog = extend_catalog(catalog, next_state.get('serviceCalculation'))
    excluded = next_state['excluded']
    if any(type(i) is not int or not 0 <= i < len(next_state['rows']) for i in excluded) or len(set(excluded)) != len(excluded):
        fail('Danh sách loại dòng không hợp lệ.')
    source_changed = any(not field_equal(next_state, current, key) for key in SOURCE_KEYS)
    if source_changed and (role not in ['admin', 'editor'] or current.get('report')):
        fail('Không được đổi nguồn: thiếu quyền hoặc báo cáo đang khóa.', 403)
    if len(next_state['rows']) < len(current['rows']):
        fail('Không được xóa nguồn bằng thao tác ghi trạng thái.')
    edited_indices = []
    for index, before in enumerate(current['rows']):
        after = next_state['rows'][index]
        if equal(before, after):
            continue
        if not isinstance(after, dict):
            fail('Dòng dữ liệu không hợp lệ.')
        patch = {key: after.get(key) for key in EDIT_FIELDS if not field_equal(before, after, key)}
        computed = edited_row(before, patch, catalog)
        if not equal(computed, after):
            fail('Chỉ được sửa các trường nghiệp vụ; mã liên kết, nguồn và thành tiền phải hợp lệ.')
        checked = validate([after], catalog)
        if checked['issues']:
            fail('; '.join(checked['issues'][0]['reasons']))
        edited_indices.append(index)
    for key in ['dataEdits', 'calculationHistory']:
        old, history = current.get(key) or [], next_state.get(key) or []
        suffix = history[len(history) - len(old):] if old else []
        if not isinstance(history, list) or len(history) < len(old) or not equal(suffix, old):
            if old or not isinstance(history, list):
                fail('Không được sửa hoặc xóa lịch sử.')
        added = history[:len(history) - len(old)]
        if any(not isinstance(e, dict) or not isinstance(e.get('reason'), str) or len(e['reason'].strip()) < 8 for e in added):
            fail('Thiếu lý do thay đổi.')
        if added and not source_changed:
            fail('Lịch sử thay đổi không khớp nguồn.')
        for entry in added:
            entry.update(actor=user['username'], time=stamp())
    old_edits, new_edits = current.get('dataEdits') or [], next_state.get('dataEdits') or []
    if source_changed and edited_indices and len(new_edits) <= len(old_edits):
        fail('Sửa dòng phải có lịch sử và lý do.')
    added_edits = new_edits[:len(new_edits) - len(old_edits)]
    if len(added_edits) != len(edited_indices):
        fail('Lịch sử sửa không khớp số dòng thay đổi.')
    if edited_indices:
        authoritative = []
        for index in edited_indices:
            note = next((e for e in added_edits if e.get('index') == index), None)
            if not note:
                fail('Thiếu lý do sửa cho dòng dữ liệu.')
            before, after = current['rows'][index], next_state['rows'][index]
            entry = dict(id=str(uuid4()), index=index, order_id=before.get('order_id'),
                         source_file=before.get('source_file'), source_sheet=before.get('source_sheet') or 'CANONICAL',
                         source_row=before.get('source_row'), actor=user['username'], time=stamp(), reason=note['reason'].strip(),
                         changes=[dict(field=field, before=before.get(field), after=after.get(field)) for field in after if not field_equal(before, after, field)])
            # Match JSON.stringify's omission of undefined optional provenance.
            for optional in ['order_id', 'source_file', 'source_row']:
                if optional not in before:
                    entry.pop(optional, None)
            authoritative.append(entry)
        next_state['dataEdits'] = authoritative + old_edits
    if not field_equal(next_state, current, 'serviceCalculation'):
        config = next_state.get('serviceCalculation')
        if not config or not isinstance(config.get('packageTypes'), dict) or not isinstance(config.get('serviceKinds'), dict):
            fail('Cấu hình bóc tách không hợp lệ.')
        validate_config(config, catalog)
        old_history = current.get('calculationHistory') or []
        history = next_state.get('calculationHistory') or []
        if len(history) <= len(old_history):
            fail('Thay đổi quy tắc cần lịch sử và lý do.')
        next_state['calculationHistory'] = [dict(time=stamp(), actor=user['username'], reason=history[0]['reason'], before=current.get('serviceCalculation'), after=deepcopy(config))] + old_history
    old, report = current.get('report'), next_state.get('report')
    old_archives, archives = current.get('archivedReports') or [], next_state.get('archivedReports') or []
    if not isinstance(archives, list) or not equal(archives[:len(old_archives)], old_archives):
        fail('Không được sửa báo cáo lưu trữ.')
    if not old and report:
        if role not in ['admin', 'editor'] or report.get('status') != 'draft' or source_changed:
            fail('Không được tạo snapshot bằng thao tác này.', 403)
        active = [r for i, r in enumerate(current['rows']) if i not in set(current['excluded'])]
        checked = validate(active, catalog, suspected_duplicates=True)
        if checked['issues']:
            fail('Cần xử lý lỗi trước khi chốt.')
        stats = breast_aggregate(checked['valid'], catalog, report.get('week'), report.get('end'), current.get('serviceCalculation'))
        if stats['classification']['pending']:
            fail('Còn dòng chưa xác định khoa trong kỳ; xác nhận hoặc loại có lý do trước khi chốt.')
        next_state['report'] = dict(id='SN-' + str(uuid4()), version=1, rulesVersion='SIM-2', timezone='Asia/Ho_Chi_Minh',
                                    sourceRevision=current['revision'], excludedCount=len(current['excluded']), week=report['week'], end=report['end'],
                                    createdAt=stamp(), status='draft', creator=user['username'], stats=stats,
                                    allRevenue=all_revenue_snapshot(aggregate(checked['valid'], catalog, report['week'], report['end'])['completed'], current.get('serviceCalculation')),
                                    serviceRevenue=revenue_snapshot(stats['completed'], current.get('serviceCalculation')),
                                    narrative='', ack=False)
    elif old and not report:
        if role not in ['admin', 'editor']:
            fail('Không được mở kỳ mới.', 403)
        if old['status'] == 'draft':
            if len(archives) != len(old_archives):
                fail('Không lưu trữ bản nháp bằng thao tác này.')
        elif old['status'] == 'approved':
            if len(archives) != len(old_archives) + 1 or not equal(archives[-1], old):
                fail('Phải lưu nguyên báo cáo đã duyệt trước khi mở kỳ mới.')
        else:
            fail('Báo cáo đang chờ duyệt chưa thể bỏ.')
    elif old and report and not equal(old, report):
        fields = ['status', 'narrative', 'approvedAt', 'version']
        if not equal(without(old, fields), without(report, fields)):
            fail('Snapshot cố định, không được thay số liệu hoặc kỳ.')
        if old['status'] == 'approved':
            fail('Báo cáo đã duyệt không được chỉnh sửa.')
        if old['status'] == 'draft':
            if role not in ['admin', 'editor'] or report.get('status') not in ['draft', 'submitted'] or report.get('version') != old.get('version') or not field_equal(report, old, 'approvedAt'):
                fail('Chuyển trạng thái không được phép.', 403)
        else:
            if role not in ['admin', 'reviewer'] or report.get('status') not in ['draft', 'approved'] or report.get('narrative') != old.get('narrative') or report.get('version') != (old['version'] + 1 if report['status'] == 'draft' else old['version']):
                fail('Chỉ người duyệt được duyệt hoặc trả lại báo cáo.', 403)
            if report['status'] == 'approved':
                report['approvedAt'] = stamp()
            else:
                report.pop('approvedAt', None)
    if len(archives) > len(old_archives) and not (old and old.get('status') == 'approved' and not report):
        fail('Không được tự thêm báo cáo lưu trữ.')
    final_report = next_state.get('report')
    if final_report and (not isinstance(final_report.get('narrative'), str) or len(final_report['narrative']) > 50000):
        fail('Nhận xét phải là văn bản không quá 50.000 ký tự.')
    next_state['revision'] = current['revision'] + 1
    next_state['logs'] = [dict(time=stamp(), role=role, action=f"{user['username']}: {'Cập nhật nguồn dữ liệu' if source_changed else 'Cập nhật báo cáo'} · phiên bản {next_state['revision']}")] + current['logs'][:4999]
    audit = dict(sourceChanged=source_changed, editedIndices=edited_indices,
                 addedRows=len(next_state['rows']) - len(current['rows']),
                 excludedAdded=[i for i in excluded if i not in current['excluded']],
                 excludedRemoved=[i for i in current['excluded'] if i not in excluded],
                 reportStatus=(final_report or {}).get('status'))
    return dict(state=next_state, audit=audit)
