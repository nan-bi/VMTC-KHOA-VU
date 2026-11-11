import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {analyze} from '../src/features/intelligence/routing.mjs';
import {revenueSnapshot,revenueWorkbook,revenuePresentation} from '../src/features/intelligence/revenueExport.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],group:r['Nhóm']}));
const analysis=()=>analyze(structuredClone(seed.CANONICAL),catalog,{from:'2026-10-19',toExclusive:'2026-10-26'});
test('Snapshot tách khỏi nguồn, chi tiết từng phần khớp đúng tổng đã tính',async()=>{
 const a=analysis(),s=await revenueSnapshot(a);const before=s.analysis.records[0].row.quantity;a.records[0].row.quantity=99;assert.equal(s.analysis.records[0].row.quantity,before);
 assert.equal(s.routeRows.reduce((n,r)=>n+r['Vú chỉ định đã biết VND'],0),s.analysis.finance.ordered.known_vnd);
 assert.equal(s.routeRows.reduce((n,r)=>n+r['Vú thực hiện trước giảm VND'],0),s.analysis.finance.performed.gross_vnd);
 const source=s.sheets.find(s=>s.name==='Nguon_day_du').rows;assert.equal(source.length,2700);
 assert.ok(s.sheets.find(s=>s.name==='Chi_dinh').rows.every(r=>r.counted_order===1));assert.ok(s.sheets.find(s=>s.name==='Thuc_hien').rows.every(r=>r.counted_performed===1));
 assert.equal(s.meta.sha256.length,64);
});
test('Excel đủ 10 sheet, giữ tiền dạng số, mã dạng text và thiếu dạng trống',async()=>{
 const a=analysis();a.records[0].row.patient_id='0000123';a.records[0].row.completed_net_vnd=null;
 const s=await revenueSnapshot(a),{bytes}=await revenueWorkbook(s),book=XLSX.read(bytes,{type:'array'});
 assert.equal(book.SheetNames.length,10);const raw=XLSX.utils.sheet_to_json(book.Sheets.Nguon_day_du,{defval:null});assert.equal(raw[0].patient_id,'0000123');assert.equal(raw[0].completed_net_vnd,null);
 const rows=XLSX.utils.sheet_to_json(book.Sheets.Theo_luong);assert.equal(typeof rows[0]['Vú chỉ định đã biết VND'],'number');
 const overview=XLSX.utils.sheet_to_json(book.Sheets.Tong_quan);assert.ok(overview.some(r=>r.Giá_trị===s.meta.id));assert.ok(overview.some(r=>r.Giá_trị===s.meta.sha256));
});
test('PowerPoint có bảng chỉnh sửa và cùng metadata của bộ Excel',async()=>{
 const s=await revenueSnapshot(analysis()),deck=await revenuePresentation(s),bytes=await deck.write({outputType:'arraybuffer'}),zip=await JSZip.loadAsync(bytes);
 const slides=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));assert.ok(slides.length>=7);
 const xml=(await Promise.all(slides.map(n=>zip.file(n).async('string')))).join('\n');assert.ok(xml.includes('<a:tbl>'));assert.ok(xml.includes(s.meta.id));assert.ok(xml.includes(s.meta.sha256));assert.ok(xml.includes('Giá trị dịch vụ Khoa Vú'));
});
test('Dữ liệu ô quá dài bị chặn, không cắt nội dung nguồn âm thầm',async()=>{
 const a=analysis();a.records[0].row.note='x'.repeat(32768);await assert.rejects(()=>revenueSnapshot(a),/32.767/);
});
