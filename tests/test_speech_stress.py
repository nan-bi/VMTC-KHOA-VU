"""Check scoring and generated test evidence, without model/network dependencies."""
import csv
import hashlib
import importlib.util
from pathlib import Path
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('stress', ROOT/'scripts/evaluate-speech-stress.py')
stress = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stress)


class StressTests(unittest.TestCase):
    def test_edits_and_unicode(self):
        self.assertEqual(stress.distance(['a', 'b'], ['a', 'c', 'd']), 2)
        self.assertEqual(stress.metrics('Vú trái!', 'vú trái')['word_edits'], 0)
        self.assertEqual(stress.metrics('không thấy khối', 'thấy khối')['word_edits'], 1)

    def test_aliases_and_word_boundaries(self):
        self.assertEqual(stress.metrics('', 'Vú trái 2 cm', 'vú trái|hai xen ti mét~2 cm')['missing_anchors'], '')
        self.assertEqual(stress.metrics('', 'mười hai', 'hai mươi')['missing_anchors'], 'hai mươi')

    def test_empty_summary(self):
        result = stress.summary([])
        self.assertIsNone(result['wer'])
        self.assertEqual(result['rtf'], 0)
        self.assertEqual(stress.percentile([1, 2, 3], .5), 2)

    @unittest.skipUnless((ROOT/'speech-test-data/manifest.csv').exists(), 'Generate optional audio package first')
    def test_manifest_audio_integrity(self):
        root = ROOT/'speech-test-data'
        with (root/'manifest.csv').open(encoding='utf-8-sig', newline='') as f:
            rows = list(csv.DictReader(f))
        self.assertEqual(len(rows), 486)
        self.assertEqual(len({r['id'] for r in rows}), 486)
        self.assertEqual(sum(not r['reference'] for r in rows), 6)
        for row in rows:
            path = (root/row['audio']).resolve()
            self.assertTrue(path.is_relative_to(root/'audio'))
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), row['sha256'])
            with wave.open(str(path), 'rb') as audio:
                self.assertEqual((audio.getnchannels(), audio.getsampwidth(), audio.getframerate()), (1, 2, 16000))
                self.assertLessEqual(audio.getnframes()/16000, 29)
                self.assertAlmostEqual(audio.getnframes()/16000, float(row['seconds']), places=3)


if __name__ == '__main__':
    unittest.main()
