# Kiểm toán tính năng và đầu vào dashboard Khoa Vú

Ngày: 15/11/2026. Dự án được kiểm tra: `VinMec-KhoaVu-Local-v8`, mã nguồn tại gốc repository; không dùng bản lịch sử `prototype-local-v8` để suy ra chức năng hiện hành.

## Kết luận

Dashboard có **6 nhóm tính năng nghiệp vụ cốt lõi**, chia thành 9 mục menu. Luồng tổng hợp báo cáo tuần đã có từ nhập nguồn đến xuất Excel/PowerPoint. Tuy vậy, chưa đủ căn cứ kết luận báo cáo đầy đủ nghiệp vụ bệnh viện hoặc đạt sai số dưới 0,05% trên dữ liệu thực.

Đợt này đào sâu đầu vào và xác nhận, sửa hai lỗi: chọn file lẻ không có mã chỉ định bị từ chối; ngày Excel lịch 1904 có thể lệch 1.462 ngày. Đồng thời sửa hướng dẫn cài đặt và mô tả pipeline đã lỗi thời. Chưa thêm quy tắc bệnh viện dựa trên phỏng đoán.

Phạm vi đối chiếu nghiệp vụ là yêu cầu của người dùng trong chat, tài liệu `17-PHAM-VI-BAO-CAO-TUAN.md` và các quy tắc chờ xác nhận trong mã. Đợt này không mở lại Google Docs, không coi bản ghi phạm vi local là bằng chứng tài liệu trực tuyến chưa thay đổi.

## Project giải quyết bài toán gì?

Hỗ trợ Khoa Vú tổng hợp số liệu giao ban từ file xuất: lưu nguồn, bóc tách dịch vụ lẻ/gói/SKTQ, phân loại khoa, đối soát, chốt và xuất báo cáo. Phạm vi doanh thu được người dùng chốt là **Khoa Vú chỉ định, gồm cả dịch vụ khoa khác thực hiện**. Dịch vụ khoa khác chỉ định đến Vú thực hiện được giữ để đối chiếu nhưng không cộng vào tổng theo phạm vi này.

Doanh thu trong dashboard gồm các góc nhìn: giá trị nguồn trước giảm, sau giảm/phân bổ đã biết và giá cấu hình × số lượng. Chúng không được cộng chồng và chưa phải tiền thực thu đã quyết toán.

Dashboard không phải HIS quản lý toàn viện. Các yêu cầu cũ về tiếp đón, hành trình phòng và mô hình vận hành bệnh viện không còn là luồng chính của phạm vi báo cáo tuần hiện tại.

## Bản đồ 6 tính năng cốt lõi

| Nhóm | Hiện có | Mã đang tham gia luồng chính |
|---|---|---|
| 1. Tiếp nhận nguồn | Chọn file/thư mục, đọc Excel/CSV, xem trước, truy file/sheet/dòng, hash file và chống trùng | `ReportImportPanel.jsx`, `prepareImport.mjs`, `ingestion.mjs`, `backend/python/ingestion.py` |
| 2. Kho dữ liệu | Lưu lại, lọc ngày/cột, xem dòng, sửa kèm lý do, biểu đồ và truy nguồn | `DataWorkspace.jsx`, `backend/workspace.mjs`, `backend/python/workspace_rules.py` |
| 3. Phân loại phạm vi | Danh mục khoa, nhãn xác nhận, model local gợi ý, phân biệt nội bộ/chuyển đi/chuyển đến/ngoài phạm vi | `RevenueAI.jsx`, `revenueAI.mjs`, `backend/python/classification.py` |
| 4. Tính dịch vụ và giá | Khám/SA/XQ2D/XQ3D/dịch vụ khác; lẻ, SKTQ, SLUT1/2; giá × lượng, tách cấu phần và cảnh báo thiếu | `ServiceCalculation.jsx`, `serviceCalculation.mjs`, `backend/python/revenue_engine.py`, `classification.py` |
| 5. Đối soát | Kiểm tra định danh, trạng thái, ngày, giá, số lượng, trùng/xung đột; cách ly hoặc loại có lý do | `backend/python/data_rules.py`, `workspace_rules.py`, màn hình Đối soát |
| 6. Vòng đời báo cáo | Snapshot phía server, nháp/gửi/duyệt/lưu trữ, Excel/PPTX từ số đã chốt | `src/main.jsx`, `workspace_rules.py`, `reporting.py`, `presentation.py` |

Đây là cách nhóm theo trách nhiệm nghiệp vụ, không phải con số đếm component. Tổng quan, đăng nhập/phân quyền và nhật ký hỗ trợ xuyên suốt các nhóm trên.

Speech-to-text siêu âm là một nhánh bổ sung, có lưu nháp/ca trong IndexedDB của trang 4173. Không dùng nội dung speech để tự tính doanh thu. Các module hành trình phòng, một số màn hình liên khoa/model cũ còn trong repository nhưng không được tải từ menu chính; trang speech-training là entry riêng. Không xóa các module này trong đợt kiểm toán.

## Hướng 1 — đào sâu tiếp nhận dữ liệu

### Luồng thực tế

Chọn file → kiểm giới hạn → backend loopback → Python đọc và chuẩn hóa → xem trước/phân loại → xác nhận → kiểm quyền và revision → lưu SQLite → đối soát → chốt snapshot.

Trình duyệt vẫn có một số phép xem trước JavaScript; kết quả do client gửi không thay thế kiểm tra phía server. Model gợi ý không tự quyết định tiền khi chưa có ánh xạ hoặc nhãn xác nhận.

### Lỗi đã tái hiện và sửa

| Vấn đề | Tác động | Kiểm chứng và xử lý |
|---|---|---|
| File lẻ thiếu `order_id` bị báo thiếu cột, trong khi mẫu không yêu cầu mã | Người dùng dùng đúng mẫu vẫn không nhập được; chọn thư mục và file có hành vi khác nhau | Tạo XLSX không có order/HIS ID. Mã cũ thất bại, mã sau vá nhận được. Tạo khóa nội bộ cho cả hai chế độ, giữ mã đã có nếu nguồn cung cấp; không thêm cột bắt người dùng nhập mã. |
| Excel lịch 1904 bị đọc như lịch 1900 | Ngày 01/10/2026 có thể thành 30/09/2022, làm sai kỳ báo cáo | Kiểm tra XLSX có ngày định dạng và ngày dạng số; mã cũ thất bại. Sau vá đọc epoch của XLS/XLSX, chỉ chuyển serial ở các cột ngày nghiệp vụ; tiền và lượng giữ nguyên. Kiểm tra thêm XLS thực qua luồng Node → Python. |
| Tài liệu cài đặt nói Python chỉ cần cho speech; tài liệu AI còn mô tả đọc file bằng browser, giới hạn cũ | Máy clone mới có thể thiếu Python hoặc hiểu nhầm nơi xử lý dữ liệu | Sửa README gốc, backend README và hướng dẫn AI local theo implementation hiện hành. |

Khóa nội bộ của file lịch 1900 giữ cách tính trước đây; chỉ chuẩn hóa theo lịch thực tế đối với dữ liệu ngày cần chuyển đổi. Không migrate các dòng hoặc số đã lưu, không tính lại báo cáo cũ. File đã nhập sai kỳ trước đợt vá vẫn cần người phụ trách đối chiếu nguồn và sửa có lý do.

### Khoảng trống chưa thể xem là đã giải quyết

1. **Chống trùng không đồng nghĩa xác định đúng mọi sự kiện.** Hai dòng hoàn toàn giống nội dung mà không có định danh sự kiện độc lập có thể là xuất lặp hoặc hai lần thực hiện thật. Hash không phân biệt được hai tình huống này. Cần khoa xác nhận khóa tự nhiên/các trường sự kiện; không dùng trùng tên bệnh nhân để gộp.
2. **Đọc thành công một phần không chứng minh đủ nguồn.** Chế độ thư mục cho phép bỏ sheet không hợp lệ và hiển thị lý do. Đối soát hiện có chưa chứng minh mọi nguồn bắt buộc cho kỳ đã có mặt. Báo cáo vẫn có thể thiếu một bảng nguồn mà không có lỗi ở các dòng đã nhập.
3. **Chuẩn hóa có giới hạn.** Có ánh xạ tên cột và tìm tiêu đề trong 30 dòng đầu ở chế độ thư mục; chưa có hợp đồng nguồn cho đủ mọi mẫu Export thực tế. Không tự đoán khoa, số lượng, giá hay trạng thái từ tên file.
4. **Giới hạn dung lượng không phải cam kết xử lý mọi file ở ngưỡng.** Giới hạn chọn là 100 MB/file, 500 MB/lô và 100 file/thư mục; kho tối đa 100.000 dòng. JSON tác vụ tối đa 256 MB, thời gian xử lý 120 giây và tối đa hai tác vụ Python cùng lúc có thể giới hạn sớm hơn. Đợt này không đo tải 100 MB thực hoặc nhiều người dùng đồng thời.
5. **Xem trước và thẩm quyền lưu còn ở hai ngôn ngữ.** Một số luật có bản JavaScript và Python. Đã có fixture đối chiếu migration, nhưng cần tiếp tục mở rộng ca biên khi luật thay đổi để tránh lệch hành vi.

## Hướng 2 — tính năng đã đủ giải bài toán chưa?

| Nhu cầu | Trạng thái | Phần còn thiếu |
|---|---|---|
| Lấy file trên máy và mở lại để chỉnh | Có | Cần thử đủ bộ Export thật, chưa có bằng chứng bao phủ toàn bộ biểu mẫu |
| Phân biệt doanh thu Vú chỉ định/khoa khác chỉ định | Có điều kiện | Phụ thuộc danh mục khoa và nhãn xác nhận; chưa có đánh giá phân loại trên bộ chuẩn bệnh viện độc lập |
| Tách SA/XQ/khám lẻ với SKTQ và SLUT1/2 | Có bộ máy tính | Cần giá, mã gói, phân bổ và quy tắc thực đã duyệt; không lấy số combo bán thay cho kỹ thuật hoàn thành |
| Giữ dòng lỗi/truy nguồn/chống xuất lặp | Có cơ chế | Không thể cam kết nhận diện sự kiện hoàn hảo khi nguồn thiếu khóa phân biệt |
| Kiểm tra đủ 8 nguồn/bảng và xử lý nguồn mâu thuẫn | Chưa đầy đủ | Thiếu khai báo nguồn bắt buộc theo chỉ tiêu, kỳ, mức ưu tiên và quy tắc xử lý chênh lệch |
| Giá đúng theo thời điểm cung cấp dịch vụ | Một phần | Có cấu hình/lịch sử thay đổi và snapshot cố định; chưa có bảng giá hiệu lực từ/đến tự áp cho từng ngày dịch vụ |
| BHYT/BHXH, nội trú chuyển kỳ, giường/dược/vật tư, IVF/tái khám | Chờ xác nhận | Chưa có quy tắc chuẩn và cột nguồn đủ căn cứ để tự động hóa |
| Chốt, duyệt, xuất Excel/PPTX | Có | Cần duyệt ánh xạ đủ bảng, mẫu slide và đơn vị; số sau giảm có thể chỉ là phần đã biết và được cảnh báo |
| Xác nhận sai số <0,05% so với dữ liệu chuẩn | Chưa có bằng chứng | Kiểm thử tổng hợp không thay thế bộ chuẩn độc lập và phép đo đã thống nhất |

Đặc biệt: bước chốt phía server chặn lỗi dòng và dòng chưa xác định khoa trong kỳ. Nó chưa phải cổng xác nhận đủ nguồn hoặc mọi chính sách đã được duyệt. Báo cáo có thể thể hiện phần sau giảm đã biết cùng số dòng thiếu; không nên diễn giải là tổng thu hoàn chỉnh.

## Tính năng nên phát triển tiếp, theo thứ tự

### 1. Kiểm tra đủ nguồn và mức sẵn sàng báo cáo

Ưu tiên trước khi tăng khả năng tự động quyết định của AI. Khai báo cho từng chỉ tiêu: nguồn bắt buộc, kỳ dữ liệu, cột cần có, nguồn ưu tiên và người xác nhận. Dashboard hiển thị nguồn đã nhận/thiếu, sheet bị bỏ, kỳ không khớp và xung đột chưa xử lý.

Điều kiện nghiệm thu: thiếu nguồn bắt buộc thì không thể đánh dấu báo cáo là đầy đủ; nguồn ưu tiên phải được khai báo, không tự suy đoán; từng số xuất ra truy được về các dòng nguồn hợp lệ. Khi khoa xác nhận một nguồn không phát sinh trong kỳ, lưu người xác nhận, thời điểm và lý do. Cần danh sách 8 bảng và mapping chỉ tiêu thực tế trước khi cấu hình luật chính thức.

### 2. Bảng giá theo ngày hiệu lực

Thêm phiên bản giá cho từng dịch vụ/loại gói, ngày bắt đầu/kết thúc và căn cứ phê duyệt. Khi tính, chọn theo mốc ngày được khoa xác nhận; chặn khoảng giá chồng nhau hoặc thiếu giá. Báo cáo đã duyệt giữ nguyên snapshot.

Điều kiện nghiệm thu: hai dịch vụ nằm hai phía ngày đổi giá dùng hai giá đúng; sửa giá hiện tại không làm đổi báo cáo đã duyệt; không tự chọn giá lẻ cho cấu phần gói thiếu phân bổ. Cần khoa chốt dùng ngày chỉ định, thực hiện hay mốc kế toán để chọn giá.

### 3. Đối chiếu bộ chuẩn độc lập

Nhập bộ chuẩn được người có trách nhiệm xác nhận, liên kết với dòng nguồn và so số lượng, nhãn phạm vi, giá trị từng nhóm/kỳ. Tách bộ học nhãn khỏi bộ đánh giá; ghi phiên bản luật, bảng giá và danh mục. Chưa dùng bộ chuẩn để tự huấn luyện rồi đo lại trên chính nó.

Điều kiện nghiệm thu: báo sai lệch từng chỉ tiêu và từng nhóm, không chỉ một tổng có thể bù trừ. Sai lệch tài chính tương đối = |thực tế − chuẩn| / |chuẩn| × 100%; phải **nhỏ hơn 0,05%** nếu đó là tiêu chí đã chốt. Khi chuẩn bằng 0, báo riêng lệch tuyệt đối và xử lý theo tiêu chí được duyệt. Lỗi phân loại dòng là một chỉ số riêng, không đồng nhất với sai lệch tiền. Chưa có bộ chuẩn nên chưa công bố đạt ngưỡng.

Đợt này hoàn thành kiểm toán, vá lỗi đã chứng minh và mô tả điều kiện nghiệm thu cho tính năng mới. Chưa cài đặt ba tính năng trên hoặc tự điền các chính sách đang thiếu. Speech và mở rộng quy trình phòng cần đánh giá riêng khi quay lại phạm vi đó.

## Kiểm chứng thực sự đã chạy

- Mã trước vá chạy cùng 5 ca Python đầu vào: hai lỗi thiếu mã và hai trường hợp lịch 1904 không đạt; lưu tại `.speech-cache/input-audit-before.log`.
- Sau vá: 5 ca Python đầu vào đạt, gồm các subcase lịch/ngày; 34 ca pipeline Python đạt.
- Toàn bộ Node: 238 kiểm thử đạt, 0 lỗi. Trong đó 10 ca file import đạt, gồm 8 tổ hợp XLS/XLSX × lịch 1900/1904 × ngày định dạng/dạng số và nhập không có mã qua file/thư mục/CSV.
- `npm run build` đạt; còn cảnh báo bundle lớn. Chưa đo tác động tải trang trong đợt này.
- Chỉ sử dụng dữ liệu tổng hợp, fixture và SQLite kiểm thử. Không ghi vào SQLite vận hành, không mở micro, không sửa ca speech, không gọi AI/cloud và không push Git trong đợt này.

Log chính: `.speech-cache/project-feature-audit-node.tap`, `input-audit-node-focused.tap`, `input-audit-after.log`, `input-audit-pipeline.log`, `project-feature-audit-build.log`.

Các phép kiểm chứng trên xác nhận hành vi kỹ thuật trong phạm vi thử. Không phải kiểm toán bảo mật toàn diện, xác nhận độ chính xác y khoa của speech hay chứng nhận số liệu bệnh viện.
