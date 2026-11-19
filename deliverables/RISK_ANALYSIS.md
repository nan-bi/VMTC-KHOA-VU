# Risk Analysis

> Status: v1.1 · 18/11/2026 · Thang 1–5: L = khả năng, S = mức tác động; Điểm = L × S. ≥ 15: xử lý ngay · 8–14: theo dõi hằng tuần · < 8: ghi nhận.

## 1. Ma trận rủi ro

| ID | Rủi ro | L | S | Điểm | Biện pháp | Phụ trách | Hạn |
|---|---|---:|---:|---:|---|---|---|
| R02 | Code phân loại doanh thu theo cặp khoa, lệch quy tắc hiện hành BR-02 (danh mục dịch vụ vú; chữ "vú" chỉ là mẹo của thư ký) và công thức 16/11 → số sai | 5 | 4 | **20** | Sửa code theo [BUSINESS_RULES.md](BUSINESS_RULES.md) bản hiện hành; xin Trưởng khoa xác nhận | Tech Lead, PM/BA | 22/11 |
| R03 | Không có số đo "sau" trước 04/12 | 4 | 5 | **20** | USER_TEST_PLAN; đo baseline lần 2 ngay tuần này | Cả nhóm | 27/11 |
| R05 | Speech chép sai bên vú, số đo, phủ định → sai sót lâm sàng | 3 | 5 | **15** | Luôn ở trạng thái nháp; cảnh báo bên vú (US-S2); bác sĩ soát và ký như hiện tại; tiêu chí dừng S4 | Tech Lead | Trước khi thử |
| R04 | Bộ đọc file chưa lọc đúng các cột cần của Export OH và Export Report (vd. cột nhóm khách 4 giá trị) | 3 | 4 | 12 | Liệt kê cột cần lọc ([DATA_DICTIONARY.md §1](DATA_DICTIONARY.md)); tạo file giả đúng tên cột | Tech Lead | 22/11 |
| R06 | Khoa chưa ký xác nhận bài toán | 3 | 4 | 12 | **Đã xử lý:** Trưởng khoa đã ký ĐXN 16/11 (bản scan trong thư mục hồ sơ Gate 1, tải lên 18/11). Còn lại: duyệt từng quy tắc qua [RULES_SIGNOFF.md](RULES_SIGNOFF.md) | PO/Tech Lead | 18/11 |
| R07 | Thư ký không tự cài, chạy được (Node, Python, build, 3 cổng); CNTT không cho cài | 4 | 3 | 12 | Đóng gói một lệnh chạy; trình bày song song khuyến nghị làm ngay trong Excel (BUSINESS_PROCESS §1.4) | Tech Lead | 27/11 |
| R16 | Bộ dữ liệu giả không giống lời đọc thật (giọng người thân, mẫu do nhóm soạn) → số đo đẹp hơn thực tế | 4 | 3 | 12 | Mentor duyệt mẫu; đa dạng người đọc, tốc độ, nhiễu; chia test theo người đọc; báo cáo rõ giới hạn | Cả nhóm | 26/11 |
| R01 | Speech trùng một phần với một hệ thống speech-to-text đã có trong bệnh viện → bị hỏi giá trị riêng của nhóm | 3 | 3 | 9 | Định vị rõ: tiếng Việt chuyên khoa vú, sửa trên mẫu bình thường, chạy local, cảnh báo bên vú. Không nêu song ngữ là điểm khác biệt (hệ thống đã có hỗ trợ tiếng Anh theo mô tả, cần đối chiếu). Đối chiếu hệ thống đó thực tế làm được gì để chốt điểm khác biệt (BC 18/11 §6–§7) | PM/BA | 25/11 |
| R09 | Trùng với công cụ sắp có: quick text trên OH, hệ thống speech-to-text đã có trong bệnh viện, các đề tài giọng nói / điều phối luồng khám của nhóm khác trong chương trình | 3 | 3 | 9 | Đối chiếu tính năng hệ thống đã có; hỏi CNTT lộ trình quick text; định vị speech là bản nháp local, bổ trợ quick text | PM/BA | 25/11 |
| R10 | Lệch nguồn Report/OH là do khác đơn vị đếm, không phải lỗi → công cụ báo lỗi sai | 3 | 3 | 9 | Bảng đối chiếu có cột lý do và đơn vị; không tự chọn nguồn thắng | Tech Lead | 27/11 |
| R13 | Mốc thời gian prototype khác báo cáo ("chưa làm bản thử") → mất tin cậy với mentor | 3 | 3 | 9 | Trình bày trung thực mốc 31/10, 11/11, 15/11 trong báo cáo tuần 3 | PM/BA | 19/11 |
| R08 | Ghi âm không có đồng ý hợp lệ; lộ giọng người đọc | 2 | 4 | 8 | Chỉ người thân đọc văn bản giả lập, có giấy đồng ý; mã `NT01`; âm thanh không đưa lên Git | PM/BA | Trước khi thu |
| R11 | Phạm vi trải rộng (journeys, speech, dashboard) trong thời gian còn ~3 tuần | 4 | 2 | 8 | Ẩn tính năng ngoài phạm vi khỏi demo (GAP V1); một luồng demo chính | Cả nhóm | 20/11 |
| R12 | Mã nguồn khó bảo trì (dòng rất dài, logic trùng JS/Python, thư mục bản cũ) | 4 | 2 | 8 | Chọn một engine; định dạng lại; bỏ `prototype-local-v8/` khỏi nhánh chính | Tech Lead | 04/12 |
| R14 | Dữ liệu speech chỉ ở IndexedDB một trình duyệt → mất khi xoá dữ liệu trang | 3 | 2 | 6 | Ghi rõ giới hạn; không dùng cho hồ sơ thật | Tech Lead | — |
| R15 | Upsale do hành chính gửi sai hoặc muộn → sửa lại cả bảng doanh thu | 3 | 2 | 6 | Upsale cộng riêng (đã xác nhận); nhập ở sheet "số nhận từ bên ngoài", sửa một chỗ | Tech Lead | 27/11 |

## 2. Rủi ro đã ghi nhận trong quy trình của khoa (ngoài phạm vi, báo mentor)

| Rủi ro | Nguồn | Ghi chú |
|---|---|---|
| Thứ tự trái/phải ngược giữa lời đọc và mẫu in | BC 04/11, 05/11 | Có thể dẫn đến ghi nhầm bên |

Các ghi nhận khác về quy trình và bảo mật dữ liệu tại khoa đã báo riêng cho mentor, không đưa vào tài liệu công khai.

## 3. Ứng phó khi rủi ro xảy ra

| Tình huống | Hành động |
|---|---|
| Chương trình yêu cầu thu hẹp speech vì trùng | Họp mentor trong 48 giờ; giữ phần khác biệt (chuyên khoa vú, sửa trên mẫu bình thường, cảnh báo bên vú, local) |
| Phát hiện số sai trên PPT đã xuất | Đánh dấu snapshot lỗi, ghi lý do, không xoá; xuất lại từ snapshot mới |
| Lỗi bên vú trong thử speech | Dừng thử, báo bác sĩ phụ trách, ghi vào bảng failure case, sửa cảnh báo trước khi thử lại |
