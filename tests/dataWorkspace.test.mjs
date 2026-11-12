import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {editedRow,saveDataEdit,dataView,chartSummary,chartDetails,sourceKey} from '../src/features/dataWorkspace/dataModel.mjs';
import {validate,aggregate} from '../src/features/reports/core.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],name:r['Tên đơn vị dịch vụ mô phỏng'],group:r['Nhóm']}));
const base=()=>({...seed.CANONICAL.find(r=>r.status==='HOANTHANH'&&r.price_mode==='MUALE'&&+r.discount_known===1),order_id:'EDIT-01',patient_id:'BN-01',visit_id:'LK-01',quantity:1,completed_qty:1,unit_price_vnd:100000,gross_order_vnd:100000,discount_vnd:10000,completed_gross_vnd:100000,completed_net_vnd:90000,net_order_vnd:90000,ordered_at:'2026-10-23T09:00:00+07:00',completed_at:'2026-10-23T10:00:00+07:00',in_snapshot:1,source_file:'File A.xlsx',source_sheet:'CANONICAL',source_row:4});
const state=rows=>({version:1,revision:5,rows,excluded:[],logs:[],imports:[],hashes:[],report:null});
const payload=patch=>({index:0,patch,reason:'Đối chiếu đơn giá nguồn',expectedRevision:5});
test('Chart details include only contributing completed rows and exclude unknown net amounts',()=>{
 const row=base(),entries=[row,{...row,status:'HUY'},{...row,in_snapshot:0},{...row,completed_net_vnd:null}].map((row,index)=>({row,index}));
 const focus={kind:'group',value:catalog.find(c=>c.code===row.service_code).group,metric:'gross'};
 assert.deepEqual(chartDetails(entries,focus,catalog).map(e=>e.index),[0,3]);
 assert.deepEqual(chartDetails(entries,{...focus,metric:'net'},catalog).map(e=>e.index),[0]);
 assert.equal(chartDetails(entries,focus,catalog).reduce((sum,e)=>sum+e.row.completed_gross_vnd,0),chartSummary(entries.map(e=>e.row),catalog).gross);
});
test('Saved edit keeps provenance, IDs, immutable prior source and audit before/after',()=>{
 const current=state([base()]),before=structuredClone(current),next=saveDataEdit(current,payload({unit_price_vnd:200000}),catalog);
 assert.deepEqual(current,before);assert.equal(next.rows[0].completed_gross_vnd,200000);assert.equal(next.rows[0].completed_net_vnd,190000);assert.equal(next.rows[0].source_file_hash,current.rows[0].source_file_hash);assert.equal(next.rows[0].source_row,4);assert.equal(next.rows[0].order_id,'EDIT-01');
 assert.equal(next.dataEdits.length,1);assert.equal(next.dataEdits[0].changes.find(c=>c.field==='unit_price_vnd').before,100000);assert.equal(next.dataEdits[0].changes.find(c=>c.field==='unit_price_vnd').after,200000);
 assert.equal(next.rows[0].net_order_vnd,190000);
});
test('Unknown discounts remain null; packages use allocation; blank costs do not become zero',()=>{
 const row=base(),unknown=editedRow(row,{discount_known:0,drug_cost_vnd:null},catalog);assert.equal(unknown.completed_net_vnd,null);assert.equal(unknown.drug_cost_vnd,null);
 const pkg=editedRow(row,{price_mode:'TRONGGOI',package_id:'PKG-01',package_allocation_vnd:45000},catalog);assert.equal(pkg.completed_net_vnd,45000);assert.equal(validate([pkg],catalog).issues.length,0);
 assert.throws(()=>saveDataEdit(state([row]),payload({package_allocation_vnd:300000,price_mode:'TRONGGOI',package_id:'PKG'}),catalog),/khoảng hợp lệ/);
});
test('Reject stale writes, readonly, closed snapshots, invalid data and identity/provenance edits',()=>{
 const current=state([base()]);
 for(const p of [{...payload({unit_price_vnd:2}),expectedRevision:4},{...payload({unit_price_vnd:2}),actor:'Chỉ xem'},payload({unit_price_vnd:-1}),payload({patient_id:'OTHER'}),payload({source_row:999}),payload({completed_at:'2026-02-30'}),payload({birads:8}),payload({drug_cost_vnd:-1}),{...payload({unit_price_vnd:200000}),reason:'x'}])assert.throws(()=>saveDataEdit(current,p,catalog));
 assert.throws(()=>saveDataEdit({...current,report:{status:'approved'}},payload({unit_price_vnd:200000}),catalog),/chốt/);
 assert.throws(()=>saveDataEdit({...current,excluded:[0]},payload({unit_price_vnd:200000}),catalog),/không còn/);
});
test('An edit cannot introduce conflicting duplicate orders or visit ownership',()=>{
 const row=base(),current=state([row,{...row}]);assert.throws(()=>saveDataEdit(current,payload({unit_price_vnd:200000}),catalog),/Trùng mã/);
 assert.throws(()=>saveDataEdit(state([row]),payload({}),catalog),/Chưa có/);
});
test('Service code change follows catalog and cancellation removes completed revenue',()=>{
 const row=base(),code=catalog.find(c=>c.code!==row.service_code).code,updated=saveDataEdit(state([row]),payload({service_code:code}),catalog).rows[0];
 assert.equal(updated.service_name,catalog.find(c=>c.code===code).name);
 const cancelled=saveDataEdit(state([row]),payload({status:'HUY'}),catalog).rows[0];assert.equal(cancelled.completed_qty,0);assert.equal(cancelled.completed_at,null);assert.equal(chartSummary([cancelled],catalog).gross,0);
});
test('Source/sheet, date inclusive boundary, all-time filters and original indices remain aligned',()=>{
 const a=base(),b={...a,order_id:'EDIT-02',source_sheet:'Other',completed_at:'2026-10-24T00:00:00+07:00'},c={...a,order_id:'EDIT-03',completed_at:'2026-10-23T23:59:59+07:00'};
 assert.notEqual(sourceKey(a),sourceKey(b));const opts={from:'2026-10-23',toExclusive:'2026-10-24'};
 assert.deepEqual(dataView([a,b,c],opts,catalog).map(e=>e.index),[0,2]);assert.equal(dataView([a,b,c],{...opts,basis:'all'},catalog).length,3);
 assert.equal(dataView([a,b,c],{...opts,basis:'all',source:sourceKey(b)},catalog)[0].index,1);
 assert.equal(dataView([a,b,c],{...opts,search:'edit-03'},catalog)[0].index,2);
});
test('Saved rows, reloaded state, report totals and all chart series use exactly one source',()=>{
 const next=saveDataEdit(state([base()]),payload({quantity:2,completed_qty:2,unit_price_vnd:200000}),catalog),reloaded=JSON.parse(JSON.stringify(next));
 const accepted=validate(reloaded.rows,catalog);assert.equal(accepted.issues.length,0);
 const report=aggregate(accepted.valid,catalog,'2026-10-23','2026-10-24'),charts=chartSummary(accepted.valid,catalog);
 assert.equal(report.gross,charts.gross);assert.equal(report.qty,charts.qty);assert.equal(report.net,charts.net);assert.equal(charts.days.reduce((n,r)=>n+r.gross,0),report.gross);assert.equal(charts.groups.reduce((n,r)=>n+r.gross,0),report.gross);assert.equal(charts.doctors.reduce((n,r)=>n+r.gross,0),report.gross);assert.equal(reloaded.dataEdits.length,1);
});
