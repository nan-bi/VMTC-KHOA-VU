import importlib.util
import tempfile
import json
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('baseline', Path(__file__).parents[1] / 'model' / 'train_baseline.py')
baseline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(baseline)

def example(n, split, label='VU_INTERNAL'):
    return {'schema_version': 1, 'example_id': str(n), 'patient_group': str(n), 'split': split,
            'features': {'ordering_dept': 'VU', 'performing_dept': 'VU', 'performing_room': None,
                         'service_code': 'SIM', 'service_group': 'Khám', 'profile': 'local-12'},
            'label': label, 'label_source': 'human_review', 'synthetic': True, 'rules_version': 'VU-ROUTING-1'}

class BaselineTests(unittest.TestCase):
    def run_data(self, rows, allow=False):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / 'data.jsonl'
            f.write_text('\n'.join(json.dumps(r) for r in rows), encoding='utf-8')
            return baseline.run(f, Path(d) / 'result', allow)

    def test_leakage_rejected(self):
        rows = [example(1, 'train'), example(2, 'validation'), example(3, 'test')]
        rows[2]['patient_group'] = rows[0]['patient_group']
        with self.assertRaisesRegex(ValueError, 'leakage'):
            self.run_data(rows)

    def test_silver_requires_opt_in(self):
        rows = [example(i, s) for i, s in enumerate(['train', 'validation', 'test'])]
        rows[0]['label_source'] = 'synthetic_rule_silver'
        with self.assertRaisesRegex(ValueError, 'Unreviewed'):
            self.run_data(rows)
        self.assertTrue(self.run_data(rows, True)['simulation_only'])

    def test_identity_or_target_feature_rejected(self):
        r = example(1, 'train')
        r['features']['patient_id'] = 'not-allowed'
        with self.assertRaisesRegex(ValueError, 'allowlist'):
            baseline.tokens(r)

    def test_empty_split_rejected(self):
        with self.assertRaisesRegex(ValueError, 'non-empty'):
            self.run_data([example(1, 'train')])

    def test_tiny_perfect_test_does_not_imply_population_accuracy(self):
        result = self.run_data([example(i, s) for i, s in enumerate(['train', 'validation', 'test'])])
        self.assertEqual(result['test']['error_percent'], 0)
        self.assertEqual(result['test']['zero_error_approx_95pct_upper_bound_percent'], 100)
        self.assertFalse(result['test']['all_classes_present'])

if __name__ == '__main__':
    unittest.main()
