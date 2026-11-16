import React,{useState} from 'react';
import {Alert,Button,Drawer,Space,Table,Tag} from 'antd';
import * as XLSX from 'xlsx';
import ColumnMapping from './ColumnMapping.jsx';
const labels={patient_id:'Mã BN',visit_id:'Mã lượt',service_code:'Mã DV',ordering_dept:'Khoa chỉ định',performing_dept:'Khoa thực hiện',ordered_at:'Ngày chỉ định',quantity:'Số lượng',completed_qty:'Số lượng hoàn thành',unit_price_vnd:'Đơn giá',status:'Trạng thái',price_mode:'Chế độ giá',discount_known:'Đã biết giảm giá',in_snapshot:'Trong snapshot'};
export default function ReferenceTables({tables=[],preview=false,onMap,disabled}){
 const [selected,setSelected]=useState(null);
 if(!tables.length)return null;
 function download(table,template=false){
  const book=XLSX.utils.book_new();
  // A blank schema is deliberate: reference totals must never become service transactions.
  const columns=template?Object.keys(labels):table.columns;
  const sheet=template?XLSX.utils.aoa_to_sheet([columns]):XLSX.utils.json_to_sheet(table.rows,{header:columns});
  XLSX.utils.book_append_sheet(book,sheet,template?'CANONICAL':'BANG_NGUON');
  if(template)XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Trường','Nội dung'],...Object.entries(labels),['Lưu ý','Điền từ dữ liệu nguồn đã xác nhận. Không sao chép số tổng thành dòng dịch vụ; không cần mã chỉ định.']]),'HUONG_DAN');
  XLSX.writeFile(book,template?'MAU_BO_SUNG_DICH_VU.xlsx':'BANG_'+table.sheet.replace(/[^\p{L}\p{N}_-]/gu,'_')+'.xlsx');
 }
 return <section className="panel" style={{marginTop:16}}><div className="panel-head"><h2>{preview?'Bảng đã nhận diện · xem trước':'Bảng tham chiếu đã lưu'}</h2><Tag>{tables.length} bảng</Tag></div><p className="subtle">Nhận diện cấu trúc local để tách bảng tổng hợp, KPI, mapping và tài chính còn thiếu liên kết. AI phân loại khoa chỉ áp dụng cho dòng dịch vụ có đủ căn cứ; các bảng dưới đây chưa cộng doanh thu.</p>
  <Table size="small" rowKey={t=>t.hash+t.file+t.sheet} dataSource={tables} pagination={{pageSize:5}} scroll={{x:720}} columns={[{title:'File / sheet',render:(_,t)=><>{t.file}<div className="subtle">{t.sheet} · tiêu đề dòng {t.headerRow}</div></>},{title:'Nhận diện',dataIndex:'label'},{title:'Dòng',render:(_,t)=>t.rows.length},{title:'Xử lý',render:(_,t)=><Button onClick={()=>setSelected(t)}>Xem bảng / cột thiếu</Button>}]}/>
  <Drawer title={selected?.sheet||'Bảng nguồn'} open={!!selected} onClose={()=>setSelected(null)} width="min(1100px, 100vw)" destroyOnClose>{selected&&<>{preview&&onMap&&<ColumnMapping key={selected.hash+selected.sheet} table={selected} disabled={disabled} onApply={profile=>{setSelected(null);onMap(profile)}}/>}<Alert showIcon type={selected.category==='FINANCIAL_PENDING'?'warning':'info'} message={selected.label} description={selected.reason}/>{selected.category==='FINANCIAL_PENDING'&&<p>Cần bổ sung/đối chiếu: {selected.missing.map(k=>labels[k]||k).join(', ')}. Không tự ghép theo mã gần giống hoặc tên bệnh nhân.</p>}<Space wrap style={{margin:'16px 0'}}><Button onClick={()=>download(selected)}>Xuất nguyên bảng</Button>{selected.category==='FINANCIAL_PENDING'&&<Button onClick={()=>download(selected,true)}>Tải mẫu bổ sung dịch vụ</Button>}</Space><Table size="small" rowKey={(_,i)=>String(selected.sourceRows[i])} dataSource={selected.rows} pagination={{pageSize:10}} scroll={{x:Math.max(700,selected.columns.length*180)}} columns={[{title:'Dòng nguồn',width:100,render:(_,r,i)=>selected.sourceRows[selected.rows.indexOf(r)]},...selected.columns.map(h=>({title:h,dataIndex:h,width:180,render:v=>v==null?'—':String(v)}))]}/></>}</Drawer>
 </section>;
}
