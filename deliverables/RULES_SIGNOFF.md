# Phiếu xác nhận quy tắc doanh thu — Khoa Vú

> Status: v1 · 18/11/2026 · Người xác nhận: Trưởng khoa. Nội dung lấy từ [BUSINESS_RULES.md](BUSINESS_RULES.md) §1–§5 (bản hiện hành), viết lại bằng lời thường để khoa đánh dấu nhanh. Thuật ngữ: [GLOSSARY.md](GLOSSARY.md).

**Vì sao cần khoa xác nhận:** đây là cách Khoa Vú tính doanh thu nội bộ (dịch vụ nào tính cho khoa, gói nào bị trừ, tuần nào ghi nhận). Đây không phải kiến thức y khoa chung, nên không tra được trên mạng hay trong sách. Nhóm ghi lại các quy tắc này khi quan sát thư ký và bác sĩ làm báo cáo (29/10–16/11). Công cụ chỉ được dùng một quy tắc để ra **số chính thức** sau khi Trưởng khoa xác nhận quy tắc đó.

**Cách điền:** mỗi dòng đánh dấu một ô: **Đúng** / **Sửa** (ghi cách đúng ở cột Ghi chú) / **Không áp dụng**. Dòng nào chưa chắc thì để trống, nhóm sẽ hỏi lại. Dòng có dấu **?** là câu hỏi mở: khoa trả lời ở cột Ghi chú.

## A. Cấu trúc tổng doanh thu

| # | Mã | Nhóm ghi nhận | Nguồn | Đúng | Sửa | Không áp dụng | Ghi chú của khoa |
|---|---|---|---|:-:|:-:|:-:|---|
| A1 | §1 | Tổng doanh thu = Ngoại trú + Nội trú + SKTQ + Upsale | BC 16/11 | ☐ | ☐ | ☐ | |
| A2 | §1 | Ngoại trú = XN máu + Chỉ định khác + Chỉ định lẻ + Chuyên khoa khác | BC 16/11 | ☐ | ☐ | ☐ | |
| A3 | BR-13 | Chuyên khoa khác = Tổng − (tầng 3 + SKTQ tầng 4, khu 7 tầng) | BC 16/11 | ☐ | ☐ | ☐ | |
| A4 | §1 | Ba cách tính tiền cùng cộng vào tổng: nội trú **sau trừ chi phí**; SKTQ = **số ca × đơn giá**; XN máu **theo bill, không tính phần BHXH** | BC 30/10, 31/10 | ☐ | ☐ | ☐ | |
| A5 | BR-14 | Upsale = chỉ định thêm cho khách SKTQ do bác sĩ Khoa Vú đưa ra; **cộng riêng**, số do hành chính tổng hợp, không nằm trong chỉ định lẻ | BC 16/11; nhóm 17/11 | ☐ | ☐ | ☐ | |

## B. Dịch vụ nào tính cho Khoa Vú

| # | Mã | Nhóm ghi nhận | Nguồn | Đúng | Sửa | Không áp dụng | Ghi chú của khoa |
|---|---|---|---|:-:|:-:|:-:|---|
| B1 | BR-02 | Dịch vụ thuộc **danh mục dịch vụ vú** thì tính cho Khoa Vú **dù khoa nào chỉ định**, sau khi trừ phần trong gói và SKTQ. Mẹo "tên có chữ vú" chỉ dùng để nhận ra dịch vụ | BC 02/11; nhóm 18/11 (danh mục) | ☐ | ☐ | ☐ | |
| B2 | BR-03 | Chỉ định do **bác sĩ IVF** ra thì **không** tính cho Khoa Vú | BC 02/11 | ☐ | ☐ | ☐ | |
| B3 | BR-04 | **Nhuộm hoá mô:** khoa nào thực hiện thì khoa đó hưởng | BC 31/10 (theo lời kể) | ☐ | ☐ | ☐ | |
| B4 | BR-13 | Khách do bác sĩ khoa khác khám: không VIP thì giải trình; VIP thì nhờ tầng thực hiện tra | BC 02/11, 16/11 | ☐ | ☐ | ☐ | |
| B5 | ? | Đánh dấu cột "Khoa tính?" trong danh mục [BREAST_SERVICES.md](BREAST_SERVICES.md) (127 dịch vụ lọc từ bảng giá công khai, gồm cả dịch vụ không có chữ "vú" như nạo vét hạch nách, hạch gác, CA 15-3, nhuộm ER/PR/HER2) | Bảng giá 03/04/2026 | | | | |

## C. Siêu âm, X-quang, SKTQ

| # | Mã | Nhóm ghi nhận | Nguồn | Đúng | Sửa | Không áp dụng | Ghi chú của khoa |
|---|---|---|---|:-:|:-:|:-:|---|
| C1 | BR-06 | Tổng siêu âm lấy từ **file Export OH theo máy ultrasound**; một cột trong file có sẵn 4 nhóm: tổng, SKTQ, OPD + IPD, pack OPD. File phòng siêu âm không làm nguồn chính | BC 16/11 | ☐ | ☐ | ☐ | |
| C2 | BR-06a | Siêu âm 2 bên lẻ = Tổng (OH) − SKTQ − Gói 1 − Gói 2 − Gói 3 (nếu có) − Chuyên khoa khác | BC 16/11; nhóm 17/11 | ☐ | ☐ | ☐ | |
| C3 | BR-06b | X-quang lẻ: trừ Gói 2 và Gói 4 (nếu có) | BC 02/11; nhóm 17/11 | ☐ | ☐ | ☐ | |
| C4 | BR-06c | Kiểm chéo SKTQ: **OH** cho tổng ca siêu âm nguồn SKTQ (giá SKTQ); **Report** cho chỉ định lẻ của khách SKTQ (giá Khoa Vú) | BC 16/11 | ☐ | ☐ | ☐ | |
| C5 | BR-12 | File SKTQ: hai file (tầng 4, khu 7 tầng), mỗi tháng một sheet. Mỗi khách một dòng, có cột BI-RADS cao nhất (thấp nhất là 1; BI-RADS 4 chia 4A, 4B). Siêu âm đếm theo BI-RADS 2, 3, 4, ≥ 5; X-quang có cột riêng cho khách ≥ 40 tuổi. Doanh thu = số ca × đơn giá | BC 31/10 | ☐ | ☐ | ☐ | |
| C6 | BR-17 | X-quang ngực thẳng: trên Report chọn **tất cả các khoa**, rồi lấy phần của khoa mình | BC 31/10 | ☐ | ☐ | ☐ | |
| C7 | ? | Ca có BI-RADS cao nhất là **1** (bình thường) có được đếm vào số ca SKTQ để tính doanh thu không, hay chỉ đếm từ BI-RADS 2? Ca 4A, 4B có đếm chung vào BI-RADS 4 không? | BC 31/10 | | | | |

## D. Gói khám

| # | Mã | Nhóm ghi nhận | Nguồn | Đúng | Sửa | Không áp dụng | Ghi chú của khoa |
|---|---|---|---|:-:|:-:|:-:|---|
| D1 | §4 | Khoa có 4 gói cơ bản. Gói 1: khám + siêu âm · Gói 2: khám + siêu âm + X-quang · Gói 3: khám + siêu âm + MRI · Gói 4: khám + X-quang + MRI. (Trong công cụ gọi là SLUT 1–4; nhóm hiểu SLUT = sàng lọc ung thư, đề nghị khoa xác nhận tên gọi) | BC 30/10 | ☐ | ☐ | ☐ | |
| D2 | §4 | Số lẻ của một dịch vụ trừ mọi gói có chứa dịch vụ đó, nếu tuần đó có khách dùng gói: siêu âm trừ Gói 1, 2, 3; X-quang trừ Gói 2, 4; MRI trừ Gói 3, 4 | Nhóm 17/11 (phần MRI: nhóm suy ra từ bảng gói) | ☐ | ☐ | ☐ | |
| D3 | ? | Khi bộ chỉ định khớp nhiều gói cùng lúc (Gói 1 nằm trong Gói 2 và Gói 3), quầy chọn gói nào? | BC 30/10 | | | | |

## E. Nội trú, xét nghiệm máu, lượt khám

| # | Mã | Nhóm ghi nhận | Nguồn | Đúng | Sửa | Không áp dụng | Ghi chú của khoa |
|---|---|---|---|:-:|:-:|:-:|---|
| E1 | BR-09 | Nội trú: DT = Tổng − giường − dược − VTTH thường − VTTH y tế. Tính vào **tuần ra viện**; khách còn nằm viện chuyển sang tuần sau. Khoảng lọc 7:00 thứ Hai – 23:59 Chủ nhật | BC 31/10, 02/11, 03/11, 16/11 | ☐ | ☐ | ☐ | |
| E2 | BR-08 | XN máu: lấy tiền xét nghiệm, không cộng phần BHXH; bill xem ở Payments, không có thì xem ở Charges; nhiều bill thì cộng | BC 31/10 | ☐ | ☐ | ☐ | |
| E3 | BR-10 | Dòng **Unpaid** trên Report vẫn được tính vào số lượng và doanh thu. Ca Unpaid của ngày cuối tuần: kiểm tra eForm khách đang trong lượt khám | BC 31/10; nhóm 18/11 | ☐ | ☐ | ☐ | |
| E4 | BR-11 | **Phiếu khám** không tính vào số liệu cận lâm sàng | BC 03/11 | ☐ | ☐ | ☐ | |
| E5 | BR-07 | Khách có **≥ 2 lượt khám** là tái khám, áp giá tái khám; đếm theo từng bác sĩ | BC 02/11, 16/11 | ☐ | ☐ | ☐ | |
| E6 | ? | Tái khám "≥ 2 lượt" tính trong khoảng thời gian nào, ở khoa nào? | BC 02/11 | | | | |
| E7 | BR-15 | Chỉ định khác: bác sĩ tự nhập Tên bác sĩ, Ngày, Mã dịch vụ, Ngày làm, Tiền | BC 02/11 | ☐ | ☐ | ☐ | |
| E8 | BR-16 | Lượt khám: đếm cả có hẹn và không hẹn trên EMR; lọc *Hoàn thành khám*, rồi bỏ lọc để lấy cả lượt đến xem kết quả | BC 02/11 | ☐ | ☐ | ☐ | |
| E9 | BR-19 | Lịch làm báo cáo: phần lớn số liệu làm chiều thứ Bảy; hoàn thiện và dựng PPT thứ Hai; giao ban sáng thứ Ba | BC 02/11, 16/11 | ☐ | ☐ | ☐ | |
| E10 | ? | Khi bill XN máu có một phần do BHXH chi trả, khoa tính phần nào: **bỏ cả dòng** xét nghiệm đó, hay **chỉ tính phần khách tự trả**? | BC 31/10 | | | | |

## F. Nguồn số liệu và đơn vị đếm

| # | Mã | Nhóm ghi nhận | Nguồn | Đúng | Sửa | Không áp dụng | Ghi chú của khoa |
|---|---|---|---|:-:|:-:|:-:|---|
| F1 | §5 | Report và OH ra số khác nhau vì **đếm khác đơn vị** (Report theo mã chỉ định; OH gồm cả chỉ định trong gói tổng quát), không phải vì một bên sai | BC 16/11 | ☐ | ☐ | ☐ | |
| F2 | ? | Mỗi bảng/slide dùng đơn vị nào: chỉ định, ca đã làm, lượt khám hay khách? | BC 02/11, 03/11 | | | | |
| F3 | ? | Với từng chỉ số, nguồn nào là nguồn chính thức (Report, OH hay máy), và chốt số lúc nào? | BC 02/11, 16/11 | | | | |

## Xác nhận

| | |
|---|---|
| Số dòng **Đúng** / **Sửa** / **Không áp dụng** / để trống | ___ / ___ / ___ / ___ |
| Phiên bản sau xác nhận | Danh mục quy tắc **v1**, hiệu lực từ ngày ___/___/2026 |
| Trưởng khoa (ký, ghi rõ họ tên) | |
| Ngày | |
| Đại diện nhóm TC-14 | |

Sau khi có phiếu đã ký, nhóm cập nhật cột **Xác minh** trong [BUSINESS_RULES.md](BUSINESS_RULES.md), chỉ số K7 trong [KPI_ROI.md](KPI_ROI.md) và điều kiện C2 trong [USER_TEST_PLAN.md](USER_TEST_PLAN.md). Dòng nào được đánh "Sửa" thì đưa bản cũ vào BUSINESS_RULES §7 để truy vết.
