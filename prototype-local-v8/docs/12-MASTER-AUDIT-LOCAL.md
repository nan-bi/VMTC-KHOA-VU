# MASTER PROMPT · bản tích hợp local v7

Mở menu **Liên khoa & dữ liệu model**. Khối **Đối soát đầu ra & thời gian trả kết quả** có nút **Xuất JSON MASTER** và bảng cảnh báo TAT. Khối **Trợ lý truy vết** có thông tin bác sĩ và **Ghi chú hành chính gắn bằng chứng**. Vẫn chạy ở http://127.0.0.1:4173/, không gọi model/API.

## So với MASTER PROMPT người dùng cung cấp

Giữ nhập đồng thời tối đa 10 Excel/CSV, tối đa 20.000 dòng/batch, toàn batch thành công mới thay nguồn. Giữ số dòng vật lý qua dòng trống, sheet, tên file và SHA-256 bytes thật; `file_hash` là alias của `source_file_hash` do phần mềm ghi, không tin giá trị tự khai trong file. Nguồn cũ thiếu hash giữ null. Bản local và file xuất không phải kho audit bất biến phía server.

Giữ bốn nhóm phân loại, chống trùng/cách ly, các góc nhìn tài chính và xuất Excel/PPT. Không đổi cơ cấu 12 phòng đã chốt theo phần prompt có hai phòng can thiệp và XQ ở CĐHA. Người dùng vẫn chọn profile phân tích; mô phỏng hành trình liên khoa là bộ độc lập.

JSON VU-MASTER-1 có đầy đủ năm nhóm chính theo mẫu, thêm schema_version và report_context. Các điều chỉnh có chủ đích:

- Tiền thiếu trả null; dòng chưa đủ căn cứ phân loại có routing_type=null, không ép vào luồng ngoài phạm vi.
- system_status là NEED_MANUAL_REVIEW nếu kỳ có dòng cảnh báo không phải bản trùng bỏ qua; không mặc định SUCCESS.
- ingestion_summary là toàn nguồn; categorized_records và KPI là hợp các dòng có ngày chỉ định / hoàn thành trong kỳ. Cờ in_order_period/in_performed_period cho biết góc nhìn.
- in_house_completed_services là dòng hoàn thành VU_INTERNAL; inbound/outbound referrals là dòng chỉ định trong kỳ, chưa đồng nhất số lượt chuyển khoa. total_visits / total_unique_patients đếm distinct mã có chỉ định liên quan Vú trong kỳ.
- estimated_gross_inhouse_vnd / outbound là thành tiền dịch vụ hoàn thành trước giảm trong kỳ, không phải tiền thực thu. Hai góc nhìn chỉ định/thực hiện đầy đủ vẫn nằm ở financial_views. net_price_vnd theo tên hợp đồng gốc là **thành tiền hoàn thành của dòng**, không phải đơn giá.
- Nguồn ngoài phạm vi giữ để kiểm toán, cờ contributes_completed=false; không đưa vào tổng Khoa Vú.

## TAT có bằng chứng

Cột tùy chọn result_returned_at hoặc “Ngày trả kết quả” / “Thời điểm trả kết quả”. Có thể nhập “Bác sĩ chỉ định”, “Bác sĩ thực hiện”, “Mã bác sĩ chỉ định/thực hiện”. CHO_THUC_HIEN chuẩn hóa thành CHOTHUCHIEN. Các cột bắt buộc tài chính hiện hành vẫn giữ; không tự suy dữ liệu thiếu để nhận mọi file không rõ schema.

MASTER-TAT-DEMO-1: CĐHA >120 phút; GPB >4320 phút tính từ chỉ định đến trả kết quả. Ngưỡng là cấu hình demo chưa khoa phê duyệt. Tính được đúng khi có cả giờ/múi giờ hợp lệ; date-only hoặc thiếu return không thể chứng minh đúng hạn. Hủy/hoàn tiền không đánh giá. GPB nhận diện khoa GPB hoặc nhóm dịch vụ Giải phẫu bệnh trong danh mục; không tự coi xét nghiệm gen có SLA GPB. Chưa hỗ trợ cảnh báo theo đồng hồ cho chỉ định chưa trả; trường hợp đó báo thiếu mốc. Không lấy completed_at thay return.

Truy vấn ví dụ: “Các chỉ định trễ TAT”, “MRI trễ TAT”, “BN-...”. Bộ lọc trễ chỉ lấy DELAYED_TAT có bằng chứng; câu trả lời luôn nhắc thiếu timestamp không chứng minh đúng hạn. Cảnh báo thời gian không tự loại doanh thu.

## Ghi chú và model sau

Sau khi truy vết có kết quả, nhập ghi chú rồi bấm Lưu ghi chú gắn bằng chứng. Ghi chú giữ câu hỏi, kết quả, kỳ, chế độ, rules version, citation/hash và tất cả dòng bằng chứng tại thời điểm lưu; đổi câu hỏi/nguồn không sửa ghi chú cũ. Xuất JSON để lưu lâu dài, tải lại trang sẽ mất ghi chú chưa xuất. Không sửa số liệu nguồn hoặc tự coi ghi chú là nhãn huấn luyện.

Prompt chuẩn hóa dành cho tích hợp sau: model/MASTER_AUDIT_PROMPT.md. Bản người dùng gửi được lưu riêng để đối chiếu. Chưa có API, đăng nhập backend, audit server hay bảo đảm ngưỡng sai số <0,05% trên dữ liệu thực.

## Kiểm tra

6 bài mới kiểm tra biên 120/4320 phút, timestamp thiếu/sai, bác sĩ trong citation, bốn luồng, tiền null, trùng/xung đột, hủy/chờ, tính tiền không đổi khi có cảnh báo TAT và bản chụp ghi chú độc lập. Chạy `npm test`, `npm run audit`, `npm run build`.
