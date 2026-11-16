import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculationStatus} from '../src/features/reports/calculationStatus.mjs';
import {validate} from '../src/features/reports/core.mjs';
import {breastAggregate} from '../src/features/reports/breastRevenue.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/python-phase2-golden.json',import.meta.url)));
function run(rows,from='2026-11-01',to='2026-12-01',imports=[]){
 const state={rows,excluded:[],imports,serviceCalculation:fixture.config};
 const checked=validate(rows,fixture.catalog,{suspectedDuplicates:true});
 return calculationStatus(state,checked,breastAggregate(checked.valid,fixture.catalog,from,to,fixture.config));
}
test('Empty selected period still exposes available dates from valid ordering-VU data',()=>{
 const d=run(fixture.rows);assert.equal(d.valid,170);assert.equal(d.inPeriod,0);assert.deepEqual(d.availableRange,['2026-10-19','2026-10-25']);assert.equal(d.included,140);assert.equal(d.outside,30);
});
test('Conflicting source groups are counted as blocked and cannot supply available periods',()=>{
 const row=fixture.rows.find(r=>r.status==='HOANTHANH');
 const d=run([row,{...row,unit_price_vnd:row.unit_price_vnd+1}]);
 assert.equal(d.blocked,2);assert.equal(d.valid,0);assert.equal(d.inPeriod,0);assert.equal(d.availableRange,null);assert.ok(d.reasons.some(([r,n])=>r.includes('Trùng mã')&&n===2));
});
test('Reference tables never imply completed service data or a calculable period',()=>{
 const d=run([],undefined,undefined,[{referenceTables:[{rows:[{total:100},{total:200}]}]}]);
 assert.equal(d.referenceRows,2);assert.equal(d.source,0);assert.equal(d.availableRange,null);assert.equal(d.inPeriod,0);
});
test('Unconfirmed department rows are visible as pending and never offered as calculable dates',()=>{
 const row={...fixture.rows.find(r=>r.status==='HOANTHANH'),ordering_dept:'Đơn vị chưa xác minh'};
 const d=run([row]);assert.equal(d.pending,1);assert.equal(d.included,0);assert.equal(d.availableRange,null);
});
