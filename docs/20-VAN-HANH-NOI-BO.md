# Vận hành nội bộ

Chạy CHAY-DASHBOARD-SPEECH.cmd và mở http://127.0.0.1:4180/. Tài khoản hiện có tiếp tục dùng được. Mọi thao tác lưu nguồn, sửa dữ liệu, cấu hình giá, chốt, gửi duyệt, duyệt và xuất được xử lý trên hệ thống hiện tại. Không dùng nút nạp ca hoặc tạo ngoại lệ trình diễn.

1. Nhập dữ liệu: chọn file hoặc thư mục, xem trước sheet/dòng, kiểm tra trùng rồi xác nhận nhập. Biểu mẫu tải xuống chỉ có tiêu đề, không có bản ghi sẵn.
2. Kho dữ liệu & biểu đồ: chọn nguồn và ngày; sửa trường nghiệp vụ có lý do, kiểm tra cột và tải bảng đang xem.
3. Chi tiết số liệu / quy tắc giá: xác nhận khoa chỉ định, loại gói, đơn giá khám/siêu âm/XQ 2D/3D; kiểm tra lượng lẻ sau khi trừ SKTQ, SLUT1, SLUT2. Không cộng doanh thu chưa đủ căn cứ.
4. Đối soát: sửa hoặc loại dòng có lý do. Chốt khi không còn lỗi chặn và dòng chờ phân loại trong kỳ.
5. Báo cáo giao ban: tạo và chỉnh nhận xét, gửi duyệt. Người duyệt hoặc admin xác nhận; admin có thể chọn vai trò thao tác để kiểm tra toàn bộ quy trình. Sau duyệt xuất Excel/PowerPoint/PDF. Mở kỳ mới để lưu báo cáo cũ và tiếp tục nhập.
6. Speech: tạo ca, nhập thông tin, đồng ý micro rồi Bắt đầu; dừng để soát, Hoàn thành để lưu, vào Kết quả để kiểm tra và xác nhận. Có thể gõ trực tiếp, tự lưu nháp, khôi phục nháp, xuất TXT và in/PDF.

Kho mới bắt đầu trống, không tự nạp dữ liệu dịch vụ. Kho cũ, mã dịch vụ, tên file, log và bản đã duyệt được giữ nguyên để truy vết. Các dữ liệu từng được tạo để kiểm thử vẫn giữ nguồn gốc đó; việc đổi giao diện không xác nhận chúng là dữ liệu bệnh viện. Danh mục giá khởi tạo cần đối chiếu và cấu hình trước khi dùng. Không xóa hoặc đổi nguồn gốc của dữ liệu cũ.

Dashboard dùng SQLite trên máy; speech giữ IndexedDB tại origin 127.0.0.1:4173 như trước. Hệ thống chưa kết nối HIS/EMR, chữ ký bác sĩ, tiền thực thu hoặc đồng bộ ca speech qua nhiều thiết bị. Xác nhận speech hiện ghi nhận tên người nhập, chưa xác thực danh tính bác sĩ; không coi là chữ ký chính thức. Model chép trên máy và cần người kiểm tra; không tự đưa ra quyết định lâm sàng.

Giới hạn nhập Excel/CSV: 100 MB/file, tổng 500 MB/lần, 100 file khi chọn thư mục. Đọc tối đa 100.000 dòng mỗi sheet/mỗi lần; kho nguồn tối đa 100.000 dòng. Nếu tổng dòng trong kho vượt giới hạn, xem trước bị chặn trước khi lưu. Backend nhận trạng thái JSON tối đa 256 MB; dung lượng file Excel không tương đương dung lượng dữ liệu JSON sau giải nén.

Đọc trực tiếp: bấm Bắt đầu ngay cả khi chưa nhập thông tin ca; thao tác này đồng ý sử dụng micro, trình duyệt có thể hỏi cấp quyền. Không tự mở micro khi tải trang. Bấm Dừng để xử lý nốt lời đọc, bổ sung PID/lượt/chỉ định/bác sĩ trước khi Hoàn thành & lưu kết quả. Ca thiếu định danh vẫn được giữ dưới dạng bản nháp; không tự tạo mã bệnh nhân hoặc lưu thành kết quả hoàn thành.

Chép khi đang nói: bấm Bắt đầu, lời nhận dạng hiện và cập nhật ngay trong ô Bản chép đầy đủ. Cửa sổ nghe hiện tại được nhận dạng lại sau khoảng 1,2 giây âm thanh mới, tùy tốc độ model; đoạn cuối còn tạm và có thể thay đổi khi thêm ngữ cảnh. Khi ngắt câu khoảng 0,7 giây hoặc đủ 8 giây, hệ thống chốt đoạn; Dừng sẽ chép nốt đuôi trước khi cho sửa/lưu. Chỉ bản chốt được tự lưu nháp. Không đóng tab khi còn âm thanh chờ xử lý; nếu dịch vụ lỗi, giữ tab và dùng Thử chép lại.

Kiểm chứng ngày 15/11/2026: 206 kiểm thử Node đạt; build đạt. Thu âm tổng hợp qua callback thời gian thực và HTTP/PhoWhisper thật: chữ đầu sau 1,819 giây, 21 cập nhật tạm, 31 yêu cầu cho hai phiên tổng 36,1684 giây. Đoạn chốt bao phủ đủ 578.695 mẫu, gồm đuôi cuối; lượt xem trước có gửi lại cửa sổ âm thanh để giữ ngữ cảnh. Đây là đo trên mẫu tổng hợp, chưa thu micro thật; không bảo đảm độ trễ hoặc độ chính xác tương tự trên mọi giọng nói.


## Lưu ca speech ngay trong trình duyệt · cập nhật 15/11/2026

Ca ghi được tự lưu Bản nháp bằng IndexedDB; kể cả chưa có PID/lượt/chỉ định/bác sĩ vẫn giữ phần đã nhập. Các đoạn đã chốt được tự lưu, đoạn nhận dạng tạm và âm thanh còn đang xử lý chưa phải bản chép đã lưu. Chờ báo Đã lưu nháp hoặc Hoàn thành & lưu kết quả trước khi đóng trang. Ca hoàn thành ở Kết quả; mặc định xem Tất cả trạng thái, có Từ ngày/Đến ngày và Xem tất cả ngày. Ngày lọc lấy ngày địa phương ghi cùng ca, không lấy ngày UTC.

Lưu ở trình duyệt/thiết bị và đúng origin http://127.0.0.1:4173 (dashboard 4180 nhúng trang speech này). Không cần chọn hay tạo thư mục, không tự xuất file hoặc chuyển ca sang speech-data. Không có giới hạn số ca cố định trong ứng dụng; dung lượng thực tế tùy trình duyệt. Lưu bản chép/thông tin ca, không lưu âm thanh. Dữ liệu không tự đồng bộ sang trình duyệt hay máy khác.

Nút Bật lưu bền vững gọi Storage API khi thao tác, chỉ báo Đã bật khi trình duyệt thật sự chấp nhận. Nếu chưa cấp, vẫn lưu IndexedDB nhưng không thể bảo đảm chống thu hồi khi thiết bị thiếu dung lượng. Không xóa dữ liệu trang, không dùng cửa sổ ẩn danh. Bản lưu cũng không chống được gỡ trình duyệt hoặc hỏng thiết bị. Khi lỗi/quota đầy, ứng dụng báo chưa lưu và giữ nội dung đang mở, không báo lưu thành công giả.

Kiểm chứng: 209 kiểm thử Node đạt, build đạt; trang kiểm chứng native IndexedDB dùng kho thử riêng version 3, đã xác nhận ghi nháp, hoàn thành nguyên tử, chống trùng, chống ghi đè tab cũ, đối chiếu revision, mở lại trang còn bản hoàn thành và bản thiếu thông tin. Kho thử được xóa sau kiểm chứng, không chạm ca thực. Kiểm tra UI thấy còn 2 ca chờ và 1 nháp hiện có; không sửa hoặc ghi thêm ca vào kho người dùng. Trình duyệt kiểm tra chưa cấp lưu bền vững.
