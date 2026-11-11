# 06 · Báo cáo kiểm tra workflow và prototype

Ngày kiểm tra: 30/10/2026. Phạm vi: mã nguồn trong gói VinMec-KhoaVu-Local, không phải một hệ thống bệnh viện đã triển khai.

## Kết quả và tiêu chí chấp nhận

- `npm test`: 52/52 kiểm thử đạt, không bỏ qua kiểm thử.
- `npm run audit`: 2.700 dòng mẫu hợp lệ; 182 phép đối chiếu (7 chỉ tiêu × 26 kỳ), sai số tương đối lớn nhất **0%**, đạt ngưỡng **<0,05%**.
- `npm run build`: thành công. Vite có cảnh báo kích thước bundle lớn; đây là hạn chế hiệu năng, không phải lỗi biên dịch.
- Kiểm tra giao diện: tạo khách mẫu → đánh giá ban đầu → phòng khám 3 → chỉ định XQ → nhập kết quả và đính kèm PNG → đúng bác sĩ phòng khám 3 đọc kết quả → kết thúc lượt. Không còn phiếu chờ. Ghi chú tiếp đón, cảnh báo, đánh giá, chỉ định, kết quả và kết luận cuối được giữ đúng lượt.
- File PNG tải lại có SHA-256 khớp nguồn: `6b1048f8a6d40bac0b2954c18fefa40c4ea7a96120fc2e54b7317c0e43c2bbec`.
- Kiểm tra báo cáo trên giao diện: chốt snapshot ngày 23/10/2026 → nhập nhận xét, rời ô để lưu → gửi duyệt → đổi vai trò → duyệt demo → xuất Excel thành công. Sản lượng 9; trước giảm 15.655.000 VND; sau giảm đã biết 13.808.650 VND; 0 dòng thiếu; 2 dòng đến muộn bị loại.

Công thức: `abs(thực tế - chuẩn) / abs(chuẩn) × 100 < 0,05`. Khi chuẩn bằng 0, chỉ chấp nhận thực tế bằng 0; khác 0 là không đạt. Bảng chi tiết và hash dữ liệu: `audit/reference-results.json`, `audit/reference-results.csv`.

**0% chỉ được đo trên bộ tham chiếu giả lập đóng gói sẵn. Chưa có dữ liệu chuẩn bệnh viện để xác nhận mức sai số thực tế <0,05%.** Đây là kiểm tra số liệu và liên kết phần mềm, không phải đánh giá độ chính xác chẩn đoán hoặc quyết định điều trị. Không dùng tỷ lệ tổng hợp để chấp nhận nhầm khách hoặc mất kết quả: các bất biến này phải luôn đạt trong mọi ca kiểm tra.

## Nguồn và giả định nghiệp vụ

Đã đối chiếu WORKFLOW.md gốc, code, prototype và các yêu cầu bổ sung trong cuộc trao đổi. WORKFLOW.md gốc chủ yếu mô tả báo cáo; luồng phòng là phần mở rộng theo yêu cầu người dùng. Tất cả bệnh nhân qua Đánh giá ban đầu đã được người dùng xác nhận. Tư vấn trước can thiệp và điều kiện hồi tỉnh hiện là quy tắc demo cần khoa xác nhận trước vận hành.

Cơ cấu có 12 phòng: 4 phòng khám, 1 siêu âm 3D, 2 siêu âm vú thường, 1 XQ vú, 1 đánh giá ban đầu, 1 tư vấn can thiệp, 1 can thiệp, 1 hồi tỉnh; tiếp đón là đầu vào riêng.

## Vấn đề đã sửa

| Vấn đề | Kiểm soát sau sửa | Vị trí |
|---|---|---|
| Ô trống thành 0; tổng tiền nhập bị tính lại làm che lỗi nguồn | Giữ giá trị nguồn, đối chiếu gross/net/sản lượng; chỉ tính khi thiếu và đủ đầu vào | shared/dataRules.mjs, reports/importRows.mjs, reports/core.mjs |
| Ngày sai, ngày mơ hồ, serial Excel lệch múi giờ | Kiểm tra ngày thực, timestamp có offset, tổng hợp theo +07; Excel serial là giờ địa phương | shared/dataRules.mjs, reports/core.mjs |
| Cùng mã khác nội dung có thể giữ một bản tùy thứ tự | Cách ly tất cả phiên bản xung đột; bản trùng chỉ khác vị trí file không cộng lại | reports/core.mjs |
| Lượt bị gán nhiều khách hoặc mã mất số 0 đầu | Kiểm tra khách/lượt, bắt buộc ID dạng chuỗi, dùng UUID đầy đủ cho mã mới | reports/core.mjs, patients/patientFlow.mjs |
| Bàn giao thiếu ghi chú/cảnh báo hoặc trộn nhánh | Gói bàn giao theo phiếu nguồn và ngữ cảnh cụ thể; cấm thiếu/thừa nhánh | patientFlow.mjs, flowIntegrity.mjs, roomAccess.mjs |
| Kết quả/file sai khách, sai chỉ định, sai bác sĩ | Ràng buộc patientId, visitId, taskId, orderId và bác sĩ gốc; kiểm tra cả trước khi lưu | flowIntegrity.mjs, roomAccess.mjs |
| Đóng lượt quá sớm hoặc đọc khi chưa đủ kết quả | Một phiếu đọc cho một đợt hoàn tất; cấm đóng khi còn phiếu/chỉ định; bắt buộc kết luận cuối | patientFlow.mjs, flowIntegrity.mjs |
| Cập nhật hai tab gây mất lần ghi trước | Web Locks cùng origin + revision; từ chối biểu mẫu cũ; quota/lỗi callback không ghi dở vào bản đã lưu | flowStore.mjs, reportStore.mjs |
| Sửa hành chính làm đổi thông tin hiển thị lượt cũ | Lưu patientSnapshot theo lượt; không sửa lượt đã đóng | patientFlow.mjs |
| File không xác minh sau tải | Hash SHA-256 cho file mới; kiểm tra định dạng cơ bản và hash khi tải | attachmentStore.mjs |
| Dữ liệu hỏng bị thay bằng mẫu | Chặn lưu, giữ nguyên dữ liệu lỗi; nâng cấu trúc cũ có kiểm tra | flowIntegrity.mjs, flowStore.mjs, reportStore.mjs |

Các đường dẫn mô-đun trong bảng thuộc `src/features/`, riêng `shared/` thuộc `src/`.

## Ma trận luồng đã thử

200 kịch bản lặp đều trên 4 phòng khám và 5 nhánh, kiểm tra toàn vẹn sau từng bước:

| Nhánh | Luồng sau đánh giá ban đầu và phân phòng khám |
|---|---|
| 1 | Khám → kết luận → đóng lượt |
| 2 | Khám → siêu âm 3D → bác sĩ đọc → đóng lượt |
| 3 | Khám → siêu âm thường 2 và XQ, mỗi phòng một phiếu → đủ kết quả → bác sĩ → đóng lượt |
| 4 | Khám → tư vấn → bác sĩ → chỉ định can thiệp riêng → hồi tỉnh có xác nhận bàn giao → bác sĩ → đóng lượt |
| 5 | Khám → tư vấn → bác sĩ → can thiệp không yêu cầu hồi tỉnh → bác sĩ → đóng lượt |

40 khách khác nhau chạy đan xen qua 4 phòng khám, siêu âm thường 1 và XQ; đảo thứ tự thực hiện để kiểm tra kết quả/file vẫn về đúng lượt. Kiểm thử còn bao gồm sai bác sĩ, file sai khách, phiếu mồ côi, thiếu/trùng phiếu đọc, ngữ cảnh thừa/thiếu, nhiều khách đồng thời trong cùng phòng, khách đang thực hiện tại hai lượt, nhánh siêu âm xem nhầm XQ, lễ tân/đánh giá/điều phối xem kết quả ngoài phạm vi.

Phân quyền chỉ là mô phỏng tại trình duyệt; kiểm thử phạm vi hiển thị không biến nó thành bảo mật máy chủ.

## Giới hạn chưa được giải quyết bằng bản audit này

1. Chưa có backend, đăng nhập thật, phân quyền API, dữ liệu chung nhiều máy, nhật ký bất biến hoặc chữ ký chuyên môn. Web Locks chỉ hoạt động giữa tab cùng origin trên một trình duyệt.
2. Blob IndexedDB và metadata localStorage không có giao dịch nguyên tử chung. Crash có thể để lại file mồ côi; chưa có sao lưu/khôi phục đầy đủ. File cũ thiếu hash chưa thể xác nhận nội dung.
3. Nâng dữ liệu cũ khôi phục cấu trúc liên kết, không chứng minh lại thời điểm hoặc tính đúng chuyên môn của bàn giao cũ.
4. Chưa có quy trình hủy, vắng mặt, đổi bác sĩ, sửa kết quả đã duyệt, cấp cứu và quản lý sức chứa giường hồi tỉnh. Không tự chuyển tùy ý để thay các nhánh thiếu.
5. Luồng khám và tài chính còn riêng: chưa có ánh xạ dịch vụ/giá được duyệt, nên không tự sinh doanh thu từ hoàn thành chuyên môn. Báo cáo sau giảm chỉ phản ánh phần đã biết; chưa phải thực thu hoặc doanh thu ghi nhận.
6. Kiểm tra giao diện dùng dữ liệu giả lập; không phải UAT của khoa. Chưa chạy thử đồng thời nhiều thiết bị, thử khôi phục thảm họa hoặc đối soát HIS/EMR/PACS.
7. Ngưỡng <0,05% hiện là tiêu chí số học so với reference; chưa chứng minh tỷ lệ lỗi vận hành, thiếu dữ liệu đầu vào hay độ chính xác lâm sàng. Không thể cam kết ngưỡng thực tế khi chưa có bộ chuẩn thật.

## Cách tái kiểm tra và bước nghiệm thu thực tế

Chạy `npm ci`, `npm test`, `npm run audit`, `npm run build`. Chạy thử bằng `CHAY-DEMO.cmd` với Node 22+, Chrome/Edge mới. Gói có dist nên demo không cần cài thư viện.

Trước vận hành, khoa cần cung cấp bộ chuẩn đã khử định danh và xác nhận: từng bệnh nhân/lượt, chỉ định, nơi nhận, kết quả, thời điểm bàn giao, dịch vụ/giá. Đối chiếu từng dòng trước rồi mới tổng hợp theo ngày/khoảng ngày; ca sai khách, mất phiếu, sai người nhận hoặc mất file phải bị chặn độc lập với ngưỡng số học. Khoa ký xác nhận các nhánh thông thường và ngoại lệ; sau khi có backend cần thử cạnh tranh cập nhật nhiều máy, phân quyền máy chủ và khôi phục dữ liệu.
