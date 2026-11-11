import {ROUTES,RULES_VERSION} from './routing.mjs';
const encoder=new TextEncoder();
export async function exportDataset(analysis,reviews,{includeSyntheticSilver=false}={}){
 const key=await crypto.subtle.importKey('raw',crypto.getRandomValues(new Uint8Array(32)),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const pseudonym=async text=>Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const examples=[],excluded={invalid:0,not_reviewed:0},groups=new Map();
 for(const r of analysis.records){
  if(!r.eligible||r.warnings.some(w=>w.code==='IDENTITY_REVIEW')){excluded.invalid++;continue;}
  const review=reviews[r.key],gold=review?.fingerprint===r.fingerprint&&review.profile===analysis.profile&&review.rulesVersion===RULES_VERSION&&ROUTES.includes(review.label)&&review.reviewer?.trim()&&review.reason?.trim();
  const silver=!gold&&includeSyntheticSilver&&+r.row.is_synthetic===1;
  if(!gold&&!silver){excluded.not_reviewed++;continue;}
  const group=await pseudonym('patient:'+r.row.patient_id);if(!groups.has(group)){const n=parseInt(group.slice(0,8),16)/0x100000000;groups.set(group,n<.8?'train':n<.9?'validation':'test');}
  examples.push({schema_version:1,example_id:await pseudonym('record:'+r.row.order_id+':'+r.fingerprint),patient_group:group,split:groups.get(group),
   features:{ordering_dept:r.ordering,performing_dept:r.performing,performing_room:r.room,service_code:r.row.service_code,service_group:r.evidence.service_group,profile:analysis.profile},
   label:gold?review.label:r.routing_category,label_source:gold?'human_review':'synthetic_rule_silver',synthetic:+r.row.is_synthetic===1,rules_version:RULES_VERSION});
 }
 const counts=Object.fromEntries(['train','validation','test'].map(s=>[s,examples.filter(e=>e.split===s).length]));
 const jsonl=examples.map(e=>JSON.stringify(e)).join('\n')+'\n';
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(jsonl)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 return {manifest:{schema_version:1,dataset_sha256:digest,created_at:new Date().toISOString(),task:'service_routing_classification',rules_version:RULES_VERSION,profile:analysis.profile,examples:examples.length,patient_groups:groups.size,splits:counts,excluded,gold:examples.filter(e=>e.label_source==='human_review').length,silver:examples.filter(e=>e.label_source!=='human_review').length,privacy:'Allowlist only; HMAC pseudonyms with random per-export key discarded. No names, phone, raw IDs, free text, dates, money or files. Pseudonymized data is not guaranteed anonymous.',limits:'Synthetic/single-review labels are not a hospital gold standard. Model does not calculate money or choose clinical routes.'},examples};
}
export function validatePrediction(prediction){
 if(!prediction||Object.keys(prediction).sort().join(',')!=='confidence,reason,routing_category'||!ROUTES.includes(prediction.routing_category)||typeof prediction.reason!=='string'||!prediction.reason.trim()||prediction.reason.length>2000||typeof prediction.confidence!=='number'||!Number.isFinite(prediction.confidence)||prediction.confidence<0||prediction.confidence>1)throw Error('Đầu ra model không đúng hợp đồng.');
 return {routing_category:prediction.routing_category,reason:prediction.reason,confidence:prediction.confidence};
}
