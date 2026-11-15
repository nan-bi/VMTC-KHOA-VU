# Vú Voice — chép toàn bộ lời đọc siêu âm vú

## Luồng tối giản

Thư ký xác nhận PID, mã lượt, mã chỉ định và bác sĩ → bấm **Bắt đầu** → bác sĩ đọc tự nhiên → thư ký bấm **Dừng** → **Hoàn thành & lưu kết quả**. Ca chuyển vào mục **Kết quả**, trạng thái **Chờ bác sĩ kiểm tra**. Không cần đợi bác sĩ kiểm tra ngay để lưu và tạo ca mới.

Không cần đọc lệnh, chuyển mục, hoặc đọc theo thứ tự cố định. Toàn bộ văn bản nhận dạng được nối vào một ô. Kể cả câu “Thư ký tạm dừng” cũng được chép như nội dung; không có bộ xử lý lệnh giọng nói. Không tự tóm tắt, tự điền nội dung bình thường, phân loại bên vú hoặc suy ra BI-RADS. Lời bác sĩ tự sửa được giữ để thư ký xác minh và sửa tay.

## Căn cứ khảo sát

`data_hoan_chinh_20261109/support/source_extract.txt`, DN03/DN05/DN07 và báo cáo 29/10 ghi nhận nhập lại thông tin, chuyển nhiều công cụ, thông báo xong bằng miệng/Zalo và ghi giờ bằng tay. `docs/03-LUONG-PHONG.md` xác định phòng siêu âm và liên kết người bệnh/lượt/chỉ định. Bản này hỗ trợ chép lời; chưa thay thế điều phối trạng thái hay ghi nhận hoàn thành trên HIS.

## Chạy

Máy hiện tại đã cài model. Với máy mới, cài Python 3.12 và Node 22, mở `CAI-DAT-SPEECH.cmd` một lần có Internet (thư viện + trọng số nguồn + chuyển INT8). Sau đó mở `CHAY-SPEECH.cmd`, vào `http://127.0.0.1:4173/speech.html` bằng Chrome/Edge. Dùng **Nạp ca giả lập** để thử. Môi trường phát triển: `npm run dev`, cổng 5173. Sau sửa mã chạy `npm run build`.

Xác nhận điều kiện xử lý âm thanh và cấp quyền micro. Đặt micro gần bác sĩ, hạn chế người nói xen. Không có micro có thể gõ trực tiếp vào bản chép.

Model chép theo từng đoạn, không hiển thị từng từ ngay khi nói. Âm thanh mono 16 kHz được gom tối thiểu khoảng 3 giây và gửi khi nghỉ khoảng 1 giây; nếu đọc liên tục thì chia tối đa khoảng 25 giây. Silero VAD lọc khoảng lặng trên máy. Chỗ buộc chia đoạn có thể làm sai từ ở ranh giới; cần soát lại. Khi bấm Dừng, micro đóng ngay và ứng dụng chép hết phần cuối trước khi cho hoàn thành ca. Nếu hàng đợi quá dài, micro tự dừng và báo rõ để xử lý các đoạn đã thu; lời nói sau khi dừng không được thu. Chuyển tab/ẩn cửa sổ cũng dừng micro.

Nếu dịch vụ lỗi, âm thanh chưa chép giữ tạm trong RAM của tab, có nút Thử chép lại. Ca vẫn khóa để không đổi người bệnh khi còn đoạn đang chờ. Chỉ bỏ đoạn lỗi sau khi xác nhận để nhập lại bằng tay. Đóng/tải lại tab hoặc máy tắt sẽ mất phần âm thanh chưa chép; bản nháp chỉ giữ văn bản đã nhận. Không có tự chuyển sang dịch vụ đám mây.

Soát kỹ bốn điểm: bên vú, số đo và đơn vị, từ phủ định, BI-RADS. Thư ký xác minh nội dung chưa rõ với bác sĩ; không tự chọn câu đúng trong các lời tự sửa. Mọi sửa nội dung hoặc định danh trước khi lưu đều bỏ dấu thư ký đã soát. Dấu này không bắt buộc để hoàn thành ca, không thay thế bác sĩ kiểm tra. Phiếu luôn là bản nháp chưa ký.

Mục **Lời nhận dạng gốc để đối chiếu** giữ các đoạn văn bản dịch vụ nhận dạng trước chỉnh sửa. Đây không phải âm thanh gốc và không chứng minh nhận dạng đúng lời bác sĩ. Đã bỏ xuất JSON; chỉ xuất TXT (UTF-8 có BOM) và in/lưu PDF.

## Phạm vi thử nghiệm

Nhận giọng nói dùng PhoWhisper-base INT8 qua faster-whisper trên CPU, không dùng Web Speech API hoặc dịch vụ Internet. Cần giữ tiến trình CHAY-SPEECH chạy để dùng micro; trang được cache vẫn nhập và lưu tay khi tiến trình này đã tắt. Chưa phân biệt giọng bác sĩ với người bệnh hoặc tiếng nói xung quanh, chưa kiểm chứng nhận dạng với âm thanh phòng siêu âm.

Ca đang ghi được tự lưu thành bản nháp trên thiết bị sau mỗi lần cập nhật nội dung/định danh; trạng thái Đã lưu nháp chỉ hiện sau giao dịch thành công. Ca đã hoàn thành lưu trong IndexedDB của trình duyệt, không lưu tệp âm thanh và không gửi văn bản đến API ứng dụng. File tải và bản in cần quản lý theo quy định đơn vị. Màn hình thử độc lập chưa đăng nhập, phân quyền hoặc kết nối HIS/EMR.

Trước dùng hồ sơ thật cần khoa/CNTT duyệt cách xử lý âm thanh, mẫu phiếu, bảo vệ dữ liệu và tích hợp định danh; thử micro/tiếng ồn/giọng thực tế. Đánh giá riêng lỗi bên vú, phủ định, số đo, đơn vị, BI-RADS và thời gian soát/sửa. Chưa có bằng chứng về độ chính xác hoặc mức tiết kiệm thời gian tại khoa. Ưu tiên micro gần người đọc và bác sĩ duyệt; thêm bước AI trình bày lại chỉ khi có căn cứ đánh giá và luôn giữ bản chép để đối chiếu.

## Kết quả và kiểm tra sau

Nút Hoàn thành & lưu kết quả kiểm tra đủ định danh và có nội dung, lưu bản chép cùng lời nhận dạng gốc, rồi mới báo thành công và khóa ca. Nếu lưu lỗi, nội dung vẫn ở màn hình Ghi ca, chưa đánh dấu đã lưu. Bấm hai lần không tạo thêm bản lưu. Tạo ca mới không xóa ca đã hoàn thành; ca đang nhập được giữ trong Bản nháp trước khi mở ca mới.

Mục Kết quả có bộ lọc Chờ bác sĩ kiểm tra / Đã kiểm tra / Tất cả và tìm PID, họ tên, mã lượt, mã chỉ định, bác sĩ hoặc ngày. Bác sĩ chọn ca, xem bản lúc hoàn thành, chỉnh bản kết quả nếu cần, nhập tên người kiểm tra và bấm Lưu xác nhận đã kiểm tra. Bản chép lúc hoàn thành vẫn được giữ để đối chiếu. Kiểm tra ở hai tab đồng thời được kiểm soát bằng phiên bản trong giao dịch IndexedDB: bản cũ không ghi đè bản đã được cập nhật. Tên bác sĩ do người thao tác nhập, chưa có xác thực vai trò hoặc chữ ký số.

## Ngày giờ tự động

Đồng hồ trên giao diện cập nhật mỗi giây từ máy tính hoặc điện thoại đang mở trang, theo múi giờ của thiết bị. Không có ô chọn/nhập ngày giờ.

- Bắt đầu ghi: lần đầu bấm Bắt đầu hoặc nhập nội dung bằng tay; giữ nguyên khi dừng rồi tiếp tục. Đây là mốc bắt đầu ghi trên ứng dụng, không khẳng định là giờ bắt đầu khảo sát bằng đầu dò.
- Thư ký soát: lúc đánh dấu đã soát bản chép, nếu có.
- Hoàn thành ca: lúc bấm Hoàn thành & lưu kết quả và giao dịch lưu thành công.
- Bác sĩ kiểm tra: lúc lưu xác nhận kiểm tra sau đó. Không thay đổi giờ hoàn thành ca.

Mỗi mốc lưu ISO/UTC, ngày giờ địa phương đến từng giây, độ lệch UTC và tên múi giờ tại thời điểm thao tác. Mở kết quả sau vẫn hiển thị ngày giờ đã ghi, không dùng giờ hiện tại để thay thế. Nếu đồng hồ bị chỉnh lùi làm thứ tự mốc bất hợp lý, kết quả gắn cảnh báo và giữ nguyên mốc thực tế đã đọc từ thiết bị. Ngày giờ phụ thuộc độ đúng của đồng hồ thiết bị; chưa đồng bộ hoặc xác minh với máy chủ bệnh viện. TXT và bản in cùng có các mốc giờ này.

## Phạm vi lưu trữ

Kết quả đã lưu còn sau tải lại hoặc đóng/mở trang trên cùng trình duyệt, hồ sơ trình duyệt và địa chỉ (ví dụ 127.0.0.1:4173). Xóa dữ liệu trang, dùng chế độ riêng tư hoặc đổi địa chỉ/cổng/hồ sơ trình duyệt có thể làm mất hoặc không thấy kho cũ. Xuất file theo quy định đơn vị để lưu bản ngoài trình duyệt.

Máy tính và điện thoại tự lấy đồng hồ riêng, nhưng CHƯA chia sẻ kết quả với nhau. Để bác sĩ xem từ thiết bị khác cần backend nội bộ dùng chung, đăng nhập và phân quyền, sao lưu và kết nối mạng được duyệt. Bản local chưa đủ điều kiện lưu hồ sơ người bệnh thật hoặc ký kết quả chính thức.

## Nhập và lưu không cần Internet

Chạy bản build bằng CHAY-SPEECH.cmd, mở đúng địa chỉ /speech.html lần đầu và đợi thông báo **Đã sẵn sàng mở lại trang khi mất kết nối**. Giao diện và các tệp mã/CSS cần thiết được lưu sẵn bằng Service Worker. Sau bước này có thể mở lại đúng địa chỉ /speech.html dù máy chủ trang không truy cập được; không cần tải phông chữ, thư viện hoặc dữ liệu từ CDN khi sử dụng. Bản phát triển ở cổng 5173 cần máy chủ và không được xem là bản ngoại tuyến.

Khi mất Internet, nhập tay, tự lưu bản nháp, lưu kết quả, xem lại kết quả và bác sĩ xác nhận kiểm tra đều thực hiện trên thiết bị bằng IndexedDB. Có nhãn trạng thái kết nối; lưu dữ liệu không chờ gửi lên máy chủ. PhoWhisper nhận âm thanh ngoại tuyến nếu CHAY-SPEECH vẫn chạy. Mất Internet không dừng micro. Nếu dịch vụ local dừng, giữ văn bản đã nhận và giữ âm thanh chưa chép tạm trong tab để thử lại; phần âm thanh này không lưu xuống đĩa.

### Tự lưu và khôi phục ca đang làm

Mỗi phiên Ghi ca có một bản nháp riêng; không gộp nội dung các tab hoặc các người bệnh. Mỗi lần đổi thông tin hoặc nội dung sẽ xếp giao dịch tự lưu theo thứ tự. Bản nháp giữ định danh, nội dung, lời nhận dạng nguồn, mốc bắt đầu và trạng thái soát. Các thao tác gõ liên tiếp giữ phiên bản sửa tay mới nhất thay vì một bản sao toàn văn cho mỗi phím; lời nhận dạng từ micro vẫn được giữ để đối chiếu.

Đợi nhãn **Đã lưu nháp** để biết phiên bản đang hiển thị đã được ghi thành công. Nếu tải lại hoặc mở lại sau sự cố, mở **Bản nháp chưa hoàn thành**, đối chiếu PID/mã chỉ định rồi chọn **Khôi phục ca này**. Ngày giờ bắt đầu cũ được giữ nguyên. Mục này không tự chọn ca để tránh nhầm người bệnh. Tạo ca mới hoặc nạp ca giả lập sẽ giữ bản đang làm trước khi chuyển.

Khi khôi phục, quyền cập nhật bản nháp chuyển sang tab khôi phục. Tab cũ không được ghi đè bản mới và hiển thị lỗi tự lưu. Lưu kết quả và bỏ bản nháp tương ứng thực hiện trong cùng giao dịch: nếu lỗi thì giữ bản nháp, không báo hoàn thành thành công. Định danh kết quả ổn định theo bản nháp, tránh tạo hai kết quả khi bấm lưu lặp lại.

Nếu lưu lỗi (hết dung lượng, lưu trữ bị chặn, bản nháp được mở ở tab khác), trang giữ nội dung trên màn hình và hiện cảnh báo, không giả vờ đã lưu. Có nút Thử lưu lại và vẫn có thể xuất file để giữ bản đang hiển thị. Khả năng khôi phục giới hạn ở lần lưu thành công gần nhất; không bảo đảm khôi phục âm thanh chưa được nhận dạng, thao tác chưa kịp lưu hoặc dữ liệu sau khi người dùng xóa kho trình duyệt. Các chỉnh sửa trong màn hình bác sĩ kiểm tra cần bấm Lưu xác nhận; tự lưu ca đang nhập áp dụng cho màn hình Ghi ca.

### Giới hạn lưu trên thiết bị

Dùng cùng trình duyệt, hồ sơ và địa chỉ/cổng. Tránh chế độ riêng tư và không xóa dữ liệu trang nếu còn hồ sơ cần giữ. Kho lưu này chưa phải sao lưu độc lập và chưa đồng bộ giữa máy tính/điện thoại. Cache ngoại tuyến chỉ chứa giao diện; hồ sơ người bệnh không đưa vào Cache Storage. Bản thử nghiệm chưa xác thực/phân quyền và cần phương án lưu trữ được bệnh viện duyệt trước khi dùng hồ sơ thật.

Kiểm tra đã thực hiện: 26 kiểm thử liên quan speech/kết quả/ngoại tuyến đạt; thử trên giao diện với dữ liệu giả lập bằng cách tắt hoàn toàn máy chủ cổng 4173, mở lại trang từ bộ nhớ ngoại tuyến, khôi phục ca đang nhập, bổ sung văn bản, hoàn thành và lưu kết quả, bác sĩ xác nhận kiểm tra, tải lại và xem được nội dung cùng các mốc giờ. Các kiểm tra trước đây này chỉ kiểm chứng nhập/lưu; phần nhận dạng local mới được kiểm tra riêng bên dưới.


## Model miễn phí phù hợp máy này — 14/11/2026

- Cấu hình đọc trực tiếp: Intel Core i5-1135G7, 4 nhân/8 luồng; RAM vật lý 7,79 GiB (máy 8 GB); Intel Iris Xe, không có NVIDIA trong danh sách GPU.
- Chọn **VinAI PhoWhisper-base**, 74 triệu tham số, bản INT8 chuyển trực tiếp từ trọng số chính chủ, 4 luồng CPU, beam size 1. Không chọn bản `.en`. Base ưu tiên độ nhẹ; đây là lựa chọn ban đầu cho máy này, chưa phải model tốt nhất về độ chính xác lâm sàng.
- Trọng số INT8 76.396.677 byte; cả thư mục khoảng 80 MB thập phân. Runtime, thư viện chuyển đổi và bản nguồn dùng thêm dung lượng. Máy hiện đã cài xong; không cần tải lại để sử dụng.
- Thử đoạn tiếng Việt công khai dài 3,74 giây qua đúng API ứng dụng: 0,715 / 0,635 / 0,648 giây sau khi model đã nạp (ba lần liên tiếp). Đoạn im lặng 3 giây trả văn bản rỗng. Tiến trình Python dùng khoảng 224 MiB working set sau phép thử; đây không phải đỉnh RAM hay cam kết cho ca dài. Thời gian chờ trên giao diện còn gồm lúc gom âm thanh và hàng đợi.
- Không có nhãn chuẩn của đoạn thử, chưa tính WER/CER; chưa thử tiếng phòng siêu âm, số đo, phủ định, BI-RADS, nhiều người nói, micro thật hay phiên liên tục dài. Không được suy từ tốc độ sang độ chính xác. Chưa chứng minh mức giảm tải công việc.
- Runtime chỉ nạp model local (`HF_HUB_OFFLINE=1`, `local_files_only=True`). Node phục vụ cùng địa chỉ cũ 127.0.0.1:4173, chuyển âm thanh đến Python ở 127.0.0.1:4181 với khóa phiên; không mở ra LAN, không CORS ngoài, không gửi định danh người bệnh, không ghi âm thanh hoặc bản chép vào log máy chủ. Lưu kết quả vẫn dùng IndexedDB cũ, không di chuyển/xóa kho.
- Chế độ dev của Vite không có proxy STT; dùng bản build và CHAY-SPEECH để thử micro. Cài model này trên máy tính chưa có nghĩa là điện thoại chạy được model hoặc truy cập được dịch vụ loopback của máy tính.

Nguồn: [PhoWhisper của VinAI, mô hình và kết quả đánh giá](https://github.com/VinAIResearch/PhoWhisper), [model card và giấy phép BSD-3-Clause](https://huggingface.co/vinai/PhoWhisper-base), [faster-whisper, INT8 CPU và VAD](https://github.com/SYSTRAN/faster-whisper). Trích dẫn công trình: Thanh-Thien Le, Linh The Nguyen, Dat Quoc Nguyen, *PhoWhisper: Automatic Speech Recognition for Vietnamese*, ICLR 2024 Tiny Papers. Giấy phép kèm theo: `docs/PhoWhisper-LICENSE.txt`.

Âm thanh thử: [mẫu VLSP công khai do tác giả VietAI đưa trong model card](https://huggingface.co/nguyenvulebinh/wav2vec2-base-vietnamese-250h/blob/main/README.md), tệp `audio-test/t1_0001-00010.wav`. Chỉ dùng để kiểm tra kỹ thuật cục bộ, không đóng gói vào giao diện hay coi là âm thanh lâm sàng. Có thể chạy lại bằng `python scripts/benchmark-speech.py <duong-dan-wav>` trong `.speech-venv` khi dịch vụ đang mở.

Kiểm tra bản local mới: 31 kiểm thử speech/kết quả/ngoại tuyến đạt; kiểm tra API từ chối origin ngoài, thiếu khóa, WAV không hợp lệ, kích thước vượt giới hạn và route lạ; pip check đạt; build thành công. Đã kiểm tra giao diện mới, chưa thu micro thực tế hay dùng âm thanh người bệnh để thử.

## Chuẩn bị học thuật ngữ và cách đọc của bác sĩ

Đã có trang `/speech-training.html` thu mẫu riêng, 80 câu giả lập, mẫu từ điển cách đọc và công cụ kiểm tra/ghép WAV + CSV. Xem `speech-training/HUONG-DAN.md`. Chưa có dữ liệu ghi âm đã duyệt, chưa fine-tune và chưa bật thay từ/hotwords trên kết quả. Bộ thu mẫu không dùng hoặc thay đổi kho ca bệnh hiện có.
