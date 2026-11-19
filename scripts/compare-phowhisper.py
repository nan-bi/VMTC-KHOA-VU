"""Small fixed synthetic evaluation; no patient input or model training."""
import argparse
import csv
import gc
import importlib.util
import json
from pathlib import Path
import time
from faster_whisper import WhisperModel
from speech_config import ROOT, profile, model_path, decode_options
spec = importlib.util.spec_from_file_location('scoring', ROOT / 'scripts/evaluate-speech-stress.py')
scoring = importlib.util.module_from_spec(spec); spec.loader.exec_module(scoring)
with (ROOT / 'speech-test-data/manifest.csv').open(encoding='utf-8-sig') as f:
    manifest = list(csv.DictReader(f))
# Fixed before inference; include both sides, measurements, BI-RADS, noise and silence.
clean = [r for r in manifest if r['profile'] == 'sach'][:6]
ids = {r['case_id'] for r in clean[:2]}
noisy = [r for r in manifest if r['case_id'] in ids and r['profile'] == 'quat_snr10']
controls = [r for r in manifest if not r['reference']][:1]
rows = clean + noisy + controls
out = ROOT / '.speech-cache/phowhisper-comparison.json'
parser = argparse.ArgumentParser()
parser.add_argument('--models', nargs='+', choices=['base','small'], default=['base','small'])
parser.add_argument('--append', action='store_true')
args = parser.parse_args()
results = json.loads(out.read_text(encoding='utf-8')) if args.append and out.exists() else []
results = [r for r in results if r['model'] not in args.models]
for name in args.models:
    beam = 1 if name == 'base' else 5
    selected = profile(name)
    model = WhisperModel(str(model_path(selected)), device='cpu', compute_type='int8', cpu_threads=4, num_workers=1, local_files_only=True)
    samples = []
    for row in rows:
        started = time.perf_counter()
        opts = decode_options(True); opts['beam_size'] = beam
        segments, _ = model.transcribe(str(ROOT / 'speech-test-data' / row['audio']), **opts)
        text = ' '.join(s.text.strip() for s in segments).strip()
        samples.append(dict(id=row['id'], reference=row['reference'], text=text,
            seconds=round(time.perf_counter()-started, 3), duration=float(row['seconds']),
            **scoring.metrics(row['reference'], text, row['anchors'])))
        print(name, row['id'], flush=True)
    n = sum(x['ref_words'] for x in samples if x['reference'])
    c = sum(x['ref_chars'] for x in samples if x['reference'])
    results.append(dict(model=name, beam=beam, revision=selected['revision'], samples=samples,
        wer=100*sum(x['word_edits'] for x in samples if x['reference'])/n,
        cer=100*sum(x['char_edits'] for x in samples if x['reference'])/c,
        seconds=sum(x['seconds'] for x in samples),
        false_speech=sum(bool(x['text']) for x in samples if not x['reference'])))
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    del model; gc.collect()
print(json.dumps([{k:v for k,v in r.items() if k!='samples'} for r in results]), flush=True)
