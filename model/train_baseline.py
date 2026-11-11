"""Offline categorical Naive Bayes baseline; Python standard library only.
This model predicts analytical service routing, never money or clinical decisions.
"""
import argparse
import collections
import json
import hashlib
import math
from pathlib import Path

LABELS = ['VU_INTERNAL', 'VU_OUTBOUND', 'VU_INBOUND', 'EXTERNAL_UNRELATED']
FEATURES = ['ordering_dept', 'performing_dept', 'performing_room', 'service_code', 'service_group', 'profile']

def tokens(row):
    features = row['features']
    if set(features) != set(FEATURES):
        raise ValueError('Feature allowlist mismatch; stop to avoid target or identity leakage')
    if any(v is not None and (not isinstance(v, str) or len(v) > 160) for v in features.values()):
        raise ValueError('Invalid structured feature')
    return [f'{k}={features[k]}' for k in FEATURES]

def train(rows, alpha=1.0):
    documents = collections.Counter()
    counts = {label: collections.Counter() for label in LABELS}
    vocab = set()
    for row in rows:
        label = row['label']
        documents[label] += 1
        for token in tokens(row):
            counts[label][token] += 1
            vocab.add(token)
    return {'algorithm': 'multinomial_naive_bayes', 'alpha': alpha, 'labels': LABELS,
            'documents': dict(documents), 'token_counts': {k: dict(v) for k, v in counts.items()},
            'vocabulary': sorted(vocab), 'features': FEATURES}

def predict(model, row):
    vocab = set(model['vocabulary'])
    scores = {}
    for label in LABELS:
        count = model['documents'].get(label, 0)
        prior = math.log((count + 1) / (sum(model['documents'].values()) + len(LABELS)))
        total = sum(model['token_counts'][label].values())
        scores[label] = prior + sum(math.log((model['token_counts'][label].get(t, 0) + model['alpha']) /
                                             (total + model['alpha'] * max(1, len(vocab))))
                                    for t in tokens(row) if t in vocab)
    return max(scores, key=scores.get)

def evaluate(model, rows):
    matrix = {label: {p: 0 for p in LABELS} for label in LABELS}
    for row in rows:
        matrix[row['label']][predict(model, row)] += 1
    total = len(rows)
    correct = sum(matrix[label][label] for label in LABELS)
    per_class = {}
    for label in LABELS:
        tp = matrix[label][label]
        actual = sum(matrix[label].values())
        predicted = sum(matrix[c][label] for c in LABELS)
        precision = tp / predicted if predicted else 0
        recall = tp / actual if actual else 0
        per_class[label] = {'support': actual, 'precision': precision, 'recall': recall,
                            'f1': 2 * precision * recall / (precision + recall) if precision + recall else 0}
    errors = total - correct
    # Observed zero error is not proof of zero population error. Rule-of-three is approximate.
    return {'examples': total, 'accuracy': correct / total if total else None,
            'error_percent': errors / total * 100 if total else None,
            'observed_below_0_05_percent': bool(total and errors / total * 100 < .05),
            'zero_error_approx_95pct_upper_bound_percent': min(100, 300 / total) if total and errors == 0 else None,
            'macro_f1': sum(m['f1'] for m in per_class.values()) / len(LABELS),
            'all_classes_present': all(m['support'] > 0 for m in per_class.values()),
            'per_class': per_class, 'confusion_matrix': matrix}

def run(dataset, output, allow_silver=False):
    raw = [json.loads(line) for line in Path(dataset).read_text(encoding='utf-8-sig').splitlines() if line.strip()]
    if not raw:
        raise ValueError('Empty dataset')
    seen, groups, profiles, rules = set(), {}, set(), set()
    for row in raw:
        if row['label'] not in LABELS or row['split'] not in ['train', 'validation', 'test']:
            raise ValueError('Invalid label or split')
        if row['example_id'] in seen:
            raise ValueError('Duplicate example_id')
        seen.add(row['example_id'])
        group = row['patient_group']
        if group in groups and groups[group] != row['split']:
            raise ValueError('Patient leakage across splits')
        groups[group] = row['split']
        profiles.add(row['features']['profile'])
        rules.add(row['rules_version'])
        tokens(row)
        if row['label_source'] != 'human_review' and not (allow_silver and row['label_source'] == 'synthetic_rule_silver' and row['synthetic'] is True):
            raise ValueError('Unreviewed labels: use human labels, or --allow-synthetic-silver for pipeline simulation')
    if len(profiles) != 1 or len(rules) != 1:
        raise ValueError('Mixed policy versions or room profiles')
    splits = {s: [r for r in raw if r['split'] == s] for s in ['train', 'validation', 'test']}
    if any(not rows for rows in splits.values()):
        raise ValueError('Need non-empty train, validation, test; collect more distinct patient groups')
    # Tune only on validation, evaluate held-out test once after selecting alpha.
    candidates = [train(splits['train'], alpha) for alpha in [.5, 1, 2]]
    model = max(candidates, key=lambda m: evaluate(m, splits['validation'])['macro_f1'])
    report = {'task': 'service_routing_classification', 'dataset_sha256': hashlib.sha256(Path(dataset).read_bytes()).hexdigest(), 'simulation_only': any(r['label_source'] != 'human_review' or r['synthetic'] for r in raw),
              'rules_version': next(iter(rules)), 'profile': next(iter(profiles)),
              'patient_groups': len(groups), 'splits': {s: len(rs) for s, rs in splits.items()},
              'validation': evaluate(model, splits['validation']), 'test': evaluate(model, splits['test']),
              'limits': 'No clinical or financial decisions. Synthetic/single-review labels are not clinical validation. Observed error is not a guarantee of hospital error <0.05%.'}
    folder = Path(output)
    folder.mkdir(parents=True, exist_ok=True)
    for filename, content in [('baseline-model.json', model), ('evaluation.json', report)]:
        target = folder / filename
        if target.exists():
            raise ValueError(f'Refuse to overwrite {target}; choose a new output directory')
    for filename, content in [('baseline-model.json', model), ('evaluation.json', report)]:
        (folder / filename).write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dataset')
    parser.add_argument('--output', required=True)
    parser.add_argument('--allow-synthetic-silver', action='store_true')
    args = parser.parse_args()
    print(json.dumps(run(args.dataset, args.output, args.allow_synthetic_silver), ensure_ascii=False, indent=2))
