import importlib.util
from pathlib import Path
import unittest
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ultrasound_eval',ROOT/'scripts/evaluate-ultrasound-speech.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class EvaluationTests(unittest.TestCase):
    def test_split_by_case_deterministic(self):
        cases=[{'id':f'US-{i:03}'} for i in range(65)]
        self.assertEqual(len(m.split_cases(cases)),20)
        self.assertEqual(m.split_cases(cases),m.split_cases(list(reversed(cases))))
    def test_invalid_source_anchor_is_disclosed(self):
        valid,invalid=m.valid_anchors('Vú trái không thấy khối.','vú trái|không thấy khối|vú phải')
        self.assertEqual(valid,'vú trái|không thấy khối');self.assertEqual(invalid,['vú phải'])
    def test_stream_keeps_all_samples_once(self):
        for values in [np.zeros(16000*22),np.full(16000*22,.15),np.r_[np.ones(16000)*.2,np.zeros(16000),np.ones(16000)*.2]]:
            chunks=list(m.audio_segments(values))
            np.testing.assert_array_equal(np.concatenate(chunks),values)
            self.assertTrue(all(0<len(c)<=8*16000+4096 for c in chunks))
    def test_selection_rejects_extra_false_speech_or_anchor_flags(self):
        def result(wer,flags=1,false=0):return {'summary':{'wer':wer,'cer':10,'seconds':1,'false_speech':false,'anchor_flagged':flags}}
        values={'current':result(10),'a':result(1,false=1),'b':result(2,flags=2),'c':result(8)}
        self.assertEqual(m.choose_candidate(values),'c')
    def test_silence_not_added_to_wer_denominator(self):
        rows=[dict(reference='hai',hypothesis='ba',ref_words=1,word_edits=1,ref_chars=3,char_edits=2,missing_anchors='hai',seconds=2,wall_seconds=1),dict(reference='',hypothesis='chữ bịa',ref_words=0,word_edits=2,ref_chars=0,char_edits=6,missing_anchors='',seconds=3,wall_seconds=1)]
        s=m.summarize(rows);self.assertEqual(s['wer'],100);self.assertEqual(s['false_speech'],1)
class ReportTests(unittest.TestCase):
    def test_anchor_flags_separate_side_negation_and_units(self):
        spec=importlib.util.spec_from_file_location('ultrasound_report_risk',ROOT/'scripts/report-ultrasound-evaluation.py')
        report=importlib.util.module_from_spec(spec);spec.loader.exec_module(report)
        rows=[dict(id='a',reference='vú trái không có khối',anchors='vú trái|không có khối|bi rát bốn a~bi rads 4a|mười hai mi li mét',missing_anchors='vú trái | mười hai mi li mét')]
        flags=report.anchor_risks(rows)
        self.assertEqual(flags['Bên trái/phải']['missing_groups'],1)
        self.assertEqual(flags['Phủ định']['missing_groups'],0)
        self.assertEqual(flags['BI-RADS']['missing_groups'],0)
        self.assertEqual(flags['Số / đơn vị / thời gian']['missing_groups'],1)
    def test_paired_bootstrap_stays_paired_by_case(self):
        spec=importlib.util.spec_from_file_location('ultrasound_report',ROOT/'scripts/report-ultrasound-evaluation.py')
        report=importlib.util.module_from_spec(spec);spec.loader.exec_module(report)
        baseline=[dict(case_id='a',reference='a',word_edits=1,ref_words=1),dict(case_id='b',reference='b',word_edits=1,ref_words=1)]
        improved=[dict(case_id='b',reference='b',word_edits=0,ref_words=1),dict(case_id='a',reference='a',word_edits=0,ref_words=1)]
        self.assertEqual(report.paired_interval(baseline,improved,100),[-100,-100])
        with self.assertRaises(ValueError):report.paired_interval(baseline,improved[:1])
if __name__=='__main__':unittest.main()
