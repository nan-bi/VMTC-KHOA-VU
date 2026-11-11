import {ROOMS,DOCTORS} from './patientFlow.mjs';
import {identifier,isDateOnly,isTimestamp} from '../../shared/dataRules.mjs';
const require=(ok,message)=>{if(!ok)throw Error('Hồ sơ không nhất quán: '+message);};
export function assertFlow(s){
 require(s?.version===1&&Array.isArray(s.patients)&&Array.isArray(s.visits),'cấu trúc lưu trữ không hợp lệ.');
 require(s.schemaRevision===2&&Number.isSafeInteger(s.revision)&&s.revision>=0&&s.revision<Number.MAX_SAFE_INTEGER,'phiên bản cập nhật không hợp lệ.');
 const ids=new Set(),patientIds=new Set(),activePatients=new Set(),activeRooms=new Set(),openDates=new Set();
 const unique=(id,type)=>{require(identifier(id)&&!ids.has(id),`mã ${type} thiếu hoặc trùng (${id}).`);ids.add(id);};
 for(const p of s.patients){unique(p.id,'bệnh nhân');patientIds.add(p.id);require(typeof p.alias==='string'&&p.alias.trim()&&Number.isInteger(p.birthYear)&&p.birthYear>=1900,'thông tin bệnh nhân không hợp lệ.');}
 for(const v of s.visits){
  unique(v.id,'lượt');require(patientIds.has(v.patientId),'lượt không có bệnh nhân gốc.');require(isDateOnly(v.date),'ngày tiếp đón không hợp lệ.');
  require(['open','closed'].includes(v.status)&&Array.isArray(v.tasks)&&Array.isArray(v.orders)&&Array.isArray(v.history),'trạng thái/cấu trúc lượt không hợp lệ.');
  require(v.patientSnapshot?.id===v.patientId&&v.patientSnapshot.birthYear<=+v.date.slice(0,4),'ảnh chụp thông tin hành chính không khớp lượt.');
  const assessment=v.tasks.filter(t=>t.kind==='assessment');require(assessment.length===1&&assessment[0].room==='assessment','mỗi lượt phải có đúng một Đánh giá ban đầu.');
  const assigned=assessment[0].status==='done';
  require(assigned?DOCTORS.some(d=>d.id===v.doctorId&&d.room===v.clinicId):!v.clinicId&&!v.doctorId&&!v.orders.length,'phân phòng/bác sĩ trước hoặc sai đánh giá ban đầu.');
  if(v.status==='open'){const k=v.patientId+'|'+v.date;require(!openDates.has(k),'trùng lượt mở cùng khách, cùng ngày.');openDates.add(k);require(v.tasks.some(t=>t.status!=='done'),'lượt mở không còn nơi tiếp nhận.');}
  if(v.status==='closed')require(v.tasks.every(t=>t.status==='done')&&v.orders.every(o=>o.status==='done')&&v.finalNote?.trim(),'kết thúc khi còn phiếu hoặc thiếu kết luận.');
  const taskMap=new Map(v.tasks.map(t=>[t.id,t])),orderMap=new Map(v.orders.map(o=>[o.id,o]));
  for(const [index,t] of v.tasks.entries()){
   unique(t.id,'phiếu');require(t.patientId===v.patientId&&t.visitId===v.id,'phiếu bị gán khác khách/lượt.');
   const room=ROOMS.find(r=>r.id===t.room);require(room,'phòng không tồn tại.');
   require((room.type==='clinic'?['consult','review']: [room.type]).includes(t.kind),'loại phiếu không khớp phòng.');
   require(['waiting','active','done'].includes(t.status),'trạng thái phiếu không hợp lệ.');
   if(t.status==='active'){
    require(!activePatients.has(v.patientId),'một khách đang thực hiện tại nhiều lượt/phòng.');require(!activeRooms.has(t.room),'phòng đang thực hiện nhiều khách.');
    activePatients.add(v.patientId);activeRooms.add(t.room);require(isTimestamp(t.startedAt),'phiếu đang thực hiện thiếu giờ tiếp nhận.');
   }
   if(t.status==='done')require(typeof t.note==='string'&&t.note.trim()&&isTimestamp(t.completedAt),'phiếu hoàn thành thiếu nội dung hoặc giờ bàn giao.');
   require(Array.isArray(t.contextTaskIds)&&new Set(t.contextTaskIds).size===t.contextTaskIds.length,'ngữ cảnh phiếu thiếu/trùng.');
   for(const id of t.contextTaskIds)require(taskMap.has(id)&&v.tasks.indexOf(taskMap.get(id))<index&&taskMap.get(id).status==='done','phiếu tham chiếu ngữ cảnh ngoài lượt hoặc chưa bàn giao.');
   if(t.sourceTaskId)require(t.contextTaskIds.includes(t.sourceTaskId),'thiếu phiếu nguồn trong gói bàn giao.');
   if(['consult','review'].includes(t.kind))require(t.room===v.clinicId&&t.assignedDoctorId===v.doctorId,'phiếu bác sĩ khác phòng phụ trách.');
   if(t.kind==='consult')require(t.sourceTaskId===assessment[0].id,'khám không xuất phát từ Đánh giá ban đầu.');
   if(['imaging','counsel','procedure','recovery'].includes(t.kind)){
    const o=orderMap.get(t.orderId);require(o&&t.batch===o.batch,'phiếu mất liên kết chỉ định/đợt.');
    require(t.kind==='recovery'?o.target==='procedure'&&o.recoveryRequired&&taskMap.get(t.sourceTaskId)?.kind==='procedure':o.target===t.room&&t.sourceTaskId===o.sourceTaskId,'nhánh thực hiện sai nơi gửi/nhận.');
   }
   let expected=[];
   if(t.kind==='consult')expected=[assessment[0].id];
   if(['imaging','counsel','procedure'].includes(t.kind)){
    const o=orderMap.get(t.orderId);expected=[assessment[0].id,t.sourceTaskId];
    if(t.kind==='procedure'){const counsel=v.tasks.find(x=>x.orderId===o.counselOrderId);if(counsel)expected.push(counsel.id);}
   }
   if(t.kind==='recovery'){const source=taskMap.get(t.sourceTaskId);expected=[...(source?.contextTaskIds||[]),t.sourceTaskId];}
   if(t.kind==='review')expected=[...new Set(v.tasks.filter(x=>x.kind!=='review'&&x.batch===t.batch).flatMap(x=>[...(x.contextTaskIds||[]),x.id]))];
   require(new Set(expected).size===t.contextTaskIds.length&&expected.every(id=>t.contextTaskIds.includes(id)),'gói bàn giao nối thừa/thiếu nhánh không liên quan.');
   if(t.kind==='review')require(v.orders.some(o=>o.batch===t.batch)&&v.orders.filter(o=>o.batch===t.batch).every(o=>o.status==='done'),'bác sĩ đọc khi kết quả chưa đủ.');
  }
  const batches=new Set();
  for(const o of v.orders){
   unique(o.id,'chỉ định');require(o.patientId===v.patientId&&o.visitId===v.id,'chỉ định bị gán khác khách/lượt.');
   require(o.origin===v.clinicId&&o.doctorId===v.doctorId&&['pending','recovery','done'].includes(o.status),'chỉ định sai nguồn/bác sĩ/trạng thái.');
   const source=taskMap.get(o.sourceTaskId);require(source&&['consult','review'].includes(source.kind)&&source.status==='done'&&source.issuedBatch===o.batch,'chỉ định không có quyết định bác sĩ tương ứng.');
   const service=v.tasks.filter(t=>t.orderId===o.id&&t.kind!=='recovery'),recovery=v.tasks.filter(t=>t.orderId===o.id&&t.kind==='recovery');
   require(service.length===1&&ROOMS.some(r=>r.id===o.target&&['imaging','counsel','procedure'].includes(r.type)),'chỉ định thiếu/trùng nơi thực hiện.');
   if(o.target==='procedure')require(v.orders.some(x=>x.id===o.counselOrderId&&x.target==='counsel'&&x.status==='done'),'can thiệp không có phiếu tư vấn liên quan.');
   if(service[0].status!=='done')require(o.status==='pending'&&!recovery.length,'chỉ định đã trả dù phòng chưa hoàn tất.');
   else if(o.target==='procedure'&&o.recoveryRequired){require(recovery.length===1,'thiếu/trùng phiếu hồi tỉnh.');require(recovery[0].status==='done'?o.status==='done':o.status==='recovery','trạng thái hồi tỉnh không khớp.');}
   else require(o.status==='done'&&!recovery.length,'phát sinh hồi tỉnh không có yêu cầu.');
   if(o.status==='done')require(o.result?.trim()&&isTimestamp(o.completedAt),'thiếu kết quả đã xác nhận.');
   batches.add(o.batch);
  }
  for(const batch of batches){const orders=v.orders.filter(o=>o.batch===batch),reviews=v.tasks.filter(t=>t.kind==='review'&&t.batch===batch);require(orders.every(o=>o.status==='done')?reviews.length===1:reviews.length===0,'phiếu đọc kết quả bị thiếu/trùng hoặc tạo quá sớm.');}
  for(const a of v.attachments||[]){
   unique(a.id,'file');require(a.visitId===v.id&&a.patientId===v.patientId,'file sai khách/lượt.');
   if(a.taskId){const t=taskMap.get(a.taskId);require(t&&t.status==='done'&&t.room===a.room&&(a.orderId||null)===(t.orderId||null),'file không khớp phiếu/kết quả đã bàn giao.');}
   else require(a.room==='reception'&&!a.orderId,'file không có nguồn tiếp nhận.');
  }
 }
 return true;
}

// Upgrade only structural links whose source can be reconstructed unambiguously.
// Never replace a link that is already present, even if it is wrong: assertFlow blocks it.
export function upgradeFlow(input){
 const s=structuredClone(input);if(s?.version!==1||!Array.isArray(s.visits)||!Array.isArray(s.patients))throw Error('Không đọc được dữ liệu cũ; giữ nguyên dữ liệu để kiểm tra.');
 if(s.schemaRevision===2){assertFlow(s);return s;}
 for(const v of s.visits){
  v.patientSnapshot??=structuredClone(s.patients.find(p=>p.id===v.patientId));v.intakeNote??='';v.safetyNote??='Chưa có cảnh báo được xác nhận trong dữ liệu cũ';
  const assessment=v.tasks.find(t=>t.kind==='assessment');
  for(const [i,t] of v.tasks.entries()){
   t.patientId??=v.patientId;t.visitId??=v.id;
   const previous=v.tasks.slice(0,i);
   if(t.kind==='assessment')t.contextTaskIds??=[];
   else if(t.kind==='consult'){t.sourceTaskId??=assessment?.id;t.contextTaskIds??=[t.sourceTaskId];}
   else if(t.kind==='review'){
    const inputs=previous.filter(x=>x.batch===t.batch);t.sourceTaskId??=inputs.at(-1)?.id;
    t.contextTaskIds??=[...new Set(inputs.flatMap(x=>[...(x.contextTaskIds||[]),x.id]))];
   }else{
    const o=v.orders.find(o=>o.id===t.orderId);
    const source=t.kind==='recovery'?previous.find(x=>x.kind==='procedure'&&x.orderId===t.orderId):previous.filter(x=>['consult','review'].includes(x.kind)).at(-1);
    t.sourceTaskId??=source?.id;
    t.contextTaskIds??=t.kind==='recovery'?[...(source?.contextTaskIds||[]),source?.id]:[assessment?.id,source?.id];
    if(o&&t.kind!=='recovery'){
     o.sourceTaskId??=source?.id;if(source)source.issuedBatch??=o.batch;
     if(o.target==='procedure'){o.counselOrderId??=v.orders.filter(x=>x.target==='counsel'&&x.status==='done').at(-1)?.id;const ct=previous.find(x=>x.orderId===o.counselOrderId);if(ct&&!t.contextTaskIds.includes(ct.id))t.contextTaskIds.push(ct.id);}
    }
   }
  }
  for(const o of v.orders){o.patientId??=v.patientId;o.visitId??=v.id;}
  for(const a of v.attachments||[]){a.patientId??=v.patientId;a.visitId??=v.id;}
  if(v.status==='closed')v.finalNote??=v.tasks.filter(t=>['consult','review'].includes(t.kind)&&t.status==='done').at(-1)?.note;
 }
 s.schemaRevision=2;s.revision??=0;assertFlow(s);return s;
}
