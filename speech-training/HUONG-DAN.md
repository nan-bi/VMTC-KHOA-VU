# Thu mẫu giọng bác sĩ cho Vú Voice

Trạng thái ngày 14/11/2026: **chưa có ghi âm đã duyệt; chưa huấn luyện lại trọng số**. PhoWhisper-base đang dùng vẫn là bản gốc đã chuyển INT8. Bộ câu và từ điển ở đây là bản khởi đầu cần bác sĩ duyệt; chưa bao phủ mọi chuyên khoa, tiếng địa phương hoặc cách nói tắt.

## Mở trang thu mẫu

Mở `CHAY-SPEECH.cmd`, truy cập **http://127.0.0.1:4173/speech-training.html** bằng Chrome/Edge trên máy tính này. Nếu dùng màn hình Ghi ca cũ đang mở, địa chỉ thu mẫu là trang riêng. Không cần Internet; cần giữ máy chủ local chạy. Trang thu mẫu chưa được cache để mở lại khi máy chủ tắt.

1. Người đọc đồng ý thu giọng và chỉ dùng ca giả lập không có dữ liệu người bệnh. Dùng mã BS01, BS02 thay tên thật.
2. Đặt mã buổi thu riêng, ví dụ BS01_BUOI01. Giữ nguyên nhóm train/dev/test trong cả buổi. Chọn tốc độ thường hoặc nhanh tự nhiên, chọn điều kiện thu đúng thực tế.
3. Chọn câu; bác sĩ kiểm tra thuật ngữ và cách dùng trước khi đọc. Bấm Thu mẫu, đọc, bấm Dừng. Mục tiêu 5–20 giây; tự dừng ở 29 giây. Chuyển tab cũng dừng. Trang không tự thu khi mở.
4. Nghe lại và gõ **đúng lời thực tế**, gồm ngập ngừng và tự sửa. Không chép nguyên câu gợi ý nếu bác sĩ nói khác. Có thể quy ước chính tả ký hiệu như BI-RADS sau khi khoa duyệt, nhưng không tự mở rộng nghĩa chữ viết tắt, thêm chẩn đoán, đổi bên hay sửa số đo cho “hợp lý”. Đoạn không nghe rõ nên thu lại.
5. Người duyệt xác nhận sau khi nghe. Bấm **Tải WAV và thêm vào danh sách**. Kiểm tra tệp đã có trong thư mục tải về. Trang chỉ khởi phát tải xuống, không biết chắc trình duyệt đã lưu file.
6. Tải **danh sách CSV** sau mỗi đợt. WAV đặt vào `speech-training/audio/`; CSV đặt trực tiếp vào `speech-training/`. Không đổi tên WAV trừ khi sửa đường dẫn CSV tương ứng. Không có xuất JSON.

Âm thanh và danh sách mẫu đang thu chỉ ở RAM của tab, không tự lưu vào kho bệnh nhân. Đóng/tải lại tab có thể mất các mục chưa tải; cảnh báo rời trang chỉ là hỗ trợ, không thay việc kiểm tra file. Âm thanh không gửi đến API STT, cloud, hoặc hệ thống huấn luyện. Màn hình Ghi ca không bị đổi thành chế độ lưu ghi âm.

## Bộ câu và từ điển

`cau-doc-gia-lap.md` và `cau-doc-gia-lap.csv` có 80 câu tự soạn, chia 8 nhóm: bên vú/vị trí; phủ định/tự sửa; số đo/đơn vị; hình thái siêu âm; thuật ngữ/chữ viết tắt; ngoại khoa tuyến vú; câu liên tục; âm gần nhau/đọc nhanh. Đây là tài liệu luyện đọc, không phải mẫu phiếu được bệnh viện duyệt, thang chẩn đoán hoặc hướng dẫn điều trị.

`tu-dien-cua-bac-si.csv` có 14 mục gợi ý và cột trống cho **cách bác sĩ thực sự phát âm, mã người đọc, xác nhận và ghi chú**. Tất cả ban đầu `confirmed=no`. Điền thêm cách gọi riêng, tên kỹ thuật theo danh mục khoa, từ tiếng Anh và biến thể từng người. Không đoán sẵn các phiên âm lóng. Từ điển này chưa được dùng để thay từ tự động trong kết quả.

Muốn ghi lời đọc tự do, dùng một câu gợi ý gần chủ đề rồi đọc ca giả lập mới theo thói quen. `prompt_id` chỉ là mã gợi ý; nhãn huấn luyện phải là `verbatim_text` đã nghe và duyệt. Ghi chú nguồn câu tự do riêng khi tổ chức bộ đánh giá.

## Thu đủ đa dạng để học cách nói

Bắt đầu bằng đợt thử nhỏ khoảng 20–30 phút tổng cộng từ 2–3 người đọc, gồm đọc thường/nhanh và các lỗi hay gặp. Đây là mục tiêu thu thử, **không phải ngưỡng bảo đảm đủ để fine-tune**. Sau khi xem lỗi và chất lượng nhãn, mở rộng nhiều buổi, nhiều người và vài giờ dữ liệu nếu cần. Đừng nhân bản tệp hoặc chỉ tăng tốc audio để thay cho giọng đọc nhanh thật.

Thu cùng bác sĩ ở các buổi khác nhau cho train, dev và test. Không chia ngẫu nhiên từng đoạn của cùng một buổi sang nhiều nhóm. Giữ thêm bác sĩ chưa xuất hiện trong train để đo khả năng dùng với giọng mới. Nếu dùng lặp bộ câu ở nhiều nhóm, kết quả chỉ phản ánh cùng nội dung với giọng/buổi khác; cần **câu tự do mới ở tập test** để đánh giá ngoài bộ câu luyện. Không dùng test để chọn tham số hay thêm từ điển rồi tiếp tục gọi đó là test giữ riêng.

## Kiểm tra và ghép các CSV

Tại thư mục dự án, ví dụ với ba bản CSV đã tải:

```powershell
.\.speech-venv\Scripts\python.exe scripts\validate-speech-training.py speech-training\manifest-buoi1.csv speech-training\manifest-buoi2.csv speech-training\manifest-buoi3.csv --output speech-training\manifest-hop-le.csv
```

Để kiểm tra một đợt chưa đủ train/dev/test, thêm `--allow-partial`. Không dùng cờ này để tuyên bố đã đủ điều kiện đánh giá model. Công cụ không ghi đè CSV đầu ra đã có. `manifest-mau.csv` chỉ có tiêu đề; chạy kiểm tra trên nó sẽ báo chưa có mẫu, đúng với trạng thái hiện tại.

Công cụ kiểm tra WAV mono PCM16 16 kHz, 2–29 giây, trường bắt buộc, người duyệt/cho phép huấn luyện, tệp trùng nội dung, mã trùng, buổi thu bị lẫn nhóm và đường dẫn nằm ngoài bộ dữ liệu; loại gần im lặng, cảnh báo clipping. Công cụ không biết bản chép có đúng lời thực tế hay thuật ngữ có đúng không. Cần con người nghe và kiểm tra.

## Khi có dữ liệu đã duyệt

1. Đo model gốc trên test giữ riêng: WER/CER và lỗi riêng cho bên vú, phủ định, số đo/đơn vị, chữ viết tắt, thuật ngữ, lời tự sửa. Theo dõi thêm thời gian xử lý và thời gian thư ký sửa. Duyệt từng lỗi nguy hiểm, không chỉ xem điểm trung bình.
2. Fine-tune từ **trọng số PhoWhisper gốc**, không phải tệp CTranslate2 INT8 để suy luận. Máy i5/8 GB dùng suy luận được; huấn luyện trên CPU sẽ chậm, chưa có phép đo thời gian/RAM huấn luyện trên máy này. Chuẩn bị máy GPU phù hợp của đơn vị sau khi kiểm tra dữ liệu. Chưa tự tải giọng nói lên Colab hoặc dịch vụ khác.
3. So sánh bản fine-tune với bản gốc trên cùng test và kiểm tra lỗi lâm sàng. Dữ liệu giả lập tốt hơn chưa chứng minh làm việc tốt trong phòng siêu âm thật. Chỉ sau đánh giá mới chuyển INT8, đo lại và chọn bản dùng. Giữ bản gốc để quay lại; chưa tự thay model đang sử dụng.

Mục tiêu là giảm lỗi theo phạm vi thực tế, không cam kết nhận đúng mọi thuật ngữ hay mọi kiểu đọc. Thêm prompt/hotwords có thể gợi cách viết nhưng không tương đương học giọng/luyến âm và có thể gây chèn từ không được nói; chưa bật trong bản này.

Nguồn kỹ thuật: [VinAI PhoWhisper](https://github.com/VinAIResearch/PhoWhisper), [Hugging Face: fine-tune Whisper bằng âm thanh và bản chép](https://huggingface.co/blog/fine-tune-whisper). Nguồn đối chiếu tên gọi: [ACR BI-RADS](https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/BI-RADS), [NCI: các ký hiệu thụ thể ER/PR](https://www.cancer.gov/types/breast/treatment/hormone-therapy). Các câu đọc là nội dung giả lập tự soạn, không sao chép hướng dẫn chuyên môn từ các tài liệu này.

Kiểm tra triển khai: 35 kiểm thử Node liên quan speech (gồm recorder thu mẫu) và 4 kiểm thử Python cho bộ kiểm tra dữ liệu đạt; build đạt. Trang hiển thị đủ 80 lựa chọn, thay được tốc độ/câu gợi ý, chưa thu micro hay dùng giọng người thật trong QA. Manifest trống bị từ chối đúng như yêu cầu; kiểm thử audio dùng sóng giả lập, không đưa vào tập huấn luyện.
