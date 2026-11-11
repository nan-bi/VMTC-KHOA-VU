# 04 · Tài khoản và kịch bản demo

Không cần tên đăng nhập/mật khẩu. Vào **Tiếp đón & phòng khám**, chọn **Tài khoản phòng demo**.

| Tài khoản mẫu | Công việc |
|---|---|
| Lễ tân / tiếp đón | Tạo/tìm bệnh nhân, sửa thông tin hành chính mẫu, đính kèm giấy tiếp nhận |
| Đánh giá ban đầu | Nhận mọi lượt mới, nhập đánh giá, chọn 1 trong 4 phòng khám |
| Bác sĩ phòng khám 1–4 | Nhận lượt thuộc phòng, nhập ghi nhận, ra chỉ định, đọc kết quả, kết thúc lượt |
| Siêu âm 3D, siêu âm thường 1/2 | Nhận phiếu gửi đúng phòng, nhập hoặc đính kèm kết quả |
| XQ vú | Nhận phiếu XQ, nhập hoặc đính kèm kết quả |
| Tư vấn can thiệp | Nhận phiếu tư vấn và trả nội dung cho bác sĩ |
| Can thiệp | Thực hiện theo phiếu riêng, xác nhận bàn giao theo yêu cầu theo dõi |
| Hồi tỉnh | Nhận bàn giao được yêu cầu, ghi theo dõi và bàn giao về phòng khám |
| Điều phối · chỉ xem | Theo dõi toàn khoa; không sửa chuyên môn; có nút nạp lại dữ liệu mẫu |

## Demo nhanh kết quả và file

1. Chọn ngày **23/10/2026**. Dữ liệu khởi tạo có 3 bệnh nhân mẫu.
2. Đổi sang **Siêu âm vú thường 1**, nhận bệnh nhân mẫu 03 và chọn **Ghi kết quả**.
3. Nhập kết quả giả lập hoặc đính kèm `tests/fixtures/ket-qua-mau.png`. Đây là ảnh 1 pixel để kiểm tra chức năng file, không phải ảnh y khoa.
4. Bấm **Xác nhận & bàn giao**. Chọn file trước đó chưa tự chuyển phiếu.
5. Đổi sang **Bác sĩ · Phòng khám 1**, mở **Bệnh nhân & lượt khám**, mở hồ sơ để xem/tải file vừa gửi. Chỉ định XQ còn chờ riêng.
6. Đổi sang **XQ vú** để xác nhận phòng này thấy phiếu XQ của mình, không thấy file kết quả siêu âm.
7. XQ hoàn tất kết quả thì bác sĩ phòng khám 1 có phiếu đọc kết quả khi đủ kết quả cùng đợt.

## Demo tiếp nhận mới

Lễ tân tạo lượt → Đánh giá ban đầu tiếp nhận và phân phòng → đổi đúng bác sĩ phòng khám → tiếp nhận khám → nhập ghi nhận và chọn chỉ định → đổi đúng phòng thực hiện → tiếp nhận và ghi kết quả → bác sĩ nhận lại.

## Báo cáo

Vào **Nhập dữ liệu** để tải mẫu Excel và nhập CANONICAL/CSV đúng cột. **Đối soát** xử lý ngoại lệ trước khi chốt. **Báo cáo giao ban** tạo nhận xét theo mẫu, gửi duyệt; đổi vai trò báo cáo ở thanh trên để duyệt mô phỏng rồi xuất Excel hoặc in/lưu PDF. Vai trò báo cáo tách riêng với tài khoản phòng.
