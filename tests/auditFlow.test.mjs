import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS,emptyFlow,register,startTask,completeAssessment,issueOrders,completeService,closeVisit,updatePatient} from '../src/features/patients/patientFlow.mjs';
import {assertFlow,upgradeFlow} from '../src/features/patients/flowIntegrity.mjs';
import {accountFor,canReadAttachment,projectVisit} from '../src/features/access/roomAccess.mjs';
import {transactFlow,FLOW_KEY} from '../src/features/patients/flowStore.mjs';
function setup(clinic='clinic-1'){
 const s=emptyFlow(),id=register(s,{alias:'Khách mẫu',birthYear:1990,date:'2026-10-23',intakeNote:'Ghi chú tiếp nhận'}),v=s.visits.find(v=>v.id===id);
 startTask(s,id,v.tasks[0].id,'assessment');completeAssessment(s,id,v.tasks[0].id,clinic,'Đánh giá riêng của khách','assessment',{safetyNote:'Dị ứng mẫu cần lưu ý'});return {s,v};
}
const take=(s,v,kind)=>{const t=v.tasks.find(t=>t.status==='waiting'&&(!kind||t.kind===kind));startTask(s,v.id,t.id,t.room);return t;};
const finish=(s,v,t,note='Kết quả riêng của phiếu')=>completeService(s,v.id,t.id,note,t.room,{handoverConfirmed:true});
const attach=(v,t,id)=>{const a={id,patientId:v.patientId,visitId:v.id,room:t.room,taskId:t.id,orderId:t.orderId||null};(v.attachments??=[]).push(a);return a;};
test('Mã đầy đủ UUID; ngày giả và thông tin thiếu bị từ chối',()=>{
 const s=emptyFlow();assert.throws(()=>register(s,{alias:'Mẫu',birthYear:1990,date:'2026-02-30'}));assert.equal(s.visits.length,0);
 const {v}=setup();assert.match(v.id,/^LK-[A-F0-9-]{36}$/);assert.match(v.patientId,/^BN-[A-F0-9-]{36}$/);
});
test('Bàn giao đủ ghi chú và file đúng nguồn; siêu âm/XQ không trộn kết quả',()=>{
 const {s,v}=setup();const consult=take(s,v);issueOrders(s,v.id,consult.id,['us-1','xray'],'Nội dung bác sĩ chỉ định riêng',consult.room);
 const doctorFile=attach(v,consult,'doctor-file');
 const us=take(s,v,'imaging');finish(s,v,us,'Kết quả siêu âm');const usFile=attach(v,us,'us-file');
 const xray=v.tasks.find(t=>t.room==='xray');const projected=projectVisit(accountFor('xray'),v);const packet=projected.tasks.find(t=>t.id===xray.id).handover;
 assert.equal(packet.intakeNote,'Ghi chú tiếp nhận');assert.equal(packet.safetyNote,'Dị ứng mẫu cần lưu ý');assert.ok(packet.steps.some(x=>x.note==='Đánh giá riêng của khách'));assert.ok(packet.steps.some(x=>x.note==='Nội dung bác sĩ chỉ định riêng'));assert.ok(!packet.steps.some(x=>x.note==='Kết quả siêu âm'));
 assert.equal(canReadAttachment(accountFor('xray'),v,doctorFile),true);assert.equal(canReadAttachment(accountFor('xray'),v,usFile),false);assert.equal(canReadAttachment(accountFor('clinic-1'),v,usFile),true);assertFlow(s);
});
test('Không lộ kết quả chuyên môn ở đánh giá ban đầu và điều phối',()=>{
 const {s,v}=setup();const t=take(s,v);issueOrders(s,v.id,t.id,['xray'],'Nội dung bác sĩ',t.room);const x=take(s,v);finish(s,v,x,'KẾT QUẢ RIÊNG');attach(v,x,'secret-file');
 for(const id of ['assessment','reception','coordinator']){const p=projectVisit(accountFor(id),v);assert.ok(!JSON.stringify(p).includes('KẾT QUẢ RIÊNG'));assert.ok(!p.attachments.some(a=>a.id==='secret-file'));}
 assert.throws(()=>accountFor('unknown'));
});
test('Chặn liên kết thừa từ XQ sang siêu âm và file giả mạo khách',()=>{
 const {s,v}=setup();const t=take(s,v);issueOrders(s,v.id,t.id,['xray','us-1'],'Chỉ định hai phòng',t.room);const x=take(s,v);finish(s,v,x);
 const us=v.tasks.find(t=>t.room==='us-1');us.contextTaskIds.push(x.id);assert.throws(()=>assertFlow(s),/nối thừa/);
 const fake={id:'file',patientId:'WRONG',visitId:v.id,room:'reception'};assert.equal(canReadAttachment(accountFor('clinic-1'),v,fake),false);
});
test('Ngăn khách đồng thời thực hiện ở hai lượt ngày khác nhau',()=>{
 const {s,v}=setup();take(s,v);const id=register(s,{patientId:v.patientId,date:'2026-10-24'});const other=s.visits.find(v=>v.id===id);assert.throws(()=>startTask(s,id,other.tasks[0].id,'assessment'),/phòng khác/);assertFlow(s);
});
test('Không nhầm ảnh chụp hành chính của lượt cũ khi sửa lượt mới',()=>{
 const {s,v}=setup();const t=take(s,v);closeVisit(s,v.id,t.id,'Kết thúc đầy đủ',t.room);const id=register(s,{patientId:v.patientId,date:'2026-10-24'});updatePatient(s,id,{alias:'Tên mới',birthYear:1991});assert.equal(v.patientSnapshot.alias,'Khách mẫu');assert.equal(s.visits.at(-1).patientSnapshot.alias,'Tên mới');assert.throws(()=>updatePatient(s,v.id,{alias:'Sửa lượt cũ',birthYear:1990}));assertFlow(s);
});
test('Kiểm tra orphan, khác khách, sai chỉ định, thiếu và trùng phiếu đọc kết quả',()=>{
 const {s,v}=setup();const t=take(s,v);issueOrders(s,v.id,t.id,['xray'],'Chỉ định',t.room);finish(s,v,take(s,v));assertFlow(s);
 for(const corrupt of [x=>x.visits[0].tasks.at(-1).assignedDoctorId='WRONG',x=>x.visits[0].orders[0].patientId='WRONG',x=>x.visits[0].tasks.pop(),x=>x.visits[0].tasks.push(structuredClone(x.visits[0].tasks.at(-1))),x=>x.patients.splice(0,1)]){const c=structuredClone(s);corrupt(c);assert.throws(()=>assertFlow(c));}
});
test('Hai ghi cùng revision: ghi thứ hai bị chặn, không mất dữ liệu lần đầu',()=>{
 const {s}=setup();const initial=upgradeFlow(s);const storage={value:JSON.stringify(initial),getItem(){return this.value},setItem(k,v){assert.equal(k,FLOW_KEY);this.value=v}};
 transactFlow(storage,0,s=>register(s,{alias:'Khách A',birthYear:1980,date:'2026-10-23'}));
 assert.throws(()=>transactFlow(storage,0,s=>register(s,{alias:'Khách B',birthYear:1980,date:'2026-10-23'})),/thay đổi/);
 const committed=storage.value;assert.throws(()=>transactFlow(storage,1,s=>s.visits[0].patientId='ORPHAN'));assert.equal(storage.value,committed);
 assert.throws(()=>transactFlow({...storage,setItem(){throw Error('quota')}},1,s=>register(s,{alias:'Chưa lưu',birthYear:1980,date:'2026-10-23'})),/quota/);assert.equal(storage.value,committed);
});
test('Dữ liệu cũ hợp lệ được nâng cấp; dữ liệu hỏng không bị reset âm thầm',()=>{
 const {s}=setup();const legacy=structuredClone(s);delete legacy.schemaRevision;delete legacy.revision;for(const v of legacy.visits){delete v.patientSnapshot;for(const t of v.tasks){delete t.contextTaskIds;delete t.sourceTaskId;delete t.patientId;delete t.visitId;}}
 assert.equal(assertFlow(upgradeFlow(legacy)),true);legacy.visits[0].patientId='ORPHAN';assert.throws(()=>upgradeFlow(legacy));
});
test('200 kịch bản đủ 4 phòng khám × 5 nhánh, bất biến sau từng bước',()=>{
 for(let run=0;run<200;run++){
  const clinic=`clinic-${1+(run%4)}`,route=Math.floor(run/4)%5,{s,v}=setup(clinic);
  const check=()=>assertFlow(s);check();let t=take(s,v);check();
  const order=targets=>{issueOrders(s,v.id,t.id,targets,'Bác sĩ xác nhận nhánh '+route,clinic,{recoveryRequired:route===3});check();};
  if(route===1||route===2){order(route===1?['us-3d']:['us-2','xray']);while(v.tasks.some(x=>x.status==='waiting'&&x.kind==='imaging')){const service=take(s,v,'imaging');check();finish(s,v,service);check();}t=take(s,v,'review');check();}
  if(route===3||route===4){order(['counsel']);let c=take(s,v,'counsel');check();finish(s,v,c);check();t=take(s,v,'review');order(['procedure']);c=take(s,v,'procedure');check();finish(s,v,c);check();if(route===3){c=take(s,v,'recovery');check();finish(s,v,c);check();}t=take(s,v,'review');check();}
  closeVisit(s,v.id,t.id,'Bác sĩ kết luận và kết thúc lượt',clinic);check();assert.ok(v.tasks.every(x=>x.status==='done'));assert.ok(v.orders.every(x=>x.status==='done'));
 }
});
test('40 khách đan xen nhiều phòng: mỗi kết quả, file và phiếu trở về đúng khách',()=>{
 const s=emptyFlow();
 for(let i=0;i<40;i++)register(s,{alias:'Khách '+i,birthYear:1980,date:'2026-10-23'});
 for(const [i,v] of s.visits.entries()){const a=take(s,v,'assessment');completeAssessment(s,v.id,a.id,`clinic-${i%4+1}`,'Đánh giá '+i,'assessment');}
 for(const v of [...s.visits].reverse()){const t=take(s,v);issueOrders(s,v.id,t.id,['us-1','xray'],'Yêu cầu riêng '+v.id,t.room);assertFlow(s);}
 for(const room of ['xray','us-1'])for(const v of [...s.visits].reverse()){const t=v.tasks.find(t=>t.room===room);startTask(s,v.id,t.id,room);finish(s,v,t,'Kết quả đúng lượt '+v.id);attach(v,t,crypto.randomUUID());assertFlow(s);}
 for(const v of s.visits){const t=take(s,v,'review');assert.ok(v.orders.every(o=>o.result.endsWith(v.id)));for(const other of s.visits.filter(x=>x.id!==v.id))assert.ok(!v.attachments.some(a=>a.visitId===other.id));closeVisit(s,v.id,t.id,'Kết thúc đúng lượt '+v.id,t.room);assertFlow(s);}
});
