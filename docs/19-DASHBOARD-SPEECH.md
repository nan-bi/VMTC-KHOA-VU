# Dashboard và speech-to-text

Chạy CHAY-DASHBOARD-SPEECH.cmd trong thư mục v8, mở http://127.0.0.1:4180/ và đăng nhập bằng tài khoản đã có. Chọn **Đọc kết quả siêu âm** trong thanh bên. Đóng cửa sổ chạy cũ nếu các cổng 4173/4180/4181 đang được dùng. Cài speech bằng CAI-DAT-SPEECH.cmd nếu chưa có model.

Giữ nguyên các trang, bảng, chức năng và bố cục; chỉ đổi màu sang hồng phấn/trắng. Ghi ca và Kết quả được nhúng nguyên màn hình. Dashboard giữ SQLite hiện tại; speech tiếp tục dùng IndexedDB tại http://127.0.0.1:4173 để thấy lại bản nháp/kết quả có sẵn. Không chuyển hay nhập dữ liệu speech vào báo cáo doanh thu. Bộ lọc ngày dashboard không lọc ca speech; speech giữ bộ lọc riêng.

Khi đang ghi/chép âm thanh, đang lưu nháp hoặc sửa xác nhận kết quả chưa lưu, chuyển mục/đăng xuất bị chặn để bảo toàn nội dung. Hãy dừng micro, chờ lưu và lưu xác nhận trước. Nếu khung không tải được, khởi chạy đủ dịch vụ local rồi tải lại trang. Micro chỉ mở khi người dùng đồng ý và bấm Bắt đầu; không tự ghi âm. Trình duyệt hỏi quyền micro cho địa chỉ local 4173.

CHAY-SPEECH.cmd và trang speech.html vẫn chạy độc lập như trước. Màu áp dụng cả trang thu dữ liệu speech-training.html. PhoWhisper chạy trên máy, không gửi âm thanh ra Internet. Việc tích hợp giao diện không thay đổi độ chính xác của model; bác sĩ vẫn phải kiểm tra bản chép trước khi dùng.
