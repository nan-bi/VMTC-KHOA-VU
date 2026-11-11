import test from 'node:test';
import assert from 'node:assert/strict';
import {seedFlow} from '../src/features/patients/patientFlow.mjs';
import {accountFor,projectVisit,assertAction,canReadAttachment} from '../src/features/access/roomAccess.mjs';
test('Lễ tân không xem nội dung kết quả, không xử lý phiếu siêu âm',()=>{
 const v=seedFlow().visits[2];v.orders[0].result='KẾT QUẢ RIÊNG';v.attachments=[{room:'us-1',id:'a'}];
 const p=projectVisit(accountFor('reception'),v);
 assert.equal(p.orders.length,0);assert.equal(p.attachments.length,0);
 assert.throws(()=>assertAction(accountFor('reception'),'complete',v,v.tasks.find(t=>t.room==='us-1').id));
});
test('Bác sĩ chỉ xem lượt được giao cho phòng của mình',()=>{
 const v=seedFlow().visits[2];assert.ok(projectVisit(accountFor('clinic-1'),v));assert.equal(projectVisit(accountFor('clinic-2'),v),null);
});
test('Siêu âm không nhìn hoặc thao tác phiếu XQ, bác sĩ nhận file của cả hai',()=>{
 const v=seedFlow().visits[2];v.tasks.filter(t=>t.kind==='imaging').forEach(t=>{t.status='done';t.note='Kết quả';});v.attachments=v.tasks.filter(t=>t.kind==='imaging').map((t,i)=>({id:i===0?'a':'b',room:t.room,taskId:t.id,orderId:t.orderId,patientId:v.patientId,visitId:v.id}));
 const p=projectVisit(accountFor('us-1'),v);assert.equal(p.orders.length,1);assert.deepEqual(p.attachments.map(a=>a.id),['a']);
 assert.ok(p.tasks.every(t=>t.room==='us-1'));
 assert.throws(()=>assertAction(accountFor('us-1'),'complete',v,v.tasks.find(t=>t.room==='xray').id));
 assert.equal(projectVisit(accountFor('clinic-1'),v).attachments.length,2);
 assert.equal(canReadAttachment(accountFor('clinic-2'),v,v.attachments[0]),false);
});
test('Chỉ lễ tân sửa hành chính; điều phối không thực hiện chuyên môn',()=>{
 const v=seedFlow().visits[0];assert.doesNotThrow(()=>assertAction(accountFor('reception'),'register'));
 assert.throws(()=>assertAction(accountFor('assessment'),'updatePatient',v));
 assert.throws(()=>assertAction(accountFor('coordinator'),'start',v,v.tasks[0].id));
});
test('Không đọc file can thiệp không có nguồn phiếu hợp lệ',()=>{
 const v=seedFlow().visits[2];v.tasks.push({room:'recovery'});
 assert.equal(canReadAttachment(accountFor('recovery'),v,{room:'procedure'}),false);
 assert.equal(canReadAttachment(accountFor('recovery'),v,{room:'xray'}),false);
});
