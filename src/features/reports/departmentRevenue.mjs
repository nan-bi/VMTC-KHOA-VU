import {revenueCalculation,billingType,BILLING_TYPES} from './serviceCalculation.mjs';
import {revenueScope,resolveDept,normalizeDept} from '../intelligence/revenueAI.mjs';
import {ROUTES} from '../intelligence/routing.mjs';
import {sumQuantity} from '../../shared/dataRules.mjs';
export const departmentKey=value=>resolveDept(value)||normalizeDept(value);
export const DEPARTMENT_NAMES={VU:'Khoa Vú',CDHA:'Chẩn đoán hình ảnh',KSKTQ:'Sức khỏe tổng quát',GPB:'Giải phẫu bệnh',XETNGHIEM:'Xét nghiệm',GAYME:'Gây mê hồi sức',UNGBUOU:'Ung bướu',NOI:'Nội khoa'};
export const ROUTE_LABELS={VU_INTERNAL:'Vú chỉ định · Vú thực hiện',VU_OUTBOUND:'Vú chỉ định · khoa khác thực hiện',VU_INBOUND:'Khoa khác chỉ định · Vú thực hiện',EXTERNAL_UNRELATED:'Khoa khác chỉ định · khoa khác thực hiện'};
export function departmentRevenue(rows,config={}){
 const completed=rows.filter(r=>r.status==='HOANTHANH'&&+r.in_snapshot===1);
 const scope=revenueScope(completed,config),accepted=scope.records.filter(r=>!r.pending).map(r=>r.row);
 const summary=(key,label,own)=>{const value=revenueCalculation(own,config);return {key,label,records:own.length,qty:sumQuantity(own.map(r=>r.completed_qty)),knownRevenue:value.knownRevenue,missingRecords:value.missingRecords,missingQty:value.missingQty};};
 const departments=field=>{const groups=new Map();for(const row of accepted){const key=departmentKey(row[field]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}return [...groups].map(([key,own])=>summary(key,DEPARTMENT_NAMES[key]||String(own[0][field]),own));};
 return {version:'ALL-DEPT-1',revenue:revenueCalculation(accepted,config),byOrdering:departments('ordering_dept'),byPerforming:departments('performing_dept'),byRoute:ROUTES.map(key=>summary(key,ROUTE_LABELS[key],scope.records.filter(r=>r.label===key&&!r.pending).map(r=>r.row))),byBilling:Object.entries(BILLING_TYPES).map(([key,label])=>summary(key,label,accepted.filter(r=>billingType(r,config)===key))),records:accepted.length,pendingRecords:scope.pending.length,pendingQty:sumQuantity(scope.pending.map(r=>r.row.completed_qty))};
}
export function allRevenueSnapshot(rows,config={}){return {...departmentRevenue(rows,config),sourceRows:structuredClone(rows),configuration:structuredClone(config)};}
