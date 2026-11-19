# Business Rules — Quy tắc tính doanh thu và yêu cầu ghi kết quả

> Status: v2.1 · 18/11/2026 · Nguồn chính cho mọi quy tắc nghiệp vụ. **Chưa quy tắc nào được Trưởng khoa xác nhận bằng văn bản**; phiếu xác nhận: [RULES_SIGNOFF.md](RULES_SIGNOFF.md). Trạng thái code đối chiếu tại `a03239e` (logic tính toán không đổi so với `c352f04`); phân tích chênh lệch: [GAP_ANALYSIS.md](GAP_ANALYSIS.md).

**Nguyên tắc phiên bản:** khi các báo cáo ghi khác nhau, dùng **bản mới nhất**. Thứ tự ưu tiên: BC 16/11 → 03/11 → 02/11 → 31/10 → 30/10. Quy tắc nào bản mới không nhắc tới thì **giữ bản cũ**. Quy tắc bị thay thế ghi ở [§7](#7-quy-tắc-đã-bị-thay-thế) để truy vết.

Trạng thái xác minh: **QS** = đã quan sát thư ký/bác sĩ làm · **LK** = theo lời kể · **CXM** = còn chi tiết cần xác minh.
Trạng thái code: **Có** · **Một phần** · **Chờ** (code liệt kê trong `PENDING_RULES`, chưa tự áp) · **Chưa**.

## 1. Cấu trúc tổng doanh thu (bản hiện hành: BC 16/11)

```
Tổng doanh thu = Ngoại trú + Nội trú + SKTQ + Upsale

Ngoại trú        = Xét nghiệm máu + Chỉ định khác + Chỉ định lẻ + Chuyên khoa khác
Chuyên khoa khác = Tổng − (Tầng 3 + SKTQ tầng 4, khu 7 tầng)
```

| Phần | Cách tính | Nguồn số liệu | Khoa tự kiểm soát? |
|---|---|---|---|
| Ngoại trú | Theo các chỉ định do bác sĩ lâm sàng tầng 3 đưa ra | OH, Report | Có, nhưng OH và Report đếm khác nhau |
| Nội trú | Như cũ: tuần ra viện, trừ chi phí (BR-09) | Hệ thống | Có |
| SKTQ (tầng 4, khu 7 tầng) | Lấy từ file SKTQ bộ phận SKTQ gửi | File của bộ phận khác | Không |
| Chuyên khoa khác | Phép trừ ở trên | Suy ra | Kéo theo mọi sai số của SKTQ |
| Upsale | Khách SKTQ, chỉ định thêm do bác sĩ Khoa Vú đưa ra | Hành chính thống kê | Không |

Ba định nghĩa tiền khác nhau vẫn cùng được cộng vào tổng: nội trú tính **sau trừ chi phí**, SKTQ tính **ca × đơn giá**, XN máu tính **theo bill trừ BHXH** (BC 30/10, 31/10).

**Upsale cộng riêng**, số do hành chính tổng hợp; không nằm trong chỉ định lẻ (nhóm xác nhận 17/11).

## 2. Phạm vi "thuộc Khoa Vú" (bản hiện hành: BC 02/11)

| ID | Quy tắc | Nguồn | Xác minh | Code |
|---|---|---|---|---|
| BR-02 | Dịch vụ thuộc **danh mục dịch vụ vú** thì tính cho Khoa Vú **dù khoa nào chỉ định**, sau khi trừ phần trong gói và SKTQ. Thư ký dùng **mẹo** "tên có chữ *vú*" để nhận ra (BC 02/11; PM/BA 18/11: đây chỉ là mẹo). Lọc bảng giá công khai cho thấy mẹo này bỏ sót 35 dịch vụ (hạch nách, hạch gác, CA 15-3, nhuộm ER/PR/HER2…) và có thể tính thừa 49 dịch vụ thuộc khoa khác (thẩm mỹ, xạ trị…). Danh mục đề xuất: [BREAST_SERVICES.md](BREAST_SERVICES.md) | BC 02/11 8:55; bảng giá 03/04/2026 | QS · CXM (khoa duyệt danh mục) | Chưa |
| BR-03 | Chỉ định do **bác sĩ IVF** ra thì không tính cho Khoa Vú (ngoại lệ của BR-02) | BC 02/11 15:40 | QS | Chờ |
| BR-04 | **Nhuộm hoá mô:** khoa nào thực hiện thì khoa đó hưởng | BC 31/10 (giữ, bản sau không đổi) | LK | Chưa |
| BR-13 | **Chuyên khoa khác** = Tổng − (tầng 3 + SKTQ). Khách do bác sĩ khoa khác khám: không VIP thì giải trình; VIP thì nhờ tầng thực hiện tra | BC 16/11, 02/11 | QS | Một phần |
| (code) | Tính khi **khoa chỉ định = Khoa Vú**; ca **khoa khác chỉ định, Vú thực hiện** bị loại | `revenueAI.mjs` | — | Có · **lệch BR-02** |

Code cần đổi sang BR-02 + BR-03 + BR-04: [GAP_ANALYSIS.md L1](GAP_ANALYSIS.md).

## 3. Quy tắc theo bảng (bản hiện hành)

| ID | Bảng | Quy tắc hiện hành | Nguồn | Xác minh | Code |
|---|---|---|---|---|---|
| BR-06 | Siêu âm — tổng | Tổng SA lấy **OH làm gốc**: file Export OH theo máy ultrasound, khoảng một tuần; **một cột** trong file có sẵn 4 giá trị: tổng, SKTQ, OPD + IPD, pack OPD. File phòng SA không làm nguồn chính | BC 16/11 | QS | Chưa |
| BR-06a | Siêu âm 2 bên — lẻ | Lẻ = Tổng (OH) − SKTQ − Σ(SLUT 1, SLUT 2, **SLUT 3 nếu có**) − Chuyên khoa khác | BC 16/11; nhóm xác nhận 17/11 | QS | Một phần (chưa trừ SLUT 3, CKK) |
| BR-06b | X-quang — lẻ | Trừ SLUT 2, **SLUT 4 nếu có** | BC 02/11; nhóm xác nhận 17/11 | QS | Một phần (chưa trừ SLUT 4) |
| BR-06c | SKTQ — kiểm chéo | **OH** cho tổng ca SA nguồn SKTQ (giá SKTQ); **Report** cho chỉ định lẻ của khách SKTQ (giá Khoa Vú). Doanh thu khoa (SA) = Chỉ định lẻ + OPD + IPD, theo giá khoa | BC 16/11 | QS | Chưa |
| BR-07 | Tái khám | Khách có **≥ 2 lượt khám** là tái khám; giá khác không tái khám; đếm theo từng bác sĩ | BC 02/11, 16/11 | QS · CXM (khoảng thời gian tính lượt) | Chờ |
| BR-08 | XN máu | Lấy tiền xét nghiệm, **không cộng phần BHXH**; bill xem ở Payments, không có thì ở Charges; nhiều bill thì cộng | BC 31/10 (giữ) | QS · CXM (bỏ dòng có BHXH hay lấy phần tự trả, GĐ-19) | Chờ |
| BR-09 | Nội trú | DT = Tổng − giường − dược − VTTH thường − VTTH y tế. Tính vào **tuần ra viện**; khách còn nằm viện chuyển sang tuần sau. Khoảng lọc 7:00 thứ Hai – 23:59 Chủ nhật | BC 31/10, 02/11, 03/11; 16/11 xác nhận "vẫn tính như cũ" | QS | Chờ (code lọc theo ngày hoàn thành) |
| BR-10 | Thanh toán | Dòng **Unpaid** trên Report **vẫn được tính** vào số lượng, và doanh thu tính từ số lượng đó. Riêng ca Unpaid của ngày cuối tuần: thư ký kiểm tra trên eForm khách đang trong lượt khám | BC 31/10; PM/BA quan sát, xác nhận 18/11 | QS | Chưa |
| BR-11 | Cận lâm sàng | **Phiếu khám không tính** vào số liệu cận lâm sàng | BC 03/11 (giữ) | QS | Chờ |
| BR-12 | SKTQ — file | Hai file (tầng 4, khu 7 tầng), sheet theo tháng. Mỗi khách một dòng, có cột **BI-RADS cao nhất** (trong các BI-RADS được kết luận): thấp nhất là 1, không thấy ghi 0; BI-RADS 4 chia 4A, 4B. SA đếm BR2, BR3, BR4, ≥BR5; XQ có cột riêng khách ≥ 40 tuổi. DT = ca × đơn giá | BC 31/10 (giữ); PM/BA 18/11 (cột BI-RADS) | QS · CXM (ca BI-RADS 1 có được đếm không) | Một phần |
| BR-14 | Upsale | Khách đến từ SKTQ, chỉ định thêm do bác sĩ Khoa Vú; **cộng riêng**, số do hành chính tổng hợp. Sửa một số upsale phải sửa lại bảng doanh thu | BC 16/11; nhóm xác nhận 17/11 | QS | Một phần |
| BR-15 | Chỉ định khác | Bác sĩ tự nhập: Tên bác sĩ, Ngày, Mã dịch vụ, Ngày làm, Tiền | BC 02/11 (giữ) | QS | Một phần |
| BR-16 | Lượt khám | Đếm có hẹn + không hẹn trên EMR: lọc *Hoàn thành khám*, rồi bỏ lọc để có cả lượt đến xem kết quả | BC 02/11 (giữ) | QS | Chưa |
| BR-17 | X-quang ngực thẳng | Trên Report chọn **tất cả các khoa** rồi lấy phần khoa mình | BC 31/10 (giữ) | QS | Chưa |
| BR-19 | Kỳ báo cáo | Thư ký làm phần lớn số liệu chiều thứ Bảy, hoàn thiện và dựng PPT thứ Hai, giao ban thứ Ba | BC 02/11, 16/11 | QS | Một phần (có chốt snapshot) |

## 4. Gói SLUT (bản hiện hành: BC 30/10, nhóm xác nhận là SLUT 1–4)

| Gói | Khám | Siêu âm | X-quang | MRI |
|---|:-:|:-:|:-:|:-:|
| SLUT 1 | ✓ | ✓ | | |
| SLUT 2 | ✓ | ✓ | ✓ | |
| SLUT 3 | ✓ | ✓ | | ✓ |
| SLUT 4 | ✓ | | ✓ | ✓ |

- Tên **SLUT**: nhóm hiểu là *sàng lọc ung thư* (PM/BA, 18/11). Báo cáo quan sát ghi "Gói 1–4" ("4 gói khám cơ bản", BC 30/10); tên gọi cần khoa xác nhận.
- Các gói lồng nhau (SLUT 1 nằm trong SLUT 2 và SLUT 3), nên khi chỉ định khớp nhiều gói cần quy tắc chọn gói. Hiện quầy chọn theo kinh nghiệm (BC 30/10).
- **Quy tắc trừ gói:** số lẻ của một dịch vụ trừ mọi gói SLUT có chứa dịch vụ đó, nếu tuần đó có khách dùng gói: siêu âm trừ SLUT 1, 2, 3; X-quang trừ SLUT 2, 4; MRI trừ SLUT 3, 4 (phần MRI do nhóm suy ra từ bảng gói, chưa được xác nhận). Thực tế quan sát phần lớn khách dùng SLUT 1, 2.
- Code mới có SLUT 1, SLUT 2 (+ SKTQ, gói khác). Cần thêm SLUT 3, SLUT 4 và dịch vụ MRI: [GAP_ANALYSIS.md L3](GAP_ANALYSIS.md).

## 5. Đơn vị đếm

Các slide đang dùng bốn đơn vị khác nhau mà không ghi rõ (BC 02/11, 03/11):

| Đơn vị | Nghĩa | Đang dùng ở (CXM) |
|---|---|---|
| Chỉ định | Mỗi dịch vụ được chỉ định là 1 | Can thiệp (CĐHA), upsale, bác sĩ lâm sàng |
| Ca đã làm | Chỉ định đã Completed | CV bác sĩ CĐHA |
| Lượt khám | Mỗi lần khách đến là 1 | Số lượt khám bác sĩ lâm sàng |
| Khách | Mỗi PID là 1 | Bảng tái khám |

**Report và OH khác nhau vì khác đơn vị đếm, không phải vì một bên sai** (BC 16/11): Report đếm theo mã chỉ định; OH gồm cả chỉ định trong gói tổng quát. Hai trang đang được dùng cho hai phần khác nhau (§3 BR-06c).

## 6. Yêu cầu nghiệp vụ cho ghi kết quả siêu âm (speech)

Bộ dữ liệu giả xây từ các yêu cầu này: [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md).

| ID | Yêu cầu / quan sát | Nguồn | Code |
|---|---|---|---|
| SP-01 | Bác sĩ đọc trong lúc tay thao tác đầu dò, không tự gõ được | BC 09/11 | Có (thu micro rảnh tay) |
| SP-02 | Lời đọc kết quả xen lời tư vấn, câu hỏi của khách, lời trấn an | BC 07/11, 10/11, 11/11, 12/11 | Chưa (chép tất cả) |
| SP-03 | **Trái/phải:** quy định **khám** bên trái trước (có bác sĩ khám phải trước do thuận tay); bác sĩ thường đọc trái trước. **Mẫu in** cố định phải trước, trái sau. Không dựa vào thứ tự đọc để gán bên | BC 04/11, 05/11, 18/11 | Chưa |
| SP-04 | Kết quả có 3 phần: **Kỹ thuật – Mô tả – Kết luận**. Mô tả theo câu mẫu cố định; tổn thương theo thứ tự: vị trí, khoảng cách núm vú, hồi âm, hình dạng, bờ, ranh giới, trục, kích thước. Có nhánh riêng cho ca đặc biệt (túi ngực) | BC 04/11; nhóm xác nhận 17/11 | Chưa (một ô tự do) |
| SP-05 | **Song ngữ Việt–Anh:** khách nước ngoài, khách VIP; yêu cầu có thể đến muộn; file Excel mẫu song ngữ khó tìm | BC 11/11, 12/11 | Chưa |
| SP-06 | Bác sĩ **soát và sửa** bản thư ký ghi trước khi in | BC 12/11 | Có (trạng thái chờ bác sĩ kiểm tra) |
| SP-07 | Thư ký ghi số trước, sửa câu sau; có khi ghi giấy rồi nhập lại; hoàn thiện form sau khi bác sĩ khám xong | BC 05/11, 07/11, 12/11 | Một phần |
| SP-08 | Báo cáo tạo trên HIS → kiểm tra trên Imaging → in có **chữ ký số** | BC 02/11 | Ngoài phạm vi (giữ điểm kiểm soát này) |
| SP-09 | Lời đọc có thể gồm **tiền sử** và **kết quả cũ từ bệnh viện khác** | BC 09/11, 12/11 | Chưa phân biệt |
| SP-10 | PACS lưu ảnh đầu và cuối, cho mốc thời gian siêu âm khách quan | BC 10/11 | Chưa (cần mentor cho phép) |
| SP-11 | OH sắp có **quick text** để điền nhanh | BC 04/11 | Rủi ro trùng: [RISK_ANALYSIS.md R09](RISK_ANALYSIS.md) |
| SP-12 | Máy siêu âm có AI tích hợp nhưng bác sĩ chưa dùng thành thạo | BC 09/11 | Ngoài phạm vi |

## 7. Quy tắc đã bị thay thế

| Quy tắc cũ | Nguồn | Thay bằng |
|---|---|---|
| Tổng = Ngoại trú (XN máu + Chỉ định khác + Chỉ định lẻ) + Nội trú | BC 02/11 15:55 | Tổng 4 phần (§1, BC 16/11) |
| Phạm vi: service line Khoa Vú hoặc bác sĩ Khoa Vú chỉ định/thực hiện | BC 31/10 | BR-02: dịch vụ vú tính cho Khoa Vú dù khoa nào chỉ định (BC 02/11); phạm vi theo danh mục dịch vụ, chữ "vú" chỉ là mẹo (PM/BA 18/11) |
| Chuyên khoa khác: gán theo bác sĩ thực hiện; chỉ ghi khi tên liên quan đến vú | BC 30/10, 31/10 | BR-13 phép trừ (BC 16/11) |
| SA lẻ = Tổng − Σ gói − SKTQ | BC 02/11 | BR-06a, trừ thêm chuyên khoa khác (BC 16/11) |
| Tổng SA lấy từ file phòng SA / lọc tay trên OH | BC 02/11 | BR-06 file Export OH theo máy, cột 4 nhóm (BC 16/11) |

## 8. Câu hỏi còn lại cho Trưởng khoa

1. Xác nhận bộ quy tắc hiện hành ở §1–§4 bằng phiếu [RULES_SIGNOFF.md](RULES_SIGNOFF.md).
2. Khi chỉ định khớp nhiều gói (gói lồng nhau) thì quầy chọn gói nào?
3. Tái khám tính "≥ 2 lượt" trong khoảng thời gian nào, ở khoa nào?
4. Đánh dấu danh mục dịch vụ vú trong [BREAST_SERVICES.md](BREAST_SERVICES.md): dịch vụ nào khoa tính?
5. Khi bill XN máu có một phần do BHXH chi trả, khoa tính phần nào: bỏ cả dòng xét nghiệm đó, hay chỉ tính phần khách tự trả? (BC 31/10)
6. File SKTQ: ca có BI-RADS cao nhất là 1 (bình thường) có được đếm vào số ca để tính doanh thu không, hay chỉ đếm từ BR2? Ca 4A, 4B có cùng đơn giá và đếm chung vào BR4 không? (BC 31/10)

Câu 5–6 lấy từ mục "Cần xác minh" của BC 31/10. Câu Unpaid của ngày trước (BC 31/10) đã có câu trả lời: vẫn tính (BR-10, PM/BA 18/11).
