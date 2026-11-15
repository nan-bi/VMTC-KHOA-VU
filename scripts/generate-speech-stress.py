"""Local synthetic Vietnamese WAV matrix. Requires .speech-test-venv, no network calls."""
import argparse
import csv
import hashlib
import importlib.util
import math
from pathlib import Path
import wave
import numpy as np
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cases', Path(__file__).with_name('speech-test-cases.py'))
cases = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cases)
RATE = 16000

def read_wav(path):
    with wave.open(str(path), 'rb') as f:
        if f.getnchannels() != 1 or f.getsampwidth() != 2:
            raise ValueError('Expected mono PCM16')
        rate = f.getframerate()
        x = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(np.float32) / 32768
    divisor = math.gcd(rate, RATE)
    return resample_poly(x, RATE//divisor, rate//divisor).astype(np.float32)

def rms(x):
    return float(np.sqrt(np.mean(np.square(x, dtype=np.float64))))

def mix_snr(speech, noise, snr):
    # SNR is measured over the central utterance, before padding, not per-room SPL.
    scaled = noise * (rms(speech) / max(rms(noise), 1e-12)) / (10 ** (snr / 20))
    return speech + scaled

def ambient(length, kind, rng, chatter):
    t = np.arange(length) / RATE
    if kind == 'fan':
        white = rng.normal(0, 1, length)
        return sosfilt(butter(2, 900, fs=RATE, output='sos'), white) + .2*np.sin(2*np.pi*100*t)
    if kind == 'chatter':
        out = np.zeros(length)
        for offset, gain in [(0, 1), (6000, .6)]:
            out += gain*np.resize(np.roll(chatter, offset), length)
        return out
    out = rng.normal(0, .02, length)
    for position in range(0, length, 4100):
        width=min(500,length-position)
        out[position:position+width] += rng.normal(0,1,width)*np.exp(-np.arange(width)/90)
    for position in range(8000,length,24000):
        width=min(1800,length-position)
        out[position:position+width] += .3*np.sin(2*np.pi*1000*np.arange(width)/RATE)*np.hanning(width)
    return out

def save(path, values):
    peak = float(np.max(np.abs(values))) if len(values) else 0
    gain = min(1., .95/max(peak,1e-12))
    pcm=(np.clip(values*gain,-1,1)*32767).astype('<i2')
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm.tobytes())
    return len(pcm)/RATE, hashlib.sha256(path.read_bytes()).hexdigest(), gain

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=ROOT/'speech-test-data')
    args=parser.parse_args();out=args.out.resolve()
    if out.exists():
        raise SystemExit('Output already exists. Choose a NEW --out directory; no files overwritten.')
    model=ROOT/'.speech-cache/tts/vi_VN-vais1000-medium.onnx'
    if not model.exists():
        raise SystemExit('Missing local Piper voice. See scripts/speech-test-requirements.txt and README.')
    from piper import PiperVoice, SynthesisConfig
    import onnxruntime as ort
    import json
    from piper.config import PiperConfig
    # Use documented PiperVoice constructor with bounded ONNX CPU threads.
    options=ort.SessionOptions();options.intra_op_num_threads=4;options.inter_op_num_threads=1
    voice=PiperVoice(session=ort.InferenceSession(str(model),sess_options=options,providers=['CPUExecutionProvider']),
                     config=PiperConfig.from_dict(json.loads(Path(str(model)+'.json').read_text(encoding='utf-8'))))
    cache=ROOT/'.speech-cache/tts-generated';cache.mkdir(exist_ok=True)
    def synth(text, scale):
        key=hashlib.sha256((text+str(scale)+hashlib.sha256(model.read_bytes()).hexdigest()).encode()).hexdigest()[:20]
        path=cache/f'{key}.wav'
        if not path.exists():
            with wave.open(str(path),'wb') as audio:
                voice.synthesize_wav(text,audio,syn_config=SynthesisConfig(length_scale=scale,noise_scale=.4,noise_w_scale=.5))
        return read_wav(path)
    chatter=synth('Mời anh chị ngồi đợi bên ngoài. Hôm nay trời đẹp. Chiều nay chúng ta gặp lại.',1.0)
    out.mkdir();(out/'audio').mkdir()
    rows=[]
    for i,(category,text,anchors) in enumerate(cases.CASES,1):
        sources={scale:synth(text,scale) for scale in {p[1] for p in cases.PROFILES}}
        for j,(profile,scale,kind,snr) in enumerate(cases.PROFILES):
            rng=np.random.default_rng(20261115+i*100+j)
            x=sources[scale].copy();noise=np.zeros(len(x))
            if kind in ('fan','keyboard','chatter'):
                noise=ambient(len(x),kind,rng,chatter)
                x=mix_snr(x,noise,snr)
            elif kind=='quiet':
                x*=.126 # about -18 dB relative amplitude
            elif kind=='reverb':
                impulse=np.zeros(4800);impulse[0]=1;impulse[800]=.42;impulse[1700]=.25;impulse[3200]=.13
                x=fftconvolve(x,impulse)[:len(x)]
                x=sosfilt(butter(3,2500,fs=RATE,output='sos'),x)*.35
            # Leading/trailing 0.4s silence ensures final audio is present in files.
            x=np.pad(x,(6400,6400))
            if len(x)>29*RATE:
                raise ValueError(f'Utterance too long; do not silently truncate {i}/{profile}')
            name=f'GIA-{i:03}-{profile}'
            duration,sha,gain=save(out/'audio'/f'{name}.wav',x)
            rows.append(dict(id=name,case_id=f'GIA-{i:03}',category=category,profile=profile,
                audio=f'audio/{name}.wav',reference=text,anchors=anchors,seconds=f'{duration:.4f}',
                length_scale=scale,snr_db='' if snr is None else snr,sha256=sha,peak_gain=f'{gain:.6f}',
                background_words='Mời anh chị ngồi đợi bên ngoài. Hôm nay trời đẹp. Chiều nay chúng ta gặp lại.' if kind=='chatter' else '',
                synthetic='yes',human_verified='no'))
        print(f'Generated case {i}/{len(cases.CASES)} ({len(rows)} WAV)',flush=True)
    for i,kind in enumerate(['silence','fan','keyboard','very_short_silence','silence_29s','noise_29s']):
        length=int((.2 if kind=='very_short_silence' else 29 if kind.endswith('29s') else 8)*RATE)
        rng=np.random.default_rng(20261115+i)
        x=np.zeros(length) if 'silence' in kind else ambient(length,'fan' if kind=='noise_29s' else kind,rng,chatter)*.04
        name=f'CONTROL-{kind}';duration,sha,gain=save(out/'audio'/f'{name}.wav',x)
        rows.append(dict(id=name,case_id='CONTROL',category='khong_co_loi_noi',profile=kind,audio=f'audio/{name}.wav',reference='',anchors='',seconds=f'{duration:.4f}',length_scale='',snr_db='',sha256=sha,peak_gain=gain,background_words='',synthetic='yes',human_verified='no'))
    with (out/'manifest.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    (out/'NGUON.md').write_text(f'''# Nguồn bộ thử tổng hợp\n\nGiọng: vi_VN-vais1000-medium, một giọng TTS; không gán thành giọng bác sĩ/vùng miền thật.\nPiper 1.8.0: https://github.com/OHF-Voice/piper1-gpl (GPL-3.0).\nModel card: https://huggingface.co/rhasspy/piper-voices/blob/main/vi/vi_VN/vais1000/medium/MODEL_CARD\nDataset VAIS1000: model card ghi CC BY 4.0. Ghi nhận tác giả/model: VAIS1000 corpus, Rhasspy/Piper voice contributors.\nModel SHA256: {hashlib.sha256(model.read_bytes()).hexdigest()}\nNội dung câu: tự soạn, ca giả lập; không có dữ liệu người bệnh. Tiếng ồn: sinh bằng NumPy/SciPy; giọng nền cũng TTS.\nBiến thể tốc độ dùng length_scale Piper; không tương đương cách luyến âm thật. Các seed tiếng ồn cố định; WAV có SHA256; bản thân TTS có thành phần ngẫu nhiên và đã cache bản nguồn.\nSNR tính trên toàn đoạn câu nguồn trước khi đệm, cùng gain chống clipping cho hỗn hợp; không phải độ ồn đo tại phòng khám.\nCác câu có nói chồng: reference chỉ là lời mục tiêu. Ứng dụng hiện chép tất cả lời nói nên việc chép cả giọng nền được báo riêng, không coi là lỗi crash hay đã tách người nói.\nCác file này CHỈ để test; human_verified=no, không dùng làm dữ liệu huấn luyện có nhãn thật.\n''',encoding='utf-8')
    print(f'DONE: {len(rows)} files, {sum(float(r["seconds"]) for r in rows)/60:.1f} minutes at {out}',flush=True)

if __name__=='__main__':
    main()
