# 05 · Dữ liệu, file và giới hạn

## Lưu trữ hiện tại

| Kho | Dữ liệu |
|---|---|
| localStorage: vinmec-patient-flow-v1 | Bệnh nhân mẫu, lượt khám, phiếu, chỉ định, nhật ký và metadata file |
| localStorage: vinmec-demo-v1 | Dữ liệu báo cáo, lịch sử nhập, snapshot và trạng thái duyệt mẫu |
| IndexedDB: vinmec-demo-files | Nội dung file đính kèm dưới dạng Blob |
| src/data/seed.json | Dữ liệu giả lập đóng gói sẵn trong code |

Code và bản build không chứa dữ liệu bạn đã nhập trên trình duyệt hoặc file bạn đã chọn. ZIP này không phải bản sao lưu dữ liệu trình duyệt. Không có chức năng sao lưu/khôi phục đầy đủ nội dung IndexedDB trong phiên bản này; Excel xuất chỉ là dữ liệu báo cáo tổng hợp.

Xóa dữ liệu trang web hoặc hồ sơ trình duyệt có thể làm mất dữ liệu và file. Khôi phục dữ liệu mẫu chỉ đặt lại phần tương ứng, không phải công cụ xóa toàn bộ file đã lưu. Muốn làm sạch hoàn toàn môi trường thử nghiệm, dùng chức năng xóa dữ liệu trang web của trình duyệt cho đúng địa chỉ local.

## Liên thông và bảo mật

Các tài khoản mẫu chia màn hình và kiểm tra thao tác trong JavaScript. Người dùng máy vẫn có thể xem/sửa dữ liệu bằng công cụ trình duyệt. Chưa có xác thực, phân quyền phía máy chủ, đồng bộ giữa nhiều máy, chữ ký chuyên môn hoặc nhật ký chống sửa. Không dùng dữ liệu bệnh nhân thật.

Máy chủ đi kèm chỉ phục vụ bản build qua loopback `127.0.0.1`; không có API nghiệp vụ hay cơ sở dữ liệu máy chủ. Nếu cần nhiều nhân viên thao tác từ nhiều máy, cần xây tiếp backend dùng chung.

## Các phần cần bổ sung cho bản vận hành

1. Đăng nhập từng nhân viên và gán khoa/phòng theo tài khoản.
2. API kiểm tra quyền mỗi lần đọc/sửa hồ sơ, nhận phiếu, tải file và bàn giao.
3. Cơ sở dữ liệu chung có giao dịch, kiểm soát cập nhật đồng thời và sao lưu.
4. Kho file riêng có kiểm tra nội dung, giới hạn quyền truy cập và chính sách lưu giữ.
5. Nhật ký bất biến, quản lý sửa kết quả và xác nhận chuyên môn.
6. Xác nhận quy trình thực tế của khoa và kết nối HIS/EMR/PACS khi có yêu cầu.

Quy tắc tất cả bệnh nhân qua Đánh giá ban đầu đã được xác nhận cho prototype. Luồng tư vấn trước can thiệp và các điều kiện bàn giao còn cần khoa rà soát trước khi dùng thật; phần mềm không tự suy luận chỉ định điều trị.

## Kiểm soát cập nhật và hợp đồng dữ liệu

Chrome/Edge mới trên localhost sử dụng Web Locks để tuần tự hóa ghi trong cùng origin, kết hợp revision để chặn biểu mẫu cũ ghi đè thay đổi mới. Cổng 4173 và 5173 là hai origin khác nhau, dữ liệu không dùng chung. Đây chưa phải giao dịch nhiều máy. Dữ liệu hỏng bị chặn; không tự ghi đè bằng seed. Hồ sơ dùng schemaRevision 2, giữ khóa lưu trữ v1 để nâng cấu trúc cũ. Nâng cấu trúc không xác nhận lại tính đúng thực tế hoặc thời điểm bàn giao của hồ sơ cũ.

Mã định danh phải là chuỗi để giữ số 0 đầu. Ngày chỉ nhận YYYY-MM-DD hoặc timestamp có múi giờ; tổng hợp theo Asia/Ho_Chi_Minh. Excel serial được hiểu là giờ địa phương Việt Nam (+07:00), không phải UTC. Nếu nguồn dùng UTC phải chuyển rõ trước khi nhập. Số lượng tối đa 6 số lẻ, tiền VND là số nguyên an toàn; tính bằng BigInt và làm tròn nửa lên tại tổng trước giảm của dòng. Trường thiếu không tự đổi thành 0. Sản lượng hoàn thành, cờ chốt, cờ giảm giá và chế độ giá phải có trong file nhập.

File mới có SHA-256 và kiểm tra khi tải. File cũ thiếu hash chưa được xác thực lại nội dung. IndexedDB và localStorage không nằm trong một giao dịch nguyên tử: sự cố giữa hai lần lưu có thể để lại blob mồ côi. Quota/lỗi lưu không được báo thành công; không đủ cơ sở coi đây là kho hồ sơ vận hành.

Luồng khám và báo cáo tài chính là hai bộ dữ liệu riêng. Hoàn thành khám không tự tạo doanh thu vì chưa có bảng ánh xạ dịch vụ/giá được duyệt. Không suy ra giá hoặc dịch vụ tính phí từ nội dung chuyên môn.
