# Kiểm tra trước khi cập nhật Git · 16/11/2026

Bản mã hiện tại đủ để thực hành các luồng đã kiểm tra trên máy local. Chưa có căn cứ xác nhận hệ thống đã hoàn tất nghiệm thu nghiệp vụ hoặc đạt sai số thực tế dưới 0,05%.

| Kiểm tra | Kết quả |
|---|---|
| Toàn bộ Node tests | 255 đạt, 0 lỗi |
| Python unittest discovery | 61 đạt, 0 lỗi |
| Production build | Đạt, 12,95 giây; còn cảnh báo dung lượng chunk |
| Backend /api/health | OK, đã có tài khoản |
| Speech proxy/model | READY; kiểm tra origin, khóa, định dạng, kích thước và route đạt |
| Browser | Tổng quan, Chi tiết, kho dữ liệu, bảng tham chiếu, giao ban, lịch sử, quy tắc, speech nhúng mở được |
| Nhập liệu | Mở chọn file/thư mục, giới hạn 100 MB/file; kiểm thử tự động nhập/lưu/reload và tái dùng ánh xạ đạt |
| Tính/xuất | Kiểm thử SQLite riêng sửa số lượng → tính → chốt/gửi/duyệt → tạo Excel/PPTX đạt; browser tính lại hiển thị kết quả |
| Giao diện | Tổng quan đã bỏ biểu đồ đường, giữ cột; không ghi nhận lỗi console trong lượt kiểm tra |

Không tạo/sửa ca speech hoặc sửa SQLite vận hành khi kiểm tra. Micro trực tiếp và độ chính xác giọng đọc thực tế chưa được kiểm thử trong lượt này. Model local hiện học nhãn cặp khoa đã xác nhận; không phải mô hình tự hiểu và quyết định mọi bảng Excel không cần đối soát.

Nguồn hiện có 10.800 dòng lỗi chặn, chủ yếu các nhóm trùng mã nhưng khác nội dung. Hệ thống giữ cách ly và chặn chốt, không tự bỏ để đủ điều kiện xuất cuối. Giá, phân bổ gói, nguồn chính thức và các quy tắc bệnh viện còn cần khoa xác nhận. Chưa có bộ chuẩn độc lập đầy đủ để kết luận sai số dưới 0,05%.

Git chỉ nhận mã nguồn, tài liệu và dữ liệu kiểm thử sẵn có. SQLite vận hành, tài khoản, khóa, môi trường/model và kho ca IndexedDB không được đóng gói lên Git. Sau clone cần cài thư viện, tải model và build theo README.
