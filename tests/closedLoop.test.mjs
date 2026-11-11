import test from 'node:test';
import assert from 'node:assert/strict';
import {generateJourneys,validateJourneys,trainingExamples,toCSV} from '../src/features/journeys/closedLoop.mjs';
const base=generateJourneys();
test('reproducible cohort and exact proportions per visit across seeds',()=>{
 assert.deepEqual(base,generateJourneys());
 assert.deepEqual(base.meta.scenario_counts,{NORMAL:170,SUSPICIOUS:20,DELAYED:6,CANCELLED:4});
 for(const seed of [0,1,42,20261031,4294967295])for(const count of [100,200,300])assert.deepEqual(validateJourneys(generateJourneys({seed,count})),[]);
 for(const count of [0,50,201,10001,NaN])assert.throws(()=>generateJourneys({count}));
});
const mutate=(fn,code)=>{const d=structuredClone(base);fn(d);assert.ok(validateJourneys(d).some(e=>e.code===code),code);};
test('reject mixed patient, wrong origin and unknown result foreign keys',()=>{
 mutate(d=>d.orders[0].patient_id=d.consultations[1].patient_id,'ORDER_IDENTITY');
 mutate(d=>d.results[0].origin_clinic_room='PK-VU-99','RESULT_RETURN_IDENTITY');
 mutate(d=>d.results[0].order_id='UNKNOWN','ORPHAN_RESULT');
 mutate(d=>d.results.push({...d.results[0],result_id:'OTHER'}),'MULTIPLE_RESULTS');
 mutate(d=>d.orders.push({...d.orders[0]}),'DUPLICATE_OR_EMPTY_order_id');
});
test('reject premature conclusion, absent review or required result',()=>{
 mutate(d=>d.consultations[0].concluded_at=d.consultations[0].consultation_started_at,'CLOSURE_TIME');
 mutate(d=>d.consultations[0].reviewed_order_ids=[],'PREMATURE_CLOSURE');
 mutate(d=>d.results.shift(),'MISSING_ACTIVE_RESULT');
 mutate(d=>d.consultations[0].assessment_completed_at=null,'INTAKE_ASSESSMENT');
});
test('TAT includes wait and return; rejects forged duration/signing',()=>{
 mutate(d=>d.results[0].tat_minutes-=5,'TAT');
 mutate(d=>d.results[0].signed_at='2026-01-01T08:00:00+07:00','RESULT_TIME');
 mutate(d=>d.results[0].performing_doctor_id='BS-XN-01','SIGNER');
 mutate(d=>d.orders[0].received_at=d.orders[0].ordered_at,'DURATION');
});
test('actual intervention and specimen dependency cannot cross visits',()=>{
 const proc=base.orders.find(o=>o.service_kind==='procedure');
 const path=base.orders.find(o=>o.service_kind==='pathology');
 assert.ok(proc&&path);
 mutate(d=>d.orders.find(o=>o.order_id===proc.order_id).parent_order_id=d.orders.find(o=>o.visit_id!==proc.visit_id).order_id,'PARENT_LINK');
 mutate(d=>d.orders.find(o=>o.order_id===path.order_id).specimen_id='WRONG','SPECIMEN_LINK');
 mutate(d=>d.orders.find(o=>o.order_id===proc.order_id).parent_order_id=null,'PROCEDURE_DEPENDENCY');
 mutate(d=>d.consultations.find(v=>v.visit_id===proc.visit_id).recovery_completed_at=null,'RECOVERY');
});
test('lab results cannot masquerade as BI-RADS; catalog room mapping explicit',()=>{
 mutate(d=>d.results.find(r=>d.orders.find(o=>o.order_id===r.order_id).service_kind==='pathology').conclusion_code='BIRADS_5','RESULT_TYPE');
 mutate(d=>d.orders[0].target_room='xray','SERVICE_MAPPING');
 mutate(d=>d.consultations[0].final_birads=9,'FINAL_BIRADS');
});
test('cancellation has no result and requires physician approval; replacement linked',()=>{
 const cancelled=base.orders.filter(o=>o.order_status==='HUY');assert.equal(cancelled.length,4);
 for(const o of cancelled)assert.ok(!base.results.some(r=>r.order_id===o.order_id));
 mutate(d=>{const o=d.orders.find(o=>o.order_status==='HUY');d.results.push({...d.results[0],result_id:'CANCEL-RES',order_id:o.order_id});},'CANCELLATION');
 mutate(d=>d.orders.find(o=>o.order_status==='HUY').cancel_reviewed_by=null,'CANCELLATION');
 assert.ok(base.orders.some(o=>o.replaces_order_id));
 mutate(d=>d.orders.find(o=>o.replaces_order_id).replaces_order_id='UNKNOWN','REPLACEMENT_LINK');
});
test('export preserves keys, label split is patient-disjoint and future results absent in input',()=>{
 const examples=trainingExamples(base),groups=new Map();
 for(const e of examples){assert.ok(!groups.has(e.patient_group));groups.set(e.patient_group,e.split);assert.deepEqual(Object.keys(e.input).sort(),['initial_service_codes','origin_clinic_room']);assert.equal(e.synthetic,true);}
 assert.deepEqual(Object.fromEntries(['train','validation','test'].map(s=>[s,examples.filter(e=>e.split===s).length])),{train:140,validation:40,test:20});
 assert.ok(toCSV(base.orders).startsWith('\uFEFF"order_id"'));
 const bad=structuredClone(base);bad.results.pop();assert.throws(()=>trainingExamples(bad));
});
