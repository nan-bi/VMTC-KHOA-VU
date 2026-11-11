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
