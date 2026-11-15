"""Regression tests for the Python data pipeline, using synthetic data only.

The golden fixture was captured from the previous JavaScript implementation
before migration. It compares complete models, not merely the final total.
No test reads the user's SQLite database or browser speech storage.
"""
import base64
import io
import json
import math
import sys
import unittest
import zipfile
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend' / 'python'))

from classification import (service_calculation, revenue_scope, breast_aggregate,
                            predict, train_model, validate_learning, resolve_dept,
                            validate_config, revenue_snapshot, finance_routes)
from data_rules import (aggregate, validate, edited_row, business_date, is_timestamp,
                        is_date_only, normalize_date, sum_money, sum_quantity,
                        gross_amount, scaled_quantity, signature)
from ingestion import ingest_file, prepare_import, inspect_schema, adapt_rows
from presentation import meeting_slides, presentation
from reporting import template_report, template_workbook, sheet_xml, col_name
from workspace_rules import transition, TransitionError

GOLDEN = json.loads((ROOT / 'tests/fixtures/python-phase2-golden.json').read_text(encoding='utf-8'))


def source_row(**changes):
    row = deepcopy(next(r for r in GOLDEN['rows'] if r['status'] == 'HOANTHANH' and r['price_mode'] == 'MUALE' and r['discount_known'] == 1))
    row.update(changes)
    return row


def workbook_bytes(grids):
    from openpyxl import Workbook
    book = Workbook()
    book.remove(book.active)
    for name, grid in grids:
        sheet = book.create_sheet(name)
        for row in grid:
            sheet.append(row)
    buffer = io.BytesIO()
    book.save(buffer)
    return buffer.getvalue()


def upload(raw, name='source.xlsx', folder=False):
    return dict(name=name, folder=folder, content=base64.b64encode(raw).decode('ascii'))


def grid_for(rows):
    headers = list(rows[0])
    return [headers] + [[r.get(key) for key in headers] for r in rows]


class GoldenParity(unittest.TestCase):
    def test_full_aggregate_matches_legacy(self):
        self.assertEqual(aggregate(GOLDEN['rows'], GOLDEN['catalog'], GOLDEN['from'], GOLDEN['to']), GOLDEN['aggregate'])

    def test_ordering_scope_and_all_classification_counts_match(self):
        self.assertEqual(breast_aggregate(GOLDEN['rows'], GOLDEN['catalog'], GOLDEN['from'], GOLDEN['to'], GOLDEN['config']), GOLDEN['breast'])

    def test_every_family_price_bucket_quantity_and_warning_matches(self):
        actual = service_calculation(GOLDEN['aggregate']['completed'], GOLDEN['config'], 'ALL')
        self.assertEqual(actual, GOLDEN['calculation'])

    def test_full_template_model_matches_every_sheet_cell_formula(self):
        options = dict(rows=GOLDEN['aggregate']['completed'], catalog=GOLDEN['catalog'], serviceRevenue=GOLDEN['report']['serviceRevenue'])
        self.assertEqual(template_report(options), GOLDEN['template'])

    def test_detail_template_respects_same_filtered_rows(self):
        options = dict(rows=GOLDEN['aggregate']['completed'], catalog=GOLDEN['catalog'], detail=True, serviceRevenue=GOLDEN['report']['serviceRevenue'])
        self.assertEqual(template_report(options), GOLDEN['detail'])

    def test_meeting_slide_content_matches_previous_snapshot(self):
        self.assertEqual(meeting_slides(GOLDEN['report']), GOLDEN['slides'])

    def test_naive_bayes_labels_sources_and_scores_match(self):
        actual = revenue_scope(GOLDEN['rows'], GOLDEN['config'])['records']
        for expected, record in zip(GOLDEN['scope'], actual):
            for key, value in expected.items():
                if key == 'score':
                    self.assertAlmostEqual(record[key], value, places=12)
                else:
                    self.assertEqual(record[key], value)


class ExactDataRules(unittest.TestCase):
    def test_money_is_integer_and_rounds_once_half_up(self):
        self.assertEqual(gross_amount('0.5', 1), 1)
        self.assertEqual(gross_amount('0.000001', 500000), 1)
        self.assertEqual(sum_quantity(['0.1', '0.2', '0.000001']), .300001)
        self.assertEqual(sum_money(['10', 20, '30.000000']), 60)
        for price in [-1, '1.1', True, 9007199254740992]:
            with self.subTest(price=price), self.assertRaises(ValueError):
                gross_amount(1, price)
        for quantity in ['1e-7', '0.0000001', None, True, 1000000001]:
            with self.subTest(quantity=quantity), self.assertRaises(ValueError):
                scaled_quantity(quantity)
        with self.assertRaises(ValueError):
            sum_money([9007199254740991, 1])

    def test_dates_require_real_calendar_and_bounded_timezone(self):
        for value in ['2026-02-29', '2026-13-01', '2026-10-01T08:00', '2026-10-01T24:00:00+07:00', '2026-10-01T08:00:00+14:01']:
            with self.subTest(value=value):
                self.assertFalse(is_timestamp(value))
        for value in ['2024-02-29', '2026-10-01T08:00Z', '2026-10-01T08:00:01.001+14:00']:
            with self.subTest(value=value):
                self.assertTrue(is_timestamp(value))
        self.assertEqual(business_date('2026-10-01T18:00:00Z'), '2026-10-02')
        self.assertEqual(business_date('2026-10-01'), '2026-10-01')
        self.assertEqual(normalize_date(25569), '1970-01-01T00:00:00.000+07:00')
        self.assertIsNone(normalize_date(-1))
        self.assertIsNone(business_date('missing'))

    def test_identical_rows_from_different_files_count_once(self):
        row = source_row()
        copy = dict(row, source_file='RENAMED.xlsx', source_row=100, source_file_hash='different')
        result = validate([row, copy], GOLDEN['catalog'])
        self.assertEqual(result['valid'], [row])
        self.assertEqual(len(result['duplicates']), 1)
        self.assertFalse(result['issues'])
        self.assertEqual(signature(row), signature(copy))

    def test_conflicting_key_quarantines_all_versions(self):
        row = source_row()
        result = validate([row, dict(row, unit_price_vnd=row['unit_price_vnd'] + 1)], GOLDEN['catalog'])
        self.assertEqual(result['valid'], [])
        self.assertEqual(len(result['issues']), 2)
        self.assertTrue(all(any('khác nội dung' in reason for reason in item['reasons']) for item in result['issues']))

    def test_same_visit_cannot_be_assigned_to_two_patients(self):
        row = source_row()
        result = validate([row, dict(row, order_id='SECOND', patient_id='OTHER')], GOLDEN['catalog'])
        self.assertFalse(result['valid'])
        self.assertTrue(all('Một lượt khám bị gán cho nhiều bệnh nhân' in item['reasons'] for item in result['issues']))

    def test_different_keys_for_same_event_require_review(self):
        row = source_row()
        other = dict(row, order_id='SECOND-KEY')
        result = validate([row, other], GOLDEN['catalog'], suspected_duplicates=True)
        self.assertEqual(len(result['issues']), 2)
        self.assertEqual(result['duplicates'], [])

    def test_missing_net_remains_missing_and_cancelled_cannot_have_production(self):
        row = source_row(completed_net_vnd=None, discount_known=0)
        self.assertFalse(validate([row], GOLDEN['catalog'])['issues'])
        self.assertIsNone(row['completed_net_vnd'])
        self.assertTrue(validate([dict(row, status='HUY')], GOLDEN['catalog'])['issues'])
        row.update(status='HUY', completed_qty=0, completed_gross_vnd=0, completed_at=None)
        self.assertFalse(validate([row], GOLDEN['catalog'])['issues'])

    def test_edit_recomputes_money_without_changing_source_identity(self):
        row = source_row(discount_known=1, discount_vnd=0)
        after = edited_row(row, {'unit_price_vnd': 500, 'completed_qty': '0.5', 'quantity': '0.5'}, GOLDEN['catalog'])
        self.assertEqual(after['gross_order_vnd'], 250)
        self.assertEqual(after['completed_gross_vnd'], 250)
        self.assertEqual(after['completed_net_vnd'], 250)
        for key in ['order_id', 'patient_id', 'visit_id', 'source_file', 'source_row']:
            self.assertEqual(row.get(key), after.get(key))
        for field in ['patient_id', 'order_id', 'source_file_hash', 'completed_gross_vnd']:
            with self.subTest(field=field), self.assertRaises(ValueError):
                edited_row(row, {field: 'tampered'}, GOLDEN['catalog'])

    def test_edit_status_clears_completed_values_but_not_orders(self):
        row = source_row()
        after = edited_row(row, {'status': 'CHOTHUCHIEN'}, GOLDEN['catalog'])
        self.assertEqual(after['completed_qty'], 0)
        self.assertEqual(after['completed_gross_vnd'], 0)
        self.assertIsNone(after['completed_at'])
        self.assertIsNone(after['completed_net_vnd'])
        self.assertEqual(after['quantity'], row['quantity'])


class ClassificationBoundaries(unittest.TestCase):
    def test_only_vu_ordering_includes_outbound_and_excludes_inbound(self):
        row = source_row()
        rows = [dict(row, ordering_dept='VU', performing_dept='VU'),
                dict(row, ordering_dept='Khoa Vú', performing_dept='CDHA'),
                dict(row, ordering_dept='KSKTQ', performing_dept='VU'),
                dict(row, ordering_dept='NOI', performing_dept='CDHA'),
                dict(row, ordering_dept='Chưa xác nhận', performing_dept='VU')]
        result = revenue_scope(rows)
        self.assertEqual(len(result['included']), 2)
        self.assertEqual(len(result['excluded']), 2)
        self.assertEqual(len(result['pending']), 1)
        self.assertFalse(result['pending'][0]['included'])
        self.assertEqual(resolve_dept('  khoa chẩn đoán hình ảnh '), 'CDHA')

    def test_ai_suggestion_is_not_permission_to_count_revenue(self):
        row = source_row(ordering_dept='PHONG CHUA BIET', performing_dept='VU')
        unknown = predict(row, train_model())
        self.assertTrue(unknown['pending'])
        self.assertIsNone(unknown['label'])
        self.assertIn(unknown['suggestion'], ['VU_INTERNAL', 'VU_OUTBOUND', 'VU_INBOUND', 'EXTERNAL_UNRELATED'])
        example = dict(ordering_dept=row['ordering_dept'], performing_dept='VU', label='VU_INBOUND', reason='Đã đối chiếu nguồn khoa ngoài')
        learned = predict(row, train_model([example]))
        self.assertEqual(learned['label'], 'VU_INBOUND')
        self.assertFalse(learned['pending'])
        self.assertFalse(learned['included'])

    def test_contradictory_and_duplicate_learning_is_rejected(self):
        base = dict(ordering_dept='VU', performing_dept='CDHA', label='VU_INBOUND', reason='Kiểm tra nhãn mâu thuẫn')
        with self.assertRaises(ValueError):
            validate_learning([base])
        base['label'] = 'VU_OUTBOUND'
        with self.assertRaises(ValueError):
            validate_learning([base, deepcopy(base)])
        for examples in [None, []]:
            validate_learning(examples)

    def test_configured_retail_package_prices_and_zero_remain_separate(self):
        rows = []
        for mode, package in [('MUALE', None), ('TRONGGOI', 'S'), ('TRONGGOI', 'C1'), ('TRONGGOI', 'C2')]:
            rows.append(source_row(service_code='SYN-DV008', price_mode=mode, package_id=package, quantity=1, completed_qty=1))
        config = dict(packageTypes={'S': 'SKTQ', 'C1': 'SLUT1', 'C2': 'SLUT2'}, rates={'SYN-DV008': {'RETAIL': 500, 'SKTQ': 200, 'SLUT1': 300, 'SLUT2': 0}})
        result = service_calculation(rows, config, 'ALL')
        self.assertEqual(result['revenue']['knownRevenue'], 1000)
        self.assertEqual([r['revenue'] for r in result['revenue']['lines']], [500, 200, 300, 0])
        config['rates']['SYN-DV008']['SKTQ'] = -1
        with self.assertRaises(ValueError):
            validate_config(config)

    def test_xray_is_not_assigned_to_slut1_by_subtraction(self):
        row = source_row(service_code='SYN-DV005', price_mode='TRONGGOI', package_id='C1')
        config = dict(packageTypes={'C1': 'SLUT1'})
        result = service_calculation([row], config, 'ALL')
        self.assertEqual(result['revenue']['missingRecords'], 1)
        self.assertIsNone(result['revenue']['lines'][0]['revenue'])
        self.assertEqual(result['revenue']['lines'][0]['type'], 'UNKNOWN')


class ImportAndReconciliation(unittest.TestCase):
    def test_xlsx_source_metadata_comes_from_bytes_and_actual_row(self):
        row = source_row(source_file='FORGED', source_row=999, source_file_hash='FORGED')
        headers = list(row)
        raw = workbook_bytes([('CANONICAL', [headers, [row[k] for k in headers], [], [row[k] for k in headers]])])
        result = ingest_file(upload(raw))
        self.assertEqual([r['source_row'] for r in result['rows']], [2, 4])
        self.assertEqual(result['rows'][0]['source_file'], 'source.xlsx')
        self.assertNotEqual(result['rows'][0]['source_file_hash'], 'FORGED')
        self.assertEqual(result['rows'][0]['source_file_hash'], result['files'][0]['hash'])

    def test_folder_discovers_header_and_keys_survive_file_rename(self):
        row = source_row()
        row.pop('order_id', None)
        row.pop('his_order_id', None)
        grid = [['Tiêu đề báo cáo'], []] + grid_for([row])
        raw = workbook_bytes([('ChiTiet', grid), ('GhiChu', [['Không có dữ liệu tài chính']])])
        first = ingest_file(upload(raw, 'A/source.xlsx', True))
        second = ingest_file(upload(raw, 'B/renamed.xlsx', True))
        self.assertEqual(first['rows'][0]['source_row'], 4)
        self.assertEqual(first['rows'][0]['order_id'], second['rows'][0]['order_id'])
        self.assertRegex(first['rows'][0]['order_id'], r'^LOCAL-[a-f0-9]{64}$')
        self.assertEqual(len(first['skippedSheets']), 1)
        self.assertNotIn('his_order_id', first['rows'][0])

    def test_duplicate_alias_and_unheaded_values_are_not_silently_dropped(self):
        row = source_row()
        row['Mã DV'] = row['service_code']
        with self.assertRaisesRegex(ValueError, 'ánh xạ trùng'):
            adapt_rows([row], 'test.xlsx')
        with self.assertRaisesRegex(ValueError, 'tiêu đề cột trùng'):
            ingest_file(upload(workbook_bytes([('S', [['order_id', 'order_id'], ['A', 'B']])])) )
        grid = grid_for([source_row()])
        grid[0].append(None)
        grid[1].append('Không được bỏ')
        with self.assertRaisesRegex(ValueError, 'không có tiêu đề'):
            ingest_file(upload(workbook_bytes([('S', grid)])))

    def test_csv_preserves_identifier_zeroes_and_handles_quoted_newline(self):
        import csv
        row = source_row(patient_id='000123', visit_id='000045', service_name='Siêu âm, vú\nHai bên')
        memory = io.StringIO()
        writer = csv.writer(memory)
        writer.writerow(row)
        writer.writerow(row.values())
        loaded = ingest_file(upload(memory.getvalue().encode('utf-8-sig'), 'report.csv'))
        self.assertEqual(loaded['rows'][0]['patient_id'], '000123')
        self.assertEqual(loaded['rows'][0]['visit_id'], '000045')
        self.assertEqual(loaded['rows'][0]['service_name'], row['service_name'])
        self.assertEqual(loaded['rows'][0]['source_row'], 2)

    def test_repeat_file_hash_is_skipped_and_cross_file_duplicate_is_not_added(self):
        raw = workbook_bytes([('S', grid_for([source_row()]))])
        loaded = ingest_file(upload(raw))
        state = dict(rows=[], hashes=[], revision=0)
        first = prepare_import(loaded, state, GOLDEN['catalog'])
        self.assertEqual(len(first['rows']), 1)
        state.update(rows=first['rows'], hashes=first['hashes'])
        second = prepare_import(loaded, state, GOLDEN['catalog'])
        self.assertEqual(second['rows'], [])
        self.assertEqual(len(second['skippedFiles']), 1)
        renamed = ingest_file(upload(workbook_bytes([('Other', grid_for([source_row()]))]), 'another.xlsx'))
        third = prepare_import(renamed, state, GOLDEN['catalog'])
        self.assertEqual(third['duplicateCount'], 1)
        self.assertEqual(third['rows'], [])

    def test_bad_workbook_and_missing_schema_are_explicit(self):
        with self.assertRaises(ValueError):
            ingest_file(upload(b'not an Excel archive'))
        folder = ingest_file(upload(b'not an Excel archive', folder=True))
        self.assertFalse(folder['rows'])
        self.assertTrue(folder['skippedSheets'])
        with self.assertRaisesRegex(ValueError, 'thiếu cột'):
            ingest_file(upload(workbook_bytes([('S', [['bad'], [1]])])))
        with self.assertRaises(ValueError):
            ingest_file(dict(name='bad.xlsx', content='not valid base64'))
        with self.assertRaisesRegex(ValueError, 'chỉ hỗ trợ'):
            ingest_file(upload(b'text', 'report.exe'))


class ExportIntegrity(unittest.TestCase):
    def options(self):
        return dict(rows=GOLDEN['aggregate']['completed'], catalog=GOLDEN['catalog'], serviceRevenue=GOLDEN['report']['serviceRevenue'])

    def test_xlsx_is_readable_and_formula_has_cached_source_total(self):
        from openpyxl import load_workbook
        model, raw = template_workbook(self.options())
        values = load_workbook(io.BytesIO(raw), data_only=True)
        formulas = load_workbook(io.BytesIO(raw), data_only=False)
        cell = f'F{model["mainTotalRow"]}'
        self.assertEqual(values['DATA_KHOAVU'][cell].value, GOLDEN['aggregate']['gross'])
        self.assertTrue(formulas['DATA_KHOAVU'][cell].value.startswith('=SUM('))
        self.assertEqual(formulas['DATA_KHOAVU'].freeze_panes, 'D3')
        self.assertIn('KIEM_LOI', values.sheetnames)
        self.assertIn('GIA_X_SO_LUONG', values.sheetnames)
        self.assertEqual(values['GIA_X_SO_LUONG'].max_column, 6)
        values.close()
        formulas.close()

    def test_dangerous_excel_text_is_literal_and_escaped(self):
        from openpyxl import load_workbook
        row = source_row(service_name='=HYPERLINK("https://invalid", "<vú>&")')
        model, raw = template_workbook(dict(rows=[row], catalog=GOLDEN['catalog']))
        book = load_workbook(io.BytesIO(raw), data_only=False)
        cell = book['DATA_KHOAVU']['B3']
        self.assertEqual(cell.data_type, 's')
        self.assertEqual(cell.value, row['service_name'])
        book.close()
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            self.assertIn('&lt;vú&gt;&amp;', archive.read('xl/worksheets/sheet1.xml').decode())

    def test_export_refuses_duplicates_invalid_totals_and_pending_production(self):
        row = source_row()
        for rows in [[row, deepcopy(row)], [dict(row, completed_gross_vnd=1)], [dict(row, status='CHOTHUCHIEN')]]:
            with self.subTest(count=len(rows)), self.assertRaises(ValueError):
                template_report(dict(rows=rows, catalog=GOLDEN['catalog']))
        with self.assertRaisesRegex(ValueError, 'duyệt'):
            meeting_slides(dict(GOLDEN['report'], status='draft'))

    def test_pptx_retains_snapshot_totals_notes_and_editable_tables(self):
        raw = presentation(GOLDEN['report'])
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            slides = [name for name in archive.namelist() if name.startswith('ppt/slides/slide') and name.endswith('.xml')]
            xml = ''.join(archive.read(name).decode() for name in slides)
            self.assertIn('SN-GOLDEN-PY2', xml)
            self.assertIn('63.000.000', xml)
            self.assertIn('<a:tbl>', xml)
            self.assertIn('EBC6D5', xml)
            notes = [name for name in archive.namelist() if name.startswith('ppt/notesSlides/notesSlide') and name.endswith('.xml')]
            self.assertEqual(len(notes), len(slides))


class WorkspaceAuthority(unittest.TestCase):
    def state(self):
        return dict(version=1, revision=0, rows=[source_row()], excluded=[], imports=[], hashes=[], logs=[], report=None)

    def user(self, role='editor'):
        return dict(id=1, username='unit-test-editor', role=role)

    def test_viewer_and_stale_state_cannot_transition(self):
        current = self.state()
        for role, revision, status in [('viewer', 0, 403), ('editor', 1, 409)]:
            with self.subTest(role=role), self.assertRaises(TransitionError) as caught:
                transition(current, current, self.user(role), GOLDEN['catalog'], revision)
            self.assertEqual(caught.exception.status, status)
        self.assertEqual(current, self.state())

    def test_supplied_financial_snapshot_is_recomputed_in_python(self):
        current = self.state()
        target = deepcopy(current)
        target['report'] = dict(status='draft', week=GOLDEN['from'], end=GOLDEN['to'], stats={'gross': 1})
        result = transition(current, target, self.user(), GOLDEN['catalog'], 0)['state']
        self.assertNotEqual(result['report']['id'], 'CLIENT')
        self.assertEqual(result['report']['creator'], 'unit-test-editor')
        expected = breast_aggregate(current['rows'], GOLDEN['catalog'], GOLDEN['from'], GOLDEN['to'])
        self.assertEqual(result['report']['stats'], expected)
        self.assertEqual(result['report']['serviceRevenue'], revenue_snapshot(expected['completed']))
        self.assertIsNone(current['report'])
        self.assertEqual(target['report']['stats'], {'gross': 1})

    def test_snapshot_and_source_remain_locked_and_history_append_only(self):
        current = self.state()
        current['report'] = deepcopy(GOLDEN['report'])
        for field in ['stats', 'serviceRevenue']:
            target = deepcopy(current)
            target['report'][field]['injected'] = 1
            with self.subTest(field=field), self.assertRaises(TransitionError):
                transition(current, target, self.user(), GOLDEN['catalog'], 0)
        target = deepcopy(current)
        target['rows'][0]['unit_price_vnd'] = 1
        with self.assertRaises(TransitionError) as caught:
            transition(current, target, self.user(), GOLDEN['catalog'], 0)
        self.assertEqual(caught.exception.status, 403)
        current = self.state()
        current['dataEdits'] = [dict(reason='Đối soát từ nguồn', index=0)]
        target = deepcopy(current)
        target['dataEdits'] = []
        with self.assertRaises(TransitionError):
            transition(current, target, self.user(), GOLDEN['catalog'], 0)


if __name__ == '__main__':
    unittest.main()
