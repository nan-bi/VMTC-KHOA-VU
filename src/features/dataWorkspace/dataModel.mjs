import {validate} from '../reports/core.mjs';
import {businessDate,grossAmount,integer,sumMoney,sumQuantity} from '../../shared/dataRules.mjs';
export const FIELD_LABELS={patient_name:'Họ tên người bệnh',patient_dob:'Ngày sinh đầy đủ',patient_age:'Tuổi tại ngày chỉ định',order_id:'Khóa dòng nội bộ',patient_id:'Mã bệnh nhân',visit_id:'Mã lượt',service_code:'Mã dịch vụ',service_name:'Tên dịch vụ',ordered_at:'Ngày chỉ định',completed_at:'Ngày hoàn thành',result_returned_at:'Thời điểm trả kết quả',status:'Trạng thái',quantity:'SL chỉ định',completed_qty:'SL hoàn thành',unit_price_vnd:'Đơn giá VND',gross_order_vnd:'Trước giảm chỉ định VND',net_order_vnd:'Sau giảm chỉ định VND',completed_gross_vnd:'Trước giảm hoàn thành VND',completed_net_vnd:'Sau giảm/phân bổ VND',discount_known:'Đã biết giảm giá',discount_vnd:'Giảm giá VND',price_mode:'Cơ chế giá',package_id:'Mã gói',package_allocation_vnd:'Phân bổ gói VND',ordering_dept:'Khoa chỉ định',performing_dept:'Khoa thực hiện',performing_room:'Phòng thực hiện',imaging_doctor:'Bác sĩ CĐHA',clinical_doctor:'Bác sĩ lâm sàng',performing_doctor_name:'Bác sĩ thực hiện',ordering_doctor_name:'Bác sĩ chỉ định',source_file:'File nguồn',source_sheet:'Sheet nguồn',source_row:'Dòng nguồn',source_file_hash:'SHA-256 file gốc',drug_cost_vnd:'Dược VND',material_cost_vnd:'VTTH VND',in_snapshot:'Trong kỳ chốt',birads:'BI-RADS từ nguồn',encounter_type:'Loại lượt',location:'Địa điểm',revision:'Phiên bản dòng'};
export const NUMERIC_FIELDS=['patient_age','quantity','completed_qty','unit_price_vnd','discount_known','discount_vnd','package_allocation_vnd','in_snapshot','drug_cost_vnd','material_cost_vnd','birads'];
export const EDIT_FIELDS=['patient_name','patient_dob','patient_age','service_code','service_name','ordered_at','completed_at','status','quantity','completed_qty','unit_price_vnd','discount_known','discount_vnd','price_mode','package_id','package_allocation_vnd','ordering_dept','performing_dept','performing_room','imaging_doctor','clinical_doctor','ordering_doctor_name','performing_doctor_name','drug_cost_vnd','material_cost_vnd','in_snapshot','encounter_type','location','result_returned_at','birads'];
export const sourceKey=r=>JSON.stringify([r.source_file||'Nguồn hiện tại',r.source_sheet||'CANONICAL']);
const same=(a,b)=>a===b||(a==null&&b==null);
export function editedRow(before,patch,catalog){
 for(const key of Object.keys(patch))if(!EDIT_FIELDS.includes(key))throw Error(`Không sửa trực tiếp cột ${key}; giữ liên kết mã và nguồn gốc.`);
 const row={...before};
 for(const [key,value] of Object.entries(patch))row[key]=NUMERIC_FIELDS.includes(key)?(value==null||value===''?null:value):typeof value==='string'?(value.trim()||null):value;
 const changed=key=>!same(row[key],before[key]);
 if(changed('service_code')){const service=catalog.find(c=>c.code===row.service_code);if(!service)throw Error('Mã dịch vụ chưa có trong danh mục.');row.service_name=service.name;row.group=service.group;}
 if(changed('quantity')||changed('unit_price_vnd'))row.gross_order_vnd=grossAmount(row.quantity,row.unit_price_vnd);
 const financeChanged=['quantity','unit_price_vnd','completed_qty','status','discount_known','discount_vnd','price_mode','package_id','package_allocation_vnd'].some(changed);
 if(financeChanged){
  if(row.status==='HOANTHANH'){
   row.completed_gross_vnd=grossAmount(row.completed_qty,row.unit_price_vnd);
   row.completed_net_vnd=+row.discount_known!==1?null:row.price_mode==='TRONGGOI'?(integer(row.package_allocation_vnd)?+row.package_allocation_vnd:null):integer(row.discount_vnd)?row.completed_gross_vnd-(+row.discount_vnd):null;
  }else{row.completed_qty=0;row.completed_at=null;row.completed_gross_vnd=0;row.completed_net_vnd=null;}
  row.net_order_vnd=+row.discount_known!==1||row.gross_order_vnd==null?null:row.price_mode==='TRONGGOI'?(integer(row.package_allocation_vnd)?+row.package_allocation_vnd:null):integer(row.discount_vnd)?+row.gross_order_vnd-(+row.discount_vnd):null;
 }
 if(changed('completed_at'))row.completed_week=null;
 if(changed('ordered_at'))row.ordered_week=null;
 if(row.patient_age!=null&&(!integer(row.patient_age)||+row.patient_age<0||+row.patient_age>130))throw Error('Tuổi phải là số nguyên từ 0 đến 130 hoặc để trống.');
 if(row.birads!=null&&![0,1,2,3,4,5,6].includes(+row.birads))throw Error('BI-RADS phải là giá trị cấu trúc 0–6 hoặc để trống.');
 for(const field of ['drug_cost_vnd','material_cost_vnd'])if(row[field]!=null&&(!integer(row[field])||+row[field]<0))throw Error('Chi phí phải là số nguyên VND không âm hoặc để trống.');
 return row;
}
export function saveDataEdit(state,{index,patch,reason,expectedRevision,actor='Nhập / đối soát'},catalog){
 if(state.revision!==expectedRevision)throw Error('Nguồn đã đổi ở phiên khác. Mở lại dòng trước khi sửa.');
 if(actor!=='Nhập / đối soát')throw Error('Tài khoản này chỉ được xem dữ liệu.');
 if(state.report)throw Error('Nguồn đã chốt báo cáo. Mở kỳ làm việc mới trước khi sửa.');
 if(!Number.isInteger(index)||!state.rows[index]||state.excluded.includes(index))throw Error('Dòng không còn được phép chỉnh sửa.');
 if(typeof reason!=='string'||reason.trim().length<8)throw Error('Ghi lý do chỉnh sửa tối thiểu 8 ký tự.');
 const before=state.rows[index],after=editedRow(before,patch,catalog),rows=state.rows.map((r,i)=>i===index?after:r),active=rows.map((row,index)=>({row,index})).filter(e=>!state.excluded.includes(e.index));
 const old=validate(active.map(e=>state.rows[e.index]),catalog),checked=validate(active.map(e=>e.row),catalog),local=active.findIndex(e=>e.index===index);
 const oldIssues=new Set(old.issues.flatMap(e=>e.reasons.map(reason=>`${e.index}:${reason}`)));
 const newIssues=checked.issues.filter(e=>e.index===local||e.reasons.some(reason=>!oldIssues.has(`${e.index}:${reason}`)));
 if(newIssues.length)throw Error([...new Set(newIssues.flatMap(e=>e.reasons))].join('; '));
 if(checked.duplicates.some(e=>e.index===local))throw Error('Chỉnh sửa tạo dòng trùng với một chỉ định đã có.');
 const changes=Object.keys(after).filter(key=>!same(before[key],after[key])).map(field=>({field,before:before[field]??null,after:after[field]??null}));
 if(!changes.length)throw Error('Chưa có nội dung thay đổi.');
 const next=structuredClone(state);next.rows[index]=after;next.dataEdits??=[];next.dataEdits.unshift({id:crypto.randomUUID(),index,order_id:before.order_id,source_file:before.source_file,source_sheet:before.source_sheet||'CANONICAL',source_row:before.source_row,time:new Date().toISOString(),actor,reason:reason.trim(),changes});
 return next;
}
export function dataView(rows,{source='all',group='all',status='all',search='',from,toExclusive,basis='completed_at'}={},catalog=[]){
 const groups=new Map(catalog.map(c=>[c.code,c.group])),needle=search.trim().toLocaleLowerCase('vi');
 return rows.map((row,index)=>({row,index})).filter(({row})=>{
  if(source!=='all'&&sourceKey(row)!==source||group!=='all'&&groups.get(row.service_code)!==group||status!=='all'&&row.status!==status)return false;
  if(basis!=='all'){const day=businessDate(row[basis]);if(!day||day<from||day>=toExclusive)return false;}
  return !needle||Object.values(row).some(v=>v!=null&&String(v).toLocaleLowerCase('vi').includes(needle));
 });
}
export function chartDetails(entries,focus,catalog){
 const groups=new Map(catalog.map(c=>[c.code,c.group]));
 return entries.filter(({row})=>{
  if(row.status!=='HOANTHANH'||+row.in_snapshot!==1||focus.metric==='net'&&row.completed_net_vnd==null)return false;
  const name=focus.kind==='day'?businessDate(row.completed_at):focus.kind==='group'?groups.get(row.service_code):row.clinical_doctor||row.ordering_doctor_name||row.ordering_doctor_id;
  return (name||'Chưa có thông tin')===focus.value;
 });
}
export function chartSummary(rows,catalog){
 const groups=new Map(catalog.map(c=>[c.code,c.group])),completed=rows.filter(r=>r.status==='HOANTHANH'&&+r.in_snapshot===1);
 const series=key=>{const map=new Map();for(const r of completed){const name=key(r)||'Chưa có thông tin';if(!map.has(name))map.set(name,[]);map.get(name).push(r);}return [...map].map(([name,rs])=>({name,qty:sumQuantity(rs.map(r=>r.completed_qty)),gross:sumMoney(rs.map(r=>r.completed_gross_vnd)),net:sumMoney(rs.filter(r=>r.completed_net_vnd!=null).map(r=>r.completed_net_vnd)),missing:rs.filter(r=>r.completed_net_vnd==null).length}));};
 return {qty:sumQuantity(completed.map(r=>r.completed_qty)),gross:sumMoney(completed.map(r=>r.completed_gross_vnd)),net:sumMoney(completed.filter(r=>r.completed_net_vnd!=null).map(r=>r.completed_net_vnd)),missing:completed.filter(r=>r.completed_net_vnd==null).length,days:series(r=>businessDate(r.completed_at)).sort((a,b)=>a.name.localeCompare(b.name)),groups:series(r=>groups.get(r.service_code)),doctors:series(r=>r.clinical_doctor||r.ordering_doctor_name||r.ordering_doctor_id),performed:completed.length};
}
