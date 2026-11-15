# Kiểm tra Vú Voice — âm thanh tổng hợp, 15/11/2026

**Không phải kiểm định lâm sàng. Model chưa được huấn luyện lại.** Một giọng TTS với biến thể tốc độ/âm học không đại diện mọi giọng bác sĩ hoặc tiếng ồn phòng khám.

Đã đánh giá 486/486 WAV. API thành công 486; lỗi 0.

WER toàn bộ lời mục tiêu: 54.4%; CER: 43.9%. Median 0.727s; p95 0.978s; RTF 0.214.

407 mẫu có ít nhất một mốc từ chưa khớp; 0/6 đoạn không lời sinh văn bản.

| Điều kiện | Mẫu | Lỗi API | WER % | CER % | p95 giây | Thiếu mốc từ |
|---|---:|---:|---:|---:|---:|---:|
| sach | 40 | 0 | 34.9 | 24.7 | 0.986 | 26 |
| nhanh | 40 | 0 | 37.6 | 26.1 | 0.864 | 34 |
| rat_nhanh | 40 | 0 | 38.6 | 27.6 | 0.871 | 34 |
| cham | 40 | 0 | 36.8 | 28.8 | 0.897 | 30 |
| noi_nho | 40 | 0 | 38.4 | 28.5 | 0.922 | 28 |
| xa_micro_vang | 40 | 0 | 61.2 | 48.2 | 0.870 | 39 |
| quat_snr20 | 40 | 0 | 33.5 | 26.4 | 1.126 | 30 |
| quat_snr10 | 40 | 0 | 77.8 | 74.8 | 1.451 | 38 |
| quat_snr0 | 40 | 0 | 108.9 | 92.3 | 1.344 | 38 |
| ban_phim_bip_snr10 | 40 | 0 | 37.8 | 28.8 | 0.912 | 35 |
| noi_chong_snr10 | 40 | 0 | 53.5 | 40.6 | 0.891 | 35 |
| noi_chong_snr0 | 40 | 0 | 93.3 | 80.0 | 0.916 | 40 |
| silence | 1 | 0 | — | — | 0.056 | 0 |
| fan | 1 | 0 | — | — | 0.043 | 0 |
| keyboard | 1 | 0 | — | — | 0.039 | 0 |
| very_short_silence | 1 | 0 | — | — | 0.032 | 0 |
| silence_29s | 1 | 0 | — | — | 0.084 | 0 |
| noise_29s | 1 | 0 | — | — | 0.094 | 0 |

## Đọc kết quả đúng phạm vi

- HTTP thành công và không crash chỉ chứng minh xử lý được tệp, không chứng minh chép đúng.
- WER tính theo token cách trắng của tiếng Việt, chuẩn Unicode/chữ thường/bỏ dấu câu; CER theo ký tự không khoảng trắng. Chưa quy đồng số viết bằng chữ với số Ả Rập, đơn vị hoặc mọi cách viết tắt nên điểm có thể gồm khác biệt trình bày.
- Mốc từ dùng các alias khai báo trước. Thiếu mốc là cờ để xem lại, không phải bộ xác định mọi lỗi lâm sàng; không kiểm tra liên kết bên–tổn thương, số lần phủ định hay quan hệ câu. Số đo/đơn vị vẫn phải nghe và soát.
- Nhãn là văn bản đưa vào TTS, human_verified=no. Giọng tổng hợp có thể phát âm sai thuật ngữ/chữ viết tắt; chưa có người nghe xác nhận từng nhãn. Không quy mọi khác biệt cho ASR.
- Nói chồng: reference chỉ là lời mục tiêu; hệ thống hiện không tách người nói. WER có thể tăng vì chép cả lời nền. Không tuyên bố model lọc được riêng giọng bác sĩ.
- Chạy này gửi WAV trực tiếp qua HTTP: chưa bao gồm loa–micro thật, khử ồn của trình duyệt hoặc phiên trực tiếp dài; kiểm thử luồng thu riêng được ghi trong bàn giao.
- Không dùng bộ test này làm dữ liệu huấn luyện hoặc tinh chỉnh rồi vẫn coi là test giữ riêng.

## Dấu vết phép thử

- started_utc: `2026-11-15T08:42:36.769142+00:00`
- engine: `PhoWhisper-base · INT8 · CPU`
- model_sha256: `8b039b26e4e640942900d93f1094ee83a2d71c0245e398bc83b02494e868e588`
- server_code_sha256: `732d470247c48647f639fb8ca2fd045d9d6b065031bb7eebfc018a4665d3878d`
- manifest_sha256: `0a4944734bb52d9f41ec31594d3ae3ee336c92ff5fedbe397bfcaefe5c09f174`
- endpoint: `127.0.0.1:4173/speech-api/transcribe`
- normalization: `NFC lower, punctuation removed; numeric forms NOT equated`
- finished_utc: `2026-11-15T08:48:45.905505+00:00`
