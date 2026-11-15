import {deviceStamp,showTime} from './clock.mjs';
export const blank = () => ({patient:{pid:'',visit:'',order:'',name:'',doctor:'',room:'Siêu âm vú 1'},transcript:'',events:[],history:[],reviewed:false,startedAt:null,transcriptionCheckedAt:null,completedAt:null,savedId:null});
export function missing(state) {
 return [['pid','PID'],['visit','Mã lượt'],['order','Mã chỉ định'],['doctor','Bác sĩ đọc']].filter(([k])=>!state.patient[k].trim()).map(([,v])=>v).concat(state.transcript.trim()?[]:['Nội dung lời đọc']);
}
export function reducer(state,action) {
 if(action.type==='reset')return blank();
 if(action.type==='restore')return {...blank(),...action.state,history:[],savedId:null,completedAt:null};
 if(action.type==='saved')return {...state,savedId:action.record.id,completedAt:action.record.completedAt};
 if(state.savedId)return state;
 if(action.type==='begin')return {...state,startedAt:state.startedAt||action.at||deviceStamp()};
 if(action.type==='review'){const reviewed=action.value&&missing(state).length===0;return {...state,reviewed,transcriptionCheckedAt:reviewed?deviceStamp():null};}
 if(action.type==='undo') {
  const prev=state.history.at(-1);
  return prev?{...state,...prev,history:state.history.slice(0,-1),reviewed:false,transcriptionCheckedAt:null}:state;
 }
 if(!['append','edit','patient'].includes(action.type))return state;
 if(action.type==='append'&&!action.text.trim())return state;
 const history=[...state.history,{patient:state.patient,transcript:state.transcript,events:state.events}].slice(-100);
 const next={...state,history,reviewed:false,transcriptionCheckedAt:null};
 if(action.type==='patient')return {...next,patient:{...state.patient,[action.key]:action.value}};
 const transcript=action.type==='edit'?action.value:state.transcript+(state.transcript&&!/\s$/.test(state.transcript)?' ':'')+action.text;
 const event={text:action.type==='edit'?action.value:action.text,source:action.type==='edit'?'Sửa tay':'Lời đọc',at:new Date().toISOString()};
 const events=action.type==='edit'&&state.events.at(-1)?.source==='Sửa tay'?[...state.events.slice(0,-1),event]:[...state.events,event];
 return {...next,transcript,startedAt:state.startedAt||deviceStamp(),events};
}
export function reportText(state) {
 return ['PHIẾU SIÊU ÂM VÚ — BẢN NHÁP','Chưa ký bác sĩ; chưa phải kết quả chính thức.',`Soát bản chép: ${state.reviewed?'Đã soát nội dung':'Chưa soát'}`,`Bác sĩ kiểm tra: ${state.status==='reviewed'?state.review?.doctor+' (xác nhận nội bộ)':'Chờ bác sĩ kiểm tra'}`,`PID: ${state.patient.pid} | Lượt: ${state.patient.visit} | Chỉ định: ${state.patient.order}`,`Họ tên: ${state.patient.name}`,`Phòng: ${state.patient.room} | Bác sĩ đọc: ${state.patient.doctor}`,`Bắt đầu ghi: ${showTime(state.startedAt)}`,`Hoàn thành ca: ${showTime(state.completedAt)}`,`Soát bản chép: ${showTime(state.transcriptionCheckedAt)}`,`Bác sĩ kiểm tra lúc: ${showTime(state.review?.at)}`,'\nNỘI DUNG LỜI ĐỌC\n'+(state.transcript||'[Chưa ghi nhận]'),'\nThời gian tự ghi theo đồng hồ thiết bị tại từng thao tác.'].join('\n');
}
