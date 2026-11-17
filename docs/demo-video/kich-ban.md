# Kịch bản video Dashboard Khoa Vú

Thuyết minh tổng hợp bằng Piper tiếng Việt, chạy local. Dữ liệu kiểm thử riêng; không phải bảng giá hay doanh thu chính thức. Video ghép từ các cảnh thao tác thực tế, có dừng hình theo lời đọc. Mục speech chỉ giới thiệu giao diện.

## 1. Dashboard Khoa Vú (00:00:00,000)

Luồng làm việc từ dữ liệu đến báo cáo

Video này giới thiệu cách thao tác trên Dashboard Khoa Vú, từ tiếp nhận dữ liệu, đối soát, tính doanh thu đến lập báo cáo giao ban. Toàn bộ phần trình diễn dùng dữ liệu kiểm thử trong một kho riêng. Ứng dụng chạy nội bộ trên máy. Những số tiền xuất hiện chỉ minh họa cách tính, không phải doanh thu thực tế hoặc bảng giá đã được bệnh viện xác nhận.

## 2. Nhập dữ liệu (00:00:18,667)

Chi tiết số liệu → Nhập dữ liệu

Đầu tiên, mở Chi tiết số liệu và chọn Nhập dữ liệu ở góc phải. Có thể chọn nhiều tệp Excel, CSV hoặc cả thư mục trên máy. Giới hạn hiện tại là một trăm mê ga bai mỗi tệp. Hệ thống đọc các trang tính, giữ thông tin tệp và dòng nguồn để truy vết. Việc chọn tệp chưa làm thay đổi số báo cáo; người dùng cần kiểm tra trước khi lưu.

## 3. Kiểm tra trước khi lưu (00:00:37,500)

Xem trước → Xác nhận nhập

Bấm Kiểm tra và xem trước để xem số dòng dịch vụ được nhận diện, những bảng tham chiếu và các cảnh báo. Nếu tên cột khác cấu trúc chuẩn, có thể ghép cột rồi kiểm tra lại. Tệp trùng nội dung được nhận biết để tránh nạp lặp. Trong ví dụ này, kiểm tra xong mới xác nhận lưu. Dữ liệu sau khi lưu trở thành nguồn chung cho bảng, biểu đồ và phép tính.

## 4. Chọn kỳ báo cáo (00:00:56,667)

Chọn ngày có phát sinh dịch vụ

Sau khi nhập, chọn ngày hoặc khoảng ngày cần xem. Dashboard tổng hợp theo kỳ đang chọn, vì vậy cần chọn đúng ngày có dữ liệu. Mũi tên giúp chuyển nhanh ngày trước và ngày sau. Tổng quan cho biết số dịch vụ hoàn thành, lượt có chỉ định và giá trị trước, sau giảm đã biết. Biểu đồ cột giúp quan sát dịch vụ nào có phát sinh; bấm cột để xem những dòng cấu thành.

## 5. Đối soát và phân loại (00:01:16,167)

Chi tiết số liệu → Đối soát dữ liệu

Tiếp theo là đối soát. Hệ thống tách bốn luồng: Vú chỉ định và Vú làm; Vú chỉ định nhưng khoa khác làm; khoa khác chỉ định và Vú làm; cùng phần ngoài phạm vi. Mô hình local học từ cặp khoa đã được xác nhận. Cặp chưa rõ phải có người kiểm tra, không tự kết luận chỉ từ tên tệp. Dòng lỗi bị giữ ngoài tổng, giúp tránh cộng nhầm doanh thu.

## 6. Bóc tách dịch vụ và gói (00:01:34,500)

Tính toán & doanh thu

Phần tính toán tách khám, siêu âm, X quang hai chiều và ba chiều. Tổng số thực hiện được trừ từng phần trong gói sức khỏe tổng quát, combo một, combo hai và các gói khác để ra phần chuyên khoa hoặc lẻ. Combo một gồm khám và siêu âm. Combo hai gồm khám, X quang và siêu âm. Chỉ trừ dịch vụ thực tế trong gói, không trừ đồng loạt theo số gói bán.

## 7. Doanh thu theo từng phần (00:01:53,833)

Giá × số lượng → Biểu đồ → Dòng nguồn

Doanh thu được tính bằng đơn giá nhân số lượng của từng phần. Giá lẻ, giá gói sức khỏe tổng quát và hai combo giữ riêng; X quang hai chiều, ba chiều cũng có giá riêng. Thiếu giá hoặc chưa rõ phân bổ thì phải đối soát. Bảng hiện rõ từng phép nhân. Biểu đồ cột doanh thu giúp so sánh các dịch vụ, và có thể mở chi tiết để kiểm tra cách tính.

## 8. Kho dữ liệu và quy tắc (00:02:12,833)

Xem bảng, tra cứu và sửa có lý do

Kho dữ liệu cho phép chọn nguồn đã nhập, xem từng bảng và các cột, thay vì phải mở lại từng tệp ngoài ứng dụng. Khi chỉnh sửa, cần ghi lý do và lưu để lịch sử giữ dấu vết. Thao tác lưu trong dashboard không ghi đè tệp Excel gốc. Ở Quy tắc và danh mục, có thể tra cứu dịch vụ và cấu hình giá, gói sau khi đã được khoa xác nhận.

## 9. Chốt báo cáo giao ban (00:02:31,500)

Dữ liệu hợp lệ → Bản nháp cố định

Khi dữ liệu không còn lỗi chặn, tạo bản nháp báo cáo. Thao tác chốt cố định số liệu của đúng phiên bản, giúp nội dung báo cáo không thay đổi theo các lần xem sau. Người lập kiểm tra nhận xét theo mẫu rồi gửi duyệt. Nếu còn lỗi nguồn, hệ thống chặn chốt; không tự bỏ lỗi để xuất được báo cáo. Đây là bước kiểm soát cần thực hiện trước khi trình số liệu.

## 10. Duyệt và xuất báo cáo (00:02:50,667)

Excel và PowerPoint dùng cùng bản chốt

Người có quyền duyệt kiểm tra và xác nhận báo cáo. Sau đó xuất Excel theo mẫu và PowerPoint giao ban. Hai tệp cùng dùng một bản chốt để tránh lệch số giữa bảng và slide. Trong video, tài khoản demo có quyền quản trị để minh họa các bước. Khi vận hành, cần phân quyền đúng người lập và người duyệt. Các tệp xuất phục vụ báo cáo, chưa thay thế việc đối chiếu tiền thực thu.

## 11. Đọc kết quả siêu âm (00:03:10,500)

Bắt đầu → Chép lời → Soát → Lưu ca

Mục Đọc kết quả siêu âm hỗ trợ ghi lời đọc và kiểm tra bản chép. Khi thực hành, bấm Bắt đầu và cấp quyền micro; lời nhận dạng xuất hiện trong lúc đọc. Dừng để soát lại bên vú, số đo, từ phủ định và kết luận. Ca và bản nháp lưu trong trình duyệt để xem lại theo ngày. Phần video này giới thiệu giao diện, không thu giọng bệnh nhân hoặc tạo kết quả lâm sàng.

## 12. Kết quả và lưu ý sử dụng (00:03:29,833)

Nhập → Đối soát → Tính → Duyệt → Xuất

Luồng thao tác kết nối từ nguồn đầu vào tới báo cáo và lưu lịch sử để kiểm tra lại. Mã hiện tại đã qua hai trăm năm mươi lăm kiểm thử Node, sáu mươi mốt kiểm thử Python và build thành công. Kết quả này là kiểm thử kỹ thuật. Độ chính xác dưới không phẩy không năm phần trăm chỉ có thể kết luận khi có bộ chuẩn độc lập đầy đủ. Cần khoa xác nhận nghiệp vụ, bảng giá và đánh giá thêm giọng đọc thực tế.