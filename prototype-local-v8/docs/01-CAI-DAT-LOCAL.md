# 01 · Cài đặt và chạy local

## Yêu cầu

- Windows 10/11, macOS hoặc Linux; Chrome/Edge mới.
- Node.js LTS 22 trở lên; npm đi kèm Node.js.
- Khoảng trống đủ cho mã nguồn và thư viện. Cần Internet khi cài thư viện lần đầu, không cần tài khoản hay khóa API.

Kiểm tra trong Terminal:

```sh
node --version
npm --version
```

## Chạy bản có sẵn

Giải nén ZIP, mở `CHAY-DEMO.cmd` trên Windows. Trên hệ điều hành khác dùng `node scripts/serve-dist.mjs`. Mở http://127.0.0.1:4173/ và giữ Terminal chạy. Chỉ lắng nghe trên máy của bạn, không mở ra mạng LAN.

## Phát triển

Mở thư mục bằng VS Code hoặc trình soạn thảo. Chạy `npm ci`, rồi `npm run dev`. Mở http://127.0.0.1:5173/. Vite cập nhật khi lưu code. Nếu chỉnh code nhưng chạy bằng `CHAY-DEMO.cmd`, cần `npm run build` trước để cập nhật bản build.

## Xử lý lỗi

| Hiện tượng | Cách xử lý |
|---|---|
| Không tìm thấy node / npm | Cài Node.js từ nodejs.org, đóng và mở lại Terminal |
| PowerShell chặn npm.ps1 | Dùng `npm.cmd ci`, `npm.cmd run dev`, `npm.cmd run build`; hoặc dùng các file .cmd, không cần đổi chính sách PowerShell |
| Thiếu thư viện | Chạy lại `npm ci` khi có Internet |
| Cài SheetJS lỗi mạng | Kiểm tra truy cập cdn.sheetjs.com và registry.npmjs.org rồi chạy lại `npm ci` |
| Cổng 4173 hoặc 5173 đang dùng | Đóng Terminal demo cũ bằng Ctrl+C, hoặc mở địa chỉ đang chạy nếu đúng ứng dụng này |
| Trang trắng khi nhấp index.html | Dùng máy chủ local theo hướng dẫn, không mở bằng file:// |
| Không thấy bệnh nhân mẫu | Chọn ngày 23/10/2026; đổi đúng tài khoản; hoặc tài khoản Điều phối nạp lại 3 bệnh nhân mẫu cho ngày đang chọn |
| Code mới chưa xuất hiện | Dừng máy chủ, chạy `npm run build`, chạy lại demo và tải lại trang |
| Dữ liệu không giống bản online | Mỗi địa chỉ và trình duyệt có kho lưu riêng; bản online không tự sao chép sang local |

Để giữ dữ liệu demo, dùng cố định cùng địa chỉ, cổng và hồ sơ trình duyệt. `localhost` khác `127.0.0.1`; cổng 4173 khác 5173. Không dùng chế độ ẩn danh nếu muốn giữ dữ liệu sau khi đóng trình duyệt.
