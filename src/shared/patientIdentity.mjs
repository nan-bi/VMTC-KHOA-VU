import {isDateOnly,businessDate,integer} from './dataRules.mjs';
// Keep accents: accent-insensitive matching can join different Vietnamese names.
export const identityName=value=>typeof value==='string'?value.normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase():'';
export function birthDate(value){
 if(typeof value!=='string')return null;
 const text=value.trim(),m=text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/),day=m?`${m[3]}-${m[2]}-${m[1]}`:text;
 return isDateOnly(day)?day:null;
}
export function identityProfile(row){
 const name=identityName(row.patient_name),dob=birthDate(row.patient_dob),day=businessDate(row.ordered_at);
 const age=integer(row.patient_age)&&+row.patient_age>=0&&+row.patient_age<=130?+row.patient_age:null;
 let expected=null;
 if(dob&&day){expected=+day.slice(0,4)-+dob.slice(0,4)-(day.slice(5)<dob.slice(5)?1:0);}
 const mismatch=expected!=null&&(expected<0||expected>130||(age!=null&&expected!==age));
 return {name,dob,age,mismatch,complete:!!name&&!!dob&&age!=null&&expected!=null&&!mismatch};
}
export function patientGroupKey(row){
 const p=identityProfile(row);
 // Unverified rows never become a single case merely because PID/visit match.
 return JSON.stringify(p.complete?['VERIFIED',row.patient_id,p.name,p.dob]:['SEPARATE',row.patient_id,row.visit_id,row.order_id,row.source_file??null,row.source_sheet??null,row.source_row??null]);
}
export function identityReview(rows){
 const groups=new Map();
 rows.forEach((row,index)=>{if(!row||typeof row.patient_id!=='string')return;if(!groups.has(row.patient_id))groups.set(row.patient_id,[]);groups.get(row.patient_id).push({row,index,...identityProfile(row)});});
 const notes=[];
 for(const [pid,items] of groups){
  const names=new Set(items.map(p=>p.name).filter(Boolean)),dates=new Set(items.map(p=>p.dob).filter(Boolean));
  const conflict=names.size>1||dates.size>1||items.some(p=>p.mismatch);
  const incomplete=items.some(p=>!p.complete);
  if(!conflict&&!(items.length>1&&incomplete))continue;
  const profiles=[...new Set(items.map(p=>JSON.stringify([p.name,p.dob,p.age,businessDate(p.row.ordered_at)])))].sort();
  notes.push({key:JSON.stringify([pid,profiles,items.length]),patient_id:pid,status:conflict?'CONFLICT':'INCOMPLETE',count:items.length,rowIndices:items.map(p=>p.index),message:conflict?'PID có tên/ngày sinh khác nhau hoặc tuổi không khớp ngày sinh; giữ riêng các hồ sơ.':'PID lặp nhưng thiếu tên, tuổi hoặc ngày sinh đầy đủ; chưa đủ căn cứ gộp hồ sơ.',profiles:[...new Set(items.map(p=>`${p.row.patient_name||'Thiếu tên'} · ${p.row.patient_dob||'Thiếu ngày sinh'} · tuổi ${p.row.patient_age??'chưa có'}`))]});
 }
 return notes;
}
export function validateIdentityNotes(notes=[]){
 if(!Array.isArray(notes)||notes.length>2000)throw Error('Tối đa 2.000 ghi chú định danh.');
 const seen=new Set();for(const n of notes){if(!n||typeof n.key!=='string'||n.key.length>100000||typeof n.note!=='string'||n.note.trim().length<8||n.note.length>2000||!['OPEN','REVIEWED'].includes(n.status)||seen.has(n.key))throw Error('Ghi chú cần nội dung ít nhất 8 ký tự, trạng thái hợp lệ và không trùng.');seen.add(n.key);}
}
