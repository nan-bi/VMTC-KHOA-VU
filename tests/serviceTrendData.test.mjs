import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceTrendData} from '../src/features/reports/serviceTrendData.mjs';
const catalog=[{code:'SA',name:'Siêu âm'},{code:'XQ',name:'X-quang'},{code:'K',name:'Khám'}];
const row=(service_code,completed_at,completed_qty,patch={})=>({service_code,completed_at,completed_qty,status:'HOANTHANH',in_snapshot:1,...patch});
test('Service trends use hospital dates, exact service quantities and include every calendar day/catalog service',()=>{
 const data=serviceTrendData([row('SA','2026-10-19',.1),row('SA','2026-10-19',.2),row('SA','2026-10-19T18:00:00Z',2),row('XQ','2026-10-20',3),row('XQ','2026-10-20',99,{status:'HUY'}),row('SA','2026-10-20',99,{in_snapshot:0}),row('SA','2026-10-18',99),row('SA','2026-10-22',99),row('UNKNOWN','2026-10-20',99)],catalog,'2026-10-19','2026-10-22');
 assert.deepEqual(data.dates,['2026-10-19','2026-10-20','2026-10-21']);assert.equal(data.series.length,3);
 assert.deepEqual(data.series[0].points.map(point=>point.qty),[.3,2,0]);assert.equal(data.series[0].total,2.3);assert.equal(data.series[0].points[1].rows.length,1);
 assert.deepEqual(data.series[1].points.map(point=>point.qty),[0,3,0]);assert.equal(data.series[2].total,0);assert.deepEqual(data.series[2].points.map(point=>point.qty),[0,0,0]);
});
test('Trend dates handle one day, leap dates, no records and invalid periods without adding dates outside the period',()=>{
 assert.deepEqual(serviceTrendData([],catalog,'2024-02-28','2024-03-02').dates,['2024-02-28','2024-02-29','2024-03-01']);
 const single=serviceTrendData([],catalog,'2026-10-25','2026-10-26');assert.equal(single.dates.length,1);assert.equal(single.series.length,3);assert.equal(single.series[0].points[0].qty,0);
 assert.deepEqual(serviceTrendData([],catalog,'2026-10-26','2026-10-25'),{dates:[],series:[]});assert.deepEqual(serviceTrendData([],catalog,'2026-02-30','2026-03-03'),{dates:[],series:[]});
});
