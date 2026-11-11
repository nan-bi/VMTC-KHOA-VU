import {ROOMS,roomName,handoverFor} from '../patients/patientFlow.mjs';
export const ACCOUNTS=[
 {id:'reception',name:'Lễ tân / tiếp đón',room:'reception',scope:'Tạo hồ sơ, cập nhật thông tin hành chính, gửi Đánh giá ban đầu'},
 ...ROOMS.map(r=>({id:r.id,name:r.type==='clinic'?`Bác sĩ · ${r.name}`:`Nhân viên · ${r.name}`,room:r.id,scope:r.type==='clinic'?'Khám, chỉ định, đọc kết quả và kết thúc lượt của phòng mình':r.type==='assessment'?'Đánh giá tất cả bệnh nhân, chọn một trong 4 phòng khám':'Nhận phiếu được chỉ định, nhập kết quả / đính kèm file, xác nhận bàn giao'})),
 {id:'coordinator',name:'Điều phối · chỉ xem',room:null,scope:'Theo dõi các phòng, lịch sử bàn giao; không sửa nội dung chuyên môn'}
];
export function accountFor(id){const a=ACCOUNTS.find(a=>a.id===id);if(!a)throw Error('Tài khoản phòng không hợp lệ.');return a;}
const known=a=>!!a&&ACCOUNTS.some(x=>x.id===a.id&&x.room===a.room);
export function canSeeVisit(account,v){return known(account)&&(!account.room||account.room==='reception'||v.clinicId===account.room||v.tasks.some(t=>t.room===account.room));}
export function canReadAttachment(account,v,a){
 if(!canSeeVisit(account,v)||a.patientId!==v.patientId||a.visitId!==v.id)return false;
 const room=account.room;if(!room)return false;
 if(a.taskId){const source=v.tasks.find(t=>t.id===a.taskId);if(!source||source.room!==a.room||source.status!=='done'||(source.orderId||null)!==(a.orderId||null))return false;}
 else if(a.room!=='reception'||a.orderId)return false;
 if(room===v.clinicId)return true;
 if(room==='reception')return a.room==='reception';
 if(a.room==='reception')return v.tasks.some(t=>t.room===room);
 return v.tasks.some(t=>t.room===room&&(t.id===a.taskId||t.contextTaskIds?.includes(a.taskId)));
}
export function projectVisit(account,v){
 if(!canSeeVisit(account,v))return null;
 const n=structuredClone(v),room=account.room;
 n.orderSummary={total:v.orders.length,done:v.orders.filter(o=>o.status==='done').length,pending:v.orders.filter(o=>o.status!=='done').length};
 n.attachments=(n.attachments||[]).filter(a=>canReadAttachment(account,v,a));
 n.tasks=n.tasks.map(t=>({...t,handover:handoverFor(v,t)}));
 if(room===v.clinicId)return n;
 if(!room||room==='reception'){
  n.orders=[];n.safetyNote=undefined;n.finalNote=undefined;
  n.tasks=n.tasks.map(({note,handover,contextTaskIds,...t})=>t);
  n.history=room==='reception'?n.history.filter(h=>h.actor==='Tiếp đón'||h.actor===account.name):[];
  return n;
 }
 const ownTasks=v.tasks.filter(t=>t.room===room);
 n.orders=n.orders.filter(o=>o.target===room||ownTasks.some(t=>t.orderId===o.id));
 n.orderSummary={total:n.orders.length,done:n.orders.filter(o=>o.status==='done').length,pending:n.orders.filter(o=>o.status!=='done').length};
 n.tasks=n.tasks.filter(t=>t.room===room);n.finalNote=undefined;
 n.history=n.history.filter(h=>h.actor===roomName(room)||h.actor===account.name);
 return n;
}
export function assertAction(account,action,v,taskId){
 if(!known(account))throw Error('Tài khoản phòng không hợp lệ.');
 if(action==='register'||action==='updatePatient'){if(account.room!=='reception')throw Error('Chỉ tài khoản Lễ tân được cập nhật thông tin hành chính.');return;}
 const t=v?.tasks.find(t=>t.id===taskId);
 if(!account.room||!t||t.room!==account.room)throw Error('Tài khoản không được xử lý phiếu của phòng khác.');
}
