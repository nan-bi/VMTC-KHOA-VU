import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {serviceCalculation,billingType,DEFAULT_SERVICE_KINDS,saveCalculationConfig} from '../src/features/reports/serviceCalculation.mjs';
import {installServiceDemo} from '../src/features/reports/installServiceDemo.mjs';
import {validate} from '../src/features/reports/core.mjs';
import {publicJourneyRows} from '../src/features/journeys/publicRows.mjs';
import {normalizeIncomingRows} from '../src/features/reports/importRows.mjs';
import {adaptRows} from '../src/features/intelligence/importSchema.mjs';
const demo=JSON.parse(fs.readFileSync(new URL('../src/data/service-demo.json',import.meta.url))),seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],name:r['Tên đơn vị dịch vụ mô phỏng'],group:r['Nhóm']}));
const config={serviceKinds:DEFAULT_SERVICE_KINDS,packageTypes:demo.packageTypes};
test('170 demo records are valid and partition exactly into separate billing categories',()=>{
 const checked=validate(demo.rows,catalog);assert.equal(checked.issues.length,0);assert.equal(checked.valid.length,170);
 const result=serviceCalculation(checked.valid,config);assert.equal(result.unclassified,0);assert.equal(result.warnings.length,0);
 const exam=result.families.find(f=>f.kind==='EXAM');assert.equal(exam.qty,60);assert.equal(exam.buckets.RETAIL.qty,20);assert.equal(exam.buckets.SKTQ.qty,10);assert.equal(exam.buckets.SLUT1.qty,10);assert.equal(exam.buckets.SLUT2.qty,20);
 for(const f of result.families)assert.equal(Object.values(f.buckets).reduce((n,b)=>n+b.qty,0),f.qty);
});
test('Ultrasound, 2D and 3D keep distinct tariffs and package allocations',()=>{
 const r=serviceCalculation(demo.rows,config),us=r.families.find(f=>f.kind==='US'),x2=r.families.find(f=>f.kind==='XR2'),x3=r.families.find(f=>f.kind==='XR3');
 assert.equal(us.buckets.SKTQ.net,2000000);assert.equal(us.buckets.SLUT1.net,3000000);assert.equal(us.buckets.SLUT2.net,5000000);assert.equal(x2.buckets.SLUT1.qty,0);assert.equal(x3.buckets.SLUT2.net,5700000);assert.equal(x2.buckets.SLUT2.net,3700000);
});
test('No inference from ordering department or package names; extra service remains retail',()=>{
 const row=demo.rows.find(r=>r.price_mode==='TRONGGOI');assert.equal(billingType(row,{}),'UNKNOWN');
 assert.equal(billingType({...row,price_mode:'THEMNGOAIGOI'},config),'RETAIL');
 assert.equal(billingType({...row,price_mode:'MUALE'},config),'UNKNOWN');
 const xr=demo.rows.find(r=>r.service_code==='SYN-DV005');assert.equal(billingType({...xr,price_mode:'TRONGGOI',package_id:'SIM-SLUT1-2026'},config),'UNKNOWN');
});
test('Only completed scoped rows count; missing net is flagged and incomplete combo does not fabricate components',()=>{
 const combo=demo.rows.filter(r=>r.package_id==='SIM-SLUT2-2026').slice(0,1),row=combo[0];
 const result=serviceCalculation([{...row,completed_net_vnd:null},{...row,status:'HUY'},{...row,performing_dept:'CDHA'},{...row,in_snapshot:0}],config);
 assert.equal(result.families.find(f=>f.kind==='EXAM').qty,1);assert.equal(result.families.find(f=>f.kind==='EXAM').missing,1);assert.equal(result.warnings.length,1);assert.equal(result.families.find(f=>f.kind==='US').qty,0);
});
test('Demo install is additive, idempotent, preserves local edits and does not change frozen source',()=>{
 const s={rows:[{order_id:'EXISTING'}],logs:[],imports:[],serviceCalculation:{packageTypes:{CUSTOM:'OTHER'}}};
 installServiceDemo(s,demo);assert.equal(s.rows.length,171);s.rows[1].unit_price_vnd=123;installServiceDemo(s,demo);assert.equal(s.rows.length,171);assert.equal(s.rows[1].unit_price_vnd,123);assert.equal(s.serviceCalculation.packageTypes.CUSTOM,'OTHER');
 const frozen={rows:[],report:{id:'SNAP'}};assert.deepEqual(installServiceDemo(frozen,demo),frozen);assert.equal(frozen.rows.length,0);
});
test('Rules changes require permissions, unlocked report and reason; retain prior mapping audit',()=>{
 assert.throws(()=>saveCalculationConfig({},config,'Chỉ xem','Lý do đối soát'));
 assert.throws(()=>saveCalculationConfig({report:{}},config,'Nhập / đối soát','Lý do đối soát'));
 const s=saveCalculationConfig({},config,'Nhập / đối soát','Xác nhận phân loại gói');assert.equal(s.calculationHistory.length,1);assert.equal(s.calculationHistory[0].after.packageTypes['SIM-SLUT1-2026'],'SLUT1');
});
test('New user-facing CSV files contain no synthetic indication codes or order_id column',()=>{
 for(const name of ['GIALAP_KHAM_COMBO.csv','GIALAP_SIEU_AM.csv','GIALAP_XQ_2D.csv','GIALAP_XQ_3D.csv']){const csv=fs.readFileSync(new URL('../data_gialap/DICH_VU_COMBO/'+name,import.meta.url),'utf8');assert.ok(!csv.includes('SIM-CALC-'));assert.ok(!csv.includes('"order_id"'));assert.ok(!csv.includes('"his_order_id"'));}
});
test('Public CSV keeps technical links while using only actual HIS codes as indication IDs',()=>{
 const converted=publicJourneyRows([{order_id:'SYN-ORD-0001-1',parent_order_id:'SYN-ORD-0001-2',reviewed_order_ids:['SYN-ORD-0001-1']}])[0];
 assert.ok(!Object.hasOwn(converted,'his_order_id'));assert.equal(converted.internal_link_key,'local-link:0001-1');assert.equal(converted.internal_parent_key,'local-link:0001-2');assert.deepEqual(converted.internal_reviewed_keys,['local-link:0001-1']);assert.ok(!Object.hasOwn(converted,'order_id'));
 assert.ok(!Object.hasOwn(publicJourneyRows([{order_id:'HIS-000123'}])[0],'his_order_id'));
});
test('Import uses supplied HIS ID unchanged and never treats a synthetic code as a real HIS ID',()=>{
 const real={...demo.rows[0],his_order_id:'HIS-000123',is_synthetic:0};delete real.order_id;
 const adapted=adaptRows([real],'HIS.csv').rows;
 const normalized=normalizeIncomingRows(adapted,'HIS.csv')[0];assert.equal(normalized.order_id,'HIS-000123');assert.equal(normalized.his_order_id,'HIS-000123');
 assert.equal(normalizeIncomingRows([demo.rows[0]],'DEMO.csv')[0].his_order_id,undefined);
});
