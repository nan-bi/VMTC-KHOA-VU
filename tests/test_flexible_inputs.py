import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'/'python'))
from quality_check import evaluate_quality

class QualityTests(unittest.TestCase):
    def rows(self,n=2):
        return [dict(source_file='source.csv',source_sheet='Sheet1',source_row=i+2,service_code='US',service_name='Siêu âm',ordering_dept='VU',performing_dept='VU',completed_qty=1,unit_price_vnd=100,status='HOANTHANH',in_snapshot=1,price_mode='MUALE',package_id=None) for i in range(n)]
    def standards(self,rows):
        return [dict(source_file=r['source_file'],source_sheet=r['source_sheet'],source_row=r['source_row'],expected_service_code=r['service_code'],expected_route='VU_INTERNAL',expected_revenue_vnd=100) for r in rows]
    def test_threshold_is_strict_percent_not_fraction(self):
        rows=self.rows(2000);gold=self.standards(rows);gold[0]['expected_service_code']='OTHER'
        result=evaluate_quality(rows,gold);self.assertEqual(result['classificationErrorPercent'],0.05);self.assertFalse(result['passed'])
        rows=self.rows(2001);gold=self.standards(rows);gold[0]['expected_service_code']='OTHER'
        self.assertTrue(evaluate_quality(rows,gold)['passed'])
    def test_opposing_financial_errors_never_cancel(self):
        rows=self.rows();gold=self.standards(rows);gold[0]['expected_revenue_vnd']=90;gold[1]['expected_revenue_vnd']=110
        result=evaluate_quality(rows,gold);self.assertEqual(result['absoluteRevenueErrorVnd'],20);self.assertEqual(result['revenueErrorPercent'],10);self.assertFalse(result['passed'])
    def test_unknown_department_is_pending_until_reviewed(self):
        rows=self.rows(1);gold=self.standards(rows);rows[0]['ordering_dept']='Đơn vị chưa có';rows[0]['performing_dept']='Phòng chưa có'
        result=evaluate_quality(rows,gold);self.assertFalse(result['passed']);self.assertIsNone(result['revenueErrorPercent'])
        examples=[dict(ordering_dept=rows[0]['ordering_dept'],performing_dept=rows[0]['performing_dept'],label='VU_INTERNAL',reason='Khoa xác nhận cặp khoa này')]
        self.assertTrue(evaluate_quality(rows,gold,dict(routingExamples=examples))['passed'])
    def test_missing_duplicate_source_and_missing_price_cannot_pass(self):
        rows=self.rows();gold=self.standards(rows)
        self.assertFalse(evaluate_quality(rows[:1],gold)['passed'])
        self.assertFalse(evaluate_quality(rows+[rows[0]],gold)['passed'])
        rows[0]['unit_price_vnd']=None
        result=evaluate_quality(rows,gold);self.assertFalse(result['passed']);self.assertEqual(result['unavailableRevenueRows'],1)
        with self.assertRaises(ValueError):evaluate_quality(rows,gold+[gold[0]])
    def test_zero_standard_is_defined_only_for_exact_zero(self):
        rows=self.rows(1);gold=self.standards(rows);gold[0]['expected_revenue_vnd']=0;rows[0]['unit_price_vnd']=0
        self.assertTrue(evaluate_quality(rows,gold)['passed'])
        rows[0]['unit_price_vnd']=1
        self.assertFalse(evaluate_quality(rows,gold)['passed'])

if __name__=='__main__':unittest.main()
