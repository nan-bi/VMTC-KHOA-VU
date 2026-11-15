# Rà soát Vú Voice — 15/11/2026

## Đang có

- Nhận dạng PhoWhisper-base INT8 chạy CPU trên máy này, qua dịch vụ loopback. Không cần Internet sau khi cài phụ thuộc và model. Chưa có model được huấn luyện lại bằng giọng bác sĩ.
- Bác sĩ đọc tự nhiên; nội dung nhận được vào một ô, không cần đọc lệnh. Dừng thu sẽ chép nốt đoạn cuối trước khi hoàn thành ca.
- Bản nháp/kết quả trong IndexedDB; hoàn thành đưa vào trạng thái chờ bác sĩ kiểm tra. Giờ thiết bị được ghi tự động đến giây, gồm múi giờ; không phải thời gian xác thực từ máy chủ bệnh viện.
- Giao diện/font tiếng Việt được đóng gói; xuất TXT/in PDF, không có xuất JSON.
- Bộ thu dữ liệu thật tách riêng; hiện chưa có ghi âm thật đã được bác sĩ duyệt để đánh giá giọng đọc nhanh/luyến/viết tắt.

## Điều đã kiểm tra và giới hạn

Đối chiếu mã nguồn luồng thu, dịch vụ STT, lưu ca, timestamp và offline worker. Kiểm thử Node bao gồm bảo toàn bản nháp, khóa ca khi còn âm thanh, giữ đoạn thất bại để thử lại, trạng thái chờ duyệt, giờ thiết bị, cache ngoại tuyến và font. Kiểm thử Python bao gồm dữ liệu huấn luyện/manifest và bộ chấm điểm âm thanh. Kết quả lệnh cuối được ghi trong `KIEM-CHUNG.md`.

`BAO-CAO.md` là phép thử 486 WAV qua HTTP và model thực. `LUONG-THU.md` là audio callback giả lập theo nhịp thời gian thực qua bộ chia đoạn đang dùng, gửi tới model thực. Hai phép thử không dùng micro thật và không thao tác dữ liệu người bệnh.

Chưa xác minh lại IndexedDB bằng thao tác giao diện trên từng máy/điện thoại khi ngắt mạng hoặc mất điện; kiểm thử worker/reducer không chứng minh mọi tình huống lưu trữ trình duyệt. Dữ liệu đang ở cùng trình duyệt, không phải hệ thống sao lưu hoặc đồng bộ giữa thiết bị. Đóng tab trong lúc còn audio chưa chép có thể mất phần audio tạm. Giọng nền có thể bị chép chung vì chưa tách người nói.

HTTP 429 khi hai yêu cầu suy luận cùng lúc là giới hạn một lượt xử lý hiện tại. Chạy kiểm tra API sau khi benchmark kết thúc. Không dùng nhiều tab thu đồng thời.

## Kết luận sử dụng

Đọc kết quả chi tiết trước khi quyết định. Việc chạy hết WAV và kiểm thử mã đạt không chứng minh chép đúng lâm sàng. Bộ tổng hợp đã cho thấy nhiều câu không khớp đầu vào; nhãn TTS chưa được nghe duyệt nên chưa thể quy hết lỗi cho ASR. Cần giữ bản chép ở trạng thái chờ soát và đánh giá tiếp bằng giọng bác sĩ thật trên micro dự định sử dụng. Không sửa chữ chuyên khoa bằng thay thế mù vì có thể đổi nghĩa, bên hoặc số đo.
