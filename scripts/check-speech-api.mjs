import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173/speech-api';
const health=await fetch(base+'/health');assert.equal(health.status,200);assert.equal((await health.json()).ready,true);
assert.equal((await fetch(base+'/health',{headers:{Origin:'https://other.example'}})).status,403);
assert.equal((await fetch('http://127.0.0.1:4181/health')).status,403);
assert.equal((await fetch(base+'/transcribe',{method:'POST',body:new Uint8Array(100),headers:{'Content-Type':'audio/wav'}})).status,400);
assert.equal((await fetch(base+'/transcribe',{method:'POST',body:new Uint8Array(960045)})).status,413);
assert.equal((await fetch(base+'/unknown')).status,404);
console.log('Local model ready; origin/key/format/size/route checks passed.');
