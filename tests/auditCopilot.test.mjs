import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {ingestFiles} from '../src/features/intelligence/ingestion.mjs';
import {analyze,fingerprint} from '../src/features/intelligence/routing.mjs';
import {askAudit,citation} from '../src/features/intelligence/auditCopilot.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],group:r['Nhóm']}));
const base=(id='ORD-01')=>({...seed.CANONICAL[0],order_id:id,patient_id:'BN-0001',visit_id:'LK-0001',ordered_at:'2026-10-23T09:00:00+07:00',completed_at:'2026-10-23T10:00:00+07:00',in_snapshot:1});
const run=rows=>analyze(rows,catalog,{from:'2026-10-23',toExclusive:'2026-10-24'});
function file(name,rows,{sheet='CANONICAL',gap=false}={}){const headers=Object.keys(rows[0]),grid=[headers,...rows.flatMap((r,i)=>[...(gap&&i===1?[[]]:[]),headers.map(k=>r[k])])],book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(grid),sheet);const bytes=XLSX.write(book,{type:'array',bookType:'xlsx'});return {name,size:bytes.byteLength,arrayBuffer:async()=>bytes};}
test('Đa file giữ sheet, hash bytes, dòng gốc qua dòng trống; không tin metadata tự khai',async()=>{
 const a=base(),b=base('ORD-02');a.source_sheet='FORGED';a.source_row=999;a.source_file_hash='FORGED';
 const result=await ingestFiles([file('Phong A.xlsx',[a,b],{sheet:'Sheet A',gap:true}),file('Phong B.xlsx',[b])]);
 assert.equal(result.rows.length,3);assert.deepEqual(result.rows.map(r=>r.source_row),[2,4,2]);assert.equal(result.rows[0].source_sheet,'Sheet A');assert.equal(result.rows[0].source_file,'Phong A.xlsx');assert.match(result.rows[0].source_file_hash,/^[a-f0-9]{64}$/);assert.equal(result.rows[0].source_file_hash,result.files[0].hash);
});
test('Trùng giống nhau qua sheet/hash khác tính một lần; xung đột cách ly toàn nhóm',async()=>{
 const a=base(),files=await ingestFiles([file('A.xlsx',[a]),file('B.xlsx',[a],{sheet:'Other'})]);
 const s=run(files.rows);assert.equal(s.duplicates,1);assert.equal(s.finance.ordered.known_vnd,a.gross_order_vnd);assert.equal(fingerprint(files.rows[0]),fingerprint(files.rows[1]));
 const conflict=run([files.rows[0],{...files.rows[1],unit_price_vnd:a.unit_price_vnd+1}]);assert.equal(conflict.records.filter(r=>r.eligible).length,0);
});
test('Bảng không đủ schema được tách riêng; giới hạn file và tiêu đề trùng vẫn bị chặn',async()=>{
 const staged=await ingestFiles([file('A.xlsx',[base()]),file('B.xlsx',[{bad:1}])]);assert.equal(staged.rows.length,1);assert.equal(staged.files[1].referenceTables.length,1);assert.equal(staged.files[1].referenceTables[0].rows[0].bad,1);
 await assert.rejects(()=>ingestFiles(Array(11).fill(file('a.xlsx',[base()]))),/10 file/);
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['order_id','order_id'],['A','A']]),'S');const buf=XLSX.write(book,{type:'array',bookType:'xlsx'});
 await assert.rejects(()=>ingestFiles([{name:'bad.xlsx',size:buf.byteLength,arrayBuffer:async()=>buf}]),/tiêu đề cột trùng/);
});
test('Tính toàn bộ hơn 8 dòng, đủ citation từng dòng và tổng bằng tài chính chuẩn',()=>{
 const s=run(Array.from({length:20},(_,i)=>({...base('ORD-'+i),source_file:'A.xlsx',source_sheet:'S',source_row:i+2})));
 const r=askAudit(s,'Tổng giá trị chỉ định lấy từ đâu?',{mode:'ordered_money'});assert.equal(r.rows.length,20);assert.equal(r.value,s.finance.ordered.known_vnd);assert.equal(r.groups[0].contributing,20);assert.ok(r.rows.every(r=>r.citation.includes('Sheet: S')&&r.citation.includes('Khoa CĐ:')));
});
test('Không tìm thấy, query chưa hỗ trợ, chẩn đoán và phạm vi ngoài kỳ không suy đoán',()=>{
 const s=run([base()]);assert.equal(askAudit(s,'BN-9999',{fileCount:2}).rows.length,0);assert.match(askAudit(s,'BN-9999',{fileCount:2}).answer,/2 file/);assert.equal(askAudit(s,'Thời tiết hôm nay').unsupported,true);assert.equal(askAudit(s,'Tổng doanh thu dịch vụ XYZ',{mode:'ordered_money'}).unsupported,true);assert.equal(askAudit(s,'Chẩn đoán siêu âm có bị ung thư').unsupported,true);
 const old=run([{...base(),ordered_at:'2026-09-01',completed_at:'2026-09-02'}]);assert.equal(askAudit(old,'BN-0001').rows.length,0);assert.equal(askAudit(old,'BN-0001',{scope:'all'}).rows.length,1);assert.throws(()=>askAudit(old,'Tổng doanh thu',{mode:'ordered_money',scope:'all'}));assert.match(citation(s.records[0]),/Chưa có metadata sheet/);
});
test('Truy nhóm trùng giữ cả bản gốc và bản loại trừ; tiền thiếu không thành tiền 0 của dòng',()=>{
 const a=base(),s=run([{...a,source_file:'A.csv'},{...a,source_file:'B.csv'}]);const r=askAudit(s,'Các mã trùng giữa file');assert.equal(r.rows.length,2);assert.equal(r.contributing,1);assert.equal(r.warnings.length,2);
 const missing=run([{...a,completed_net_vnd:null,discount_known:0}]);const m=askAudit(missing,'Tổng doanh thu',{mode:'performed_net'});assert.equal(m.missing,1);assert.equal(m.rows[0].value,null);assert.equal(m.value,missing.finance.performed.known_net_vnd);
});
test('Một kỹ thuật không kéo cả nhóm can thiệp; tên file có dấu cách vẫn truy được',()=>{
 const a={...base(),service_name:'VABB vú trái',source_file:'Phong Can Thiep.xlsx'},b={...base('ORD-02'),service_name:'FNA vú trái',source_file:'Other.xlsx'};
 assert.equal(askAudit(run([a,b]),'VABB ở file nào?').rows.length,1);assert.equal(askAudit(run([a,b]),'Nguồn Phong Can Thiep.xlsx').rows.length,1);
});
