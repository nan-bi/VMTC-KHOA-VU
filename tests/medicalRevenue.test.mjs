import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {identityReview,patientGroupKey,identityProfile} from '../src/shared/patientIdentity.mjs';
import {runPythonData} from '../backend/python-data.mjs';
import {revenueCalculation,serviceCalculation,DEFAULT_SERVICE_KINDS} from '../src/features/reports/serviceCalculation.mjs';
import {validate} from '../src/features/reports/core.mjs';
const demo=JSON.parse(readFileSync(new URL('../src/data/service-demo.json',import.meta.url)));
const base={...demo.rows.find(r=>r.price_mode==='MUALE'),patient_id:'TEST-PID',patient_name:'Nguyễn Thị A',patient_dob:'1986-10-20',patient_age:40,ordered_at:'2026-10-25',completed_at:'2026-10-25',quantity:1,completed_qty:1,unit_price_vnd:100,completed_gross_vnd:100,completed_net_vnd:100,discount_known:1,discount_vnd:0,in_snapshot:1};
const row=(n,patch={})=>({...base,order_id:'TEST-'+n,visit_id:'VISIT-'+n,source_row:n+2,...patch});
const config={serviceKinds:DEFAULT_SERVICE_KINDS,packageTypes:demo.packageTypes};
test('PID alone never merges distinct names, DOB, incomplete identities or visits',async()=>{
 const cases=[
  [row(1),row(2,{patient_name:'Nguyễn Thị B'})],
  [row(1),row(2,{patient_dob:'1985-10-20',patient_age:41})],
  [row(1,{patient_dob:null}),row(2,{patient_dob:null})],
  [row(1),row(2,{patient_age:39})],
  [row(1),row(2,{patient_name:'Nguyen Thi A'})],
 ];
 for(const rows of cases){assert.notEqual(patientGroupKey(rows[0]),patientGroupKey(rows[1]));assert.equal(identityReview(rows).length,1);assert.deepEqual((await runPythonData('identity-review',{rows})).value,identityReview(rows));}
 const checked=validate(cases[0],[{code:base.service_code}],{suspectedDuplicates:true});assert.equal(checked.valid.length,2);assert.equal(checked.duplicates.length,0);assert.equal(revenueCalculation(checked.valid,config).knownRevenue,200);
});
test('Matching name, full DOB and age permit identity grouping without merging services',()=>{
 const a=row(1),b=row(2,{patient_name:' Nguyễn  Thị A ',patient_dob:'20/10/1986'});
 assert.equal(patientGroupKey(a),patientGroupKey(b));assert.deepEqual(identityReview([a,b]),[]);assert.equal(revenueCalculation([a,b],config).knownRevenue,200);
 assert.equal(identityProfile(row(1,{patient_age:39})).complete,false);
 assert.equal(identityProfile(row(1,{patient_dob:'1986-02-30'})).complete,false);
});
test('Partial DOB and year-of-birth cannot establish identity; age birthday is exact',()=>{
 assert.equal(identityProfile(row(1,{patient_dob:'1986'})).complete,false);
 assert.equal(identityProfile(row(1,{patient_dob:'1986-10-26',patient_age:39})).complete,true);
 assert.equal(identityProfile(row(1,{patient_dob:'1986-10-26',patient_age:40})).complete,false);
});
test('Each fractional service is rounded before summation in both engines',async()=>{
 const rows=[row(1,{completed_qty:'0.5',unit_price_vnd:1}),row(2,{completed_qty:'0.5',unit_price_vnd:1})];
 const js=revenueCalculation(rows,config),py=(await runPythonData('revenue',{rows,config})).value;
 assert.equal(js.knownRevenue,2);assert.deepEqual(py,js);
});
test('Combo components never bridge different people on same PID or missing DOB',async()=>{
 const rows=demo.rows.filter(r=>r.package_id==='SIM-SLUT1-2026').slice(0,2).map((r,i)=>({...r,patient_id:'P',visit_id:'V',patient_name:i?'B':'A',patient_dob:'1986-10-20',patient_age:40,ordered_at:'2026-10-25'}));
 const js=serviceCalculation(rows,config,'ALL');assert.equal(js.warnings.length,2);
 assert.deepEqual((await runPythonData('calculation',{rows,config,department:'ALL'})).value,js);
});
test('Finance audit retains cancellations, missing net and price changes in their correct scopes',async()=>{
 const rows=[row(1),row(2,{completed_net_vnd:null,discount_known:0}),row(3,{status:'HUY'}),row(4,{ordering_dept:'KSKTQ'})];
 const out=(await runPythonData('finance-review',{rows,config})).value;assert.equal(out.checks.length,1);assert.equal(out.checks[0].rows,2);assert.equal(out.checks[0].difference,null);assert.equal(out.checks[0].calculated,200);
 const changed=(await runPythonData('finance-review',{rows:[row(1)],config:{...config,rates:{[base.service_code]:{RETAIL:150}}}})).value;
 assert.equal(changed.checks[0].difference,50);
});
test('IQR flags an extreme price without changing revenue or mixing package prices',async()=>{
 const rows=[100,110,120,130,140,150,160,100000].map((price,i)=>row(i,{unit_price_vnd:price,completed_gross_vnd:price,completed_net_vnd:price}));
 const result=(await runPythonData('finance-review',{rows,config})).value;assert.equal(result.outliers.length,1);assert.equal(result.checks[0].calculated,100910);assert.equal(result.checks[0].difference,0);
});
test('Service model learns approved names, refuses conflicting labels and does not auto-change configuration',async()=>{
 const catalog=[{code:'US',name:'Siêu âm vú 2D',group:'Siêu âm vú'},{code:'XR',name:'X quang vú 3D',group:'X-quang vú'}];
 const cfg={serviceKinds:{US:'US',XR:'XR3'}},rows=[{service_code:'NEW',service_name:'Siêu âm vú 2D',patient_name:'Không dùng định danh để học'}];
 const out=(await runPythonData('service-suggestions',{rows,catalog,config:cfg})).value;assert.equal(out[0].kind,'US');assert.equal(out[0].group,'Siêu âm vú');assert.equal(cfg.serviceKinds.NEW,undefined);
 assert.deepEqual((await runPythonData('service-suggestions',{rows:[{service_code:'NEW',service_name:'zzzz'}],catalog,config:cfg})).value,[]);
 const conflict=[...catalog,{code:'AMB',name:'Siêu âm vú 2D',group:'Khác'}];
 assert.deepEqual((await runPythonData('service-suggestions',{rows,catalog:conflict,config:{serviceKinds:{...cfg.serviceKinds,AMB:'OTHER'}}})).value,[]);
});
test('Identity notes require explicit review reason and remain permission-checked configuration',async()=>{
 await assert.rejects(runPythonData('config',{config:{identityNotes:[{key:'P',note:'',status:'REVIEWED'}]}}));
 assert.equal((await runPythonData('config',{config:{identityNotes:[{key:'P',note:'Đã soát nguồn, giữ riêng hai hồ sơ',status:'REVIEWED'}]}})).value.valid,true);
});

test('Identical input rows without HIS order IDs retain distinct source keys for review',async()=>{
 const {utils,write}=await import('xlsx');const source=row(1);delete source.order_id;
 const book=utils.book_new();utils.book_append_sheet(book,utils.json_to_sheet([source,source]),'CANONICAL');
 const loaded=(await runPythonData('ingest',{name:'identity-check.xlsx',content:write(book,{type:'buffer',bookType:'xlsx'}).toString('base64')})).value;
 assert.equal(loaded.rows.length,2);assert.notEqual(loaded.rows[0].order_id,loaded.rows[1].order_id);
 const checked=validate(loaded.rows,[{code:base.service_code}],{suspectedDuplicates:true});assert.equal(checked.duplicates.length,0);assert.equal(checked.issues.length,2);
});
test('Confirmed service learning and identity notes persist through authenticated SQLite revisions',async()=>{
 const {createBackend}=await import('../backend/server.mjs');const {createUser}=await import('../backend/auth.mjs');
 const {emptyWorkspace}=await import('../src/features/reports/operationalState.mjs');const {saveCalculationConfig}=await import('../src/features/reports/serviceCalculation.mjs');
 const initial=emptyWorkspace();initial.rows=[row(1),row(2,{service_code:'NEW-US',service_name:'Siêu âm vú 2D'})];
 const app=await createBackend({databasePath:':memory:',initialState:initial,catalog:[{code:base.service_code,name:base.service_name,group:'Khám vú'}]});
 createUser(app.db,{username:'test-editor',password:'Test-Only-123456789',role:'editor'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+app.server.address().port;
 try{
  const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'test-editor',password:'Test-Only-123456789'})});const session=await login.json();
  const headers={Origin:origin,'Content-Type':'application/json',Cookie:login.headers.get('set-cookie').split(';')[0],'X-CSRF-Token':session.csrf};
  const state=await (await fetch(origin+'/api/workspace',{headers})).json();
  const nextConfig={packageTypes:{},serviceKinds:{...DEFAULT_SERVICE_KINDS,'NEW-US':'US'},additionalServices:[{code:'NEW-US',name:'Siêu âm vú 2D',group:'Siêu âm vú'}],identityNotes:[{key:'TEST',note:'Đã kiểm tra và giữ riêng hồ sơ nguồn',status:'REVIEWED'}]};
  saveCalculationConfig(state,nextConfig,'Nhập / đối soát','Khoa xác nhận nhãn mới và ghi chú');
  const saved=await fetch(origin+'/api/workspace',{method:'PUT',headers,body:JSON.stringify({expectedRevision:state.revision,state})});assert.equal(saved.status,200,await saved.clone().text());
  const reloaded=await (await fetch(origin+'/api/workspace',{headers})).json();assert.equal(reloaded.serviceCalculation.identityNotes[0].status,'REVIEWED');assert.equal(reloaded.serviceCalculation.serviceKinds['NEW-US'],'US');assert.equal(reloaded.calculationHistory[0].actor,'test-editor');assert.equal(reloaded.rows.length,2);
  const beforeRevision=reloaded.revision;reloaded.serviceCalculation.identityNotes[0].note='';reloaded.calculationHistory.unshift({reason:'Cố tình thử ghi chú không hợp lệ'});
  const rejected=await fetch(origin+'/api/workspace',{method:'PUT',headers,body:JSON.stringify({expectedRevision:beforeRevision,state:reloaded})});assert.notEqual(rejected.status,200);
  assert.equal((await (await fetch(origin+'/api/workspace',{headers})).json()).revision,beforeRevision);
 }finally{await app.close();}
});

test('Finance reconciliation preserves numeric CSV strings and refuses fractional VND',async()=>{
 const result=(await runPythonData('finance-review',{rows:[row(1,{unit_price_vnd:'100',completed_qty:'1',completed_net_vnd:'90'})],config})).value;
 assert.equal(result.checks[0].sourceNetKnown,90);assert.equal(result.checks[0].difference,10);
 await assert.rejects(runPythonData('finance-review',{rows:[row(1,{completed_net_vnd:90.5})],config}));
});
