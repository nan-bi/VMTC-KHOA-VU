"""Focused import audit: synthetic inputs; never reads the live workspace."""
import base64
import io
import sys
import unittest
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend' / 'python'))
from ingestion import ingest_file
from openpyxl import Workbook
from openpyxl.utils.datetime import MAC_EPOCH, WINDOWS_EPOCH, to_excel


def row():
    return dict(patient_id='AUDIT-001', visit_id='AUDIT-VISIT-001', service_code='SA',
                ordering_dept='VU', performing_dept='VU', ordered_at='2026-10-01',
                completed_at='2026-10-01', quantity=1, completed_qty=1,
                unit_price_vnd=550000, status='HOANTHANH', price_mode='MUALE',
                discount_known=1, in_snapshot=1)


def upload(values, epoch=WINDOWS_EPOCH, folder=False):
    book = Workbook()
    book.epoch = epoch
    sheet = book.active
    sheet.title = 'CANONICAL'
    sheet.append(list(values))
    sheet.append(list(values.values()))
    buffer = io.BytesIO()
    book.save(buffer)
    return ingest_file(dict(name='audit.xlsx', folder=folder,
                           content=base64.b64encode(buffer.getvalue()).decode('ascii')))


class InputAudit(unittest.TestCase):
    def test_file_without_visible_order_id(self):
        parsed = upload(row())
        self.assertEqual(len(parsed['rows']), 1)
        self.assertTrue(parsed['rows'][0]['order_id'].startswith('LOCAL-'))
        self.assertEqual(parsed['rows'][0]['source_row'], 2)

    def test_file_and_folder_have_same_internal_identity(self):
        self.assertEqual(upload(row())['rows'][0]['order_id'],
                         upload(row(), folder=True)['rows'][0]['order_id'])

    def test_existing_identity_is_preserved(self):
        self.assertEqual(upload(dict(row(), order_id='EXISTING-001'))['rows'][0]['order_id'], 'EXISTING-001')

    def test_excel_epoch_styled_and_numeric(self):
        expected = '2026-10-01T08:30:00.000+07:00'
        stamp = datetime(2026, 10, 1, 8, 30)
        for epoch in (WINDOWS_EPOCH, MAC_EPOCH):
            for styled in (True, False):
                with self.subTest(epoch=epoch, styled=styled):
                    value = stamp if styled else to_excel(stamp, epoch)
                    values = dict(row(), order_id='DATE-001', ordered_at=value,
                                  completed_at=value, result_returned_at=value)
                    parsed = upload(values, epoch=epoch)['rows'][0]
                    for key in ('ordered_at', 'completed_at', 'result_returned_at'):
                        self.assertEqual(parsed[key], expected)
                    self.assertEqual(parsed['unit_price_vnd'], 550000)

    def test_missing_business_columns_still_rejected(self):
        with self.assertRaisesRegex(ValueError, 'thiếu cột'):
            upload({'patient_id': 'AUDIT-001'})


if __name__ == '__main__':
    unittest.main()
