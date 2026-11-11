# Trợ lý truy vết hành chính local

Mở **Liên khoa & dữ liệu model**. Chọn tối đa 10 Excel/CSV rồi bấm **Kiểm tra & phân tích các file**. Trợ lý nằm ngay bên dưới vùng nạp file. Dữ liệu nạp giữ trong phiên hiện tại; tải lại trang sẽ quay về dữ liệu báo cáo. Không gửi dữ liệu tới nhà cung cấp AI.

## Dữ liệu đầu vào và xuất xứ

- Mỗi file tối đa 10 MB, từ 1 đến 10.000 dòng dữ liệu; tối đa 20.000 dòng/batch.
- Đọc sheet CANONICAL nếu có, nếu không đọc sheet đầu. Không tự gộp mọi sheet. Tên sheet đã đọc được hiển thị tại tab Cột & bằng chứng.
- Tiêu đề là hàng đầu của vùng dữ liệu sheet; cột bắt buộc theo `importSchema.mjs`. Cột thiếu, tiêu đề trùng hoặc dữ liệu ở cột không tên sẽ chặn batch. Một file lỗi không thay thế nguồn đang dùng.
- `source_file`, `source_sheet`, `source_row`, `source_file_hash`, `ingested_at` được gắn từ file thực tế. Không tin metadata nguồn tự khai trong bảng. SHA-256 tính trên bytes file; Excel có dòng trống vẫn giữ đúng số dòng vật lý. CSV dùng số dòng bản ghi bảng (ô nhiều dòng trong CSV không đồng nhất số dòng văn bản).
- Hash kiểm tra file khác hash snapshot báo cáo. Hash không chứng minh tính đúng đắn của dữ liệu bệnh viện.
- Metadata xuất xứ không tham gia so sánh nội dung nghiệp vụ. Hai bản ghi cùng mã, nội dung giống nhau nhưng khác file/sheet/hash chỉ tính một lần. Cùng mã khác nội dung cách ly toàn nhóm. Tất cả bản gốc vẫn còn để truy vết.

## Cách hỏi

Chọn chế độ trước khi hỏi: tra cứu nguồn, dòng chỉ định liên quan Vú, dòng hoàn thành liên quan Vú, giá trị Vú chỉ định, giá trị Vú thực hiện trước giảm, hoặc sau giảm/phân bổ. Chế độ đã chọn quyết định phép tính; trợ lý không tự đổi góc nhìn tài chính từ câu hỏi.

Ví dụ:

- `BN-0001 làm những dịch vụ gì, ở file nào?`
- `Tổng siêu âm trong kỳ lấy từ file nào, dòng nào?`
- `VABB ở file nào?`
- `Các mã chỉ định trùng giữa các file`
- `Tổng giá trị Vú chỉ định lấy từ đâu?` (chọn Vú chỉ định · trước giảm)
- `"Tên dịch vụ đầy đủ" ở đâu?` (cụm từ trong ngoặc kép dùng tìm kiếm trực tiếp)

Bộ lọc nhận diện được luôn hiển thị để người dùng kiểm tra. Đây là bộ truy vấn có giới hạn, chưa phải hiểu ngôn ngữ tự nhiên tổng quát. Không hỗ trợ chẩn đoán, điều trị, dự đoán, phép loại trừ hoặc suy diễn từ dữ liệu thiếu. Câu hỏi chưa xác định được đối tượng cần viết lại bằng mã, nhóm dịch vụ, tên file hoặc cụm từ trong ngoặc kép. Không dùng tính năng này để xác nhận tính đúng đắn lâm sàng.

Tra cứu có thể chọn kỳ hiện tại hoặc toàn nguồn. Tính tiền/sản lượng luôn dùng kỳ đang chọn. Kỳ tra cứu lấy dòng có chỉ định hoặc hoàn thành trong kỳ; cờ đóng góp dựa trên chế độ đã chọn và kiểm tra nghiệp vụ. Số dòng không đồng nhất số ca, số lượt hoặc số bệnh nhân.

## Kết quả và bằng chứng

Kết quả có ba phần: trả lời trực tiếp, bảng nguồn (kèm đóng góp theo file/sheet), cảnh báo. Mỗi dòng có tên file, sheet, dòng, khoa chỉ định/thực hiện, trạng thái, cờ đóng góp và dẫn chứng. Metadata cũ thiếu được ghi rõ, không đoán lại sheet/dòng. Nhấn mã chỉ định mở drawer bằng chứng hiện có.

Bảng phân trang, nhưng tổng tính trên toàn bộ dòng phù hợp. Không lấy 8 dòng đầu để tính tổng. **Xuất toàn bộ bằng chứng Excel** tạo ba sheet Phan_hoi, Bang_chung, Theo_file. File giữ câu hỏi, bộ lọc, phạm vi, tổng và toàn bộ citation. Sửa câu hỏi/chế độ/phạm vi hoặc đổi dữ liệu sẽ xóa kết quả cũ để tránh nhầm.

Trong chế độ tra cứu, “đóng góp” nghĩa là qua kiểm tra nguồn, không phải đóng góp doanh thu. Hai góc nhìn doanh thu không cộng thành tổng. Giá trị chưa biết vẫn để trống và đếm thiếu. Dòng không tìm thấy được báo theo số file và phạm vi; không khẳng định bệnh nhân không tồn tại trong hệ thống bệnh viện.

## Kịch bản demo có sẵn

Trong `docs/copilot-demo/` có hai file giả lập SA_A_demo.xlsx và SA_B_demo.xlsx. Chọn ngày 23/10/2026, nạp cả hai file rồi bấm **Nguồn số liệu siêu âm**. Kết quả mong đợi: 15 dòng bằng chứng, 12 dòng hoàn thành đủ điều kiện, một bản trùng không cộng lại và hai dòng xung đột cùng mã bị cách ly. File A có dòng trống nên các dòng dữ liệu đầu là 2, 4, 5. Nút **Truy doanh thu chỉ định** trả 5.400.000 VND trong bộ mẫu. Nút **Kiểm tra trùng liên file** hiển thị cả hai bản gốc của mỗi nhóm để đối soát. Tải Excel bằng chứng sẽ có đủ 15 dòng dù màn hình chỉ hiện 8 dòng/trang.

## Kiến trúc hiện tại và tích hợp model sau

1. `ingestion.mjs`: đọc bytes, kiểm tra hợp đồng, lưu provenance, nạp batch nguyên khối.
2. `routing.mjs` + `reports/core.mjs`: phân loại, kiểm tra trùng/xung đột, cờ đủ điều kiện, tài chính xác định.
3. `auditCopilot.mjs`: nhận câu hỏi và chế độ; lọc toàn nguồn; tính bằng hàm số tiền chuẩn; sinh citation từ bản ghi.
4. `AuditCopilot.jsx`: giao diện hỏi, tổng theo nguồn, mở bằng chứng và tải Excel.
5. `model/AUDIT_COPILOT_SYSTEM_PROMPT.md`: hợp đồng hướng dẫn cho lần tích hợp model sau; chưa được gọi trong ứng dụng.

Khi tích hợp model, thêm backend với API key trong biến môi trường máy chủ. Model chỉ đề xuất kế hoạch truy vấn có schema cho phép (mode, scope, ID/dịch vụ/file), không nhận quyền chạy code/SQL tùy ý. Backend kiểm tra schema, quyền và bộ lọc rồi gọi bộ tính xác định; model chỉ diễn giải kết quả đã kiểm chứng. Citation phải tham chiếu khóa nguồn tồn tại; không lấy nội dung model làm số tiền chính thức. Chỉ gửi trường dữ liệu đã được phép tới nhà cung cấp đã chọn; không nhúng khóa vào frontend. Cần xây backend và kiểm định trước khi kích hoạt.

75 kiểm thử JavaScript hiện tại, trong đó 7 test mới bao phủ dòng trống, metadata giả, trùng liên file, xung đột, hơn 8 dòng bằng chứng, thiếu tiền, không tìm thấy và phạm vi kỳ. Đối chiếu 182 giá trị trên dữ liệu giả lập vẫn đạt; chưa chứng minh sai số <0,05% trên dữ liệu thực.
