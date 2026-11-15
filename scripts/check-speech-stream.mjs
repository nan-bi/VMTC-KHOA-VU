// Synthetic WAV -> actual browser chunker -> actual loopback model. No real microphone/DB.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createLocalDictation} from '../src/features/speech/local-dictation.mjs';
const base='http://127.0.0.1:4173';
const wav=await readFile(new URL('../speech-test-data/audio/GIA-001-sach.wav',import.meta.url));
assert.equal(wav.toString('ascii',0,4),'RIFF');
const raw=new Float32Array((wav.length-44)/2);
for(let i=0;i<raw.length;i++)raw[i]=wav.readInt16LE(44+i*2)/32768;
let processor,stops=0,sentSamples=0,requests=0,completedSamples=0,finalSamples=0;
const texts=[],states=[],notices=[],liveUpdates=[];let sessionStarted=0;
const node=()=>({connect(){},disconnect(){},gain:{value:1}});
class Audio {
 sampleRate=16000;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}
 createMediaStreamSource(){return node();}createGain(){return node();}
 createScriptProcessor(){processor=node();return processor;}
}
const session=createLocalDictation({AudioContextClass:Audio,
 mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stops++;}}]})},
 fetcher:async(url,options)=>{
  if(options?.body){requests++;sentSamples+=(options.body.size-44)/2;}
  const response=await fetch(base+url,options);if(options?.body)completedSamples=(options.body.size-44)/2;return response;
 },onText:t=>{texts.push(t);finalSamples+=completedSamples;},onState:s=>states.push(s),onInterim:t=>{if(t)liveUpdates.push({ms:Math.round(performance.now()-sessionStarted),text:t});},onNotice:t=>notices.push(t)});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function drain(){const until=Date.now()+120000;while(session.hasPending()&&Date.now()<until)await wait(50);assert.equal(session.hasPending(),false);}
// Feed regular audio callbacks at their real-time cadence for 33 seconds.
sessionStarted=performance.now();await session.start();assert.equal(states.at(-1),'listening');
const length=33*16000;let fed=0;const start=performance.now();
while(fed<length){
 const n=Math.min(4096,length-fed),frame=new Float32Array(n);
 for(let i=0;i<n;i++)frame[i]=raw[(fed+i)%raw.length];
 processor.onaudioprocess({inputBuffer:{getChannelData:()=>frame}});fed+=n;
 await wait(Math.max(0,(fed/16000)*1000-(performance.now()-start)));
}
session.stop();await drain();
assert.equal(finalSamples,length,'final segments must cover captured audio exactly once, including the tail');
assert.ok(liveUpdates.length>=2,'words must appear while capture is still active');
assert.ok(liveUpdates[0].ms<8000,'first live text must arrive before the final segment boundary');
assert.ok(requests>=2);assert.ok(texts.length>=2);assert.equal(stops,1);
assert.equal(states.includes('error'),false);
// A new session must work after the previous drain; exercise short final tail.
await session.start();assert.equal(states.at(-1),'listening');
processor.onaudioprocess({inputBuffer:{getChannelData:()=>raw}});
session.stop();await drain();
assert.equal(finalSamples,length+raw.length);assert.equal(stops,2);assert.equal(states.at(-1),'idle');
const result={audioSeconds:33+raw.length/16000,requests,sentSamples,finalSamples,liveUpdates,textSegments:texts.length,states,texts,notices,
 scope:'Synthetic AudioContext callbacks at real-time cadence; real HTTP/model; no physical mic, browser DSP or IndexedDB.'};
await writeFile(new URL('../speech-test-data/LUONG-THU.md',import.meta.url),
 '# Kiểm tra luồng thu giả lập\n\n'+result.scope+'\n\n'+
 `- ${result.audioSeconds.toFixed(4)} giây; ${requests} yêu cầu; ${sentSamples} mẫu đến HTTP (gồm cửa sổ xem trước); ${finalSamples} mẫu trong đoạn chốt, bằng đúng tổng thu.\n- Hai phiên liên tiếp; đuôi cuối được gửi đủ; không lỗi trạng thái; ${texts.length} đoạn văn bản nhận được.\n\n`+
 texts.map(t=>'- '+t).join('\n')+'\n\n'+JSON.stringify(liveUpdates,null,2)+'\n');
session.dispose();console.log(JSON.stringify({status:'PASS',firstLiveMs:liveUpdates[0]?.ms,liveUpdates:liveUpdates.length,requests,finalSamples,sentSamples}));
