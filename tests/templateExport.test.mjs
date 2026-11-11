import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {templateReport,templateWorkbook,colName} from '../src/features/reports/templateExport.mjs';
const catalog=[{code:'US',group:'Siêu âm vú',name:'Siêu âm'},{code:'LAB',group:'Xét nghiệm hỗ trợ',name:'Xét nghiệm'}];
const row=(id='ORD-1',price=100)=>({order_id:id,patient_id:'BN-01',visit_id:'VIS-01',service_code:'US',service_name:'Siêu âm & kiểm tra',quantity:1,completed_qty:1,unit_price_vnd:price,gross_order_vnd:price,completed_gross_vnd:price,completed_net_vnd:null,discount_known:0,status:'HOANTHANH',in_snapshot:1,price_mode:'MUALE',ordered_at:'2026-10-23T08:00:00+07:00',completed_at:'2026-10-23T09:00:00+07:00',ordering_dept:'VU',performing_dept:'VU',source_file:'Mẫu & file.csv',source_sheet:'S',source_row:2,clinical_doctor:'BS BA',imaging_doctor:'BS TƯ'});
test('same code with two prices stays two lines; totals use source amounts and do not add sections',()=>{
 const r=templateReport({rows:[row(),row('ORD-2',200)],catalog});assert.equal(r.summary.service_price_rows,2);assert.equal(r.summary.gross,300);
 const t=r.sheets[0].rows[r.mainTotalRow-1];assert.equal(t[5].value,300);assert.equal(t[5].formula,'SUM(F3:F4)');assert.equal(t[3].value,2);
 assert.equal(r.summary.missing_net,2);assert.equal(r.sheets[1].rows[1][10],null);
});
test('doctor columns expand beyond template defaults; missing doctors retained with counts',()=>{
 const rows=Array.from({length:9},(_,i)=>({...row('ORD-'+i),clinical_doctor:'BS KHÁC '+i,imaging_doctor:i?'BS ẢNH '+i:null}));
 const r=templateReport({rows,catalog}),s=r.sheets[0];assert.ok(s.widths.length>18);
 const headers=s.rows[1],values=s.rows[2];assert.equal(values[headers.indexOf('Chưa rõ BS CĐHA')],1);
 assert.equal(values.slice(6,6+15).filter(x=>typeof x==='number').reduce((s,n)=>s+n,0),9);
 for(let i=0;i<9;i++)assert.ok(headers.includes('BS KHÁC '+i));
});
test('duplicate / cancelled / invalid amount cannot reach template output',()=>{
 assert.throws(()=>templateReport({rows:[row(),row()],catalog}));
 assert.throws(()=>templateReport({rows:[{...row(),completed_gross_vnd:999}],catalog}));
 assert.throws(()=>templateReport({rows:[{...row(),status:'HUY',completed_qty:0,completed_gross_vnd:0}],catalog}));
});
test('full report follows all reference sections, detailed report respects passed filter',()=>{
 const a=templateReport({rows:[row()],catalog}),b=templateReport({rows:[row()],catalog,detail:true,meta:{filter:'Siêu âm'}});
 const labels=a.sheets[0].rows.map(r=>r[0]);for(const label of ['XÉT NGHIỆM MÁU','UPSALE KSKTQ','SIÊU ÂM TẦNG 4 VÀ TẦNG 7','DOANH THU VÀ CHI PHÍ DỊCH VỤ','SỐ LƯỢT KHÁM BÁC SĨ','CHUYÊN KHOA KHÁC','SỰ CỐ','BỆNH NHÂN THEO DÕI','ĐÀO TẠO','NỘI TRÚ'])assert.ok(labels.includes(label));
 assert.equal(b.sheets[0].name,'CHI_TIET_THEO_MAU');assert.ok(!b.sheets[0].rows.some(r=>r[0]==='ĐÀO TẠO'));assert.equal(b.sheets[1].rows.length,2);
});
test('lab not automatically blood, unknown PR and age stay blank, daily distinct visits',()=>{
 const report=templateReport({rows:[row(),row('ORD-2'),{...row('ORD-3'),service_code:'LAB'}],catalog}),s=report.sheets[0];
 const labTitle=s.rows.findIndex(r=>r[0]==='XÉT NGHIỆM MÁU');assert.match(s.rows[labTitle+3][0],/Chưa có/);
 const daily=s.rows.findIndex(r=>r[0]==='SIÊU ÂM TẦNG 4 VÀ TẦNG 7');assert.deepEqual(s.rows[daily+3].slice(2,9),[1,null,null,null,null,0,null]);
});
test('xlsx opens with merged two-tier headers, styles, cached SUM, escaped strings and evidence',async()=>{
 const {bytes,report}=await templateWorkbook({rows:[row()],catalog});const b=XLSX.read(bytes,{type:'array',cellStyles:true});assert.deepEqual(b.SheetNames,['DATA_KHOAVU','CHI_TIET_NGUON','THONG_TIN']);
 const s=b.Sheets.DATA_KHOAVU;assert.equal(s.B3.v,'Siêu âm & kiểm tra');assert.equal(s['F'+report.mainTotalRow].v,100);assert.equal(s['F'+report.mainTotalRow].f,'SUM(F3:F3)');assert.ok(s['!merges'].length>=8);
 assert.equal(b.Sheets.CHI_TIET_NGUON.Q2.v,'Mẫu & file.csv');
 const z=await JSZip.loadAsync(bytes),styles=await z.file('xl/styles.xml').async('string');assert.match(styles,/FAC090/);assert.match(styles,/#,##0.######/);assert.match(await z.file('xl/worksheets/sheet1.xml').async('string'),/state="frozen"/);
});
test('empty data does not invent activity; fractional quantity remains numeric',async()=>{
 const empty=templateReport({rows:[],catalog,detail:true});assert.equal(empty.summary.gross,0);assert.equal(empty.sheets[0].rows[empty.mainTotalRow-1][5].value,0);
 const a={...row(),quantity:0.5,completed_qty:0.5,gross_order_vnd:50,completed_gross_vnd:50};const {bytes}=await templateWorkbook({rows:[a],catalog});assert.equal(XLSX.read(bytes,{type:'array'}).Sheets.DATA_KHOAVU.D3.v,0.5);assert.equal(colName(26),'AA');
});
