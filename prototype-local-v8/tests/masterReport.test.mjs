import test from 'node:test';
import assert from 'node:assert/strict';
import {assessTat} from '../src/features/intelligence/tat.mjs';
import {analyze} from '../src/features/intelligence/routing.mjs';
import {masterReport,makeAuditNote} from '../src/features/intelligence/masterReport.mjs';
import {askAudit} from '../src/features/intelligence/auditCopilot.mjs';
import {adaptRows} from '../src/features/intelligence/importSchema.mjs';
const catalog=[{code:'MRI',group:'MRI vú'},{code:'GPB',group:'Giải phẫu bệnh'},{code:'US',group:'Siêu âm vú'}];
const base=(id='ORD-01')=>({order_id:id,patient_id:'BN-01',visit_id:'VISIT-01',service_code:'MRI',service_name:'MRI vú demo',ordering_dept:'VU',performing_dept:'CDHA',ordered_at:'2026-10-23T08:00:00+07:00',completed_at:'2026-10-23T09:00:00+07:00',result_returned_at:'2026-10-23T10:01:00+07:00',quantity:1,completed_qty:1,unit_price_vnd:100000,status:'HOANTHANH',price_mode:'MUALE',discount_known:1,discount_vnd:0,in_snapshot:1,gross_order_vnd:100000,completed_gross_vnd:100000,completed_net_vnd:100000,source_file:'MRI.csv',source_sheet:'S',source_row:2,ordering_doctor_id:'BS-VU-01',performing_doctor_id:'BS-CDHA-01'});
const run=rows=>analyze(rows,catalog,{from:'2026-10-23',toExclusive:'2026-10-24'});
test('TAT strict boundaries, full timestamps and real return field required',()=>{
 const context={performing:'CDHA'};
 assert.equal(assessTat(base(),context).status,'DELAYED_TAT');
 assert.equal(assessTat({...base(),result_returned_at:'2026-10-23T10:00:00+07:00'},context).status,'WITHIN_TAT');
 assert.equal(assessTat({...base(),result_returned_at:null},context).status,'UNKNOWN_RETURN_TIME');
 for(const t of ['2026-10-23','2026-10-23T10:00:00','2026-02-30T10:00:00+07:00','2026-10-23T07:59:00+07:00'])assert.equal(assessTat({...base(),result_returned_at:t},context).status,'INVALID_TAT_TIME');
 assert.equal(assessTat({...base(),status:'HUY'},context).status,'NOT_APPLICABLE');
 assert.equal(assessTat(base(),{performing:'VU'}).status,'NOT_APPLICABLE');
 assert.equal(assessTat({...base(),result_returned_at:'2026-10-26T08:00:00+07:00'},{performing:'GPB'}).status,'WITHIN_TAT');
 assert.equal(assessTat({...base(),result_returned_at:'2026-10-26T08:01:00+07:00'},{performing:'GPB'}).status,'DELAYED_TAT');
});
test('MASTER schema preserves unknown money, four routes and distinct KPI units',()=>{
 const a=base(),missing={...base('ORD-02'),performing_dept:'VU',service_code:'US',completed_net_vnd:null,discount_known:0,price_mode:'TRONGGOI',package_id:'PKG-01',package_allocation_vnd:null};
 const inbound={...base('ORD-03'),ordering_dept:'NOI',performing_dept:'VU',service_code:'US'},unrelated={...base('ORD-04'),ordering_dept:'NOI'};
 const r=masterReport(run([a,missing,inbound,unrelated]));
 assert.deepEqual(r.categorized_records.map(x=>x.routing_type),['VU_OUTBOUND','VU_INTERNAL','VU_INBOUND','EXTERNAL_UNRELATED']);
 assert.equal(r.categorized_records[1].net_price_vnd,null);assert.equal(r.categorized_records[1].price_status,'PARTIAL_UNKNOWN');
 assert.equal(r.breast_department_kpis.total_visits,1);assert.equal(r.breast_department_kpis.total_unique_patients,1);
 assert.equal(r.breast_department_kpis.inbound_referrals_from_other_depts,1);assert.equal(r.breast_department_kpis.estimated_gross_outbound_vnd,100000);
 assert.equal(r.categorized_records[0].source_audit.file_sha256,null);
 assert.ok(r.anomalies_and_audit_notes.some(w=>w.issue_type==='UNKNOWN_NET'));assert.equal(r.report_context.tat_policy.approved,false);
 assert.doesNotThrow(()=>JSON.stringify(r));
});
test('duplicates omitted; entire conflict group quarantined; exclusions never contribute',()=>{
 const a={...base(),result_returned_at:null},d=masterReport(run([a,{...a,source_file:'B.csv'}]));
 assert.equal(d.ingestion_summary.duplicates_omitted,1);assert.equal(d.categorized_records[1].review_status,'DUPLICATE_OMITTED');assert.equal(d.categorized_records[1].contributes_completed,false);
 const conflict=masterReport(run([a,{...a,status:'CHOTHUCHIEN',completed_qty:0,completed_gross_vnd:0,completed_net_vnd:null}]));
 assert.equal(conflict.ingestion_summary.valid_rows,0);assert.ok(conflict.categorized_records.every(r=>r.review_status==='NEED_MANUAL_REVIEW'));assert.equal(conflict.breast_department_kpis.estimated_gross_outbound_vnd,0);
 const cancelled={...base(),status:'HUY',completed_qty:0,completed_net_vnd:null,completed_gross_vnd:0},c=masterReport(run([cancelled]));
 assert.equal(c.categorized_records[0].contributes_completed,false);assert.equal(c.breast_department_kpis.outbound_referrals_to_other_depts,0);
});
test('TAT warnings do not change finance; query cites exact doctors and order, never asserts missing TAT on time',()=>{
 const a=run([base()]),b=run([{...base(),result_returned_at:null}]);assert.deepEqual(a.finance,b.finance);
 const answer=askAudit(a,'Các chỉ định trễ TAT');assert.equal(answer.rows.length,1);assert.ok(answer.rows[0].citation.includes('Mã CĐ: ORD-01'));assert.ok(answer.rows[0].citation.includes('BS-CDHA-01'));assert.equal(answer.rows[0].tat.tat_minutes,121);
 const missing=askAudit(b,'Các chỉ định trễ TAT');assert.equal(missing.rows.length,0);assert.match(missing.answer,/không chứng minh mọi ca đều đúng hạn/);
});
test('take-notes snapshot all evidence and are immutable after source/query changes',()=>{
 const result=askAudit(run([base()]),'MRI'),note=makeAuditNote(result,'MRI','Kiểm tra thời gian trả kết quả',{now:'2026-10-31T10:00:00+07:00'});
 result.rows[0].order_id='FORGED';assert.equal(note.evidence[0].order_id,'ORD-01');assert.equal(note.evidence.length,1);assert.equal(note.mode,'lookup');
 assert.throws(()=>makeAuditNote(result,'MRI',' '));assert.throws(()=>makeAuditNote({rows:[]},'MRI','ghi chú'));assert.throws(()=>makeAuditNote({...result,unsupported:true},'MRI','ghi chú'));
});
test('aliases normalize pending state, return time and doctors; ignore uploaded file_hash',()=>{
 const row=base();delete row.result_returned_at;row['Ngày trả kết quả']='2026-10-23T10:01:00+07:00';row['Bác sĩ thực hiện']='BS Mẫu';row.file_hash='FORGED';row.status='CHO_THUC_HIEN';row.completed_qty=0;row.completed_gross_vnd=0;row.completed_net_vnd=null;
 const adapted=adaptRows([row],'A.csv',{hash:'a'.repeat(64),sheet:'S'}).rows[0];assert.equal(adapted.file_hash,'a'.repeat(64));assert.equal(adapted.source_file_hash,adapted.file_hash);assert.equal(adapted.status,'CHOTHUCHIEN');assert.equal(adapted.performing_doctor_name,'BS Mẫu');assert.equal(adapted.result_returned_at,'2026-10-23T10:01:00+07:00');
 const analysis=run([adapted]);assert.equal(analysis.records[0].eligible,true);assert.equal(analysis.records[0].performedInPeriod,false);
});
