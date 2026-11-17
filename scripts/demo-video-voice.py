import json,wave
from pathlib import Path
import onnxruntime as ort
from piper import PiperVoice,SynthesisConfig
from piper.config import PiperConfig
root=Path(__file__).resolve().parents[1]
out=root/'docs/demo-video';model=root/'.speech-cache/tts/vi_VN-vais1000-medium.onnx'
chapters=json.loads((out/'kich-ban.json').read_text(encoding='utf-8-sig'))
opt=ort.SessionOptions();opt.intra_op_num_threads=4;opt.inter_op_num_threads=1
voice=PiperVoice(session=ort.InferenceSession(str(model),sess_options=opt,providers=['CPUExecutionProvider']),config=PiperConfig.from_dict(json.loads(Path(str(model)+'.json').read_text(encoding='utf-8'))))
for i,ch in enumerate(chapters,1):
 target=out/f'loi-doc-{i:02}.wav'
 with wave.open(str(target),'wb') as w:voice.synthesize_wav(ch['text'],w,syn_config=SynthesisConfig(length_scale=1.04,noise_scale=.4,noise_w_scale=.5))
 with wave.open(str(target),'rb') as w:ch['audio_seconds']=w.getnframes()/w.getframerate()
 print(i,round(ch['audio_seconds'],1),flush=True)
(out/'timeline.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2),encoding='utf-8')
print('TOTAL',sum(c['audio_seconds'] for c in chapters),flush=True)
