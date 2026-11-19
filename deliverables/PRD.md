# Product Requirements Document — PinkPath

> Status: v1.1 · 18/11/2026 · Đối chiếu source `a03239e` (logic tính toán không đổi so với `c352f04`). Bối cảnh: [PROJECT_BRIEF.md](PROJECT_BRIEF.md). Quy tắc: [BUSINESS_RULES.md](BUSINESS_RULES.md). Story + AC: [USER_STORIES.md](USER_STORIES.md). Chênh lệch: [GAP_ANALYSIS.md](GAP_ANALYSIS.md).

## 1. Mục tiêu sản phẩm

| Mục tiêu | Chỉ số (chi tiết [KPI_ROI.md](KPI_ROI.md)) |
|---|---|
| G1. Giảm thời gian làm báo cáo doanh thu tuần | Phút/tuần, baseline ~290 |
| G2. Giảm chỗ số liệu bị hỏi lại ở giao ban | Số chỗ/buổi, baseline 3 |
| G3. Giảm thời gian đọc–ghi kết quả siêu âm | Phút/ca tầng 3, baseline ~10,5 (đo thực địa 09/11, 10 ca). Kết quả thử trên bộ dữ liệu giả chỉ là chỉ báo, không so trực tiếp với baseline |
| G4. Không phát sinh sai sót mới | Lỗi bên vú = 0; số đã chốt không bị sửa ngoài luồng |

## 2. Phạm vi tính năng

Trạng thái: **Có** = chạy đầu cuối trên UI với dữ liệu giả lập · **Một phần** = chạy nhưng thiếu điều nêu ở ghi chú · **Chưa** = chưa có.

### 2.1. Báo cáo doanh thu

| # | Tính năng | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|---|
| F1 | Nhập file/thư mục | Excel/CSV nhiều sheet, xem trước, xác nhận; chống nhập trùng bằng SHA-256; với Export OH và Export Report chỉ lọc các cột cần | Có | Chưa đọc cột nhóm khách 4 giá trị của Export OH (GAP L6) |
| F2 | Kho nguồn, truy vết | Giữ dòng gốc, file/sheet; sửa có lý do và lịch sử | Có | |
| F3 | Phân loại phạm vi Khoa Vú | Phân loại từng dòng theo quy tắc; dòng chưa rõ vào đối soát | Một phần | Theo cặp khoa, lệch BR-02–BR-04 (GAP L1) |
| F4 | Bóc tách gói | SKTQ, SLUT 1–4, CK/lẻ, giá riêng từng thành phần | Một phần | Chưa có SLUT 3–4 và MRI (GAP L3) |
| F5 | Tổng doanh thu 4 phần | Ngoại trú, nội trú, SKTQ, upsale; chuyên khoa khác | Chưa | GAP L2 |
| F6 | Nội trú và chuyển kỳ | Trừ 4 khoản chi phí; tính tuần ra viện; danh sách chuyển kỳ | Chưa | Quy tắc ở trạng thái chờ |
| F7 | Tái khám | Xác định ≥ 2 lượt, áp giá tái khám | Chưa | GAP T8 |
| F8 | Chốt snapshot | Chốt kỳ, khoá số, mở kỳ mới | Có | Chưa chốt theo ngày |
| F9 | Đối soát nguồn | Bảng Report \| OH \| Máy \| Lý do; ca ngoại lệ; số nhận từ bên ngoài | Một phần | Có hàng chờ đối soát; thiếu bảng 3 nguồn (GAP T4–T6) |
| F10 | Xuất Excel theo mẫu | Workbook 5 sheet từ snapshot | Có | Chưa đủ 8 bảng của file khoa |
| F11 | Xuất PPT giao ban | PPT từ cùng snapshot | Một phần | 8 slide của nhóm ≠ 9 slide thật (GAP L5) |
| F12 | Ghi đơn vị đếm, ghi chú biến động | Mỗi bảng/slide ghi chỉ định/ca/lượt/khách; ô lý do biến động | Chưa | GAP T2, T3 |
| F13 | Danh mục ghép mã → nhóm | Cho slide BSLS và phẫu thuật–can thiệp | Chưa | GAP T7 |
| F14 | Đăng nhập, phân quyền | Admin, chỉ xem; quyền kiểm ở backend | Có | |
| F15 | AI gợi ý phân loại | Naive Bayes local học từ cặp khoa đã xác nhận | Có | Không tự tính tiền |

### 2.2. Ghi kết quả siêu âm (Vú Voice)

| # | Tính năng | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|---|
| S1 | Thu và chép lời | Micro → PhoWhisper-base INT8 local, hiện chữ trong lúc đọc | Có | Sai ~54% số từ trên 486 đoạn giọng máy, ~35% khi không có tiếng ồn (KQ 15/11); điểm gồm cả khác biệt cách viết số, đơn vị chưa quy đổi; chưa thử giọng người |
| S2 | Ca, nháp, khôi phục | Tự lưu nháp, khôi phục sau sự cố | Có | Lưu IndexedDB một trình duyệt |
| S3 | Trạng thái kiểm tra | Chờ bác sĩ kiểm tra → Đã kiểm tra; mốc giờ | Có | Tên người kiểm tra nhập tay, không phải chữ ký |
| S4 | Cảnh báo an toàn | Thiếu bên vú, số đo/đơn vị, phủ định, BI-RADS | Chưa | GAP T10; ưu tiên cao nhất nếu giữ speech |
| S5 | Khung câu mẫu | Theo thứ tự trường mô tả tổn thương, trái trước | Chưa | GAP T11 |
| S6 | Song ngữ | Bảng thuật ngữ do bác sĩ duyệt, gợi ý cặp câu | Chưa | GAP T12 |
| S7 | Thu âm bộ dữ liệu giả | Trang thu mẫu + 80 câu kiểm tra nhanh (đã có); generator mẫu Kỹ thuật – Mô tả – Kết luận; người thân đọc | Một phần | Chưa có generator; xem [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md) |

**Ngoài phạm vi:** kết nối HIS/EMR/PACS; ghi vào hồ sơ bệnh án; chữ ký điện tử; đối soát tiền thực thu với kế toán; luồng tiếp đón, điều phối phòng, quầy lễ tân; hành trình người bệnh liên khoa (code có, nên ẩn khỏi demo: GAP V1); chẩn đoán, gợi ý BI-RADS.

### 2.3. Kiểm thử kỹ thuật đã làm

Đây là **kiểm thử kỹ thuật trên dữ liệu giả lập**, không phải đo hiệu quả với người dùng. Chưa thử với người dùng tại khoa (GATE1 17/11).

| Ngày | Kiểm thử | Kết quả | Nguồn |
|---|---|---|---|
| 30/10 | Đối chiếu số công cụ tính với bộ kết quả chuẩn giả lập đóng gói sẵn: 2.700 dòng mẫu, 182 phép (7 chỉ tiêu × 26 kỳ) | Sai số lớn nhất 0%. Bộ chuẩn do nhóm tạo, **chưa** có bộ chuẩn do khoa kiểm tra. Kết quả của code ngày 30/10, cần chạy lại trên code hiện tại | KT 30/10 |
| 15/11 | Speech: 486 đoạn giọng máy đọc | Sai ~54% số từ; ~35% khi không có tiếng ồn | KQ 15/11, GATE1 |
| 15–16/11 | Luồng chính chạy đầu cuối trên 170 dòng | Chạy được; sửa 4 lỗi giao diện | GATE1 |
| 17/11 | Bộ kiểm thử tự động | 255/255 đạt | GATE1 |

## 3. Yêu cầu chức năng (FR)

| ID | Yêu cầu | Story | Ưu tiên |
|---|---|---|---|
| FR-01 | Nhận file Export mà không bắt thư ký sửa tay cấu trúc; báo rõ cột thiếu và không ghi gì khi thiếu cột bắt buộc | US-R1 | Must |
| FR-02 | Mỗi lượt dịch vụ là một dòng; giữ file, sheet, dòng nguồn | US-R1 | Must |
| FR-03 | Áp quy tắc phạm vi theo danh mục đã duyệt; dòng không khớp quy tắc nào vào hàng chờ | US-R2 | Must |
| FR-04 | Danh mục quy tắc, giá, gói có phiên bản và ngày hiệu lực; chỉ admin sửa | US-R3 | Must |
| FR-05 | Tính 4 phần doanh thu và chuyên khoa khác theo [BUSINESS_RULES.md §1](BUSINESS_RULES.md) (bản BC 16/11) và BR-13 | US-R4 | Must |
| FR-06 | Chốt theo ngày; lượt tra sau chỉ hiện dòng mới so với lần chốt trước | US-R5 | Must |
| FR-07 | Bảng đối chiếu Report \| OH \| Máy cho từng dịch vụ chính, có cột lý do | US-R6 | Should |
| FR-08 | Nội trú: danh sách chuyển kỳ, tự nhắc ở tuần sau | US-R7 | Should |
| FR-09 | Xuất PPT đúng cấu trúc slide khoa đang dùng; mỗi bảng ghi đơn vị đếm | US-R8 | Must |
| FR-10 | Ô ghi chú biến động khi chênh lệch so với kỳ trước vượt ngưỡng cấu hình | US-R9 | Should |
| FR-11 | Sheet số nhận từ bên ngoài (SKTQ, upsale), đối chiếu số ca SKTQ với OH | US-R10 | Should |
| FR-12 | Speech: chép lời liên tục, không mất đoạn khi bấm Dừng | US-S1 | Must |
| FR-13 | Speech: cảnh báo khi kết luận thiếu bên vú hoặc có số đo không đơn vị | US-S2 | Must |
| FR-14 | Speech: bác sĩ soát trước khi kết quả được đánh dấu hoàn tất | US-S3 | Must |
| FR-15 | Speech: gợi ý câu tiếng Anh từ bảng thuật ngữ đã duyệt, không dịch máy tự do | US-S4 | Could |

## 4. Yêu cầu phi chức năng (NFR)

| ID | Yêu cầu | Hiện trạng |
|---|---|---|
| NFR-01 | Chạy hoàn toàn trên máy; không gửi dữ liệu ra dịch vụ AI bên ngoài | Đạt |
| NFR-02 | Không lưu PID, tên khách trong Git; dữ liệu đi kèm là giả lập | Đạt |
| NFR-03 | Giới hạn nhập: 100 MB/file, 100 file, 100.000 dòng; vượt thì báo, không tự cắt | Đạt |
| NFR-04 | Thư ký cài và chạy được không cần lập trình viên | **Chưa đạt**: cần Node 22, Python 3.12, build, 3 cổng |
| NFR-05 | Mọi số trên slide truy ngược được về dòng nguồn | Đạt với số trong snapshot |
| NFR-06 | Speech: chữ đầu xuất hiện ≤ 3 giây trên máy CPU 8 GB | Đạt (1,8 giây, một lần đo trên âm thanh tổng hợp, 15/11) |
| NFR-07 | Speech: dữ liệu ca không mất khi tải lại trang | Đạt trên cùng trình duyệt; không sao lưu, không đồng bộ |
| NFR-08 | Mã nguồn bảo trì được bởi người ngoài nhóm | **Chưa đạt**: dòng code rất dài, logic trùng JS/Python |

## 5. Tiêu chí chấp nhận cho đợt đo thử

1. Chạy được trên **file Export có cấu trúc cột thật** (giá trị giả lập).
2. Trưởng khoa đã ký danh mục quy tắc phiên bản 1 ([RULES_SIGNOFF.md](RULES_SIGNOFF.md)).
3. PPT sinh ra có đủ các slide số liệu thư ký đang làm tay.
4. Một tuần đo thử có số phút và số chỗ bị hỏi so được với baseline: [USER_TEST_PLAN.md](USER_TEST_PLAN.md).
