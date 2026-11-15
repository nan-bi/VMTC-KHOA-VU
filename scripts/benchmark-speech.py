"""Usage: python scripts/benchmark-speech.py public-test.wav (local server required)."""
import io
import json
import sys
import time
import urllib.request
import wave
from pathlib import Path
import numpy as np
from faster_whisper.audio import decode_audio

samples = decode_audio(sys.argv[1], sampling_rate=16000)
def wav(values):
    body = io.BytesIO()
    with wave.open(body, 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(16000)
        audio.writeframes((np.clip(values, -1, 1) * 32767).astype('<i2').tobytes())
    return body.getvalue()

results = []
for values in [samples, samples, samples, np.zeros(16000 * 3)]:
    start = time.perf_counter()
    request = urllib.request.Request('http://127.0.0.1:4173/speech-api/transcribe',
        data=wav(values), headers={'Content-Type': 'audio/wav'})
    result = json.load(urllib.request.urlopen(request, timeout=120))
    result['roundtrip'] = round(time.perf_counter() - start, 3)
    result['duration'] = len(values) / 16000
    print(json.dumps(result, ensure_ascii=True), flush=True)
    results.append(result)
Path('.speech-cache/benchmark.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
assert results[-1]['text'] == '', 'Silence must not fabricate a transcript'
