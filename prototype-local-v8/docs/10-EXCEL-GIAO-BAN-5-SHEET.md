# Excel giao ban 5 sheet

Tại **Liên khoa & dữ liệu model → Xuất kết quả đã tính**, bấm **Xuất Excel giao ban (5 sheet)**. Kết quả là một file `.xlsx` với đúng năm sheet:

| Sheet | Nội dung |
|---|---|
| 01_TONG_HOP_GIAO_BAN | Lượt khám, dòng can thiệp/CĐHA, ba nhóm luồng, tài chính từng góc nhìn, thiếu dữ liệu và metadata |
| 02_KHOA_VU_TU_THUC_HIEN | Khoa Vú chỉ định, Khoa Vú thực hiện |
| 03_KHOA_NGOAI_CHUYEN_DEN | Khoa khác chỉ định, Khoa Vú thực hiện |
| 04_KHOA_VU_GUI_KHOA_BAN | Khoa Vú chỉ định, khoa khác thực hiện |
| 05_CHI_TIET_GOI_DICH_VU | Dòng TRONGGOI liên quan Vú và dòng cùng gói, cùng BN, cùng lượt tại khoa khác |

## Phạm vi và cách cộng

- Dùng nguồn, ngày/khoảng ngày và địa bàn đang chọn. Cùng snapshot, ID và SHA-256 với Excel 10 sheet/PowerPoint nếu không đổi dữ liệu hoặc kỳ.
- Sheet 02–04 giữ các dòng phân loại được có chỉ định hoặc hoàn thành trong kỳ, bao gồm cả dòng bị loại để có bằng chứng đối soát. Chỉ cộng các cột **Ghi nhận chỉ định VND**, **Ghi nhận thực hiện trước giảm VND**, **Ghi nhận thực hiện sau giảm VND** theo góc nhìn cần xem. Không cộng thẳng các cột tiền nguồn khi có dòng hủy, trùng hoặc xung đột.
- Tổng chỉ định theo ngày chỉ định, tổng thực hiện theo ngày hoàn thành. Dịch vụ chỉ định trước kỳ nhưng hoàn thành trong kỳ chỉ đóng góp vào thực hiện.
- Hai góc nhìn không cộng thành tổng doanh thu và chưa phải tiền thực thu. Giá trị Vú gửi khoa bạn là giá trị chỉ định, không chuyển thành doanh thu Vú thực hiện.
- Sheet 05 là lát cắt bổ sung, có thể lặp dòng tại sheet 02–04. Không cộng thêm tiền gói vào tổng các luồng. Mã gói dùng chung không đủ để nối khách; chỉ nối cùng mã gói, mã BN và mã lượt. Chưa hỗ trợ ghép gói kéo dài qua nhiều lượt khi chưa có mã phiên gói riêng.
- Phân bổ cho Vú chỉ ghi khi nguồn phân bổ hợp lệ khớp giá trị sau giảm, dịch vụ đủ điều kiện hoàn thành trong kỳ và do Vú thực hiện. Phần khoa khác tách riêng. Phân bổ thiếu/không áp dụng để trống; số 0 thực được giữ nguyên.

## Thông tin thiếu và chỉ số

Tên gói và bác sĩ chỉ định lấy từ `package_name` và `ordering_doctor_name`/`ordering_doctor`. Nhập file cũng nhận cột **Tên gói dịch vụ**, **Tên gói**, **Bác sĩ chỉ định**; các cột ánh xạ trùng sẽ bị chặn. Thiếu thì để trống, không đặt tên bác sĩ dựa trên phòng.

“Lượt khám” đếm visit_id duy nhất có khám hoàn thành tại Vú. Can thiệp/CĐHA là số dòng dịch vụ, chưa có mã ca nên không ghi thành số ca. Tỷ lệ chuyển tiếp giữ nguyên tử số/mẫu số và giới hạn nghiệp vụ hiện tại. Nhận xét tự động là mô tả theo quy tắc; chưa kết nối AI, chưa có so sánh kỳ trước hoặc dữ liệu bệnh tật đầy đủ để kết luận xu hướng hay giữ chân BN.

File giữ mã BN dạng văn bản, tiền đã tính dạng số và metadata truy vết. Bản nguồn cũ thiếu sheet/hash/dòng để trống. Sheet rỗng vẫn có tiêu đề cột. Đây là snapshot; sửa Excel không tự tính lại tổng.

Để xem toàn nguồn, dòng ngoài kỳ, ngoài phạm vi hoặc chưa phân loại được, dùng **Xuất Excel đầy đủ (.xlsx)** (10 sheet). File 5 sheet dành cho giao ban, không thay thế bản đối soát toàn bộ.

## Code và kiểm tra

- `src/features/intelligence/executiveExport.mjs`: chuyển snapshot sang mô hình 5 sheet và ghi XLSX bằng SheetJS.
- `tests/executiveExport.test.mjs`: 7 test kiểm tra cấu trúc, tổng tiền, ngày, đếm lượt, gói không nối khác khách, tiền thiếu và các cột tùy chọn.
- Tổng dự án: 82 test JavaScript đạt; audit 182 giá trị mẫu đạt. Kết quả mẫu không chứng minh sai số <0,05% trên dữ liệu bệnh viện thực tế.
