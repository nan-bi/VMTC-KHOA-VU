import test from 'node:test';
import assert from 'node:assert/strict';
import {blank,reducer,reportText} from '../src/features/speech/model.mjs';
import {deviceStamp,showTime} from '../src/features/speech/clock.mjs';
import {completedRecord,reviewedRecord} from '../src/features/speech/results.mjs';

const start=deviceStamp(new Date('2026-11-14T02:00:01.120Z'));
const end=deviceStamp(new Date('2026-11-14T02:10:02.200Z'));
const later=deviceStamp(new Date('2026-11-14T04:15:03.300Z'));
function filled(){
 let s=blank();for(const key of ['pid','visit','order','doctor'])s=reducer(s,{type:'patient',key,value:'TEST-'+key});
 s=reducer(s,{type:'begin',at:start});return reducer(s,{type:'append',text:'Không ghi nhận tổn thương vú trái. 8 x 5 mm. BI-RADS 3.'});
}
test('Device timestamps include local date, seconds, timezone and absolute time',()=>{
 const date=new Date('2026-11-14T02:00:01.120Z'),stamp=deviceStamp(date);
 assert.equal(stamp.iso,date.toISOString());assert.equal(stamp.offsetMinutes,-date.getTimezoneOffset());
 assert.match(stamp.local,/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:01$/);assert.ok(stamp.timeZone);
 assert.equal(showTime(null),'Chưa ghi nhận');assert.throws(()=>deviceStamp(new Date('invalid')));
});
test('Display uses the local time captured with a case, even on another timezone',()=>{
 assert.equal(showTime({iso:'2026-11-14T02:00:01Z',local:'14/11/2026 09:00:01',offsetMinutes:420,timeZone:'Asia/Saigon'}),'14/11/2026 09:00:01 (UTC+07:00)');
 assert.equal(showTime({local:'13/11/2026 20:30:01',offsetMinutes:-330}),'13/11/2026 20:30:01 (UTC-05:30)');
});
test('Start time is captured once, preserved across resumes, corrections and undo',()=>{
 let s=filled();s=reducer(s,{type:'begin',at:end});s=reducer(s,{type:'edit',value:'Nội dung sửa'});s=reducer(s,{type:'undo'});
 assert.deepEqual(s.startedAt,start);assert.equal(s.completedAt,null);
 const manual=reducer(blank(),{type:'edit',value:'Lời đọc nhập tay'});assert.ok(manual.startedAt.iso);
});
test('Completion saves a snapshot with pending doctor review, without requiring immediate review',()=>{
 const s=filled(),record=completedRecord(s,'CA-1',end);
 assert.equal(record.status,'pending');assert.equal(record.review,null);assert.deepEqual(record.completedAt,end);assert.deepEqual(record.startedAt,start);
 assert.equal(record.originalTranscript,s.transcript);assert.equal(s.completedAt,null);
 s.patient.pid='CHANGED';s.events[0].text='CHANGED';assert.equal(record.patient.pid,'TEST-pid');assert.notEqual(record.events[0].text,'CHANGED');
});
test('Secretary transcription check is distinct from case completion and doctor review',()=>{
 const s=reducer(filled(),{type:'review',value:true});assert.ok(s.transcriptionCheckedAt);assert.equal(s.completedAt,null);
 const record=completedRecord(s,'CA-1',end);assert.equal(record.reviewed,true);assert.equal(record.status,'pending');assert.equal(record.review,null);
});
test('Saved case is locked and cannot be saved or modified twice',()=>{
 const s=filled(),record=completedRecord(s,'CA-1',end),saved=reducer(s,{type:'saved',record});
 assert.equal(saved.savedId,'CA-1');assert.throws(()=>completedRecord(saved,'CA-2',later),/đã được lưu/);
 assert.deepEqual(reducer(saved,{type:'append',text:'Ca khác'}),saved);assert.deepEqual(reducer(saved,{type:'patient',key:'pid',value:'OTHER'}),saved);
 assert.deepEqual(reducer(saved,{type:'reset'}),blank());
});
test('A later doctor check preserves original transcript and completion timestamps',()=>{
 const record=completedRecord(filled(),'CA-1',end),changed='Nội dung đã được bác sĩ xác minh.';
 const checked=reviewedRecord(record,{doctor:' Bác sĩ A ',transcript:changed},later);
 assert.equal(checked.status,'reviewed');assert.equal(checked.revision,2);assert.equal(checked.review.doctor,'Bác sĩ A');assert.deepEqual(checked.review.at,later);
 assert.equal(checked.originalTranscript,record.transcript);assert.equal(checked.transcript,changed);assert.deepEqual(checked.completedAt,end);assert.deepEqual(record.review,null);
 assert.throws(()=>reviewedRecord(checked,{doctor:'B',transcript:'overwrite'},later),/đã được kiểm tra/);
});
test('Completion and review reject missing identity or blank clinical content',()=>{
 assert.throws(()=>completedRecord(blank(),'CA-1',end),/Chưa thể hoàn thành/);
 const record=completedRecord(filled(),'CA-1',end);
 assert.throws(()=>reviewedRecord(record,{doctor:' ',transcript:'x'},later),/Cần tên bác sĩ/);
 assert.throws(()=>reviewedRecord(record,{doctor:'A',transcript:' '},later),/Cần tên bác sĩ/);
});
test('Backward device clock is flagged, never silently rewritten',()=>{
 const record=completedRecord(filled(),'CA-1',deviceStamp(new Date('2026-11-14T01:00:00Z')));
 assert.match(record.clockWarning,/đồng hồ/);assert.equal(record.completedAt.iso,'2026-11-14T01:00:00.000Z');
 const normal=completedRecord(filled(),'CA-2',end),checked=reviewedRecord(normal,{doctor:'A',transcript:normal.transcript},start);
 assert.match(checked.clockWarning,/đồng hồ/);
});
test('Export retains patient identity and all captured case times, always as a draft',()=>{
 const record=completedRecord(filled(),'CA-1',end),checked=reviewedRecord(record,{doctor:'A',transcript:record.transcript},later);
 const text=reportText(checked);for(const stamp of [start,end,later])assert.ok(text.includes(showTime(stamp)));
 assert.match(text,/BẢN NHÁP/);assert.match(text,/Chưa ký bác sĩ/);assert.match(text,/TEST-pid/);assert.match(text,/A \(xác nhận nội bộ\)/);
});
