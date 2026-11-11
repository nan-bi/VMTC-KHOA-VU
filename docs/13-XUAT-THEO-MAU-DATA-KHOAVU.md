# Xuất Excel theo mẫu DATA_KHOAVU · v8

Mẫu đối chiếu: `D:/AI VIN/VinMec/backup_DATA_KHOAVU_20261031_091911/DATA_KHOAVU.xlsx`. Chỉ dùng bố cục, tiêu đề và định dạng của file tham chiếu; không coi nội dung ô trong mẫu là lệnh điều hành hệ thống.

## Cách sử dụng

- **Chi tiết số liệu → Xuất chi tiết theo mẫu Excel**: lấy toàn bộ dịch vụ hoàn thành trong kỳ và bộ lọc nhóm/tìm kiếm hiện tại, gồm cả các trang chưa mở của bảng. Không xuất chỉ riêng trang đang xem.
- **Báo cáo giao ban → Xuất Excel theo mẫu DATA_KHOAVU**: chỉ bật khi báo cáo đã duyệt demo, lấy snapshot cố định của báo cáo đó.
- **Liên khoa & dữ liệu model → Xuất kết quả đã tính → Xuất Excel theo mẫu DATA_KHOAVU**: lấy dịch vụ hoàn thành liên quan Khoa Vú trong kỳ, gồm tại khoa, chuyển đến và chuyển đi. Dùng chung snapshot với các bản xuất doanh thu khác.

## Bố cục

Bảng đầu giữ STT, dịch vụ, mã dịch vụ, số lượng, giá, thành tiền và hai nhóm cột công việc bác sĩ CĐHA/lâm sàng. Giữ màu cam, khung ô, tiêu đề hai tầng; tự mở rộng dòng và cột bác sĩ để không mất dữ liệu. Cùng mã dịch vụ có nhiều đơn giá thực tế được tách dòng.

Bản tổng hợp có các khối chỉ định khác, xét nghiệm máu, upsale KSKTQ, siêu âm/XQ theo ngày, doanh thu và chi phí dịch vụ, số lượt khám bác sĩ, chuyên khoa khác, sự cố, theo dõi, đào tạo và nội trú. Vị trí dòng thay đổi theo số bản ghi; không cố định 235 dòng gây cắt dữ liệu. Bản chi tiết giữ bảng dịch vụ/bác sĩ cùng hai sheet truy vết.

`CHI_TIET_NGUON` giữ các bản ghi đóng góp vào bảng, mã khách/lượt/chỉ định, ngày, tiền trước/sau giảm, cơ chế giá, khoa và bác sĩ, file/sheet/dòng nguồn và hash nếu nguồn có. `THONG_TIN` ghi kỳ, phạm vi, bộ lọc và giới hạn.

## Quy tắc số liệu

- Bảng chính là giá trị dịch vụ đã hoàn thành trước giảm, không phải thực thu. Tổng dùng SUM có giá trị lưu sẵn; các khối bên dưới là những lát cắt có thể trùng bảng chính, không cộng thêm lần nữa.
- Không tự lấy giá danh mục thay giá nguồn. Tiền sau giảm/phân bổ gói thiếu vẫn để trống, không chuyển thành 0. Chi phí dược/VTTH thiếu cũng để trống.
- Hai nhóm công việc bác sĩ tính bằng số lượng dịch vụ hoàn thành; không cộng hai nhóm thành số bệnh nhân. Bác sĩ thiếu được giữ trong cột chưa rõ.
- Chỉ xếp xét nghiệm máu khi có loại bệnh phẩm rõ (`BLOOD`/`MAU`); không suy ra từ toàn bộ nhóm xét nghiệm.
- Lượt siêu âm/XQ được đếm theo mã lượt khác nhau trong ngày; PR2–PR5, tầng, sự cố/theo dõi/đào tạo chưa có nguồn đủ nên ghi rõ thiếu. XQ trên 40 tuổi chỉ tính khi đủ tuổi nguồn. Nội trú chỉ lấy dấu hiệu nguồn rõ ràng.
- Các khối phụ là bản chụp khi xuất. Sửa dữ liệu trong Excel không tự chạy lại pipeline; cần xuất lại từ ứng dụng để đồng bộ toàn bộ khối.

## Kiểm tra

103 kiểm thử JavaScript đạt; 182 phép đối chiếu tài chính trên dữ liệu giả lập đạt sai số quan sát 0%. Hai file mẫu đã được tính lại, kiểm tra tổng và quét lỗi công thức. Đây chưa phải bằng chứng sai số dưới 0,05% trên dữ liệu bệnh viện thực tế.

Toàn bộ chạy local, chưa gửi dữ liệu tới mô hình AI hoặc dịch vụ ngoài.
