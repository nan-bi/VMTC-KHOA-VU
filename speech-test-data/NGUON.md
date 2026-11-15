# Nguồn bộ thử tổng hợp

Giọng: vi_VN-vais1000-medium, một giọng TTS; không gán thành giọng bác sĩ/vùng miền thật.
Piper 1.8.0: https://github.com/OHF-Voice/piper1-gpl (GPL-3.0).
Model card: https://huggingface.co/rhasspy/piper-voices/blob/main/vi/vi_VN/vais1000/medium/MODEL_CARD
Dataset VAIS1000: model card ghi CC BY 4.0. Ghi nhận tác giả/model: VAIS1000 corpus, Rhasspy/Piper voice contributors.
Model SHA256: ec7c89e2c85f4d1edc24b6120c18aaf1bda614f06b511567eb9c7c0de15e2dab
Nội dung câu: tự soạn, ca giả lập; không có dữ liệu người bệnh. Tiếng ồn: sinh bằng NumPy/SciPy; giọng nền cũng TTS.
Biến thể tốc độ dùng length_scale Piper; không tương đương cách luyến âm thật. Các seed tiếng ồn cố định; WAV có SHA256; bản thân TTS có thành phần ngẫu nhiên và đã cache bản nguồn.
SNR tính trên toàn đoạn câu nguồn trước khi đệm, cùng gain chống clipping cho hỗn hợp; không phải độ ồn đo tại phòng khám.
Các câu có nói chồng: reference chỉ là lời mục tiêu. Ứng dụng hiện chép tất cả lời nói nên việc chép cả giọng nền được báo riêng, không coi là lỗi crash hay đã tách người nói.
Các file này CHỈ để test; human_verified=no, không dùng làm dữ liệu huấn luyện có nhãn thật.
