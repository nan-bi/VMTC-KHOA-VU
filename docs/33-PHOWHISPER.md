# PhoWhisper trong dashboard Khoa Vú

## Cấu hình

Dùng mô hình tiếng Việt chính thức từ VinAIResearch: https://github.com/VinAIResearch/PhoWhisper (BSD-3-Clause; giấy phép tại PhoWhisper-LICENSE.txt). Mặc định mới: `vinai/PhoWhisper-small`, 244 triệu tham số, chuyển CTranslate2 INT8 CPU. Revision cố định trong `scripts/speech-models.json`; không tải mã Python từ repository model hoặc dùng trust_remote_code. Máy kiểm tra có khoảng 8 GB RAM, Intel Iris Xe; chưa chọn medium/large vì cần đo thêm tài nguyên và độ trễ.

PhoWhisper là nhận dạng lời nói tiếng Việt thành văn bản, không dịch sang ngôn ngữ khác. Benchmark tiếng Việt công bố của VinAI không phải kết quả kiểm định giọng bác sĩ hoặc thuật ngữ siêu âm vú.

## Cách dùng

1. Cài lần đầu bằng CAI-DAT-SPEECH.cmd (Internet để tải model/thư viện).
2. Mở CHAY-DASHBOARD-SPEECH.cmd để chạy cả dashboard4180 và speech4173/4181; đóng cửa sổ chạy cũ nếu báo trùng cổng. Nếu dashboard4180 đã chạy thì chỉ mở CHAY-SPEECH.cmd.
3. Trên dashboard, mở Đọc kết quả siêu âm và bấm Bắt đầu, cấp quyền micro. Thông báo hiển thị model đang thực sự nạp.
4. Chữ đang nhận cập nhật với beam1. Khi hết câu hoặc bấm Dừng, câu cuối được giải mã beam5, temperature0, tiếng Việt, task transcribe. Bản đang hiện có thể thay đổi sau khi đủ ngữ cảnh.
5. Nghe và soát kỹ bên trái/phải, phủ định, số đo, đơn vị và BI-RADS trước khi hoàn thành ca. Không có bước AI tự thêm bệnh lý, kết luận hay sửa số đo.

## Dữ liệu và nơi lưu

Âm thanh gửi qua loopback local, xử lý trong RAM; không gửi dịch vụ cloud, không ghi audio/transcript vào log server. Ca/bản nháp vẫn lưu IndexedDB tại origin4173 hiện có; thay model không di chuyển/xóa dữ liệu trình duyệt hoặc SQLite báo cáo. Không thay bố cục dashboard, công thức doanh thu hoặc phân loại dịch vụ.

Runtime chỉ nạp model có sẵn với READY khớp repository/revision; thiếu model phải cài, không âm thầm thay bằng model khác. Base đã cài vẫn giữ nguyên. Để dùng base trong một phiên PowerShell: `$env:VU_SPEECH_MODEL='base'; node scripts/start-speech.mjs` (cần dừng dịch vụ speech đang chạy trước). Xóa biến để trở lại mặc định small. Không cần thay code.

## Kiểm chứng

- Kiểm thử tách cờ preview/final, giải mã vi/transcribe, bảo toàn văn bản gốc, kiểm tra WAV, revision cố định và giữ luồng retry/lưu ca.
- Bộ so sánh `scripts/compare-phowhisper.py` dùng cùng WAV tổng hợp đã có, không dùng dữ liệu bệnh nhân, không dùng làm huấn luyện. So cấu hình cũ base/beam1 với small/beam5; vì hai yếu tố cùng đổi nên không quy mọi cải thiện riêng cho model.
- Chưa được kết luận chính xác nhất hoặc đạt sai số <0,05% cho speech. Cần tập thu giọng bác sĩ thật được nghe và duyệt nhãn độc lập; WER/CER và độ đúng số đo/phủ định/bên tổn thương phải đánh giá riêng.

## Kết quả chạy ngày 18/11/2026

Cùng 9 WAV: 6 câu sạch, 2 câu có tiếng quạt SNR10 và 1 đoạn im lặng; một giọng tổng hợp, nhãn chưa được nghe duyệt. Không phải kiểm định lâm sàng và không dùng để huấn luyện.

| Cấu hình | WER | CER | Tổng thời gian suy luận 9 WAV | Im lặng sinh chữ |
|---|---:|---:|---:|---:|
| PhoWhisper-base INT8, beam1 | 26.73% | 14.07% | 6.272s | 0/1 |
| PhoWhisper-small INT8, beam5 | 19.80% | 10.09% | 17.705s | 0/1 |

WER/CER đã chuẩn Unicode/chữ thường/bỏ dấu câu, chưa quy đổi toàn bộ số viết bằng chữ, từ viết tắt hoặc đơn vị. Nhận dạng còn sai; cải thiện trung bình không đảm bảo mọi ca đều tốt hơn. Tổng thời gian gồm khởi động suy luận đầu, không phải độ trễ micro trực tiếp. Vì model và beam cùng thay đổi nên đây là so sánh hai cấu hình hoàn chỉnh.

Bản kết quả từng câu: [phowhisper-comparison.json](phowhisper-comparison.json). Trọng số nguồn đã kiểm SHA256 theo metadata LFS của revision VinAI; model INT8 local có SHA256:

`25c9e77010ce22372d6c12831d2f33fb1a86bdceb9fa9cd41f4596fd37b71db1`

Kiểm chứng: 268 kiểm thử Node, 64 kiểm thử Python đạt; build đạt (cảnh báo dung lượng chunk hiện hữu). HTTP thật qua4173 đạt preview/final, model/revision, im lặng; chặn origin lạ, thiếu khóa4181, WAV sai, dung lượng quá mức và route lạ. Dashboard4180 health OK. Chưa thu giọng micro bác sĩ thật trong lượt này. Giao diện/bản nháp/ca IndexedDB và cơ sở dữ liệu vận hành giữ nguyên.
