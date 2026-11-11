# Nhập file từ máy tính · bản vá v8

## Báo cáo: chọn → xem trước → nhập → đối soát

1. Mở `http://127.0.0.1:4173/`, chọn **Nhập dữ liệu**. Vai trò cần là **Nhập / đối soát**.
2. Bấm **Chọn file từ máy tính** để mở hộp chọn file Windows; có thể chọn nhiều file hoặc kéo thả. Chọn tối đa 10 file Excel/CSV, mỗi file tối đa 10 MB, tổng tối đa 20.000 dòng/lượt và 10.000 dòng/file.
3. Xem danh sách tên/kích thước file. Có thể bỏ từng file hoặc bỏ chọn tất cả. Thay đổi danh sách sẽ bỏ kết quả xem trước cũ.
4. Bấm **Kiểm tra & xem trước**. Ứng dụng kiểm tra toàn bộ lượt chọn, nhận diện cột, giữ tên file/sheet/dòng vật lý/SHA-256 và báo trùng hoặc lỗi. Chọn file và xem trước chưa lưu dữ liệu báo cáo.
5. Bấm **Xác nhận nhập vào dữ liệu báo cáo**. Các dòng mới được thêm vào nguồn hiện tại, không thay dữ liệu cũ hoặc tự gộp bệnh nhân. Dòng trùng giống hệt không cộng; cùng mã khác nội dung cách ly toàn nhóm. Dòng lỗi được giữ để đối soát và không tính vào tổng hợp hợp lệ.
6. Ứng dụng chuyển tới **Đối soát dữ liệu**. Xử lý lỗi trước khi chốt, gửi duyệt và xuất Excel theo mẫu DATA_KHOAVU.

Lưu ý phạm vi: nguồn khởi tạo là 2.700 dòng giả lập. Trang xem trước luôn nêu rõ nhập thêm vào bao nhiêu dòng hiện tại. Không coi kết quả có trộn dữ liệu mẫu là báo cáo thực tế.

## Cấu trúc file

Đọc sheet `CANONICAL` nếu có, nếu không đọc sheet đầu. Không tự đoán hoặc gộp các sheet khác. Dùng **Tải file mẫu Excel** để có cấu trúc đầy đủ. Tên cột chuẩn và các tên tiếng Việt được hỗ trợ nằm trong `src/features/intelligence/importSchema.mjs`.

File báo cáo kết quả có tiêu đề gộp như DATA_KHOAVU là đầu ra tổng hợp; không thay thế file đầu vào dạng mỗi dòng một chỉ định. File thiếu cột, tiêu đề trùng hoặc dữ liệu ở cột chưa có tên sẽ báo lỗi và không nhập một phần lượt chọn.

## Hai điểm chọn file khác

- **Liên khoa & dữ liệu model**: cùng bộ chọn file. Bấm **Kiểm tra & phân tích các file** để áp dụng. Nếu đọc lỗi, dữ liệu phân tích trước đó giữ nguyên. Nguồn phân tích ở đây chỉ giữ trong phiên màn hình; không tự nhập vào báo cáo hoặc hàng đợi phòng. Bấm **Dùng dữ liệu báo cáo hiện tại** để quay về nguồn báo cáo.
- **Tiếp đón & phòng khám**: trong form tiếp nhận/cập nhật/kết quả, bấm **Chọn file hồ sơ từ máy tính**. Nhận PDF/PNG/JPEG, tối đa 5 file, mỗi file 5 MB. File chỉ bàn giao cùng hồ sơ sau khi xác nhận lưu theo đúng tài khoản/phòng/chỉ định.

## Báo cáo đã duyệt

Nguồn đang có snapshot sẽ khóa nhập. Với bản nháp có thể bỏ nháp; với bản đã duyệt, dùng **Mở kỳ làm việc mới**. Bản đã duyệt được giữ ở **Lịch sử thao tác**, có nút xuất lại Excel từ snapshot cũ. Không tự sửa số liệu đã duyệt khi nhập file mới.

## Kiểm chứng và giới hạn

Bản vá v8: 109 kiểm thử JavaScript đạt, audit 182 giá trị trên dữ liệu giả lập đạt; đã kiểm tra chọn file qua hộp Windows, xem trước, nhập trùng, phân tích liên khoa và xuất file trên local. Không chứng minh sai số thực tế dưới 0,05% trên nguồn bệnh viện.

Đây vẫn là prototype local: quyền mô phỏng trên trình duyệt, chưa đăng nhập/phân quyền máy chủ, chưa đồng bộ nhiều máy và chưa gọi AI. Không có thao tác tự gửi file ra dịch vụ ngoài.

