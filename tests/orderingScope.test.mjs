import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {aggregate} from '../src/features/reports/core.mjs';
import {serviceCalculation,selectRevenueRows} from '../src/features/reports/serviceCalculation.mjs';
import {runPythonData} from '../backend/python-data.mjs';
const demo=JSON.parse(readFileSync(new URL('../src/data/service-demo.json',import.meta.url)));
const base=demo.rows.find(r=>r.service_code==='SYN-DV008'&&r.price_mode==='MUALE');
const config={packageTypes:demo.packageTypes};
const row=(id,ordering,performing,patch={})=>({...base,order_id:id,patient_id:id,visit_id:id,ordering_dept:ordering,performing_dept:performing,completed_at:'2026-10-25T09:00:00+07:00',completed_qty:1,unit_price_vnd:100,completed_gross_vnd:100,completed_net_vnd:100,...patch});
const rows=[row('VU-IN','VU','VU'),row('VU-OUT','VU','CDHA'),row('OTHER-IN','KSKTQ','VU'),row('OTHER-OUT','NOI','CDHA'),row('PENDING','UNKNOWN','VU'),row('CANCEL','VU','VU',{status:'HUY'}),row('LATE','NOI','VU',{in_snapshot:0}),row('OLD','VU','VU',{completed_at:'2026-10-24T09:00:00+07:00'})];
const completed=aggregate(rows,[{code:base.service_code}], '2026-10-25','2026-10-26').completed;
test('Ordering groups partition confirmed rows, retain outbound/inbound and respect period/status/cutoff',()=>{
 const vu=selectRevenueRows(completed,config,'ORDERING_VU'),other=selectRevenueRows(completed,config,'ORDERING_OTHER'),all=selectRevenueRows(completed,config,'ORDERING_ALL');
 assert.deepEqual(vu.map(r=>r.order_id),['VU-IN','VU-OUT']);assert.deepEqual(other.map(r=>r.order_id),['OTHER-IN','OTHER-OUT']);
 assert.deepEqual(all.map(r=>r.order_id),['VU-IN','VU-OUT','OTHER-IN','OTHER-OUT']);
 assert.equal(new Set([...vu,...other]).size,all.length);assert.equal(serviceCalculation(completed,config,'ORDERING_ALL').revenue.knownRevenue,400);
 assert.equal(serviceCalculation(completed,config,'ORDERING_VU').revenue.knownRevenue,200);
});
test('Python and browser calculations agree for all three ordering filters',async()=>{
 for(const department of ['ORDERING_ALL','ORDERING_VU','ORDERING_OTHER']){
  const js=serviceCalculation(completed,config,department),py=(await runPythonData('calculation',{rows:completed,config,department})).value;
  assert.deepEqual(py,js,department);
 }
});
