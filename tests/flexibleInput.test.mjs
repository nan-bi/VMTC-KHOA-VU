import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {prepareReportImport} from '../src/features/reports/prepareImport.mjs';
import {pythonTask} from '../src/features/backend/pythonClient.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng']}));
const base=()=>structuredClone(seed.CANONICAL.find(r=>r.status==='HOANTHANH'&&r.price_mode==='MUALE'&&+r.discount_known===1));
const state=()=>({rows:[],hashes:[],imports:[],revision:1});
function file(name,row){const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([row]),'Sheet khác');const bytes=XLSX.write(book,{type:'array',bookType:'xlsx'});return {name,size:bytes.byteLength,arrayBuffer:async()=>bytes};}
test('arbitrary file and column labels can be confirmed and reused, without changing source or report schema',async()=>{
 const row=base();delete row.order_id;const custom={...row,'Nơi kê dịch vụ mới':row.ordering_dept};delete custom.ordering_dept;
 const current=state(),before=structuredClone(current),f=file('Tên nguồn bất kỳ.xlsx',custom);
 const initial=await prepareReportImport([f],current,catalog);assert.equal(initial.rows.length,0);assert.equal(initial.referenceTables.length,1);
 const table=initial.referenceTables[0],profile={file:table.file,sheet:table.sheet,columns:table.columns,mapping:{'Nơi kê dịch vụ mới':'ordering_dept'},reason:'Đã đối chiếu ý nghĩa với nguồn'};
 const mapped=await prepareReportImport([f],current,catalog,[profile]);assert.equal(mapped.rows.length,1);assert.equal(mapped.issues.length,0);assert.equal(mapped.rows[0].ordering_dept,row.ordering_dept);assert.equal(mapped.rows[0].source_row,2);assert.equal(mapped.rows[0].source_sheet,'Sheet khác');assert.deepEqual(current,before);
 const learned=await prepareReportImport([file('Lần khác.xlsx',custom)],{...state(),imports:mapped.files},catalog);assert.equal(learned.rows.length,1);assert.equal(learned.issues.length,0);
 const reordered=Object.fromEntries(Object.entries(custom).reverse());const reorderedPreview=await prepareReportImport([file('Đổi thứ tự.xlsx',reordered)],{...state(),imports:mapped.files},catalog);assert.equal(reorderedPreview.rows.length,1);
 const promoted=await prepareReportImport([f],{...state(),hashes:initial.hashes,imports:initial.files},catalog,[profile]);assert.equal(promoted.rows.length,1);
 const repeated=await prepareReportImport([f],{...state(),rows:promoted.rows,hashes:initial.hashes,imports:[...initial.files,...promoted.files]},catalog);assert.equal(repeated.rows.length,0);
 const conflict={...profile,learned:true,mapping:{'Nơi kê dịch vụ mới':'performing_dept'}};
 const ambiguous=await prepareReportImport([f],{...state(),imports:[{columnMappings:[profile,conflict]}]},catalog);assert.equal(ambiguous.rows.length,0);assert.match(ambiguous.referenceTables[0].mappingError,/mâu thuẫn/);
 const forged=await prepareReportImport([f],current,catalog,[{...profile,mapping:{'Nơi kê dịch vụ mới':'source_file'}}]);assert.equal(forged.rows.length,0);assert.match(forged.referenceTables[0].mappingError,/truy vết/);
});
test('quality action measures four routes against independent expected rows and invalidates incomplete coverage',async()=>{
 const pairs=[['VU','VU','VU_INTERNAL'],['VU','CDHA','VU_OUTBOUND'],['KSKTQ','VU','VU_INBOUND'],['NOI','CDHA','EXTERNAL_UNRELATED']];
 const rows=pairs.map(([a,b],i)=>({...base(),ordering_dept:a,performing_dept:b,source_file:'Nguồn.csv',source_sheet:'Sheet1',source_row:i+2,completed_qty:1,unit_price_vnd:100,price_mode:'MUALE',package_id:null}));
 const standards=rows.map((r,i)=>({source_file:r.source_file,source_sheet:r.source_sheet,source_row:r.source_row,expected_route:pairs[i][2],expected_service_code:r.service_code,expected_revenue_vnd:i<2?100:0}));
 const result=await pythonTask('evaluate-quality',{rows,standards});assert.equal(result.passed,true);assert.equal(result.revenueErrorPercent,0);assert.equal(result.classificationErrors,0);
 const partial=await pythonTask('evaluate-quality',{rows,standards:standards.slice(0,2)});assert.equal(partial.passed,false);assert.equal(partial.extraRows,2);
 const blocked=await pythonTask('evaluate-quality',{rows,standards,blockedCount:1});assert.equal(blocked.passed,false);
});

test('confirmed source service extends the authoritative catalog and calculations without changing base entries',async()=>{
 const {extendCatalog}=await import('../src/features/reports/serviceCatalog.mjs');
 const {createBackend}=await import('../backend/server.mjs');const {createUser}=await import('../backend/auth.mjs');const {getWorkspace,updateWorkspace}=await import('../backend/workspace.mjs');
 const original=[{code:'BASE',name:'Existing',group:'Khám vú'}],config={packageTypes:{},serviceKinds:{'REAL-US':'US'},additionalServices:[{code:'REAL-US',name:'Siêu âm nguồn mới',group:'Siêu âm vú'}]};
 assert.throws(()=>extendCatalog(original,{additionalServices:[{code:'BASE',name:'Overwrite',group:'Khác'}]}));
 const app=await createBackend({databasePath:':memory:',catalog:original});createUser(app.db,{username:'catalog-test',password:'Catalog-Test-Internal-1234',role:'editor'});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+app.server.address().port;
 try{const before=getWorkspace(app.db),next=structuredClone(before);next.serviceCalculation=config;next.calculationHistory=[{reason:'Xác nhận dịch vụ mới theo nguồn'}];await updateWorkspace(app.db,{expectedRevision:before.revision,state:next},{username:'catalog-test',role:'editor'},original);
 const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'catalog-test',password:'Catalog-Test-Internal-1234'})});const session=await login.json(),headers={Cookie:login.headers.get('set-cookie').split(';')[0],Origin:origin,'Content-Type':'application/json','X-CSRF-Token':session.csrf};
 const services=(await (await fetch(origin+'/api/catalog',{headers})).json()).services;assert.deepEqual(services,extendCatalog(original,config));
 const row={...base(),service_code:'REAL-US',service_name:'Siêu âm nguồn mới'};const response=await fetch(origin+'/api/data/validate',{method:'POST',headers,body:JSON.stringify({rows:[row],catalog:[]})});const result=await response.json();assert.equal(response.status,200);assert.equal(result.value.valid.length,1);assert.equal(result.value.issues.length,0);
 }finally{await app.close()}
});
