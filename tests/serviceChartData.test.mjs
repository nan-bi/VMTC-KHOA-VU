import test from 'node:test';
import assert from 'node:assert/strict';
import {revenueChartRows} from '../src/features/reports/serviceChartData.mjs';
test('Revenue chart groups service codes across tariffs without counting package totals twice',()=>{
 const rows=revenueChartRows([{code:'SA',name:'Siêu âm',type:'RETAIL',qty:2,revenue:1000,recordCount:2},{code:'SA',name:'Siêu âm',type:'RETAIL',qty:1,revenue:700,recordCount:1},{code:'SA',name:'Siêu âm',type:'SLUT1',qty:1,revenue:300,recordCount:1},{code:'XQ',name:'X-quang',type:'SKTQ',qty:1,revenue:600,recordCount:1}]);
 assert.equal(rows.length,2);assert.equal(rows[0].value,2000);assert.deepEqual(rows[0].segments,[{key:'RETAIL',value:1700},{key:'SLUT1',value:300}]);assert.equal(rows.reduce((n,r)=>n+r.value,0),2600);
});
test('Revenue chart distinguishes missing amounts from known zero and preserves partial totals',()=>{
 const rows=revenueChartRows([{code:'M',name:'Thiếu',type:'UNKNOWN',qty:3,revenue:null,recordCount:2},{code:'F',name:'Miễn phí',type:'RETAIL',qty:1,revenue:0,recordCount:1},{code:'P',name:'Một phần',type:'RETAIL',qty:1,revenue:100,recordCount:1},{code:'P',name:'Một phần',type:'SKTQ',qty:2,revenue:null,recordCount:1}]);
 assert.equal(rows.find(r=>r.key==='M').value,null);assert.equal(rows.find(r=>r.key==='M').missingQty,3);assert.equal(rows.find(r=>r.key==='F').value,0);assert.equal(rows.find(r=>r.key==='F').missingRecords,0);assert.equal(rows.find(r=>r.key==='P').value,100);assert.equal(rows.find(r=>r.key==='P').missingRecords,1);assert.deepEqual(revenueChartRows([]),[]);
});
