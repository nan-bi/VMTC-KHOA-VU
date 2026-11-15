import test from 'node:test';
import assert from 'node:assert/strict';
import {prompts,csv,sampleRow} from '../src/features/speech-training/prompts.mjs';
import {createTrainingRecorder} from '../src/features/speech-training/recorder.mjs';
test('80 unique synthetic prompts cover all collection groups without pretending to be reviewed recordings',()=>{
 assert.equal(prompts.length,80);assert.equal(new Set(prompts.map(p=>p.id)).size,80);assert.equal(new Set(prompts.map(p=>p.category)).size,8);
 assert.ok(prompts.some(p=>p.text.includes('xin sửa lại')));assert.ok(prompts.some(p=>p.text.includes('không')));
 assert.ok(prompts.some(p=>p.text.includes('HER2')));
 assert.equal(csv([]).split('\r\n').filter(Boolean).length,1);
});
test('CSV preserves Vietnamese and quotes; rows require identity, split and actual transcript',()=>{
 assert.ok(csv([{text:'Vú trái, "không"'}],['text']).includes('"Vú trái, ""không"""'));
 const args={prompt:prompts[0],speaker:'BS01',session:'BS01_B01',split:'train',pace:'thuong',condition:'yen_tinh',text:'Vú phải.',id:'sample'};
 assert.equal(sampleRow(args).audio,'audio/sample.wav');assert.throws(()=>sampleRow({...args,text:''}));assert.throws(()=>sampleRow({...args,speaker:'../a'}));assert.throws(()=>sampleRow({...args,split:'other'}));
});
test('training recorder closes mic and exports only captured PCM including the last frame',async()=>{
 let processor,stopped=0,result;const states=[];
 const node=()=>({connect(){},disconnect(){},gain:{value:1}});
 class Audio{sampleRate=16000;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createMediaStreamSource(){return node();}createGain(){return node();}createScriptProcessor(){processor=node();return processor;}}
 const r=createTrainingRecorder({AudioContextClass:Audio,mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stopped++;}}]})},onState:s=>states.push(s),onDone:x=>result=x,onError:e=>assert.fail(e)});
 await r.start();processor.onaudioprocess({inputBuffer:{getChannelData:()=>new Float32Array(48000).fill(.2)}});r.stop();
 assert.equal(stopped,1);assert.equal(result.seconds,3);assert.equal(result.blob.size,96044);assert.equal(states.at(-1),'idle');
});
test('stop during permission prompt prevents a late mic from recording',async()=>{
 let permit,stopped=0;
 const r=createTrainingRecorder({AudioContextClass:class{},mediaDevices:{getUserMedia:()=>new Promise(resolve=>permit=resolve)},onState(){},onDone:()=>assert.fail('must not record'),onError:e=>assert.fail(e)});
 const pending=r.start();r.stop();permit({getTracks:()=>[{stop(){stopped++;}}]});await pending;assert.equal(stopped,1);
});
