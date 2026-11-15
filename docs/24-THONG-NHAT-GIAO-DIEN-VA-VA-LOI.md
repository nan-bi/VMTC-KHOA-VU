# Thống nhất giao diện và vá lỗi

Ngày kiểm tra: 15/11/2026. Thay đổi trực tiếp tại VinMec-KhoaVu-Local-v8.

## Giao diện và thao tác

- Dashboard, đăng nhập, speech và trang thu mẫu dùng font Noto Sans local, nền trắng và màu hồng nhạt; thống nhất cỡ chữ, thẻ, nút, khoảng cách và tiêu đề.
- Sidebar trên máy tính; menu dạng ngăn kéo trên điện thoại. Thêm liên kết bỏ qua menu và trạng thái trang đang chọn cho bàn phím/trình đọc màn hình.
- Tổng quan đặt số liệu trước phần giải thích. Trang nhập đặt vùng chọn file lên đầu; các hướng dẫn dài thu gọn được.
- Bộ lọc ngày chỉ xuất hiện ở trang có dữ liệu theo kỳ. Thanh quy trình chỉ ở Tổng quan và Báo cáo giao ban.
- Đối soát hiển thị phân loại chờ xác nhận, cho đi tới nơi xác nhận và khóa chốt snapshot khi chưa xử lý xong.
- Cải thiện trạng thái chưa có dữ liệu, nút chuyển trang, bảng chọn cột và cửa sổ chi tiết. Giữ thao tác sửa dữ liệu theo luồng hiện có.
- Speech nhúng bỏ phần thương hiệu lặp lại; kết quả và nút thao tác thích ứng màn hình nhỏ. Không đổi cơ chế lưu IndexedDB.

## Lỗi đã vá

- Khoảng ngày nhiều ngày giữ đúng chế độ khi đổi trang rồi quay lại.
- Lỗi mạng hoặc máy chủ tạm thời khi đồng bộ nền giữ màn hình làm việc và hiện cảnh báo; chỉ HTTP 401 làm hết phiên đăng nhập. Ngăn các lượt poll chồng nhau.
- Client giữ mã trạng thái HTTP cả khi nội dung lỗi không phải JSON; phản hồi thành công nhưng JSON hỏng được báo lỗi.
- Bóc tách dịch vụ có nút thử lại khi phép tính Python thất bại. Nút xem nguồn không hoạt động khi có 0 dòng.

## Kiểm chứng đã thực hiện

- 240 kiểm thử Node đạt, 0 lỗi; gồm kiểm thử phân biệt trạng thái HTTP và JSON lỗi.
- 34 kiểm thử pipeline Python và 5 kiểm thử đầu vào Python đạt, tổng 39.
- Build production đạt; còn cảnh báo kích thước chunk lớn.
- Kiểm tra 8 trang dashboard ở 1440px và 390px; kiểm tra thêm đăng nhập/cửa sổ chi tiết ở 320px và biểu đồ ở 1024px. Không phát hiện tràn ngang toàn trang trong các lượt kiểm tra.
- Kiểm tra đổi khoảng ngày rồi chuyển trang, menu điện thoại, biểu đồ mở nguồn, cửa sổ sửa dữ liệu, cấu hình, speech và trang thu mẫu. Không lưu sửa dữ liệu trong các lượt kiểm tra giao diện.
- Không ghi âm thật, không sửa ca speech, không nhập dữ liệu vận hành hoặc chốt báo cáo để thử giao diện.

Log: `.speech-cache/interface-unified-tests.tap`, `interface-client-tests.tap`, `interface-unified-python.log`, `interface-unified-build.log`. Kết quả kích thước/font: `.speech-cache/interface-browser-checks.json`.

Ảnh chụp và log kiểm chứng được giữ cục bộ, không đưa lên Git.

## Giới hạn và bước tiếp theo

Kiểm thử trên không chứng minh hệ thống không còn mọi lỗi, độ chính xác nhận dạng giọng nói hay sai số bệnh viện dưới 0,05%. Các khoảng trống nghiệp vụ về đủ nguồn, giá theo ngày hiệu lực và tập đối chiếu độc lập trong [kiểm toán feature](23-KIEM-TOAN-FEATURE-VA-DAU-VAO.md) vẫn cần chính sách/dữ liệu chuẩn của khoa.

Bản build lưu tại dist. Mở dashboard qua http://127.0.0.1:4180/ và tải lại trang khi không đang ghi âm. Dữ liệu speech vẫn thuộc origin http://127.0.0.1:4173. Chưa commit hoặc push các thay đổi lượt này.

## Hoàn thiện phân cấp thị giác

- Giữ nền hồng-trắng dịu nhưng chuyển nền tổng thể và chữ phụ sang màu trung tính có tương phản cao hơn; màu hồng đậm dành cho hành động chính và điểm nhấn.
- Đồng bộ CTA, trạng thái đang chọn, thẻ kết quả, biểu đồ và trường nhập giữa dashboard, kho dữ liệu, Vú Voice và trang thu mẫu. Trạng thái chờ kiểm tra và đã kiểm tra được phân biệt bằng màu có ý nghĩa.
- Thêm focus ring rõ, trạng thái hover kín đáo và tôn trọng `prefers-reduced-motion`. Không đổi luồng nghiệp vụ, dữ liệu, model, lưu trữ hay thông điệp giới hạn nghiệp vụ.
- Kiểm chứng lượt này: 240/240 Node tests đạt; production build đạt trong 12,41 giây, còn cảnh báo chunk >500 kB. `git diff --check` đạt (có cảnh báo quy ước LF/CRLF trên Windows). Browser tải được trang thu mẫu và dashboard login; kiểm tra thu mẫu tại viewport 390px không tràn ngang, nút chính dùng chữ trắng trên nền rose đậm. Không đăng nhập, không mở trang kết quả/IndexedDB, không ghi âm hoặc thay đổi dữ liệu.

## Hoàn thiện dashboard còn lại

- Tinh chỉnh riêng các màn nhập dữ liệu, chi tiết, kho/biểu đồ, đối soát, báo cáo, lịch sử và quy tắc: tăng nhịp điệu tiêu đề/bảng, làm bước nhập rõ hơn, phân cấp thẻ KPI báo cáo, nhật ký dễ quét, quy tắc gọn theo cặp nhãn/nội dung, và layout mobile.
- CSS kho dữ liệu dùng token hiện hành, làm rõ lựa chọn nguồn, tab, dòng ngoại lệ và biểu đồ. Không đổi cách lọc/tính, luồng nhập, xác nhận hay xuất.
- Kiểm tra browser các màn dashboard ở lượt này bị giới hạn bởi trang backend yêu cầu đăng nhập; không dùng tài khoản, không mở storage trình duyệt dùng chung. 240/240 Node tests đạt; build đạt trong 11,42 giây, còn cảnh báo chunk >500 kB; `git diff --check` đạt, chỉ cảnh báo line ending LF/CRLF. Các màn sau login chưa được kiểm tra trực quan trong lượt này.
