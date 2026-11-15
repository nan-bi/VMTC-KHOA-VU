import test from 'node:test';
import assert from 'node:assert/strict';
import {blank,reducer,missing,reportText} from '../src/features/speech/model.mjs';
import {createDictation} from '../src/features/speech/dictation.mjs';

test('All speech is retained, including former commands and clinical self-corrections',()=>{
 let s=blank();const parts=['Vú phải không có tổn thương, vú trái 8 x 5 mm.','À sửa lại, 8 x 6 mm, BI-RADS 4A.','Thư ký tạm dừng.','Thư ký chuyển vú trái.'];
 for(const text of parts)s=reducer(s,{type:'append',text});
 assert.equal(s.transcript,parts.join(' '));assert.deepEqual(s.events.map(e=>e.text),parts);
 assert.equal(s.reviewed,false);
});
test('Manual correction keeps recognized source text and undo restores transcript',()=>{
 let s=reducer(blank(),{type:'append',text:'Không có hạch.'});s=reducer(s,{type:'edit',value:'Chưa ghi nhận hạch.'});
 assert.equal(s.events[0].text,'Không có hạch.');assert.equal(s.transcript,'Chưa ghi nhận hạch.');
 s=reducer(s,{type:'undo'});assert.equal(s.transcript,'Không có hạch.');assert.equal(s.events.length,1);
});
test('Review requires identity and transcript, never requires separate clinical sections',()=>{
 let s=blank();assert.equal(reducer(s,{type:'review',value:true}).reviewed,false);
 for(const key of ['pid','visit','order','doctor'])s=reducer(s,{type:'patient',key,value:'TEST'});
 s=reducer(s,{type:'append',text:'Toàn bộ nội dung bác sĩ đã đọc.'});assert.deepEqual(missing(s),[]);
 s=reducer(s,{type:'review',value:true});assert.equal(s.reviewed,true);
 s=reducer(s,{type:'append',text:'Bổ sung.'});assert.equal(s.reviewed,false);assert.equal(s.completedAt,null);
 s=reducer(s,{type:'review',value:true});s=reducer(s,{type:'patient',key:'pid',value:'OTHER'});assert.equal(s.reviewed,false);
});
test('Export is always a draft with a single complete transcript',()=>{
 const text='Vú phải 10 giờ 8 x 5 mm. Vú trái không thấy khối. BI-RADS 3.';
 const s=reducer(blank(),{type:'append',text});const report=reportText(s);
 assert.ok(report.includes(text));assert.match(report,/BẢN NHÁP/);assert.match(report,/Chưa ký bác sĩ/);assert.match(report,/NỘI DUNG LỜI ĐỌC/);
 assert.doesNotMatch(report,/VÚ TRÁI\n/);
});
test('New case clears transcript, original words and identity',()=>{
 let s=reducer(blank(),{type:'append',text:'Ca cũ'});s=reducer(s,{type:'patient',key:'pid',value:'OLD'});
 assert.deepEqual(reducer(s,{type:'reset'}),blank());
});
function fixture(){
 const instances=[],texts=[],partials=[],states=[],notices=[];
 class Recognition{
  constructor(){instances.push(this);}
  start(){this.onstart();}
  stop(){this.stopped=true;}
  abort(){this.onend?.();}
  result(text,final=true,index=0){const result=[{transcript:text}];result.isFinal=final;this.onresult({resultIndex:index,results:[result]});}
 }
 const controller=createDictation({Recognition,onText:t=>texts.push(t),onInterim:t=>partials.push(t),onState:s=>states.push(s),onNotice:n=>notices.push(n)});
 return {controller,instances,texts,partials,states,notices};
}
test('Stop accepts the final buffered sentence, then unlocks the case',()=>{
 const f=fixture();f.controller.start();const r=f.instances[0];
 r.result('Nội dung tạm',false);assert.deepEqual(f.texts,[]);
 f.controller.stop();assert.equal(f.states.at(-1),'stopping');r.result('Không có hạch nách.');r.onend();
 assert.deepEqual(f.texts,['Không có hạch nách.']);assert.equal(f.states.at(-1),'idle');f.controller.dispose();
});
test('Pause reconnects without repeating the previous completed sentence',async()=>{
 const f=fixture();f.controller.start();f.instances[0].result('Vú phải 8 mm.');f.instances[0].onend();
 assert.equal(f.states.at(-1),'reconnecting');await new Promise(resolve=>setTimeout(resolve,420));
 assert.equal(f.instances.length,2);f.instances[1].result('Vú trái không thấy khối.');
 assert.deepEqual(f.texts,['Vú phải 8 mm.','Vú trái không thấy khối.']);f.controller.stop();f.instances[1].onend();f.controller.dispose();
});
test('Stop while reconnecting cancels reopening the microphone',async()=>{
 const f=fixture();f.controller.start();f.instances[0].onend();f.controller.stop();
 await new Promise(resolve=>setTimeout(resolve,420));assert.equal(f.instances.length,1);assert.equal(f.states.at(-1),'idle');f.controller.dispose();
});
test('Network errors stop instead of silently reopening the microphone',async()=>{
 const f=fixture();f.controller.start();f.instances[0].onerror({error:'network'});f.instances[0].onend();
 await new Promise(resolve=>setTimeout(resolve,420));assert.equal(f.instances.length,1);assert.equal(f.states.at(-1),'idle');assert.match(f.notices.at(-1),/Mất kết nối/);f.controller.dispose();
});
test('New result index excludes previously finalized utterances',()=>{
 const f=fixture();f.controller.start();const r=f.instances[0];r.result('Câu đầu.');
 const first=[{transcript:'Câu đầu.'}],second=[{transcript:'Câu sau.'}];first.isFinal=true;second.isFinal=true;
 r.onresult({resultIndex:1,results:[first,second]});assert.deepEqual(f.texts,['Câu đầu.','Câu sau.']);f.controller.dispose();
});
test('Repeated empty sessions stop after three reconnect attempts',async()=>{
 const f=fixture();f.controller.start();
 for(let i=0;i<3;i++){f.instances[i].onend();await new Promise(resolve=>setTimeout(resolve,420));}
 f.instances[3].onend();assert.equal(f.instances.length,4);assert.equal(f.states.at(-1),'idle');assert.match(f.notices.at(-1),/liên tục ngắt/);f.controller.dispose();
});
