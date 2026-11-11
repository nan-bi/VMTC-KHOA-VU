import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyze,classify,RULES_VERSION} from '../src/features/intelligence/routing.mjs';
import {exportDataset,validatePrediction} from '../src/features/intelligence/dataset.mjs';
import {adaptRows,REQUIRED} from '../src/features/intelligence/importSchema.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],group:r['Nhóm']}));
const base=()=>({...seed.CANONICAL[0],order_id:'ORDER-01',patient_id:'PATIENT-01',visit_id:'VISIT-01',ordered_at:'2026-10-23T09:00:00+07:00',completed_at:'2026-10-23T10:00:00+07:00',in_snapshot:1});
const run=(rows,options={})=>analyze(rows,catalog,{from:'2026-10-23',toExclusive:'2026-10-24',...options});
test('Bốn luồng theo khoa thực tế; tên dịch vụ không quyết định địa bàn',()=>{
 for(const [ordering_dept,performing_dept,expected] of [['VU','VU','VU_INTERNAL'],['VU','CDHA','VU_OUTBOUND'],['KSKTQ','VU','VU_INBOUND'],['NOI','CDHA','EXTERNAL_UNRELATED']])assert.equal(classify({...base(),ordering_dept,performing_dept},catalog).routing_category,expected);
 const a=run([{...base(),ordering_dept:'NOI',performing_dept:'CDHA'}]);assert.equal(a.routing.find(r=>r.route==='EXTERNAL_UNRELATED').records,1);
});
test('Khoa thiếu và phòng chưa ánh xạ không bị giấu vào nhóm ngoài phạm vi',()=>{
 for(const changed of [{ordering_dept:null},{performing_dept:'UNKNOWN'},{performing_room:'UNKNOWN'},{performing_dept:'CDHA',performing_room:'us-1'}]){const a=run([{...base(),...changed}]);assert.equal(a.records[0].routing_category,null);assert.equal(a.related,0);}
 assert.equal(classify({...base(),performing_room:'CT-VU-02'},catalog,'prompt-kb').routing_category,'VU_INTERNAL');assert.equal(classify({...base(),performing_room:'CT-VU-02'},catalog,'local-12').routing_category,null);
});
test('Tài chính có hai góc nhìn chồng lấp, tiền gói và tiền lẻ tách riêng',()=>{
 const a=base(),b={...base(),order_id:'ORDER-02',price_mode:'TRONGGOI',package_id:'PKG',package_allocation_vnd:100000,completed_net_vnd:100000};
 const s=run([a,b]);assert.equal(s.finance.ordered.known_vnd,a.gross_order_vnd*2);assert.equal(s.finance.performed.gross_vnd,a.completed_gross_vnd*2);assert.equal(s.finance.buckets.find(b=>b.mode==='TRONGGOI').performed.known_net_vnd,100000);
});
test('Không suy ra giảm giá, không dùng giá danh mục điền tổng chỉ định thiếu',()=>{
 const a={...base(),gross_order_vnd:null,discount_known:0,completed_net_vnd:null};const s=run([a]);assert.equal(s.finance.ordered.known_vnd,0);assert.equal(s.finance.ordered.missing_records,1);assert.equal(s.finance.performed.missing_net_records,1);
});
test('Hủy, hoàn tiền có sản lượng và trùng xung đột không được cộng',()=>{
 const a=base();for(const status of ['HUY','HOANTIEN']){const s=run([{...a,status}]);assert.equal(s.kpis.performed_services,0);assert.equal(s.finance.ordered.known_vnd,0);}
 assert.equal(run([a,{...a,quantity:2}]).records.filter(r=>r.eligible).length,0);assert.equal(run([a,{...a,source_file:'other.csv'}]).duplicates,1);
});
test('Referral đếm lượt duy nhất, mẫu số rỗng và BI-RADS thiếu không thành 0%',()=>{
 const mri=catalog.find(c=>c.group==='MRI vú');const a=base(),b={...a,order_id:'ORDER-02',service_code:mri.code,performing_dept:'CDHA'},c={...b,order_id:'ORDER-03'};
 const s=run([a,b,c]);assert.deepEqual(s.kpis.referral,{numerator:1,denominator:1,percent:100});assert.equal(s.kpis.birads.percent,null);assert.equal(run([b]).kpis.referral.percent,null);
 const pathology={...b,service_code:catalog.find(c=>c.group==='Giải phẫu bệnh').code};assert.equal(run([a,pathology]).kpis.referral.numerator,0);
});
test('Ngày hoàn thành và ngày chỉ định tách theo +07, ngày cuối gồm đủ',()=>{
 const a={...base(),ordered_at:'2026-10-22T16:59:00Z',completed_at:'2026-10-22T17:00:00Z'};const s=run([a]);assert.equal(s.finance.ordered.known_vnd,0);assert.equal(s.finance.performed.gross_vnd,a.completed_gross_vnd);
});
test('Nhập giữ nguyên tiền thiếu, cột mơ hồ và cột thiếu đều bị chặn',()=>{
 const r=base();delete r.completed_gross_vnd;delete r.completed_net_vnd;const a=adaptRows([r],'f.csv');assert.equal(a.rows[0].completed_gross_vnd,undefined);assert.equal(a.rows[0].source_row,2);
 assert.throws(()=>adaptRows([{...r,'Mã DV':r.service_code}],'ambiguous.csv'));for(const key of REQUIRED){const x={...r};delete x[key];assert.throws(()=>adaptRows([x],'missing.csv'));}
});
test('Nhãn phải khớp dữ liệu, profile và rules version; mặc định không xuất nhãn máy',async()=>{
 const a=run([base()]),r=a.records[0];assert.equal((await exportDataset(a,{})).examples.length,0);
 const label={fingerprint:r.fingerprint,profile:a.profile,rulesVersion:RULES_VERSION,label:'VU_INTERNAL',reviewer:'R1',reason:'Đã kiểm tra nguồn'};
 assert.equal((await exportDataset(a,{[r.key]:label})).examples.length,1);
 for(const changes of [{fingerprint:'stale'},{profile:'prompt-kb'},{rulesVersion:'OLD'}])assert.equal((await exportDataset(a,{[r.key]:{...label,...changes}})).examples.length,0);
});
test('Dữ liệu train không lộ tên, điện thoại, mã gốc, tiền hoặc ghi chú; cùng khách một split',async()=>{
 const rows=Array.from({length:60},(_,i)=>({...base(),order_id:'ORDER-'+i,visit_id:'VISIT-'+i,patient_id:'PERSON-'+Math.floor(i/2),patient_name:'Tên bí mật',phone:'0987654321',note:'Nội dung bí mật'}));
 // Distinct names/phone avoid intentional identity collision flag while testing allowlist.
 rows.forEach((r,i)=>{r.phone='PHONE-'+Math.floor(i/2);r.patient_name='Tên bí mật '+Math.floor(i/2)});
 const a=run(rows),ds=await exportDataset(a,{}, {includeSyntheticSilver:true});assert.equal(ds.examples.length,60);
 const text=JSON.stringify(ds);for(const sensitive of ['PERSON-','ORDER-','Tên bí mật','PHONE-','Nội dung bí mật','unit_price_vnd'])assert.ok(!text.includes(sensitive),sensitive);
 const groups=new Map();for(const r of ds.examples){if(groups.has(r.patient_group))assert.equal(groups.get(r.patient_group),r.split);groups.set(r.patient_group,r.split);}assert.equal(groups.size,30);
 assert.ok(ds.examples.every(r=>r.label_source==='synthetic_rule_silver'));
});
test('Trùng danh tính chỉ cảnh báo, không gộp và không xuất train',async()=>{
 const a=run([{...base(),patient_name:'Mẫu',phone:'0123'},{...base(),order_id:'OTHER',visit_id:'OTHER',patient_id:'OTHER',patient_name:'Mẫu',phone:'0123'}]);assert.equal(a.records[0].warnings.some(w=>w.code==='IDENTITY_REVIEW'),true);assert.equal((await exportDataset(a,{}, {includeSyntheticSilver:true})).examples.length,0);
});
test('Đầu ra model sai schema, nhãn lạ hoặc confidence giả bị từ chối',()=>{
 for(const p of [{},{routing_category:'OTHER',reason:'x',confidence:1},{routing_category:'VU_INTERNAL',reason:'x',confidence:NaN},{routing_category:'VU_INTERNAL',reason:'',confidence:.9}])assert.throws(()=>validatePrediction(p));
 assert.equal(validatePrediction({routing_category:'VU_INTERNAL',reason:'Theo nguồn',confidence:.9}).confidence,.9);
});
