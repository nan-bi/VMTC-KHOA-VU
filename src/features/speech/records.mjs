import {missing} from './model.mjs';
import {deviceStamp} from './clock.mjs';

export function completedRecord(state,id,at=deviceStamp()) {
  const issues=missing(state);
  if(issues.length)throw Error('Chưa thể hoàn thành: '+issues.join(', '));
  if(state.savedId)throw Error('Ca này đã được lưu. Mở mục Kết quả để xem.');
  if(!id||!state.startedAt)throw Error('Ca chưa có mốc bắt đầu ghi.');
  return {schemaVersion:3,id,revision:1,patient:structuredClone(state.patient),transcript:state.transcript,originalTranscript:state.transcript,events:structuredClone(state.events),reviewed:state.reviewed,transcriptionCheckedAt:state.transcriptionCheckedAt,startedAt:state.startedAt,completedAt:at,status:'pending',review:null,clockWarning:Date.parse(at.iso)<Date.parse(state.startedAt.iso)?'Giờ hoàn thành sớm hơn giờ bắt đầu. Cần kiểm tra đồng hồ thiết bị.':null};
}
export function reviewedRecord(record,{doctor,transcript},at=deviceStamp()) {
  if(record.status!=='pending')throw Error('Kết quả đã được kiểm tra. Tải lại danh sách.');
  if(!doctor.trim()||!transcript.trim())throw Error('Cần tên bác sĩ kiểm tra và nội dung kết quả.');
  const changed=transcript!==record.transcript;
  return {...record,revision:record.revision+1,status:'reviewed',transcript,reviewed:changed?false:record.reviewed,transcriptionCheckedAt:changed?null:record.transcriptionCheckedAt,review:{doctor:doctor.trim(),at},clockWarning:record.clockWarning||(Date.parse(at.iso)<Date.parse(record.completedAt.iso)?'Giờ kiểm tra sớm hơn giờ hoàn thành. Cần kiểm tra đồng hồ thiết bị.':null)};
}

export function hasDraftContent(state){return !state.savedId&&!!(state.transcript.trim()||state.startedAt||['pid','visit','order','name','doctor'].some(k=>state.patient[k].trim()));}
export function draftSnapshot(state){return structuredClone({...state,history:[]});}
