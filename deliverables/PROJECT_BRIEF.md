# Project Brief — PinkPath · Khoa Vú

> Status: v1 · 17/11/2026 · Phạm vi: bối cảnh và định hướng. Số đo chi tiết: [FIELD_RESEARCH.md](FIELD_RESEARCH.md). Tính năng: [PRD.md](PRD.md).

## 1. Bối cảnh

- **Chương trình:** Vinmec × VinUni V-RIC, AI Exploration Sprint 6 tuần (29/10–11/12/2026). Sàng lọc hằng tuần 20/11, 27/11, 04/12. Đầu ra 11/12: *prototype đã thử, kết quả đo được, kế hoạch ra sản phẩm* (KB 27/10).
- **Đơn vị:** Khoa Vú (Trung tâm Vú), Bệnh viện ĐKQT Vinmec Times City, tầng 3. Luồng khám đi qua tầng 3, tầng 4 (SKTQ) và khu 7 tầng (VIP).
- **Nhóm:** TC-14, hai thành viên (PM/BA và PO/Tech Lead). Mentor tại khoa là Trưởng khoa, người giao bài toán từ ngày 29/10.
- **Tên dự án:** trong danh mục chương trình là *"Công cụ tự động hóa tổng hợp báo cáo doanh thu tuần & Speech-to-Text siêu âm tuyến vú"*, nhóm loại *Data Automation & Voice Scribe* (DM17). Trong báo cáo Gate 1 là *"Trợ lý AI cho thư ký Khoa Vú: đối soát doanh thu tuần & bản nháp kết quả siêu âm"* (GATE1 17/11).
- **Quy định dữ liệu:** ba tuần đầu chỉ quan sát; chỉ dùng dữ liệu giả lập hoặc công khai; không chụp ảnh, không ghi âm, không sao chép thông tin người bệnh (T2, KB 27/10).

## 2. Hai bài toán

| | Vấn đề 1 — Báo cáo doanh thu tuần (ưu tiên) | Vấn đề 2 — Ghi kết quả siêu âm từ lời đọc |
|---|---|---|
| Phát biểu (T2) | Cần một cách để tổng hợp số liệu tuần từ nhiều trang hệ thống vào file Excel doanh thu và slide giao ban cho thư ký khoa, nhằm giảm thời gian làm báo cáo và giảm số chỗ số liệu bị hỏi lại khi giao ban | Cần một cách để chuyển lời bác sĩ đọc kết quả siêu âm thành văn bản cho thư ký phòng siêu âm, nhằm rút ngắn đoạn đọc–ghi và giảm số lần hỏi lại |
| Người gặp khó | Thư ký khoa; bác sĩ trình bày giao ban | Thư ký phòng siêu âm; bác sĩ siêu âm |
| Baseline | ~290 phút/tuần cho các bước đã đo; 3 chỗ lệch hoặc bị hỏi trong ~10 phút số liệu giao ban | Đoạn đọc–ghi ~10,5 phút/ca ở tầng 3 (2–19), ~5 phút/ca ở tầng 4; ~17 ca/ngày |
| Nguyên nhân gốc | Chưa có cấu trúc dữ liệu chuẩn tách nhập liệu, danh mục quy tắc và báo cáo; chưa có bước chốt số và đối chiếu nguồn | Bác sĩ vừa thao tác đầu dò vừa đọc; thư ký vừa ghi vừa làm việc khác; kết quả chi tiết dài, có thể song ngữ |
| Kết quả check trùng 15/11 | TC-14 là **một dự án gộp hai vấn đề**; phần trùng nằm ở speech | **Trùng một phần** với một hệ thống đã có trong bệnh viện; **được phép tiếp tục** |
| Trạng thái code | Dashboard local, nhập file, bóc tách gói, đối soát, xuất Excel/PPT | Module "Vú Voice" chạy PhoWhisper local, WER 54% trên giọng tổng hợp |
| Hướng tiếp theo | Cập nhật quy tắc theo BC 16/11, đo thử | Xây bộ dữ liệu giả: mẫu kết quả từ quan sát → người thân đọc, thu âm: [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md) |

## 3. Giải pháp hiện tại

Một công cụ **chạy local trên máy**, không kết nối hệ thống bệnh viện, không gửi dữ liệu ra dịch vụ AI bên ngoài (ĐXN 16/11):

```
Nhập file Export → Kiểm tra, chuẩn hoá → Phân loại theo quy tắc → Tính toán → Đối soát → Xuất Excel / PPT giao ban
```

Phần mềm tính số theo quy tắc. Mô hình AI local chỉ **gợi ý phân loại** cho dòng chưa có ánh xạ rõ; dòng chưa đủ căn cứ vào danh sách chờ xác nhận. Chi tiết: [PRD.md](PRD.md).

## 4. Ràng buộc cốt lõi

1. Không truy cập, sửa hoặc kết nối phần mềm đang vận hành (HIS Orion Health, Report, EMR, eForm, PACS, Imaging).
2. Số liệu do quy tắc tính; AI không tự quyết giá hoặc doanh thu.
3. Mọi kết quả cần người có trách nhiệm kiểm tra trước khi dùng; không dùng để quyết toán, thu phí hoặc quyết định điều trị.
4. Quy tắc tính doanh thu phải được Trưởng khoa xác nhận bằng văn bản trước khi áp dụng cho báo cáo chính thức.
5. Ghi âm chỉ khi có đồng ý của bác sĩ và người bệnh; dữ liệu thật chỉ được cấp ở gate cuối (quy định chương trình). Vì vậy bộ dữ liệu speech do **người thân của nhóm** đọc văn bản giả lập, có giấy đồng ý; không ghi âm bác sĩ, người bệnh hay ca khám thật.

## 5. Việc cần quyết định trước sàng lọc 20/11

| # | Việc | Ai quyết | Tài liệu |
|---|---|---|---|
| 1 | Duyệt mẫu kết quả siêu âm giả lập (kỹ thuật, mô tả, kết luận) trước khi thu âm | Mentor tại khoa | [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md) |
| 2 | Xác nhận quy tắc doanh thu theo bản mới nhất (BC 16/11; phần không đổi giữ bản cũ) | Trưởng khoa | [RULES_SIGNOFF.md](RULES_SIGNOFF.md) · [BUSINESS_RULES.md](BUSINESS_RULES.md) |
| 3 | Ký đơn xin xác nhận (**đã ký**, bản scan trong hồ sơ Gate 1) | Trưởng khoa | ĐXN 16/11 |
| 4 | Đo lại một tuần báo cáo có công cụ hỗ trợ | Nhóm, thư ký | [USER_TEST_PLAN.md](USER_TEST_PLAN.md) |

## Tài liệu liên quan

[DISCOVERY_FINDINGS.md](DISCOVERY_FINDINGS.md) · [BUSINESS_PROCESS.md](BUSINESS_PROCESS.md) · [GAP_ANALYSIS.md](GAP_ANALYSIS.md) · [KPI_ROI.md](KPI_ROI.md)
