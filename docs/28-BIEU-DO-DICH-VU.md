# Biểu đồ dịch vụ và doanh thu

- **Tổng quan → Dịch vụ đã thực hiện**: biểu đồ cột đứng theo từng mã dịch vụ, dùng đúng `stats.table.qty` theo kỳ và phạm vi Khoa Vú chỉ định. Chỉ vẽ dịch vụ có phát sinh, không giới hạn ở bảy nhóm. Bấm cột mở các dòng nguồn tạo nên số lượng. Cột cao nhất là mốc tối đa, trục bắt đầu tại 0; số lượng chính xác ghi trên cột. Danh sách dài có thể cuộn.
- **Chi tiết số liệu → Tính toán & doanh thu → Doanh thu theo từng dịch vụ**: cộng các dòng doanh thu đã tính theo mã dịch vụ, chia màu theo SKTQ, SLUT 1, SLUT 2, gói khác và lẻ. Không nhân giá hoặc cộng phân bổ lại. Biểu đồ thay đổi cùng lịch và nhóm khoa chỉ định. Bấm cột mở bảng đơn giá, số lượng, phép nhân và doanh thu của riêng dịch vụ đó.
- Giá chưa xác định không được đổi thành 0. Biểu đồ ghi phần thiếu và chỉ vẽ doanh thu đã tính được. Dịch vụ miễn phí có doanh thu xác định bằng 0 vẫn được phân biệt với thiếu giá. Tổng biểu đồ không thay thế kiểm tra lỗi nguồn hoặc báo cáo đã chốt.
- Không gọi dịch vụ bên ngoài hoặc thêm thư viện biểu đồ. Giữ bảng số liệu để đối chiếu và xuất báo cáo.

Kiểm chứng ngày 16/11/2026: 248 Node tests đạt (gồm kiểm tra tổng theo mã dịch vụ qua nhiều mức giá, phân biệt giá thiếu/miễn phí/phần biết); production build 35,03 giây đạt, còn cảnh báo chunk lớn hiện hữu. Browser local 4180 ngày 25/10: biểu đồ hoạt động 6 khám + 6 siêu âm + 4 XQ2D + 1 XQ3D = 17 đơn vị. Biểu đồ doanh thu Khoa Vú 2.470.000 + 2.450.000 + 1.910.000 + 570.000 = 7.400.000 đồng; đổi khoa khác hiển thị 500.000 + 400.000 + 300.000 = 1.200.000 đồng. Bấm mở dòng nguồn/cách tính đạt. Không sửa dữ liệu vận hành. Không thay Python nên không chạy lại riêng suite Python.

Cập nhật bố cục: hai biểu đồ dùng cột đứng, trục dọc từ 0, giá trị trên đỉnh cột, tên dịch vụ phía dưới; biểu đồ doanh thu là cột chồng theo nhóm giá. Khi nhiều dịch vụ hoặc màn hình hẹp có thể cuộn ngang. Chỉ đổi cách vẽ, không đổi tổng hoặc bộ lọc. Build cuối13,42s đạt; browser kiểm tra hai biểu đồ và mở nguồn/cách tính đạt.


Bổ sung biểu đồ đường Diễn biến dịch vụ theo ngày tại Tổng quan: toàn bộ danh mục (kể cả mã bổ sung đã xác nhận), tìm/bật/tắt từng đường, xem toàn kỳ có dữ liệu. Bấm điểm mở bảng dịch vụ trong ngày rồi chọn dòng nguồn. Kỳ một ngày chỉ có một điểm; chọn Khoảng ngày để xem xu hướng. 250Node tests và browser kỳ19–25/10 đã kiểm tra tổng140đơn vị,4dịch vụ phát sinh/87mã tại thời điểm kiểm tra; không sửa dữ liệu nguồn. Ảnh service-trend-proof.png.

Cập nhật cuối 16/11/2026 theo yêu cầu người dùng: đã bỏ biểu đồ đường khỏi Tổng quan; giữ các biểu đồ cột. Phần mô tả biểu đồ đường phía trên là lịch sử triển khai, không còn là giao diện hiện tại.
