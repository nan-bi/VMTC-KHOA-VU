import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as XLSX from 'xlsx';
import {createBackend} from '../backend/server.mjs';
import {createUser} from '../backend/auth.mjs';
const fixture=JSON.parse(await readFile(new URL('./fixtures/python-phase2-golden.json',import.meta.url)));

test('Python data endpoints enforce origin/session/CSRF and never expose transition commands',async()=>{
 const app=await createBackend({databasePath:':memory:',catalog:fixture.catalog});
 createUser(app.db,{username:'python-api-test',password:'Internal-Test-Python-1234',role:'viewer'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+app.server.address().port;
 const post=(route,payload,auth={},extra={})=>fetch(origin+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...auth,...extra},body:JSON.stringify(payload)});
 try{
  const path='/api/data/calculation',payload={rows:fixture.aggregate.completed,config:fixture.config,department:'ALL'};
  assert.equal((await post(path,payload)).status,401);
  const login=await post('/api/auth/login',{username:'python-api-test',password:'Internal-Test-Python-1234'}),session=await login.json();
  const cookie={Cookie:login.headers.get('set-cookie').split(';')[0]},auth={...cookie,'X-CSRF-Token':session.csrf};
  assert.equal((await post(path,payload,cookie)).status,403);
  assert.equal((await post(path,payload,auth,{Origin:'http://untrusted.invalid'})).status,403);
  const before=await (await fetch(origin+'/api/workspace',{headers:cookie})).json();
  const response=await post(path,payload,auth),body=await response.json();assert.equal(response.status,200);assert.equal(body.engine,'python');assert.deepEqual(body.value,fixture.calculation);
  assert.equal((await post('/api/data/transition',{},auth)).status,404);
  assert.equal((await post(path,{rows:null},auth)).status,400);
  assert.equal((await post('/api/workspace',{expectedRevision:0,state:before},auth)).status,404);
  const after=await (await fetch(origin+'/api/workspace',{headers:cookie})).json();assert.deepEqual(after,before);
 }finally{await app.close();}
});

test('Actual XLS and XLSX bytes are parsed by Python with trusted provenance and no workspace writes',async()=>{
 const app=await createBackend({databasePath:':memory:',catalog:fixture.catalog});createUser(app.db,{username:'import-api-test',password:'Internal-Test-Python-1234',role:'editor'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+app.server.address().port;
 const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'import-api-test',password:'Internal-Test-Python-1234'})});const session=await login.json();
 const headers={Origin:origin,'Content-Type':'application/json',Cookie:login.headers.get('set-cookie').split(';')[0],'X-CSRF-Token':session.csrf};
 try{
  const row={...fixture.rows[0],source_file:'FORGED',source_row:999,source_file_hash:'FORGED'};
  for(const type of ['xls','xlsx']){
   const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([row]),'CANONICAL');const bytes=XLSX.write(book,{type:'buffer',bookType:type});
   const response=await fetch(origin+'/api/data/ingest',{method:'POST',headers,body:JSON.stringify({name:'source.'+type,content:bytes.toString('base64')})});const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.engine,'python');assert.equal(body.value.rows[0].source_row,2);assert.equal(body.value.rows[0].source_file,'source.'+type);assert.match(body.value.rows[0].source_file_hash,/^[a-f0-9]{64}$/);
  }
  assert.equal((await (await fetch(origin+'/api/workspace',{headers})).json()).rows.length,0);
 }finally{await app.close();}
});

test('Concurrent Python workspace transitions commit exactly once at the SQLite revision boundary',async()=>{
 const state={version:1,revision:0,rows:[],excluded:[],imports:[],hashes:[],logs:[],report:null};
 const app=await createBackend({databasePath:':memory:',initialState:state,catalog:fixture.catalog});createUser(app.db,{username:'race-python',password:'Internal-Test-Python-1234',role:'editor'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+app.server.address().port;
 const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'race-python',password:'Internal-Test-Python-1234'})});const session=await login.json(),headers={Origin:origin,'Content-Type':'application/json',Cookie:login.headers.get('set-cookie').split(';')[0],'X-CSRF-Token':session.csrf};
 try{
  const put=()=>fetch(origin+'/api/workspace',{method:'PUT',headers,body:JSON.stringify({expectedRevision:0,state})});
  const responses=await Promise.all([put(),put()]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  const saved=await (await fetch(origin+'/api/workspace',{headers})).json();assert.equal(saved.revision,1);assert.equal(saved.logs.length,1);
  assert.equal(app.db.prepare("SELECT count(*) AS n FROM audit WHERE action='WORKSPACE_UPDATED'").get().n,1);
 }finally{await app.close();}
});
