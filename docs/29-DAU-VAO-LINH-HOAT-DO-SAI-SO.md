# Đầu vào linh hoạt, báo cáo cuối theo mẫu

## Luồng sử dụng
1. Tại Chi tiết số liệu, chọn Nhập dữ liệu; chọn file hoặc thư mục Excel/CSV bất kỳ. Không bắt buộc tên file, tên sheet hoặc thứ tự cột theo file mẫu. Giới hạn kỹ thuật hiện tại: 100 MB/file, 100 file và tổng500 MB/lần;100.000 dòng mỗi tác vụ.
2. Kiểm tra & xem trước đọc mọi sheet, nhận diện tiêu đề trong30 dòng đầu. Nếu tên cột khác, mở Xem bảng / cột thiếu → Ghép cột đầu vào; chọn ý nghĩa cột, ghi căn cứ và Áp dụng & kiểm tra lại file. Các trường chuẩn còn lại giữ nguyên. Chưa đủ thông tin nghiệp vụ thì giữ tham chiếu, không tự tạo giá/khoa/trạng thái.
3. Khi Xác nhận lưu dữ liệu, cấu trúc đã xác nhận được lưu cùng lịch sử tiếp nhận. Các file sau có cùng tập tên cột, kể cả đổi thứ tự, dùng lại ánh xạ. Ánh xạ mâu thuẫn cần xác nhận lại; không tự chọn một nhãn. File trùng SHA256 không nhập lại. Sheet trước đây lưu tham chiếu được phép chuyển thành dịch vụ sau xác nhận ánh xạ; không nhập lại sheet dịch vụ đã xử lý.
4. Tại Đối soát → Phân loại khoa & xác nhận AI, mã dịch vụ chưa có trong danh mục được liệt kê từ nguồn. Xác nhận nhóm báo cáo và phép tính để bổ sung danh mục, giữ nguyên mã nguồn. Mã có nhiều tên hoặc thiếu tên cần sửa nguồn trước. Danh mục cơ sở không bị ghi đè; danh mục bổ sung được lưu với cấu hình/lý do/lịch sử và backend xác nhận.
5. Cặp khoa chuẩn được phân theo luật; model Naive Bayes local học từ nhãn cặp khoa đã xác nhận. Cặp khoa mới chỉ có gợi ý, không tự đưa vào tổng. Nhóm dịch vụ mới được ghi nhớ theo mã đã xác nhận, không phải model ngôn ngữ tự hiểu mọi tên dịch vụ. Không có API AI ngoài máy.
6. Chỉ mẫu bố cục báo cáo xuất cuối giữ cố định; số liệu lấy từ nguồn hợp lệ và phiên bản báo cáo đã duyệt. Không sửa bộ xuất trong thay đổi này. Dòng mới cần giá/gói đã xác định trước khi công bố doanh thu đầy đủ.

## Bốn luồng và phạm vi tài chính
- VU_INTERNAL: Vú chỉ định, Vú thực hiện.
- VU_OUTBOUND: Vú chỉ định, khoa khác thực hiện.
- VU_INBOUND: khoa khác chỉ định, Vú thực hiện.
- EXTERNAL_UNRELATED: khoa khác chỉ định và thực hiện.
Doanh thu theo phạm vi người dùng xác nhận là INTERNAL + OUTBOUND. INBOUND và EXTERNAL tách riêng, không cộng vào doanh thu chỉ định Khoa Vú. Tiền do bộ tính đơn giá × số lượng xử lý; model không tạo đơn giá hay số tiền, không tự phân bổ gói.

## Đo mục tiêu dưới0,05%
Tại Đối soát → Phân loại khoa & xác nhận AI → Đo sai số với dữ liệu chuẩn, tải mẫu đối chiếu, chọn bảng chuẩn và bấm Đối chiếu chuẩn. File chuẩn chỉ để đánh giá; không được dùng để học hoặc thay thế nguồn. Lấy sheet đầu tiên và các trường:
- source_file, source_sheet, source_row: khóa vị trí nguồn chính xác. Sheet trống mặc định CANONICAL; cần điền tên sheet thực tế của file.
- expected_route: một trong bốn nhãn trên.
- expected_service_code: mã dịch vụ đã xác nhận độc lập.
- expected_revenue_vnd: doanh thu chỉ định Khoa Vú của từng dòng, nguyên VND không âm; dòng ngoài phạm vi là0. Đây là giá trị giá×số lượng theo chính sách được đối soát, không mặc nhiên là thực thu/sau giảm.
Sai phân loại = số dòng sai luồng/mã hoặc không có nguồn duy nhất / số dòng chuẩn ×100. Sai doanh thu = tổng chênh tuyệt đối từng dòng / tổng tuyệt đối doanh thu chuẩn ×100; không bù trừ các lỗi trái dấu. Chuẩn tổng0 chỉ đạt nếu chênh0; thiếu giá/nguồn thì không xác định tỷ lệ tài chính.
Chỉ báo đạt trên chính bộ đang kiểm tra nếu đủ độ phủ toàn bộ nguồn hợp lệ, không còn dòng lỗi bị cách ly, giá xác định và cả hai tỷ lệ nhỏ hơn0,05%. Bằng0,05% là chưa đạt. Đổi nguồn hoặc cấu hình làm kết quả cũ không còn áp dụng. Kết quả đo không chứng minh độ chính xác trên các file tương lai; dữ liệu chuẩn phải do khoa kiểm tra độc lập, tránh dùng chính dự đoán làm nhãn chuẩn.

## Kiểm chứng16/11/2026
253 Node tests;38 Python pipeline +5 Python quality tests đạt;build13,36 giây đạt (cảnh báo chunk lớn hiện hữu). Có kiểm thử đổi tên/thứ tự cột, nhớ cấu trúc, ánh xạ xung đột, chống giả truy vết, chuyển tham chiếu thành dịch vụ không nhập lại, bốn luồng, danh mục mở rộng qua backend, chuẩn thiếu độ phủ, thiếu giá, sai số trái dấu và ngưỡng đúng0,05%.
Browser4180 chọn file Excel trên máy, ghép cột Khoa chỉ định và kiểm tra lại ra1dòng dịch vụ, đúng file/sheet/dòng; không xác nhận lưu. Bảng chuẩn kiểm thử không khớp nguồn báo chưa đủ căn cứ,170dòng hợp lệ chưa có chuẩn,10.800dòng lỗi còn tồn tại. Chưa chứng minh sai số thực tế dưới0,05%. Không tự xử lý các dòng lỗi nguồn, không sửa speech/IndexedDB. Ảnh flexible-mapping-proof.png và flexible-quality-proof.png.
