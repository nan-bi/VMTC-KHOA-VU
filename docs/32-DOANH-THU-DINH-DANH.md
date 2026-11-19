# Doanh thu y tế, định danh và học phân loại dịch vụ

Cập nhật ngày 18/11/2026 trong bản v8. Hướng tham khảo: https://troisinh.com/docs/ai-for-business/level-1/finance/ai-revenue-forecasting . Đây là bài về dự báo doanh thu, không phải mã nguồn hay chuẩn kế toán y tế. Dashboard áp dụng phần đối soát, phát hiện bất thường và kiểm tra của nhân viên. Không đưa dự báo, số bù thiếu hoặc tỷ lệ tăng trưởng giả định vào doanh thu phát sinh.

## Các mục thao tác

1. **Chi tiết số liệu → Đối soát dữ liệu → Định danh, ghi chú & phân loại AI**: xem cảnh báo PID, tên, ngày sinh, tuổi, các dòng nguồn; nhập ghi chú rồi Lưu ghi chú. Ghi chú lưu tập trung trong cấu hình và lịch sử; cần quyền nhập/đối soát và nguồn chưa chốt. Trạng thái Đã xem xét chỉ ghi nhận việc kiểm tra, không hợp nhất ca hoặc xóa dòng. Nếu thông tin nguồn thay đổi, khóa cảnh báo cũng thay đổi để ghi chú cũ không tự duyệt thông tin mới.
2. **Dịch vụ mới từ dữ liệu nguồn**: Python học từ tên trong danh mục có nhóm và phép tính đã xác nhận. Xem gợi ý, bấm Dùng gợi ý để kiểm tra, rà nhóm báo cáo và phép tính, ghi căn cứ rồi Lưu phân loại dịch vụ đã xác nhận. Mã mới sau lưu được ghi nhớ và tham gia tính toán, các lần nhập sau dùng ánh xạ mã đó. Tên có nhiều cách phân loại mâu thuẫn hoặc từ hoàn toàn chưa biết không có gợi ý tự động. Lưu cặp khoa vẫn là mô hình riêng; tên dịch vụ không quyết định khoa chỉ định.
3. **Tính toán & doanh thu → Kiểm tra doanh thu & đơn giá bất thường → Chạy kiểm tra doanh thu**: Python so sánh tiền giá × lượng với số sau giảm/phân bổ nguồn từng mã dịch vụ và nhóm giá. Thiếu giá/giảm/phân bổ thì chưa đủ căn cứ, không coi là 0. Chênh lệch cần đối chiếu giảm giá hoặc giá cấu hình; không tự bù trừ. IQR 1,5 đánh dấu đơn giá áp dụng khác biệt trong cùng mã và nhóm giá, tối thiểu 8 dòng; không tự xóa hoặc sửa số. Đây là kiểm tra mô tả, không phải cam kết phát hiện mọi lỗi.
4. **Kho dữ liệu & biểu đồ → Mở dòng → Định danh người bệnh**: bổ sung hoặc sửa họ tên, ngày sinh đầy đủ và tuổi tại ngày chỉ định, kèm lý do. PID, mã lượt và nguồn gốc giữ cố định; dữ liệu gốc và lịch sử được giữ. Khi nhập file có thể ghép cột Họ tên, Ngày sinh, Tuổi; năm sinh đơn lẻ không thay thế ngày sinh đầy đủ.

## Nguyên tắc không gộp nhầm

- PID đơn lẻ không đủ căn cứ. So tên có dấu (chuẩn hóa Unicode, hoa/thường, khoảng trắng), ngày sinh đầy đủ và tuổi hợp lệ tại ngày chỉ định. Không bỏ dấu để gộp tên gần giống. Tuổi phải phù hợp ngày sinh theo ngày chỉ định; có tính thời điểm sinh nhật.
- Thiếu hoặc khác thông tin: giữ từng dòng riêng và tạo lưu ý khi PID lặp. Không lấy ghi chú đã xem xét để tự gộp. Một hồ sơ đủ thông tin vẫn không làm gộp các lượt khám/dịch vụ khác nhau thành một lần tính tiền.
- Kiểm tra cấu phần combo chỉ liên kết các dòng cùng danh tính đầy đủ, cùng lượt và cùng gói. Nếu thiếu thông tin, các phần giữ riêng và có thể hiện cảnh báo chưa thấy đủ cấu phần; không có nghĩa các dịch vụ đó phải bị xóa hoặc tiền phải bị trừ.
- Khóa nội bộ sinh cho file không có mã chỉ định dựa cả vị trí dòng nguồn, sheet và hash file. Hai dòng bằng giá trị không tự thành một dòng. Bản sao nguyên file cùng SHA-256 vẫn được chặn nhập lại; bản ghi giống hệt có cùng mã chỉ định nguồn vẫn được nhận diện là bản sao. Nghi trùng sự kiện khác khóa giữ để đối soát, không âm thầm loại.
- Chỉ tiêu đếm PID trên Tổng quan ghi rõ là số PID khác nhau, chưa phải số người bệnh đã xác nhận.

## Nguyên tắc tiền và mô hình

Doanh thu theo giá dịch vụ = tổng tiền của từng dòng dịch vụ hợp lệ trong kỳ. Tiền từng dòng được tính bằng số nguyên VND và số lượng có tối đa 6 chữ số thập phân, làm tròn nửa lên rồi mới cộng (`PRICE-QTY-2`). Không làm tròn sau khi gộp lượng vì có thể lệch tiền khi lượng là số lẻ. Ví dụ hai dòng 0,5 × 1 VND cho 1 + 1 = 2 VND. Giá lẻ, SKTQ, SLUT1, SLUT2 và XQ 2D/3D giữ riêng; không cộng gói cha với phân bổ dịch vụ con. Đây chưa phải thực thu, đối soát tiền thanh toán hay hoàn tiền một phần.

Phạm vi mặc định vẫn là toàn bộ dịch vụ Khoa Vú chỉ định, kể cả khoa khác thực hiện. Dòng hủy/chưa hoàn thành, ngoài kỳ, chưa chốt nguồn hoặc lỗi không vào tổng hoàn thành. Phân loại chưa rõ khoa chờ xác nhận.

AI tự cập nhật tập học từ danh mục và các nhãn đã lưu, dùng Multinomial Naive Bayes và đối chiếu tên chuẩn. Chỉ tên dịch vụ và nhãn nhóm/phép tính tham gia học; PID, tên người bệnh, ngày sinh và số tiền không dùng để huấn luyện mô hình phân loại. Kết quả gợi ý chưa xác nhận không tự đổi nhóm tính tiền. AI không tự sinh công thức kế toán, đơn giá hoặc số tiền. Phép tính thực hiện bằng bộ quy tắc xác định trên máy.

## Kiểm chứng và giới hạn

Kiểm thử dùng dữ liệu tổng hợp, SQLite trong bộ nhớ và kho trình duyệt tách biệt. Có đối chiếu Python/JavaScript, PID trùng tên khác/ngày sinh khác/thiếu thông tin, tuổi quanh sinh nhật, không gộp cấu phần, tiền lượng lẻ, số CSV dạng chuỗi, IQR, nhập dòng bằng nhau không mất nguồn, lưu nhãn/ghi chú qua đăng nhập, khóa phiên bản và từ chối ghi không hợp lệ. Mẫu golden chỉ cập nhật cảnh báo định danh và phiên bản quy tắc; các tổng tiền chuẩn giữ nguyên.

Kiểm thử kỹ thuật không chứng minh sai số thực tế dưới 0,05%. Muốn xác nhận mức này cần bộ chuẩn độc lập, đủ thông tin định danh, giá/gói đã duyệt, trạng thái dịch vụ và phạm vi nguồn đầy đủ. Dữ liệu thiếu không được tự bù để đạt chỉ tiêu. Không tự sửa nguồn vận hành trong quá trình kiểm tra.
