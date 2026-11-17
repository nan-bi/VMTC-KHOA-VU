# Video demo Dashboard Khoa Vú

Mở `DEMO_DASHBOARD_KHOA_VU.mp4` để xem video khoảng 3 phút 51 giây, Full HD, lời đọc tổng hợp tiếng Việt và phụ đề gắn trong hình. `phu-de.srt` là phụ đề rời; `kich-ban.md` có lời đọc và mốc từng phần.

Video gồm 12 phần: tổng quan; nhập file/thư mục; xem trước; chọn kỳ; đối soát và phân loại; bóc tách gói; doanh thu/biểu đồ/dòng nguồn; chỉnh dữ liệu và quy tắc; chốt; duyệt và xuất; giao diện đọc siêu âm; kết quả và giới hạn.

Nguồn hình là các cảnh thao tác thực tế trên bản chạy local riêng, được biên tập và dừng hình theo lời đọc. Bộ dữ liệu kiểm thử gồm 170 dòng. Ngày minh họa 25/10/2026 có 17 đơn vị dịch vụ, 7.400.000 đồng sau giảm đã biết. Các số này không phải doanh thu thực tế hoặc bảng giá chính thức. File `BAO_CAO_DA_XUAT.xlsx` được xuất từ luồng đã duyệt; video hiển thị cả nút xuất PowerPoint.

Phần speech chỉ giới thiệu giao diện và quy trình; không thu micro, không tạo ca khám và không kiểm chứng độ chính xác nhận dạng trong video. Cơ sở dữ liệu vận hành, tài khoản và các ca/bản nháp speech sẵn có không bị sửa. Máy chủ demo dùng bộ nhớ riêng, đã dừng sau quay.

Thuyết minh: Piper, giọng `vi_VN-vais1000-medium`, tạo trên máy. Không gửi dữ liệu lên dịch vụ AI bên ngoài. Các script `scripts/demo-video-voice.py`, `demo-video-compose.py`, `demo-video-verify.py` và `demo-video-server.mjs` lưu cùng dự án để có thể sửa hoặc dựng lại. Không kèm thông tin đăng nhập trong tài liệu.

`kiem-tra-video.json` ghi kiểm tra thời lượng, codec và giải mã toàn video; `kiem-tra-video.jpg` là các khung trích từ MP4 sau dựng. Kiểm tra này xác minh tệp video, không xác nhận nghiệp vụ lâm sàng hoặc sai số doanh thu dưới 0,05%.
