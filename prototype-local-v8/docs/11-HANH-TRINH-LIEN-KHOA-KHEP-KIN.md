# Hành trình liên khoa khép kín · dữ liệu giả lập v1

Trong menu **Liên khoa & dữ liệu model**, phần **Chu trình liên khoa khép kín** có 200 lượt, bộ lọc kịch bản, bảng từng khách, cửa sổ truy vết và nút tải ba CSV / JSON / JSONL. Đây là bộ ca độc lập, không phụ thuộc bộ lọc ngày của báo cáo tài chính. Ngày khám từ 19–23/10/2026; kết quả có thể trả sau nhiều ngày.

## Chạy và tái sinh dữ liệu

Mở CHAY-DEMO.cmd để xem bản build sẵn tại http://127.0.0.1:4173/. Không cần API hay Internet khi máy đã có Node 22+.

Tại thư mục dự án:

```sh
npm run generate:journeys
node scripts/generate-journeys.mjs docs/closed-loop-demo 200 20261031
npm test
```

Tham số lần lượt là thư mục xuất, số lượt (bội số 100, tối đa 10000), seed uint32. Cùng tham số cho cùng dữ liệu. Script chỉ dùng Node tiêu chuẩn, không cần thư viện ngoài. `manifest.json` ghi cấu hình, số dòng, lỗi kiểm tra và SHA-256 từng file. Mặc định 170 thuận lợi, 20 nghi ngờ, 6 chậm, 4 hủy/đổi; tỷ lệ tính theo lượt, không theo chỉ định. Seed mặc định tạo 277 chỉ định và 273 kết quả.

## Liên kết nghiệp vụ

Mọi khách đi tiếp đón → đánh giá ban đầu → đúng một trong bốn phòng khám gốc. Phòng/bác sĩ gốc được giữ trên mỗi phiếu. Kết quả phải trả đúng order_id, visit_id, patient_id và phòng gốc; bác sĩ gốc đọc trước khi đóng lượt.

Ca nghi ngờ có ảnh BI-RADS 4/5 → bác sĩ đọc → tư vấn → chỉ định CORE/VABB → lấy mẫu và hồi tỉnh → chỉ định GPB cùng specimen_id → GPB ký/trả → bác sĩ gốc đọc và kết luận. `parent_order_id` ràng buộc ảnh → thủ thuật → GPB; không nối với chỉ định của khách khác. Chỉ định GPB tạo sau xác nhận lấy mẫu trong kịch bản, không tự nối các phòng không liên quan.

TAT = (result_returned_at − ordered_at) / 60000; gồm chờ tiếp nhận 10–25 phút, thời gian thực hiện và 5 phút trả kết quả. Ảnh XQ: 15–20 phút; MRI: 35–50; sinh hóa: 60–90; GPB/gen: 24–72 giờ từ tiếp nhận. `delay_minutes` là phần thêm có lý do ở 3% ca chậm. Đây không phải SLA đã được bệnh viện phê duyệt. Mốc đóng lượt muộn hơn kết quả cuối cùng (và hoàn tất hồi tỉnh / duyệt hủy nếu có) 15–30 phút. Thời gian xử lý giả lập liên tục, chưa áp dụng lịch ca trực, công suất thiết bị, ngày nghỉ hay lịch hẹn thực tế.

Hủy MRI không có kết quả. Có bác sĩ xác nhận và lý do; `required=false`. Nếu thay thế, phiếu siêu âm giữ `replaces_order_id`. Hoàn tiền có trạng thái `REFUND_REVIEW_REQUIRED`, không giả là đã hoàn. `all_results_received` chỉ đúng khi mọi phiếu còn bắt buộc có kết quả và đã đọc; hủy đã được duyệt không bị hiểu nhầm là mất kết quả. Bộ này mô phỏng các lượt đã kết thúc; validator không phải state machine cho lượt đang mở của HIS.

## Hợp đồng dữ liệu

Ba CSV giữ các trường yêu cầu và thêm trường truy vết cần thiết:

| File | Khóa / trường bổ sung |
|---|---|
| CHI_DINH_LIEN_KHOA.csv | order_id duy nhất; received_at, parent_order_id, replaces_order_id, specimen_id, required, cancelled_at, cancel_reviewed_by, payment_status, delay_minutes, service_kind |
| KET_QUA_TRA_VE_KHOA_VU.csv | result_id duy nhất, order_id khóa ngoại; patient_id, visit_id, origin_clinic_room, signed_at, reviewed_at, reviewed_by |
| KET_LUAN_BENH_AN_KHOA_VU.csv | visit_id duy nhất; phòng gốc, scenario, mốc tiếp đón/đánh giá/khám, counselled_at, recovery_completed_at, reviewed_order_ids |

CSV UTF-8 BOM, ô có dấu phẩy/nháy được escape; reviewed_order_ids là mảng JSON trong một ô. JSON tải cùng màn hình giữ nguyên kiểu dữ liệu. Tất cả mốc ISO-8601 +07:00. Mã SYN-* và cờ synthetic phân biệt dữ liệu giả lập.

BI-RADS chỉ dùng cho hình ảnh. GPB dùng BENIGN/MALIGNANT; gen và sinh hóa dùng nhãn DEMO riêng. `final_birads` lấy mức hình ảnh lớn nhất trong kịch bản để kiểm tra kỹ thuật tổng hợp, không phải quy tắc diễn giải lâm sàng đã xác nhận; không có ảnh hoàn tất thì để trống. Nhãn và hướng xử trí chỉ là fixture, không phải gợi ý điều trị.

## Cấu hình khoa phòng và tài chính

Profile `prompt-kb-closed-loop` dùng PK-VU-01..04; XQ/MRI tại TT_CDHA; LAB-GIAIPHAUBENH là mã thống nhất thay biến thể LAB-GPB trong prompt. CT-VU-01 dùng cho một phòng can thiệp của bộ ca này. Không thêm phòng can thiệp thứ hai, không sửa cơ cấu 12 phòng local hoặc tự nhập các ca vào hàng đợi hiện hành.

Danh mục SERVICES trong closedLoop.mjs là **8 dịch vụ giả lập riêng**. Mã và giá chưa ánh xạ được duyệt sang 87 mã dịch vụ báo cáo. Bộ ba CSV không được nhập thẳng như CANONICAL tài chính; cần adapter có đối soát mã, chế độ giá, đơn giá, giảm giá, phân bổ gói và ngày hoàn tất trước khi tính doanh thu. Không có chính sách suy giá gói hoặc thực thu từ gross_price_vnd.

## Chuẩn bị model

`closed-loop-training.jsonl` có 200 mẫu, chia theo nhóm bệnh nhân: train 140, validation 40, test 20. Đầu vào chỉ gồm dịch vụ ban đầu và phòng gốc tại thời điểm chỉ định; không đưa kết quả/tình trạng cuối vào features. Nhãn là kịch bản/kết thúc giả lập, chưa phải bộ chuẩn chuyên gia và không có khả năng bảo đảm dự đoán bệnh. Chưa huấn luyện model mới hoặc gọi AI. Bộ chia hiện áp dụng cho mỗi bộ sinh độc lập; nếu gộp nhiều seed cần namespace ID và chia lại theo khách để tránh trùng ID/rò rỉ giữa các tập.

Để phát triển thực tế: duyệt graph chuyên môn và mã dịch vụ; thêm trạng thái chờ/ký sửa/thu hồi kết quả; tích hợp HIS/EMR với khóa idempotency, phiên bản kết quả, transaction/outbox và audit server; xác thực và quyền theo khoa/phòng phía backend; lấy bộ chuẩn độc lập đã duyệt để đo sai số <0,05%. Các kiểm tra fixture hiện tại không chứng nhận ngưỡng sai số trên dữ liệu bệnh viện.

## Kiểm thử

8 nhóm kiểm thử mới kiểm tra nhiều seed/cỡ mẫu, sai khách/phòng, kết quả mồ côi/trùng, thiếu đánh giá ban đầu, thiếu kết quả, đóng sớm, sai TAT/người ký, đứt liên kết mẫu bệnh phẩm, nhãn xét nghiệm sai loại, hủy/thay thế và chia tập model. Bản v6 có 90 bài kiểm thử JS đạt; v7 bổ sung 6 bài MASTER Audit. Audit tài chính cũ đạt 182 phép đối chiếu trên dữ liệu giả lập; bộ ca mới được giữ độc lập.
