# Danh mục dịch vụ liên quan đến vú — đề xuất từ bảng giá công khai

> Status: v1 · 18/11/2026 · Nguồn: *Bảng giá dịch vụ Bệnh viện Vinmec Times City*, áp dụng từ 03/04/2026 (`tailieu/bang_gia_dich_vu_benh_vien_vmtc_t1_2026…pdf`, 5.384 dịch vụ). Nhóm lọc theo kiến thức y khoa chung. **Đây là danh sách đề xuất**, chưa phải danh mục khoa dùng; Trưởng khoa hoặc thư ký đánh dấu cột "Khoa tính?". Quy tắc liên quan: [BUSINESS_RULES.md BR-02–BR-04](BUSINESS_RULES.md). Giá có trong file nguồn, không chép vào đây.

## 1. Vì sao cần danh mục này

Thư ký dùng **mẹo** "tên dịch vụ có chữ *vú* thì tính cho Khoa Vú" (BC 02/11). Lọc toàn bộ bảng giá cho thấy mẹo này **vừa sót, vừa thừa**:

| | Số dịch vụ | Ví dụ |
|---|---:|---|
| Có chữ "vú", nhiều khả năng thuộc Khoa Vú (mục 2) | 43 | Khám vú, tái khám vú, siêu âm tuyến vú, chụp X-quang tuyến vú, sinh thiết vú |
| Có chữ "vú" nhưng **có thể thuộc khoa khác** (mục 3) | 49 | Phẫu thuật thẩm mỹ vú, xạ trị vú, phục hồi chức năng sau ung thư vú |
| **Không có chữ "vú"** nhưng liên quan đến vú (mục 4) | 35 | Nạo vét hạch nách, hạch gác, CA 15-3, nhuộm ER/PR/HER2, độn ngực |

Điều làm mẹo này dễ dùng: hầu hết dịch vụ **chẩn đoán hình ảnh** vú đều có chữ "tuyến vú" trong tên tiếng Việt (bảng giá không dùng từ "nhũ ảnh"; "mammography" chỉ có trong tên tiếng Anh). Phần dễ sai nằm ở **phẫu thuật, giải phẫu bệnh, xét nghiệm và thẩm mỹ**.

**Đề xuất:** thay mẹo bằng một danh mục **mã dịch vụ** do khoa duyệt, có cột "Khoa tính?" như dưới đây. Công cụ chỉ dùng mẹo chữ "vú" để **gợi ý** dòng mới chưa có trong danh mục, không tự cộng.

**Lưu ý khi dùng:**
- Mã trong bảng giá có thể khác mã trên trang Report. Cần đối chiếu với khoảng 60 mã thư ký tra mỗi tuần (BC 31/10).
- Có trong danh mục chưa có nghĩa là luôn tính: vẫn áp BR-03 (chỉ định của bác sĩ IVF), BR-04 (nhuộm hoá mô: khoa thực hiện hưởng), trừ gói và SKTQ.
- Bảng giá công khai không có Ki-67, xét nghiệm gen BRCA1/2, PIK3CA, CA 27-29 và chụp ống dẫn sữa cản quang (galactography), dù Hướng dẫn BYT 3128 §3.2 có nêu. Nếu khoa có các dịch vụ này, cần bổ sung từ danh mục nội bộ.

## 2. Có chữ "vú", nhiều khả năng thuộc Khoa Vú

| Mã | Dịch vụ | Nhóm | Khoa tính? |
|---|---|---|:-:|
| E45.02.0001 | Khám Vú (có hẹn) | Khám bệnh | ☐ |
| E45.02.0002 | Khám Vú (không hẹn) | Khám bệnh | ☐ |
| E45.02.0006 | Tái khám Vú | Khám bệnh | ☐ |
| E45.02.0003 | Tư vấn/Khám sàng lọc ung thư vú (dưới 30 phút) | Khám bệnh | ☐ |
| GM.1113 | Tư vấn/khám sàng lọc ung thư vú | Khám bệnh | ☐ |
| FA.04.0027 | Siêu âm tuyến vú hai bên | CĐHA | ☐ |
| FA.04.0126 | Siêu âm tuyến vú một bên | CĐHA | ☐ |
| FA.04.0084 | Siêu âm tuyến vú 2 bên (tầm soát 3D, tự động) ABUS 3D | CĐHA | ☐ |
| FA.04.0146 | Siêu âm tuyến vú 1 bên (tầm soát 3D, tự động) ABUS 3D | CĐHA | ☐ |
| FA.04.0142 | Siêu âm đàn hồi mô bổ sung tuyến vú một bên | CĐHA | ☐ |
| FA.04.0143 | Siêu âm đàn hồi mô bổ sung tuyến vú hai bên | CĐHA | ☐ |
| FA.04.0144 | Siêu âm vi mạch bổ sung tuyến vú một bên | CĐHA | ☐ |
| FA.04.0145 | Siêu âm vi mạch bổ sung tuyến vú hai bên | CĐHA | ☐ |
| FA.05.0055 | Chụp X-quang tuyến vú (2 bên) | CĐHA | ☐ |
| FA.05.0077 | Chụp X-quang tuyến vú (1 bên) | CĐHA | ☐ |
| FA.05.0097 | Chụp XQ số hoá cắt lớp tuyến vú 1 bên (tomosynthesis) | Xét nghiệm (bảng giá xếp vậy) | ☐ |
| FA.05.0098 | Chụp XQ số hoá cắt lớp tuyến vú 2 bên (tomosynthesis) | CĐHA | ☐ |
| FA.05.0105 | Chụp X-quang tuyến vú (bệnh phẩm tuyến vú) | CĐHA | ☐ |
| FA.05.0116 | Chụp X-quang tuyến vú 2 bên có tiêm cản quang (CEM) | CĐHA | ☐ |
| FA.01.0013 | Chụp cộng hưởng từ tuyến vú | CĐHA | ☐ |
| FA.01.0066 | Chụp cộng hưởng từ tuyến vú động học có tiêm tương phản (sàng lọc) | CĐHA | ☐ |
| E39.0194 | Chọc hút tế bào tuyến vú dưới hướng dẫn siêu âm | Thủ thuật | ☐ |
| E39.0196 | Chọc hút nang tuyến vú, tiêm xơ dưới hướng dẫn siêu âm (< 3 cm) | Thủ thuật | ☐ |
| E45.0101 | Chọc hút nang tuyến vú, tiêm xơ dưới hướng dẫn siêu âm (> 3 cm) | Thủ thuật | ☐ |
| E39.0197 | Chọc hút ổ dịch, áp xe tuyến vú dưới hướng dẫn siêu âm | Thủ thuật | ☐ |
| E39.0198 | Đặt marker, clip đánh dấu u vú dưới hướng dẫn siêu âm | Thủ thuật | ☐ |
| E03.0326 | Sinh thiết vú dưới hướng dẫn siêu âm | Thủ thuật | ☐ |
| E03.0348 | Sinh thiết vú bằng kim/dụng cụ sinh thiết dưới hướng dẫn siêu âm | Thủ thuật | ☐ |
| E39.0203 | Sinh thiết vú dưới hướng dẫn siêu âm (hút hỗ trợ Mammotome) | Thủ thuật | ☐ |
| FA.06.0162 | Sinh thiết vú dưới hướng dẫn siêu âm, hỗ trợ hút chân không (VABB) | Thủ thuật | ☐ |
| E39.0204 | Chọc sinh thiết vú dưới định vị nổi (Stereotaxic) | Thủ thuật | ☐ |
| FA.07.0057 | Sinh thiết vú dưới cộng hưởng từ | Thủ thuật | ☐ |
| FA.06.0151 | Định vị kim dây tổn thương tuyến vú dưới hướng dẫn X-quang vú | Thủ thuật | ☐ |
| FA.07.0058 | Đặt kim dây định vị vú dưới cộng hưởng từ | Thủ thuật | ☐ |
| E39.0195 | Cắt u vú lành tính | Phẫu thuật | ☐ |
| E45.0100 | Cắt u vú lành tính bằng Mammotome (> 3 cm) | Phẫu thuật | ☐ |
| FA.07.0059 | Cắt u vú lành tính bằng Mammotome (tiền công từ dịch vụ thứ 2) | Phẫu thuật | ☐ |
| E03.0196 | Bóc nhân xơ vú | Phẫu thuật | ☐ |
| E03.0273 | Phẫu thuật cắt bỏ u xơ vú (có gây mê) | Phẫu thuật | ☐ |
| E03.0274 | Phẫu thuật cắt bỏ u xơ vú (phức tạp) | Phẫu thuật | ☐ |
| E03.0225 | Trích áp xe vú | Phẫu thuật | ☐ |
| E10.1060 | Phẫu thuật lấy bỏ tổn thương lành tính tuyến vú | Phẫu thuật | ☐ |
| E10.1063 | Phẫu thuật cắt rộng tổ chức viêm vú | Phẫu thuật | ☐ |

Phẫu thuật ung thư vú có chữ "vú" nhưng có thể do khoa ngoại hoặc ung bướu thực hiện. Nhóm xếp vào mục 3.

## 3. Có chữ "vú" nhưng có thể thuộc khoa khác — cần khoa xác nhận

| Mã | Dịch vụ | Vì sao cần hỏi | Khoa tính? |
|---|---|---|:-:|
| E03.0085 | Phẫu thuật cắt một phần tuyến vú (bao gồm vét hạch) | Phẫu thuật ung thư: khoa nào mổ? | ☐ |
| E03.0190 | Cắt vú theo phương pháp Patey + vét hạch nách | Như trên | ☐ |
| E10.1058 | Phẫu thuật bảo tồn tuyến vú trong ung thư tuyến vú | Như trên | ☐ |
| E10.1059 | Phẫu thuật cắt bỏ tuyến vú | Như trên | ☐ |
| E36.0042 | Cắt ung thư vú tiết kiệm da – tạo hình ngay | Nhóm mã E36 (ung bướu/xạ trị) | ☐ |
| E36.0138 | Xạ trị vú bằng máy gia tốc có DIBH | Xạ trị | ☐ |
| E04.0308 | Vật lý trị liệu – PHCN sau điều trị ung thư vú | Phục hồi chức năng | ☐ |
| E30.0441 | Chụp SPECT/CT vú (thuốc) | Y học hạt nhân; dòng thuốc | ☐ |
| FA.04.0035 | Siêu âm đàn hồi mô (gan, tuyến vú, tuyến giáp…) | Dùng chung nhiều cơ quan | ☐ |
| GD.0005 | KSK – Khám phụ khoa, khám vú | Khám sức khoẻ: thuộc SKTQ (BR-12) | ☐ |
| 25.1 | Chọc hút kim nhỏ tuyến vú… (XN tế bào học) | Giải phẫu bệnh; khoa thực hiện hưởng? (BR-04) | ☐ |
| 25.3016 | Xét nghiệm mô bệnh học thường quy bệnh phẩm sinh thiết (tuyến vú) | Như trên | ☐ |
| 25.3112 | Phẫu tích bệnh phẩm làm xét nghiệm mô bệnh học (u vú lành tính) | Như trên | ☐ |
| E18.0520 … E18.1109 (36 mã) | Phẫu thuật tạo hình, thẩm mỹ vú: tái tạo vú sau ung thư, thu gọn/treo vú, tụt núm vú, quầng núm vú, vú to ở nam giới, tuyến vú phụ; có các bản "(HQ)" và "(**)" | Nhóm mã E18 (thẩm mỹ/tạo hình): nhiều khả năng thuộc khoa khác. Danh sách đủ mã ở file CSV kèm theo | ☐ |

Ghi chú dữ liệu: mã E18.0521 có tên tiếng Việt "Tái tạo tuyến vú sau cắt ung thư vú (núm vú)" nhưng tên tiếng Anh là "Accessory Breast Tissue Removal". Tên trong bảng giá công khai lệch nhau, cần tra mã trên hệ thống.

## 4. Không có chữ "vú" nhưng liên quan đến vú — mẹo chữ "vú" bỏ sót

**Căn cứ chuyên môn:** Hướng dẫn BYT 3128 §3.2 liệt kê trong quy trình chẩn đoán ung thư vú: xác định hạch cửa (hạch gác) bằng đồng vị phóng xạ và đầu dò Gamma; sinh thiết định vị kim dây; chất chỉ điểm u CA 15-3, CEA, CA 27-29; hoá mô miễn dịch ER, PR, HER2, Ki67; lai tại chỗ (ISH) cho HER2; BRCA1/2; PD-L1. Hướng dẫn chỉ cho biết dịch vụ nào thuộc quy trình chẩn đoán ung thư vú, **không** cho biết khoa nào hưởng doanh thu.

**Lưu ý CA 15-3, CEA:** BYT SL 2025 §III ghi các chất chỉ điểm u này "không có giá trị trong sàng lọc ung thư vú". Chúng vẫn thuộc quy trình chẩn đoán và theo dõi (BYT 3128 §3.2), nên vẫn để trong danh mục. Khi khoa đánh dấu, cần phân biệt chỉ định cho khách sàng lọc với chỉ định cho người bệnh đang theo dõi, nếu cách tính doanh thu khác nhau.

| Mã | Dịch vụ | Liên quan | Khoa tính? |
|---|---|---|:-:|
| E10.1061 | Phẫu thuật nạo vét hạch nách | Điều trị ung thư vú | ☐ |
| E10.1062 | Phẫu thuật lấy hạch cửa vùng nách | Sinh thiết hạch gác ung thư vú | ☐ |
| FA.09.0006 | Kỹ thuật phát hiện hạch gác bằng đầu dò Gamma | Hạch gác (thường cho ung thư vú) | ☐ |
| E30.0428 | Kỹ thuật phát hiện hạch gác bằng đầu dò Gamma (thuốc) | Như trên; dòng thuốc | ☐ |
| FA.06.0152 | Định vị kim dây trước phẫu thuật dưới hướng dẫn siêu âm | Không ghi cơ quan; có thể là vú | ☐ |
| 23.34 | Định lượng CA 15-3 | Chất chỉ điểm ung thư vú | ☐ |
| 25.6163 | Nhuộm HMMD – ER (Estrogen Receptor) | Dấu ấn ung thư vú; BR-04 | ☐ |
| 25.6181 | Nhuộm HMMD – PR (Progesterone Receptor) | Như trên | ☐ |
| 25.6166 | Nhuộm HMMD – HER2/Neu | Như trên (cũng dùng cho ung thư dạ dày) | ☐ |
| 27.9189 | FISH đánh giá biểu hiện gen HER2 | Như trên | ☐ |
| 25.6155, 25.6156 | Nhuộm HMMD – CK5, CK5/6 | Hay dùng phân loại u vú; không riêng vú | ☐ |
| 25.6195 | Nhuộm HMMD – E-cadherin | Phân biệt thể ống/tiểu thuỳ; không riêng vú | ☐ |
| 25.6202 | Nhuộm HMMD – GATA3 | Hay dùng cho u vú; không riêng vú | ☐ |
| E18 (21 mã) | Thẩm mỹ ngực: độn ngực (túi tròn, giọt nước, Bellagel, Motiva), chỉnh sửa/lấy bỏ túi độn, tháo silicone cũ, phí phòng mổ đặt túi ngực, nâng ngực/ghép mỡ ngực, chỉnh sửa biến chứng tạo hình ngực, Thermage ngực, laser xăm nhũ hoa | Dùng chữ "ngực", không dùng chữ "vú"; nhiều khả năng thuộc khoa thẩm mỹ | ☐ |

## 5. Việc tiếp theo

1. Thư ký hoặc Trưởng khoa đánh dấu cột "Khoa tính?" (có thể làm cùng buổi ký [RULES_SIGNOFF.md](RULES_SIGNOFF.md), dòng B1, B5).
2. Đối chiếu với khoảng 60 mã thư ký tra mỗi tuần; bổ sung mã chỉ có trên Report.
3. Danh mục đã duyệt trở thành cấu hình phạm vi của công cụ (thay mẹo chữ "vú" trong GAP L1). Đủ mã và tên: [`breast_services_candidates.csv`](breast_services_candidates.csv).
