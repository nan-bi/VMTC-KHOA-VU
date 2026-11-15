# Căn chỉnh giao diện · 15/11/2026

- Dùng chung Noto Sans trong dự án cho dashboard, đăng nhập và speech; không tải font qua Internet. Font có sẵn tại src/features/speech/fonts, giữ giấy phép OFL đi kèm.
- Điều chỉnh cỡ chữ, độ đậm, chiều cao dòng, màu chữ phụ và khoảng cách giữa các khối. Căn tiêu đề, lịch, thẻ số liệu, nút, phần nhập dữ liệu và bảng; giữ bảng rộng cuộn trong khung.
- Màn hình nhỏ chuyển các nhóm về ít cột hơn; các nút, bộ lọc và nhãn được xuống dòng. Speech chuyển từ ba cột sang hai hoặc một cột theo chiều rộng khung nhúng.
- Tiêu đề phụ mô tả tác vụ theo từng trang, thay khẩu hiệu khẳng định. Ví dụ: “Tổng hợp dịch vụ và giá trị ghi nhận trong kỳ báo cáo”; “Ghi kết quả siêu âm”; “Phân loại phạm vi doanh thu”. Trạng thái đối soát dùng “Chưa phát hiện lỗi chặn theo quy tắc hiện tại”.
- Không thay phép tính, quy tắc phân loại, phân quyền hoặc cơ chế lưu ca. Chỉ điều chỉnh trình bày và nhãn.

Kiểm chứng: 236 kiểm thử Node đạt; build thành công (còn cảnh báo bundle lớn). Quan sát Tổng quan, Nhập dữ liệu, Chi tiết, Kho dữ liệu, Đối soát, Báo cáo, Lịch sử, Quy tắc và speech nhúng. Kiểm tra chiều rộng desktop 1440 và mobile 390; các trang đã kiểm tra không có tràn ngang toàn trang, bảng có vùng cuộn riêng. Font computed của dashboard và speech đều Khoa Vu Sans/Noto Sans. Không thu micro, sửa dữ liệu người dùng hoặc tạo ca mới. Viewport tạm đã trả về kích thước ban đầu.

Mở lại trang local khi không còn đang ghi âm để nhận bản build mới.
