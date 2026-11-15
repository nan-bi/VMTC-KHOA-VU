import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from '../src/features/backend/client.mjs';

test('backend client preserves HTTP status so a temporary outage is distinguishable from an expired session',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 for(const status of [401,403,409,429,503]){
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'Test failure'}),{status,headers:{'Content-Type':'application/json'}});
  await assert.rejects(()=>request('/api/workspace'),e=>e.status===status&&e.message==='Test failure');
 }
 globalThis.fetch=async()=>new Response('Service unavailable',{status:503});
 await assert.rejects(()=>request('/api/workspace'),e=>e.status===503);
});

test('backend client rejects invalid success JSON and retains a valid response',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 globalThis.fetch=async()=>new Response('Not JSON',{status:200});
 await assert.rejects(()=>request('/api/workspace'),/không hợp lệ/);
 globalThis.fetch=async()=>new Response(JSON.stringify({revision:7}),{status:200});
 assert.deepEqual(await request('/api/workspace'),{revision:7});
});
