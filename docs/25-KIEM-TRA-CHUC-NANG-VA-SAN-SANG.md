# Kiểm tra chức năng và mức sẵn sàng

Ngày kiểm tra: 15–16/11/2026 (Asia/Saigon).

## Kết luận
Các luồng chính của dashboard đã thực hiện được đầu cuối trên môi trường local tách biệt. Có thể tự kiểm thử và dùng hỗ trợ báo cáo với người kiểm tra số liệu; chưa đủ bằng chứng nghiệm thu thành hệ thống bệnh viện hoàn chỉnh hoặc cam kết sai số dưới 0,05% trên dữ liệu thực tế.

## Phương pháp và phạm vi
- Dùng backend SQLite trong bộ nhớ và hostname localhost:4192, tách khỏi kho vận hành và origin speech 127.0.0.1:4173. 170 dòng kiểm thử tổng hợp, 87 dịch vụ; không ghi đè dữ liệu bệnh nhân/tài khoản/model vận hành.
- Thao tác thực tế trên trình duyệt, tải file xuất và đọc lại bằng openpyxl/python-pptx. Bộ kiểm thử tự động kiểm tra thêm quyền backend, lưu SQLite, khóa phiên bản, snapshot và các trường hợp dữ liệu lỗi.
- Speech được kiểm thử lưu/khôi phục trên origin riêng. Luồng nhận dạng streaming thử bằng audio tổng hợp qua dịch vụ local; không dùng micro và không sửa ca thực tế.

## Kết quả từng nhóm
| Nhóm | Kiểm chứng | Kết quả |
| --- | --- | --- |
| Truy cập | Đăng nhập admin/chỉ xem; đăng xuất sau bản vá | Đạt |
| Nhập file | Chọn Excel, xem trước, xác nhận nhập 85 dòng, tải lại | Dữ liệu và lịch sử còn |
| Nhập thư mục | Chọn hai file tổng 170 dòng, phát hiện file đã nhập | Chỉ thêm 85 dòng mới; tổng 170 |
| Chi tiết/kho | Sửa trường bác sĩ với lý do, xem trước/sau trong lịch sử | Đạt |
| Lịch/biểu đồ | Chọn khoảng 19–25/10; bấm biểu đồ ngày mở nguồn | Đạt |
| Giá và doanh thu | Sửa giá khám lẻ 450.000 thành 460.000 | 20 lượt tăng 200.000; giá × lượng từ 57.000.000 thành 57.200.000 VND |
| Phạm vi Khoa Vú | 140 dòng Vú chỉ định; 30 dòng SKTQ chuyển đến | Phạm vi chỉ định giữ 140 dòng, kể cả ngoài khoa thực hiện |
| Báo cáo | Chốt nháp, tạo nhận xét mẫu, gửi duyệt, admin duyệt | Đạt sau bản vá |
| Kỳ mới | Mở kỳ mới sau duyệt; lịch sử giữ báo cáo cũ | Đạt sau bản vá |
| Xuất Excel cuối | Tải và đọc lại workbook | 5 sheet; 140 dòng nguồn + tiêu đề; có giá trị 57.200.000 |
| Xuất chi tiết | Tải workbook cho ngày 25/10 | 5 sheet; 17 dòng nguồn + tiêu đề, đúng phạm vi ngày |
| Xuất PowerPoint | Tải và đọc lại gói pptx | 8 slide; có thông tin phạm vi |
| Phân quyền | Chỉ xem mở được số liệu, nút nhập file/thư mục bị khóa | Đạt trên UI; các vai trò khác có kiểm thử backend |
| Speech lưu ca | Tự lưu nháp → reload → khôi phục → hoàn tất → xác nhận → reload/tìm lại | Giữ được 1 ca kiểm thử đã xác nhận |
| Speech streaming | Audio tổng hợp, dịch vụ model local | 21 cập nhật, interim đầu 2.573 ms; kiểm tra phủ đủ mẫu audio |

Giá trị nguồn trước giảm 82.000.000 và sau giảm đã biết 57.000.000 VND khác doanh thu theo bảng giá mới 57.200.000 VND. Đây là hai cơ sở tính khác nhau, không tự sửa giá trị nguồn theo bảng giá mới. Chưa coi các giá trị này là tiền thực thu.

## Các lỗi đã sửa
1. Admin được backend cho phép duyệt nhưng giao diện không hiện nút sau khi bỏ bộ chọn vai trò. Bổ sung nhận diện quyền admin cho thao tác duyệt.
2. Popconfirm mở ngoài vùng nhìn thấy, chặn mở kỳ mới. Thay xác nhận mở kỳ/bỏ nháp bằng Modal; đã hoàn thành mở kỳ mới qua UI. Bỏ nháp dùng cùng cơ chế nhưng chưa thao tác riêng trong lượt này.
3. Menu tài khoản cũng bị định vị ngoài vùng nhìn thấy. Dùng menu neo trực tiếp vào nút tròn KV; giữ hover/click, đóng khi click ngoài/Escape/ra khỏi vùng focus. Đã đăng xuất, đăng nhập lại và mở menu kiểm chứng.
4. Gợi ý quyền nhập còn bảo chuyển vai trò dù không còn bộ chọn; sửa theo quyền tài khoản và thông báo riêng khi đang xử lý.

Mã sửa: src/main.jsx, src/components/AccountMenu.jsx, src/styles/global.css, src/features/reports/ReportImportPanel.jsx.

## Kiểm thử và bằng chứng
- Node: 240 đạt, 0 lỗi. Python: 34 pipeline + 5 audit đầu vào đạt.
- Production build đạt; còn cảnh báo bundle lớn hơn 500 kB, ảnh hưởng tối ưu tải chứ không chặn build.
- Log trong .speech-cache: functional-audit-node-final.tap, functional-audit-python.log, functional-audit-build.log, functional-audit-speech-api.log, functional-audit-stream.log, functional-audit-exports.json.
- File kiểm chứng xuất: functional-final.xlsx, functional-detail.xlsx, functional-final.pptx trong .speech-cache; chỉ chứa dữ liệu kiểm thử.
- Ảnh local: docs/functional-approved.jpg. Không đưa ảnh tài khoản lên Git.

## Những giới hạn còn lại
- Chưa kiểm chứng độ chính xác <0,05% bằng tập dữ liệu thật được khoa xác nhận độc lập; kết quả trên fixture không thay thế nghiệm thu nghiệp vụ.
- AI local hỗ trợ phân loại dựa quy tắc và mẫu đã xác nhận; dữ liệu lạ/thiếu cần đối soát. Tính tiền thực hiện bằng quy tắc số học, không giao mô hình ngôn ngữ đoán giá.
- Cần thống nhất chính sách giá/gói/SKTQ, ngày hiệu lực, nguồn giảm giá/hoàn tiền và dữ liệu chuẩn trước khi chốt báo cáo chính thức.
- Chưa thử đọc micro vật lý trong lượt này và chưa đo độ chính xác thuật ngữ y khoa trên ca thật.
- Speech lưu IndexedDB theo origin/trình duyệt; không tự đồng bộ nhiều máy. Tên người xác nhận nhập trong speech không phải chữ ký điện tử xác thực. Trang speech riêng chưa dùng chung kiểm soát đăng nhập dashboard.
- Chưa kết nối HIS hoặc triển khai quy trình khám/chuyển phòng như một HIS; bản hiện tại tập trung số liệu, đối soát, báo cáo và ghi kết quả siêu âm.
- Chưa kiểm thử tải nhiều người dùng/dữ liệu rất lớn, khôi phục thảm họa hoặc nghiệm thu an toàn thông tin bệnh viện. Giới hạn upload hiển thị 100 MB/file, 100 file/lần, tổng 500 MB; chưa đo hiệu năng ở mức tối đa.

## Cách mở
Chạy CHAY-DASHBOARD-SPEECH.cmd trong thư mục v8 rồi mở http://127.0.0.1:4180/. Trang tĩnh 4173 không thay thế backend nội bộ. Khi tải lại giao diện, dừng ghi âm và đợi lưu trước.
