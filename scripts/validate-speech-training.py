"""Validate/merge local, human-reviewed WAV + CSV pairs before ASR training.
No network, no training, no model replacement. CSV paths resolve under --root.
"""
import argparse
import array
import csv
import hashlib
import math
from pathlib import Path
import sys
import wave

COLUMNS = ['id', 'audio', 'speaker_id', 'session_id', 'split', 'prompt_id',
           'pace', 'condition', 'verbatim_text', 'reviewed', 'allowed_for_training']

def validate(manifests, root, require_splits=True):
    root = Path(root).resolve()
    rows, errors, warnings = [], [], []
    ids, hashes, sessions = set(), {}, {}
    seconds = {'train': 0., 'dev': 0., 'test': 0.}
    for manifest in manifests:
        try:
            with Path(manifest).open(encoding='utf-8-sig', newline='') as handle:
                reader = csv.DictReader(handle)
                if not reader.fieldnames or not set(COLUMNS).issubset(reader.fieldnames):
                    errors.append(f'{Path(manifest).name}: thiếu cột bắt buộc.')
                    continue
                entries = list(reader)
        except (OSError, UnicodeError, csv.Error):
            errors.append(f'{Path(manifest).name}: không đọc được CSV UTF-8.')
            continue
        for number, row in enumerate(entries, 2):
            label = f'{Path(manifest).name}:{number}'
            before = len(errors)
            if any(not (row.get(k) or '').strip() for k in COLUMNS):
                errors.append(f'{label}: có trường bắt buộc trống.')
                continue
            if row['id'] in ids:
                errors.append(f'{label}: mã mẫu trùng.')
            ids.add(row['id'])
            split = row['split']
            if split not in seconds:
                errors.append(f'{label}: split phải là train/dev/test.')
            if row['reviewed'] != 'yes' or row['allowed_for_training'] != 'yes':
                errors.append(f'{label}: chưa duyệt bản chép hoặc chưa cho phép huấn luyện.')
            if row['pace'] not in ('thuong', 'nhanh_tu_nhien') or row['condition'] not in ('yen_tinh', 'phong_gia_lap'):
                errors.append(f'{label}: tốc độ/điều kiện không hợp lệ.')
            session = row['session_id']
            identity = (row['speaker_id'], split)
            if session in sessions and sessions[session] != identity:
                errors.append(f'{label}: cùng buổi thu bị chia qua nhiều nhóm/bác sĩ.')
            sessions[session] = identity
            relative = Path(row['audio'])
            path = (root / relative).resolve()
            if relative.is_absolute() or '..' in relative.parts or not path.is_relative_to(root / 'audio') or path.suffix.lower() != '.wav':
                errors.append(f'{label}: WAV phải nằm trong thư mục audio của bộ dữ liệu.')
                continue
            try:
                content = path.read_bytes()
                digest = hashlib.sha256(content).hexdigest()
                if digest in hashes:
                    errors.append(f'{label}: âm thanh trùng byte với một mẫu khác (có thể rò tập test).')
                hashes[digest] = row['id']
                with wave.open(str(path), 'rb') as audio:
                    if (audio.getnchannels(), audio.getsampwidth(), audio.getframerate()) != (1, 2, 16000):
                        raise ValueError('WAV phải mono PCM16 16 kHz.')
                    duration = audio.getnframes() / 16000
                    if not 2 <= duration <= 29.1:
                        raise ValueError('Độ dài phải từ 2 đến 29 giây.')
                    raw = audio.readframes(audio.getnframes())
                    if len(raw) != audio.getnframes() * 2:
                        raise ValueError('WAV thiếu dữ liệu âm thanh.')
                pcm = array.array('h', raw)
                if sys.byteorder != 'little':
                    pcm.byteswap()
                rms = math.sqrt(sum(x*x for x in pcm) / len(pcm))
                if rms < 20:
                    errors.append(f'{label}: âm thanh gần như im lặng; thu lại.')
                if sum(abs(x) >= 32760 for x in pcm) / len(pcm) > .01:
                    warnings.append(f'{label}: có dấu hiệu vỡ tiếng, cần nghe và thu lại nếu méo.')
                if len(errors) == before:
                    rows.append({k: row[k] for k in COLUMNS})
                    seconds[split] += duration
            except (OSError, ValueError, wave.Error, EOFError) as exc:
                errors.append(f'{label}: thiếu WAV hoặc sai định dạng ({type(exc).__name__}).')
    if not rows:
        errors.append('Chưa có mẫu hợp lệ. Bộ câu gợi ý hoặc manifest rỗng không phải dữ liệu huấn luyện.')
    if require_splits and any(seconds[k] == 0 for k in seconds):
        errors.append('Cần đủ train, dev, test; giữ buổi test độc lập. Dùng --allow-partial chỉ để kiểm tra đợt thu.')
    return rows, errors, warnings, seconds

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifests', nargs='+', type=Path)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1] / 'speech-training')
    parser.add_argument('--allow-partial', action='store_true')
    parser.add_argument('--output', type=Path, help='Write merged CSV only if every validation succeeds')
    args = parser.parse_args()
    rows, errors, warnings, seconds = validate(args.manifests, args.root, not args.allow_partial)
    for item in warnings:
        print('CANH BAO: ' + item)
    for item in errors:
        print('LOI: ' + item)
    print(f'{len(rows)} mau hop le. Phut: ' + ', '.join(f'{k}={v/60:.2f}' for k,v in seconds.items()))
    print('Kiem tra cau truc khong xac nhan do chinh xac y khoa hay chat luong nhan dang.')
    if errors:
        return 1
    if args.output:
        sources = {p.resolve() for p in args.manifests}
        if args.output.resolve() in sources or args.output.exists():
            print('LOI: khong ghi de CSV da co. Chon ten dau ra moi.')
            return 1
        with args.output.open('x', encoding='utf-8-sig', newline='') as handle:
            writer = csv.DictWriter(handle, fieldnames=COLUMNS)
            writer.writeheader()
            writer.writerows(rows)
    return 0

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
