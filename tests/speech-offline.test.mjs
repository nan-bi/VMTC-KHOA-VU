import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {speechAssets} from '../scripts/speechOffline.mjs';
import {blank,reducer} from '../src/features/speech/model.mjs';
import {hasDraftContent,draftSnapshot} from '../src/features/speech/results.mjs';

test('Offline bundle follows actual speech imports and excludes unrelated dashboard assets',()=>{
 const bundle={'speech.html':{source:'<script src="/assets/speech.js"></script><link href="/assets/speech.css">'},'assets/speech.js':{code:'',imports:['assets/vendor.js'],dynamicImports:['assets/helper.js']},'assets/speech.css':{source:'@font-face{src:url(/assets/vietnamese.ttf)}'},'assets/vietnamese.ttf':{source:new Uint8Array([0,1,0,0])},'assets/vendor.js':{code:'',imports:[]},'assets/helper.js':{code:'',imports:[]},'assets/dashboard.js':{code:'unrelated'}};
 assert.deepEqual(speechAssets(bundle),['assets/helper.js','assets/speech.css','assets/speech.js','assets/vendor.js','assets/vietnamese.ttf','speech.html']);
 assert.throws(()=>speechAssets({}),/Missing speech.html/);delete bundle['assets/helper.js'];assert.throws(()=>speechAssets(bundle),/Missing offline asset/);
});
test('Draft snapshots preserve identity, text, source and timestamps without mutable references',()=>{
 let s=blank();assert.equal(hasDraftContent(s),false);
 s=reducer(s,{type:'patient',key:'pid',value:'TEST-OFFLINE'});assert.equal(hasDraftContent(s),true);
 s=reducer(s,{type:'append',text:'Không ghi nhận hạch nách. 8 x 5 mm.'});
 const snapshot=draftSnapshot(s);assert.deepEqual(snapshot.history,[]);assert.deepEqual(snapshot.startedAt,s.startedAt);
 s.patient.pid='OTHER';s.events[0].text='OTHER';assert.equal(snapshot.patient.pid,'TEST-OFFLINE');assert.equal(snapshot.transcript,'Không ghi nhận hạch nách. 8 x 5 mm.');assert.notEqual(snapshot.events[0].text,'OTHER');
 const recovered=reducer(blank(),{type:'restore',state:snapshot});assert.equal(recovered.patient.pid,'TEST-OFFLINE');assert.equal(recovered.transcript,snapshot.transcript);assert.deepEqual(recovered.startedAt,snapshot.startedAt);
 assert.equal(hasDraftContent({...recovered,savedId:'DONE'}),false);
});
function worker(){
 const listeners={},deleted=[],added=[];let claimed=false,skipped=false;
 const cache={addAll:async paths=>added.push(...paths),match:async path=>path==='/speech.html'?'cached-page':path==='/assets/speech.js'?'cached-js':undefined};
 const self={location:{origin:'http://127.0.0.1:4173'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{skipped=true;},clients:{claim:async()=>{claimed=true;}}};
 const caches={open:async()=>cache,keys:async()=>['vu-voice-shell-old','vu-voice-shell-test','other-application-cache'],delete:async name=>deleted.push(name)};
 const source="const CACHE='vu-voice-shell-test';const ASSETS=['/speech.html','/assets/speech.js'];\n"+readFileSync(new URL('../src/features/speech/offline-worker.js',import.meta.url),'utf8');
 vm.runInNewContext(source,{self,caches,URL,fetch:async()=>{throw Error('NETWORK OFFLINE');}});
 return {listeners,deleted,added,get claimed(){return claimed;},get skipped(){return skipped;}};
}
test('Worker prepares the entire shell before activation and leaves other caches alone',async()=>{
 const w=worker();let promise;w.listeners.install({waitUntil:p=>{promise=p;}});await promise;
 assert.deepEqual(w.added,['/speech.html','/assets/speech.js']);assert.equal(w.skipped,true);
 w.listeners.activate({waitUntil:p=>{promise=p;}});await promise;assert.deepEqual(w.deleted,['vu-voice-shell-old']);assert.equal(w.claimed,true);
});
test('Cached page and scripts load when network requests fail',async()=>{
 const w=worker();let response;
 for(const [path,expected] of [['/speech.html','cached-page'],['/assets/speech.js','cached-js']]){
  w.listeners.fetch({request:{method:'GET',url:'http://127.0.0.1:4173'+path},respondWith:p=>{response=p;}});
  assert.equal(await response,expected);
 }
});
test('Worker does not intercept patient APIs, other pages, external services or writes',()=>{
 const w=worker();
 for(const request of [{method:'GET',url:'http://127.0.0.1:4173/api/patient'},{method:'GET',url:'http://127.0.0.1:4173/'},{method:'GET',url:'https://speech.example/speech.html'},{method:'POST',url:'http://127.0.0.1:4173/speech.html'}]){
  let intercepted=false;w.listeners.fetch({request,respondWith:()=>{intercepted=true;}});assert.equal(intercepted,false);
 }
});
