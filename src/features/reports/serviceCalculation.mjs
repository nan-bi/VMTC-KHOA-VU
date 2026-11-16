import {extendCatalog} from './serviceCatalog.mjs';
import {sumMoney,sumQuantity,grossAmount,integer,scaledQuantity,safeNumber} from '../../shared/dataRules.mjs';
import {validateLearning,resolveDept,revenueScope} from '../intelligence/revenueAI.mjs';
export const BILLING_TYPES={SKTQ:'Gói SKTQ',SLUT1:'Combo SLUT 1',SLUT2:'Combo SLUT 2',OTHER:'Gói khác',UNKNOWN:'Chờ phân loại',RETAIL:'CK/lẻ ngoài gói'};
export const SERVICE_KINDS={EXAM:'Khám',US:'Siêu âm vú',XR2:'X-quang vú 2D',XR3:'X-quang vú 3D',OTHER:'Dịch vụ khác'};
export const DEFAULT_SERVICE_KINDS=Object.fromEntries([['SYN-DV001','EXAM'],['SYN-DV002','EXAM'],['SYN-DV005','XR2'],['SYN-DV006','XR3'],...['008','009','010','011'].map(id=>['SYN-DV'+id,'US'])]);
export const serviceKind=(row,config={})=>(config.serviceKinds||DEFAULT_SERVICE_KINDS)[row.service_code]||'OTHER';
export function billingType(row,config={}){
 if(row.price_mode==='THEMNGOAIGOI')return 'RETAIL';
 if(row.price_mode==='MUALE'&&!row.package_id)return 'RETAIL';
 if(row.price_mode!=='TRONGGOI'||!row.package_id)return 'UNKNOWN';
 const type=config.packageTypes?.[row.package_id];
 if(!['SKTQ','SLUT1','SLUT2','OTHER'].includes(type))return 'UNKNOWN';
 if(type==='SLUT1'&&!['EXAM','US'].includes(serviceKind(row,config)))return 'UNKNOWN';
 return type;
}
const summarize=rows=>({rows,qty:sumQuantity(rows.map(r=>r.completed_qty)),visits:new Set(rows.map(r=>r.visit_id)).size,gross:sumMoney(rows.map(r=>r.completed_gross_vnd)),net:sumMoney(rows.filter(r=>r.completed_net_vnd!=null).map(r=>r.completed_net_vnd)),missing:rows.filter(r=>r.completed_net_vnd==null).length});
export function validateRates(rates={},catalog=null){
 if(!rates||typeof rates!=='object'||Array.isArray(rates))throw Error('Bảng đơn giá không hợp lệ.');
 for(const [code,types] of Object.entries(rates)){
  if(catalog&&!catalog.some(c=>c.code===code))throw Error('Mã dịch vụ trong bảng giá chưa có trong danh mục.');
  if(!types||typeof types!=='object'||Array.isArray(types))throw Error('Nhóm đơn giá không hợp lệ.');
  for(const [type,value] of Object.entries(types))if(type==='UNKNOWN'||!Object.hasOwn(BILLING_TYPES,type)||(value!=null&&(!integer(value)||+value<0)))throw Error('Đơn giá phải là số nguyên VND không âm; để trống nếu dùng giá nguồn.');
 }
}
export function appliedRate(row,type,config={}){
 if(type==='UNKNOWN')return {price:null,basis:'Chờ phân loại gói'};
 const configured=config.rates?.[row.service_code]?.[type];
 if(configured!=null){if(!integer(configured)||+configured<0)throw Error('Đơn giá cấu hình không hợp lệ.');return {price:+configured,basis:'Đơn giá cấu hình'};}
 if(type==='RETAIL')return integer(row.unit_price_vnd)?{price:+row.unit_price_vnd,basis:'Đơn giá nguồn'}:{price:null,basis:'Thiếu đơn giá'};
 if(row.package_allocation_vnd==null||!integer(row.package_allocation_vnd))return {price:null,basis:'Thiếu giá/phân bổ gói'};
 const quantity=scaledQuantity(row.completed_qty),amount=BigInt(row.package_allocation_vnd)*1000000n;
 if(quantity<=0n||amount%quantity!==0n)return {price:null,basis:'Phân bổ chưa xác định được đơn giá nguyên VND'};
 return {price:safeNumber(amount/quantity),basis:'Phân bổ nguồn / số lượng'};
}
export function revenueCalculation(rows,config={}){
 const groups=new Map();
 for(const row of rows){if(row.status!=='HOANTHANH'||+row.in_snapshot!==1)continue;const kind=serviceKind(row,config);
  const type=billingType(row,config),rate=appliedRate(row,type,config),key=JSON.stringify([row.service_code,type,rate.price,rate.basis]);
  if(!groups.has(key))groups.set(key,{key,code:row.service_code,name:row.service_name,kind,type,price:rate.price,basis:rate.basis,quantities:[],recordCount:0});
  const group=groups.get(key);group.quantities.push(row.completed_qty);group.recordCount++;
 }
 const lines=[...groups.values()].map(({quantities,...group})=>{const qty=sumQuantity(quantities);return {...group,qty,revenue:group.price==null?null:grossAmount(qty,group.price)}});
 const totals=Object.entries(SERVICE_KINDS).filter(([kind])=>kind!=='OTHER'||lines.some(r=>r.kind==='OTHER')).map(([kind,label])=>{
  const matched=lines.filter(r=>r.kind===kind);return {kind,label,qty:sumQuantity(matched.map(r=>r.qty)),knownRevenue:sumMoney(matched.filter(r=>r.revenue!=null).map(r=>r.revenue)),missingQty:sumQuantity(matched.filter(r=>r.revenue==null).map(r=>r.qty)),missingRecords:matched.filter(r=>r.revenue==null).reduce((n,r)=>n+r.recordCount,0)};
 });
 return {rulesVersion:'PRICE-QTY-1',lines,totals,knownRevenue:sumMoney(totals.map(r=>r.knownRevenue)),missingQty:sumQuantity(totals.map(r=>r.missingQty)),missingRecords:totals.reduce((n,r)=>n+r.missingRecords,0)};
}
export function selectRevenueRows(completed,config={},department='VU'){
 const orderingScope=['ORDERING_VU','ORDERING_OTHER','ORDERING_ALL'].includes(department);
 const scope=orderingScope?revenueScope(completed,config):null;
 const scoped=department==='ORDERING_VU'?scope.included:department==='ORDERING_OTHER'?scope.excluded.map(r=>r.row):department==='ORDERING_ALL'?scope.records.filter(r=>!r.pending).map(r=>r.row):completed;
 return scoped.filter(r=>r.status==='HOANTHANH'&&+r.in_snapshot===1&&(department==='ALL'||orderingScope||resolveDept(r.performing_dept)===department));
}
export function serviceCalculation(completed,config={},department='VU'){
 const rows=selectRevenueRows(completed,config,department);
 const families=Object.entries(SERVICE_KINDS).filter(([kind])=>kind!=='OTHER').map(([kind,label])=>{
  const matched=rows.filter(r=>serviceKind(r,config)===kind),buckets=Object.fromEntries(Object.keys(BILLING_TYPES).map(type=>[type,summarize(matched.filter(r=>billingType(r,config)===type))]));
  return {kind,label,...summarize(matched),buckets};
 });
 const prices=families.flatMap(f=>Object.entries(f.buckets).flatMap(([type,b])=>[...new Set(b.rows.map(r=>r.service_code))].map(code=>{
  const rs=b.rows.filter(r=>r.service_code===code),allocations=rs.filter(r=>r.price_mode==='TRONGGOI'),missingAllocation=allocations.filter(r=>r.package_allocation_vnd==null).length;
  return {key:code+'-'+type,kind:f.kind,type,code,name:rs[0].service_name,...summarize(rs),prices:[...new Set(rs.map(r=>+r.unit_price_vnd))].sort((a,b)=>a-b),unitAllocations:[...new Set(allocations.filter(r=>r.package_allocation_vnd!=null).map(r=>r.package_allocation_vnd/r.completed_qty))].sort((a,b)=>a-b),allocation:sumMoney(allocations.filter(r=>r.package_allocation_vnd!=null).map(r=>r.package_allocation_vnd)),missingAllocation,packageRows:allocations.length};
 })));
 const combos=new Map();
 for(const row of rows){const type=billingType(row,config);if(!['SLUT1','SLUT2'].includes(type))continue;const key=JSON.stringify([row.patient_id,row.visit_id,row.package_id]);if(!combos.has(key))combos.set(key,{key,type,package_id:row.package_id,visit_id:row.visit_id,rows:[]});combos.get(key).rows.push(row);}
 const warnings=[...combos.values()].flatMap(c=>{const kinds=new Set(c.rows.map(r=>serviceKind(r,config))),missing=[];if(!kinds.has('EXAM'))missing.push('khám');if(!kinds.has('US'))missing.push('siêu âm');if(c.type==='SLUT2'&&!kinds.has('XR2')&&!kinds.has('XR3'))missing.push('X-quang 2D/3D');return missing.length?[{...c,missing}]:[]});
 let revenue;try{revenue=revenueCalculation(rows,config)}catch(error){revenue={error:error.message};}
 return {families,prices,warnings,revenue,unclassified:families.reduce((n,f)=>n+f.buckets.UNKNOWN.rows.length,0),outOfScope:rows.filter(r=>serviceKind(r,config)==='OTHER').length};
}
export function saveCalculationConfig(state,config,actor,reason){
 if(actor!=='Nhập / đối soát'||state.report)throw Error('Chỉ được sửa quy tắc khi có quyền nhập và nguồn chưa chốt.');
 if(typeof reason!=='string'||reason.trim().length<8)throw Error('Ghi lý do ít nhất 8 ký tự.');
 extendCatalog([],config);validateRates(config.rates);validateLearning(config.routingExamples);
 for(const type of Object.values(config.packageTypes||{}))if(!['SKTQ','SLUT1','SLUT2','OTHER','UNKNOWN'].includes(type))throw Error('Loại gói không hợp lệ.');
 for(const kind of Object.values(config.serviceKinds||{}))if(!Object.hasOwn(SERVICE_KINDS,kind))throw Error('Nhóm phép tính không hợp lệ.');
 state.calculationHistory??=[];state.calculationHistory.unshift({time:new Date().toISOString(),actor,reason:reason.trim(),before:state.serviceCalculation||null,after:structuredClone(config)});state.serviceCalculation=structuredClone(config);return state;
}
export function serviceRevenueSnapshot(completed,config={},department='ORDERING_VU'){
 const revenue=serviceCalculation(completed,config,department).revenue;if(revenue.error)throw Error(revenue.error);
 return {department,configuration:structuredClone(config),...revenue};
}
