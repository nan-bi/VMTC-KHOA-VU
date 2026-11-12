# Phạm vi dashboard theo báo cáo tuần 2 TC14

Đối chiếu tài liệu TC14_KhoaVu_BaoCaoTuan2 ngày 12/11/2026: vấn đề ưu tiên là tổng hợp số liệu tuần và chuyển từ Excel sang slide giao ban. Dashboard là công cụ thử trên dữ liệu giả lập; chưa xác nhận quy trình hoặc hiệu quả sử dụng thực tế tại khoa. Không sửa tài liệu Google Docs.

## Luồng chính

Nhập và lưu nguồn → danh mục / quy tắc → đối soát → tổng hợp → chốt số → xuất Excel / PowerPoint. Kho dữ liệu là nơi xem và sửa dòng; Chi tiết số liệu là nơi bóc tách dịch vụ, giá và số tổng; Tổng quan chỉ hiển thị chỉ tiêu nhanh. Quy tắc gói và lịch sử giá hiện có được giữ nguyên.

Đã bỏ menu Liên khoa & dữ liệu model khỏi giao diện chính. Không tải các giao diện huấn luyện, gán nhãn, hỏi đáp, hành trình khám và KPI BI-RADS/referral. Mã nguồn và dữ liệu liên quan vẫn giữ cho giai đoạn sau. Phân loại tài chính tại khoa / chuyển đến / chuyển đi chuyển thành bảng lọc trong Chi tiết số liệu, dùng cùng kho và kỳ hoàn thành, không nạp nguồn riêng.

## Đầu ra

PowerPoint giao ban nằm trong trang Báo cáo giao ban, chỉ xuất từ bản đã duyệt, có cả báo cáo lưu trữ. Số tổng nguồn và giá × số lượng dùng đúng snapshot lưu trong ứng dụng, không tính lại theo bảng giá đang chỉnh. Excel theo mẫu giữ các khối gốc và bổ sung GIA_X_SO_LUONG, KIEM_LOI khi báo cáo có snapshot doanh thu. Báo cáo cũ không có trường này vẫn giữ nguyên số liệu; chưa thể bổ sung giá lịch sử bằng giá hiện tại.

Giá trị nguồn trước giảm, sau giảm/phân bổ đã biết và doanh thu theo đơn giá cấu hình là các góc nhìn riêng; không cộng chồng. Không gọi chúng là tiền thực thu. Nhận xét là mẫu xác định có thể được người lập sửa, không gọi API AI.

## Việc cần khoa xác nhận

- Nguồn chính thức cho từng chỉ tiêu và cách giải quyết số lệch giữa các nguồn.
- Bảng giá và phân bổ lẻ / SKTQ / SLUT 1–2, thời điểm có hiệu lực.
- Phần bảo hiểm không cộng trong xét nghiệm máu.
- Nội trú chuyển kỳ, tiền giường, dược và hai nhóm vật tư.
- Loại chỉ định IVF, phiếu khám, điều kiện tính giá tái khám.
- Ánh xạ đủ 8 bảng, mẫu slide và đơn vị lượt / người / dịch vụ.

Các giới hạn trên xuất hiện tại Quy tắc & danh mục và trong thông tin bản xuất; không tự gán trạng thái đã được khoa phê duyệt. Chưa chứng minh mức giảm thời gian hoặc sai số dưới 0,05% so với dữ liệu chuẩn bệnh viện.
