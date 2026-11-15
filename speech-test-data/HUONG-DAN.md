# Bộ thử âm thanh giả lập Vú Voice

Tất cả là câu tự soạn và âm thanh tổng hợp, không chứa người bệnh thật. Bộ này phục vụ tìm lỗi, không phải dữ liệu huấn luyện đã được duyệt.

## Mở và đối chiếu

1. Mở `CHAY-SPEECH.cmd` trong thư mục ứng dụng, chờ thông báo model sẵn sàng.
2. Mở `http://127.0.0.1:4173/speech-test/`. Hoặc mở `index.html` trong bộ dữ liệu để xem kết quả đã chạy và nghe WAV, không cần Internet.
3. Chọn điều kiện ở danh sách lọc; nghe âm thanh, so câu mục tiêu với cột model chép. Ưu tiên chữ phủ định, bên trái/phải, vị trí, số đo, đơn vị và phân loại BI-RADS.
4. `manifest.csv` chứa câu mục tiêu, kiểu ồn, SNR và mã SHA256 từng WAV; `ket-qua.csv` chứa đầu ra thực tế, độ trễ và lỗi. `BAO-CAO.md` ghi kết quả tổng hợp và giới hạn. `LUONG-THU.md` ghi kiểm tra bộ chia đoạn với HTTP thật.

## Những gì có trong bộ

- 40 câu: bên/vị trí, phủ định, số đo, hình thái, cách đọc chữ viết tắt, ngoại khoa vú, ngập ngừng/tự sửa lời và đọc rút gọn.
- Mỗi câu có 12 điều kiện: sạch, nhanh, rất nhanh, chậm, nhỏ, xa micro/vang; tiếng quạt SNR 20/10/0 dB; bàn phím/bíp SNR 10 dB; lời nói chồng SNR 10/0 dB.
- 6 đoạn không lời: im lặng, quạt, bàn phím, im lặng rất ngắn, im lặng 29 giây và tiếng ồn 29 giây.
- Tổng 486 WAV mono PCM16, 16 kHz, khoảng 28,7 phút. SNR thấp hơn nghĩa là lời mục tiêu khó nghe hơn; 0 dB là công suất lời và nhiễu bằng nhau theo cách đo của bộ sinh.

Một giọng TTS duy nhất. “Rất nhanh” là tham số của máy sinh giọng; tốc độ thực còn tùy câu. Bộ không tái hiện đầy đủ phương ngữ, tiếng luyến thật, nhiều người nói thật hoặc môi trường âm học phòng siêu âm. Nhãn chưa có người nghe xác nhận. Xem `NGUON.md` để biết nguồn và giấy phép.

## Chạy lại sau khi đổi model

Giữ nguyên WAV để so sánh; tạo bản sao toàn bộ thư mục dữ liệu với tên mới, bỏ các báo cáo cũ trong **bản sao** nếu cần. Runner từ chối ghi đè `ket-qua.csv` đã tồn tại. Không chạy đồng thời hai bộ thử hoặc đang ghi ca thật vì dịch vụ chỉ xử lý một lượt suy luận.

```powershell
# Sau khi mở CHAY-SPEECH.cmd và chờ model sẵn sàng:
.speech-venv\Scripts\python.exe scripts/evaluate-speech-stress.py --data DUONG-DAN-BO-TEST-MOI
# Chạy riêng, sau khi bộ trên kết thúc:
node scripts/check-speech-api.mjs
node scripts/check-speech-stream.mjs
```

Script luồng thu dùng bộ mặc định và ghi lại `LUONG-THU.md`; không mở micro thật hoặc kho bệnh nhân. Script đánh giá chỉ gọi địa chỉ loopback, không gửi âm thanh lên Internet. Không có xuất JSON.

## Thử phòng khám bằng ca giả

Thử thêm bằng người đọc thật trên máy/micro dự định sử dụng: đọc bình thường, nhanh, ngập ngừng và tự sửa; bật quạt hoặc hội thoại nền ở mức thường gặp. Ghi âm và chép nguyên văn đã được bác sĩ xác nhận để đối chiếu. Không bật hai tab thu cùng lúc. Bộ thu mẫu có sẵn ở `/speech-training.html`.

Với lưu kết quả: dùng mã ca rõ ràng `GIA-TEST-...`, nhập/ghi nội dung giả, hoàn thành ca, tải lại trang và xem trong Kết quả; kiểm tra giờ bắt đầu, hoàn thành và trạng thái chờ duyệt. Thử ngắt Internet trong khi vẫn giữ dịch vụ local chạy. Chỉ thực hiện trong hồ sơ trình duyệt thử riêng để tránh lẫn với ca thật. Bộ kiểm thử tự động đã chạy không thay việc xác minh này trên từng thiết bị.

## Cách kết luận

Không gộp “API không lỗi” thành “chép đúng”. WER/CER là điểm đối chiếu chữ, có thể bị ảnh hưởng cách viết số hoặc TTS đọc sai. Cờ thiếu mốc từ chỉ giúp tìm mẫu cần nghe lại, không phát hiện mọi nhầm lẫn y khoa. Đối với ứng dụng thực tế, bác sĩ cần đánh giá riêng mọi lỗi đổi nghĩa trên dữ liệu người đọc thật giữ riêng trước khi chấp nhận kết quả. Không thể cam kết nhận đúng tất cả thuật ngữ/cách nói từ bộ tổng hợp này.
