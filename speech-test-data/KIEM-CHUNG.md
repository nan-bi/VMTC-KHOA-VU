# Kiểm chứng đã chạy — 15/11/2026

- Node toàn bộ `tests/*.test.mjs`: 189 đạt, 0 lỗi, 0 bỏ qua. Log `.speech-cache/node-final-20261115.tap`. Lượt đầu trước đó 179 đạt; dùng con số của lượt cuối vì workspace có thêm kiểm thử.
- Python `.speech-venv/Scripts/python.exe -m unittest discover -s tests -p 'test_*.py'`: 13 đạt. Gồm 4 kiểm thử mới về điểm chữ, Unicode, alias, manifest/WAV.
- Manifest: 486 ID duy nhất, 6 mẫu không lời; tất cả WAV đúng mono PCM16 16 kHz, không quá 29 giây; thời lượng và SHA256 khớp manifest.
- Bộ trộn tiếng ồn: xác nhận tỷ số RMS của hỗn hợp đạt SNR 20/10/0 dB trong sai số 0,00001 dB trước lượng tử hóa PCM.
- `.speech-venv/Scripts/python.exe -m pip check`: không lỗi phụ thuộc ở lượt rà soát đầu; không sửa môi trường này trong bộ sinh TTS.
- `scripts/check-speech-api.mjs`: đạt health, origin/key, WAV không hợp lệ, giới hạn kích thước, đường dẫn. Một lượt chạy nhầm đồng thời benchmark nhận 429; chạy lại riêng sau benchmark đã đạt.
- `scripts/evaluate-speech-stress.py`: 486/486 xử lý thành công, 0 lỗi HTTP; báo cáo chi tiết trong `BAO-CAO.md`. Không dùng chữ “thành công” này để chỉ chép đúng.
- `scripts/check-speech-stream.mjs`: đạt hai phiên liên tiếp; 36,1684 giây âm thanh, 578.695 mẫu được gửi đủ qua 3 yêu cầu HTTP. Audio callback giả lập theo nhịp thời gian thực, model thật; không phải thu micro vật lý.
- Static server: gallery/CSV/WAV trả 200, chặn thoát thư mục bằng đường dẫn Windows mã hóa trả 403; URI lỗi trả 400; POST vào trang tĩnh trả 405.
- Trình duyệt: trang bộ test hiển thị đúng chữ Việt, 486/486 và điểm thực; lọc `sach` còn 40 hàng dữ liệu + tiêu đề. Ảnh `docs/vu-voice-stress-test.jpg` trong ứng dụng. Chưa nghe duyệt nhãn TTS, không tự gán human_verified=yes.
- Build Vite: phát hiện lỗi JSX có sẵn ở `src/components/LocalFilePicker.jsx` (chuỗi bộ lọc file tạm bị đứt, phần đóng bị lặp). Đã nối lại bộ lọc `~$`, bỏ phần lặp, giữ tùy chọn thư mục và đường dẫn tương đối. Bản trước sửa giữ tại `.speech-cache/LocalFilePicker.before-syntax-repair.jsx`. Build lại đạt, còn cảnh báo kích thước bundle lớn. Không sửa logic chuyên môn/model từ kết quả test.

Phạm vi chưa kiểm chứng: micro thật, DSP trình duyệt, IndexedDB khi mất điện/dung lượng đầy trên từng thiết bị, dữ liệu giọng bác sĩ thật, độ chính xác lâm sàng, mọi phương ngữ/cách luyến. Không xóa hoặc xuất dữ liệu bệnh nhân.
