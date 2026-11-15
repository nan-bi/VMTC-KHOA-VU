# Lưu trữ lịch sử

Theo yêu cầu mới ngày 15/11/2026, giao diện speech dùng IndexedDB trong trình duyệt, không dùng thư mục này để lưu ca mới. Backend lưu SQLite còn trong mã để bảo toàn công việc trước đó nhưng giao diện hiện tại không gọi API ghi/chuyển ca. Không tự xóa tệp dữ liệu cũ nếu có.
