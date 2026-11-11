# Xuất PowerPoint và Excel sau tính toán

Mở http://127.0.0.1:4173/, chọn **Liên khoa & dữ liệu model**. Chọn ngày hoặc khoảng ngày, nguồn dữ liệu và cấu hình địa bàn. Sau khi phân tích thành công, dùng **Xuất Excel đầy đủ (.xlsx)** hoặc **Xuất PowerPoint (.pptx)** trong mục **Xuất kết quả đã tính**.

Hai nút sử dụng chung một snapshot kết quả đã tính, mã bộ báo cáo, SHA-256, kỳ và phiên bản quy tắc. Đổi nguồn, kỳ hoặc địa bàn sẽ tạo snapshot mới ở lần xuất tiếp theo. File được tạo ngay trên máy, không gửi tới API bên ngoài.

## Excel đầy đủ

| Sheet | Nội dung |
|---|---|
| Tong_quan | Thông tin bộ xuất, phạm vi, tổng tiền và cảnh báo cách đọc |
| Theo_luong | Bốn nhóm chỉ định/thực hiện và giá trị từng phần |
| Co_che_gia | Mua lẻ, phát sinh ngoài gói, trong gói; tiền thiếu |
| KPI | Sản lượng từng nhóm dịch vụ |
| Ty_le_va_dinh_nghia | Tử số, mẫu số, tỷ lệ và giới hạn diễn giải |
| Chi_dinh | Các dòng đủ điều kiện tạo tổng Vú chỉ định trong kỳ |
| Thuc_hien | Các dòng đủ điều kiện tạo tổng Vú thực hiện trong kỳ |
| Trong_goi | Các dòng trong gói đóng góp vào một trong hai góc nhìn |
| Doi_soat | Ngoại lệ toàn nguồn và cờ trong kỳ |
| Nguon_day_du | Toàn bộ dòng nguồn, phân loại, cờ đóng góp và cảnh báo |

Tổng hợp theo kỳ; dữ liệu nguồn và đối soát chứa cả dòng ngoài kỳ để truy nguyên. Mã có số 0 đầu giữ dạng văn bản; tiền giữ dạng số; ô thiếu giữ trống. Ô vượt giới hạn 32.767 ký tự bị chặn có thông báo, không cắt âm thầm. Sheet rỗng có dòng thông tin.

Đây là bản chụp số liệu đã tính: chỉnh ô nguồn trong Excel không tự cập nhật tổng. Muốn tính lại, nhập dữ liệu đã sửa vào ứng dụng và xuất bộ mới.

## PowerPoint

Slide tóm tắt tài chính, từng luồng, cơ chế giá, các nhóm KPI, chất lượng dữ liệu và thông tin đối chiếu Excel. Văn bản và bảng là đối tượng chỉnh sửa được. Ghi chú slide chứa mã bộ xuất, SHA-256 và phạm vi số liệu. Chi tiết từng dòng nằm trong Excel.

## Quy tắc tài chính

Doanh thu chỉ định tính theo ngày chỉ định; doanh thu thực hiện theo ngày hoàn thành và điều kiện nghiệp vụ hiện có. Hai góc nhìn có phần chồng lấp, **không cộng thành tổng doanh thu** và chưa phải tiền thực thu. Không tự điền tiền giảm giá/phân bổ gói bị thiếu. Giá trước giảm của dòng trong gói không phải khoản thu thêm.

## Vị trí phát triển và kiểm thử

- `src/features/intelligence/revenueExport.mjs`: snapshot, 10 sheet Excel và slide PowerPoint.
- `src/features/intelligence/RoutingWorkspace.jsx`: nút tải, khóa thao tác và tái sử dụng snapshot.
- `tests/revenueExport.test.mjs`: cô lập snapshot, tổng từng phần, kiểu dữ liệu Excel, cấu trúc PPTX và chặn ô quá dài.

Kiểm tra: `npm test` (68 test), `npm run audit` (182 đối chiếu trên dữ liệu mẫu), Python model (5 test). Sai số 0% quan sát trên bộ mẫu không chứng minh sai số dưới 0,05% với dữ liệu bệnh viện thực tế.
