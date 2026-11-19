# User Test Plan — Đo trước/sau tại khoa

> Status: v1.1 · 18/11/2026 · Mục tiêu: có số đo so sánh được cho sàng lọc 27/11 và 04/12. Chỉ số: [KPI_ROI.md](KPI_ROI.md). Chưa được mentor duyệt lịch. Buổi thử dự kiến 18/11 chưa diễn ra: nhóm hoàn thiện bản build rồi mới thử với thư ký và điều dưỡng; đến 19/11 mới có kiểm thử nội bộ trong nhóm.

## 1. Điều kiện trước khi thử

| # | Điều kiện | Trạng thái |
|---|---|---|
| C1 | Trưởng khoa ký đơn xin xác nhận (ĐXN 16/11) | Đạt (bản scan trong hồ sơ Gate 1, 18/11) |
| C2 | Danh mục quy tắc v1 được duyệt ([BUSINESS_RULES.md §1–§4](BUSINESS_RULES.md), ký theo [RULES_SIGNOFF.md](RULES_SIGNOFF.md)) | Chờ |
| C3 | Bộ file giả lập có đúng các cột cần lọc của Export OH và Export Report ([DATA_DICTIONARY.md §1](DATA_DICTIONARY.md)) | Chờ |
| C4 | Dữ liệu thử là **giả lập theo cấu trúc thật**; không dùng dữ liệu người bệnh | Áp dụng |
| C5 | Speech: bộ dữ liệu giả do người thân của nhóm đọc, có giấy đồng ý; không ghi âm bác sĩ, người bệnh hay ca khám thật | Áp dụng |
| C6 | Công cụ chạy trên máy của nhóm, không cài lên máy bệnh viện nếu CNTT chưa duyệt | Áp dụng |

## 2. Thử báo cáo doanh thu

**Người tham gia:** thư ký khoa (1), bác sĩ làm PPT tuần đó (1). **Thời lượng:** 1 tuần báo cáo.

| Bước | Việc | Đo |
|---|---|---|
| 1 | Baseline lần 2: thư ký làm như hiện tại tuần 16/11–22/11, nhóm ghi nhật ký thời gian liên tục (bắt đầu, kết thúc, việc xen vào) | K1, K2, K3 |
| 2 | Nhóm tạo bộ file giả lập đúng cấu trúc cột thật, cùng quy mô tuần thật (~60 mã, số PID tương tự) | — |
| 3 | Thư ký dùng công cụ trên bộ file giả lập: nhập, đối soát, chốt, xuất Excel/PPT | K1, K2, K3 |
| 4 | Bác sĩ xem PPT xuất ra, đánh dấu chỗ sẽ bị hỏi nếu trình bày | K4 (mô phỏng) |
| 5 | Phỏng vấn ngắn 10 phút: bước nào vẫn phải làm tay, bước nào khó | Định tính |

Nhiệm vụ quan sát (thư ký tự làm, nhóm không chỉ dẫn trừ khi bị kẹt > 3 phút):

1. Nhập file Export tuần và xử lý cột thiếu.
2. Xử lý 5 dòng chờ đối soát (có lý do).
3. Sửa một số upsale và kiểm tra tổng tự cập nhật.
4. Chốt tuần, nhập bổ sung file sáng thứ Hai, xem dòng mới.
5. Xuất PPT và tìm nguồn của một số trên slide 2.

## 3. Thử ghi kết quả siêu âm

**Người tham gia:** 3–5 người thân của nhóm (người đọc), thành viên nhóm (người soát). **Không có bác sĩ, người bệnh hay ca khám thật.** Thiết kế bộ dữ liệu: [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md).

| Bước | Việc | Đo |
|---|---|---|
| 1 | Người thân đọc 40 mẫu kết quả giả (Kỹ thuật – Mô tả – Kết luận) và 80 câu kiểm tra nhanh, bằng micro dự định dùng. Kịch bản đã soạn khác con số này: [SPEECH_DATASET_PLAN.md §9](SPEECH_DATASET_PLAN.md) | S3, S4 |
| 2 | Một người soát bản chép, sửa đến khi đúng `label_text` | Thời gian soát/mẫu |
| 3 | So với gõ tay cùng mẫu theo bản thu | S1 (mô phỏng) |
| 4 | Thu một phần mẫu có quạt và có người nói chen | Độ bền |
| 5 | Nếu thư ký phòng siêu âm đồng ý: thử soát 5 bản chép để góp ý giao diện (không ghi âm) | Định tính |

**Cặp mốc thống nhất** cho mọi lần đo speech (khắc phục M6 trong [GAP_ANALYSIS.md](GAP_ANALYSIS.md)): *bác sĩ bắt đầu đọc kết quả* → *bản kết quả được lưu (trước bước ký)*. Ghi thêm loại ca (đơn giản / chi tiết / song ngữ).

## 4. Tiêu chí dừng

- Có một lỗi bên vú trong bản đã soát (S4) → dừng thử speech, xem lại cảnh báo.
- Thư ký phải nhập lại tay quá 30% số dòng → dừng, sửa bộ đọc file.
- Người tham gia không muốn tiếp tục → dừng, ghi lý do.

## 5. Ghi chép và báo cáo

- Mẫu ghi: thời gian, bước, ai làm, kết quả, lỗi gặp, đã quan sát / theo lời kể.
- Không ghi PID, tên, nội dung kết quả thật.
- Kết quả đưa vào [KPI_ROI.md](KPI_ROI.md) (cột hiện trạng) và báo cáo tuần 3–4.
