# Speech Dataset Plan — Bộ dữ liệu giả cho ghi kết quả siêu âm vú

> Status: v1.1 · 18/11/2026 · Hướng đã chốt trong nhóm: dùng cấu trúc quan sát được ở phòng siêu âm để sinh mẫu kết quả giả, **người thân của nhóm** đọc và thu âm. Yêu cầu nghiệp vụ: [BUSINESS_RULES.md §6](BUSINESS_RULES.md). Chỉ số: [KPI_ROI.md §2](KPI_ROI.md).

> **Cập nhật 18/11 (chưa áp dụng vào nội dung bên dưới):** BC 18/11 *Cấu trúc kết quả siêu âm vú* đã có mẫu kết quả bình thường và đề xuất sửa kế hoạch này. Các thay đổi cần thống nhất với Tech Lead trước khi sửa. Kịch bản thu âm đã soạn ([thu-am/](thu-am/)) cũng khác kế hoạch ở một số điểm. Cả hai được liệt kê ở [§9](#9-chỗ-lệch-cần-thống-nhất).

## 1. Mục tiêu và giới hạn

**Mục tiêu:** có một bộ dữ liệu âm thanh + nhãn **hoàn toàn giả lập** để (1) đo độ chính xác của model trên lời đọc kết quả siêu âm vú, (2) thử cảnh báo bên vú, số đo, phủ định, BI-RADS, (3) nếu đủ, tinh chỉnh model.

**Không dùng:** giọng bác sĩ, giọng người bệnh, âm thanh ghi trong phòng khám, nội dung kết quả thật, ảnh chụp phiếu. Phù hợp quy định chương trình và câu trả lời bảo mật của chương trình: dữ liệu thật chỉ cấp ở gate cuối.

**Giới hạn phải ghi rõ khi báo cáo kết quả:** giọng người thân khác bác sĩ về tốc độ, độ quen thuật ngữ, cách đọc số và chữ viết tắt; không có tiếng máy, tiếng khách hỏi thật. Số đo trên bộ này là **chỉ báo**, không chứng minh độ chính xác lâm sàng.

## 2. Cấu trúc lấy từ quan sát

Chỉ lấy **cấu trúc và cách nói**, không lấy nội dung của ca nào (báo cáo quan sát không ghi nội dung kết quả). Từ vựng y khoa chung bổ sung từ Hướng dẫn BYT 3128 và BYT SL 2025. Hai hướng dẫn này không có mẫu câu kết quả siêu âm hay cách xếp BI-RADS, nên **không thay được** câu mẫu của khoa.

| Đặc điểm | Nguồn | Đưa vào bộ dữ liệu thế nào |
|---|---|---|
| Kết quả gồm 3 phần: **Kỹ thuật – Mô tả – Kết luận** | Nhóm, 17/11 | Mỗi mẫu có đủ 3 phần |
| Câu mẫu cho phần bình thường: nhu mô tuyến, nang, hạch trong tuyến, ống tuyến, dây chằng Cooper, hạch và khối vùng hố nách; "không thấy khối bất thường trong nhu mô tuyến" | BC 04/11 | Câu cố định, đọc nguyên văn |
| Tổn thương mô tả theo thứ tự: vị trí, khoảng cách đến núm vú, hồi âm, hình dạng, bờ, ranh giới, trục, kích thước | BC 04/11 | Slot sinh ngẫu nhiên theo đúng thứ tự (§4) |
| Nhánh ca đặc biệt (vd. có túi ngực) | BC 04/11 | ~5% mẫu |
| Bác sĩ đọc trái trước, mẫu in ghi phải trước | BC 04/11, 05/11 | Một phần mẫu đọc trái trước, nhãn chuẩn giữ đúng thứ tự in: kiểm tra model không đảo bên |
| Lời đọc xen tư vấn, câu hỏi của khách | BC 07/11, 10/11, 11/11, 12/11 | ~15% mẫu có câu chen, đánh nhãn `chen` để đo khả năng tách |
| Đọc tiền sử, kết quả cũ trước khi đọc kết quả mới | BC 09/11, 12/11 | ~10% mẫu có đoạn tiền sử, nhãn `tien_su` |
| Thư ký ghi số trước; số đo đọc nhanh | BC 05/11 | Đọc số theo nhiều cách: "mười hai nhân tám mi li mét", "12 nhân 8 li" |
| Nội dung hỏi tiền sử: bệnh vú trước đây, phương pháp can thiệp trước đó, tiền sử gia đình ung thư vú/buồng trứng, tình trạng kinh nguyệt | BYT 3128 §3.1 | Câu cho đoạn `tien_su` |
| Tên tổn thương lành tính hay gặp: u xơ tuyến vú, nang vú, biến đổi xơ nang, nang sữa, áp xe vú, hoại tử mỡ, u nhú trong ống dẫn sữa | BYT 3128 §3.3 | Từ vựng cho câu kết luận nháp; mentor duyệt cách khoa viết |
| Tiền sử làm tăng nguy cơ: người thân bậc 1 (mẹ, chị/em gái, con gái) mắc ung thư vú; mang đột biến gen (BRCA1/2…); từng mắc ung thư vú; có ung thư biểu mô tiểu thuỳ tại chỗ hoặc quá sản không điển hình; xạ trị vùng ngực từ 10 đến 30 tuổi | BYT SL 2025 §I.3.2, §III.2.4.1 | Câu cho đoạn `tien_su` (kịch bản hiện chưa có đoạn này) |
| Thang BI-RADS 0–6 và mật độ A–D; tổn thương thấy trên siêu âm: nang, u xơ tuyến, u mỡ, hạch; dấu hiệu nghi ngờ: bờ không đều, tua gai, vi vôi hoá, hạch vỏ dày, mất cấu trúc mỡ rốn hạch | BYT SL 2025 §III.3.5, §III.4.3, §VI.2 | Giá trị slot và từ vựng; BI-RADS 0 là mức có thật (kịch bản đang có 2 đoạn). Tổ hợp mô tả ↔ BI-RADS vẫn do bác sĩ duyệt (§4) |
| Ca đặc biệt có trong hướng dẫn: túi ngực (siêu âm được chỉ định khi X-quang bị hạn chế), nam giới có triệu chứng ở vú (sơ đồ 9), phụ nữ có thai và cho con bú (sơ đồ 13) | BYT SL 2025 §III.4.1, §V | Căn cứ giữ các nhánh túi ngực, nam giới, giãn ống tuyến sinh lý trong kịch bản |
| Song ngữ Việt–Anh | BC 11/11, 12/11 | Giai đoạn 2: cặp câu Việt–Anh cho phần kết luận |

## 3. Khung một mẫu kết quả

```
KỸ THUẬT
  <câu kỹ thuật theo mẫu khoa — chờ mentor cung cấp/duyệt>

MÔ TẢ
  Vú trái:  <nhu mô tuyến (mật độ)> . <câu bình thường | tổn thương 1..n> .
  Vú phải:  <nhu mô tuyến (mật độ)> . <câu bình thường | tổn thương 1..n> .
  Hố nách:  <câu bình thường | hạch ...> .

KẾT LUẬN
  <tóm tắt tổn thương theo bên> . BI-RADS <n> <bên> . <đề nghị: theo dõi / hẹn tái khám / chụp thêm>
```

Câu kỹ thuật và đề nghị lấy theo mẫu khoa đang dùng; nhóm chưa ghi nguyên văn, cần mentor đưa câu mẫu hoặc duyệt bản nhóm soạn.

## 4. Các slot và giá trị

Danh sách dưới đây là **bản nháp dùng thuật ngữ mô tả siêu âm vú phổ biến**; bác sĩ hoặc mentor tại khoa duyệt trước khi sinh dữ liệu.

| Slot | Giá trị gợi ý | Ràng buộc |
|---|---|---|
| Bên | vú phải, vú trái, hai bên | Luôn có trong kết luận |
| Vị trí | 1–12 giờ; trung tâm; sau quầng vú | |
| Khoảng cách núm vú | 0,5–8 cm | |
| Hồi âm | giảm âm, đồng âm, tăng âm, trống âm, hỗn hợp | |
| Hình dạng | bầu dục, tròn, không đều | |
| Bờ | đều, không đều, đa cung, tua gai | |
| Ranh giới | rõ, không rõ | |
| Trục | song song, không song song với bề mặt da | |
| Kích thước | a × b mm, 3–40 mm | a ≥ b |
| Hạch vùng | hố nách, thượng đòn | Khám hạch vùng theo BYT 3128 §3.1 |
| Mật độ mô tuyến | ít, trung bình, nhiều | Tiêu chí xếp chờ xác minh (BC 04/11) |
| BI-RADS | 1, 2, 3, 4 (4A/4B/4C), 5 | Phù hợp mô tả; bác sĩ duyệt bảng ràng buộc |
| Phủ định | "không thấy", "không có", "chưa phát hiện" | ≥ 30% mẫu có ít nhất một câu phủ định |

**Ràng buộc logic** (vd. nang trống âm bờ đều không xếp BI-RADS 5) do bác sĩ duyệt thành bảng; generator chỉ sinh tổ hợp hợp lệ. Mục đích là văn bản trông hợp lý khi đọc, **không** phải dạy model chẩn đoán.

## 5. Sinh dữ liệu

1. Viết generator (Python, chạy local) điền slot theo §4, ghép theo khung §3.
2. Mỗi mẫu xuất 3 thứ:
   - `doc_text`: văn bản người thân sẽ đọc (đã chia đoạn ≤ 25 giây mỗi đoạn, vì trang thu âm dừng ở 29 giây);
   - `label_text`: nhãn chuẩn sau khi người duyệt nghe lại (ghi đúng lời thực tế, kể cả ngập ngừng, tự sửa);
   - `slots.json`: bên, vị trí, kích thước, BI-RADS, phủ định… để chấm từng trường.
3. Phân bố đề xuất cho đợt 1:

| Loại mẫu | Tỷ lệ |
|---|---:|
| Bình thường hai bên | 25% |
| Một tổn thương | 40% |
| Nhiều tổn thương / hai bên | 20% |
| Ca đặc biệt (túi ngực…) | 5% |
| Có đoạn tiền sử | 10% (chồng lên các loại trên) |
| Có câu chen của "khách" | 15% (chồng lên các loại trên) |

Bộ 80 câu đơn trong `speech-training/cau-doc-gia-lap.csv` giữ làm **bài kiểm tra nhanh theo nhóm lỗi** (bên vú, phủ định, số đo…), chạy song song với bộ mẫu kết quả đầy đủ.

## 6. Thu âm

| Hạng mục | Quy định |
|---|---|
| Người đọc | Người thân của nhóm, 3–5 người, khác giới, khác tuổi, khác vùng miền nếu được |
| Đồng ý | Giấy đồng ý ngắn: mục đích, chỉ dùng trong dự án, không công khai, xoá khi kết thúc hoặc khi yêu cầu |
| Mã người đọc | `NT01`, `NT02`… không dùng tên thật trong file |
| Chuẩn bị | Người đọc được nghe/xem hướng dẫn cách đọc thuật ngữ (BI-RADS, đơn vị); không cần học thuộc |
| Thiết bị | Micro dự định dùng tại phòng siêu âm; ghi lại loại micro |
| Điều kiện | Yên tĩnh (chính); có quạt; có người thứ hai nói chen (đóng vai khách) |
| Tốc độ | Thường và nhanh tự nhiên |
| Công cụ | Trang `/speech-training.html` sẵn có; danh sách theo `manifest-mau.csv`; kiểm tra bằng `scripts/validate-speech-training.py` |
| Lưu trữ | Âm thanh lưu máy nhóm, **không đưa lên Git** hoặc nơi công khai |
| Quy mô đợt 1 | 40 mẫu × 3 người đọc ≈ 120 bản đọc, ~2 giờ âm thanh (ước tính ~60 giây/mẫu) |

## 7. Chia tập và đánh giá

- **Chia theo người đọc:** ít nhất một người đọc chỉ xuất hiện ở tập test. Không chia ngẫu nhiên các đoạn của cùng một người sang nhiều tập.
- Tập test không được dùng để tinh chỉnh.
- **Đợt 1 chỉ để đo, chưa tinh chỉnh model.** Với 3 người đọc và một người giữ riêng cho test, phần còn lại chỉ khoảng 80 bản đọc của 2 người: quá ít mẫu và quá ít giọng để tinh chỉnh có ý nghĩa. Chỉ cân nhắc tinh chỉnh khi đợt sau có thêm người đọc và mẫu.

| Chỉ số | Cách tính | Mục tiêu đợt 1 |
|---|---|---|
| WER, CER | Trên `label_text`, chuẩn hoá chữ thường, bỏ dấu câu | Ghi nhận, so model base và model lớn hơn |
| **Lỗi bên vú** | Bên trong bản chép ≠ `slots.json` | Đo tỷ lệ; cảnh báo phải bắt được 100% ca thiếu bên |
| Số đo + đơn vị | Đúng cả số và đơn vị | ≥ 90% |
| BI-RADS | Đúng mức | ≥ 95% |
| Phủ định | Không mất hoặc thêm từ phủ định | ≥ 95% |
| Câu chen | Bản chép có lẫn câu nhãn `chen` | Ghi nhận (model hiện không tách người nói) |
| Thời gian soát | Phút soát mỗi mẫu, so với gõ tay cùng mẫu theo bản thu | Ghi nhận. **Không so trực tiếp** với baseline thực địa ~10,5 phút/ca (khác người đọc, khác điều kiện); chỉ dùng làm chỉ báo |

## 8. Việc cần làm

| # | Việc | Ai | Hạn đề xuất |
|---|---|---|---|
| 1 | Xin câu mẫu phần Kỹ thuật, Kết luận/đề nghị; duyệt bảng slot và ràng buộc BI-RADS | Mentor tại khoa | 21/11 |
| 2 | Viết generator, sinh 40 mẫu đợt 1, tự đọc soát | Tech Lead | 22/11 |
| 3 | Soạn giấy đồng ý, hướng dẫn đọc 1 trang | PM/BA | 21/11 |
| 4 | Thu âm đợt 1 (3 người đọc) | Nhóm + người thân | 24/11 |
| 5 | Nghe lại, sửa `label_text`, kiểm tra manifest | Nhóm | 25/11 |
| 6 | Chạy đánh giá, báo cáo theo §7 | Tech Lead | 26/11 (sàng lọc 27/11) |
| 7 | Hỏi mentor có được nhờ một bác sĩ đọc 10 mẫu để so khác biệt giọng không | PM/BA | Sau đợt 1 |

**Phương án dự phòng** nếu đến 21/11 mentor chưa duyệt được câu mẫu và bảng slot (việc 1 chặn cả chuỗi 2–6):

1. Sinh đợt 1 từ bản slot nhóm soạn ở §4, gắn nhãn **"mẫu chưa duyệt"** trên mọi file và trong báo cáo.
2. Bỏ trống phần Kỹ thuật và câu đề nghị (chưa có câu mẫu của khoa); chỉ sinh phần Mô tả và Kết luận.
3. Báo cáo ở sàng lọc 27/11 chỉ các chỉ số ít phụ thuộc nội dung mẫu: WER/CER, lỗi bên vú, số đo + đơn vị, phủ định.
4. Khi có bản duyệt, sinh lại đợt 2 và ghi rõ hai đợt khác nhau ở đâu.

## 9. Chỗ lệch cần thống nhất

### 9.1. Đề xuất từ BC 18/11

Câu Kỹ thuật lấy theo mẫu khoa. Thêm trường "Thành phần tuyến vú" (tuýt A–D). Đưa mật độ mô tuyến lên phần chung. Đưa hố nách vào từng vú. Đổi thứ tự khung thành phải trước. Dùng 9 khung câu của khoa thay bảng slot §4. Bỏ BI-RADS 5 ở giai đoạn 1. Lời đọc chỉ gồm phần bất thường, đọc số kiểu "chấm", không đọc đơn vị. Nhãn có 2 lớp: bản chép đúng lời và form đầy đủ. Thêm mẫu không nói bên và mẫu đọc phải trước.

### 9.2. Kịch bản thu âm hiện có so với kế hoạch

| Hạng mục | Kế hoạch (§3–§6) | Kịch bản `thu-am/DOAN-DOC-THU-AM.csv` |
|---|---|---|
| Quy mô | 40 mẫu, ~60 giây/mẫu | 65 ca, 122 đoạn, ~25 phút đọc mỗi người |
| Phần Kỹ thuật | Chờ mentor; dự phòng: bỏ trống | 7 đoạn có câu Kỹ thuật, viết gần giống mẫu BC 18/11 nhưng không nguyên văn |
| Thứ tự bên | Một phần mẫu đọc trái trước | 9/10 ca có cả hai bên đọc phải trước |
| Câu chen (`chen`), tiền sử (`tien_su`) | ~15% và ~10% mẫu | Chưa có |
| BI-RADS | 1–5 | 0–5 (có 2 đoạn BI-RADS 0, 5 đoạn BI-RADS 5); có ca nam giới |
| Lời đọc | Đọc đủ mẫu | Đọc đủ câu, gồm cả câu bình thường (khác đề xuất BC 18/11: chỉ đọc phần bất thường) |
| Phủ định | ≥ 30% mẫu | 28/65 ca (43%): đạt |
| Đầu ra | `doc_text`, `label_text`, `slots.json` | Chỉ có câu đọc; chưa có `label_text`, `slots.json` |

