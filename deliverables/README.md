# Tài liệu BA — PinkPath · Khoa Vú (TC-14)

> Status: v1.1 · 18/11/2026 · Tổng hợp từ 13 ngày quan sát 29/10–16/11 (12 báo cáo ngày và buổi 29/10 trong T1), báo cáo tuần 1–2, đơn xin xác nhận 16/11, kết quả check trùng 15/11 và mã nguồn tại commit `a03239e` (logic tính toán không đổi so với `c352f04`). Chưa được khoa xác nhận.

Bộ tài liệu này là **nguồn chính về nghiệp vụ** của dự án. Tài liệu kỹ thuật (cài đặt, vận hành, kiểm thử) vẫn nằm trong [`docs/`](../docs/) và [`README.md`](../README.md) gốc.

Mỗi thông tin chỉ có **một nguồn chính**. Tài liệu khác dẫn link tới đó, không chép lại:

| Thông tin | Nguồn chính |
|---|---|
| Quy tắc tính doanh thu, trạng thái xác minh | [BUSINESS_RULES.md](BUSINESS_RULES.md) |
| Số đo baseline (phút, ca, lần lệch) | [FIELD_RESEARCH.md §3](FIELD_RESEARCH.md) |
| Báo cáo và code giống/khác nhau ở đâu | [GAP_ANALYSIS.md](GAP_ANALYSIS.md) |
| Phạm vi và trạng thái từng tính năng | [PRD.md §2](PRD.md) |
| Trường dữ liệu và file nguồn | [DATA_DICTIONARY.md](DATA_DICTIONARY.md) |
| Chỉ số thành công, ROI | [KPI_ROI.md](KPI_ROI.md) |

## 1. Nghiệp vụ — What & Why

| Tài liệu | Nội dung |
|---|---|
| [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | Bối cảnh, hai bài toán, phạm vi, ràng buộc, trạng thái với chương trình |
| [FIELD_RESEARCH.md](FIELD_RESEARCH.md) | Nhật ký 13 ngày quan sát (16 lượt), phỏng vấn, bảng số đo baseline |
| [DISCOVERY_FINDINGS.md](DISCOVERY_FINDINGS.md) | Stakeholder, điểm nghẽn, nguyên nhân gốc, câu hỏi còn mở |
| [BUSINESS_PROCESS.md](BUSINESS_PROCESS.md) | Quy trình hiện tại (as-is) và đề xuất (to-be), RACI, lịch tuần |
| [BUSINESS_RULES.md](BUSINESS_RULES.md) | Quy tắc doanh thu **hiện hành** (bản mới nhất BC 16/11, phần không đổi giữ bản cũ), 4 gói SLUT, 12 yêu cầu speech |
| [GAP_ANALYSIS.md](GAP_ANALYSIS.md) | Đối chiếu báo cáo ↔ code ↔ đề xuất ban đầu; mâu thuẫn giữa các báo cáo |

## 2. Sản phẩm — What we build

| Tài liệu | Nội dung |
|---|---|
| [PRD.md](PRD.md) | Phạm vi tính năng, trạng thái, FR/NFR, ngoài phạm vi |
| [USER_STORIES.md](USER_STORIES.md) | Story `US-R*` (doanh thu) và `US-S*` (speech), AC Given–When–Then |
| [DATA_DICTIONARY.md](DATA_DICTIONARY.md) | 2 file Export (OH, Report) và cột cần lọc, số nhập riêng, trường chuẩn hoá, mức nhạy cảm |
| [BREAST_SERVICES.md](BREAST_SERVICES.md) | Danh mục dịch vụ liên quan đến vú lọc từ bảng giá công khai (127 dịch vụ, kèm CSV), để khoa đánh dấu dịch vụ nào tính |
| [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md) | Bộ dữ liệu giả cho speech: mẫu Kỹ thuật – Mô tả – Kết luận, slot, người thân thu âm, chia tập, đánh giá |

## 3. Kiểm chứng & quyết định

| Tài liệu | Nội dung |
|---|---|
| [KPI_ROI.md](KPI_ROI.md) | Chỉ số, baseline, mục tiêu đề xuất, cách đo, ROI ước tính |
| [USER_TEST_PLAN.md](USER_TEST_PLAN.md) | Kế hoạch đo trước/sau với thư ký và bác sĩ, điều kiện dữ liệu |
| [RISK_ANALYSIS.md](RISK_ANALYSIS.md) | Ma trận rủi ro L×S, biện pháp, người phụ trách |
| [RULES_SIGNOFF.md](RULES_SIGNOFF.md) | Phiếu để Trưởng khoa đánh dấu Đúng / Sửa cho từng quy tắc doanh thu |

## 4. Tra cứu

| Tài liệu | Nội dung |
|---|---|
| [GLOSSARY.md](GLOSSARY.md) | Thuật ngữ y khoa, hệ thống, nghiệp vụ và mã tài liệu; tách kiến thức chung với cách gọi nội bộ cần xác nhận |

## Ký hiệu nguồn

Các tài liệu trích nguồn theo mã dưới đây. File gốc nằm ngoài repo (`pinkpathdoc/ba`, `pinkpathdoc/NOP`, `pinkpathdoc/tailieu`, `pinkpathdoc/data_gialap`, thư mục Drive `VMTC_KHOA VÚ`).

| Mã | Tài liệu gốc |
|---|---|
| BC 29/10 … BC 16/11 | Báo cáo ngày / báo cáo thu hoạch theo ngày quan sát |
| BC 18/11 | "Báo cáo 18/11/2026 – Cấu trúc kết quả siêu âm vú" (PM/BA): mẫu kết quả bình thường, 9 khung câu tổn thương, bảng kết luận ↔ BI-RADS, đề xuất sửa [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md) (chưa áp dụng, xem §9 của file đó) |
| T1, T2 | Báo cáo tuần 1 (S12) và tuần 2 (TC14) |
| ĐX 30/10 | "Khoa Vú – Tự động hoá luồng khám & báo cáo doanh thu" (đề xuất 17 trang) |
| DN01–DN14 | Danh sách 14 điểm nghẽn (tài liệu tuần 1) |
| ĐXN 16/11 | Đơn xin xác nhận gửi Trưởng khoa; Trưởng khoa đã ký (bản scan trong thư mục hồ sơ Gate 1) |
| Check trùng 15/11 | Kết quả check trùng và trả lời bảo mật của chương trình |
| KB 27/10 | Kịch bản đào tạo 27/10 (lộ trình 6 tuần) |
| BYT 3128 | Quyết định 3128/QĐ-BYT ngày 17/7/2020: *Hướng dẫn chẩn đoán và điều trị ung thư vú* (`tailieu/`). Tài liệu chuyên môn công khai; chỉ dùng phần chẩn đoán (§3) và theo dõi (§5) làm căn cứ thuật ngữ, **không** dùng để chẩn đoán hay tính doanh thu |
| BYT SL 2025 | *Hướng dẫn Sàng lọc phát hiện sớm ung thư vú*, Bộ Y tế (Cục Bà mẹ và Trẻ em), ban hành kèm Quyết định của Bộ trưởng Bộ Y tế ngày 18/12/2025 (`tailieu/2-HD SL UTV_signed.pdf`; số quyết định ghi theo trang bìa). Tài liệu chuyên môn công khai; chỉ dùng làm căn cứ **thuật ngữ** (BI-RADS 0–6, mật độ A–D, tên tổn thương), **nội dung hỏi tiền sử** cho dữ liệu giả, và giải thích bối cảnh (X-quang từ 40 tuổi). **Không** dùng để gợi ý BI-RADS, đề nghị xử trí hay tính doanh thu |
| GATE1 17/11 | Báo cáo Gate 1 đã nộp (`NOP/TC14_BaoCao_Gate1*`, thư mục Drive Gate 1) |
| DM17 | Danh mục 17 dự án AI các khoa/phòng Vinmec Times City (`NOP/`) |
| KS 11/11 | Báo cáo khảo sát quy trình tiếp nhận và điều phối người bệnh, PO/Tech Lead (Drive `VMTC_KHOA VÚ`) |
| KQ 15/11 | Kết quả kiểm thử speech trên giọng máy, `ket-qua.csv` (Drive `data_gialap`) |
| KT 30/10 | Báo cáo kiểm tra kỹ thuật của code ([`docs/06-BAO-CAO-KIEM-TRA.md`](../docs/06-BAO-CAO-KIEM-TRA.md)) |
| GĐ-xx | Giả định G1–G20 trong repo PinkPath cũ (`D:\AIVIN\pinkpath\deliverables\FIELD_RESEARCH.md`, 30/10–03/11). Đã được thay bằng BUSINESS_RULES; chỉ dẫn lại khi còn câu hỏi mở |

## Quy ước

- Mỗi tài liệu mở đầu bằng dòng `Status · ngày · phạm vi`.
- Mỗi nhận định ghi rõ **Đã quan sát**, **Theo lời kể** hoặc **Cần xác minh**, như trong báo cáo gốc.
- Không ghi PID, tên khách, tên nhân viên y tế, giá thật hoặc số doanh thu thật. Vai trò thay cho tên người.
- Khi code đổi làm lệch tài liệu (quy tắc, trường dữ liệu, luồng), sửa tài liệu trong cùng commit.
