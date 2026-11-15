"""Private JSON subprocess protocol for dashboard data operations.

The parent supplies stdin and reads stdout. No HTTP server, network calls,
patient logging, shell execution or uploaded-file persistence occur here.
"""
import base64
import json
import sys
import time
from pathlib import Path

# -I intentionally removes CWD/user site-packages. Add only our trusted code
# directory, not any uploaded path or source spreadsheet directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))


def dispatch(action, payload):
    if action == 'revenue':
        from revenue_engine import calculate
        from classification import validate_config
        validate_config(payload.get('config') or {})
        return calculate(payload['rows'], payload.get('config'))
    if action in ['calculation', 'scope', 'aggregate', 'config', 'snapshot']:
        from classification import service_calculation, revenue_scope, breast_aggregate, validate_config, revenue_snapshot
        config = payload.get('config') or {}
        if action == 'config':
            validate_config(config, payload.get('catalog'))
            return {'valid': True}
        if action == 'scope':
            return revenue_scope(payload['rows'], config)
        if action == 'aggregate':
            return breast_aggregate(payload['rows'], payload['catalog'], payload['from'], payload['toExclusive'], config)
        if action == 'snapshot':
            return revenue_snapshot(payload['rows'], config, payload.get('department', 'ORDERING_VU'))
        return service_calculation(payload['rows'], config, payload.get('department', 'ORDERING_VU'))
    if action == 'validate':
        from data_rules import validate
        return validate(payload['rows'], payload['catalog'], payload.get('suspectedDuplicates', False))
    if action == 'edit':
        from data_rules import edited_row
        return edited_row(payload['before'], payload['patch'], payload['catalog'])
    if action == 'transition':
        from workspace_rules import transition
        return transition(payload['current'], payload['state'], payload['user'], payload['catalog'], payload['expectedRevision'])
    if action == 'ingest':
        from ingestion import ingest_file
        return ingest_file(payload)
    if action == 'prepare-import':
        from ingestion import prepare_import
        return prepare_import(payload['loaded'], payload['state'], payload['catalog'])
    if action in ['template-model', 'template-workbook']:
        from reporting import template_report, template_workbook
        if action == 'template-model':
            return template_report(payload)
        report, content = template_workbook(payload)
        return dict(report=report, content=base64.b64encode(content).decode('ascii'))
    if action in ['meeting-model', 'meeting-presentation']:
        from presentation import meeting_slides, presentation
        if action == 'meeting-model':
            return meeting_slides(payload)
        return dict(content=base64.b64encode(presentation(payload)).decode('ascii'))
    raise ValueError('Tác vụ Python không được hỗ trợ.')


def main():
    try:
        raw = sys.stdin.buffer.read(256 * 1024 * 1024 + 1)
        if len(raw) > 256 * 1024 * 1024:
            raise ValueError('Nội dung xử lý Python vượt 256 MB.')
        message = json.loads(raw.decode('utf-8-sig'))
        if not isinstance(message, dict) or not isinstance(message.get('payload'), dict):
            raise ValueError('Cấu trúc tác vụ Python không hợp lệ.')
        started = time.perf_counter()
        value = dispatch(message.get('action'), message['payload'])
        result = dict(ok=True, value=value, computeMs=round((time.perf_counter() - started) * 1000, 3))
    except ImportError:
        result = dict(ok=False, status=503, error='Thiếu thư viện Python. Chạy CAI-DAT-DU-LIEU-PYTHON.cmd trong thư mục v8.')
    except (ValueError, TypeError, KeyError, OverflowError) as error:
        result = dict(ok=False, status=getattr(error, 'status', 400), error=str(error) if isinstance(error, ValueError) else 'Dữ liệu tác vụ Python không hợp lệ.')
    except Exception:
        # Do not print stack traces containing paths or source cell contents.
        result = dict(ok=False, status=500, error='Không xử lý được tác vụ Python. Dữ liệu chưa được lưu.')
    sys.stdout.write(json.dumps(result, ensure_ascii=False, separators=(',', ':'), allow_nan=False))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
