import json, wave, subprocess, math, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/demo-video'
FF=next((ROOT/'.speech-test-venv/Lib/site-packages/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
chapters=json.loads((OUT/'timeline.json').read_text(encoding='utf-8-sig'))
captures=json.loads((OUT/'frames/captures.json').read_text(encoding='utf-8'))
W,H,FPS=1920,1080,6
font=lambda size,bold=False:ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',size)
f_title,f_step,f_sub,f_small=font(37,True),font(24),font(30),font(20)
PINK='#b85579'; DARK='#3c2931'
def wrap(text,fo,width):
 words=text.split(); lines=[]; line=''
 for word in words:
  trial=(line+' '+word).strip()
  if fo.getlength(trial)>width and line: lines.append(line); line=word
  else: line=trial
 if line: lines.append(line)
 return lines

def captions(text):
 # Keep subtitle cues around 16 words; split on sentence endings where practical.
 words=text.split(); groups=[]; buf=[]
 for word in words:
  buf.append(word)
  if len(buf)>=17 or (len(buf)>=9 and word[-1] in '.;:?!'):
   groups.append(' '.join(buf));buf=[]
 if buf:groups.append(' '.join(buf))
 return groups

with wave.open(str(OUT/'loi-doc-01.wav'),'rb') as src:
 params=src.getparams(); rate=src.getframerate(); channels=src.getnchannels(); width=src.getsampwidth()
start=0; srt=[]; cue_index=1
for n,ch in enumerate(chapters,1):
 ch['start']=start
 ch['duration']=math.ceil((ch['audio_seconds']+2.5)*FPS)/FPS
 ch['cues']=captions(ch['text']); total=sum(len(x.split()) for x in ch['cues']); consumed=0; ch['cue_times']=[]
 for txt in ch['cues']:
  a=start+.7+ch['audio_seconds']*consumed/total;consumed+=len(txt.split());b=start+.7+ch['audio_seconds']*consumed/total
  ch['cue_times'].append((a-start,b-start,txt));srt.append((cue_index,a,b,txt));cue_index+=1
 start+=ch['duration']
with wave.open(str(OUT/'thuyet-minh.wav'),'wb') as dst:
 dst.setnchannels(channels);dst.setsampwidth(width);dst.setframerate(rate)
 for n,ch in enumerate(chapters,1):
  with wave.open(str(OUT/f'loi-doc-{n:02}.wav'),'rb') as src:audio=src.readframes(src.getnframes())
  lead=round(.7*rate);target=round(ch['duration']*rate);samples=len(audio)//(width*channels)
  dst.writeframes(b'\0'*(lead*width*channels)+audio+b'\0'*((target-lead-samples)*width*channels))
def stamp(sec):
 ms=round(sec*1000);hh,ms=divmod(ms,3600000);mm,ms=divmod(ms,60000);ss,ms=divmod(ms,1000)
 return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'
(OUT/'phu-de.srt').write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t}' for i,a,b,t in srt)+'\n',encoding='utf-8')
(OUT/'kich-ban.md').write_text('# Kịch bản video Dashboard Khoa Vú\n\nThuyết minh tổng hợp bằng Piper tiếng Việt, chạy local. Dữ liệu kiểm thử riêng; không phải bảng giá hay doanh thu chính thức. Video ghép từ các cảnh thao tác thực tế, có dừng hình theo lời đọc. Mục speech chỉ giới thiệu giao diện.\n\n'+'\n\n'.join(f"## {i}. {c['title']} ({stamp(c['start'])})\n\n{c['step']}\n\n{c['text']}" for i,c in enumerate(chapters,1)),encoding='utf-8')
# Contact sheet for reviewing captured scenes.
sheet=Image.new('RGB',(1280,12*210),'white');sd=ImageDraw.Draw(sheet)
for n,ch in enumerate(chapters,1):
 frames=[c for c in captures if c['chapter']==n]
 if n==12:frames=frames[12:]
 for k,idx in enumerate([0,len(frames)//2,len(frames)-1]):
  im=Image.open(OUT/'frames'/frames[idx]['file']).convert('RGB');im.thumbnail((410,175));sheet.paste(im,(k*425,(n-1)*210+30))
 sd.text((10,(n-1)*210),f'{n:02} {ch["title"]}',font=font(20,True),fill=DARK)
sheet.save(OUT/'kiem-tra-canh.jpg',quality=85)
cmd=[str(FF),'-y','-hide_banner','-loglevel','warning','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(OUT/'thuyet-minh.wav'),'-c:v','libx264','-preset','fast','-crf','22','-threads','4','-r','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-t',str(start),'-movflags','+faststart',str(OUT/'DEMO_DASHBOARD_KHOA_VU.mp4')]
with (OUT/'ghep-video.log').open('w',encoding='utf-8') as log:
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=log,stderr=log)
 for n,ch in enumerate(chapters,1):
  frames=[c for c in captures if c['chapter']==n]
  if n==12:frames=frames[12:]
  cached_key=None;image_bytes=None
  frame_count=round(ch['duration']*FPS)
  for f in range(frame_count):
   t=f/FPS
   # Spread UI captures across narration, preserving chronological changes.
   idx=min(len(frames)-1,int(t/max(.01,ch['duration']-1)*len(frames)))
   sub=next((txt for a,b,txt in ch['cue_times'] if a<=t<b),'')
   ending=n==12 and t>9
   key=(idx,sub,ending)
   if key!=cached_key:
    canvas=Image.new('RGB',(W,H),'#fff7fa');d=ImageDraw.Draw(canvas)
    d.rounded_rectangle((24,16,84,76),radius=30,fill=PINK);d.text((54,45),f'{n:02}',anchor='mm',font=font(25,True),fill='white')
    d.text((102,9),ch['title'],font=f_title,fill=DARK)
    d.text((104,55),ch['step'],font=f_step,fill='#755462')
    d.text((W-30,30),'DỮ LIỆU KIỂM THỬ · THUYẾT MINH TỔNG HỢP',anchor='ra',font=f_small,fill='#875b6d')
    screenshot=Image.open(OUT/'frames'/frames[idx]['file']).convert('RGB').resize((1536,864),Image.Resampling.LANCZOS)
    canvas.paste(screenshot,(192,92));d.rounded_rectangle((190,90,1730,958),radius=8,outline='#e7ced9',width=2)
    if ending:
     d.rounded_rectangle((360,210,1560,800),radius=28,fill='#ffffff',outline='#e9bace',width=3)
     d.text((960,265),'Từ dữ liệu đến báo cáo',anchor='mm',font=font(48,True),fill=PINK)
     lines=['Nhập → Đối soát → Tính → Duyệt → Xuất','170 dòng nhập · 17 dịch vụ trong ngày minh họa','7.400.000 đồng sau giảm đã biết','255 kiểm thử Node · 61 kiểm thử Python','Nghiệp vụ, bảng giá và độ chính xác cần khoa xác nhận']
     for k,line in enumerate(lines):d.text((960,355+k*78),line,anchor='mm',font=font(30,k==2),fill=DARK)
    d.rounded_rectangle((140,972,1780,1068),radius=15,fill='#fff')
    lines=wrap(sub,f_sub,1550)
    for k,line in enumerate(lines[:2]):d.text((960,995+k*37),line,anchor='mm',font=f_sub,fill=DARK)
    d.rectangle((0,1075,int(W*(ch['start']+t)/start),1080),fill=PINK)
    image_bytes=canvas.tobytes();cached_key=key
    if n==7 and f==frame_count//2:canvas.save(OUT/'thumbnail.jpg',quality=92)
   proc.stdin.write(image_bytes)
  print(f'CHAPTER {n}/12 rendered',flush=True)
 proc.stdin.close();code=proc.wait()
 if code:raise RuntimeError(f'ffmpeg failed: {code}')
(OUT/'video-metadata.json').write_text(json.dumps({'duration_seconds':start,'width':W,'height':H,'fps':24,'chapters':[{'title':c['title'],'start':c['start'],'duration':c['duration']} for c in chapters],'source_frames':len(captures),'voice':'Piper vi_VN-vais1000-medium, offline synthetic narration','footage':'Real dashboard screen captures edited into narrated scenes; speech UI demonstration only'},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'DONE {start:.2f} seconds',flush=True)
