import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as X from 'xlsx';
import {analyze} from '../src/features/intelligence/routing.mjs';
import {revenueSnapshot} from '../src/features/intelligence/revenueExport.mjs';
import {executiveReport,executiveWorkbook,EXECUTIVE_SHEETS} from '../src/features/intelligence/executiveExport.mjs';
import {adaptRows} from '../src/features/intelligence/importSchema.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],group:r['Nhóm']}));
const base=(id='ORD-001')=>({...seed.CANONICAL[0],order_id:id,patient_id:'0000123',visit_id:'VISIT-01',ordered_at:'2026-10-23T09:00:00+07:00',completed_at:'2026-10-23T10:00:00+07:00',in_snapshot:1,source_file:'a.xlsx',source_sheet:'S',source_row:2});
const snap=rows=>revenueSnapshot(analyze(rows,catalog,{from:'2026-10-23',toExclusive:'2026-10-24'}));
test('Một file đúng 5 sheet, đủ cột kể cả sheet rỗng; chung ID và hash',async()=>{
 const s=await snap([base()]),r=await executiveWorkbook(s),book=X.read(r.bytes,{type:'array'});assert.deepEqual(book.SheetNames,EXECUTIVE_SHEETS);
 assert.ok(book.SheetNames.every(n=>n.length<=31));const summary=X.utils.sheet_to_json(book.Sheets[EXECUTIVE_SHEETS[0]]);assert.ok(summary.some(r=>r['Ghi chú']===s.meta.id));assert.ok(summary.some(r=>r['Ghi chú']===s.meta.sha256));
 const inbound=X.utils.sheet_to_json(book.Sheets[EXECUTIVE_SHEETS[2]],{header:1});assert.ok(inbound[0].includes('Bác sĩ chỉ định'));assert.equal(inbound.length,1);
});
test('Tổng ba sheet luồng khớp hai góc nhìn; không cộng raw của dòng trùng/hủy/xung đột',async()=>{
 const a=base(),inbound={...base('ORD-002'),ordering_dept:'KSKTQ'},outbound={...base('ORD-003'),performing_dept:'CDHA'};
 const s=await snap([a,{...a,source_file:'copy.xlsx'},inbound,outbound,{...base('ORD-004'),status:'HUY'},{...base('ORD-005'),quantity:2},{...base('ORD-005'),quantity:3}]);
 const report=executiveReport(s),rows=report.sheets.slice(1,4).flatMap(s=>s.rows),sum=k=>rows.reduce((n,r)=>n+(+r[k]||0),0);
 assert.equal(sum('Ghi nhận chỉ định VND'),s.analysis.finance.ordered.known_vnd);assert.equal(sum('Ghi nhận thực hiện trước giảm VND'),s.analysis.finance.performed.gross_vnd);assert.equal(sum('Ghi nhận thực hiện sau giảm VND'),s.analysis.finance.performed.known_net_vnd);
 assert.equal(report.sheets[2].rows.length,1);assert.equal(report.sheets[3].rows.length,1);assert.ok(rows.filter(r=>!r['Đủ điều kiện']).every(r=>r['Ghi nhận chỉ định VND']==null));
});
test('Ngày chỉ định và hoàn thành độc lập; lượt khám dùng visit_id không dùng số dòng',async()=>{
 const s=await snap([{...base(),ordered_at:'2026-10-22'},base('ORD-002')]),r=executiveReport(s);
 assert.equal(r.sheets[1].rows[0]['Ghi nhận chỉ định VND'],null);assert.equal(r.sheets[1].rows[0]['Ghi nhận thực hiện trước giảm VND'],s.analysis.records[0].row.completed_gross_vnd);
 assert.equal(r.sheets[0].rows.find(r=>r['Chỉ tiêu']==='Lượt khám hoàn thành tại Khoa Vú')['Số lượng'],1);
});
test('Gói là lát cắt trùng có chủ đích; không nối cùng mã gói sang khách hoặc lượt khác',async()=>{
 const pkg=(id,extra={})=>({...base(id),price_mode:'TRONGGOI',package_id:'PKG-01',package_name:'Gói mẫu',package_allocation_vnd:100000,completed_net_vnd:100000,...extra});
 const s=await snap([pkg('ORD-01'),pkg('ORD-02',{ordering_dept:'NOI',performing_dept:'CDHA'}),pkg('ORD-03',{ordering_dept:'NOI',performing_dept:'CDHA',patient_id:'OTHER',visit_id:'OTHER-VISIT'}),pkg('ORD-04',{ordering_dept:'NOI',performing_dept:'CDHA',visit_id:'OTHER-SAME-PATIENT'})]);
 const r=executiveReport(s),rows=r.sheets[4].rows;assert.equal(rows.length,2);assert.equal(rows[0]['Tiền phân bổ thực tế cho Khoa Vú'],100000);assert.equal(rows[1]['Tiền phân bổ thực tế cho Khoa Vú'],null);assert.equal(rows[1]['Tiền phân bổ cho khoa khác'],100000);assert.equal(r.sheets[1].rows[0]['Mã chỉ định'],rows[0]['Mã chỉ định con']);
});
test('Thiếu tên gói/bác sĩ/giảm giá giữ trống; mã có số 0 đầu và tiền giữ đúng kiểu',async()=>{
 const a={...base(),price_mode:'TRONGGOI',package_id:'PKG',discount_known:0,completed_net_vnd:null,package_allocation_vnd:null};
 const r=await executiveWorkbook(await snap([a])),b=X.read(r.bytes,{type:'array'}),raw=X.utils.sheet_to_json(b.Sheets[EXECUTIVE_SHEETS[1]],{defval:null})[0];
 assert.equal(raw['Mã BN'],'0000123');assert.equal(raw['Bác sĩ chỉ định'],null);assert.equal(raw['Tên gói dịch vụ'],null);assert.equal(raw['Thành tiền sau giảm'],null);assert.equal(typeof raw['Ghi nhận chỉ định VND'],'number');
 const p=X.utils.sheet_to_json(b.Sheets[EXECUTIVE_SHEETS[4]],{defval:null})[0];assert.equal(p['Tiền phân bổ thực tế cho Khoa Vú'],null);assert.equal(p['Đóng góp phân bổ'],0);
});
test('Không tự phân gói từ tên, không xuất dòng ngoài kỳ và không bịa xu hướng bệnh tật',async()=>{
 const s=await snap([{...base(),service_name:'Gói tầm soát Vú',price_mode:'MUALE'},{...base('ORD-002'),ordered_at:'2026-09-01',completed_at:'2026-09-02'}]),r=executiveReport(s);
 assert.equal(r.sheets[4].rows.length,0);assert.equal(r.sheets[1].rows.length,1);assert.ok(r.sheets[0].rows.some(r=>r['Ghi chú'].includes('Chưa so sánh kỳ trước')));
});
test('Nguồn 2700 dòng khớp tài chính hiện có; tên bác sĩ/gói tiếng Việt được đọc',async()=>{
 const s=await revenueSnapshot(analyze(structuredClone(seed.CANONICAL),catalog,{from:'2026-10-19',toExclusive:'2026-10-26'})),r=executiveReport(s),rows=r.sheets.slice(1,4).flatMap(s=>s.rows);
 assert.equal(rows.reduce((n,r)=>n+(r['Ghi nhận chỉ định VND']??0),0),s.analysis.finance.ordered.known_vnd);assert.equal(rows.reduce((n,r)=>n+(r['Ghi nhận thực hiện sau giảm VND']??0),0),s.analysis.finance.performed.known_net_vnd);
 const parsed=adaptRows([{...base(),'Bác sĩ chỉ định':'BS Mẫu','Tên gói dịch vụ':'Gói mẫu'}],'sample.xlsx');const report=executiveReport(await snap(parsed.rows));assert.equal(report.sheets[1].rows[0]['Bác sĩ chỉ định'],'BS Mẫu');assert.equal(report.sheets[1].rows[0]['Tên gói dịch vụ'],'Gói mẫu');
});
