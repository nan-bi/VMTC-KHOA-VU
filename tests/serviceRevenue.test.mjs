import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULT_SERVICE_KINDS,revenueCalculation,serviceCalculation,serviceRevenueSnapshot,validateRates} from '../src/features/reports/serviceCalculation.mjs';
const demo=JSON.parse(fs.readFileSync(new URL('../src/data/service-demo.json',import.meta.url)));
const config={packageTypes:demo.packageTypes,serviceKinds:DEFAULT_SERVICE_KINDS};
test('Demo revenue is price times performed quantity, separately for four families and each package',()=>{
 const r=serviceCalculation(demo.rows,config).revenue;
 assert.equal(r.knownRevenue,63000000);assert.equal(r.missingQty,0);
 assert.deepEqual(r.totals.map(t=>t.knownRevenue),[16100000,21000000,20200000,5700000]);
 assert.equal(r.lines.reduce((n,l)=>n+l.revenue,0),r.knownRevenue);
 for(const line of r.lines)assert.equal(line.revenue,line.qty*line.price);
});
test('Configured retail, SKTQ and two combo rates stay distinct and do not add source allocation twice',()=>{
 const updated={...config,rates:{'SYN-DV008':{RETAIL:600000,SKTQ:210000,SLUT1:310000,SLUT2:260000}}};
 const r=serviceCalculation(demo.rows,updated).revenue;
 assert.equal(r.totals.find(r=>r.kind==='US').knownRevenue,22400000);assert.equal(r.knownRevenue,64400000);
 assert.equal(r.lines.filter(r=>r.kind==='US').length,4);
 assert.ok(r.lines.filter(r=>r.kind==='US').every(r=>r.basis==='Đơn giá cấu hình'));
});
test('Source allocation is line total, not unit price; missing or unresolved packages never use retail price',()=>{
 const row=demo.rows.find(r=>r.price_mode==='TRONGGOI'&&r.service_code==='SYN-DV008');
 const r=revenueCalculation([{...row,completed_qty:3,package_allocation_vnd:600000}],config);assert.equal(r.knownRevenue,600000);assert.equal(r.lines[0].price,200000);
 const missing=revenueCalculation([{...row,package_allocation_vnd:null}],config);assert.equal(missing.knownRevenue,0);assert.equal(missing.missingQty,1);assert.equal(missing.lines[0].revenue,null);
 const unknown=revenueCalculation([row],{serviceKinds:DEFAULT_SERVICE_KINDS});assert.equal(unknown.missingRecords,1);assert.equal(unknown.lines[0].type,'UNKNOWN');assert.equal(unknown.lines[0].price,null);
});
test('Mixed source prices are separate products; fractional amounts round per source row before aggregation',()=>{
 const row=demo.rows.find(r=>r.service_code==='SYN-DV008'&&r.price_mode==='MUALE');
 const mixed=revenueCalculation([row,{...row,unit_price_vnd:600000}],config);assert.equal(mixed.lines.length,2);assert.equal(mixed.knownRevenue,1150000);
 const fractions=revenueCalculation([{...row,completed_qty:.333333,unit_price_vnd:1},{...row,completed_qty:.333333,unit_price_vnd:1}],config);assert.equal(fractions.knownRevenue,0);
 const noninteger=revenueCalculation([{...row,price_mode:'TRONGGOI',package_id:'SIM-SKTQ-2026',completed_qty:3,package_allocation_vnd:100}],config);assert.equal(noninteger.missingQty,3);
});
test('Cancelled, uncompleted and out-of-snapshot rows are excluded; zero price is explicit free service',()=>{
 const row=demo.rows[0];assert.equal(revenueCalculation([{...row,status:'HUY'},{...row,status:'CHOTHUCHIEN'},{...row,in_snapshot:0}],config).knownRevenue,0);
 const free=revenueCalculation([row],{...config,rates:{[row.service_code]:{RETAIL:0}}});assert.equal(free.lines[0].revenue,0);assert.equal(free.missingRecords,0);
});
test('Snapshot freezes rates and revenue; invalid rates and overflow do not silently become zero',()=>{
 const snapshot=serviceRevenueSnapshot(demo.rows,config,'VU');const changed=structuredClone(config);changed.rates={'SYN-DV008':{RETAIL:1}};assert.equal(snapshot.knownRevenue,63000000);
 assert.notEqual(serviceRevenueSnapshot(demo.rows,changed,'VU').knownRevenue,snapshot.knownRevenue);assert.equal(snapshot.configuration.rates,undefined);
 for(const rates of [{x:{UNKNOWN:1}},{x:{RETAIL:-1}},{x:{RETAIL:1.2}},[],{x:{RETAIL:Infinity}}])assert.throws(()=>validateRates(rates));
 const overflow={...config,rates:{'SYN-DV008':{RETAIL:Number.MAX_SAFE_INTEGER}}};assert.match(serviceCalculation(demo.rows,overflow).revenue.error,/giới hạn/);assert.throws(()=>serviceRevenueSnapshot(demo.rows,overflow),/giới hạn/);
});
