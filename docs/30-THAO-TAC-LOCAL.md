# Thực hành trên dashboard local

Mở http://127.0.0.1:4180/ để dùng dashboard đang chạy. Mã nguồn và bản build nằm trong thư mục v8.

1. Vào Chi tiết số liệu, chọn ngày hoặc khoảng ngày phù hợp với ngày hoàn thành dịch vụ.
2. Bấm Nhập dữ liệu ở góc phải, chọn file hoặc cả thư mục Excel/CSV. Kiểm tra xem trước, ghép cột nếu cần rồi xác nhận lưu. Chọn file và xem trước chưa ghi vào nguồn.
3. Mở Đối soát dữ liệu để xem và xử lý từng lỗi, xác nhận khoa và danh mục khi thiếu căn cứ. Nhập lý do khi chỉnh sửa. Chỉ dữ liệu hợp lệ được cộng vào tổng phía trên.
4. Mở Tính toán & doanh thu để xem bóc tách SKTQ/SLUT 1/SLUT 2/CK lẻ, giá × số lượng, biểu đồ và dòng nguồn. Sau khi lưu nhập, sửa nguồn hoặc quy tắc, số liệu tự cập nhật; có nút Tính lại khi cần.
5. Khi hết lỗi chặn, chốt dữ liệu, nhận xét, gửi duyệt và xuất Excel/PowerPoint từ cùng phiên bản báo cáo. Quyền duyệt do máy chủ kiểm tra.
6. Đọc kết quả siêu âm mở speech chạy local tại origin 4173. Bấm Bắt đầu và cấp quyền micro khi thực hành. Ca/bản nháp lưu trong IndexedDB của trình duyệt; không xóa dữ liệu trang nếu cần xem lại.

Đồng bộ nền kiểm tra mỗi 10 giây, chỉ thông báo giao diện khi phiên bản nguồn thay đổi. Ánh xạ cột đã lưu được tái dùng khi nạp file có cùng tập cột.

Hiện nguồn vận hành còn 10.800 dòng lỗi chặn. Có thể nhập, xem, sửa và đối soát; chưa thể chốt báo cáo cuối khi các lỗi này chưa được xử lý. Không tự bỏ lỗi để mở chốt.

Nếu đã tắt các dịch vụ, chạy CHAY-DASHBOARD-SPEECH.cmd trong v8 để khởi động lại. Không chạy thêm launcher khi các cổng đang được sử dụng.

Kiểm chứng ngày 16/11/2026: build đạt; 255 kiểm thử Node đạt. Kiểm thử SQLite trong bộ nhớ đi qua nhập, lưu, đọc lại, tái dùng ánh xạ, sửa số lượng, tính doanh thu, chốt/gửi/duyệt và tạo Excel/PowerPoint; không sửa dữ liệu vận hành. Browser xác nhận mở bảng nhập và speech, không thu micro hoặc tạo ca trong lần kiểm tra này.
