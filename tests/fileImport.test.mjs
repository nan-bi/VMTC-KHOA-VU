import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {checkFileSelection} from '../src/shared/fileSelection.mjs';
import {prepareReportImport} from '../src/features/reports/prepareImport.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng']}));
const base=()=>structuredClone(seed.CANONICAL.find(r=>r.status==='HOANTHANH'&&r.price_mode==='MUALE'&&+r.discount_known===1));
const state=()=>({rows:[],hashes:[],revision:4});
function file(name,rows){const headers=Object.keys(rows[0]),grid=[headers,[],...rows.map(r=>headers.map(k=>r[k]))],book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(grid),'CANONICAL');const bytes=XLSX.write(book,{type:'array',bookType:'xlsx'});return {name,size:bytes.byteLength,arrayBuffer:async()=>bytes};}
test('Selection rejects entire batch for unsupported, oversized, empty and excessive files',()=>{
 const limits={accept:'.xlsx,.xls,.csv',maxCount:10,maxMB:10},ok={name:'CĐHA.CSV',size:100};
 assert.equal(checkFileSelection([], [ok],limits)[0],ok);
 for(const bad of [{name:'test.exe',size:20},{name:'empty.xlsx',size:0},{name:'big.xlsx',size:11*1024*1024}])assert.throws(()=>checkFileSelection([ok],[ok,bad],limits));
 assert.throws(()=>checkFileSelection(Array(9).fill(ok),[ok,ok],limits),/10 file/);
 assert.throws(()=>checkFileSelection([],[{name:'photo.xlsx',size:10}],{accept:'.pdf,.png,.jpg,.jpeg',maxCount:5,maxMB:5}),/chỉ nhận/);
});
test('Preview preserves physical provenance and does not mutate report before confirmation',async()=>{
 const row=base();row.source_row=999;row.source_sheet='FORGED';const current=state(),before=structuredClone(current);
 const p=await prepareReportImport([file('Nguồn máy.xlsx',[row])],current,catalog);
 assert.deepEqual(current,before);assert.equal(p.rows.length,1);assert.equal(p.rows[0].source_row,3);assert.equal(p.rows[0].source_sheet,'CANONICAL');assert.match(p.rows[0].source_file_hash,/^[a-f0-9]{64}$/);assert.equal(p.baseRevision,4);assert.equal(p.issues.length,0);
});
test('Known bytes and same bytes renamed are skipped without doubling rows',async()=>{
 const f=file('A.xlsx',[base()]),p=await prepareReportImport([f,{...f,name:'B.xlsx'}],state(),catalog);
 assert.equal(p.rows.length,1);assert.equal(p.files.length,1);assert.equal(p.skippedFiles.length,1);
 const again=await prepareReportImport([f],{...state(),hashes:p.hashes},catalog);assert.equal(again.rows.length,0);assert.equal(again.files.length,0);
});
test('Same order once; conflicting order preserved and both sides quarantined',async()=>{
 const row=base(),f=file('A.xlsx',[row]),first=await prepareReportImport([f],state(),catalog);
 const current={...state(),rows:first.rows};
 const same=await prepareReportImport([f],current,catalog);assert.equal(same.duplicateCount,1);assert.equal(same.rows.length,0);
 const changed={...row,service_name:'Changed'},p=await prepareReportImport([file('B.xlsx',[changed])],current,catalog);
 assert.equal(p.rows.length,1);assert.equal(p.issues.length,1);assert.equal(p.existingConflicts.length,1);
});
test('All files must pass schema validation before a preview is returned',async()=>{
 const current=state();await assert.rejects(()=>prepareReportImport([file('OK.xlsx',[base()]),file('Bad.xlsx',[{bad:'value'}])],current,catalog),/thiếu cột/);assert.equal(current.rows.length,0);
});
test('Missing financial values derive only from explicit valid inputs; missing discounts stay unknown',async()=>{
 const row=base();delete row.completed_gross_vnd;delete row.completed_net_vnd;
 const p=await prepareReportImport([file('A.xlsx',[row])],state(),catalog);assert.equal(p.issues.length,0);assert.equal(p.rows[0].completed_net_vnd,p.rows[0].completed_gross_vnd-row.discount_vnd);
 const unknown={...row,discount_known:0},u=await prepareReportImport([file('U.xlsx',[unknown])],state(),catalog);assert.equal(u.rows[0].completed_net_vnd,undefined);
});

// Large workbooks may contain formatting or metadata beyond their data region.
test('100 MB files and 500 MB batches are accepted at their boundaries, including accumulated selections',async()=>{
 const {IMPORT_LIMITS}=await import('../src/shared/importLimits.mjs');
 const limits={accept:'.xlsx,.xls,.csv',maxCount:100,maxMB:IMPORT_LIMITS.fileMB,maxTotalMB:IMPORT_LIMITS.totalMB};
 const big={name:'Bao-cao.xlsx',size:100*1024*1024};
 assert.equal(checkFileSelection([],Array(5).fill(big),limits).length,5);
 assert.equal(checkFileSelection([],[{...big,size:11*1024*1024}],limits).length,1);
 assert.throws(()=>checkFileSelection([],[{...big,size:big.size+1}],limits),/100 MB/);
 assert.throws(()=>checkFileSelection(Array(5).fill(big),[{name:'extra.csv',size:1}],limits),/500 MB/);
 const f=file('Large.xlsx',[base()]);let readCount=0;const bytes=await f.arrayBuffer();
 const preview=await prepareReportImport([{...f,size:11*1024*1024,arrayBuffer:async()=>{readCount++;return bytes;}}],state(),catalog);
 assert.equal(preview.rows.length,1);assert.equal(readCount,1);
 await assert.rejects(()=>prepareReportImport([{...f,size:100*1024*1024+1,arrayBuffer:async()=>{throw Error('must not read oversized bytes');}}],state(),catalog),/100 MB/);
});

test('an actual CSV larger than 10 MB is parsed and remains traceable',async()=>{
 const row={...base(),extra_metadata:'x'.repeat(11*1024*1024)},csv=XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet([row]));
 const bytes=new TextEncoder().encode(csv);
 assert.ok(bytes.byteLength>10*1024*1024);
 const preview=await prepareReportImport([{name:'Bao-cao-lon.csv',size:bytes.byteLength,arrayBuffer:async()=>bytes.buffer}],state(),catalog);
 assert.equal(preview.rows.length,1);assert.equal(preview.rows[0].source_file,'Bao-cao-lon.csv');assert.equal(preview.rows[0].source_row,2);assert.equal(preview.issues.length,0);
});

test('a single template-style file without order/HIS IDs has stable internal identity in file and folder modes',async()=>{
 const row=base();delete row.order_id;delete row.his_order_id;
 const f=file('No-ID.xlsx',[row]);
 const single=await prepareReportImport([f],state(),catalog);
 const folder=await prepareReportImport([{...f,webkitRelativePath:'Upload/No-ID.xlsx'}],state(),catalog);
 assert.match(single.rows[0].order_id,/^LOCAL-[a-f0-9]{64}$/);
 assert.equal(single.rows[0].order_id,folder.rows[0].order_id);
 assert.equal(single.rows[0].his_order_id,undefined);
 assert.equal(single.issues.length,0);
 const again=await prepareReportImport([f],{...state(),rows:single.rows},catalog);
 assert.equal(again.rows.length,0);assert.equal(again.duplicateCount,1);
 const csv=new TextEncoder().encode(XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet([row])));
 const csvResult=await prepareReportImport([{name:'No-ID.csv',size:csv.byteLength,arrayBuffer:async()=>csv.buffer}],state(),catalog);
 assert.match(csvResult.rows[0].order_id,/^LOCAL-/);assert.equal(csvResult.issues.length,0);
});

test('real XLS and XLSX preserve date columns in 1900 and 1904 calendars without shifting prices',async()=>{
 const stamp='2026-10-01T08:30:00.000+07:00';
 const serial=(Date.UTC(2026,9,1,8,30)-Date.UTC(1899,11,30))/86400000;
 for(const date1904 of [false,true])for(const bookType of ['xlsx','biff8'])for(const styled of [false,true]){
  const row={...base(),ordered_at:serial-(date1904?1462:0),completed_at:serial-(date1904?1462:0),result_returned_at:serial-(date1904?1462:0)};
  const headers=Object.keys(row),sheet=XLSX.utils.aoa_to_sheet([headers,headers.map(k=>row[k])]);
  if(styled)for(const key of ['ordered_at','completed_at','result_returned_at'])sheet[XLSX.utils.encode_cell({r:1,c:headers.indexOf(key)})].z='yyyy-mm-dd hh:mm';
  const book=XLSX.utils.book_new();book.Workbook={WBProps:{date1904}};XLSX.utils.book_append_sheet(book,sheet,'CANONICAL');
  const bytes=XLSX.write(book,{type:'array',bookType});
  assert.equal(!!XLSX.read(bytes,{type:'array'}).Workbook.WBProps.date1904,date1904);
  const name=`Calendar.${bookType==='biff8'?'xls':'xlsx'}`;
  const p=await prepareReportImport([{name,size:bytes.byteLength,arrayBuffer:async()=>bytes}],state(),catalog);
  for(const key of ['ordered_at','completed_at','result_returned_at'])assert.equal(p.rows[0][key],stamp,`${bookType} ${date1904} ${styled} ${key}`);
  assert.equal(p.rows[0].unit_price_vnd,row.unit_price_vnd);
 }
});
