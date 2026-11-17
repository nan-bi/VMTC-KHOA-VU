import json, re, subprocess, wave, array, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1];out=root/'docs/demo-video'
ff=next((root/'.speech-test-venv/Lib/site-packages/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
video=out/'DEMO_DASHBOARD_KHOA_VU.mp4'
info=subprocess.run([str(ff),'-hide_banner','-i',str(video)],capture_output=True,text=True,encoding='utf-8',errors='replace').stderr
(out/'thong-tin-codec.txt').write_text(info,encoding='utf-8')
m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',info);duration=int(m[1])*3600+int(m[2])*60+float(m[3])
assert 180<=duration<=300, duration
assert 'Video: h264' in info and 'Audio: aac' in info
check=subprocess.run([str(ff),'-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True,encoding='utf-8',errors='replace')
assert check.returncode==0 and not check.stderr.strip(),check.stderr
with wave.open(str(out/'thuyet-minh.wav'),'rb') as w:
 assert w.getsampwidth()==2
 samples=array.array('h',w.readframes(w.getnframes()));peak=max(abs(x) for x in samples);rms=math.sqrt(sum(x*x for x in samples)/len(samples))
 assert rms>100
shots=[]
for i,t in enumerate([5,45,87,126,183,221]):
 target=out/f'kiem-tra-khung-{i+1}.jpg'
 subprocess.run([str(ff),'-y','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-q:v','2',str(target)],check=True)
 shots.append(target)
montage=Image.new('RGB',(1440,3*430),'white');d=ImageDraw.Draw(montage);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',20)
for i,p in enumerate(shots):
 im=Image.open(p);im.thumbnail((720,405));x=i%2*720;y=i//2*430;montage.paste(im,(x,y));d.text((x+12,y+405),f'Khung {i+1}',font=font,fill='black')
montage.save(out/'kiem-tra-video.jpg',quality=90)
result={'duration_seconds':duration,'resolution':'1920x1080','video':'H.264','audio':'AAC','decode_full_video':'passed','audio_source_rms':round(rms,2),'audio_source_peak':peak,'bytes':video.stat().st_size,'sample_frames':6,'clinical_accuracy_claim':False}
(out/'kiem-tra-video.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False),flush=True)
