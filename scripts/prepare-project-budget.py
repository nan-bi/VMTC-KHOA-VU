"""Prepare a proposal only: no subscriptions, API calls, patient data or payment."""
from pathlib import Path
import csv
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'docs/kinh-phi-20261117'
OUT.mkdir(exist_ok=True)
RATE = 27000  # Planning assumption, NOT a verified live exchange rate.
MONTHS = 3
headers = ['Mã','Tên khoa phòng','Loại tài nguyên','Cấu hình / Chi tiết','Số lượng','Mục đích sử dụng','Đơn giá (VNĐ/tháng)','Thành tiền (VNĐ/tháng)','Trạng thái','Ghi chú']
resources = [
 ['TC-14','Khoa Vú','Tài khoản','Claude Pro, 1 người dùng, thanh toán tháng (20 USD/tháng)',1,'Hỗ trợ lập trình, rà soát quy tắc và tài liệu cho dashboard; hỗ trợ xây dựng bộ thu/đánh giá speech-to-text.',20*RATE,20*RATE,'','Đề xuất thử 3 tháng. Tỷ giá dự toán 27.000 VND/USD; chưa gồm thuế/phí. Dùng mã và dữ liệu giả lập; không phải API nhận dạng giọng nói.'],
 ['TC-14','Khoa Vú','Tài khoản','ChatGPT Pro 100, có Codex, 1 người dùng (100 USD/tháng)',1,'Phát triển, kiểm thử và sửa lỗi dashboard/backend; hỗ trợ tối ưu, đánh giá pipeline speech-to-text local.',100*RATE,100*RATE,'','Phương án Pro mức khởi đầu, thử 3 tháng. Codex nằm trong gói, không mua thêm gói riêng. Tổng 2 thuê bao: 3.240.000 VND/tháng; 3 tháng 9.720.000 + dự phòng tổng hợp 10% 972.000 = 10.692.000 VND. Nếu mua cả micro/ổ sao lưu tùy chọn: 13.442.000 VND/3 tháng đã dự phòng. Pro 200 thay Pro 100 tăng 2.700.000 VND/tháng, chưa tính. Không mua credits/API ngoài gói. Giá đối chiếu 17/11/2026: https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers ; Claude: https://claude.com/pricing ; tỷ giá dự toán 27.000 VND/USD, giá checkout có thể khác.'],
 ['TC-14','Khoa Vú','Server','Đề nghị cấp/mượn máy nội bộ: 4 vCPU, RAM 8 GB, SSD 100 GB; không GPU',1,'Môi trường thử dashboard với 3–5 người; IT cấu hình truy cập nội bộ/HTTPS, phân quyền và sao lưu. STT vẫn xử lý tại máy thu.',0,0,'','Ưu tiên hạ tầng sẵn có, 0 là tiền thuê ngoài dự kiến, không phải máy chủ miễn phí được cam kết. Bản hiện tại chạy loopback; cần IT kiểm tra trước khi mở LAN. Nếu phải thuê ngoài: xin báo giá riêng.'],
 ['TC-14','Khoa Vú','Database','SQLite local hiện có; cấp tối thiểu 20 GB trong ổ máy nội bộ, có sao lưu và thử khôi phục',1,'Lưu kho dashboard, lịch sử và báo cáo; kiểm tra backup/restore. Ca speech vẫn IndexedDB theo thiết kế hiện tại.',0,0,'','Không mua database cloud riêng. 20 GB nằm trong SSD 100 GB của server, không cộng thêm tiền hai lần; chưa phải đồng bộ kho speech.'],
 ['TC-14','Khoa Vú','GPU','Xin dùng chung GPU nội bộ 16–24 GB VRAM, tối đa 20 giờ thử đầu; cấp sau khi có audio được duyệt',1,'So sánh model ASR lớn hơn; chỉ cân nhắc fine-tune khi có đủ nhãn thật và tập đánh giá giữ riêng.',0,0,'','Chưa cần mua GPU hoặc thuê GPU dài hạn. Dùng chung nội bộ theo lịch, không có cam kết được cấp. Nếu thuê ngoài phải báo giá và duyệt dữ liệu/chi phí riêng; tài khoản Claude/Codex không cung cấp GPU này.'],
 ['TC-14','Khoa Vú','Khác','Hỗ trợ nghiệp vụ: 1 đầu mối khoa/PO, 1 bác sĩ xác nhận, 1 thư ký/điều dưỡng và IT',1,'Xác nhận danh mục/giá/quy tắc và bộ chuẩn độc lập cho dashboard; đo thời gian trước/sau. Thu thử 3–5 giọng, trước mắt 1–2 giờ audio ca giả có bản chép được duyệt.',0,0,'','Nguồn lực khoa phối hợp, cần thống nhất lịch và khối lượng; không coi công sức là miễn phí. STT chưa đủ chính xác dùng độc lập; mẫu tổng hợp không thay nhãn thật. Chỉ ghi âm ca giả trước, không đưa dữ liệu bệnh nhân lên tài khoản AI cá nhân.'],
 ['TC-14','Khoa Vú','Khác','Micro USB hướng thu gần miệng, 1 bộ; ưu tiên mượn trước',1,'Thử nhận giọng bác sĩ tại phòng siêu âm với micro thật và tiếng ồn thực tế.',None,None,'','Giai đoạn STT sau, chưa tính vào thuê bao tháng. Trần dự toán mua 1 lần: 1.000.000 VND (chưa có báo giá); chỉ mua nếu micro hiện có/mượn không đạt.'],
 ['TC-14','Khoa Vú','Khác','SSD/ổ sao lưu 1 TB, 1 bộ; ưu tiên vùng lưu do IT cấp',1,'Sao lưu mã, model và dữ liệu thử; kiểm tra phục hồi. Nếu có dữ liệu nhạy cảm phải dùng lưu trữ được IT phê duyệt.',None,None,'','Tùy chọn, chưa tính vào thuê bao tháng. Trần dự toán mua 1 lần: 1.500.000 VND (chưa có báo giá); không mua nếu đã có lưu trữ và backup phù hợp.'],
]
project_headers=['Nhóm giải pháp (Archetype)','Need Statement (Chuẩn Biodesign)','Sign-off & An toàn JCI/PII','Link Dữ liệu kiểm thử (Mock Data & Schema)','Mức độ hoàn thiện MVP dự kiến tính đến 19/11','Chỉ số Tác động kì vọng (Before vs. After)','Link github','Link Hồ sơ Gate 1 (Drive)','Điểm nghẽn (cần hỗ trợ gì?)','Next Action (48h)']
project = [
 'Audit & Sync',
 'Cần một cách giúp thư ký/điều dưỡng Khoa Vú tổng hợp hoạt động và doanh thu từ các file đầu vào, truy nguyên và đối soát trước khi duyệt, nhằm giảm thời gian làm báo cáo và sai lệch ghi nhận. Hướng tiếp theo: bác sĩ đọc tự nhiên để tạo bản chép siêu âm chờ kiểm tra, giảm gõ tay.',
 '⏳ Đang xin chữ ký',
 'https://github.com/nan-bi/VMTC-KHOA-VU/tree/main/speech-test-data',
 'Chạy trọn vẹn 1 luồng',
 'Dashboard: chưa có số đo thời gian trước/sau; đề xuất mục tiêu giảm >=50% thời gian lập báo cáo sau pilot. Sai số tài chính <0,05% là mục tiêu, chưa được chứng minh bằng chuẩn độc lập. STT: đo thời gian sửa bản chép và lỗi phủ định/bên/số đo trên giọng thật; chưa cam kết ngưỡng chính xác.',
 'https://github.com/nan-bi/VMTC-KHOA-VU',
 '',
 'Ưu tiên dashboard: cần khoa xác nhận danh mục, giá, quy tắc gói và bộ chuẩn độc lập; xử lý xung đột nguồn trước chốt. STT: mới có bộ âm thanh tổng hợp, còn lỗi nhận dạng; cần audio ca giả đọc thật và bác sĩ duyệt. Xin 2 tài khoản lập trình, hạ tầng nội bộ và đầu mối khoa/IT; chưa cần API LLM hay GPU mua riêng.',
 'Trong 48h: xác nhận người phụ trách/số thành viên, hoàn tất sign-off và link hồ sơ Gate 1; chọn bộ chuẩn dashboard, đối soát nguồn, đo thời gian thao tác trước/sau; demo luồng nhập–đối soát–duyệt–xuất. STT chỉ demo quy trình và lên lịch thu giọng thật. Xin duyệt kinh phí thử 3 tháng.',
]

def tsv(name, rows):
 with (OUT/name).open('w',encoding='utf-8-sig',newline='') as f:
  csv.writer(f,delimiter='\t',lineterminator='\n').writerows(rows)

tsv('yeu-cau-tai-nguyen-B-K.tsv',resources)
tsv('khai-bao-du-an-E-N.tsv',[project])
wb=Workbook();ws=wb.active;ws.title='Yeu cau tai nguyen';ws.append(headers)
for row in resources:ws.append(row)
ws.append(['','','','','','','Tong thue bao/thang','=SUM(H2:H9)','','Khong gom mua 1 lan; server/GPU la xin cap noi bo, chua co bao gia thue ngoai.'])
ps=wb.create_sheet('Khai bao du an');ps.append(['Truong','Noi dung'])
for h,v in zip(project_headers,project):ps.append([h,v])
ps.append(['Chua tu dien','So thanh vien, nhom truong/PO, ho ten/email nguoi dang ky, link Gate 1 can nguoi dung xac nhan. Khong sua cot den rui ro/duyet.'])
budget=wb.create_sheet('Du toan 3 thang')
for row in [
 ['Hạng mục','Số lượng','Đơn giá VND','Thành tiền VND','Căn cứ / phạm vi'],
 ['Claude Pro - tháng',MONTHS,20*RATE,'=B2*C2','20 USD/tháng; dùng tỷ giá dự toán'],
 ['ChatGPT Pro 100 có Codex - tháng',MONTHS,100*RATE,'=B3*C3','100 USD/tháng; không tính thêm Codex riêng'],
 ['Cộng thuê bao 3 tháng',None,None,'=SUM(D2:D3)','Không mua API/credits ngoài gói'],
 ['Dự phòng 10% thuê bao',None,None,'=D4*10%','Ước tính tổng hợp cho thuế/phí/tỷ giá; không phải mức thuế pháp định'],
 ['Phương án A: cần duyệt trước',None,None,'=SUM(D4:D5)','Tận dụng máy/micro/lưu trữ/hạ tầng sẵn có'],
 ['Micro USB tùy chọn - mua 1 lần',1,1000000,'=B7*C7','Trần dự toán, chưa phải báo giá, chỉ mua sau thử micro hiện có'],
 ['Ổ sao lưu 1 TB tùy chọn - mua 1 lần',1,1500000,'=B8*C8','Trần dự toán, chỉ mua khi IT không cấp được lưu trữ phù hợp'],
 ['Cộng thuê bao và thiết bị tùy chọn',None,None,'=D4+SUM(D7:D8)','Không phải chi phí tháng'],
 ['Dự phòng 10% phương án B',None,None,'=D9*10%','Không cộng lại khoản dự phòng phương án A'],
 ['Phương án B: có cả thiết bị tùy chọn',None,None,'=SUM(D9:D10)','Chưa gồm nhân công trả ngoài, mua PC, thuê GPU/server ngoài hay tích hợp HIS'],
 ['Pro 200 thay Pro 100: tăng thêm 3 tháng',3,100*RATE,'=B12*C12','Phương án thay thế, không mua cả hai gói OpenAI'],
 ['Tỷ giá lập dự toán (VND/USD)',1,RATE,'=B13*C13','Giả định ngân sách ngày 17/11/2026, không phải tỷ giá niêm yết/checkout'],
 ]:budget.append(row)
sources=wb.create_sheet('Nguon va gia dinh')
for row in [
 ['Nguồn','URL / ghi chú'],
 ['Claude Pro','https://claude.com/pricing'],
 ['OpenAI Pro tiers','https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers'],
 ['Codex trong gói ChatGPT','https://chatgpt.com/codex/pricing/'],
 ['Nguồn dự án local','backend/README.md; docs/31-KIEM-TRA-TRUOC-KHI-CAP-NHAT-GIT.md; speech-test-data/BAO-CAO.md; AI_HANDOFF.md'],
 ['Ngày đối chiếu giá','17/11/2026; giá công khai USD chưa phải giá thanh toán tại Việt Nam; xác nhận tại checkout trước mua'],
 ['Nguồn giá thiết bị','Chưa có báo giá; chỉ là trần ngân sách lập kế hoạch, không gán là giá thị trường đã xác minh'],
 ['Phạm vi','Đề xuất cho 1 người phát triển, 3 tháng. Không mua tài khoản, không bật billing/API hay chia sẻ tài khoản. Không đưa dữ liệu bệnh viện/bệnh nhân lên AI cá nhân.'],
 ['Đối chiếu trạng thái','Luồng dashboard local đã có bằng chứng thử; chưa xác nhận sai số thực tế <0,05%. STT tổng hợp WER 54,4%, chưa đại diện giọng bác sĩ thật. Không chạy lại kiểm thử ứng dụng trong tác vụ dự toán.'],
 ]:sources.append(row)
for sheet in wb:
 sheet.freeze_panes='A2';sheet.auto_filter.ref=sheet.dimensions
 sheet.row_dimensions[1].height=32
 for cell in sheet[1]:cell.font=Font(name='Arial',bold=True,color='FFFFFF');cell.fill=PatternFill('solid',fgColor='8F3D5D')
 for row in sheet.iter_rows(min_row=2):
  for cell in row:cell.font=Font(name='Arial',size=11);cell.alignment=Alignment(vertical='top',wrap_text=True)
  sheet.row_dimensions[row[0].row].height=78 if sheet==ws else 65
 for i in range(1,sheet.max_column+1):sheet.column_dimensions[get_column_letter(i)].width=22
ws.column_dimensions['D'].width=52;ws.column_dimensions['F'].width=65;ws.column_dimensions['J'].width=85
for col in ('G','H'):
 for row in range(2,11):ws[f'{col}{row}'].number_format='#,##0'
ps.column_dimensions['A'].width=45;ps.column_dimensions['B'].width=130
budget.column_dimensions['A'].width=55;budget.column_dimensions['E'].width=95
for row in range(2,14):budget[f'C{row}'].number_format='#,##0';budget[f'D{row}'].number_format='#,##0'
sources.column_dimensions['A'].width=40;sources.column_dimensions['B'].width=130
path=OUT/'TC-14-NHU-CAU-VA-KINH-PHI.xlsx';wb.save(path)
check=load_workbook(path);assert check.worksheets[0]['H2'].value==540000;assert check.worksheets[0]['H3'].value==2700000
assert check['Du toan 3 thang']['D11'].value=='=SUM(D9:D10)'
assert round(3*120*RATE*1.1)==10692000
assert round((3*120*RATE+2500000)*1.1)==13442000
print('Prepared 8 resource rows; AI 3,240,000 VND/month; A 10,692,000 / B 13,442,000 VND for 3 months including 10% reserve. XLSX and TSV verified.')
