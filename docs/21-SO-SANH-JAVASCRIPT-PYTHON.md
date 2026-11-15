# Cập nhật đợt 2 · Python vượt 15% · 15/11/2026

Chuyển phần xử lý thực tế sang Python: đọc Excel/CSV, chuẩn hóa/đối soát, xác nhận phân loại khi lưu/chốt, bóc tách khám/siêu âm/XQ/gói và doanh thu, kiểm tra chuyển trạng thái, snapshot, Excel theo mẫu DATA_KHOAVU và PowerPoint giao ban. Backend Node giữ HTTP/auth/SQLite; React giữ giao diện, bảng/biểu đồ và speech. Các phép xem/tổng hợp phía client và công cụ liên khoa khác vẫn còn JavaScript; chưa chuyển toàn bộ dashboard sang Python.

| Phạm vi đo | Python trước | Python sau |
|---|---:|---:|
| Tổng kho Python + JavaScript | 6,6661% | 16,6901% |
| Bỏ bản lưu prototype | 8,4701% | 22,4348% |
| Ứng dụng, bỏ tests/scripts/bản lưu | 2,8021% | 19,9982% |

JavaScript giảm từ 983.057 xuống 953.933 byte; Python tăng từ 70.212 lên 191.108 byte. Không thêm mã đệm hoặc sửa thuộc tính ngôn ngữ GitHub. Phép đo dùng UTF-8 chuẩn hóa LF, không tương đương tỷ lệ thời gian chạy hay GitHub Linguist. Baseline b4b1ec6; chi tiết docs/audit/python-phase2-language-share.json.

Kiểm chứng mới nhất: 236 kiểm thử Node và 34 kiểm thử Python đạt; build thành công, vẫn có cảnh báo bundle lớn. Golden fixture đối chiếu mô hình kết quả từ bản JavaScript cũ; kiểm tra XLS/XLSX thực, trùng file/dòng, phân quyền, revision cạnh tranh, báo cáo đã khóa, tiền/số lượng và nội dung Excel/PPTX. Dữ liệu kiểm thử tổng hợp, không sửa SQLite người dùng hoặc kho speech. Không suy ra sai số <0,05% so với chuẩn bệnh viện.

Cài thư viện bằng CAI-DAT-DU-LIEU-PYTHON.cmd. Dùng backend 4180 (CHAY-DASHBOARD-SPEECH.cmd), không dùng trang tĩnh thay backend. Các thao tác Python có đăng nhập/CSRF, giới hạn đầu vào/thời gian/số tiến trình; ghi dữ liệu vẫn phải qua workspace endpoint có quyền và revision. Không gọi API ngoài. Dashboard không thêm bảng so sánh.

---

> Cập nhật: đã bỏ bảng và nút so sánh khỏi dashboard theo yêu cầu. Nội dung bên dưới giữ làm lịch sử kiểm chứng; hướng dẫn thao tác giao diện cũ không còn áp dụng. Công cụ đối chiếu kỹ thuật vẫn có trong scripts/backend.

# So sánh chuyển đổi Python · đợt 1

Bản đối chiếu cũ: commit `6b6069ab0fa920606e477f34a3fcc79567b2059c`. Giữ nguyên giao diện và cách chọn dữ liệu. Chuyển riêng bộ tính giá × số lượng, giá lẻ/SKTQ/SLUT1/SLUT2, phân bổ và làm tròn tiền sang Python chuẩn, không thêm thư viện pip. JavaScript vẫn là bản chuẩn để đối chiếu.

## Xem trên dashboard

Chạy `CHAY-SO-SANH-PYTHON.cmd`, mở http://127.0.0.1:4190/ và dùng tài khoản hiện có. Bản thử dùng cùng SQLite của dashboard; thao tác So sánh chỉ đọc/tính, không sửa dữ liệu. Bộ chạy cũ 4180 được giữ, không bị dừng. Vào Chi tiết số liệu → Bóc tách khám/siêu âm/XQ → So sánh JavaScript / Python. Khi toàn bộ kết quả khớp, chọn Xem bằng Python hoặc Xem bằng JavaScript. Thay kỳ, dữ liệu hoặc cấu hình sẽ bỏ kết quả so sánh cũ.

Python chỉ nhận các cột dịch vụ cần tính trong bộ nhớ; bỏ tên/định danh người bệnh, số điện thoại, tên file và nhãn học. Có đăng nhập/CSRF, giới hạn dòng/dung lượng, timeout và giới hạn hai tiến trình đồng thời. Không ghi âm thanh hoặc ca ra thư mục.

**Giới hạn đợt 1:** lựa chọn Python chỉ thay bảng doanh thu đang xem. Phân loại khoa, chốt snapshot và xuất báo cáo vẫn dùng JavaScript; chưa chuyển backend hay toàn bộ hệ thống sang Python. Thiếu Python hoặc có kết quả khác nhau sẽ báo lỗi và giữ JavaScript.

## Kết quả đo trên máy hiện tại

Dữ liệu tổng hợp cố định, lặp từ service-demo; mỗi cỡ 3 lần, bảng lấy trung vị. So cả dòng/nhóm/số lượng/giá/doanh thu, không chỉ tổng cuối. Không suy ra sai số so với chuẩn bệnh viện.

| Số dòng | JS tính (ms) | Python tính (ms) | Python gồm mở tiến trình + JSON (ms) | Đối chiếu |
|---:|---:|---:|---:|---|
| 170 | 1.07 | 1.38 | 87.20 | Khớp toàn bộ |
| 1000 | 3.12 | 8.98 | 127.10 | Khớp toàn bộ |
| 10000 | 21.37 | 100.90 | 243.76 | Khớp toàn bộ |
| 100000 | 165.11 | 814.51 | 1208.18 | Khớp toàn bộ |

Python không mặc nhiên nhanh hơn. Bản đợt 1 khởi động tiến trình riêng mỗi lần so sánh nên thêm chi phí; chưa dùng worker dài hạn. Giao tiếp/hiển thị qua HTTP còn thêm độ trễ ngoài bảng đo này.

## Tỷ lệ mã nguồn thực đo

Tính dung lượng UTF-8 của .js/.jsx/.mjs và .py, chuẩn hóa LF; gồm cả test/tool và bản lưu lịch sử. Đây không phải số GitHub Linguist.

| Phiên bản | JavaScript (byte) | Python (byte) | Python trong hai nhóm |
|---|---:|---:|---:|
| Trước | 961031 | 63528 | 6.20% |
| Sau đợt 1 | 983057 | 70212 | 6.67% |

**Chưa đạt xấp xỉ 50/50.** Không thêm mã rỗng, nhân bản Python hoặc ép Linguist để đổi tỷ lệ. Muốn tăng vai trò Python thật cần các đợt tiếp theo: chuyển phân loại khoa/đối soát; chuyển đọc Excel/CSV; sau khi kiểm chứng mới chuyển snapshot và xuất báo cáo. Giữ frontend React cho bảng, lịch, biểu đồ và micro.

Tái chạy: `node scripts/compare-python-revenue.mjs`. Cần Python trên PATH, môi trường speech đã cài hoặc biến VINMEC_PYTHON trỏ tới Python. Dữ liệu chi tiết đo ở docs/audit/python-migration-comparison.json. Không huấn luyện hoặc đổi model speech trong đợt này.
