import {isTimestamp,businessDate,isDateOnly,identifier,numeric,integer,grossAmount,sumMoney,sumQuantity,scaledQuantity} from '../../shared/dataRules.mjs';
export const WEEK='2026-10-19', END='2026-10-26';
export const money=n=>new Intl.NumberFormat('vi-VN').format(n??0);
export function normalizeDate(v){
 if(typeof v==='number'){
  if(!Number.isFinite(v)||v<1||v>2958465)return null;
  return new Date(Math.round((v-25569)*86400000)).toISOString().replace('Z','+07:00');
 }
 return v;
}
const provenance=new Set(['source_file','source_sheet','source_row','source_file_hash','file_hash','source_hash','ingested_at']);
const amounts=new Set(['quantity','completed_qty','unit_price_vnd','completed_gross_vnd','completed_net_vnd','discount_vnd','discount_known','in_snapshot','package_allocation_vnd','gross_order_vnd','net_order_vnd','revision','is_synthetic']);
const signature=r=>JSON.stringify(Object.keys(r).filter(k=>!provenance.has(k)).sort().map(k=>[k,amounts.has(k)&&numeric(r[k])?+r[k]:r[k]]));
export function validate(rows,catalog,{suspectedDuplicates=false}={}){
 const codes=new Set(catalog.map(r=>r.code)),valid=[],issues=[],duplicates=[];
 const entries=rows.map((r,i)=>({row:r,index:i,reasons:[]})),groups=new Map(),visitPatients=new Map();
 for(const e of entries){
  const r=e.row,a=e.reasons;
  if(!r||typeof r!=='object'){a.push('Dòng dữ liệu không hợp lệ');continue;}
  for(const k of ['order_id','patient_id','visit_id'])if(!identifier(r[k]))a.push(`Mã ${k} phải là chuỗi không trống; giữ số 0 đầu`);
  if(!codes.has(r.service_code))a.push('Mã dịch vụ chưa có trong danh mục');
  if(!numeric(r.quantity)||+r.quantity<=0||+r.quantity>1e9)a.push('Số lượng phải lớn hơn 0 và trong giới hạn');
  try{scaledQuantity(r.quantity);}catch{a.push('Số lượng hỗ trợ tối đa 6 chữ số thập phân.');}
  if(!integer(r.unit_price_vnd)||+r.unit_price_vnd<0)a.push('Đơn giá phải là số nguyên VND hợp lệ');
  if(!isTimestamp(r.ordered_at))a.push('Ngày chỉ định phải là ISO hợp lệ và có múi giờ nếu có giờ');
  if(!['HOANTHANH','HUY','CHODUYET','CHOTHUCHIEN'].includes(r.status))a.push('Trạng thái chưa được hỗ trợ');
  if(![0,1,'0','1'].includes(r.in_snapshot))a.push('in_snapshot bắt buộc là 0 hoặc 1');
  if(![0,1,'0','1'].includes(r.discount_known))a.push('discount_known bắt buộc là 0 hoặc 1');
  if(!['MUALE','THEMNGOAIGOI','TRONGGOI'].includes(r.price_mode))a.push('price_mode chưa hợp lệ');
  if(r.discount_vnd!=null&&(!integer(r.discount_vnd)||+r.discount_vnd<0))a.push('Giảm giá không hợp lệ');
  if(r.status==='HOANTHANH'){
   if(!isTimestamp(r.completed_at))a.push('Thiếu ngày hoàn thành hợp lệ');
   if(isTimestamp(r.ordered_at)&&isTimestamp(r.completed_at)&&Date.parse(r.completed_at)<Date.parse(r.ordered_at))a.push('Hoàn thành trước chỉ định');
   if(!numeric(r.completed_qty)||+r.completed_qty<=0||+r.completed_qty>+r.quantity)a.push('Số lượng hoàn thành không hợp lệ');
   try{if(!integer(r.completed_gross_vnd)||+r.completed_gross_vnd!==grossAmount(r.completed_qty,r.unit_price_vnd))a.push('Thành tiền không khớp số lượng hoàn thành × đơn giá');}catch{a.push('Không tính được thành tiền an toàn');}
   const net=r.completed_net_vnd;
   if(net!=null&&(!integer(net)||+net<0||+net>+r.completed_gross_vnd))a.push('Giá trị sau giảm nằm ngoài khoảng hợp lệ');
   if(+r.discount_known===0&&net!=null)a.push('Chưa biết giảm giá nhưng đã có giá trị sau giảm');
   if(+r.discount_known===1){
    if(r.price_mode==='TRONGGOI'){
     if(net!=null&&(!identifier(r.package_id)||!integer(r.package_allocation_vnd)||+net!==+r.package_allocation_vnd))a.push('Giá trị gói phải khớp phân bổ và có mã gói');
    }else if(net!=null&&(!integer(r.discount_vnd)||+net!==+r.completed_gross_vnd-(+r.discount_vnd)))a.push('Sau giảm không khớp trước giảm trừ giảm giá');
   }
  }else if((r.completed_qty!=null&&(!numeric(r.completed_qty)||+r.completed_qty!==0))||((r.completed_gross_vnd!=null&&+r.completed_gross_vnd!==0)||r.completed_net_vnd!=null))a.push('Chưa hoàn thành nhưng có sản lượng hoặc giá trị hoàn thành');
  if(identifier(r.order_id)){if(!groups.has(r.order_id))groups.set(r.order_id,[]);groups.get(r.order_id).push(e);}
  if(identifier(r.visit_id)&&identifier(r.patient_id)){if(!visitPatients.has(r.visit_id))visitPatients.set(r.visit_id,new Set());visitPatients.get(r.visit_id).add(r.patient_id);}
 }
 for(const es of groups.values())if(new Set(es.map(e=>signature(e.row))).size>1)for(const e of es)e.reasons.push('Trùng mã chỉ định nhưng khác nội dung; cách ly toàn bộ nhóm');
 const events=new Map();
 for(const e of entries){const r=e.row;if(!r||!identifier(r.patient_id)||!identifier(r.visit_id)||!isTimestamp(r.ordered_at))continue;const key=JSON.stringify(['patient_id','visit_id','service_code','ordered_at'].map(k=>amounts.has(k)&&numeric(r[k])?+r[k]:r[k]??null));if(!events.has(key))events.set(key,[]);events.get(key).push(e);}
 for(const es of events.values())if(suspectedDuplicates&&new Set(es.map(e=>e.row.order_id)).size>1)for(const e of es)e.reasons.push('Nghi trùng dịch vụ cùng bệnh nhân/lượt/thời điểm nhưng khác khóa; đối soát trước khi tính');
 const accepted=new Set();
 for(const e of entries){
  const r=e.row;if(visitPatients.get(r?.visit_id)?.size>1)e.reasons.push('Một lượt khám bị gán cho nhiều bệnh nhân');
  if(e.reasons.length){issues.push({key:`${r?.order_id||'row'}-${e.index}`,...e});continue;}
  if(accepted.has(r.order_id)){duplicates.push({row:r,index:e.index});continue;}
  accepted.add(r.order_id);valid.push(r);
 }
 try{sumMoney(valid.filter(r=>r.status==='HOANTHANH').map(r=>r.completed_gross_vnd));sumMoney(valid.filter(r=>r.status==='HOANTHANH'&&r.completed_net_vnd!=null).map(r=>r.completed_net_vnd));sumQuantity(valid.filter(r=>r.status==='HOANTHANH').map(r=>r.completed_qty));}catch(error){for(const r of valid)issues.push({key:'overflow-'+r.order_id,row:r,index:rows.indexOf(r),reasons:[error.message]});valid.length=0;}
 return {valid,issues,duplicates};
}
export function aggregate(rows,catalog,week=WEEK,end=END){
 if(!isDateOnly(week)||!isDateOnly(end)||week>=end)throw Error('Khoảng ngày báo cáo không hợp lệ.');
 const inRange=d=>{const day=businessDate(d);return day&&day>=week&&day<end;};
 const completed=rows.filter(r=>r.status==='HOANTHANH'&&inRange(r.completed_at)&&+r.in_snapshot===1);
 const ordered=rows.filter(r=>inRange(r.ordered_at));
 const table=catalog.map(c=>{const rs=completed.filter(r=>r.service_code===c.code);return {...c,qty:sumQuantity(rs.map(r=>r.completed_qty)),gross:sumMoney(rs.map(r=>r.completed_gross_vnd)),net:sumMoney(rs.filter(r=>r.completed_net_vnd!=null).map(r=>r.completed_net_vnd)),missing:rs.filter(r=>r.completed_net_vnd==null).length,rows:rs};});
 return {table,completed,ordered,qty:sumQuantity(table.map(r=>r.qty)),gross:sumMoney(table.map(r=>r.gross)),net:sumMoney(table.map(r=>r.net)),missing:table.reduce((s,r)=>s+r.missing,0),patients:new Set(ordered.map(r=>r.patient_id)).size,visits:new Set(ordered.map(r=>r.visit_id)).size,late:rows.filter(r=>r.status==='HOANTHANH'&&inRange(r.completed_at)&&+r.in_snapshot!==1).length};
}
