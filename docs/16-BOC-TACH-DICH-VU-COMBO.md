# Bóc tách khám, siêu âm và X-quang theo gói

Mở **Chi tiết số liệu** tại http://127.0.0.1:4173/. Chọn ngày hoặc khoảng ngày bằng lịch phía trên. Phạm vi mặc định là các dịch vụ đã hoàn thành **tại VU**; có thể chọn khoa khác hoặc tất cả nơi thực hiện. Dòng chưa hoàn thành, đã hủy, lỗi, trùng, đã loại và ngoài snapshot không được cộng.

## Cách tính

Mỗi dịch vụ thuộc đúng một phần: SKTQ, SLUT 1, SLUT 2, gói khác, chờ phân loại hoặc CK/lẻ ngoài gói.

**CK/lẻ ngoài gói = tổng hoàn thành − SKTQ − SLUT 1 − SLUT 2 − gói khác − chờ phân loại.**

Nếu toàn bộ gói đã rõ và không có gói khác, đây chính là tổng trừ SKTQ và hai combo. Không coi phần chưa phân loại là dịch vụ đủ điều kiện tính giá lẻ. “Chuẩn” trong phép tính là phân loại ngoài gói; chưa có bảng giá chính thức để xác nhận giá bệnh viện.

- **SLUT 1:** khám + siêu âm.
- **SLUT 2:** khám + siêu âm + X-quang; giữ rõ 2D hoặc 3D theo dịch vụ thực tế.
- Siêu âm, X-quang 2D và X-quang 3D có các phép trừ riêng.
- Trừ các dòng thành phần đã hoàn thành, không lấy tổng gói bán trừ vào mọi dịch vụ. Gói chưa làm đủ không sinh thêm dòng/giá trị.
- Phát sinh ngoài gói (`THEMNGOAIGOI`) vẫn là CK/lẻ dù có cùng mã gói. Chỉ `TRONGGOI` cùng mã gói đã xác nhận mới phân loại vào gói.
- Khoa chỉ định SKTQ không tự chứng minh dịch vụ nằm trong gói SKTQ.
- Khám lần đầu/tái khám có trong phép tính; tư vấn và X-quang tư thế bổ sung không tự gộp. Điều chỉnh tại **Cấu hình gói & dịch vụ → Ánh xạ dịch vụ** nếu cần.

Số lượng là đơn vị dịch vụ; số lượt khám phân biệt được hiển thị riêng. Không cộng số lượt phân biệt giữa các dòng để suy ra số bệnh nhân duy nhất.

## Doanh thu theo đơn giá × số lượng

Trên **Chi tiết số liệu → Sửa đơn giá áp dụng → Đơn giá theo nhóm**, nhập riêng giá lẻ, SKTQ, SLUT 1 và SLUT 2 cho từng mã dịch vụ. Giá 0 là miễn phí; để trống dùng đơn giá nguồn với dịch vụ lẻ, hoặc tổng phân bổ nguồn chia số lượng thực hiện với dịch vụ trong gói. Nếu phép chia không ra đơn giá nguyên VND, hệ thống yêu cầu đối soát, không lấy giá lẻ thay thế.

Doanh thu từng dòng = đơn giá áp dụng × số lượng đã hoàn thành. Các dòng cùng mã dịch vụ, nhóm giá và đơn giá được cộng số lượng trước, làm tròn nửa lên tới VND. Giá nguồn khác nhau được giữ thành từng dòng riêng. Khám, siêu âm, XQ 2D và XQ 3D có tổng riêng; giá bán nguyên gói không được cộng thêm vào các thành phần. SLUT 1 không có giá X-quang.

Khám ngoài hai combo = tổng khám − khám SLUT 1 − khám SLUT 2. Trong phần còn lại, SKTQ, gói khác và chưa phân loại vẫn tách riêng trước khi tính giá lẻ. Các ô thiếu giá hoặc chưa rõ gói được báo chờ đối soát; tổng doanh thu hiển thị chỉ là phần đủ giá, không mặc định ô trống bằng 0.

Cấu hình giá áp dụng cho dữ liệu chưa chốt. Báo cáo mới lưu cả bảng giá và chi tiết doanh thu tại thời điểm chốt; sửa giá về sau không thay báo cáo đã lưu. Báo cáo cũ chưa có phần doanh thu này vẫn giữ nguyên. Doanh thu tính theo giá × số lượng là một chỉ tiêu riêng với số tiền nguồn/sau giảm và không khẳng định tiền thực thu.

## Bộ dữ liệu minh họa

170 dòng của 60 lượt, ngày 19–25/10/2026, được gắn thêm một lần vào dữ liệu trình duyệt. Không thay dữ liệu hoặc chỉnh sửa đang có. Mỗi lượt mới dùng khóa bệnh nhân/lượt riêng. Có cả dịch vụ lẻ, SKTQ, SLUT 1, SLUT 2 2D/3D và phát sinh ngoài gói.

| Phần | Khám | Siêu âm | XQ 2D | XQ 3D |
|---|---:|---:|---:|---:|
| Giá lẻ giả lập | 450.000 | 550.000 | 700.000 | 1.100.000 |
| Phân bổ SKTQ | 150.000 | 200.000 | 250.000 | 400.000 |
| Phân bổ SLUT 1 | 200.000 | 300.000 | — | — |
| Phân bổ SLUT 2 | 180.000 | 250.000 | 370.000 | 570.000 |

Đơn vị VND. Đây không phải giá Vinmec thực tế. Combo SLUT 1 có tổng mẫu 500.000; SLUT 2 có tổng mẫu 800.000 nếu XQ 2D hoặc 1.000.000 nếu XQ 3D.

Các file ở `data_gialap/DICH_VU_COMBO/`: `GIALAP_KHAM_COMBO.csv`, `GIALAP_SIEU_AM.csv`, `GIALAP_XQ_2D.csv`, `GIALAP_XQ_3D.csv` và `GIA_GIALAP.json`. Không cần nhập lại vì đã gắn sẵn.

Để sửa trên dashboard: bấm số lượng trong phần cần xem → **Sửa dữ liệu** → **Tài chính** → sửa đơn giá hoặc phân bổ gói, nhập lý do rồi lưu. Dữ liệu sau giảm/phân bổ được tính lại theo dòng. Bảng giá JSON chỉ là tài liệu ban đầu; số trên dashboard lấy từ dữ liệu đã lưu, không ghi ngược ra JSON/CSV.

**Cấu hình gói & dịch vụ** cho phép gán mã gói vào từng loại và lưu lý do/lịch sử. Quy tắc và dữ liệu đều khóa khi có snapshot báo cáo. Giá nguồn, phân bổ gói và sau giảm là các cách nhìn khác nhau của cùng dịch vụ, không cộng chồng chúng. Giá sau giảm chưa biết vẫn trống.

Nếu mở phiên đã chốt báo cáo trước khi cập nhật, bộ mới chưa được gắn để bảo toàn snapshot. Mở kỳ làm việc mới theo chức năng báo cáo rồi tải lại trang.

## Khóa liên kết nội bộ

Đã bỏ trường mã chỉ định HIS khỏi bảng, biểu mẫu sửa và các CSV cho người dùng. Các khóa kỹ thuật vẫn nối đúng dữ liệu, kết quả và lịch sử; không cần nhập mã chỉ định. Dữ liệu cũ trong trình duyệt được giữ nguyên để bảo toàn báo cáo. Bộ nhập vẫn đọc được cấu trúc cũ để tương thích.

Ba CSV hành trình trong data_gialap dùng internal_link_key cùng các khóa phụ thuộc để giữ quan hệ kỹ thuật. JSON nguồn của mô hình và kho nội bộ vẫn giữ liên kết để không làm hỏng hành trình. Bản CSV trước cập nhật lưu ở D:/AI VIN/VinMec/backup_v8_cachtinh_20261112/.

Mục Tiếp đón & phòng khám đã được gỡ khỏi menu v8. Ứng dụng tập trung vào kho dữ liệu, phân tích và báo cáo.
