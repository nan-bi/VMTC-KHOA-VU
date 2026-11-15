import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareRevenue,calculationInput,runPythonRevenue} from '../backend/python-revenue.mjs';
import {DEFAULT_SERVICE_KINDS,revenueCalculation,selectRevenueRows} from '../src/features/reports/serviceCalculation.mjs';
import {createBackend} from '../backend/server.mjs';
import {createUser} from '../backend/auth.mjs';
const demo=JSON.parse(readFileSync(new URL('../src/data/service-demo.json',import.meta.url)));
const config={packageTypes:demo.packageTypes,serviceKinds:DEFAULT_SERVICE_KINDS};
const retail=demo.rows.find(r=>r.service_code==='SYN-DV008'&&r.price_mode==='MUALE');
const packaged=demo.rows.find(r=>r.service_code==='SYN-DV008'&&r.price_mode==='TRONGGOI');

test('Python and JavaScript match full grouped output on combo, allocation and numeric edge cases',async t=>{
 const cases=[
  ['four service families and all combo prices',demo.rows,config],
  ['empty source',[],config],
  ['configured prices per package',demo.rows,{...config,rates:{'SYN-DV008':{RETAIL:600000,SKTQ:210000,SLUT1:310000,SLUT2:260000}}}],
  ['missing allocation',[{...packaged,package_allocation_vnd:null}],config],
  ['unknown package',[packaged],{}],
  ['allocation is total for three units',[{...packaged,completed_qty:3,package_allocation_vnd:600000}],config],
  ['allocation cannot produce integer unit price',[{...packaged,completed_qty:3,package_allocation_vnd:100}],config],
  ['mixed unit prices',[retail,{...retail,unit_price_vnd:600000}],config],
  ['round after grouping',[{...retail,completed_qty:.333333,unit_price_vnd:1},{...retail,completed_qty:.333333,unit_price_vnd:1}],config],
  ['half-up rounding',[{...retail,completed_qty:.5,unit_price_vnd:1}],config],
  ['six decimals',[{...retail,completed_qty:.000001,unit_price_vnd:1000000}],config],
  ['numeric string quantities',[{...retail,completed_qty:'1.250000',unit_price_vnd:'100'}],config],
  ['free service',[retail],{...config,rates:{'SYN-DV008':{RETAIL:0}}}],
  ['zero quantity',[{...retail,completed_qty:0}],config],
  ['cancelled and unfinished',[{...retail,status:'HUY'},{...retail,status:'CHOTHUCHIEN'},{...retail,in_snapshot:0}],config],
  ['XQ is not a SLUT1 component',[{...packaged,service_code:'SYN-DV005',package_id:'TEST-SLUT1'}],{...config,packageTypes:{'TEST-SLUT1':'SLUT1'}}],
  ['other services remain in revenue',[{...retail,service_code:'TEST-OTHER'}],config],
  ['maximum safe integer',[{...retail,completed_qty:1,unit_price_vnd:Number.MAX_SAFE_INTEGER}],config],
 ];
 for(const [name,rows,cfg] of cases)await t.test(name,async()=>{const result=await compareRevenue(rows,cfg);assert.equal(result.match,true);assert.deepEqual(result.python,result.javascript);});
});
test('Python exact arithmetic rejects unsafe totals and invalid quantities',async()=>{
 for(const rows of [[{...retail,completed_qty:2,unit_price_vnd:Number.MAX_SAFE_INTEGER}],[{...retail,completed_qty:-1}],[{...retail,completed_qty:'0.0000001'}]]){
  assert.throws(()=>revenueCalculation(rows,config));const py=calculationInput(rows,config);await assert.rejects(runPythonRevenue(py),e=>e.status===400);
 }
});
test('Comparison payload strips identities, file metadata and learned examples',()=>{
 const payload=calculationInput([{...retail,patient_name:'DO NOT TRANSFER',phone:'PRIVATE',source_file:'PRIVATE'}],{...config,routingExamples:[{reason:'PRIVATE'}]});
 const serialized=JSON.stringify(payload);assert.ok(!serialized.includes('PRIVATE'));assert.ok(!serialized.includes('DO NOT TRANSFER'));assert.ok(!Object.hasOwn(payload.rows[0],'patient_id'));
 assert.throws(()=>calculationInput(null,config));assert.throws(()=>calculationInput([retail],{rates:[]}));assert.throws(()=>calculationInput([retail],{serviceKinds:{x:'BAD'}}));
});
test('Scope selection still includes VU orders outbound, excludes inbound and unresolved labels',()=>{
 const rows=[{...retail,ordering_dept:'VU',performing_dept:'CDHA'},{...retail,ordering_dept:'KSKTQ',performing_dept:'VU'},{...retail,ordering_dept:'UNKNOWN',performing_dept:'VU'}];
 assert.deepEqual(selectRevenueRows(rows,config,'ORDERING_VU'),[rows[0]]);
});
test('Unavailable Python gives a visible error without changing the JavaScript result',async()=>{
 const before=revenueCalculation([retail],config);await assert.rejects(compareRevenue([retail],config,{python:'vinmec-python-does-not-exist'}),e=>e.status===503);
 assert.deepEqual(revenueCalculation([retail],config),before);
});
test('Comparison API requires session/CSRF and does not mutate the workspace',async()=>{
 const app=await createBackend({databasePath:':memory:'});createUser(app.db,{username:'compare-test',password:'Only-For-Local-Test-123',role:'viewer'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+app.server.address().port;
 const post=(path,body,headers={})=>fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 try{
  assert.equal((await post('/api/calculation/compare',{rows:[retail],config})).status,401);
  const login=await post('/api/auth/login',{username:'compare-test',password:'Only-For-Local-Test-123'});const session=await login.json(),cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/api/calculation/compare',{rows:[retail],config},{Cookie:cookie})).status,403);
  const auth={Cookie:cookie,'X-CSRF-Token':session.csrf};
  const before=await (await fetch(origin+'/api/workspace',{headers:auth})).json();
  const response=await post('/api/calculation/compare',{rows:[retail],config},auth);assert.equal(response.status,200);assert.equal((await response.json()).match,true);
  assert.equal((await post('/api/calculation/compare',{rows:null},auth)).status,400);
  const after=await (await fetch(origin+'/api/workspace',{headers:auth})).json();assert.deepEqual(after,before);
 }finally{await app.close();}
});
