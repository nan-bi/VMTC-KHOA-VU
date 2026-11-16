import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {revisionSync} from '../src/features/backend/revisionSync.mjs';
import {commitImportState} from '../src/features/reports/commitImport.mjs';
import {prepareReportImport} from '../src/features/reports/prepareImport.mjs';
import {emptyWorkspace} from '../src/features/reports/operationalState.mjs';
import {saveDataEdit} from '../src/features/dataWorkspace/dataModel.mjs';
import {createBackend} from '../backend/server.mjs';
import {getWorkspace,updateWorkspace} from '../backend/workspace.mjs';
import {templateWorkbook} from '../src/features/reports/templateExport.mjs';
import {pythonTask} from '../src/features/backend/pythonClient.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],name:r['Tên đơn vị dịch vụ mô phỏng'],group:r['Nhóm']}));
function file(row){const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([row]),'Bảng nguồn');const bytes=XLSX.write(book,{type:'array',bookType:'xlsx'});return {name:'File tùy chọn.xlsx',size:bytes.byteLength,arrayBuffer:async()=>bytes};}
test('unchanged server polling does not reset active UI; each real revision is delivered once',()=>{
 const sync=revisionSync(3,2);assert.deepEqual(sync({revision:3},{revision:2}),{workspace:false,reviews:false});assert.deepEqual(sync({revision:4},{revision:2}),{workspace:true,reviews:false});assert.deepEqual(sync({revision:4},{revision:3}),{workspace:false,reviews:true});assert.deepEqual(sync({revision:4},{revision:3}),{workspace:false,reviews:false});
});
test('live import commit, reload, learned columns, edit, snapshot, approval and output share real persisted state',async()=>{
 const app=await createBackend({databasePath:':memory:',initialState:emptyWorkspace(),catalog}),editor={username:'workflow-editor',role:'editor'},reviewer={username:'workflow-reviewer',role:'reviewer'};
 const save=(state,user=editor)=>updateWorkspace(app.db,{expectedRevision:state.revision,state},user,catalog);
 try{
 let state=getWorkspace(app.db),row=structuredClone(seed.CANONICAL.find(r=>r.status==='HOANTHANH'&&r.price_mode==='MUALE'&&+r.discount_known===1));delete row.order_id;row['Khoa kê dịch vụ']=row.ordering_dept;delete row.ordering_dept;row.package_id=null;row.discount_vnd=0;row.completed_qty=1;row.quantity=1;
 const input=file(row),initial=await prepareReportImport([input],state,catalog),table=initial.referenceTables[0];assert.ok(table);
 const profile={file:table.file,sheet:table.sheet,columns:table.columns,mapping:{'Khoa kê dịch vụ':'ordering_dept'},reason:'Đối chiếu cột với đơn vị nguồn'};
 const preview=await prepareReportImport([input],state,catalog,[profile]);assert.equal(preview.issues.length,0);
 state=await save(commitImportState(state,preview));state=JSON.parse(JSON.stringify(getWorkspace(app.db)));assert.deepEqual(state.imports[0].columnMappings,[profile]);assert.deepEqual(state.imports[0].serviceSheets,['Bảng nguồn']);
 const nextInput=file({...row,patient_id:'WORKFLOW-P2',visit_id:'WORKFLOW-V2'}),next=await prepareReportImport([nextInput],state,catalog);assert.equal(next.rows.length,1);assert.equal(next.referenceTables.length,0);assert.equal(next.issues.length,0);
 state=saveDataEdit(state,{index:0,patch:{quantity:2,completed_qty:2},reason:'Đối chiếu lại số lượng nguồn',expectedRevision:state.revision},catalog);state=await save(state);assert.equal(state.rows[0].completed_qty,2);assert.equal(state.rows[0].completed_gross_vnd,2*row.unit_price_vnd);assert.equal(state.dataEdits.length,1);
 state.report={status:'draft',week:'2026-01-01',end:'2027-01-01'};state=await save(state);assert.equal(state.report.stats.qty,2);assert.equal(state.report.serviceRevenue.knownRevenue,2*row.unit_price_vnd);
 state.report.narrative='Đã đối chiếu dữ liệu nguồn và phép tính.';state.report.status='submitted';state=await save(state);state.report.status='approved';state=await save(state,reviewer);
 const report=state.report;const workbook=await templateWorkbook({rows:report.stats.completed,catalog,detail:false,serviceRevenue:report.serviceRevenue,meta:{from:report.week,toExclusive:report.end,id:report.id,status:'ĐÃ DUYỆT'}});assert.ok(workbook.bytes.length>1000);
 const ppt=await pythonTask('meeting-presentation',report);assert.ok(Buffer.from(ppt.content,'base64').length>1000);assert.deepEqual(getWorkspace(app.db).report,report);
 assert.throws(()=>commitImportState(state,preview),/khóa|thay đổi/);
 }finally{await app.close()}
});
