"""One-time official VinAI download/conversion; never used during dictation."""
import argparse
import os
import shutil
from pathlib import Path
from speech_config import ROOT, profile, model_path
parser = argparse.ArgumentParser()
parser.add_argument('--model', choices=['base', 'small'])
args = parser.parse_args()
selected = profile(args.model)
os.environ['HF_HOME'] = str(ROOT / '.speech-cache')
os.environ['HF_HUB_DISABLE_XET'] = '1'
from huggingface_hub import snapshot_download
from ctranslate2.converters import TransformersConverter
target = model_path(selected)
expected = selected['repository'] + '\n' + selected['revision'] + '\nint8\n'
if not ((target / 'READY').exists() and (target / 'READY').read_text(encoding='utf-8') == expected):
    source = snapshot_download(selected['repository'], revision=selected['revision'], max_workers=1, allow_patterns=[
        '*.json', 'model.safetensors', 'pytorch_model.bin', '*.txt', 'README.md', 'LICENSE*'
    ])
    target.mkdir(parents=True, exist_ok=True)
    (target / 'READY').unlink(missing_ok=True)
    TransformersConverter(source, copy_files=['tokenizer.json', 'preprocessor_config.json']).convert(
        str(target), quantization='int8', force=True)
    shutil.copyfile(ROOT / 'docs/PhoWhisper-LICENSE.txt', target / 'LICENSE.txt')
    (target / 'READY').write_text(expected, encoding='utf-8')
print(f'Model ready: {target}')
