import test from 'node:test';
import assert from 'node:assert/strict';
import {browserStorageStatus,createBrowserSpeechStore} from '../src/features/speech/browser-storage.mjs';
import {caseDay,filterResults} from '../src/features/speech/result-filters.mjs';
test('daily history uses recorded local day rather than UTC midnight',()=>{
 const a={status:'pending',patient:{pid:'TEST',name:'',visit:'',order:'',doctor:''},completedAt:{local:'15/11/2026 00:30:00',iso:'2026-11-14T17:30:00Z'}};
 const b={...a,status:'reviewed',completedAt:{local:'14/11/2026 23:00:00'}};
 assert.equal(caseDay(a),'2026-11-15');assert.deepEqual(filterResults([a,b],{from:'2026-11-15',to:'2026-11-15'}),[a]);
 assert.equal(filterResults([a,b]).length,2);assert.deepEqual(filterResults([a,b],{status:'reviewed',query:'test'}),[b]);
 assert.equal(filterResults([a,b],{from:'2026-11-16'}).length,0);
});
test('persistent storage status reflects actual browser grant and denial',async()=>{
 assert.equal(await browserStorageStatus({persisted:async()=>true}),'persistent');
 let requested=0;const s={persisted:async()=>false,persist:async()=>{requested++;return true;}};
 assert.equal(await browserStorageStatus(s),'best-effort');assert.equal(requested,0);
 assert.equal(await browserStorageStatus(s,true),'persistent');assert.equal(requested,1);
 assert.equal(await browserStorageStatus({persisted:async()=>false,persist:async()=>false},true),'best-effort');
 assert.equal(await browserStorageStatus({}),'unsupported');
 assert.equal(await browserStorageStatus({persisted:async()=>{throw Error('blocked');}}),'unsupported');
});
test('browser store reports unsupported storage without contacting a server',async()=>{
 const store=createBrowserSpeechStore({indexedDB:null});await assert.rejects(store.listResults(),/IndexedDB/);
});
