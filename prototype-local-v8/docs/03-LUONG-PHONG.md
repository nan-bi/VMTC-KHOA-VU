# Luồng phòng trong prototype

Phạm vi thay đổi theo yêu cầu: mở rộng ngoài báo cáo cấp khoa sang mô phỏng tiếp đón, điều phối, chỉ định và trả kết quả. Không phải HIS/EMR đã triển khai.

## Cơ cấu

12 phòng: 4 khám, 1 siêu âm 3D, 2 siêu âm vú thường, 1 tư vấn can thiệp, 1 can thiệp, 1 hồi tỉnh, 1 đánh giá ban đầu, 1 XQ vú. Quầy tiếp đón là điểm đăng ký ngoài 12 phòng.

## Những kết nối được phép

| Nơi gửi | Nơi nhận | Điều kiện |
| --- | --- | --- |
| Tiếp đón | Đánh giá ban đầu | Tạo lượt và xác nhận đúng mã bệnh nhân |
| Đánh giá ban đầu | Một trong 4 phòng khám | Hoàn tất đánh giá, chọn phòng khám cụ thể |
| Phòng khám phụ trách | SA 3D / SA thường 1 hoặc 2 / XQ | Bác sĩ xác nhận từng chỉ định và nơi thực hiện |
| CĐHA | Phòng khám / bác sĩ ra chỉ định | Kết quả gắn mã chỉ định; không tự tạo chỉ định tiếp theo |
| Phòng khám phụ trách | Tư vấn can thiệp | Có chỉ định tư vấn riêng |
| Tư vấn can thiệp | Phòng khám / bác sĩ phụ trách | Trả nội dung tư vấn, chờ quyết định thực hiện |
| Phòng khám phụ trách | Can thiệp | Tư vấn đã hoàn thành; bác sĩ ra chỉ định thực hiện riêng |
| Can thiệp | Hồi tỉnh | Chỉ định có yêu cầu hồi tỉnh và xác nhận bàn giao |
| Can thiệp không yêu cầu hồi tỉnh | Phòng khám / bác sĩ phụ trách | Xác nhận bàn giao và kết quả |
| Hồi tỉnh | Phòng khám / bác sĩ phụ trách | Xác nhận bàn giao sau theo dõi |
| Phòng khám | Kết thúc lượt | Bác sĩ xác nhận; mọi phiếu đã xong |

Tất cả bệnh nhân đi qua Đánh giá ban đầu: **đã được người dùng xác nhận**. Trình tự tư vấn → bác sĩ xem lại → chỉ định can thiệp là cấu hình thận trọng cho demo, cần khoa rà soát trước dùng thật. Prototype không tự xác định người bệnh cần thủ thuật, hồi tỉnh hay đủ điều kiện ra về.

Không nối CĐHA trực tiếp sang can thiệp, không tự đổi phòng khám, không nối mọi phòng với nhau. Hai phòng SA thường là các nơi thực hiện thay thế, không tạo hai chỉ định cùng dịch vụ cho cả hai trong một đợt. Bác sĩ có thể chủ động chọn nhiều loại CĐHA; không mặc định siêu âm xong là chụp XQ hoặc ngược lại.

## Dữ liệu và trạng thái

- `patient_id`: định danh bệnh nhân; bệnh nhân cũ tái sử dụng mã này, không ghép theo tên.
- `visit_id`: lượt khám trong ngày; gắn phòng khám và bác sĩ phụ trách.
- `order_id`: phiếu chỉ định, người ra chỉ định, nơi nhận, đợt chỉ định, kết quả và thời điểm hoàn thành.
- Phiếu phòng: chờ tiếp nhận → đang thực hiện → hoàn thành.
- Kết quả có ngay trong hồ sơ lượt; đủ kết quả của đợt mới tạo phiếu bác sĩ đọc kết quả. Không tự khởi động tiếp nhận người bệnh tại nơi mới.
- Can thiệp cần hồi tỉnh chưa được coi hoàn thành toàn bộ khi mới rời phòng can thiệp. Kết quả can thiệp và hồi tỉnh lưu riêng.
- Mỗi lượt chỉ có một phiếu đang thực hiện. Mỗi phòng tối đa một lượt đang thực hiện trong demo; chưa mô hình hóa giường hồi tỉnh, lịch trực, công suất hoặc ưu tiên cấp cứu.

## Cách demo

Vào **Tiếp đón & phòng khám**. Ngày mẫu mặc định 23/10/2026, hoặc dùng “Nạp lại 3 bệnh nhân mẫu” để tạo dữ liệu cho ngày đang chọn.

1. Quầy tiếp đón → Tiếp đón bệnh nhân → hồ sơ mới hoặc chọn mã cũ → tạo lượt.
2. Chọn Đánh giá ban đầu → Tiếp nhận → Đánh giá & phân phòng.
3. Chọn phòng khám vừa phân → Tiếp nhận → Khám & chỉ định.
4. Chọn phòng CĐHA được chỉ định → Tiếp nhận → ghi kết quả. Không tạo kết quả từ phòng khác.
5. Khi đủ kết quả, phòng khám ban đầu có phiếu đọc kết quả → Tiếp nhận → xem kết quả → chỉ định tiếp hoặc kết thúc.
6. Để demo can thiệp: bác sĩ chỉ định tư vấn → phòng tư vấn ghi nhận → bác sĩ đọc lại và ra chỉ định thực hiện → phòng can thiệp bàn giao hồi tỉnh nếu có yêu cầu → hồi tỉnh bàn giao bác sĩ.

## Giới hạn và phần để kết nối thật

Hiện dữ liệu lưu trên một trình duyệt; các tab cùng origin cập nhật qua sự kiện storage để minh họa nhiều trạm. Chưa có giao dịch nguyên tử giữa tab, chưa bảo đảm xung đột ghi đồng thời. Không dùng dữ liệu thật. Bộ báo cáo cũ vẫn dùng bộ giả lập độc lập; kết thúc dịch vụ ở mô phỏng điều phối chưa tự tạo doanh thu.

Để các máy ở nhiều phòng vận hành thật cần backend chung + cơ sở dữ liệu giao dịch + đăng nhập/phân quyền bác sĩ/điều dưỡng/KTV + API tích hợp HIS/EMR/RIS/PACS + sự kiện thông báo phòng nhận + khóa phiên bản/transaction + nhật ký không sửa + kiểm soát dữ liệu cá nhân. Phòng chỉ được nhận phiếu thuộc phạm vi, chỉ định và kết quả được xác nhận theo người thực hiện thực tế. Không triển khai bằng cách chia sẻ localStorage hoặc mở site công khai.


## Tài khoản phòng và file đính kèm (bổ sung)

Chọn tài khoản mẫu ở đầu trang Tiếp đón & phòng khám: 1 lễ tân, 1 đánh giá ban đầu, 4 bác sĩ theo phòng khám, 3 siêu âm, 1 XQ, 1 tư vấn, 1 can thiệp, 1 hồi tỉnh và 1 điều phối. Mỗi tài khoản có hàng đợi riêng; điều phối chỉ xem chuyên môn và có nút nạp lại dữ liệu mẫu.

Lễ tân tạo hoặc cập nhật thông tin hành chính, đính kèm giấy tiếp nhận. Đánh giá ban đầu nhận tất cả lượt rồi phân phòng khám. Bác sĩ xem các lượt thuộc phòng mình, ra chỉ định và nhận kết quả về đúng lượt. Phòng thực hiện chỉ nhận, ghi kết quả và gửi file cho phiếu của phòng mình. Siêu âm không thấy phiếu/file XQ và ngược lại; bác sĩ phụ trách nhận cả hai. Hồi tỉnh nhận phiếu can thiệp theo bàn giao.

Nhập nội dung hoặc chọn file PDF/PNG/JPEG (tối đa 5 MB/file, 5 file/lần), bấm Xác nhận & bàn giao. Chọn file chưa làm chuyển bước; chỉ xác nhận thành công mới gắn file vào lượt/phiếu. File tải về giữ tên gốc, có phòng gửi, mã chỉ định và thời gian trong lịch sử.

Đây là mô phỏng phân quyền trên giao diện và bộ xử lý phía trình duyệt, không phải ranh giới bảo mật. Mọi tài khoản dùng chung dữ liệu demo trên cùng trình duyệt/origin. Dữ liệu lượt ở localStorage, nội dung file ở IndexedDB; xóa dữ liệu trình duyệt sẽ mất chúng. Chưa đồng bộ nhiều máy, chưa có tài khoản nhân viên thật, xác thực hoặc kiểm tra quyền tại máy chủ. Không nhập dữ liệu bệnh nhân thật. Khi triển khai vận hành cần backend xác thực người dùng, kiểm tra quyền từng API, cơ sở dữ liệu chung và kho file bảo vệ theo quyền.

## Gói bàn giao và kiểm tra toàn vẹn (bản 30/10/2026)

Mỗi phiếu/chỉ định/file giữ mã bệnh nhân, lượt và nguồn gửi. Gói bàn giao gồm ghi chú tiếp đón, cảnh báo được ghi nhận tại đánh giá ban đầu và nội dung nguồn trực tiếp cần thiết. Phòng thực hiện nhận phiếu riêng; không nhận kết quả của nhánh siêu âm/XQ song song không liên quan. Bác sĩ phụ trách đọc đủ kết quả của đợt trước khi quyết định bước tiếp.

Hồi tỉnh chỉ có khi chỉ định can thiệp yêu cầu và phòng can thiệp xác nhận bàn giao. Kết quả về đúng phòng khám và bác sĩ gốc; đóng lượt cần kết luận cuối và không còn phiếu/chỉ định dang dở. Không có nút chuyển tùy ý sang phòng khác. Dữ liệu sai liên kết bị chặn lưu và giữ nguyên để kiểm tra.

Chưa có quy trình hủy phiếu, vắng mặt, đổi bác sĩ, sửa kết quả đã ký hoặc cấp cứu; không dùng đường chuyển chung để thay thế các quy trình này. Khoa cần xác nhận các nhánh ngoại lệ trước khi triển khai thật.
