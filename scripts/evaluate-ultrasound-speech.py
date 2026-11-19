"""Independent synthetic evaluation from a supplied ultrasound JSON, no patient DB access.
Generate with .speech-test-venv; evaluate with .speech-venv. Never trains ASR.
"""
import argparse
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import time
import wave
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
spec=importlib.util.spec_from_file_location('score',ROOT/'scripts/evaluate-speech-stress.py')
score=importlib.util.module_from_spec(spec);spec.loader.exec_module(score)
OUT=ROOT/'.speech-cache/ultrasound-evaluation-20261118'
GLOSSARY='Siêu âm tuyến vú, nhu mô, giảm âm, trống âm, hạch nách, vỏ hạch, dây chằng Cooper, Doppler, BI-RADS, mi li mét, xen ti mét.'
CANDIDATES={'current':{'beam_size':5},'beam10':{'beam_size':10},'vocabulary':{'beam_size':5,'initial_prompt':GLOSSARY}}

def split_cases(cases):
    # Predeclared split by source case, never by augmented audio.
    ids=sorted((r['id'] for r in cases),key=lambda x:hashlib.sha256(('ultrasound-20261118:'+x).encode()).hexdigest())
    return set(ids[:20])

def valid_anchors(reference,anchors):
    good=[];bad=[]
    for group in filter(None,anchors.split('|')):
        (bad if score.metrics(reference,reference,group)['missing_anchors'] else good).append(group)
    return '|'.join(good),bad

def generate(source):
    import numpy as np
    import onnxruntime as ort
    from piper import PiperVoice,SynthesisConfig
    from piper.config import PiperConfig
    spec=importlib.util.spec_from_file_location('audio_tools',ROOT/'scripts/generate-speech-stress.py')
    audio=importlib.util.module_from_spec(spec);spec.loader.exec_module(audio)
    cases=json.loads(source.read_text(encoding='utf-8-sig'))
    if len({r['id'] for r in cases})!=len(cases):raise ValueError('Duplicate case IDs')
    # Check only JSON text; do not execute code supplied with the source folder.
    if any(not isinstance(r.get('spoken_text'),str) or not r['spoken_text'].strip() for r in cases):raise ValueError('Missing spoken reference')
    if OUT.exists():raise ValueError('Evaluation output exists; do not overwrite a frozen evaluation set')
    OUT.mkdir(parents=True);(OUT/'audio').mkdir()
    train=split_cases(cases)
    held=sorted(r['id'] for r in cases if r['id'] not in train)[:10]
    opts=ort.SessionOptions();opts.intra_op_num_threads=4;opts.inter_op_num_threads=1
    model=ROOT/'.speech-cache/tts/vi_VN-vais1000-medium.onnx'
    voice=PiperVoice(session=ort.InferenceSession(str(model),sess_options=opts,providers=['CPUExecutionProvider']),config=PiperConfig.from_dict(json.loads(Path(str(model)+'.json').read_text(encoding='utf-8'))))
    rows=[]
    for index,case in enumerate(cases):
        for condition,scale in [('clean',1.0)]+([('fast',.72),('fan',1.0)] if case['id'] in held else []):
            body=io.BytesIO()
            with wave.open(body,'wb') as w:voice.synthesize_wav(case['spoken_text'],w,syn_config=SynthesisConfig(length_scale=scale,noise_scale=.4,noise_w_scale=.5))
            temp=OUT/'tts-temp.wav';temp.write_bytes(body.getvalue());samples=audio.read_wav(temp);temp.unlink()
            if condition=='fan':samples=audio.mix_snr(samples,audio.ambient(len(samples),'fan',np.random.default_rng(20261118+index),None),10)
            samples=np.pad(samples,(6400,6400))
            name=case['id']+'-'+condition
            duration,sha,gain=audio.save(OUT/'audio'/(name+'.wav'),samples)
            anchors,invalid=valid_anchors(case['spoken_text'],case.get('anchors',''))
            rows.append(dict(id=name,case_id=case['id'],split='development' if case['id'] in train else 'holdout',condition=condition,category=case['category'],reference=case['spoken_text'],anchors=anchors,source_anchors_not_in_reference=invalid,audio='audio/'+name+'.wav',seconds=duration,sha256=sha,synthetic=True,human_verified=False))
        print('Generated '+case['id'],flush=True)
    for split in ['development','holdout']:
        for condition in ['silence','fan_only']:
            samples=np.zeros(3*16000,dtype=np.float32)
            if condition=='fan_only':samples=audio.ambient(len(samples),'fan',np.random.default_rng(8123),None)*.01
            name=split+'-'+condition
            duration,sha,_=audio.save(OUT/'audio'/(name+'.wav'),samples)
            rows.append(dict(id=name,case_id=name,split=split,condition=condition,category='control',reference='',anchors='',source_anchors_not_in_reference=[],audio='audio/'+name+'.wav',seconds=duration,sha256=sha,synthetic=True,human_verified=False))
    manifest=dict(source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),voice_sha256=hashlib.sha256(model.read_bytes()).hexdigest(),note='One synthetic voice; spoken_text is reference, not target_text. No real clinician recordings.',chunk_seconds=8,selection_rule='Reject additional false speech or anchor-flag regressions on development; then lowest development WER, tie by CER/time. Holdout used once for current and winner. Keep production current if holdout gate fails.',candidates=CANDIDATES,rows=rows)
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Generated '+str(len(rows))+' files',flush=True)

def summarize(rows):
    spoken=[r for r in rows if r['reference']];controls=[r for r in rows if not r['reference']]
    words=sum(r['ref_words'] for r in spoken);chars=sum(r['ref_chars'] for r in spoken)
    return dict(n=len(rows),spoken=len(spoken),controls=len(controls),wer=100*sum(r['word_edits'] for r in spoken)/words if words else None,cer=100*sum(r['char_edits'] for r in spoken)/chars if chars else None,anchor_flagged=sum(bool(r['missing_anchors']) for r in spoken),anchor_groups_missing=sum(len(r['missing_anchors'].split(' | ')) for r in spoken if r['missing_anchors']),false_speech=sum(bool(r['hypothesis']) for r in controls),seconds=sum(r['wall_seconds'] for r in rows),rtf=sum(r['wall_seconds'] for r in rows)/sum(r['seconds'] for r in rows))

def audio_segments(samples):
    """Mirror browser silence/8-second frame boundaries; retain every sample once."""
    import numpy as np
    start=0;length=0;silence=0
    for offset in range(0,len(samples),4096):
        frame=samples[offset:offset+4096];length+=len(frame)
        silence=silence+len(frame) if np.sqrt(np.mean(frame.astype(float)**2))<.008 else 0
        if (length>=1.2*16000 and silence>=.7*16000) or length>=8*16000:
            yield samples[start:offset+len(frame)]
            start=offset+len(frame);length=0;silence=0
    if start<len(samples):yield samples[start:]

def choose_candidate(results):
    base=results['current']['summary']
    eligible=[name for name,value in results.items() if value['summary']['false_speech']<=base['false_speech'] and value['summary']['anchor_flagged']<=base['anchor_flagged']]
    return min(eligible,key=lambda k:(results[k]['summary']['wer'],results[k]['summary']['cer'],results[k]['summary']['seconds']))

def infer(model,rows,settings):
    import numpy as np
    from speech_config import decode_options
    results=[]
    for row in rows:
        path=OUT/row['audio']
        assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256']
        with wave.open(str(path),'rb') as w:
            assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,16000)
            samples=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float32)/32768
        started=time.perf_counter();parts=[]
        chunks=list(audio_segments(samples))
        for chunk in chunks:
            options=decode_options(True);options.update(settings)
            segments,_=model.transcribe(chunk,**options)
            parts.extend(s.text.strip() for s in segments)
        text=' '.join(parts).strip()
        results.append(dict(row,hypothesis=text,wall_seconds=round(time.perf_counter()-started,4),chunks=len(chunks),**score.metrics(row['reference'],text,row['anchors'])))
        print(row['id'],flush=True)
    return results

def evaluate():
    import os
    os.environ['HF_HUB_OFFLINE']='1'
    from faster_whisper import WhisperModel
    from speech_config import profile,model_path
    manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
    assert manifest['candidates']==CANDIDATES
    model=WhisperModel(str(model_path(profile('small'))),device='cpu',compute_type='int8',cpu_threads=4,num_workers=1,local_files_only=True)
    development=[r for r in manifest['rows'] if r['split']=='development']
    holdout=[r for r in manifest['rows'] if r['split']=='holdout']
    results={}
    for name,settings in CANDIDATES.items():
        print('Development '+name,flush=True)
        rows=infer(model,development,settings)
        results[name]=dict(summary=summarize(rows),rows=rows)
        (OUT/'development-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    winner=choose_candidate(results)
    selection=dict(winner=winner,settings=CANDIDATES[winner],rule=manifest['selection_rule'],development_summaries={k:v['summary'] for k,v in results.items()})
    (OUT/'selection-frozen.json').write_text(json.dumps(selection,ensure_ascii=False,indent=2),encoding='utf-8')
    final={}
    for name in dict.fromkeys(['current',winner]):
        print('Holdout '+name,flush=True)
        rows=infer(model,holdout,CANDIDATES[name]);final[name]=dict(summary=summarize(rows),by_condition={c:summarize([r for r in rows if r['condition']==c]) for c in sorted({r['condition'] for r in rows})},rows=rows)
        (OUT/'holdout-results.json').write_text(json.dumps(final,ensure_ascii=False,indent=2),encoding='utf-8')
    base=final['current']['summary'];candidate=final[winner]['summary']
    selection['holdout_gate_passed']=winner!='current' and candidate['wer']<base['wer'] and candidate['anchor_flagged']<=base['anchor_flagged'] and candidate['false_speech']<=base['false_speech']
    selection['holdout_summaries']={k:v['summary'] for k,v in final.items()}
    (OUT/'decision.json').write_text(json.dumps(selection,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(selection),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('action',choices=['generate','evaluate']);p.add_argument('--source',type=Path)
    a=p.parse_args()
    if a.action=='generate':generate(a.source)
    else:evaluate()
