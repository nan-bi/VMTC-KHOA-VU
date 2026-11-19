# KPI & ROI

> Status: v1.1 · 18/11/2026 · Baseline lấy từ [FIELD_RESEARCH.md §3](FIELD_RESEARCH.md). Mục tiêu là **đề xuất của nhóm**, chưa được khoa duyệt. ROI là ước tính, ghi rõ giả định.

## 1. Chỉ số báo cáo doanh thu

| ID | Chỉ số | Baseline | Mục tiêu đề xuất | Cách đo |
|---|---|---|---|---|
| K1 | Thời gian làm báo cáo tuần (các bước đã đo) | ~290 phút (đo 1 lần) | ≤ 120 phút | Nhật ký thời gian liên tục, tách việc xen kẽ: [USER_TEST_PLAN.md](USER_TEST_PLAN.md) |
| K2 | Thời gian dựng PPT giao ban | 167 phút | ≤ 45 phút | Bấm giờ từ lúc mở PPT đến lúc lưu bản trình bày |
| K3 | Số lượt tra mỗi tuần | 2 (lượt 2 làm lại từ đầu) | Lượt 2 ≤ 20 phút, chỉ dòng mới | Bấm giờ lượt sáng thứ Hai |
| K4 | Chỗ bị hỏi lại hoặc lệch trong phần số liệu giao ban | 3/buổi | ≤ 1/buổi | Người quan sát đếm tại giao ban |
| K5 | Lệch nguồn chưa giải thích lúc chốt | 10 ca siêu âm | 0 ca không có lý do | Bảng đối chiếu Report \| OH \| Máy |
| K6 | Số trên slide truy ngược được về dòng nguồn | Không có | 100% | Kiểm tra ngẫu nhiên 10 số mỗi tuần |
| K8 | Sai số tính doanh thu so với bộ số chuẩn **do khoa kiểm tra** | Chưa có bộ chuẩn của khoa. Kiểm thử kỹ thuật trên bộ chuẩn giả lập do nhóm tạo: 0% (KT 30/10, trên code ngày 30/10; code đã đổi nhiều lần, cần chạy lại) | < 0,05% mỗi chỉ tiêu, mỗi kỳ | `abs(thực tế − chuẩn) / abs(chuẩn)`; chuẩn bằng 0 thì thực tế phải bằng 0 |
| K7 | Quy tắc hiện hành được khoa duyệt | 0 | Toàn bộ §1–§4 trước 04/12 | Đếm dòng "Đúng" trong phiếu [RULES_SIGNOFF.md](RULES_SIGNOFF.md) đã ký |

## 2. Chỉ số ghi kết quả siêu âm

| ID | Chỉ số | Baseline | Mục tiêu đề xuất | Cách đo |
|---|---|---|---|---|
| S1 | Đoạn đọc–ghi, ca tầng 3 | ~10,5 phút (2–19), 8/10 ca 10–19 phút (BC 09/11, 10 ca) | Giảm ≥ 2 phút/ca dài | Cùng cặp mốc: bác sĩ bắt đầu đọc → bản kết quả được lưu |
| S2 | Số lần thư ký hỏi lại / bác sĩ đọc lại | Có ở 05/11, 10/11 (chưa đếm có hệ thống) | Giảm 50% | Đếm mỗi ca |
| S3 | WER trên bộ dữ liệu giả, người đọc không có trong tập huấn luyện | Chưa đo trên giọng người (giọng máy, 486 đoạn: ~54%; ~35% khi không nhiễu, KQ 15/11; gồm cả khác biệt cách viết số, đơn vị chưa quy đổi) | ≤ 20% | Bộ mẫu kết quả giả do người thân đọc: [SPEECH_DATASET_PLAN.md §7](SPEECH_DATASET_PLAN.md) |
| S4 | **Lỗi bên vú** trong bản đã soát | Chưa đo | **0** | Đối chiếu bản soát với lời đọc |
| S5 | Ca song ngữ: khám xong → in | 16 phút (1 ca) | ≤ 8 phút | Bấm giờ |

S4 là chỉ số chặn: nếu có một lỗi bên vú lọt qua bước soát thì dừng thử nghiệm.

## 3. ROI ước tính

### 3.1. Báo cáo doanh thu

| Giả định | Giá trị | Ghi chú |
|---|---|---|
| Thời gian hiện tại | 290 phút/tuần | Chưa gồm gói, upsale, SKTQ, lượt tra lại; nên là cận dưới |
| Thời gian sau khi dùng công cụ | 120 phút/tuần | Mục tiêu K1, chưa kiểm chứng |
| Tiết kiệm | 170 phút/tuần ≈ 2,8 giờ/tuần ≈ **136 giờ/năm** (48 tuần làm việc); tối đa ≈ 147 giờ nếu tính đủ 52 tuần | Số tuần làm việc thực tế (trừ nghỉ lễ, Tết) cần khoa xác nhận |
| Người hưởng lợi | Thư ký khoa + bác sĩ làm PPT luân phiên | Thời gian bác sĩ có giá trị cao hơn, chưa quy đổi |
| Lợi ích không quy ra tiền | Giảm chỗ bị hỏi ở giao ban; quy tắc không phụ thuộc một người; người mới làm thay được | BC 31/10 mục 8 |
| Chi phí | Không phí phần mềm; chi phí là thời gian cài đặt, đào tạo, bảo trì | Cần CNTT duyệt cài đặt |

Công thức (ĐX 30/10): `ROI giờ/tuần = (T báo cáo + T đối chiếu + N hỏi lại × t mỗi lần) × (1 − tỉ lệ còn lại)`. Quy đổi tiền bằng mức lương tham khảo công khai khi có số đo sau.

### 3.2. Ghi kết quả siêu âm

| Giả định | Giá trị | Nguồn |
|---|---|---|
| Số ca/ngày tầng 3 | ~17 | BC 09/11 |
| Tỷ lệ ca dài | ~80% | BC 09/11 |
| Tiết kiệm mỗi ca dài | 2–4 phút | Ước tính BC 09/11, chưa đo |
| Tiết kiệm/ngày | ~30–55 phút | BC 09/11 |

Thời gian tiết kiệm không làm giảm thời gian khám (bác sĩ vẫn khám, trấn an, tư vấn). Lợi ích là thư ký rảnh tay sớm hơn cho tiếp nhận, tra lịch sử, upsale, và giảm hỏi lại (BC 10/11).

## 4. Điều kiện để số ROI có giá trị

1. Đo baseline thêm ít nhất 1 tuần để có khoảng dao động (T2 đã lên kế hoạch).
2. Đo "sau" với cùng người, cùng loại tuần, cùng cặp mốc.
3. Ghi rõ phần nào đo được, phần nào theo lời kể hoặc ước lượng, như quy định T2.
