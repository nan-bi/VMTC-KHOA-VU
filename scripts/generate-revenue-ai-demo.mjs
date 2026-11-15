import fs from 'node:fs/promises';
import * as XLSX from 'xlsx';
const seed=JSON.parse(await fs.readFile(new URL('../src/data/seed.json',import.meta.url)));
const folder=new URL('../data_gialap/AI_DOANHTHU_DEMO/',import.meta.url);await fs.mkdir(folder,{recursive:true});
const base=seed.CANONICAL.find(r=>r.status==='HOANTHANH'&&r.price_mode==='MUALE');
function row(id,ordering,performing,price){return {...base,order_id:'LOCAL-DEMO-AI-'+id,patient_id:'DEMO-AI-P'+id,visit_id:'DEMO-AI-V'+id,service_code:'SYN-DV001',service_name:'Khám chuyên khoa Vú · GIẢ LẬP',performing_room:null,ordering_dept:ordering,performing_dept:performing,ordered_at:'2026-10-23T08:00:00+07:00',completed_at:'2026-10-23T09:00:00+07:00',status:'HOANTHANH',quantity:1,completed_qty:1,unit_price_vnd:price,completed_gross_vnd:price,completed_net_vnd:price,gross_order_vnd:price,net_order_vnd:price,discount_known:1,discount_vnd:0,price_mode:'MUALE',package_id:null,package_allocation_vnd:null,in_snapshot:1,is_synthetic:1};}
const a=row('001','VU','VU',450000),b={...row('002','VU','CDHA',3200000),service_code:'SYN-DV020',service_name:'Dịch vụ ngoài khoa · GIẢ LẬP'},c=row('003','KSKTQ','VU',200000),d=row('004','Đơn vị chưa xác nhận','CDHA',500000);
function book(sheets){const w=XLSX.utils.book_new();for(const [name,rows] of Object.entries(sheets))XLSX.utils.book_append_sheet(w,XLSX.utils.json_to_sheet(rows),name);return XLSX.write(w,{type:'buffer',bookType:'xlsx'});}
// No indication/HIS columns required for folder mode.
const noID=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['order_id','his_order_id'].includes(k)));
const bytes=book({VU_CHI_DINH:[a,b].map(noID),BANG_TONG_HOP:[{'Nội dung':'Bảng tổng hợp không nhập thành dịch vụ','Tổng':3650000}]});
await fs.writeFile(new URL('01_VU_chi_dinh.xlsx',folder),bytes);await fs.writeFile(new URL('03_ban_sao_doi_ten.xlsx',folder),bytes);
await fs.writeFile(new URL('02_ngoai_pham_vi_va_cho_xac_nhan.xlsx',folder),book({CHI_TIET:[c,d].map(noID)}));
await fs.writeFile(new URL('README.txt',folder),'DỮ LIỆU GIẢ LẬP, KHÔNG PHẢI GIÁ BỆNH VIỆN.\nChọn cả thư mục này tại Nhập dữ liệu rồi kiểm tra xem trước.\nKỳ 23/10/2026. 2 dòng Vú chỉ định: 3.650.000 VND theo giá nguồn; 1 dòng khoa khác chỉ định: 200.000 VND bị loại khỏi phạm vi; 1 dòng chưa rõ khoa: 500.000 VND chờ xác nhận, chưa cộng.\nMột workbook đổi tên có cùng bytes được bỏ. Sheet BANG_TONG_HOP chưa nhập và được báo riêng. Không cần cột mã chỉ định/HIS.\nNếu dashboard đã cấu hình đơn giá thì giá × lượng theo cấu hình có thể khác giá nguồn; xem căn cứ giá. Không tự thêm nhãn cho đơn vị chưa xác nhận.\n');
console.log('Created 3 synthetic Excel workbooks in data_gialap/AI_DOANHTHU_DEMO.');
