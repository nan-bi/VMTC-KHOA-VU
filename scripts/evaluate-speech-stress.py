"""Score synthetic WAVs through the actual same-origin local STT HTTP pipeline.
No cloud, patient database access, automatic training or production model changes.
"""
import argparse
import csv
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import statistics
import time
import unicodedata
import urllib.error
import urllib.request

ROOT=Path(__file__).resolve().parents[1]

def words(text):
    return re.findall(r'\w+',unicodedata.normalize('NFC',text).casefold(),flags=re.UNICODE)

def distance(a,b):
    prev=list(range(len(b)+1))
    for i,left in enumerate(a,1):
        curr=[i]
        for j,right in enumerate(b,1):
            curr.append(min(curr[-1]+1,prev[j]+1,prev[j-1]+(left!=right)))
        prev=curr
    return prev[-1]

def metrics(reference,hypothesis,anchors=''):
    ref=words(reference);hyp=words(hypothesis)
    ref_chars=list(''.join(ref));hyp_chars=list(''.join(hyp))
    normalized=' '+' '.join(hyp)+' '
    missing=[]
    for group in filter(None,anchors.split('|')):
        if not any(' '+' '.join(words(alt))+' ' in normalized for alt in group.split('~')):
            missing.append(group)
    return dict(word_edits=distance(ref,hyp),ref_words=len(ref),char_edits=distance(ref_chars,hyp_chars),ref_chars=len(ref_chars),missing_anchors=' | '.join(missing))

def percentile(values, fraction):
    if not values:return 0.
    sorted_values=sorted(values);position=(len(values)-1)*fraction
    lo=int(position);hi=min(lo+1,len(values)-1)
    return sorted_values[lo]+(sorted_values[hi]-sorted_values[lo])*(position-lo)

def summary(rows):
    ok=[r for r in rows if r['status']=='ok']
    spoken=[r for r in ok if r['reference']]
    controls=[r for r in ok if not r['reference']]
    n=sum(int(r['ref_words']) for r in spoken);c=sum(int(r['ref_chars']) for r in spoken)
    return dict(count=len(rows),ok=len(ok),errors=len(rows)-len(ok),
        wer=100*sum(int(r['word_edits']) for r in spoken)/n if n else None,
        cer=100*sum(int(r['char_edits']) for r in spoken)/c if c else None,
        median=statistics.median([float(r['wall_seconds']) for r in ok]) if ok else 0,
        p95=percentile([float(r['wall_seconds']) for r in ok],.95),
        rtf=sum(float(r['wall_seconds']) for r in ok)/sum(float(r['seconds']) for r in ok) if ok else 0,
        missing=sum(bool(r['missing_anchors']) for r in spoken),
        controls=len(controls),false_speech=sum(bool(r['hypothesis'].strip()) for r in controls))

def report(rows,total,out,metadata):
    groups={name:[r for r in rows if r['profile']==name] for name in dict.fromkeys(r['profile'] for r in rows)}
    overall=summary(rows)
    fmt=lambda value:'—' if value is None else f'{value:.1f}'
    lines=['# Kiểm tra Vú Voice — âm thanh tổng hợp, 15/11/2026','',
        '**Không phải kiểm định lâm sàng. Model chưa được huấn luyện lại.** Một giọng TTS với biến thể tốc độ/âm học không đại diện mọi giọng bác sĩ hoặc tiếng ồn phòng khám.',
        f'\nĐã đánh giá {len(rows)}/{total} WAV. API thành công {overall["ok"]}; lỗi {overall["errors"]}.',
        f'\nWER toàn bộ lời mục tiêu: {fmt(overall["wer"])}%; CER: {fmt(overall["cer"])}%. Median {overall["median"]:.3f}s; p95 {overall["p95"]:.3f}s; RTF {overall["rtf"]:.3f}.',
        f'\n{overall["missing"]} mẫu có ít nhất một mốc từ chưa khớp; {overall["false_speech"]}/{overall["controls"]} đoạn không lời sinh văn bản.',
        '\n| Điều kiện | Mẫu | Lỗi API | WER % | CER % | p95 giây | Thiếu mốc từ |',
        '|---|---:|---:|---:|---:|---:|---:|']
    for name,items in groups.items():
        s=summary(items);lines.append(f'| {name} | {s["count"]} | {s["errors"]} | {fmt(s["wer"])} | {fmt(s["cer"])} | {s["p95"]:.3f} | {s["missing"]} |')
    lines += ['','## Đọc kết quả đúng phạm vi','',
        '- HTTP thành công và không crash chỉ chứng minh xử lý được tệp, không chứng minh chép đúng.',
        '- WER tính theo token cách trắng của tiếng Việt, chuẩn Unicode/chữ thường/bỏ dấu câu; CER theo ký tự không khoảng trắng. Chưa quy đồng số viết bằng chữ với số Ả Rập, đơn vị hoặc mọi cách viết tắt nên điểm có thể gồm khác biệt trình bày.',
        '- Mốc từ dùng các alias khai báo trước. Thiếu mốc là cờ để xem lại, không phải bộ xác định mọi lỗi lâm sàng; không kiểm tra liên kết bên–tổn thương, số lần phủ định hay quan hệ câu. Số đo/đơn vị vẫn phải nghe và soát.',
        '- Nhãn là văn bản đưa vào TTS, human_verified=no. Giọng tổng hợp có thể phát âm sai thuật ngữ/chữ viết tắt; chưa có người nghe xác nhận từng nhãn. Không quy mọi khác biệt cho ASR.',
        '- Nói chồng: reference chỉ là lời mục tiêu; hệ thống hiện không tách người nói. WER có thể tăng vì chép cả lời nền. Không tuyên bố model lọc được riêng giọng bác sĩ.',
        '- Chạy này gửi WAV trực tiếp qua HTTP: chưa bao gồm loa–micro thật, khử ồn của trình duyệt hoặc phiên trực tiếp dài; kiểm thử luồng thu riêng được ghi trong bàn giao.',
        '- Không dùng bộ test này làm dữ liệu huấn luyện hoặc tinh chỉnh rồi vẫn coi là test giữ riêng.',
        '', '## Dấu vết phép thử','']+[f'- {key}: `{value}`' for key,value in metadata.items()]
    (out/'BAO-CAO.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    # Self-contained gallery. All audio is synthetic and relative to the package root.
    esc=lambda x:html.escape(str(x),quote=True)
    table=''.join('<tr data-profile="'+esc(r['profile'])+'"><td>'+esc(r['id'])+'<br><audio controls preload="none" src="'+esc(r['audio'])+'"></audio></td><td>'+esc(r['reference'] or '(không có lời)')+'</td><td>'+esc(r['hypothesis'])+'</td><td>'+esc(r['status'])+'<br>'+esc(r['missing_anchors'])+'</td></tr>' for r in rows)
    options=''.join(f'<option>{esc(name)}</option>' for name in groups)
    page=f'''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vú Voice · Bộ test âm thanh giả lập</title>
<style>body{{font:15px/1.65 'Segoe UI',Arial,sans-serif;background:#f3f7f5;color:#243e38;margin:0}}main{{max-width:1240px;margin:auto;padding:32px 20px}}h1{{font-size:30px;letter-spacing:normal}}.note{{background:#fff1df;padding:18px;border-radius:10px}}.stats{{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}}.stats b{{background:white;padding:18px;border-radius:8px}}table{{border-collapse:collapse;width:100%;background:white}}td,th{{padding:15px;border:1px solid #dce5df;text-align:left;vertical-align:top}}td:first-child{{min-width:235px}}audio{{width:220px;margin-top:8px}}select{{padding:10px;margin:16px 0;font:inherit}}.scroll{{overflow:auto}}a{{color:#075c5a}}</style><main><a href="/speech.html">← Vú Voice</a><h1>Bộ test âm thanh giả lập</h1><p>40 nội dung · 12 điều kiện · 6 đoạn không lời · một giọng TTS. Chưa bao phủ mọi giọng vùng miền hoặc cách luyến âm thật.</p><p class="note"><strong>Chưa kết luận đủ ổn định để dùng lâm sàng.</strong> Nhãn TTS chưa được người nghe duyệt. Đọc nhanh do máy sinh khác cách bác sĩ đọc nhanh thật. Không có dữ liệu người bệnh.</p><div class="stats"><b>{len(rows)}/{total} WAV đã chạy</b><b>{overall['errors']} lỗi API</b><b>WER {fmt(overall['wer'])}%</b><b>p95 {overall['p95']:.2f} giây</b></div><p><a href="ket-qua.csv">Kết quả chi tiết CSV</a> · <a href="manifest.csv">Danh sách WAV và câu gốc</a> · <a href="BAO-CAO.md">Báo cáo và giới hạn</a> · <a href="NGUON.md">Nguồn / giấy phép</a></p><label>Điều kiện thử <select id="condition"><option value="all">Tất cả</option>{options}</select></label><p>Nghe audio, đối chiếu câu gốc với bản model chép. Cột cuối đánh dấu mốc từ chưa khớp; không thay bác sĩ kiểm tra.</p><div class="scroll"><table><thead><tr><th>Âm thanh</th><th>Lời mục tiêu đưa vào TTS</th><th>Model chép</th><th>Trạng thái / mốc chưa khớp</th></tr></thead><tbody>{table}</tbody></table></div><script>document.getElementById('condition').addEventListener('change',e=>{{for(const row of document.querySelectorAll('tbody tr'))row.hidden=e.target.value!=='all'&&row.dataset.profile!==e.target.value;}});</script></main></html>'''
    (out/'index.html').write_text(page,encoding='utf-8')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data',type=Path,default=ROOT/'speech-test-data')
    parser.add_argument('--limit',type=int)
    args=parser.parse_args();out=args.data.resolve()
    if (out/'ket-qua.csv').exists():raise SystemExit('Existing results: use a fresh copy/directory, do not overwrite evidence.')
    with (out/'manifest.csv').open(encoding='utf-8-sig',newline='') as f:all_rows=list(csv.DictReader(f))
    health=json.load(urllib.request.urlopen('http://127.0.0.1:4173/speech-api/health',timeout=10))
    if not health.get('ready'):raise SystemExit('Local model is not ready.')
    metadata={'started_utc':datetime.now(timezone.utc).isoformat(),'engine':health.get('model',''),
        'model_sha256':hashlib.sha256((ROOT/'speech-models/phowhisper-base-int8/model.bin').read_bytes()).hexdigest(),
        'server_code_sha256':hashlib.sha256((ROOT/'scripts/speech-server.py').read_bytes()).hexdigest(),
        'manifest_sha256':hashlib.sha256((out/'manifest.csv').read_bytes()).hexdigest(),
        'endpoint':'127.0.0.1:4173/speech-api/transcribe','normalization':'NFC lower, punctuation removed; numeric forms NOT equated'}
    chosen=all_rows[:args.limit] if args.limit else all_rows;results=[]
    columns=list(all_rows[0])+['status','hypothesis','wall_seconds','model_seconds','word_edits','ref_words','char_edits','ref_chars','missing_anchors','error']
    with (out/'ket-qua.csv').open('x',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader()
        for i,row in enumerate(chosen,1):
            path=(out/row['audio']).resolve()
            if not path.is_relative_to(out/'audio'):raise ValueError('Audio outside package')
            result=dict(row,status='error',hypothesis='',wall_seconds=0,model_seconds='',error='')
            start=time.perf_counter()
            try:
                data=path.read_bytes()
                if hashlib.sha256(data).hexdigest()!=row['sha256']:raise ValueError('WAV hash mismatch')
                request=urllib.request.Request('http://127.0.0.1:4173/speech-api/transcribe',data=data,headers={'Content-Type':'audio/wav'})
                payload=json.load(urllib.request.urlopen(request,timeout=120))
                result.update(status='ok',hypothesis=payload['text'],model_seconds=payload['seconds'])
            except Exception as exc:
                result['error']=f'{type(exc).__name__}: {exc}'
            result['wall_seconds']=round(time.perf_counter()-start,4)
            result.update(metrics(row['reference'],result['hypothesis'],row['anchors']))
            results.append(result);writer.writerow(result);f.flush()
            if i%12==0 or i==len(chosen):
                print(f'Evaluated {i}/{len(chosen)}; errors={sum(r["status"]!="ok" for r in results)}; last={result["wall_seconds"]}s',flush=True)
    metadata['finished_utc']=datetime.now(timezone.utc).isoformat()
    report(results,len(all_rows),out,metadata)
    print(json.dumps(summary(results),ensure_ascii=True),flush=True)
    return int(any(r['status']!='ok' for r in results))

if __name__=='__main__':
    raise SystemExit(main())
