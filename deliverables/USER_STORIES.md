# User Stories — PinkPath

> Status: v1.1 · 18/11/2026 · Story theo INVEST, AC theo Given–When–Then. Yêu cầu gốc: [PRD.md §3](PRD.md). Quy tắc: [BUSINESS_RULES.md](BUSINESS_RULES.md). Cột "Code" đối chiếu `a03239e` (logic tính toán không đổi so với `c352f04`).

## Epic R — Báo cáo doanh thu tuần

### US-R1 · Nhập file Export
**Là** thư ký khoa, **tôi muốn** thả các file Export của tuần vào công cụ **để** không phải tra từng mã dịch vụ, từng PID.
Code: Một phần (nhập được, chưa biết cột thật) · FR-01, FR-02

- **AC1** Given file Export Report của tuần, When tôi chọn file, Then tôi thấy bản xem trước số dòng, số cột nhận diện được và cột thiếu, trước khi xác nhận.
- **AC2** Given file thiếu cột bắt buộc (ngày, mã dịch vụ, khoa chỉ định), When tôi xác nhận, Then công cụ từ chối, nêu tên cột thiếu và không ghi dòng nào.
- **AC3** Given một file đã nhập, When tôi nhập lại đúng file đó, Then công cụ báo đã có và không cộng thêm dòng.
- **AC4** Given ô tiền có dấu chấm phân cách hoặc chữ "VND", When nhập, Then giá trị được chuẩn hoá thành số; ô không đọc được bị đánh dấu, không thành 0.

### US-R2 · Phân loại phạm vi Khoa Vú
**Là** thư ký, **tôi muốn** mỗi dòng được xếp vào đúng phần doanh thu theo quy tắc khoa đã duyệt **để** không phải lọc bằng mắt.
Code: Lệch (theo cặp khoa) · FR-03 · BR-02–BR-04, BR-13

- **AC1** Given danh mục quy tắc v1 đã duyệt, When nhập dòng có dịch vụ thuộc phạm vi, Then dòng được xếp vào phần tương ứng, kèm tên quy tắc đã áp.
- **AC2** Given dòng do bác sĩ IVF chỉ định, When phân loại, Then dòng bị loại khỏi doanh thu Khoa Vú với lý do "BR-03".
- **AC3** Given dòng không khớp quy tắc nào, When phân loại, Then dòng vào hàng chờ đối soát, không cộng vào tổng.
- **AC4** Given tôi xác nhận một dòng chờ, When lưu, Then bắt buộc nhập lý do và lịch sử ghi người, thời điểm.

### US-R3 · Quản lý danh mục quy tắc và giá
**Là** Trưởng khoa, **tôi muốn** xem và duyệt danh mục quy tắc, giá, gói **để** số liệu tính theo đúng quy định của khoa.
Code: Một phần (giá, gói cấu hình được; quy tắc phạm vi chưa) · FR-04

- **AC1** Given danh mục ở trạng thái nháp, When Trưởng khoa duyệt, Then danh mục có số phiên bản và ngày hiệu lực.
- **AC2** Given báo cáo đã chốt bằng danh mục v1, When danh mục đổi sang v2, Then báo cáo cũ không đổi số.
- **AC3** Given tài khoản chỉ xem, When mở danh mục, Then không có nút sửa và API từ chối sửa.

### US-R4 · Tổng doanh thu 4 phần
**Là** bác sĩ trình bày giao ban, **tôi muốn** thấy tổng doanh thu chia đúng ngoại trú, nội trú, SKTQ, upsale **để** trình bày slide 2 không phải tính tay.
Code: Chưa · FR-05 · BUSINESS_RULES §1, BR-13, BR-14

- **AC1** Given snapshot tuần, When mở báo cáo, Then thấy 4 phần và tổng, mỗi phần mở được danh sách dòng cấu thành.
- **AC2** Given phần ngoại trú, When mở chi tiết, Then thấy tách XN máu, chỉ định khác, chỉ định lẻ, chuyên khoa khác.
- **AC3** Given số upsale được sửa, When lưu, Then mọi tổng liên quan tự tính lại, không phải sửa tay chỗ khác.

### US-R5 · Chốt theo ngày, tra bổ sung
**Là** thư ký, **tôi muốn** lần tra sáng thứ Hai chỉ thấy dòng mới so với lần chốt chiều thứ Bảy **để** không phải làm lại từ đầu.
Code: Một phần (chốt kỳ, chưa chốt ngày) · FR-06

- **AC1** Given đã chốt lúc 17:00 thứ Bảy, When nhập file Export sáng thứ Hai, Then công cụ hiện riêng các dòng phát sinh sau lần chốt.
- **AC2** Given số tuần khác số đã chốt, When xem, Then thấy chênh lệch theo ngày và theo bảng.

### US-R6 · Đối chiếu ba nguồn
**Là** thư ký, **tôi muốn** đặt số Report, OH và máy cạnh nhau cho từng dịch vụ chính **để** biết lệch ở đâu và có sẵn lý do khi bị hỏi.
Code: Chưa · FR-07

- **AC1** Given ba nguồn cho siêu âm vú 2 bên, When mở bảng đối chiếu, Then thấy ba số, chênh lệch và ô lý do.
- **AC2** Given chênh lệch chưa có lý do, When chốt snapshot, Then công cụ cảnh báo và yêu cầu xác nhận.

### US-R7 · Nội trú chuyển kỳ
**Là** thư ký, **tôi muốn** công cụ giữ danh sách khách còn nằm viện **để** tuần sau không quên tính và slide có lý do khi nội trú thấp.
Code: Chưa · FR-08 · BR-09

- **AC1** Given khách nội trú chưa ra viện lúc chốt, When chốt tuần, Then khách vào danh sách chuyển kỳ, không tính vào tuần này.
- **AC2** Given tuần sau khách ra viện, When nhập file, Then công cụ nhắc khách thuộc danh sách chuyển kỳ.
- **AC3** Given có khách chuyển kỳ, When xuất PPT, Then slide nội trú có dòng "N ca chuyển sang tuần sau".

### US-R8 · PPT giao ban đúng mẫu
**Là** thư ký, **tôi muốn** xuất PPT đúng các slide khoa đang dùng **để** không phải copy và chỉnh định dạng mỗi tuần.
Code: Lệch (cấu trúc slide khác) · FR-09

- **AC1** Given snapshot tuần, When xuất PPT, Then có các slide: doanh thu, SKTQ, upsale, BSLS, lượt khám BSLS, CLS tầng 3, phẫu thuật–can thiệp, CV CĐHA.
- **AC2** Given mọi bảng số, When xem slide, Then dưới tiêu đề có đơn vị đếm (chỉ định / ca / lượt / khách).
- **AC3** Given số tiền, When xuất, Then định dạng thống nhất `#,##0`, không cần chỉnh tay.

### US-R9 · Ghi chú biến động
**Là** bác sĩ trình bày, **tôi muốn** slide có sẵn lý do khi số tăng/giảm rõ so với tuần trước **để** không phải giải thích miệng.
Code: Chưa · FR-10

- **AC1** Given chênh lệch vượt ngưỡng cấu hình, When chốt, Then công cụ yêu cầu nhập một câu lý do.
- **AC2** Given đã có lý do, When xuất PPT, Then lý do hiện dưới bảng tương ứng.

### US-R10 · Số nhận từ bên ngoài
**Là** thư ký, **tôi muốn** ghi số SKTQ và upsale nhận từ bộ phận khác vào một chỗ, kèm ngày nhận, người gửi **để** sửa một chỗ khi họ gửi lại.
Code: Chưa · FR-11 · BR-12, BR-14

- **AC1** Given file SKTQ của tuần, When nhập, Then số ca SKTQ được so với nhóm SKTQ trong file Export OH cùng tuần và báo khi lệch.
- **AC2** Given bộ phận khác gửi số sửa, When thay, Then chỉ thay ở sheet này và các bảng phụ thuộc tự tính lại.

## Epic S — Ghi kết quả siêu âm

### US-S1 · Chép lời đọc
**Là** thư ký phòng siêu âm, **tôi muốn** lời bác sĩ đọc được chép song song **để** tôi chỉ soát và sửa, không phải gõ theo.
Code: Có · FR-12

- **AC1** Given đã cấp quyền micro, When bác sĩ đọc, Then chữ xuất hiện trong ≤ 3 giây.
- **AC2** Given bấm Dừng, When còn đoạn đang chép, Then ca chưa cho hoàn thành đến khi chép xong đoạn cuối.
- **AC3** Given dịch vụ nhận dạng lỗi, When đang thu, Then âm thanh chưa chép được giữ tạm để thử lại; văn bản đã có không mất.

### US-S2 · Cảnh báo an toàn
**Là** bác sĩ, **tôi muốn** được cảnh báo khi bản chép thiếu bên vú hoặc có số đo không đơn vị **để** không ký nhầm.
Code: Chưa · FR-13 · SP-03

- **AC1** Given đoạn kết luận không có "vú phải", "vú trái" hoặc "hai bên", When thư ký bấm hoàn thành, Then hiện cảnh báo và yêu cầu xác nhận.
- **AC2** Given có số không kèm đơn vị (mm, cm), When hoàn thành, Then số đó được đánh dấu để soát.
- **AC3** Given có từ phủ định ("không thấy"), When soát, Then từ được tô nổi để kiểm tra.

### US-S3 · Bác sĩ soát trước khi hoàn tất
**Là** bác sĩ, **tôi muốn** soát và sửa bản chép trước khi đánh dấu đã kiểm tra **để** giữ trách nhiệm chuyên môn như hiện tại.
Code: Có · FR-14 · SP-06

- **AC1** Given ca ở trạng thái chờ, When bác sĩ sửa và lưu, Then bản lúc hoàn thành vẫn được giữ để đối chiếu.
- **AC2** Given hai tab cùng sửa một ca, When tab cũ lưu, Then không ghi đè bản mới hơn.

### US-S4 · Gợi ý câu song ngữ
**Là** thư ký mới, **tôi muốn** được gợi ý câu tiếng Anh từ bảng thuật ngữ bác sĩ đã duyệt **để** không mất 16 phút tìm mẫu.
Code: Chưa · FR-15 · SP-05

- **AC1** Given câu tiếng Việt có trong bảng thuật ngữ, When chọn song ngữ, Then hiện câu tiếng Anh đã duyệt bên cạnh.
- **AC2** Given câu không có trong bảng, When chọn song ngữ, Then công cụ không tự dịch, đánh dấu để thư ký/bác sĩ xử lý.
