# VinMec · Prototype Khoa Vú chạy local

Toàn bộ mã nguồn React + Ant Design + Vite của prototype, kèm bản build chạy sẵn. Đây là ứng dụng demo với dữ liệu giả lập; không cần tài khoản dịch vụ hay khóa API.

Bản v6 bổ sung 200 hành trình liên khoa khép kín, ba bảng CSV, truy vết TAT và dữ liệu JSONL chuẩn bị model. Xem [hướng dẫn hành trình liên khoa](docs/11-HANH-TRINH-LIEN-KHOA-KHEP-KIN.md). Các chức năng Excel / PowerPoint của v5 vẫn có sẵn.

Bản v7 bổ sung [MASTER Audit local](docs/12-MASTER-AUDIT-LOCAL.md): xuất JSON theo hợp đồng thống nhất, cảnh báo TAT có bằng chứng và ghi chú truy vết. Vẫn chạy local, chưa gọi API AI.

## 1. Chạy ngay bản demo

1. Cài **Node.js LTS 22 hoặc mới hơn** từ https://nodejs.org/ nếu máy chưa có.
2. Giải nén toàn bộ gói ZIP vào một thư mục trên máy. Không chạy file trực tiếp bên trong ZIP.
3. Trên Windows, mở **CHAY-DEMO.cmd**.
4. Giữ cửa sổ lệnh đang chạy và mở **http://127.0.0.1:4173/** trong Chrome hoặc Edge.
5. Dừng bằng `Ctrl+C` trong cửa sổ lệnh.

Cách này dùng `dist/` có sẵn, không cần `npm install`, không cần Internet sau khi đã có Node.js. Đừng mở `index.html` bằng cách nhấp đúp: ứng dụng cần địa chỉ HTTP local.

macOS / Linux hoặc chạy bằng Terminal:

```sh
node scripts/serve-dist.mjs
```

## 2. Cài đặt để chỉnh sửa code

Windows: mở **CAI-DAT.cmd** một lần khi có Internet, sau đó mở **CHAY-CODE.cmd**. Máy chủ phát triển ở **http://127.0.0.1:5173/**. Lần cài đầu cần truy cập npm registry và CDN chính thức của SheetJS.

Hoặc mở Terminal tại thư mục chứa `package.json`:

```sh
npm ci
npm run dev
```

Sau khi sửa code:

```sh
npm test
npm run audit
npm run build
npm start
```

`npm run build` cập nhật `dist/`. `npm start` mở máy chủ cho bản build tại cổng 4173. Nếu bản demo cũ đang chạy, dừng nó trước khi chạy `npm start`.

## 3. Các phần của mã nguồn

```text
VinMec-KhoaVu-Local/
├── CHAY-DEMO.cmd             Chạy bản build sẵn
├── CAI-DAT.cmd               Cài thư viện để phát triển
├── CHAY-CODE.cmd             Chạy Vite để chỉnh sửa
├── package.json              Lệnh chạy và thư viện
├── package-lock.json         Phiên bản thư viện đã khóa
├── index.html                Trang HTML khởi đầu
├── vite.config.js            Cấu hình build
├── src/
│   ├── main.jsx              Khung ứng dụng, menu, màn hình báo cáo
│   ├── components/
│   │   └── DateControls.jsx  Chọn ngày / khoảng ngày / trước-sau
│   ├── data/
│   │   └── seed.json         2.700 chỉ định, danh mục 87 dịch vụ giả lập
│   ├── styles/
│   │   └── global.css        Giao diện toàn ứng dụng
│   └── features/
│       ├── patients/
│       │   ├── PatientWorkspace.jsx  Giao diện tiếp đón và các phòng
│       │   ├── patientFlow.mjs       Quy tắc chuyển phiếu, trả kết quả
│       │   └── patientFlow.css       Giao diện luồng phòng
│       ├── access/
│       │   └── roomAccess.mjs        Tài khoản mẫu, phạm vi xem/thao tác
│       ├── attachments/
│       │   └── attachmentStore.mjs   Lưu/tải file bằng IndexedDB
│       └── reports/
│           └── core.mjs             Kiểm tra, chống trùng, tổng hợp báo cáo
├── scripts/
│   └── serve-dist.mjs        Máy chủ local, chỉ dùng thư viện có sẵn của Node
├── tests/                   52 kiểm thử nghiệp vụ, dữ liệu, lưu trữ và phạm vi vai trò
├── docs/                    Hướng dẫn theo từng mục
└── dist/                    Bản build sẵn, tạo lại bằng npm run build
```

## 4. Tài liệu theo từng mục

- [01 · Cài đặt và xử lý lỗi local](docs/01-CAI-DAT-LOCAL.md)
- [02 · Chức năng và vị trí sửa code](docs/02-CAU-TRUC-CHUC-NANG.md)
- [03 · Luồng liên thông các phòng](docs/03-LUONG-PHONG.md)
- [04 · Tài khoản và kịch bản demo](docs/04-TAI-KHOAN-DEMO.md)
- [05 · Lưu dữ liệu và giới hạn triển khai](docs/05-DU-LIEU-VA-TRIEN-KHAI.md)

- [06 · Báo cáo kiểm tra và bằng chứng đối chiếu](docs/06-BAO-CAO-KIEM-TRA.md)

## 5. Phạm vi bàn giao

Đầy đủ mã nguồn của **prototype hiện tại**: tiếp nhận, đánh giá ban đầu, 4 phòng khám, 3 phòng siêu âm, XQ vú, tư vấn can thiệp, can thiệp, hồi tỉnh; file đính kèm; báo cáo, nhập Excel/CSV, đối soát, xuất Excel/in PDF.

Vai trò là mô phỏng trên trình duyệt. Chưa có backend, đăng nhập thật, phân quyền máy chủ hay dữ liệu chung giữa các máy. Chỉ sử dụng dữ liệu mẫu. Gói không chứa `node_modules`, lịch sử Git, cấu hình tài khoản hosting, khóa bí mật hoặc dữ liệu đã nhập trong trình duyệt.

## Bản kiểm tra 30/10/2026

52 kiểm thử tự động, 200 kịch bản chuyển phòng và 40 khách đan xen. `npm run audit` đối chiếu 182 giá trị trong 26 kỳ: sai số quan sát 0% trên dữ liệu mẫu. Không suy rộng kết quả này sang dữ liệu bệnh viện thực tế. Chi tiết, lỗi đã sửa và giới hạn xem tài liệu 06.

Các mô-đun bổ sung: `shared/dataRules.mjs` (ngày, mã, số tiền), `patients/flowIntegrity.mjs` (toàn vẹn liên kết), `patients/flowStore.mjs` và `reports/reportStore.mjs` (khóa ghi/phiên bản), `reports/importRows.mjs` (chuẩn hóa đầu vào).

## Phát triển liên khoa và model ngày 31/10/2026

Menu **Liên khoa & dữ liệu model** có nhập nhiều Excel/CSV, phân loại 4 nhóm địa bàn, đối soát từng dòng, hai góc nhìn tài chính và gán nhãn xuất JSONL. Code bổ sung ở src/features/intelligence/; prompt và model baseline Python ở model/. Hướng dẫn đầy đủ xem [07 · Liên khoa và model](docs/07-LIEN-KHOA-VA-MODEL.md).

Kiểm tra hiện tại: 82 test JavaScript (`npm test`) và 5 test Python (`python -m unittest discover -s tests -p test_model_baseline.py`). Cần Python 3.10+ chỉ khi chạy pipeline model. Model demo chưa được dùng trong vận hành; không gửi dữ liệu tới API bên ngoài.

## Xuất doanh thu thành PowerPoint và Excel

Menu **Liên khoa & dữ liệu model → Xuất kết quả đã tính** có hai nút xuất `.xlsx` đầy đủ 10 sheet và `.pptx` với bảng chỉnh sửa được. Hai file dùng chung snapshot, kỳ, mã bộ xuất và SHA-256. Tách doanh thu chỉ định, thực hiện và cơ chế gói; giữ dữ liệu nguồn và ngoại lệ để đối chiếu. Xem [08 · Xuất PowerPoint và Excel](docs/08-XUAT-POWERPOINT-EXCEL.md).

## Trợ lý truy vết local đa file

Trợ lý nằm ngay dưới vùng nạp file tại menu **Liên khoa & dữ liệu model**. Giữ tên file, sheet, dòng gốc, SHA-256; truy mã BN/chỉ định, nhóm dịch vụ, ngoại lệ và doanh thu từng góc nhìn, xuất toàn bộ bằng chứng Excel. Bản local theo quy tắc, chưa gọi API AI. Xem [09 · Trợ lý truy vết](docs/09-TRO-LY-TRUY-VET.md) và prompt chuẩn bị tích hợp model trong model/AUDIT_COPILOT_SYSTEM_PROMPT.md.

## Excel giao ban 5 sheet

Nút **Xuất Excel giao ban (5 sheet)** tạo một file theo ba luồng tại khoa/chuyển đến/chuyển đi, tổng hợp giao ban và chi tiết phân bổ gói. Giữ bản Excel 10 sheet để đối soát toàn nguồn. Hướng dẫn phạm vi và quy tắc cộng: [10 · Excel giao ban 5 sheet](docs/10-EXCEL-GIAO-BAN-5-SHEET.md).

## Bản v8 · Excel theo mẫu DATA_KHOAVU

Bản xuất cuối và Chi tiết số liệu có định dạng theo workbook tham chiếu: tiêu đề hai tầng, hai nhóm bác sĩ, bảng dịch vụ và dữ liệu nguồn truy vết. Hướng dẫn: docs/13-XUAT-THEO-MAU-DATA-KHOAVU.md. Kiểm tra hiện tại: 103 test JavaScript đạt, audit 182 phép đối chiếu trên dữ liệu giả lập đạt.

