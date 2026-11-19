# Gap Analysis — Báo cáo, đề xuất và code giống/khác nhau ở đâu

> Status: v1.1 · 19/11/2026 · Đối chiếu ba lớp: (1) quan sát trong báo cáo ngày, (2) đề xuất ĐX 30/10 và các báo cáo tuần, (3) mã nguồn tại `a03239e` (logic tính toán không đổi so với `c352f04`). Quy tắc chi tiết: [BUSINESS_RULES.md](BUSINESS_RULES.md).

## 1. Tóm tắt

| Mức | Số điểm | Ý nghĩa |
|---|---:|---|
| Khớp | 10 | Code đã làm đúng điều báo cáo ghi nhận |
| Lệch | 6 | Code làm khác điều báo cáo ghi nhận; có thể ra số sai |
| Thiếu | 12 | Báo cáo đã ghi nhận nhu cầu, code chưa có |
| Vượt phạm vi | 4 | Code có, nhưng báo cáo gần đây đã thu hẹp hoặc hoãn |

Kết luận: phần **khung** (nhập, truy vết, chốt số, đối soát, xuất file) khớp tốt với nhu cầu. Phần **quy tắc** và **mẫu đầu ra** lệch nhiều nhất, vì quy tắc thật được ghi nhận dần từ 31/10 đến 16/11, sau khi code đã định hình.

## 2. Khớp

| # | Nhu cầu (nguồn) | Code |
|---|---|---|
| K1 | Tách nhập liệu – danh mục – báo cáo (BC 30/10, T2) | Kho nguồn, cấu hình quy tắc/giá, báo cáo tách riêng |
| K2 | Mỗi dòng một lượt dịch vụ, truy ngược được (BC 30/10, 04/11) | Lưu dòng gốc, file/sheet nguồn, xem nguồn từng số |
| K3 | Chốt số trước khi lên slide; số không bị sửa sau khi chốt (BC 02/11, 03/11) | Snapshot, khoá phiên bản, lịch sử sửa có lý do |
| K4 | Bóc tách gói: SA trừ SLUT 1–2, XQ trừ SLUT 2, trừ SKTQ (BC 02/11) | Bóc tách SKTQ/SLUT 1/SLUT 2/CK lẻ có giá riêng |
| K5 | Phát hiện trùng, thiếu, dòng nghi ngờ (BC 03/11 tiểu phẫu 2 vs 1) | SHA-256 chống nhập trùng file; cách ly dòng nghi trùng/thiếu căn cứ |
| K6 | Quy tắc chưa rõ thì để đối soát, không tự đoán (T2, ĐXN 16/11) | `PENDING_RULES` liệt kê 6 nhóm quy tắc chờ khoa xác nhận |
| K7 | Một chiều Excel → PPT, cùng nguồn đã chốt (BC 02/11) | Xuất Excel và PPT từ cùng snapshot |
| K8 | Phân quyền, biết ai sửa gì (BC 31/10 mục 8) | Đăng nhập, vai trò admin/chỉ xem, nhật ký thao tác |
| K9 | Không chạm hệ thống, không gửi dữ liệu ra ngoài (KB 27/10, quy định chương trình) | Chạy local, không API AI bên ngoài |
| K10 | Speech: bác sĩ soát–sửa trước khi dùng (BC 12/11) | Trạng thái "Chờ bác sĩ kiểm tra"; giữ lời nhận dạng gốc |

## 3. Lệch — cần sửa trước khi đo thử

| # | Báo cáo ghi nhận | Code đang làm | Hệ quả | Ưu tiên |
|---|---|---|---|---|
| L1 | Phạm vi hiện hành: danh mục dịch vụ vú ([BREAST_SERVICES.md](BREAST_SERVICES.md), BR-02; mẹo chữ "vú" chỉ để gợi ý dòng mới), loại bác sĩ IVF (BR-03), nhuộm hoá mô theo khoa thực hiện (BR-04) | Theo cặp khoa chỉ định–thực hiện; chỉ tính khi khoa chỉ định là Vú | Bỏ sót ca khoa khác chỉ định dịch vụ vú; không áp được IVF | Cao |
| L2 | Tổng doanh thu 4 phần: ngoại trú, nội trú, SKTQ, upsale; chuyên khoa khác = Tổng − (tầng 3 + SKTQ) (BC 16/11) | Tổng theo "giá × số lượng đã cấu hình" trên dòng nhập | Tổng không cùng cấu trúc slide 2 | Cao |
| L3 | 4 gói SLUT 1–4; SLUT 3–4 có MRI (BC 30/10) | Chỉ có SKTQ, SLUT 1, SLUT 2, "gói khác" | SLUT 3–4 và MRI trong gói bị tính như lẻ | Trung bình |
| L4 | Nội trú tính tuần ra viện; khách còn nằm chuyển tuần sau (BC 02/11, 03/11) | Lọc theo ngày hoàn thành | Có thể lệch kỳ, đúng loại lỗi bị hỏi ở giao ban 03/11 | Trung bình |
| L5 | Mẫu PPT thật ~9 slide: doanh thu, SKTQ, upsale, BSLS, lượt khám BSLS, CLS tầng 3, phẫu thuật–can thiệp, CV CĐHA, slide cố định (BC 02/11) | 8 slide: tổng quan, chi tiết dịch vụ, doanh thu, phân loại, đối soát, nghiệp vụ chờ xác nhận | Thư ký vẫn phải tự làm slide giao ban; chưa giảm được 167 phút | Cao |
| L6 | SA lấy OH làm gốc; file Export OH có sẵn một cột 4 nhóm: tổng, SKTQ, OPD + IPD, pack OPD (BC 16/11) | Chưa đọc cột nhóm khách này | Không dùng được file đầu vào ổn định nhất | Trung bình |

## 4. Thiếu

| # | Nhu cầu | Nguồn |
|---|---|---|
| T1 | Dòng "ca chuyển kỳ" nội trú + danh sách nhắc tuần sau | BC 03/11 |
| T2 | Ô "ghi chú biến động" trên slide khi số tăng/giảm rõ | BC 03/11 |
| T3 | Ghi đơn vị đếm (chỉ định / ca / lượt / khách) trên mỗi bảng và slide | BC 02/11, 03/11 |
| T4 | Bảng đối chiếu nguồn mỗi tuần: Report \| OH \| Máy \| Chênh lệch \| Lý do | BC 02/11 |
| T5 | Bảng "Ca ngoại lệ" (bác sĩ khoa khác, VIP, đã giải trình) | BC 02/11 |
| T6 | Sheet "số nhận từ bên ngoài" (SKTQ, upsale) có ngày nhận, người gửi, đối chiếu OH | BC 16/11 |
| T7 | Danh mục ghép mã → nhóm cho slide 5 (BSLS) và slide 8 (phẫu thuật–can thiệp) | BC 02/11 |
| T8 | Tính tái khám (≥ 2 lượt), bước tốn 13–23 phút | BC 02/11, 16/11 |
| T9 | Trạng thái "đã nộp" của từng bên (bác sĩ nhập chỉ định khác, lượt khám, sự cố) | BC 02/11, 16/11 |
| T10 | Speech: cảnh báo khi kết luận thiếu "vú phải/vú trái/hai bên"; xử lý thứ tự trái/phải | BC 04/11, 05/11 |
| T11 | Speech: khung theo câu mẫu và thứ tự trường mô tả tổn thương | BC 04/11 |
| T12 | Speech: song ngữ (bảng thuật ngữ Việt–Anh do bác sĩ duyệt, gợi ý cặp câu) | BC 11/11, 12/11 |

## 5. Vượt phạm vi hiện tại

| # | Code có | Báo cáo nói | Đề xuất |
|---|---|---|---|
| V1 | Hành trình người bệnh liên khoa, luồng phòng (`journeys/`, `patients/`) | BC 05/11: dự án đã thu hẹp vào chuẩn hoá Excel tuần và slide giao ban; luồng tiếp đón/khám ngoài phạm vi (BC 03/11, 04/11) | Ẩn khỏi bản demo, ghi là hướng sau |
| V2 | Speech hoàn chỉnh (thu, chép, lưu, kết quả) | BC 10/11, 16/11 ghi speech "chưa ưu tiên"; nay nhóm đã chốt làm tiếp (check trùng: trùng một phần, được tiếp tục) | Không còn vượt phạm vi; bổ sung bộ dữ liệu giả: [SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md) |
| V3 | Trang thu mẫu giọng (`speech-training`) | Ghi âm bác sĩ/người bệnh cần đồng ý (quy định chương trình) | Dùng để người thân đọc mẫu giả, có giấy đồng ý; đổi mã người đọc `BS01` → `NT01` |
| V4 | Web app nhiều cổng, Node + Python | Báo cáo 02/11, 16/11 đề xuất nhiều việc làm ngay trong Excel (Paste Link, SUMIFS, Freeze Panes, bảng nhật ký upsale) | Tách hai lớp đề xuất: "làm ngay trong Excel" và "công cụ của nhóm" |

## 6. Đề xuất ban đầu ĐX 30/10 so với hiện tại

| Hạng mục ĐX 30/10 | Hiện tại | Ghi chú |
|---|---|---|
| Web demo deploy online, Next.js/FastAPI/PostgreSQL | Local, React + Node/SQLite + Python | Đổi để không cần hạ tầng ngoài và không gửi dữ liệu |
| AI agent LangGraph, multi-agent, RAG, Langfuse | Không có LLM; phân loại Naive Bayes theo cặp khoa | ĐX 30/10 §13 tự đối chiếu với "8 tiêu chí chấm" (agent, multi-agent, RAG, phân tích kinh doanh, hạ tầng, an toàn, đánh giá, trình bày); chưa thấy văn bản gốc của chương trình. Cần hỏi mentor tiêu chí chấm hiện hành |
| HIS mô phỏng FHIR | Không | — |
| App theo dõi trạng thái khám (N1) | Có một phần (luồng phòng) | Đã ra ngoài phạm vi (V1) |
| Khuyến nghị Excel cho khoa (B1–B7) | Báo cáo ngày tiếp tục đề xuất | Chưa thành một tài liệu bàn giao cho khoa |

## 7. Mâu thuẫn giữa các báo cáo

| # | Nội dung | Báo cáo A | Báo cáo B | Cách xử lý |
|---|---|---|---|---|
| M1 | Phạm vi doanh thu | Service line / bác sĩ Vú (31/10) | Dịch vụ vú tính cho Khoa Vú dù khoa nào chỉ định; thư ký nhận ra bằng mẹo chữ "vú" (02/11) | **Đã xử lý:** dùng bản 02/11; phạm vi theo danh mục dịch vụ ([BREAST_SERVICES.md](BREAST_SERVICES.md)), chờ khoa duyệt |
| M2 | Tổng doanh thu | Ngoại trú + nội trú (02/11) | 4 phần gồm SKTQ, upsale (16/11) | **Đã xử lý:** dùng bản 16/11; còn xác minh upsale |
| M3 | SA 2 bên lẻ | Trừ gói và SKTQ (02/11) | Trừ thêm chuyên khoa khác (16/11) | **Đã xử lý:** dùng bản 16/11 |
| M4 | Thời gian báo cáo | ~290 phút (T2) | Kéo dài 2 ngày, gồm cuối tuần (16/11) | Đo lại bằng nhật ký thời gian liên tục |
| M5 | Tầng của phòng siêu âm 04/11 | Tiêu đề "Khoa Vú" | Thân bài "tầng 4, cần xác minh" | Sửa báo cáo gốc |
| M6 | Số đo speech | Đoạn đọc–ghi (09/11, 10/11) | Cả lượt (04/11), khám xong → in (11/11) | Thống nhất mốc đo |
| M7 | Kết quả check trùng | Đánh giá theo dự án gộp; phần trùng là speech | Đề tài doanh thu cũng mang nhãn trùng | **Đã xử lý:** đúng theo dự án gộp. Khi trình bày, tách rõ hai module và giá trị riêng |
| M8 | Trạng thái prototype | "Chưa làm bản thử" (T2, 12/11) | Code dashboard có từ 11/11; `prototype-local-v8` ghi model 31/10 | Trình bày trung thực mốc thời gian với mentor |
| M9 | Nội dung báo cáo 07/11 | Tiêu đề "Nghiệm thu giao ban" | Thân bài là quan sát phòng siêu âm, ghi "hôm nay không quan sát giao ban" | Sửa tiêu đề báo cáo gốc |

## 8. Thứ tự sửa đề xuất

1. L1 + L2 + L6: phạm vi BR-02/03/04, tổng 4 phần, đọc cột nhóm khách trong Export OH (quy tắc hiện hành đã đủ để sửa).
2. L5 + T7 mẫu PPT đúng 9 slide thật → mục tiêu trực tiếp giảm 167 phút.
3. L3 thêm SLUT 3–4; T6 số nhận từ bên ngoài.
4. T1–T3 chuyển kỳ, ghi chú biến động, đơn vị đếm → 3 điểm bị hỏi ở giao ban 03/11.
5. Speech: bộ dữ liệu giả ([SPEECH_DATASET_PLAN.md](SPEECH_DATASET_PLAN.md)), rồi T10 cảnh báo bên vú, T11 khung Kỹ thuật – Mô tả – Kết luận.
