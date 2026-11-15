# Dashboard Khoa Vú · VMTC-KHOA-VU

Dashboard nội bộ để nhập và đối soát dịch vụ, tính doanh thu theo phạm vi Khoa Vú, lập báo cáo giao ban và chép lời đọc kết quả siêu âm. Giao diện hồng phấn và trắng; xử lý local, không cần khóa API AI.

**Bản hiện tại: v8 · cập nhật 15/11/2026.** Mã nguồn đang dùng nằm ngay tại thư mục gốc repository. `prototype-local-v8/` là bản lịch sử, không phải nơi chạy hoặc phát triển bản hiện tại.

## Chức năng

- **Tổng quan, chi tiết và biểu đồ:** lọc theo ngày/khoảng ngày, xem số lượng và giá trị dịch vụ, chọn cột, truy nguồn từng dòng, sửa có lý do và lưu lịch sử.
- **Nhập Excel/CSV hoặc thư mục:** đọc nhiều sheet, xem trước rồi xác nhận nhập; loại file trùng bằng SHA-256, đối chiếu dòng và cách ly dữ liệu nghi trùng hoặc thiếu căn cứ. Bảng đã nhập được lưu để tiếp tục chỉnh trên dashboard.
- **AI phân loại doanh thu local:** học từ cặp khoa chỉ định/khoa thực hiện đã được xác nhận. Phạm vi báo cáo là **dịch vụ do Khoa Vú chỉ định, kể cả khoa khác thực hiện**. Nhãn chưa rõ phải đối soát; không tự tính tiền theo tên file.
- **Bóc tách dịch vụ/gói:** khám, siêu âm, X-quang 2D/3D; SKTQ, SLUT 1, SLUT 2 và CK/lẻ có giá riêng cấu hình trên dashboard.
- **Báo cáo:** đối soát, chốt snapshot, tạo/gửi/duyệt báo cáo, xuất Excel theo mẫu và PowerPoint từ cùng nguồn đã chốt; có lịch sử thao tác.
- **Đọc kết quả siêu âm:** bấm Bắt đầu để thu micro và hiện chữ trong lúc đang đọc; Dừng để chép nốt, soát/sửa và hoàn thành ca. Có nháp tự lưu, xem kết quả theo ngày và xác nhận kiểm tra nội dung.

Kho mới bắt đầu trống. Dữ liệu và giá tham khảo đi kèm mã nguồn là dữ liệu kiểm thử, không phải dữ liệu hoặc bảng giá đã được bệnh viện xác nhận.

## Cài từ GitHub

Yêu cầu **Node.js 22.14 trở lên**, npm; **Python 3.12** nếu dùng speech. Dùng Chrome/Edge tại địa chỉ local để cấp quyền micro. Internet cần cho lần cài thư viện/model; sau khi cài đủ, xử lý dữ liệu và nhận giọng nói chạy trên máy.

```powershell
git clone https://github.com/nan-bi/VMTC-KHOA-VU.git
cd VMTC-KHOA-VU
npm ci
npm run build
```

Git không đóng gói `dist/`, `node_modules/`, model hoặc môi trường Python. **Phải build sau khi clone**; không mở `index.html` bằng cách nhấp đúp.

### Chạy dashboard

```powershell
node backend/manage.mjs create-user
npm run backend
```

Mở **http://127.0.0.1:4180/**. Khi tạo tài khoản quản trị, chọn vai trò admin và mật khẩu từ 12 ký tự. Tài khoản/mật khẩu trên máy phát triển không nằm trong Git; bản clone không có tài khoản đăng nhập đóng gói sẵn.

Trên Windows có thể mở `TAO-TAI-KHOAN.cmd`, rồi `CHAY-BACKEND.cmd`. Giữ cửa sổ chạy mở trong lúc sử dụng.

### Chạy dashboard và speech cùng nhau

1. Cài thư viện, build và tạo tài khoản theo các bước trên.
2. Mở **CAI-DAT-SPEECH.cmd** một lần để tạo môi trường, tải và chuyển PhoWhisper-base sang INT8 CPU. Cần Python 3.12 và Internet.
3. Mở **CHAY-DASHBOARD-SPEECH.cmd**.
4. Đăng nhập **http://127.0.0.1:4180/** rồi chọn **Đọc kết quả siêu âm**.

| Cổng | Thành phần | Chức năng |
|---|---|---|
| 4180 | Dashboard + Node.js/SQLite | Đăng nhập, kho nguồn, quy tắc, đối soát và báo cáo |
| 4173 | Trang speech nhúng + proxy loopback | Thu micro, bản chép và kho ca trình duyệt |
| 4181 | PhoWhisper local | Nhận dạng WAV trong bộ nhớ |

Dừng bằng Ctrl+C. Nếu cổng đã được dùng, đóng đúng cửa sổ chạy cũ; launcher không tự dừng ứng dụng khác. `CHAY-SPEECH.cmd` chạy riêng speech tại **http://127.0.0.1:4173/speech.html**.

`CHAY-DEMO.cmd` và frontend ở cổng 4173 là chế độ lịch sử; dùng backend 4180 khi cần kho dữ liệu và quyền tài khoản của dashboard.

## Cách tính dịch vụ và doanh thu

Chỉ lấy dòng đủ điều kiện nghiệp vụ trong kỳ, theo phạm vi khoa đã xác nhận. Giá trị cơ bản là **số lượng × đơn giá đã cấu hình**. Thiếu giá, phân bổ gói hoặc giảm giá chưa rõ phải được thể hiện để đối soát.

- **SLUT 1:** khám + siêu âm.
- **SLUT 2:** khám + X-quang + siêu âm.
- **Siêu âm CK/lẻ:** tổng siêu âm − siêu âm SKTQ − siêu âm trong combo.
- **X-quang:** tách riêng 2D và 3D, rồi bóc tách lượng SKTQ/combo tương ứng.
- **Khám chuẩn tại khoa:** tổng lượt khám − khám SLUT 1 − khám SLUT 2; các quy tắc khác chỉ áp dụng khi có cấu hình và dữ liệu xác nhận.

Mỗi thành phần SKTQ/combo/lẻ dùng đúng giá của thành phần đó. Không cộng trùng cả giá gói và phần đã phân bổ. Giá trị chỉ định và giá trị thực hiện là hai cách nhìn, không cộng hai tổng thành doanh thu mới. Số liệu chưa phải đối soát tiền thực thu từ HIS/kế toán.

## Nơi lưu dữ liệu

| Nội dung | Nơi lưu | Đưa lên Git? |
|---|---|---|
| Nguồn, chỉnh sửa, cấu hình, báo cáo và tài khoản dashboard | SQLite trong `backend/data/` | Không |
| Ca, bản nháp và xác nhận kiểm tra speech | IndexedDB tại origin `http://127.0.0.1:4173` | Không |
| Âm thanh khi nhận dạng | Bộ nhớ tạm trong lúc xử lý | Không lưu tệp ca |
| Model và môi trường speech | `speech-models/`, `.speech-venv/` | Không; cài riêng |
| Nguồn tổng hợp và fixtures kiểm thử | `data_gialap/`, fixtures | Có, không chứa ca thật |

Speech tự lưu **bản chép đã chốt** và thông tin ca. Đoạn nhận dạng tạm còn có thể đổi; chờ báo đã lưu nháp trước khi đóng trang. Ca thiếu thông tin vẫn giữ dạng nháp, cần đủ định danh trước khi hoàn thành. Xem lại tại **Kết quả**, lọc **Từ ngày/Đến ngày**, không cần chọn thư mục hoặc xuất file.

Nút **Bật lưu bền vững** yêu cầu Storage API; chỉ báo đã bật khi trình duyệt cấp. Khi chưa cấp, IndexedDB vẫn giữ qua lần mở lại nhưng có thể bị thu hồi khi thiếu dung lượng. Dùng cùng trình duyệt/hồ sơ/thiết bị và đúng địa chỉ; xóa dữ liệu trang, dùng ẩn danh, gỡ trình duyệt hoặc hỏng thiết bị có thể mất dữ liệu. Kho speech chưa đồng bộ nhiều máy và chưa dùng phân quyền tài khoản của backend. Thư mục `speech-data/` và mã API liên quan là phần lưu trước đó; giao diện hiện tại không tự chuyển ca vào đó.

## Giới hạn nhập nguồn

- 100 MB/file; tối đa 100 file khi chọn thư mục, tổng 500 MB/lần.
- 100.000 dòng/sheet, mỗi lần nhập và toàn kho nguồn.
- Backend nhận trạng thái JSON tối đa 256 MB; kích thước Excel nén không tương đương dữ liệu sau đọc.

Vượt giới hạn được báo rõ, không tự cắt bản ghi rồi tính như đã đủ.

## Công nghệ và cấu trúc

React 18, Ant Design 5, Vite 6; Node.js 22 và SQLite tích hợp; SheetJS, PptxGenJS; Python, faster-whisper và PhoWhisper-base INT8 CPU. AI tài chính học local từ nhãn xác nhận, không gọi OpenAI/Gemini. Cài đặt ban đầu tải thư viện/model công khai; không gửi dữ liệu nghiệp vụ đến các nguồn tải này.

```text
src/                    Giao diện và quy tắc nghiệp vụ hiện tại
  features/reports/     Doanh thu, đối soát, xuất báo cáo
  features/intelligence/  Nhập nguồn và phân loại local
  features/speech/      Thu giọng, chép và lưu ca trình duyệt
backend/                Đăng nhập, SQLite và phân quyền báo cáo
scripts/                Launcher, cài model và công cụ kiểm chứng
tests/                  Kiểm thử tự động
docs/                   Hướng dẫn và tài liệu lịch sử
data_gialap/            Nguồn tổng hợp dùng kiểm thử
speech-training/        Mẫu nhãn/từ điển và chuẩn bị dữ liệu
speech-test-data/       Mô tả, nhãn và kết quả thử tổng hợp
```

Thư mục chuẩn bị huấn luyện không có nghĩa model đã học từ ca thật. Không tự dùng bản ghi bệnh nhân để huấn luyện.

## Phát triển và kiểm chứng

```powershell
npm run dev             # Frontend: 127.0.0.1:5173
npm test                # Kiểm thử Node
npm run audit           # Đối chiếu bộ mẫu báo cáo
npm run build           # Tạo/cập nhật dist
```

Khi đã cài và chạy model local, có thể kiểm tra API và streaming bằng âm thanh tổng hợp:

```powershell
node scripts/check-speech-api.mjs
node scripts/check-speech-stream.mjs
```

WAV, ZIP, cache và model không được đóng gói trong Git. Công cụ sinh/đánh giá nằm trong `scripts/`; nguồn và điều kiện thử ở [speech-test-data/NGUON.md](speech-test-data/NGUON.md). Script stream cần `speech-test-data/audio/GIA-001-sach.wav` có trên máy, không tự tải âm thanh bệnh nhân.

Kiểm chứng gần nhất: **209 kiểm thử Node đạt**, build đạt; kiểm tra IndexedDB thật xác nhận ca hoàn thành và nháp còn sau khi tải lại trang. Thử streaming bằng âm thanh tổng hợp cho chữ đầu sau khoảng 1,8 giây trên máy phát triển; không bảo đảm cùng độ trễ hoặc độ chính xác trên mọi micro/giọng nói.

SHA256SUMS.txt đối chiếu nội dung mã nguồn đã lưu trong Git, không bao gồm bản build hoặc dữ liệu local. Trên Windows, chuyển đổi LF/CRLF khi checkout có thể làm hash tệp trên đĩa khác hash nội dung Git.

## Phạm vi sử dụng và tài liệu

Chưa kết nối HIS/EMR, chữ ký bác sĩ, đồng bộ ca speech nhiều máy hoặc đối soát thực thu. Chưa có tập chuẩn bệnh viện để xác nhận sai số dưới 0,05%. Speech còn lỗi nhận dạng; cần người có chuyên môn kiểm tra bên vú, từ phủ định, số đo/đơn vị và BI-RADS trước khi sử dụng.

- [Vận hành nội bộ và lưu ca trình duyệt](docs/20-VAN-HANH-NOI-BO.md)
- [Dashboard và speech tích hợp](docs/19-DASHBOARD-SPEECH.md)
- [Speech-to-text siêu âm](docs/18-SPEECH-TO-TEXT-SIEU-AM-VU.md)
- [AI phân loại doanh thu local](docs/AI-DOANH-THU-LOCAL.md)
- [Backend và phân quyền](backend/README.md)
- [Bóc tách dịch vụ/combo](docs/16-BOC-TACH-DICH-VU-COMBO.md)

Tài liệu trước được giữ để truy vết; khi khác luồng hiện tại, ưu tiên README này và cập nhật mới nhất trong tài liệu vận hành. Đẩy mã nguồn lên GitHub không đưa dữ liệu local lên và không triển khai dashboard thành website công khai.
