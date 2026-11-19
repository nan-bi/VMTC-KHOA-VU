# Discovery Findings — Stakeholder, điểm nghẽn, nguyên nhân gốc

> Status: v1 · 19/11/2026 · Tổng hợp từ T1, T2, DN01–DN14 và báo cáo ngày đến 16/11. Số đo: [FIELD_RESEARCH.md](FIELD_RESEARCH.md). Quy tắc: [BUSINESS_RULES.md](BUSINESS_RULES.md).

## 1. Stakeholder

| Vai trò | Liên quan bài toán | Nhu cầu chính | Ảnh hưởng | Mức tham gia |
|---|---|---|---|---|
| Trưởng khoa (mentor tại khoa) | Cả hai | Một file kiểm soát toàn bộ hoạt động, doanh thu; từ đó ra luôn PPT | Giao bài toán, duyệt quy tắc, ký xác nhận | Quyết định |
| Thư ký khoa | Doanh thu | Nhập nhanh, không sợ hỏng file, không tính lại nhiều lần | Người dùng chính; giữ phần lớn quy tắc trong kinh nghiệm | Người dùng chính |
| Bác sĩ trình bày giao ban (luân phiên) | Doanh thu | Số đã chốt, có lý do biến động | Làm PPT cùng thư ký; bị hỏi khi số lệch | Người dùng |
| Bác sĩ lâm sàng | Doanh thu | Ít phải tự nhập | Nhập chỉ định khác, lượt khám | Nguồn dữ liệu |
| Bác sĩ CĐHA / siêu âm | Speech, doanh thu | Đọc rảnh tay, bản ghi đúng lời | Đọc kết quả; soát, ký | Người dùng (speech) |
| Thư ký phòng siêu âm | Speech | Ghi kịp, ít hỏi lại, tìm mẫu song ngữ nhanh | Ghi kết quả, tiếp nhận, upsale | Người dùng chính (speech) |
| Quầy / lễ tân | Doanh thu | — | Chuyển lẻ sang gói, đếm gói | Nguồn dữ liệu |
| Hành chính | Doanh thu | — | Thống kê upsale | Nguồn dữ liệu |
| Bộ phận SKTQ (tầng 4, khu 7 tầng) | Doanh thu | — | Gửi file SKTQ; khoa không kiểm soát cách nhập | Nguồn dữ liệu bên ngoài |
| Mentor VinUni, lead cơ sở | Cả hai | Có số đo, đúng quy định | Chấm sàng lọc | Đánh giá |
| Ban tổ chức chương trình | Cả hai | Không trùng dự án đang có | Check trùng; trả lời bảo mật | Gate |
| CNTT Vinmec | Cả hai | An toàn thông tin | Duyệt cài đặt, cấp dữ liệu | Gate (chưa liên hệ) |

## 2. Điểm nghẽn

### 2.1. Danh sách 14 điểm nghẽn (DN, tuần 1)

| Mã | Điểm nghẽn | Nhóm | Ưu tiên | Dự án xử lý? |
|---|---|---|---|---|
| DN01 | Tiếp nhận phụ thuộc giấy và mã dán | Tiếp đón | P1 | Không |
| DN02 | Một người bệnh nhiều mã hồ sơ | Định danh | P1 | Không (ghi nhận) |
| DN03 | Nhập thông tin khám lặp lại ở từng khoa/phòng | Ghi nhận chuyên môn | P1 | Speech (một phần) |
| DN04 | Chỉ định chưa sẵn sàng tại nơi chẩn đoán | Bàn giao | P1 | Không |
| DN05 | Tra cứu qua nhiều phần mềm, website | Tra cứu | P1 | Doanh thu (gom file Export) |
| DN06 | Điều phối liên khoa chưa có kênh theo dõi trạng thái | Theo dõi trạng thái | P1 | Không (đã thu hẹp) |
| DN07 | Danh sách phòng và file tổng hợp rời rạc | Lưu trữ | P1 | Doanh thu |
| DN08 | Dữ liệu chưa ổn định, khó thêm dịch vụ mới | Ghi nhận dữ liệu | P1 | Doanh thu (danh mục) |
| DN09 | Chưa phân loại rõ khách theo gói và dịch vụ phát sinh | Gói khám | P1 | Doanh thu |
| DN10 | Giá gói, chiết khấu chưa có cấu hình tập trung | Giá | P1 | Doanh thu (cấu hình giá) |
| DN11 | Doanh thu chưa xác định ngay đúng khoa, địa điểm | Phân loại doanh thu | P1 | Doanh thu |
| DN12 | Kỳ báo cáo chưa tách ngày chỉ định và ngày hoàn thành | Kỳ báo cáo | P1 | Doanh thu |
| DN13 | Thu gom, xác minh thủ công cuối tuần | Đối soát | P1 | Doanh thu |
| DN14 | Tính toán, lập báo cáo nhiều thao tác tay | Báo cáo tuần | P2 | Doanh thu |

### 2.2. Điểm nghẽn mới ghi nhận sau tuần 1

| # | Điểm nghẽn | Nguồn | Bài toán |
|---|---|---|---|
| N1 | Số tuần không chốt theo ngày; lần tra thứ hai là làm lại từ đầu | BC 02/11 | Doanh thu |
| N2 | Ba nguồn (Report, OH, máy) cho số khác nhau; chưa quy ước nguồn chính thức | BC 02/11, 16/11 | Doanh thu |
| N3 | Lỗi định dạng VND làm hỏng công thức (#VALUE!), phải làm lại slide | BC 02/11 | Doanh thu |
| N4 | PPT chưa có mẫu cố định; copy Excel → PPT phải chỉnh lại mỗi tuần | BC 02/11, 16/11 | Doanh thu |
| N5 | Các bảng phụ thuộc nhau nhưng không liên kết công thức; sửa upsale phải sửa cả bảng doanh thu | BC 16/11 | Doanh thu |
| N6 | Nhiều bên dán số liệu dạng ảnh vào file tổng | BC 16/11 | Doanh thu |
| N7 | Thứ tự trái/phải ngược giữa lời đọc và mẫu in | BC 04/11, 05/11 | Speech |
| N8 | Ca song ngữ mất ~16 phút sau khám; mẫu song ngữ khó tìm | BC 11/11, 12/11 | Speech |
| N9 | Kết quả được nói hai lần hoặc thư ký phải hỏi lại | BC 05/11, 10/11 | Speech |
| N10 | Định danh khách chép tay qua sổ, OH, máy, giấy nhỏ, Excel; PID tít vào từng hệ thống; ghi sổ song song với hệ thống ở quầy | BC 04/11, 05/11, 07/11; KS 11/11 | Ngoài phạm vi (ghi nhận) |

## 3. Nguyên nhân gốc (5 Why, T2)

**Điều thấy:** báo cáo tuần 26/10–31/10 mất ~290 phút trải trên 2 ngày, tra 2 lượt; đến giao ban 03/11 vẫn có 3 chỗ lệch hoặc bị hỏi lại.

1. Thư ký tra tay ~60 mã dịch vụ, từng PID, từng bác sĩ trên 5–6 nguồn rồi chép vào 8 bảng.
2. File Excel vừa là nơi nhập, nơi tính, vừa là nơi trình bày, nên không dán thẳng được file Export; chèn dòng làm hỏng hàm tổng.
3. Quy tắc tính doanh thu chưa được viết ra, nằm trong kinh nghiệm thư ký, nên mọi bước lọc làm bằng mắt.
4. Không có mốc chốt số theo ngày và chưa có quy ước nguồn chính thức, nên khi số lệch phải tra lại từ đầu.

**Nguyên nhân gốc:** chưa có cấu trúc dữ liệu chuẩn tách nhập liệu – danh mục quy tắc – báo cáo, cùng bước chốt số và đối chiếu nguồn.

Bổ sung từ BC 16/11: lệch số còn đến từ **cách nhập chưa thống nhất giữa các bên** (theo mã chỉ định, theo gói, theo lượt hay người), không chỉ từ thao tác của thư ký. Đây là giả thuyết, cần xác minh.

## 4. Điều đã thay đổi trong phạm vi

| Ngày | Thay đổi | Nguồn |
|---|---|---|
| 30/10 | Đề xuất ban đầu gồm 3 vấn đề: đồng bộ trạng thái khám, dữ liệu phân tán, báo cáo doanh thu | ĐX 30/10 |
| 05/11 | Thu hẹp vào hai việc: chuẩn hoá file Excel tuần và tự động làm slide giao ban | BC 05/11 |
| 10/11 | Mentor thống nhất ưu tiên công cụ tổng hợp dữ liệu doanh thu; speech tạm hoãn | T2, BC 10/11 |
| 15/11 | Kết quả check trùng: TC-14 là **một dự án gộp hai vấn đề**; phần trùng một phần là speech-to-text; nhóm được tiếp tục | Check trùng 15/11 |
| 16/11 | Đơn xin xác nhận: ưu tiên dashboard doanh thu; speech là định hướng tiếp theo | ĐXN 16/11 |
| 17/11 | Nhóm làm cả hai: doanh thu theo quy tắc mới nhất BC 16/11; speech bằng bộ dữ liệu giả, người thân thu âm | Nhóm |

## 5. Câu hỏi còn mở (ưu tiên)

| # | Câu hỏi | Hỏi ai | Chặn việc gì |
|---|---|---|---|
| Q1 | Mẫu câu phần Kỹ thuật và Kết luận/đề nghị; duyệt bảng slot, ràng buộc BI-RADS cho dữ liệu giả | Mentor tại khoa | Bộ dữ liệu speech |
| Q2 | Xác nhận bộ quy tắc doanh thu hiện hành (BR-02 phạm vi, tổng 4 phần 16/11, trừ gói SLUT 1–4) | Trưởng khoa | Báo cáo chính thức |
| Q3 | Chỉ định khớp nhiều gói lồng nhau thì chọn gói nào | Quầy, thư ký | Bóc tách gói |
| Q4 | Nguồn chính thức cho từng chỉ số và mốc chốt | Trưởng khoa, thư ký | Đối soát |
| Q5 | Bảng tổng phục vụ mục đích gì ngoài giao ban (báo cáo bệnh viện, KPI bác sĩ)? | Trưởng khoa | Chọn cột bắt buộc |
| Q6 | Cấu trúc file Excel mẫu song ngữ; bác sĩ đọc bằng ngôn ngữ nào | Thư ký SA, bác sĩ | Speech song ngữ |
| Q7 | Có được dùng mốc ảnh đầu/cuối trên PACS để đo không? | Mentor | Đo speech khách quan |
| Q8 | 8 tiêu chí chấm trong ĐX 30/10 còn áp dụng không? | Mentor, Ban tổ chức | Kiến trúc (có cần LLM agent) |
