"""Build auditable metrics/CSV/listening report from frozen evaluation outputs."""
import csv
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import random
import re
import unicodedata
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.speech-cache/ultrasound-evaluation-20261118'
OUT=ROOT/'docs/speech-evaluation-20261118'

def paired_interval(base,candidate,iterations=3000):
    left={};right={}
    for rows,target in [(base,left),(candidate,right)]:
        for row in rows:
            if not row['reference']:continue
            item=target.setdefault(row['case_id'],[0,0])
            item[0]+=row['word_edits'];item[1]+=row['ref_words']
    if left.keys()!=right.keys():raise ValueError('Unpaired cases')
    ids=sorted(left);rng=random.Random(20261118);deltas=[]
    for _ in range(iterations):
        draw=[rng.choice(ids) for _ in ids]
        n=sum(left[k][1] for k in draw)
        deltas.append(100*sum(right[k][0]-left[k][0] for k in draw)/n)
    deltas.sort()
    return [deltas[int(.025*iterations)],deltas[int(.975*iterations)]]

def anchor_risks(rows):
    patterns={'Bên trái/phải':r'\b(trái|phải)\b','Phủ định':r'\b(không|chưa)\b','BI-RADS':r'bi[ -]?(rát|rads|rad)|birads','Số / đơn vị / thời gian':r'\d|\b(một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|phẩy|mét|mm|cm|giờ|tháng)\b'}
    result={name:dict(expected_groups=0,missing_groups=0,wav_ids=[]) for name in patterns}
    for row in rows:
        if not row['reference']:continue
        missing=set(row['missing_anchors'].split(' | '))
        for group in filter(None,row['anchors'].split('|')):
            normalized=unicodedata.normalize('NFC',group).casefold()
            for category,pattern in patterns.items():
                if not re.search(pattern,normalized):continue
                result[category]['expected_groups']+=1
                if group in missing:
                    result[category]['missing_groups']+=1
                    if row['id'] not in result[category]['wav_ids']:result[category]['wav_ids'].append(row['id'])
    return result

def main():
    manifest=json.loads((CACHE/'manifest.json').read_text(encoding='utf-8'))
    decision=json.loads((CACHE/'decision.json').read_text(encoding='utf-8'))
    development=json.loads((CACHE/'development-results.json').read_text(encoding='utf-8'))
    final=json.loads((CACHE/'holdout-results.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True,exist_ok=True)
    summary=dict(decision,source_sha256=manifest['source_sha256'],voice_sha256=manifest['voice_sha256'],samples=len(manifest['rows']),audio_minutes=sum(r['seconds'] for r in manifest['rows'])/60,unmatched_source_anchor_groups=sum(len(r['source_anchors_not_in_reference']) for r in manifest['rows'] if r['condition']=='clean'))
    model_config=json.loads((ROOT/'scripts/speech-models.json').read_text(encoding='utf-8'))['models']['small']
    summary['asr']=dict(model_config,compute_type='int8',cpu_threads=4,model_sha256=hashlib.sha256((ROOT/'speech-models'/model_config['directory']/'model.bin').read_bytes()).hexdigest())
    spec=importlib.util.spec_from_file_location('evaluation_summary',ROOT/'scripts/evaluate-ultrasound-speech.py')
    evaluator=importlib.util.module_from_spec(spec);spec.loader.exec_module(evaluator)
    summary['all_samples_descriptive']={name:evaluator.summarize(development[name]['rows']+data['rows']) for name,data in final.items()}
    summary['all_clean_descriptive']={name:evaluator.summarize([row for row in development[name]['rows']+data['rows'] if row['condition']=='clean']) for name,data in final.items()}
    summary['holdout_anchor_risks']={name:anchor_risks(data['rows']) for name,data in final.items()}
    winner=decision['winner']
    if winner!='current':summary['holdout_paired_wer_delta_ci95_pp']=paired_interval(final['current']['rows'],final[winner]['rows'])
    (OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    columns=['stage','configuration','id','case_id','condition','category','reference','hypothesis','word_edits','ref_words','char_edits','ref_chars','missing_anchors','source_anchors_not_in_reference','wall_seconds','seconds','chunks','sha256']
    with (OUT/'chi-tiet.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=columns,extrasaction='ignore');writer.writeheader()
        for stage,result in [('development',development),('holdout',final)]:
            for name,data in result.items():
                for row in data['rows']:writer.writerow(dict(row,stage=stage,configuration=name))
    lines=['# Kiểm thử speech từ bộ kết quả phòng siêu âm · 18/11/2026','',
        '**Bộ âm thanh tổng hợp, chưa phải bản thu giọng bác sĩ. Chưa kết luận độ chính xác lâm sàng.**','',
        f"Nguồn 65 ca văn bản; tạo {summary['samples']} WAV, {summary['audio_minutes']:.2f} phút: 65 sạch, 10 nhanh, 10 tiếng quạt SNR10, 4 đoạn không lời. Một giọng Piper VAIS1000 có sẵn, không gửi dữ liệu ra ngoài. Dùng spoken_text làm reference; không chấm với target_text đã biên tập.",
        '', 'Chia cố định theo mã ca trước suy luận: 20 ca phát triển + 2 control; giữ riêng 45 ca (65 WAV kể cả biến thể) + 2 control. Các bản nhanh/ồn cùng ca luôn cùng tập. Không huấn luyện model; chỉ so ba cấu hình trên PhoWhisper-small INT8. Chia WAV theo ranh giới silence/8 giây của client, giữ mỗi sample đúng một lần. Chưa mô phỏng loa–micro, khử ồn trình duyệt, hội thoại nhiều người hoặc chất giọng thật.',
        '', '## Kết quả chọn cấu hình trên tập phát triển','',
        '| Cấu hình | WER | CER | WAV có cờ thiếu mốc từ | Không lời sinh chữ | Thời gian suy luận |','|---|---:|---:|---:|---:|---:|']
    def metric_line(name,s):
        control=f"{s['false_speech']}/{s['controls']}" if s['controls'] else 'Không áp dụng'
        return f"| {name} | {s['wer']:.2f}% | {s['cer']:.2f}% | {s['anchor_flagged']}/{s['spoken']} | {control} | {s['seconds']:.2f}s |"
    for name,data in development.items():lines.append(metric_line(name,data['summary']))
    lines+=['',f"Cấu hình được chọn trước khi mở holdout: **{winner}**. Chỉ chọn phương án không tăng số control sinh chữ hoặc số WAV có cờ thiếu mốc trên development, rồi so WER/CER/thời gian. Mốc từ là cờ hỗ trợ đối soát, không xác định đầy đủ sai bên, sai quan hệ tổn thương hoặc mọi lỗi lâm sàng.", '', '## Kết quả trên tập giữ riêng','', '| Cấu hình | WER | CER | WAV có cờ thiếu mốc từ | Không lời sinh chữ | Thời gian suy luận |','|---|---:|---:|---:|---:|---:|']
    for name,data in final.items():lines.append(metric_line(name,data['summary']))
    for name,data in final.items():
        lines+=['',f'### Điều kiện âm thanh · {name}','','| Điều kiện | WER | CER | Số WAV |','|---|---:|---:|---:|']
        for condition,s in data['by_condition'].items():
            wer=f"{s['wer']:.2f}%" if s['wer'] is not None else 'Không áp dụng'
            cer=f"{s['cer']:.2f}%" if s['cer'] is not None else 'Không áp dụng'
            lines.append(f"| {condition} | {wer} | {cer} | {s['n']} |")
    lines+=['', '## Toàn bộ 65 ca sạch · thống kê mô tả', '', 'Bảng này bao gồm cả tập phát triển nên không phải chỉ số đánh giá độc lập của cấu hình được chọn.', '', '| Cấu hình | WER | CER | WAV có cờ thiếu mốc từ | Không lời sinh chữ | Thời gian suy luận |','|---|---:|---:|---:|---:|---:|']
    for name,value in summary['all_clean_descriptive'].items():lines.append(metric_line(name,value))
    lines+=['', '## Cờ rà soát theo loại mốc · tập giữ riêng', '', 'Đây là số nhóm từ kỳ vọng chưa khớp, không phải tỷ lệ lỗi chẩn đoán. Một nhóm có thể thuộc nhiều loại. Mốc có mặt cũng chưa xác nhận đúng quan hệ bên–tổn thương hoặc phủ định.', '', '| Cấu hình | Loại mốc | Nhóm mốc thiếu / kỳ vọng | WAV có cờ |', '|---|---|---:|---:|']
    for name,categories in summary['holdout_anchor_risks'].items():
        for category,value in categories.items():lines.append(f"| {name} | {category} | {value['missing_groups']}/{value['expected_groups']} | {len(value['wav_ids'])} |")
    if 'holdout_paired_wer_delta_ci95_pp' in summary:
        lo,hi=summary['holdout_paired_wer_delta_ci95_pp']
        lines+=['',f"Chênh lệch WER (cấu hình chọn trừ hiện tại), bootstrap 3.000 lần gom theo ca: CI95 [{lo:.2f}; {hi:.2f}] điểm phần trăm. Chỉ phản ánh độ biến động trong bộ tổng hợp một giọng này, không suy rộng sang bác sĩ hoặc phòng khám thật."]
    lines+=['','## Giới hạn và quyết định','', ('Không có cấu hình thử nghiệm nào vượt cấu hình hiện tại trên development; tiếp tục dùng cấu hình hiện tại.' if winner=='current' else 'Đối chiếu cấu hình được chọn với cấu hình hiện tại trên holdout.'),
        f"Cổng áp dụng cấu hình mới (WER giảm, cờ mốc không tăng, control không tăng): **{'ĐẠT' if decision['holdout_gate_passed'] else 'CHƯA ĐẠT'}**. Kết quả đạt chưa tự chứng minh mô hình đủ dùng độc lập; không đổi trọng số hoặc tự học từ bộ kiểm tra.",
        f"Có {summary['unmatched_source_anchor_groups']} nhóm mốc nguồn không khớp chính lời đọc gốc ở 65 ca sạch; giữ đầy đủ trong CSV để rà lại nhãn, không tính là lỗi model. WER/CER vẫn chấm toàn bộ lời đọc, không bỏ câu khó hoặc thiếu mốc.",
        'WER = (thay thế + xóa + thêm) / số từ reference. Token tiếng Việt theo khoảng trắng, chuẩn Unicode/chữ thường/bỏ dấu câu. CER tính trên ký tự không khoảng trắng. Chưa quy đổi toàn bộ số bằng chữ, chữ viết tắt, đơn vị; sai số có phần khác biệt trình bày. Không chia control vào mẫu số WER; control tính riêng việc sinh văn bản.',
        'Chỉ 10 ca holdout đầu theo mã có biến thể nhanh/tiếng quạt; điều kiện này chưa trải đều mọi nhóm bệnh. Không suy tỷ lệ nhóm ồn sang toàn bộ bệnh cảnh.',
        'TTS có thể phát âm sai tên tiếng Anh/viết tắt; reference chưa được người nghe xác nhận. Không thể dùng số này làm sai số khi bác sĩ đọc thật. Cần bản ghi âm mới có nhãn bác sĩ đã soát, đặc biệt số đo, phủ định, trái/phải, BI-RADS; tách dữ liệu huấn luyện và kiểm tra theo người đọc/phiên thu.',
        '', '## Tệp kiểm chứng','', '- [Chi tiết từng WAV và cấu hình](chi-tiet.csv)', '- [Tóm tắt máy đọc được](summary.json)', '- [Nghe và đối chiếu](nghe-doi-chieu.html)',
        f"- SHA256 file nguồn: `{manifest['source_sha256']}`",f"- SHA256 giọng TTS: `{manifest['voice_sha256']}`",
        '- Giọng tổng hợp: Piper vi_VN-vais1000-medium; nguồn/giấy phép model: https://huggingface.co/rhasspy/piper-voices/blob/main/vi/vi_VN/vais1000/medium/MODEL_CARD ; Piper: https://github.com/OHF-Voice/piper1-gpl . Thông tin nguồn giọng cũng được lưu trong tài liệu bộ thử cũ; không tải thêm giọng hoặc gọi cloud.',
        '- Audio, manifest, thiết lập chọn trước holdout và output chi tiết: `.speech-cache/ultrasound-evaluation-20261118/` trong v8. Không truy cập cơ sở dữ liệu vận hành, không sửa ca trình duyệt.']
    (OUT/'BAO-CAO.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    items=[]
    for stage,source in [('development',development),('holdout',final)]:
        for name,data in source.items():
            for row in data['rows']:
                url='../../.speech-cache/ultrasound-evaluation-20261118/'+row['audio']
                items.append(f"<tr><td>{html.escape(stage)} · {html.escape(name)}<br>{html.escape(row['id'])}<audio controls preload='none' src='{html.escape(url)}'></audio></td><td>{html.escape(row['reference'])}</td><td>{html.escape(row['hypothesis'])}</td><td>{html.escape(row['missing_anchors'])}</td></tr>")
    (OUT/'nghe-doi-chieu.html').write_text("<!doctype html><meta charset='utf-8'><title>Đối chiếu speech phòng siêu âm</title><style>body{font:15px system-ui;background:#fff8fb;color:#352b31;margin:24px}table{border-collapse:collapse;width:100%;background:white}td,th{border:1px solid #ebdce3;padding:12px;vertical-align:top}th{background:#f9e3ed}audio{display:block;width:230px;margin-top:8px}td:nth-child(2),td:nth-child(3){width:32%}</style><h1>Nghe và đối chiếu speech</h1><p>Âm thanh tổng hợp từ 65 kết quả, chưa phải giọng bác sĩ thật. Mốc từ chỉ là cờ rà soát. Audio được giữ trong v8; giữ nguyên cấu trúc thư mục để nghe lại.</p><table><thead><tr><th>Cấu hình / WAV</th><th>Lời đọc đưa vào TTS</th><th>Model chép</th><th>Mốc cần soát</th></tr></thead><tbody>"+''.join(items)+"</tbody></table>",encoding='utf-8')
    print(json.dumps({k:v for k,v in summary.items() if k not in ['development_summaries','holdout_summaries']}))
if __name__=='__main__':main()
