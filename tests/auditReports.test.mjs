import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate,aggregate,normalizeDate} from '../src/features/reports/core.mjs';
import {normalizeIncomingRows} from '../src/features/reports/importRows.mjs';
import {grossAmount,businessDate,isTimestamp,sumMoney} from '../src/shared/dataRules.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng']}));
const row=()=>structuredClone(seed.CANONICAL[0]);
const check=changes=>validate([{...row(),...changes}],catalog);
test('Không chấp nhận ngày không tồn tại, ngày mơ hồ hoặc giờ thiếu múi giờ',()=>{
 for(const value of ['2026-02-30','2026-13-01','03/04/2026','2026-10-23T10:00:00','2026-10-23T24:00:00Z','2026-10-23T10:00:00+14:30'])assert.equal(check({ordered_at:value}).valid.length,0,value);
 assert.equal(isTimestamp('2024-02-29T10:20:30+07:00'),true);
});
test('Ranh giới kỳ theo giờ Việt Nam; Excel serial là giờ địa phương',()=>{
 const r=row();r.ordered_at='2026-10-22T17:00:00Z';r.completed_at='2026-10-23T17:00:00Z';
 assert.equal(businessDate(r.ordered_at),'2026-10-23');assert.equal(businessDate(r.completed_at),'2026-10-24');
 assert.equal(aggregate([r],catalog,'2026-10-23','2026-10-24').qty,0);
 assert.equal(aggregate([r],catalog,'2026-10-24','2026-10-25').qty,1);
 assert.equal(normalizeDate(46318),'2026-10-23T00:00:00.000+07:00');
});
test('Không đổi thiếu/blank thành 0; không nhận ID số đã mất số 0 đầu',()=>{
 for(const c of [{unit_price_vnd:''},{quantity:''},{in_snapshot:null},{discount_known:null},{patient_id:1},{visit_id:' '},{order_id:' X '}])assert.equal(check(c).valid.length,0,JSON.stringify(c));
});
test('Đối chiếu gross, net, số lượng và trình tự thời gian từng dòng',()=>{
 for(const c of [{completed_gross_vnd:1},{completed_gross_vnd:NaN},{completed_net_vnd:1},{completed_qty:2},{completed_at:'2026-07-04T10:00:00Z'},{discount_known:0},{status:'HUY'}])assert.equal(check(c).valid.length,0,JSON.stringify(c));
});
test('Không sửa ngầm số tiền nguồn khi nhập và không điền sản lượng còn thiếu',()=>{
 const r=row();r.completed_gross_vnd=1;const normalized=normalizeIncomingRows([r],'new.xlsx');assert.equal(normalized[0].completed_gross_vnd,1);assert.equal(validate(normalized,catalog).valid.length,0);
 delete r.completed_qty;delete r.completed_gross_vnd;assert.equal(validate(normalizeIncomingRows([r],'missing.xlsx'),catalog).valid.length,0);
});
test('Cùng bản ghi trong file đổi tên hoặc dòng khác không cộng lại',()=>{
 const r=row(),other={...r,source_file:'different.xlsx',source_row:999,source_file_hash:'new',ingested_at:'2026-07-08T10:00:00Z'};
 const result=validate([r,other],catalog);assert.equal(result.valid.length,1);assert.equal(result.duplicates.length,1);
});
test('Xung đột cùng mã cách ly tất cả phiên bản và không phụ thuộc thứ tự',()=>{
 const r=row(),other={...r,patient_id:'OTHER'};
 for(const rows of [[r,other],[other,r]]){const result=validate(rows,catalog);assert.equal(result.valid.length,0);assert.equal(result.issues.length,2);}
});
test('Một lượt không được trộn nhiều khách dù khác mã chỉ định',()=>{
 const r=row(),other={...r,order_id:'OTHER-ORDER',patient_id:'OTHER-PATIENT'};
 const result=validate([r,other],catalog);assert.equal(result.valid.length,0);assert.ok(result.issues.every(i=>i.reasons.some(s=>s.includes('nhiều bệnh nhân'))));
});
test('Tiền tính bằng số nguyên chính xác; làm tròn nửa lên; tràn số bị chặn',()=>{
 assert.equal(grossAmount('0.1',100005),10001);assert.equal(grossAmount('0.333333',3000000),999999);
 assert.equal(sumMoney([9007199254740990,1]),9007199254740991);assert.throws(()=>sumMoney([9007199254740991,1]));
});
test('Phân bổ gói sai hoặc không có mã gói không được cộng',()=>{
 assert.equal(check({price_mode:'TRONGGOI',package_id:null,package_allocation_vnd:450000}).valid.length,0);
 assert.equal(check({price_mode:'TRONGGOI',package_id:'PKG',package_allocation_vnd:300000}).valid.length,0);
});
test('Tổng từng ngày khớp toàn kỳ cho đủ 6 chỉ tiêu và 26 tuần chuẩn',()=>{
 for(const ref of seed.THAM_CHIEU_TUAN){
  let qty=0,gross=0,net=0,missing=0;const patients=new Set(),visits=new Set();
  for(let day=ref.week_start;day<ref.week_end_exclusive;){const end=new Date(Date.parse(day)+86400000).toISOString().slice(0,10);const s=aggregate(seed.CANONICAL,catalog,day,end);qty+=s.qty;gross+=s.gross;net+=s.net;missing+=s.missing;s.ordered.forEach(r=>{patients.add(r.patient_id);visits.add(r.visit_id)});day=end;}
  assert.deepEqual([qty,gross,net,missing,patients.size,visits.size],[ref.completed_qty,ref.completed_gross,ref.known_completed_net,ref.missing_net,ref.patients,ref.visits]);
 }
});
