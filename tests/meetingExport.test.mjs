import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import {aggregate,validate} from '../src/features/reports/core.mjs';
import {serviceRevenueSnapshot,DEFAULT_SERVICE_KINDS} from '../src/features/reports/serviceCalculation.mjs';
import {financeRoutes} from '../src/features/reports/reportScope.mjs';
import {meetingSlides,meetingPresentation} from '../src/features/reports/meetingExport.mjs';
import {templateWorkbook} from '../src/features/reports/templateExport.mjs';
const demo=JSON.parse(fs.readFileSync(new URL('../src/data/service-demo.json',import.meta.url)));
const seed=JSON.parse(fs.readFileSync(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],name:r['Tên đơn vị dịch vụ mô phỏng'],group:r['Nhóm']}));
const rows=validate(demo.rows,catalog).valid;
const stats=aggregate(rows,catalog,'2026-10-19','2026-10-26');
const report={id:'SN-MEETING-TEST',version:1,status:'approved',week:'2026-10-19',end:'2026-10-26',createdAt:'2026-11-12',stats,serviceRevenue:serviceRevenueSnapshot(stats.completed,{packageTypes:demo.packageTypes,serviceKinds:DEFAULT_SERVICE_KINDS},'VU'),narrative:'Nhận xét do người lập kiểm tra.',excludedCount:0};
test('Financial filters partition completed rows, unknown departments never become external',()=>{
 const sample=rows[0],data=[['VU','VU'],['VU','CDHA'],['KSKTQ','VU'],['CDHA','XETNGHIEM'],['unknown','VU']].map(([ordering_dept,performing_dept])=>({...sample,ordering_dept,performing_dept}));
 const result=financeRoutes(data);assert.deepEqual(result.map(r=>r.rows.length),[1,1,1,1,1]);assert.equal(result.reduce((n,r)=>n+r.rows.length,0),data.length);
});
test('Meeting PowerPoint and Excel retain the same frozen tariff revenue and source totals',async()=>{
 const frozen=structuredClone(report);const slides=await meetingSlides(frozen);assert.equal(slides[0].rows[1][1],new Intl.NumberFormat('vi-VN').format(stats.gross));
 assert.ok(slides.some(s=>s.note.includes('63.000.000')));assert.ok(!JSON.stringify(slides).includes('BI-RADS'));
 const {bytes}=await templateWorkbook({rows:frozen.stats.completed,catalog,serviceRevenue:frozen.serviceRevenue,meta:{id:frozen.id,from:frozen.week,toExclusive:frozen.end}});
 const book=XLSX.read(bytes,{type:'array'});assert.ok(book.SheetNames.includes('KIEM_LOI'));const pricing=XLSX.utils.sheet_to_json(book.Sheets.GIA_X_SO_LUONG,{header:1});assert.equal(pricing.find(r=>r[0]==='TỔNG PHẦN ĐỦ GIÁ')[4],63000000);
 const ppt=await meetingPresentation(frozen),zip=await JSZip.loadAsync(await ppt.write({outputType:'arraybuffer'}));const content=(await Promise.all(Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p)).map(p=>zip.file(p).async('string')))).join('');assert.ok(content.includes('SN-MEETING-TEST'));assert.ok(content.includes('63.000.000'));assert.ok(content.includes('CHỜ')||content.includes('Chờ')||content.includes('chờ'));assert.deepEqual(frozen,report);
 await assert.rejects(()=>meetingSlides({...report,status:'draft'}),/duyệt/);
});
