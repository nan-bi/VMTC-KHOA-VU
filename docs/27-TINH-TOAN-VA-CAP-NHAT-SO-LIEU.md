# Tính toán và cập nhật số liệu

Ngày 16/11/2026.

## Vì sao nhập rồi chưa thấy kết quả đầy đủ
Kiểm tra chỉ đọc workspace vận hành revision 1: 8.270 dòng dịch vụ, 170 hợp lệ và 8.100 dòng bị cách ly vì cùng mã khác nội dung. Trong nhóm lỗi, 2.700 dòng còn lỗi ngày chỉ định và 2.391 dòng thiếu ngày hoàn thành hợp lệ; các loại lỗi chồng nhau. 23.405 dòng tham chiếu nằm riêng. Chưa có snapshot. Không chỉnh sửa hoặc xóa nguồn trong lượt kiểm tra này.

170 dòng hợp lệ có ngày hoàn thành từ 19 đến 25/10/2026; 140 dòng thuộc phạm vi Khoa Vú chỉ định, 30 dòng ngoài phạm vi. Chọn ngày khác hoặc xem một ngày riêng không cho tổng của cả tuần.

## Thay đổi giao diện
- Thêm khối Tính toán & cập nhật số liệu ở Tổng quan, Chi tiết số liệu, Đối soát: số dòng đã lưu, hợp lệ, cách ly, đủ điều kiện trong kỳ; phân biệt bảng tham chiếu và lý do chưa tính.
- Nút Xem tính toán & doanh thu đi thẳng sang Chi tiết; nút Chọn toàn kỳ có dữ liệu hợp lệ đổi lịch sang min/max ngày hoàn thành hợp lệ thuộc Khoa Vú và in_snapshot=1, không đổi dữ liệu nguồn.
- Nút Cập nhật số liệu đọc lại workspace và yêu cầu tính lại bảng Python. Nút Tính lại giá × số lượng chạy lại phép tính với nguồn/quy tắc/bộ lọc hiện tại. Không tạo giao dịch doanh thu mới và không sửa snapshot đã chốt.
- Khi lưu dữ liệu hoặc quy tắc, số liệu vẫn tự cập nhật như trước. Cần đối soát hết lỗi để chốt báo cáo đầy đủ; xem trang đối soát chưa đồng nghĩa giải quyết hết lỗi.

## Kết quả
- 244 Node tests đạt (thêm 4 trường hợp: lệch kỳ, cách ly nhóm xung đột, tham chiếu không thành dịch vụ, chưa rõ khoa không thành kỳ tính); production build đạt 14,36 giây, còn cảnh báo chunk hiện hữu.
- Browser vận hành: tải giao diện mới, chọn toàn kỳ hợp lệ, mở Chi tiết, cập nhật nguồn và bấm tính lại. Kỳ 19–25/10/2026 có 140 dịch vụ đủ điều kiện; trước giảm 82.000.000 VND; doanh thu theo giá × lượng 57.000.000 VND. Chỉ là phần hợp lệ; 8.100 dòng lỗi chưa được cộng. Không sửa dữ liệu SQLite hoặc ca speech.
- Không chạy lại Python suite vì không sửa backend Python trong lượt này; lượt trước đạt 43 Python tests.
- Logs: .speech-cache/calculation-visibility-node.log, calculation-visibility-build.log. Ảnh đã quan sát qua browser; chưa lưu được ảnh vào file do phiên công cụ bị khởi tạo lại.

## Cách dùng
Đối soát dữ liệu → Xem tính toán & doanh thu → chọn lịch (hoặc Chọn toàn kỳ có dữ liệu hợp lệ) → xem bảng bóc tách gói/lẻ và Doanh thu theo giá và số lượng. Sửa cấu hình giá nếu có căn cứ. Nút tính lại không tự giải quyết lỗi trùng/xung đột hoặc dữ liệu thiếu.

## Cập nhật bố cục ngày 16/11/2026

Mở **Chi tiết số liệu** để dùng chung một kỳ báo cáo cho ba thẻ:

- **Tính toán & doanh thu**: bóc tách gói/lẻ, giá × số lượng, cấu hình và tính lại.
- **Đối soát dữ liệu**: xem lỗi, xử lý ngoại lệ kèm lý do, kiểm tra phần còn thiếu và chốt bản nháp.
- **Bảng dịch vụ & nguồn**: lọc dịch vụ, xem dòng nguồn và xuất Excel chi tiết.

Không còn mục Đối soát riêng trong menu. Nút đối soát sau khi nhập hoặc trong Kho dữ liệu mở thẻ tương ứng ở Chi tiết. Các phép tính không thay đổi; lưu nguồn/quy tắc hoặc xử lý ngoại lệ sẽ cập nhật phần tổng hợp.

## Nhập dữ liệu ngay trong Chi tiết số liệu

Menu Nhập dữ liệu đã gộp vào **Chi tiết số liệu → Nhập dữ liệu**. Chọn file/thư mục, xem trước và xác nhận lưu tại đây. Phía trên các thẻ luôn hiển thị số dịch vụ, doanh thu khám/siêu âm/X-quang theo giá×số lượng và các dòng còn cần xử lý. Sau khi lưu, các tổng cập nhật theo kỳ đang chọn; phần đối soát mở ngay trong cùng trang. Dữ liệu mới ngoài kỳ không cộng vào kỳ hiện tại: kiểm tra lịch hoặc mở Kiểm tra nguồn & cập nhật số liệu để chọn toàn kỳ hợp lệ.

Đổi thẻ không làm mất file/xem trước đang chọn. Phần xem trước chưa lưu không cộng doanh thu. Dòng lỗi hoặc chưa xác nhận khoa tiếp tục cách ly; bảng tham chiếu không tự chuyển thành dịch vụ. Khi lưu quy tắc, sửa nguồn hoặc loại ngoại lệ kèm lý do, tổng tính lại từ nguồn hợp lệ. Báo cáo đã chốt giữ snapshot cũ.

## Thu gọn thao tác nhập

Nút **Nhập dữ liệu** nhỏ ở góc phải phần tổng mở khung trượt bên phải để chọn file/thư mục và xem trước. Đóng khung vẫn giữ lựa chọn trong phiên hiện tại; sau khi lưu dịch vụ thành công khung đóng, đối soát mở trên trang đang dùng. Phân loại khoa và xác nhận AI nằm trong Đối soát. Lịch sử nhập và bảng tham chiếu nằm trong các mục có thể mở rộng trong khung nhập. Tổng doanh thu, kỳ và chính sách cộng số giữ nguyên.

## Chọn khoa chỉ định trong phần bóc tách

Dropdown trong **Bóc tách khám · siêu âm · X-quang** gồm **Tất cả**, **Khoa Vú chỉ định** (mặc định) và **Khoa khác chỉ định**. Dựa theo khoa chỉ định đã xác nhận, bao gồm các khoa thực hiện tương ứng và cùng ngày hoàn thành/kỳ ở lịch. Tất cả là hợp hai nhóm, không cộng dòng chưa xác nhận khoa. Đổi bộ lọc sẽ tính lại bảng cấu phần, giá, doanh thu và các dòng nguồn bên dưới; nguồn chi tiết có cả khoa chỉ định và khoa thực hiện. Tổng báo cáo Khoa Vú phía trên và snapshot đã chốt giữ phạm vi Vú chỉ định.
