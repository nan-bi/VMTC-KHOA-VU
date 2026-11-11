import {validate} from '../reports/core.mjs';
import {businessDate,grossAmount,integer,sumMoney,sumQuantity} from '../../shared/dataRules.mjs';
import {assessTat} from './tat.mjs';
export const RULES_VERSION='VU-ROUTING-1';
export const ROUTES=['VU_INTERNAL','VU_OUTBOUND','VU_INBOUND','EXTERNAL_UNRELATED'];
export const ROUTE_NAMES={VU_INTERNAL:'A · Vú chỉ định / Vú làm',VU_OUTBOUND:'B · Vú chỉ định / khoa khác làm',VU_INBOUND:'C · Khoa khác chỉ định / Vú làm',EXTERNAL_UNRELATED:'D · Ngoài phạm vi'};
const departments=['VU','CDHA','KSKTQ','NOITRU','GPB','DITRUYEN','NGOAI','TAOHINH','UNGBUOU','XATRI','YHHN','XETNGHIEM','GAYME','GIAMNHE','DINHDUONG','PHCN','TAMLY','HTSS','SAN','NOI'];
const deptAliases={'KHOA-VU':'VU','KHOA-CDHA':'CDHA','KHOA-SKTQ':'KSKTQ','SKTQ':'KSKTQ','KHOA-GMHS':'GAYME','GMHS':'GAYME','KHOA-UNGBUOU':'UNGBUOU'};
export const ROOM_PROFILES={
 'local-12':{name:'Cơ cấu 12 phòng đã chốt',rooms:{assessment:'VU','clinic-1':'VU','clinic-2':'VU','clinic-3':'VU','clinic-4':'VU','us-3d':'VU','us-1':'VU','us-2':'VU',xray:'VU',counsel:'VU',procedure:'VU',recovery:'VU'}},
 'prompt-kb':{name:'Địa bàn theo prompt mới · cần xác nhận',rooms:{'PK-VU-01':'VU','PK-VU-02':'VU','PK-VU-03':'VU','PK-VU-04':'VU','TD-VU':'VU','SA-VU-01':'VU','SA-VU-02':'VU','CT-VU-01':'VU','CT-VU-02':'VU','HT-VU':'VU','KHOA-CDHA':'CDHA','KHOA-GMHS':'GAYME','KHOA-SKTQ':'KSKTQ','KHOA-UNGBUOU':'UNGBUOU'}},
};
const groupMap={'Khám vú':'KHÁM','Siêu âm vú':'SIÊU_ÂM','Siêu âm vi mạch':'SIÊU_ÂM','X-quang vú':'XQ_VÚ','MRI vú':'CĐHA_CAO_CẤP','Chẩn đoán hình ảnh khác':'CĐHA_CAO_CẤP','Sinh thiết':'CAN_THIỆP_TIỂU_PHẪU','Can thiệp lành tính':'CAN_THIỆP_TIỂU_PHẪU','Định vị':'ĐỊNH_VỊ','Giải phẫu bệnh':'GIẢI_PHẪU_BỆNH_GEN','Di truyền':'GIẢI_PHẪU_BỆNH_GEN','Ngoại vú':'PHẪU_THUẬT','Tạo hình vú':'PHẪU_THUẬT'};
export function department(value){if(typeof value!=='string')return null;const v=value.trim().toUpperCase();const id=deptAliases[v]||v;return departments.includes(id)?id:null;}
export function classify(row,catalog,profile='local-12'){
 const config=ROOM_PROFILES[profile];if(!config)throw Error('Cấu hình địa bàn không hợp lệ.');
 const c=catalog.find(c=>c.code===row.service_code),ordering=department(row.ordering_dept),performing=department(row.performing_dept);
 const room=row.performing_room||null,roomDept=room?config.rooms[room]:null,errors=[];
 if(!ordering||!performing)errors.push('UNKNOWN_DEPARTMENT');
 if(room&&!roomDept)errors.push('UNKNOWN_ROOM');
 if(roomDept&&performing&&roomDept!==performing)errors.push('ROOM_DEPARTMENT_CONFLICT');
 if(!c)errors.push('UNKNOWN_SERVICE');
 const category=ordering&&performing?(ordering==='VU'?(performing==='VU'?'VU_INTERNAL':'VU_OUTBOUND'):(performing==='VU'?'VU_INBOUND':'EXTERNAL_UNRELATED')):null;
 return {ordering,performing,room,routing_category:errors.length?null:category,kpi_category:c?(groupMap[c.group]||'HỖ_TRỢ_KHÁC'):null,errors,evidence:{ordering_raw:row.ordering_dept??null,performing_raw:row.performing_dept??null,room_raw:room,profile,rules_version:RULES_VERSION,service_group:c?.group??null}};
}
// Fingerprint includes all business fields, but ignores provenance. It is not a security hash.
export function fingerprint(row){return JSON.stringify(Object.keys(row).filter(k=>!['source_file','source_sheet','source_row','source_file_hash','file_hash','source_hash','ingested_at'].includes(k)).sort().map(k=>[k,row[k]]));}
export function analyze(rows,catalog,{from,toExclusive,profile='local-12'}={}){
 if(!businessDate(from)||!businessDate(toExclusive)||from>=toExclusive)throw Error('Khoảng ngày không hợp lệ.');
 const checked=validate(rows.map(r=>r.status==='HOANTIEN'?{...r,status:'HUY'}:r),catalog);
 const invalid=new Map(checked.issues.map(e=>[e.index,e.reasons])),dupes=new Set(checked.duplicates.map(e=>e.index));
 const identity=new Map();for(const r of rows){if(r.patient_name&&r.phone){const k=String(r.patient_name).trim().toLocaleLowerCase('vi')+'|'+String(r.phone).replace(/\D/g,'');if(!identity.has(k))identity.set(k,new Set());identity.get(k).add(r.patient_id);}}
 const inRange=d=>{const day=businessDate(d);return !!day&&day>=from&&day<toExclusive;};
 const records=rows.map((row,index)=>{
  const c=classify(row,catalog,profile),warnings=[...c.errors.map(code=>({code,description:'Khoa/phòng hoặc danh mục chưa đủ căn cứ; cần đối soát.'})),...(invalid.get(index)||[]).map(description=>({code:'INVALID_INPUT',description}))];
  const tat=assessTat(row,{performing:c.performing,kpi_category:c.kpi_category,service_group:c.evidence.service_group});
  if(tat.status==='DELAYED_TAT')warnings.push({code:'DELAYED_TAT',description:`TAT ${tat.tat_minutes} phút vượt ngưỡng demo ${tat.threshold_minutes} phút; cần kiểm tra, chưa phải SLA bệnh viện.`});
  if(tat.status==='INVALID_TAT_TIME')warnings.push({code:'INVALID_TAT_TIME',description:'Mốc chỉ định / trả kết quả không đủ giờ-múi giờ hoặc đảo thứ tự; không tính TAT.'});
  if(dupes.has(index))warnings.push({code:'DUPLICATE_EXCLUDED',description:'Bản trùng không cộng lại.'});
  if(row.status==='HUY'||row.status==='HOANTIEN')warnings.push({code:'CANCELLED_OR_REFUNDED',description:'Loại khỏi cả hai góc nhìn; hoàn tiền cần đối soát sổ thanh toán riêng.'});
  if(row.status==='HOANTIEN'&&+row.completed_qty>0)warnings.push({code:'REFUND_WITH_PRODUCTION',description:'Nguồn hoàn tiền vẫn ghi sản lượng; cần xác nhận chính sách, không tự bù trừ.'});
  if(row.status==='HOANTHANH'&&row.completed_net_vnd==null)warnings.push({code:row.price_mode==='TRONGGOI'?'MISSING_ALLOCATION':'MISSING_DISCOUNT',description:'Chưa đủ giá trị sau giảm/phân bổ; không tự suy ra.'});
  let orderGross=null;
  if(row.gross_order_vnd!=null){try{if(!integer(row.gross_order_vnd)||+row.gross_order_vnd!==grossAmount(row.quantity,row.unit_price_vnd))throw Error();orderGross=+row.gross_order_vnd;}catch{warnings.push({code:'ORDER_GROSS_MISMATCH',description:'Giá trị chỉ định nguồn không khớp số lượng × đơn giá.'});}}
  else warnings.push({code:'MISSING_ORDER_GROSS',description:'Thiếu thành tiền chỉ định nguồn; không lấy giá danh mục để điền.'});
  const k=row.patient_name&&row.phone?String(row.patient_name).trim().toLocaleLowerCase('vi')+'|'+String(row.phone).replace(/\D/g,''):null;
  if(k&&identity.get(k)?.size>1)warnings.push({code:'IDENTITY_REVIEW',description:'Trùng tên và điện thoại giữa nhiều mã bệnh nhân; chỉ gợi ý đối soát, không tự gộp.'});
  const eligible=!invalid.has(index)&&!dupes.has(index)&&c.routing_category!==null&&!['HUY','HOANTIEN'].includes(row.status);
  return {key:`${row.source_file||'source'}:${row.source_row||index+1}:${index}`,index,row,...c,tat,warnings,eligible,orderGross,orderedInPeriod:inRange(row.ordered_at),performedInPeriod:row.status==='HOANTHANH'&&+row.in_snapshot===1&&inRange(row.completed_at),fingerprint:fingerprint(row),action_required:dupes.has(index)||['HUY','HOANTIEN'].includes(row.status)?'Loại trừ':warnings.length?'Cần đối soát thủ công':'Hợp lệ'};
 });
 const related=records.filter(r=>r.eligible&&r.routing_category!=='EXTERNAL_UNRELATED'),ordered=related.filter(r=>r.orderedInPeriod),performed=related.filter(r=>r.performedInPeriod);
 const finance=rs=>{const known=rs.filter(r=>r.orderGross!=null);return {known_vnd:sumMoney(known.map(r=>r.orderGross)),missing_records:rs.length-known.length,complete:known.length===rs.length};};
 const performedFinance=rs=>({gross_vnd:sumMoney(rs.map(r=>r.row.completed_gross_vnd)),known_net_vnd:sumMoney(rs.filter(r=>r.row.completed_net_vnd!=null).map(r=>r.row.completed_net_vnd)),missing_net_records:rs.filter(r=>r.row.completed_net_vnd==null).length});
 const buckets=['MUALE','THEMNGOAIGOI','TRONGGOI'].map(mode=>({mode,ordered:finance(ordered.filter(r=>r.ordering==='VU'&&r.row.price_mode===mode)),performed:performedFinance(performed.filter(r=>r.performing==='VU'&&r.row.price_mode===mode))}));
 const cohort=new Set(ordered.filter(r=>r.ordering==='VU'&&r.kpi_category==='KHÁM').map(r=>r.row.visit_id));
 const referred=new Set(ordered.filter(r=>r.routing_category==='VU_OUTBOUND'&&(r.kpi_category==='CĐHA_CAO_CẤP'||r.evidence.service_group==='Di truyền')&&cohort.has(r.row.visit_id)).map(r=>r.row.visit_id));
 const imaging=performed.filter(r=>['SIÊU_ÂM','XQ_VÚ','CĐHA_CAO_CẤP'].includes(r.kpi_category)),birads=imaging.filter(r=>[0,1,2,3,4,5,6].includes(r.row.birads)),suspicious=new Set(birads.filter(r=>[4,5].includes(r.row.birads)).map(r=>r.row.visit_id));
 const downstream=new Set(ordered.filter(r=>(r.evidence.service_group==='Giải phẫu bệnh'||r.kpi_category==='PHẪU_THUẬT')&&suspicious.has(r.row.visit_id)).map(r=>r.row.visit_id));
 return {rulesVersion:RULES_VERSION,profile,from,toExclusive,records,total:rows.length,duplicates:dupes.size,blocked:records.filter(r=>!r.eligible&&!dupes.has(r.index)).length,related:related.length,
  routing:ROUTES.map(route=>({route,records:records.filter(r=>r.eligible&&r.orderedInPeriod&&r.routing_category===route).length,performed_records:records.filter(r=>r.eligible&&r.performedInPeriod&&r.routing_category===route).length})),
  kpis:{service_groups:[...new Set(catalog.map(c=>groupMap[c.group]||'HỖ_TRỢ_KHÁC'))].map(category=>({category,ordered_records:ordered.filter(r=>r.kpi_category===category).length,completed_records:performed.filter(r=>r.kpi_category===category).length,completed_qty:sumQuantity(performed.filter(r=>r.kpi_category===category).map(r=>r.row.completed_qty)),at_vu_records:performed.filter(r=>r.kpi_category===category&&r.performing==='VU').length})),performed_services:sumQuantity(performed.filter(r=>r.performing==='VU').map(r=>r.row.completed_qty)),interventions:performed.filter(r=>r.performing==='VU'&&r.kpi_category==='CAN_THIỆP_TIỂU_PHẪU').length,referral:{numerator:referred.size,denominator:cohort.size,percent:cohort.size?referred.size/cohort.size*100:null},birads:{observed:birads.length,imaging_records:imaging.length,suspicious_visits:suspicious.size,downstream_visits:downstream.size,percent:birads.length===imaging.length&&suspicious.size?downstream.size/suspicious.size*100:null}},
  finance:{ordered:finance(ordered.filter(r=>r.ordering==='VU')),performed:performedFinance(performed.filter(r=>r.performing==='VU')),outbound:finance(ordered.filter(r=>r.routing_category==='VU_OUTBOUND')),buckets},
  warnings:records.flatMap(r=>r.warnings.map(w=>({...w,key:r.key,record_id:r.row.order_id,source_file:r.row.source_file,source_row:r.row.source_row}))),
 };
}
