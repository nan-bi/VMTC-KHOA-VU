import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as XLSX from 'xlsx';
import {departmentRevenue,allRevenueSnapshot} from '../src/features/reports/departmentRevenue.mjs';
import {DEFAULT_SERVICE_KINDS} from '../src/features/reports/serviceCalculation.mjs';
import {runPythonData} from '../backend/python-data.mjs';
import {templateWorkbook} from '../src/features/reports/templateExport.mjs';
import {meetingSlides} from '../src/features/reports/meetingExport.mjs';
import {aggregate,validate} from '../src/features/reports/core.mjs';
const seed=JSON.parse(readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const demo=JSON.parse(readFileSync(new URL('../src/data/service-demo.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],name:r['Tên đơn vị dịch vụ mô phỏng'],group:r['Nhóm']}));
const base={...demo.rows.find(r=>r.price_mode==='MUALE'),completed_qty:1,quantity:1,unit_price_vnd:100,completed_gross_vnd:100,completed_net_vnd:100,discount_known:1,discount_vnd:0};
const row=(i,patch={})=>({...base,order_id:'ALL-'+i,visit_id:'VISIT-'+i,...patch});
const config={serviceKinds:DEFAULT_SERVICE_KINDS,packageTypes:{...demo.packageTypes,'OTHER-PACK':'OTHER'}};
const rows=[row(1,{ordering_dept:'VU',performing_dept:'VU'}),row(2,{ordering_dept:'VU',performing_dept:'CDHA'}),row(3,{ordering_dept:'KSKTQ',performing_dept:'VU'}),row(4,{ordering_dept:'NOI',performing_dept:'XETNGHIEM'}),row(5,{ordering_dept:'Unknown',performing_dept:'VU'}),row(6,{status:'HUY'}),row(7,{in_snapshot:0}),row(8,{ordering_dept:'VU',performing_dept:'GPB',service_code:'LAB-NEW',service_name:'Giải phẫu bệnh',price_mode:'TRONGGOI',package_id:'OTHER-PACK',package_allocation_vnd:60,completed_net_vnd:60})];
test('All departments partition revenue once by each axis and include non-combo medical services',async()=>{
 const value=departmentRevenue(rows,config);
 assert.equal(value.records,5);assert.equal(value.pendingRecords,1);assert.equal(value.revenue.knownRevenue,460);
 for(const key of ['byOrdering','byPerforming','byRoute','byBilling'])assert.equal(value[key].reduce((s,r)=>s+r.knownRevenue,0),460);
 assert.equal(value.byRoute.find(r=>r.key==='EXTERNAL_UNRELATED').knownRevenue,100);
 assert.equal(value.byBilling.find(r=>r.key==='OTHER').knownRevenue,60);
 assert.ok(value.revenue.lines.some(r=>r.code==='LAB-NEW'&&r.kind==='OTHER'));
 assert.deepEqual((await runPythonData('department-revenue',{rows,config})).value,value);
});
test('Department aliases combine, missing tariffs remain unknown, PID repetition retains all services',async()=>{
 const own=[row(10,{ordering_dept:'Khoa Vú',performing_dept:'CDHA'}),row(11,{ordering_dept:'VU',performing_dept:'CDHA'}),row(12,{ordering_dept:'VU',performing_dept:'CDHA',price_mode:'TRONGGOI',package_id:'OTHER-PACK',package_allocation_vnd:null})];
 const value=departmentRevenue(own,config);assert.equal(value.byOrdering.length,1);assert.equal(value.revenue.knownRevenue,200);assert.equal(value.revenue.missingRecords,1);assert.equal(value.records,3);
 assert.deepEqual((await runPythonData('department-revenue',{rows:own,config})).value,value);
 const frozen=allRevenueSnapshot(own,config);own[0].unit_price_vnd=999;config.rates={};assert.equal(frozen.sourceRows[0].unit_price_vnd,100);assert.equal(frozen.revenue.knownRevenue,200);
});
test('Frozen all-department revenue is exported as separate Excel sheets and presentation pages',async()=>{
 const valid=validate(demo.rows,catalog).valid;
 const allRevenue=allRevenueSnapshot(valid,config),stats=aggregate(valid,catalog,'2026-10-19','2026-10-26');
 const report={id:'ALL-REPORT',status:'approved',stats,allRevenue};
 const output=await templateWorkbook({rows:stats.completed,catalog,allRevenue});
 const book=XLSX.read(output.bytes,{type:'array'});
 for(const name of ['DT_KHOA_CHI_DINH','DT_KHOA_THUC_HIEN','DT_NHOM_GIA','DT_TAT_CA_DICH_VU'])assert.ok(book.SheetNames.includes(name));
 const total=XLSX.utils.sheet_to_json(book.Sheets.DT_KHOA_CHI_DINH,{header:1}).find(r=>r[0]==='TỔNG PHẦN ĐỦ GIÁ');assert.equal(total[3],allRevenue.revenue.knownRevenue);
 const slides=await meetingSlides(report);assert.ok(slides.some(s=>s.title.includes('Doanh thu tất cả khoa')));
});

test('Server snapshots all departments, ignores client totals and rejects changing frozen all-khoa revenue',async()=>{
 const {createBackend}=await import('../backend/server.mjs');
 const {createUser}=await import('../backend/auth.mjs');
 const {getWorkspace,updateWorkspace}=await import('../backend/workspace.mjs');
 const own=rows.slice(0,4),initialState={version:1,revision:0,rows:own,excluded:[],imports:[],hashes:[],logs:[],report:null,serviceCalculation:config};
 const app=await createBackend({databasePath:':memory:',initialState,catalog});
 const user=createUser(app.db,{username:'all-revenue-editor',password:'Temporary-All-Revenue-Test-Only',role:'editor'});
 try{
  let state=getWorkspace(app.db);state.report={status:'draft',week:'2026-01-01',end:'2027-01-01',allRevenue:{revenue:{knownRevenue:999999}}};
  state=await updateWorkspace(app.db,{expectedRevision:state.revision,state},user,catalog);
  assert.equal(state.report.allRevenue.revenue.knownRevenue,400);assert.equal(state.report.serviceRevenue.knownRevenue,200);assert.equal(state.report.allRevenue.sourceRows.length,4);
  state.report.allRevenue.revenue.knownRevenue=1;
  await assert.rejects(()=>updateWorkspace(app.db,{expectedRevision:state.revision,state},user,catalog),/Snapshot cố định/);
 }finally{await app.close();}
});
