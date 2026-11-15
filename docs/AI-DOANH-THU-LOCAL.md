# AI local và doanh thu theo Khoa Vú chỉ định

Phạm vi được người dùng chốt ngày 15/11/2026: chỉ tính dịch vụ Khoa Vú chỉ định, kể cả khoa khác thực hiện. Không cộng dịch vụ khoa khác chỉ định dù làm tại Vú. Ghi nhận tiền khi dịch vụ hoàn thành, theo số lượng thực hiện và ngày hoàn thành, không tính ca hủy/chưa hoàn thành. Đây là giá trị dịch vụ theo nguồn hoặc đơn giá cấu hình, chưa phải tiền thực thu/chuẩn quyết toán của bệnh viện.

## Cách dùng

1. Mở Nhập dữ liệu → Chọn cả thư mục Excel. Bao gồm thư mục con; chỉ nhận `.xlsx`, `.xls`, `.csv`, bỏ file tạm Excel `~$`. Giới hạn 100 file, 100 MB/file, 500 MB/lần và tối đa 100.000 dòng trong kho; tác vụ Python có giới hạn JSON 256 MB và có thể từ chối sớm nếu dữ liệu giải mã quá lớn. Chia lô khi vượt giới hạn.
2. Chọn Kiểm tra & xem trước. Chế độ thư mục đọc tất cả sheet, tìm tiêu đề trong 30 dòng đầu. Sheet thiếu cấu trúc, file hỏng hoặc bảng tổng hợp chưa ánh xạ được liệt kê với lý do; không tự biến tổng tiền thành bản ghi dịch vụ. File lẻ tối đa 10 file dùng CANONICAL hoặc sheet đầu theo chế độ tương thích cũ; chọn nhiều hơn 10 file dùng chế độ quét toàn bộ sheet.
3. Xem số dòng thuộc Khoa Vú chỉ định / ngoài phạm vi / chưa rõ. Xác nhận nhập để lưu nguồn. Nhãn ban đầu là phân loại khoa, không phải bằng chứng mọi dòng đã đạt kiểm tra số lượng/giá.
4. Trong AI local, đối chiếu cặp khoa chưa rõ với danh mục nguồn, chọn nhãn, nhập căn cứ tối thiểu 8 ký tự, Lưu nhãn & huấn luyện lại. Cặp mới không có xác nhận không được cộng tiền. Nhãn mâu thuẫn mã khoa đã biết bị từ chối. Khi hai khoa trống, sửa nguồn tại Kho dữ liệu trước.
5. Đối soát các lỗi dữ liệu và nghi trùng. Cặp cùng bệnh nhân + lượt + dịch vụ + thời điểm chỉ định nhưng khác khóa được cách ly cả hai; có thể là dịch vụ lặp thật nên không tự xóa. Kiểm tra nguồn rồi sửa hoặc loại dòng có lý do.
6. Tại Chi tiết số liệu: khai báo loại gói, mã dịch vụ và đơn giá lẻ/SKTQ/SLUT 1/SLUT 2 riêng. Bộ lọc mặc định là Khoa Vú chỉ định, gồm nơi thực hiện bên ngoài. Có thể xem nơi thực hiện khác để đối chiếu; snapshot chính vẫn giữ phạm vi Khoa Vú chỉ định.
7. Chốt, gửi duyệt, xuất Excel hoặc PowerPoint. Backend tự tính lại dữ liệu và kiểm tra nhãn; không tin tổng tiền gửi từ giao diện. Snapshot cũ giữ nguyên phạm vi và số tiền đã chốt; mở kỳ mới để dùng chính sách mới. Phải xử lý dòng hoàn thành chưa xác định khoa trong kỳ trước khi chốt.

## AI hoạt động như thế nào

Model multinomial Naive Bayes (`VU-REVENUE-NB-1`) chạy trong Python local khi nhập/lưu/chốt; JavaScript giữ phần xem trước trên giao diện, không cần API key, dịch vụ bên ngoài hay GPU. Đặc trưng gồm tên/mã khoa chỉ định, khoa thực hiện và cặp khoa; không dùng tên người bệnh, điện thoại, mã bệnh nhân, tên file, chẩn đoán hoặc tiền. Khởi tạo bằng 64 cặp khoa chuẩn giả lập; những cặp do người dùng xác nhận bổ sung vào tập huấn luyện và được lưu trong cấu hình. Model được dựng lại từ cấu hình đã lưu khi mở ứng dụng.

Khoa chuẩn được nhận diện bằng ánh xạ chính xác; tên có chứa chữ Vú đơn lẻ không đủ căn cứ. Model gợi ý nhãn cho tên mới, nhưng chỉ cặp đã xác nhận hoặc danh mục khoa chuẩn mới quyết định phạm vi tính tiền. Điểm model không được hiệu chuẩn thành xác suất đúng và không phải chỉ số độ chính xác. Chưa có nhãn bệnh viện thực thì chưa thể coi đây là model đã học dữ liệu bệnh viện.

Nhãn: `VU_INTERNAL`, `VU_OUTBOUND`, `VU_INBOUND`, `EXTERNAL_UNRELATED`. Hai nhãn đầu vào doanh thu; hai nhãn sau giữ nguồn nhưng không vào tổng. Dòng chưa xác định không tự gán vào nhóm ngoài phạm vi.

## Cách tính và bảo toàn số liệu

- Doanh thu từng dòng/nhóm giá = đơn giá đã xác định × số lượng hoàn thành. Dùng số nguyên VND, lượng tối đa 6 số thập phân, chặn tràn số. Các dòng cùng giá được gộp rồi làm tròn nửa lên; dữ liệu số lượng lẻ cần khoa xác nhận quy tắc làm tròn khi quyết toán.
- Toàn bộ danh mục dịch vụ thuộc phạm vi được tính, bao gồm MRI, xét nghiệm, GPB, phẫu thuật… ở nhóm Dịch vụ khác khi không thuộc bốn nhóm khám/SA/XQ2D/XQ3D.
- Ưu tiên đơn giá cấu hình theo mã dịch vụ và loại giá; lẻ dùng giá nguồn nếu chưa cấu hình; trong gói dùng phân bổ nguồn / số lượng khi xác định được giá nguyên VND. Gói chưa ánh xạ hoặc thiếu giá giữ trống, không dùng giá lẻ thay thế.
- Tổng SA trừ cấu phần SKTQ/SLUT1/SLUT2/gói khác/chờ phân loại cho ra SA lẻ; tương tự khám và XQ2D/3D. Không dùng số gói bán để suy ra số kỹ thuật đã hoàn thành. Không cộng giá gói cha lần nữa.
- Trước giảm theo nguồn, sau giảm/phân bổ đã biết và giá × lượng là ba góc nhìn riêng. Không cộng chồng; chưa xác định giảm giá không đồng nghĩa giảm bằng 0.
- SHA-256 chống nhập lại cùng bytes dù đổi tên; khóa liên kết và chữ ký nghiệp vụ bỏ bản giống nhau qua nhiều file/sheet; khóa trùng khác nội dung cách ly toàn nhóm. File không có mã chỉ định/HIS khi chọn file lẻ hoặc thư mục dùng khóa nội bộ từ SHA-256 nội dung; không bắt người dùng nhập mã HIS.
- Lưu file tương đối, sheet, dòng vật lý, hash file và lịch sử chỉnh sửa. File Excel gốc trên máy không bị sửa. Sheet chưa nhập được ghi trong lịch sử tiếp nhận nếu lô có dữ liệu được xác nhận nhập.
- Kho dữ liệu giữ bảng nguồn đầy đủ để đối soát. Các thẻ tiền và biểu đồ chỉ tính nguồn hợp lệ thuộc phạm vi Khoa Vú chỉ định. Excel chi tiết và báo cáo/PPT dùng cùng phạm vi; bản cuối dùng snapshot đã duyệt.

## Giới hạn cần xác nhận

Không bảo đảm sai số dưới 0,05% trên dữ liệu thật khi chưa có bộ chuẩn độc lập. Các kiểm thử và báo cáo audit hiện dùng dữ liệu giả lập; không thay cho kiểm định bệnh viện. Cần khoa duyệt mã khoa, danh mục dịch vụ thật, giá, hiệu lực giá, phân bổ gói và đối soát ca hủy/hoàn tiền. Danh mục mặc định vẫn là 87 dịch vụ giả lập; mã dịch vụ thực chưa có phải đối soát trước khi tổng hợp. Chưa tự ánh xạ mọi biểu mẫu Excel tùy ý; các cột nghiệp vụ bắt buộc được báo rõ trong xem trước, không suy diễn số lượng, trạng thái hay giá bị thiếu.

Chế độ 4173 lưu theo trình duyệt. Chế độ backend 4180 lưu SQLite nội bộ, kiểm tra tài khoản, quyền ghi, CSRF, revision và khóa báo cáo. Nhãn học dùng chung kho cấu hình trong chế độ backend. Không thay đổi báo cáo đã duyệt hoặc dữ liệu đang lưu chỉ để chạy thử.

## Kiểm chứng lịch sử 15/11/2026

Các số bên dưới thuộc mốc trước khi chuyển pipeline sang Python. Kiểm toán hiện hành và giới hạn kiểm chứng xem `23-KIEM-TOAN-FEATURE-VA-DAU-VAO.md`.

- Toàn bộ Node test: 193 đạt, 0 lỗi (gồm kiểm thử backend trên SQLite tạm).
- Audit tham chiếu cũ: 182 so sánh / 26 tuần giả lập, khớp.
- Audit phạm vi Khoa Vú chỉ định: 104 so sánh độc lập / 26 tuần giả lập, sai lệch tuyệt đối bằng 0. Kết quả ở `docs/audit/revenue-scope-results.json`.
- Giao diện: chọn thư mục `data_gialap/AI_DOANHTHU_DEMO`, 3 file → bỏ 1 file trùng → 4 dòng mới (2 thuộc phạm vi, 1 ngoài, 1 chờ). Sheet tổng hợp báo chưa nhập; không xác nhận ghi vào dữ liệu người dùng khi thử.
- Build giữ asset hash cũ (`emptyOutDir:false`) vì Windows chặn unlink một asset cũ; ghi index và asset mới cùng thư mục dist. Không tạo bản sao dự án hoặc thư mục backup.
