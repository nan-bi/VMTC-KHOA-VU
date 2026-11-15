import csv
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest
import wave

spec = importlib.util.spec_from_file_location('validator', Path(__file__).resolve().parents[1] / 'scripts/validate-speech-training.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ValidateTests(unittest.TestCase):
    def make(self, root, overrides=None, silent=False):
        (root/'audio').mkdir(exist_ok=True)
        row = dict(zip(module.COLUMNS, ['S01','audio/S01.wav','BS01','B01','train','VU-001','thuong','yen_tinh','Vú phải không thấy khối.','yes','yes']))
        row.update(overrides or {})
        with wave.open(str(root/'audio/S01.wav'), 'wb') as audio:
            audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(16000)
            audio.writeframes(struct.pack('<h', 0 if silent else 2000)*32000)
        manifest = root/'manifest.csv'
        with manifest.open('w', encoding='utf-8-sig', newline='') as handle:
            writer=csv.DictWriter(handle,fieldnames=module.COLUMNS);writer.writeheader();writer.writerow(row)
        return manifest

    def test_valid_partial_but_not_training_ready(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path=self.make(root)
            self.assertEqual(module.validate([path],root,False)[1],[])
            self.assertTrue(module.validate([path],root,True)[1])

    def test_unreviewed_and_silent_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path=self.make(root,{'reviewed':'no'},silent=True)
            rows,errors,_,_=module.validate([path],root,False)
            self.assertFalse(rows);self.assertGreaterEqual(len(errors),2)

    def test_outside_audio_and_duplicates_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path=self.make(root,{'audio':'../S01.wav'})
            self.assertTrue(module.validate([path],root,False)[1])
            path=self.make(root)
            self.assertTrue(module.validate([path,path],root,False)[1])

    def test_session_cannot_leak_into_test(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path=self.make(root)
            contents=path.read_text(encoding='utf-8-sig');other=root/'other.csv'
            other.write_text(contents.replace('S01,','S02,',1).replace(',train,',',test,'),encoding='utf-8-sig')
            errors=module.validate([path,other],root,False)[1]
            self.assertTrue(any('buổi thu' in e for e in errors))

if __name__ == '__main__':
    unittest.main()
