import {isDateOnly,identifier} from '../../shared/dataRules.mjs';
// Explicit routing graph for the demonstration. No clinical decisions are inferred.
export const ROOMS = [
  {id:'assessment',name:'Đánh giá ban đầu',group:'Tiếp nhận',type:'assessment',short:'ĐGBĐ'},
  ...[1,2,3,4].map(n=>({id:`clinic-${n}`,name:`Phòng khám ${n}`,group:'Khám',type:'clinic',short:`PK ${n}`})),
  {id:'us-3d',name:'Siêu âm vú 3D',group:'Chẩn đoán hình ảnh',type:'imaging',short:'SA 3D',service:'Siêu âm vú 3D'},
  {id:'us-1',name:'Siêu âm vú thường 1',group:'Chẩn đoán hình ảnh',type:'imaging',short:'SA 1',service:'Siêu âm vú thường'},
  {id:'us-2',name:'Siêu âm vú thường 2',group:'Chẩn đoán hình ảnh',type:'imaging',short:'SA 2',service:'Siêu âm vú thường'},
  {id:'xray',name:'XQ vú',group:'Chẩn đoán hình ảnh',type:'imaging',short:'XQ',service:'XQ vú'},
  {id:'counsel',name:'Tư vấn can thiệp',group:'Can thiệp & theo dõi',type:'counsel',short:'TVCT',service:'Tư vấn can thiệp'},
  {id:'procedure',name:'Can thiệp',group:'Can thiệp & theo dõi',type:'procedure',short:'CT',service:'Thực hiện can thiệp'},
  {id:'recovery',name:'Hồi tỉnh',group:'Can thiệp & theo dõi',type:'recovery',short:'HT'},
];
export const roomName=id=>ROOMS.find(r=>r.id===id)?.name||id;
export const DOCTORS=[1,2,3,4].map(n=>({id:`BS-DEMO-0${n}`,name:`BS mẫu ${n}`,room:`clinic-${n}`}));
export const doctorName=id=>DOCTORS.find(d=>d.id===id)?.name||'Chưa phân bác sĩ';
export const STATUS={waiting:'Chờ tiếp nhận',active:'Đang thực hiện',done:'Hoàn thành'};
const now=()=>new Date().toISOString();
const uid=prefix=>`${prefix}-${globalThis.crypto.randomUUID().toUpperCase()}`;
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const log=(v,actor,action)=>v.history.push({time:now(),actor,action});
const addTask=(v,room,kind,extra={})=>{const task={id:uid('T'),room,kind,status:'waiting',createdAt:now(),patientId:v.patientId,visitId:v.id,contextTaskIds:[],...extra};v.tasks.push(task);return task;};
const getVisit=(s,id)=>{const v=s.visits.find(v=>v.id===id);assert(v,'Không tìm thấy lượt khám.');assert(v.status!=='closed','Lượt khám đã kết thúc.');return v;};
const getTask=(v,id)=>{const t=v.tasks.find(t=>t.id===id);assert(t,'Không tìm thấy phiếu tiếp nhận.');return t;};
const finish=(t,note)=>{assert(t.status==='active','Phải tiếp nhận bệnh nhân trước khi hoàn tất.');assert(note?.trim(),'Cần ghi nội dung bàn giao hoặc kết quả.');t.status='done';t.completedAt=now();t.note=note.trim();};

export function emptyFlow(){return {version:1,schemaRevision:2,revision:0,patients:[],visits:[]};}
export function register(s,{patientId,alias,birthYear,date,intakeNote=''}){
 assert(isDateOnly(date),'Ngày tiếp nhận không hợp lệ.');
 let patient=s.patients.find(p=>p.id===patientId);
 if(patientId)assert(patient,'Mã bệnh nhân chưa được đăng ký.');
 if(!patient){assert(typeof alias==='string'&&alias.trim().length>0&&alias.trim().length<=80,'Cần tên hiển thị giả lập tối đa 80 ký tự.');assert(Number.isInteger(+birthYear)&&+birthYear>=1900&&+birthYear<=+date.slice(0,4),'Năm sinh không hợp lệ.');patient={id:uid('BN'),alias:alias.trim(),birthYear:+birthYear};s.patients.push(patient);}
 assert(!s.visits.some(v=>v.patientId===patient.id&&v.date===date&&v.status!=='closed'),'Bệnh nhân đã có lượt khám đang mở trong ngày này.');
 const v={id:uid('LK'),patientId:patient.id,date,clinicId:null,doctorId:null,status:'open',patientSnapshot:structuredClone(patient),intakeNote:String(intakeNote||'').trim(),tasks:[],orders:[],history:[],createdAt:now()};
 addTask(v,'assessment','assessment');log(v,'Tiếp đón','Tạo lượt khám và chuyển Đánh giá ban đầu.');s.visits.push(v);return v.id;
}
export function startTask(s,visitId,taskId,station){
 const v=getVisit(s,visitId),t=getTask(v,taskId);
 assert(station===t.room,'Trạm hiện tại không được tiếp nhận phiếu của phòng khác.');
 assert(t.status==='waiting','Phiếu không còn ở trạng thái chờ.');
 assert(!s.visits.some(other=>other.patientId===v.patientId&&other.tasks.some(x=>x.status==='active')),'Bệnh nhân đang được xử lý ở phòng khác; cần hoàn tất bàn giao trước.');
 assert(!s.visits.some(x=>x.tasks.some(y=>y.room===t.room&&y.status==='active')),'Phòng đang phục vụ một bệnh nhân; hãy hoàn tất ca hiện tại.');
 t.status='active';t.startedAt=now();log(v,roomName(station),`Tiếp nhận phiếu ${t.id}.`);
}
export function completeAssessment(s,visitId,taskId,clinicId,note,station,{safetyNote='Chưa xác nhận thông tin cảnh báo trong demo'}={}){
 const v=getVisit(s,visitId),t=getTask(v,taskId);
 assert(t.kind==='assessment'&&t.room===station&&station==='assessment','Chỉ phòng Đánh giá ban đầu được thực hiện bàn giao này.');
 assert(ROOMS.some(r=>r.id===clinicId&&r.type==='clinic'),'Chỉ được phân vào một trong 4 phòng khám.');
 assert(typeof safetyNote==='string'&&safetyNote.trim(),'Cần ghi nhận tình trạng cảnh báo hoặc chưa xác nhận.');
 finish(t,note);v.safetyNote=safetyNote.trim();v.clinicId=clinicId;v.doctorId=DOCTORS.find(d=>d.room===clinicId).id;addTask(v,clinicId,'consult',{assignedDoctorId:v.doctorId,sourceTaskId:t.id,contextTaskIds:[t.id]});log(v,roomName(station),`Hoàn tất đánh giá; phân ${roomName(clinicId)}, ${doctorName(v.doctorId)}. ${note}`);
}
export function issueOrders(s,visitId,taskId,targets,note,station,{recoveryRequired=true}={}){
 const v=getVisit(s,visitId),t=getTask(v,taskId);
 assert(station===v.clinicId&&t.room===station&&['consult','review'].includes(t.kind),'Chỉ bác sĩ tại phòng khám phụ trách được ra chỉ định.');
 assert(t.assignedDoctorId===v.doctorId,'Phiếu không thuộc bác sĩ phụ trách của lượt khám.');
 assert(t.status==='active','Cần tiếp nhận khám trước khi ra chỉ định.');
 assert(Array.isArray(targets)&&targets.length,'Chọn ít nhất một chỉ định cụ thể.');
 assert(new Set(targets).size===targets.length,'Không chọn trùng phòng.');
 const rooms=targets.map(id=>ROOMS.find(r=>r.id===id));
 assert(rooms.every(r=>r&&['imaging','counsel','procedure'].includes(r.type)),'Không có luồng trực tiếp từ phòng khám tới phòng này.');
 assert(rooms.every(r=>r.type==='imaging')||rooms.length===1,'Chỉ định CĐHA có thể song song; tư vấn và can thiệp phải là bước riêng.');
 assert(!(targets.includes('us-1')&&targets.includes('us-2')),'Hai phòng siêu âm thường là hai nơi thực hiện cùng loại dịch vụ; chỉ chọn một phòng.');
 assert(!rooms.some(r=>r.type==='procedure')||v.orders.some(o=>o.target==='counsel'&&o.status==='done'),'Cần hoàn thành tư vấn can thiệp, bác sĩ xem kết quả rồi mới ra chỉ định can thiệp.');
 assert(!targets.some(target=>v.orders.some(o=>o.status!=='done'&&o.target===target)),'Đã có chỉ định còn chờ tại phòng được chọn.');
 assert(!v.tasks.some(x=>x.id!==t.id&&x.status!=='done')&&v.orders.every(o=>o.status==='done'),'Còn chỉ định hoặc bàn giao chưa hoàn thành trong đợt trước.');
 finish(t,note);const batch=uid('DOT');t.issuedBatch=batch;
 for(const r of rooms){const order={id:uid('CD'),patientId:v.patientId,visitId:v.id,sourceTaskId:t.id,target:r.id,service:r.service,origin:v.clinicId,doctorId:v.doctorId,batch,status:'pending',note:note.trim(),createdAt:now(),recoveryRequired:r.type==='procedure'?!!recoveryRequired:false};if(r.type==='procedure')order.counselOrderId=[...v.orders].reverse().find(o=>o.target==='counsel'&&o.status==='done').id;
 const assessment=v.tasks.find(x=>x.kind==='assessment');const counselTask=order.counselOrderId?v.tasks.find(x=>x.orderId===order.counselOrderId):null;
 v.orders.push(order);addTask(v,r.id,r.type,{orderId:order.id,batch,sourceTaskId:t.id,contextTaskIds:[assessment.id,t.id,...(counselTask?[counselTask.id]:[])]});}
 log(v,`${doctorName(v.doctorId)} · ${roomName(station)}`,`Ra ${rooms.length} chỉ định: ${rooms.map(r=>r.name).join(', ')}. ${note}`);
}
export function completeService(s,visitId,taskId,note,station,{handoverConfirmed=false}={}){
 const v=getVisit(s,visitId),t=getTask(v,taskId);
 assert(t.room===station&&['imaging','counsel','procedure','recovery'].includes(t.kind),'Trạm không được ghi kết quả cho phiếu này.');
 const order=v.orders.find(o=>o.id===t.orderId);assert(order,'Phiếu phải gắn với chỉ định bác sĩ.');
 assert(order.origin===v.clinicId&&order.doctorId===v.doctorId&&order.batch===t.batch,'Phiếu không khớp bác sĩ hoặc đợt chỉ định.');
 assert((t.kind==='recovery'&&order.target==='procedure'&&order.status==='recovery'&&order.recoveryRequired)||(t.kind!=='recovery'&&order.target===station&&order.status==='pending'),'Phiếu không khớp nơi thực hiện hoặc trạng thái chỉ định.');
 if(['procedure','recovery'].includes(t.kind))assert(handoverConfirmed,'Cần xác nhận bàn giao chuyên môn trước khi chuyển bước.');
 finish(t,note);
 if(t.kind==='procedure'&&order.recoveryRequired){order.status='recovery';order.procedureResult=note.trim();addTask(v,'recovery','recovery',{orderId:order.id,batch:order.batch,sourceTaskId:t.id,contextTaskIds:[...t.contextTaskIds,t.id]});log(v,roomName(station),`Ghi kết quả ${order.id}; bàn giao Hồi tỉnh theo yêu cầu theo dõi của bác sĩ.`);return;}
 order.status='done';order.result=note.trim();order.completedAt=now();
 const batchDone=v.orders.filter(o=>o.batch===order.batch).every(o=>o.status==='done');
 if(batchDone){addTask(v,order.origin,'review',{batch:order.batch,assignedDoctorId:order.doctorId,sourceTaskId:t.id,contextTaskIds:[...new Set(v.tasks.filter(x=>x.batch===order.batch).flatMap(x=>[...(x.contextTaskIds||[]),x.id]))]});log(v,roomName(station),`Hoàn thành ${order.id}; đủ kết quả đợt ${order.batch}, gửi về ${doctorName(order.doctorId)} tại ${roomName(order.origin)} đọc kết quả.`);}
 else log(v,roomName(station),`Có kết quả ${order.id}; đã hiển thị tại ${roomName(order.origin)}, còn chờ kết quả khác cùng đợt.`);
}
export function closeVisit(s,visitId,taskId,note,station){
 const v=getVisit(s,visitId),t=getTask(v,taskId);
 assert(station===v.clinicId&&t.room===station&&['consult','review'].includes(t.kind),'Chỉ bác sĩ phụ trách được kết thúc lượt khám.');
 assert(t.assignedDoctorId===v.doctorId,'Phiếu không thuộc bác sĩ phụ trách.');
 assert(v.orders.every(o=>o.status==='done')&&!v.tasks.some(x=>x.id!==t.id&&x.status!=='done'),'Còn chỉ định hoặc bàn giao chưa hoàn thành.');
 finish(t,note);v.status='closed';v.finalNote=note.trim();v.closedAt=now();log(v,roomName(station),`Kết thúc lượt khám theo xác nhận của bác sĩ. ${note}`);
}
export function seedFlow(date='2026-10-23'){
 const s=emptyFlow();
 const id=register(s,{alias:'Bệnh nhân mẫu 01',birthYear:1986,date});
 const id2=register(s,{alias:'Bệnh nhân mẫu 02',birthYear:1974,date});
 const v=s.visits.find(v=>v.id===id2);startTask(s,id2,v.tasks[0].id,'assessment');completeAssessment(s,id2,v.tasks[0].id,'clinic-2','Đã xác nhận thông tin và hoàn tất đánh giá ban đầu (giả lập).','assessment');
 const id3=register(s,{alias:'Bệnh nhân mẫu 03',birthYear:1992,date});
 const v3=s.visits.find(v=>v.id===id3);startTask(s,id3,v3.tasks[0].id,'assessment');completeAssessment(s,id3,v3.tasks[0].id,'clinic-1','Đánh giá ban đầu hoàn tất (giả lập).','assessment');startTask(s,id3,v3.tasks[1].id,'clinic-1');issueOrders(s,id3,v3.tasks[1].id,['us-1','xray'],'Phiếu chỉ định mẫu do bác sĩ xác nhận, không suy diễn từ triệu chứng.','clinic-1');
 return s;
}

export function updatePatient(s,visitId,{alias,birthYear}){
 const v=getVisit(s,visitId),p=s.patients.find(p=>p.id===v.patientId);
 assert(typeof alias==='string'&&alias.trim().length>0&&alias.trim().length<=80,'Tên mẫu phải từ 1 đến 80 ký tự.');
 assert(Number.isInteger(+birthYear)&&+birthYear>=1900&&+birthYear<=+v.date.slice(0,4),'Năm sinh không hợp lệ.');
 const before=structuredClone(v.patientSnapshot||p);p.alias=alias.trim();p.birthYear=+birthYear;
 v.patientSnapshot=structuredClone(p);
 v.history.push({time:now(),actor:'Tiếp đón',action:'Cập nhật thông tin hành chính của lượt hiện tại; giữ nguyên lịch sử các lượt khác.',before,after:structuredClone(p)});
}
export function handoverFor(v,t){
 return {patientId:v.patientId,visitId:v.id,orderId:t.orderId||null,intakeNote:v.intakeNote||'',safetyNote:v.safetyNote||'Chưa xác nhận',
  steps:(t.contextTaskIds||[]).map(id=>v.tasks.find(x=>x.id===id)).filter(Boolean).map(x=>({taskId:x.id,room:x.room,kind:x.kind,note:x.note||'',orderId:x.orderId||null}))};
}
