# 02 · Các chức năng và vị trí sửa code

| Phần | File chính | Nội dung |
|---|---|---|
| Khung ứng dụng | src/main.jsx | Menu, chuyển trang, báo cáo, nhập dữ liệu, đối soát, duyệt mô phỏng |
| Chọn ngày | src/components/DateControls.jsx | Ngày trước/sau, lịch thông thường và khoảng ngày |
| Tiếp đón và phòng | src/features/patients/PatientWorkspace.jsx | Biểu mẫu tiếp đón, sửa hành chính, hàng đợi, chỉ định, kết quả, hồ sơ |
| Nghiệp vụ chuyển phòng | src/features/patients/patientFlow.mjs | Danh sách phòng, bác sĩ mẫu, tiếp nhận, phân phòng, chỉ định, trả kết quả, đóng lượt |
| Tài khoản / quyền mẫu | src/features/access/roomAccess.mjs | 14 tài khoản; lọc lượt, nội dung, file; kiểm tra phòng được thao tác |
| File | src/features/attachments/attachmentStore.mjs | PDF/PNG/JPEG tối đa 5 MB/file; kiểm tra chữ ký file cơ bản; lưu Blob trong IndexedDB |
| Báo cáo | src/features/reports/core.mjs | Kiểm tra dữ liệu, trùng chỉ định, tính số lượng và giá trị theo ngày |
| Dữ liệu mẫu | src/data/seed.json | Danh mục, 2.700 chỉ định và số liệu tham chiếu |
| Giao diện | src/styles/global.css và patientFlow.css | Màu sắc, bố cục, kích thước màn hình |
| Kiểm thử | tests/*.test.mjs | 52 kiểm thử; chạy npm test |

## Nguyên tắc khi chỉnh sửa

1. Thay quy tắc nghiệp vụ tại `patientFlow.mjs` trước, sau đó cập nhật giao diện và kiểm thử liên quan.
2. Thay phạm vi tài khoản tại `roomAccess.mjs`; đây vẫn là mô phỏng phía trình duyệt.
3. Không thêm chuyển phòng chỉ vì có kết quả bất thường; bác sĩ phải tạo chỉ định rõ nơi nhận.
4. Giữ mã bệnh nhân, mã lượt, mã phiếu khi bàn giao để tránh hồ sơ trùng.
5. Sau khi sửa, chạy `npm test`, `npm run audit`, `npm run build` và thử màn hình liên quan.

Các màn hình báo cáo vẫn nằm trong `main.jsx` để giữ nguyên chức năng prototype; phần bệnh nhân, phân quyền mẫu và file được tách thành các mô-đun riêng.

## Mô-đun kiểm tra bổ sung

| Mô-đun | Trách nhiệm |
|---|---|
| src/shared/dataRules.mjs | Ngày thực, múi giờ Việt Nam, mã dạng chuỗi, phép tính VND chính xác |
| src/features/patients/flowIntegrity.mjs | Kiểm tra toàn bộ liên kết khách/lượt/phiếu/chỉ định/file; nâng cấu trúc cũ |
| src/features/patients/flowStore.mjs | Web Locks và revision chống ghi đè hồ sơ giữa các tab cùng origin |
| src/features/reports/reportStore.mjs | Khóa ghi, kiểm tra cấu trúc và revision báo cáo |
| src/features/reports/importRows.mjs | Giữ tổng tiền nguồn để đối chiếu; không biến thiếu thành 0 |
| scripts/audit.mjs | Xuất bảng 182 phép so sánh và kiểm tra ngưỡng <0,05% |
