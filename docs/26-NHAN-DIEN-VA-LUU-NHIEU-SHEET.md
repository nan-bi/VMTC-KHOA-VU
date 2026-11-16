# Nhận diện và lưu nhiều loại sheet

Ngày: 16/11/2026. Sửa trực tiếp trong v8, giữ nguyên dữ liệu vận hành.

## Thay đổi
- Chọn file lẻ hoặc thư mục đều phân tích mọi sheet. Tìm dòng tiêu đề trong 30 dòng đầu bằng điểm khớp tên cột; không bắt buộc phải đủ schema doanh thu mới nhận ra tiêu đề.
- Dòng dịch vụ đủ schema đi vào pipeline đối soát và AI local phân loại khoa hiện có. Các bảng khác được phân loại cấu trúc bằng quy tắc local: tổng hợp, KPI, mapping, lượt/quy trình, tài chính thiếu liên kết hoặc tham chiếu.
- Lưu nguyên cột, dữ liệu ô, số dòng vật lý, file/sheet/hash của bảng tham chiếu trong metadata nguồn của workspace SQLite sau khi người dùng xác nhận. Tải lại vẫn xem được tại Nhập dữ liệu và Kho dữ liệu & biểu đồ; có Drawer xem tất cả dòng/cột, xuất nguyên bảng, mẫu bổ sung trống cho dịch vụ.
- Bảng tham chiếu không tham gia phép cộng doanh thu, không tự suy khoa theo tên file, không tự tạo liên kết theo tên bệnh nhân/mã gần giống. Cột không tên của bảng tham chiếu được đặt nhãn kỹ thuật để giữ ô dữ liệu; bảng dịch vụ có cột không tên vẫn báo lỗi.
- Nạp lại file đã từng nhập: chỉ thêm các bảng tham chiếu chưa có, không nhập lại dịch vụ/hash cũ. File cùng nội dung trong một batch không lưu bảng hai lần.
- Khi thiếu thông tin: hiển thị các cột cần bổ sung/đối chiếu. Mẫu bổ sung là bảng trống có cấu trúc và hướng dẫn, không tự chuyển số tổng hoặc đoán giá thành dòng dịch vụ. Chưa có mô hình đọc hiểu tự do mọi loại báo cáo hoặc tự điền dữ liệu nghiệp vụ; chức năng mới nhận diện cấu trúc bằng quy tắc, còn AI phân loại khoa vẫn dùng model local hiện có.

## Kiểm chứng
- Đọc file D:/AI VIN/VinMec/data_gialap/VINMEC_DATA_DAY_DU_20261109.xlsx: 9 sheet, 480 dòng tham chiếu, tiêu đề vật lý dòng 5, 0 sheet lỗi. Tai_chinh_moi có 200 dòng nhưng thiếu liên kết bệnh nhân/lượt/dịch vụ/khoa/ngày nên không tạo doanh thu.
- Trình duyệt tại backend SQLite bộ nhớ localhost:4192: chọn file thực qua file chooser, xem 9 bảng, xác nhận lưu, reload còn 9 bảng, mở Tai_chinh_moi thấy các cột thiếu và dữ liệu nguồn; Kho dữ liệu & biểu đồ cũng thấy bảng đã lưu. Không nhập workbook này vào kho vận hành thật.
- Python pipeline: 38 tests đạt; input audit: 5 đạt. Node: 240 tests đạt. Production build đạt, còn cảnh báo bundle lớn hiện hữu.
- Ba kỳ vọng kiểm thử cũ yêu cầu từ chối mọi bảng không đủ schema được thay bằng kiểm tra giữ bảng tham chiếu riêng và không đưa vào doanh thu. Thêm 4 hồi quy Python: workbook nhiều loại, lưu reference-only, bổ sung bảng bỏ sót của file cũ, chống trùng bảng trong một batch.
- Log: .speech-cache/sheet-intake-{python,audit,node,build}.log; tổng kiểm tra workbook: sheet-intake-real-workbook.json. Ảnh local docs/sheet-intake-proof.jpg.

## Sử dụng
Tải lại dashboard khi không đang ghi âm. Chọn lại file hoặc thư mục tại Nhập dữ liệu → Kiểm tra & xem trước → kiểm tra Bảng đã nhận diện → Xác nhận lưu dữ liệu đã phân loại. Những file đã nhập trước bản vá cần chọn lại để lấy các sheet đã bỏ sót. Chỉ bổ sung từ nguồn có căn cứ; có thể dùng Tải mẫu bổ sung dịch vụ, điền dữ liệu đã xác minh rồi nhập qua cùng quy trình.
