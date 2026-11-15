"""One-time download from VinAI and conversion; never used during dictation."""
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.environ['HF_HOME'] = str(ROOT / '.speech-cache')
os.environ['HF_HUB_DISABLE_XET'] = '1'
from huggingface_hub import snapshot_download
from ctranslate2.converters import TransformersConverter

source = snapshot_download('vinai/PhoWhisper-base', revision='7ebdb9e88f5cc5271fb88f4d642c82ff9388650e', allow_patterns=[
    '*.json', 'model.safetensors', 'pytorch_model.bin', '*.txt', 'README.md', 'LICENSE*'
])
target = ROOT / 'speech-models' / 'phowhisper-base-int8'
if not (target / 'READY').exists():
    TransformersConverter(source, copy_files=['tokenizer.json', 'preprocessor_config.json']).convert(
        str(target), quantization='int8', force=True)
    shutil.copyfile(ROOT / 'docs' / 'PhoWhisper-LICENSE.txt', target / 'LICENSE.txt')
    (target / 'READY').write_text('vinai/PhoWhisper-base\n7ebdb9e88f5cc5271fb88f4d642c82ff9388650e\nint8\n', encoding='utf-8')
print(f'Model ready: {target}')
