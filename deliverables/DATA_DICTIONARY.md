# Data Dictionary — File nguồn và trường dữ liệu

> Status: v2 · 19/11/2026 · Nguồn: T2 (trường cần giả lập), báo cáo ngày, và schema nhập của code (`importSchema.mjs`, `ingestion.py`). Mọi dữ liệu trong repo là giả lập.

## 1. File đầu vào

Công cụ nhận **hai loại file Export**. Từ mỗi file chỉ lọc các cột cần cho báo cáo; các cột khác bỏ qua.

| # | File | Dùng cho | Cột cần lọc | Ghi chú | Nguồn |
|---|---|---|---|---|---|
| E1 | **Export từ OH** (theo máy ultrasound / Procedure, khoảng một tuần) | Tổng siêu âm; CV bác sĩ CĐHA; phép trừ SKTQ, gói | Ngày, mã/tên Procedure, bác sĩ thực hiện, trạng thái, **cột nhóm khách** (4 giá trị: tổng, SKTQ, OPD + IPD, pack OPD) | Cột nhóm khách có sẵn trong file, không phải tự tính. OH gồm cả chỉ định trong gói tổng quát | BC 02/11, 16/11 |
| E2 | **Export từ trang Report** (chi tiết chỉ định theo bệnh nhân) | Chỉ định lẻ, CV bác sĩ lâm sàng, chuyên khoa khác, chỉ định lẻ của khách SKTQ | Ngày, mã/tên dịch vụ, khoa chỉ định, bác sĩ chỉ định, số lượng, giá, Paid/Unpaid | Report đếm theo mã chỉ định | BC 31/10, 16/11 |

Số liệu **không có trong hai file trên** được nhập riêng, ghi ngày nhận và người gửi (FR-11):

| # | Số liệu | Ai cung cấp | Nguồn |
|---|---|---|---|
| M1 | File SKTQ tầng 4, khu 7 tầng (BI-RADS, X-quang, X-quang ≥ 40 tuổi) | Bộ phận SKTQ | BC 31/10, 16/11 |
| M2 | Upsale | Hành chính | BC 16/11 |
| M3 | Chỉ định khác (Tên bác sĩ, Ngày, Mã dịch vụ, Ngày làm, Tiền) | Bác sĩ tự nhập | BC 02/11 |
| M4 | Nội trú (tổng, giường, dược, VTTH thường, VTTH y tế; ngày ra viện) | Thư ký tra bill | BC 31/10, 02/11 |
| M5 | XN máu (tiền xét nghiệm, phần BHXH) | Thư ký tra bill | BC 31/10 |

### Bộ dữ liệu giả lập hiện có

| File | Nội dung | Nguồn |
|---|---|---|
| `DATA_KHOAVU_GIALAP_SO_LIEU.xlsx` | 2.700 dòng chỉ định, 87 dịch vụ; 9 sheet (CANONICAL, DANH_MUC_DV, RAW_NGUON, GIAO_DICH, GOI_PHAN_BO, NHAN_CHUAN, MAU_MAPPING, BAO_CAO_DV, THAM_CHIEU_TUAN). Mã khách, mã dịch vụ, giá đều giả lập | GATE1; `data_gialap/` |
| `CHI_DINH_LIEN_KHOA.csv`, `KET_QUA_TRA_VE_KHOA_VU.csv`, `KET_LUAN_BENH_AN_KHOA_VU.csv` | Dữ liệu giả lập ngày 30/10: chỉ định liên khoa, kết quả trả về, kết luận | `data_gialap/` |
| `ket-qua.csv` | Kết quả kiểm thử speech: 486 đoạn giọng máy, câu chuẩn, bản nhận dạng, số từ sai, từ khoá bị mất (bên vú, phủ định…) | KQ 15/11 |
| Bảng giá công khai VMTC (T1/2026) | Có trong `tailieu/`; code hiện **chưa dùng**. Repo cũ từng dùng bảng giá công khai làm giá giả lập (GĐ-04) | `tailieu/` |

## 2. Trường chuẩn hoá (lớp Nhập)

Mỗi dòng là một lượt dịch vụ. Tên trường theo code hiện tại.

| Trường | Kiểu | Ý nghĩa | Bắt buộc | Nhạy cảm | Ghi chú |
|---|---|---|---|---|---|
| `order_id` | chuỗi | Mã chỉ định (khoá dòng) | Có | Thấp | |
| `his_order_id` | chuỗi | Mã chỉ định trên HIS | Không | Thấp | |
| `visit_id` | chuỗi | Mã lượt khám | Có | Trung bình | Đếm lượt |
| `patient_id` | chuỗi | PID | Có | **Cao** | Chỉ dùng làm khoá; giả lập bằng mã ngẫu nhiên; không đưa lên slide |
| `service_code`, `service_name` | chuỗi | Dịch vụ | Có | Thấp | `service_code` đối chiếu danh mục dịch vụ vú (BR-02, [BREAST_SERVICES.md](BREAST_SERVICES.md)); chữ "vú" trong tên chỉ để gợi ý |
| `ordering_dept`, `performing_dept` | chuỗi | Khoa chỉ định, khoa thực hiện | Có | Thấp | Code phân loại theo cặp này |
| `ordering_doctor_id/_name`, `performing_doctor_id/_name` | chuỗi | Bác sĩ chỉ định, thực hiện | Không | Trung bình | Cần cho BR-03 (IVF), CV bác sĩ |
| `ordered_at`, `completed_at`, `result_returned_at` | ngày giờ | Mốc chỉ định, hoàn thành, trả kết quả | `completed_at` có | Thấp | DN12: tách ngày chỉ định/hoàn thành |
| `business_date` | ngày | Ngày gán kỳ báo cáo | Có | Thấp | Quy ước điểm cắt: BR-19 |
| `status` | mã | Trạng thái (vd. `HOANTHANH`) | Có | Thấp | Chỉ dòng hoàn thành vào doanh thu |
| `price_mode` | mã | `MUALE`, `TRONGGOI`, `THEMNGOAIGOI` | Có | Thấp | |
| `package_id`, `package_name` | chuỗi | Gói | Khi trong gói | Thấp | Ánh xạ SKTQ, SLUT 1–4 (code mới có SLUT 1–2) |
| `patient_group` | mã | Nhóm khách theo cột OH: tổng, SKTQ, OPD + IPD, pack OPD | E1 | Thấp | Cần thêm vào code (BR-06) |
| `completed_qty` | số | Số lượng đã làm | Có | Thấp | |
| `unit_price_vnd` | số | Đơn giá | Có | Thấp | Giá giả lập, chờ khoa xác nhận |
| `gross_order_vnd`, `completed_gross_vnd` | số | Giá trị trước giảm (chỉ định / thực hiện) | Có | Thấp | Hai góc nhìn, không cộng với nhau |
| `discount_vnd`, `package_allocation_vnd`, `completed_net_vnd` | số | Giảm giá, phân bổ gói, sau giảm | Không | Thấp | |
| `material_cost_vnd`, `drug_cost_vnd` | số | Chi phí trừ (nội trú) | Nội trú | Thấp | Còn thiếu giường, VTTH thường/y tế tách riêng |
| `encounter_type` | mã | `NOITRU` / ngoại trú | Nội trú | Thấp | Không suy nội trú từ khoa chỉ định |
| `in_snapshot` | 0/1 | Dòng thuộc snapshot đã chốt | Hệ thống | — | |
| `sheet_name`, `ingested_at` | — | Truy vết nguồn | Hệ thống | — | |

### Trường cần bổ sung theo báo cáo

| Trường đề xuất | Lý do | Nguồn |
|---|---|---|
| `payment_status` (Paid/Unpaid) | BR-10: Unpaid vẫn tính vào số lượng và doanh thu; lý do Report và OH lệch | BC 31/10, 02/11; PM/BA 18/11 |
| `is_revisit` (tái khám) | BR-07, giá khác | BC 02/11 |
| `patient_source` (PK Vú / chuyên khoa khác / SKTQ) | Slide CLS tầng 3, chuyên khoa khác | BC 02/11 |
| `performing_location` (tầng 3 / tầng 4 / khu 7 tầng) | SKTQ, chuyên khoa khác = Tổng − (tầng 3 + SKTQ) | BC 16/11 |
| `is_vip` | Xử lý ca bác sĩ khoa khác khám | BC 02/11 |
| `admit_at`, `discharge_at` | Nội trú tính tuần ra viện | BC 02/11 |
| `upsale_origin_service` | Upsale phát sinh từ siêu âm (X-quang ≥ 40 tuổi) | BC 12/11, 16/11 |
| `slide_group` (danh mục) | Ghép mã → nhóm slide BSLS, phẫu thuật–can thiệp | BC 02/11 |
| `count_unit` (danh mục) | Chỉ định / ca / lượt / khách | BC 02/11, 03/11 |

## 3. Dữ liệu speech

| Dữ liệu | Lưu ở đâu | Nhạy cảm | Ghi chú |
|---|---|---|---|
| Âm thanh | Chỉ trong RAM khi nhận dạng | **Cao** | Không ghi đĩa; mất khi đóng tab nếu chưa chép |
| Định danh ca (PID, mã lượt, mã chỉ định, bác sĩ) | IndexedDB trình duyệt | **Cao** | Không đồng bộ, không phân quyền |
| Bản chép, lời nhận dạng gốc | IndexedDB | **Cao** (dữ liệu sức khoẻ) | NĐ 13/2023/NĐ-CP |
| Mốc giờ (bắt đầu, soát, hoàn thành, kiểm tra) | IndexedDB | Thấp | Theo đồng hồ máy |
| Bộ dữ liệu giả: văn bản mẫu kết quả | Repo (`speech-training/`) | Thấp | Sinh từ cấu trúc quan sát, giá trị ngẫu nhiên, không có ca thật |
| Bộ dữ liệu giả: bản thu giọng người thân | Ngoài Git, lưu máy nhóm | Trung bình (giọng nói là dữ liệu cá nhân) | Có giấy đồng ý; không công khai: [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md) |

## 4. Quy tắc bảo mật dữ liệu

- Theo quy định chương trình: giai đoạn này chỉ dùng dữ liệu giả lập hoặc công khai.
- Bệnh hiếm, nhóm rất nhỏ có thể làm lộ danh tính: gộp hoặc ẩn nhóm dưới 5 ca khi báo cáo ra ngoài khoa (BC 30/10).
