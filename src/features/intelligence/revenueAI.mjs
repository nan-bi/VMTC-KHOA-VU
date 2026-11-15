// Offline multinomial Naive Bayes. Only department text is a feature.
// Money, patient identities, filenames and clinical findings never enter training.
import {department,ROUTES} from './routing.mjs';
export const AI_VERSION='VU-REVENUE-NB-1';
export const normalizeDept=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toUpperCase().trim().replace(/\s+/g,' ');
const names={'KHOA VU':'VU','CHUYEN KHOA VU':'VU','KHOA CHAN DOAN HINH ANH':'CDHA','TRUNG TAM CHAN DOAN HINH ANH':'CDHA','KHOA XET NGHIEM':'XETNGHIEM','TRUNG TAM XET NGHIEM':'XETNGHIEM','KHOA SUC KHOE TONG QUAT':'KSKTQ','SUC KHOE TONG QUAT':'KSKTQ','KHOA UNG BUOU':'UNGBUOU'};
export const resolveDept=v=>department(v)||names[normalizeDept(v)]||null;
export const pairKey=r=>JSON.stringify([normalizeDept(r.ordering_dept),normalizeDept(r.performing_dept)]);
const route=(a,b)=>!a||!b?null:a==='VU'?(b==='VU'?'VU_INTERNAL':'VU_OUTBOUND'):b==='VU'?'VU_INBOUND':'EXTERNAL_UNRELATED';
const tokens=r=>[...Array(8).fill('pair='+pairKey(r)),...['ordering_dept','performing_dept'].flatMap(k=>{const v=normalizeDept(r[k]);return [k+'='+v,...v.split(/[^A-Z0-9]+/).filter(Boolean).map(t=>k+':'+t)];})];
export function validateLearning(examples=[]){
 if(!Array.isArray(examples)||examples.length>2000)throw Error('Tối đa 2.000 cặp khoa đã xác nhận.');
 const seen=new Set();for(const e of examples){
  if(!e||typeof e.ordering_dept!=='string'||!e.ordering_dept.trim()||e.ordering_dept.length>200||typeof e.performing_dept!=='string'||!e.performing_dept.trim()||e.performing_dept.length>200||!ROUTES.includes(e.label)||typeof e.reason!=='string'||e.reason.trim().length<8)throw Error('Nhãn học cần đủ hai khoa, phân loại và lý do ít nhất 8 ký tự.');
  const a=resolveDept(e.ordering_dept),b=resolveDept(e.performing_dept),known=route(a,b);
  if((known&&known!==e.label)||(a==='VU'&&!['VU_INTERNAL','VU_OUTBOUND'].includes(e.label))||(a&&a!=='VU'&&['VU_INTERNAL','VU_OUTBOUND'].includes(e.label))||(b==='VU'&&!['VU_INTERNAL','VU_INBOUND'].includes(e.label))||(b&&b!=='VU'&&['VU_INTERNAL','VU_INBOUND'].includes(e.label)))throw Error('Nhãn mâu thuẫn khoa đã nhận diện. Sửa dữ liệu nguồn trước.');
  if(seen.has(pairKey(e)))throw Error('Cặp khoa có nhiều nhãn; cần đối soát.');seen.add(pairKey(e));
 }
}
export function trainRevenueModel(examples=[]){
 validateLearning(examples);
 const base=['VU','CDHA','KSKTQ','XETNGHIEM','GAYME','UNGBUOU','GPB','NOI'].flatMap(a=>['VU','CDHA','KSKTQ','XETNGHIEM','GAYME','UNGBUOU','GPB','NOI'].map(b=>({ordering_dept:a,performing_dept:b,label:route(a,b)})));
 const model={version:AI_VERSION,documents:{},counts:{},totals:{},vocabulary:new Set(),examples:new Map(examples.map(e=>[pairKey(e),e]))};
 for(const label of ROUTES){model.documents[label]=0;model.counts[label]=new Map();model.totals[label]=0;}
 for(const e of [...base,...examples]){model.documents[e.label]++;for(const t of tokens(e)){model.vocabulary.add(t);model.counts[e.label].set(t,(model.counts[e.label].get(t)||0)+1);model.totals[e.label]++;}}
 model.trainingCount=base.length+examples.length;model.reviewedCount=examples.length;return model;
}
export function predictRevenue(row,model){
 const scores=ROUTES.map(label=>({label,score:Math.log((model.documents[label]+1)/(model.trainingCount+ROUTES.length))+tokens(row).filter(t=>model.vocabulary.has(t)).reduce((n,t)=>n+Math.log(((model.counts[label].get(t)||0)+1)/(model.totals[label]+model.vocabulary.size)),0)})).sort((a,b)=>b.score-a.score);
 const denominator=scores.reduce((n,x)=>n+Math.exp(x.score-scores[0].score),0);
 const a=resolveDept(row.ordering_dept),b=resolveDept(row.performing_dept),known=route(a,b),review=model.examples.get(pairKey(row)),label=known||review?.label||null;
 return {label,suggestion:scores[0].label,score:1/denominator,source:known?'Danh mục khoa chuẩn':review?'Cặp khoa đã xác nhận':'AI gợi ý · cần xác nhận',included:['VU_INTERNAL','VU_OUTBOUND'].includes(label),pending:!label,version:AI_VERSION};
}
export function revenueScope(rows,config={}){
 const model=trainRevenueModel(config.routingExamples||[]),records=rows.map(row=>({row,...predictRevenue(row,model)}));
 return {model,records,included:records.filter(r=>r.included).map(r=>r.row),pending:records.filter(r=>r.pending),excluded:records.filter(r=>!r.pending&&!r.included)};
}
