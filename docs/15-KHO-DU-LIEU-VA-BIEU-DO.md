# Kho dữ liệu cố định và biểu đồ — v8

## Bắt đầu

Chạy `CHAY-DEMO.cmd` trong thư mục v8, mở http://127.0.0.1:4173/ và chọn **Kho dữ liệu & biểu đồ**. Ứng dụng mở mặc định ở Tổng quan; Kho dữ liệu & biểu đồ nằm sau Chi tiết số liệu trong menu.

Ứng dụng dùng dữ liệu đã có trong v8: 7 nguồn CSV giả lập, 2.700 dòng, danh mục 87 dịch vụ. Nếu đã nhập thêm dữ liệu trên cùng trình duyệt và địa chỉ local, các dòng đã lưu cũng xuất hiện. Không cần tải lại file mỗi lần mở.

## Xem từng bảng và cột

- Chọn thẻ file/sheet nguồn hoặc **Tất cả nguồn**.
- Tìm theo mã khách, chỉ định, dịch vụ, bác sĩ hoặc nội dung ô; lọc nhóm và trạng thái.
- Lịch phía trên chọn ngày, ngày trước/sau hoặc khoảng ngày, gồm ngày kết thúc. Chọn mốc **Theo ngày hoàn thành**, **Theo ngày chỉ định** hoặc **Toàn bộ ngày trong nguồn**. Lựa chọn toàn bộ ngày chỉ áp dụng cho kho; báo cáo vẫn theo lịch kỳ ở phía trên.
- Dùng **Các cột hiển thị** để chọn cột; bấm tiêu đề cột để sắp xếp, cuộn ngang và chọn số dòng mỗi trang.
- **Xuất bảng đang xem** tạo Excel gồm các cột đang chọn và toàn bộ dòng theo bộ lọc, kể cả ngoài trang hiện tại. Khi đang xem chi tiết từ biểu đồ, chỉ các dòng chi tiết đó được xuất. Thứ tự xuất theo dữ liệu nguồn, không theo sắp xếp tạm trên màn hình.

## Chỉnh dữ liệu

1. Vai trò **Nhập / đối soát** → **Mở dòng**.
2. Sửa trong các mục **Dịch vụ & thời gian**, **Tài chính**, **Khoa/phòng & bác sĩ**.
3. Nhập lý do ít nhất 8 ký tự, kiểm tra thành tiền xem trước và bấm **Lưu thay đổi**.
4. Kiểm tra tab **Lịch sử sửa**: người sửa theo vai trò demo, thời gian, lý do và từng giá trị trước → sau. Lịch sử không bị giới hạn bởi kỳ ngày.

Các mã bệnh nhân, lượt khám, chỉ định và thông tin file nguồn không sửa trực tiếp để giữ liên kết. Đổi mã dịch vụ lấy lại tên và nhóm từ danh mục. Giá/số lượng/giảm giá/phân bổ gói thay đổi sẽ tính lại các trường tiền liên quan. Không biết giảm giá thì giá trị sau giảm vẫn để trống; gói dùng phân bổ rõ ràng, không suy diễn. Hủy dịch vụ loại số lượng và giá trị hoàn thành. Dòng không hợp lệ hoặc tạo xung đột sẽ bị từ chối lưu; phiên khác đã sửa nguồn thì cần mở lại dòng.

## Biểu đồ và báo cáo

**Biểu đồ & phân tích** có số lượng, giá trị trước giảm và sau giảm đã biết, phân theo ngày hoàn thành, nhóm dịch vụ và bác sĩ lâm sàng/chỉ định. Bấm cột hoặc thanh để xem và xuất các dòng cấu thành. Các dòng lỗi, trùng, bị loại, chưa hoàn thành hoặc ngoài snapshot không được cộng. Chi tiết chỉ tiêu sau giảm loại dòng chưa biết giá trị; tổng này không phải tiền thực thu.

Kho và báo cáo dùng cùng nguồn đã lưu, nhưng bộ lọc kho là riêng. Để đối chiếu tổng, chọn cùng kỳ ngày, ngày hoàn thành và cùng phạm vi dịch vụ. Nút **Đối soát & tạo báo cáo** chuyển tới quy trình đối soát. Xuất Excel theo mẫu DATA_KHOAVU và PowerPoint tại **Báo cáo giao ban** theo quy trình hiện có.

Báo cáo đã tạo khóa sửa nguồn. Bỏ bản nháp hoặc mở kỳ làm việc mới bằng chức năng hiện có; snapshot báo cáo đã duyệt giữ nguyên.

## Phạm vi lưu trữ

Dữ liệu và lịch sử sửa được lưu trong localStorage trên trình duyệt, theo địa chỉ local. Không tự ghi đè file Excel/CSV gốc trên đĩa. Trình duyệt khác, cổng khác hoặc máy khác có kho riêng. Xóa dữ liệu trình duyệt sẽ mất thay đổi chưa xuất; nên xuất bảng sau khi chỉnh sửa. Excel xuất bảng không phải bản sao lưu đầy đủ lịch sử và snapshot.

Phân quyền hiện là mô phỏng của prototype local, chưa phải xác thực nhiều người dùng cho vận hành bệnh viện. Chưa có đồng bộ thư mục, cơ sở dữ liệu máy chủ hay gọi AI bên ngoài.

## Kiểm tra

`npm test`, `npm run audit`, `npm run build`. Các kiểm tra bao gồm khóa phiên, quyền, snapshot, dữ liệu lỗi, bảo toàn nguồn/mã, giá gói, hủy, lọc ngày và tính thống nhất giữa nguồn lưu, báo cáo, biểu đồ và các dòng cấu thành. Mức sai số dưới 0,05% chỉ được đánh giá trên bộ chuẩn giả lập; chưa có xác nhận độ chính xác với dữ liệu bệnh viện thực tế.
