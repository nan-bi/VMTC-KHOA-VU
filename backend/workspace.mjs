import {isDeepStrictEqual as equal} from 'node:util';
import {randomUUID} from 'node:crypto';
import {validate,aggregate} from '../src/features/reports/core.mjs';
import {EDIT_FIELDS,editedRow} from '../src/features/dataWorkspace/dataModel.mjs';
import {validateRates,serviceRevenueSnapshot} from '../src/features/reports/serviceCalculation.mjs';
import {transaction,audit} from './database.mjs';
export class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
const fail=(message,status=400)=>{throw new HttpError(status,message)};
const json=value=>JSON.stringify(value);
export function getWorkspace(db){const r=db.prepare('SELECT payload FROM workspace WHERE id=1').get();return r?JSON.parse(r.payload):null;}
export function seedWorkspace(db,state){if(!getWorkspace(db))db.prepare('INSERT INTO workspace VALUES(1,?,?,?)').run(state.revision||0,json(state),new Date().toISOString());}
const without=(object,fields)=>Object.fromEntries(Object.entries(object||{}).filter(([key])=>!fields.includes(key)));
export function updateWorkspace(db,{expectedRevision,state:next},user,catalog){return transaction(db,()=>{
 const current=getWorkspace(db);if(expectedRevision!==current.revision)fail('Dữ liệu đã đổi ở phiên khác. Tải lại trước khi lưu.',409);
 if(!['admin','editor','reviewer'].includes(user.role))fail('Tài khoản chỉ được xem dữ liệu.',403);
 if(!next||next.version!==1||next.revision!==current.revision||!Array.isArray(next.rows)||next.rows.length>100000||!Array.isArray(next.excluded)||!Array.isArray(next.imports)||!Array.isArray(next.hashes)||!Array.isArray(next.logs))fail('Cấu trúc dữ liệu không hợp lệ.');
 if(Object.keys(next).some(key=>!['version','revision','rows','excluded','imports','hashes','logs','report','archivedReports','skippedDuplicates','dataEdits','serviceCalculation','calculationHistory','installedDemoBatches'].includes(key)))fail('Trường trạng thái không được hỗ trợ.');
 if(next.rows.some(r=>!r||typeof r!=='object'||Array.isArray(r)))fail('Dòng dữ liệu không hợp lệ.');
 if(next.excluded.some(i=>!Number.isInteger(i)||i<0||i>=next.rows.length)||new Set(next.excluded).size!==next.excluded.length)fail('Danh sách loại dòng không hợp lệ.');
 const sourceKeys=['rows','excluded','imports','hashes','skippedDuplicates','serviceCalculation','installedDemoBatches'];
 const sourceChanged=sourceKeys.some(key=>!equal(next[key],current[key]));
 if(sourceChanged&&(!['admin','editor'].includes(user.role)||current.report))fail('Không được đổi nguồn: thiếu quyền hoặc báo cáo đang khóa.',403);
 if(next.rows.length<current.rows.length)fail('Không được xóa nguồn bằng thao tác ghi trạng thái.');
 const editedIndices=[];
 for(let i=0;i<current.rows.length;i++)if(!equal(current.rows[i],next.rows[i])){
  const before=current.rows[i],after=next.rows[i];
  if(!after||typeof after!=='object')fail('Dòng dữ liệu không hợp lệ.');
  const patch=Object.fromEntries(EDIT_FIELDS.filter(key=>!equal(before[key],after[key])).map(key=>[key,after[key]]));
  let computed;try{computed=editedRow(before,patch,catalog)}catch(e){fail(e.message)}
  if(!equal(computed,after))fail('Chỉ được sửa các trường nghiệp vụ; mã liên kết, nguồn và thành tiền phải hợp lệ.');
  const checked=validate([after],catalog);if(checked.issues.length)fail(checked.issues[0].reasons.join('; '));
  editedIndices.push(i);
 }
 // Histories are append-only. The database audit is authoritative and independent of browser logs.
 for(const key of ['dataEdits','calculationHistory']){
  const old=current[key]||[],history=next[key]||[];if(!Array.isArray(history)||history.length<old.length||!equal(history.slice(history.length-old.length),old)){
   if(old.length||!Array.isArray(history))fail('Không được sửa hoặc xóa lịch sử.');
  }
  const added=history.slice(0,history.length-old.length);if(added.some(e=>typeof e.reason!=='string'||e.reason.trim().length<8))fail('Thiếu lý do thay đổi.');
  if(added.length&&!sourceChanged)fail('Lịch sử thay đổi không khớp nguồn.');
  for(const e of added){e.actor=user.username;e.time=new Date().toISOString();}
 }
 if(sourceChanged&&next.rows.slice(0,current.rows.length).some((r,i)=>!equal(r,current.rows[i]))&&!(next.dataEdits?.length>(current.dataEdits?.length||0)))fail('Sửa dòng phải có lịch sử và lý do.');
 const addedEdits=(next.dataEdits||[]).slice(0,(next.dataEdits?.length||0)-(current.dataEdits?.length||0));
 if(addedEdits.length!==editedIndices.length)fail('Lịch sử sửa không khớp số dòng thay đổi.');
 if(editedIndices.length)next.dataEdits=[...editedIndices.map(index=>{
  const note=addedEdits.find(e=>e.index===index);if(!note)fail('Thiếu lý do sửa cho dòng dữ liệu.');const before=current.rows[index],after=next.rows[index];
  return {id:randomUUID(),index,order_id:before.order_id,source_file:before.source_file,source_sheet:before.source_sheet||'CANONICAL',source_row:before.source_row,actor:user.username,time:new Date().toISOString(),reason:note.reason.trim(),changes:Object.keys(after).filter(key=>!equal(before[key],after[key])).map(field=>({field,before:before[field]??null,after:after[field]??null}))};
 }),...(current.dataEdits||[])];
 if(!equal(next.serviceCalculation,current.serviceCalculation)){
  const c=next.serviceCalculation;if(!c||!c.packageTypes||!c.serviceKinds||Object.values(c.packageTypes).some(v=>!['SKTQ','SLUT1','SLUT2','OTHER','UNKNOWN'].includes(v))||Object.values(c.serviceKinds).some(v=>!['EXAM','US','XR2','XR3','OTHER'].includes(v)))fail('Cấu hình bóc tách không hợp lệ.');
  try{validateRates(c.rates,catalog)}catch(e){fail(e.message)}
  if(!(next.calculationHistory?.length>(current.calculationHistory?.length||0)))fail('Thay đổi quy tắc cần lịch sử và lý do.');
  next.calculationHistory=[{time:new Date().toISOString(),actor:user.username,reason:next.calculationHistory[0].reason,before:current.serviceCalculation||null,after:structuredClone(c)},...(current.calculationHistory||[])];
 }
 const old=current.report,r=next.report,oldArchives=current.archivedReports||[],archives=next.archivedReports||[];
 if(!Array.isArray(archives)||!equal(archives.slice(0,oldArchives.length),oldArchives))fail('Không được sửa báo cáo lưu trữ.');
 if(!old&&r){
  if(!['admin','editor'].includes(user.role)||r.status!=='draft'||sourceChanged)fail('Không được tạo snapshot bằng thao tác này.',403);
  const checked=validate(current.rows.filter((_,i)=>!current.excluded.includes(i)),catalog);if(checked.issues.length)fail('Cần xử lý lỗi trước khi chốt.');
  let stats;try{stats=aggregate(checked.valid,catalog,r.week,r.end)}catch(e){fail(e.message)}
  next.report={id:'SN-'+randomUUID(),version:1,rulesVersion:'SIM-2',timezone:'Asia/Ho_Chi_Minh',sourceRevision:current.revision,excludedCount:current.excluded.length,week:r.week,end:r.end,createdAt:new Date().toISOString(),status:'draft',creator:user.username,stats,serviceRevenue:serviceRevenueSnapshot(stats.completed,current.serviceCalculation),narrative:'',ack:false};
 }else if(old&&!r){
  if(!['admin','editor'].includes(user.role))fail('Không được mở kỳ mới.',403);
  if(old.status==='draft'){if(archives.length!==oldArchives.length)fail('Không lưu trữ bản nháp bằng thao tác này.');}
  else if(old.status==='approved'){if(archives.length!==oldArchives.length+1||!equal(archives.at(-1),old))fail('Phải lưu nguyên báo cáo đã duyệt trước khi mở kỳ mới.');}
  else fail('Báo cáo đang chờ duyệt chưa thể bỏ.');
 }else if(old&&r&&!equal(old,r)){
  if(!equal(without(old,['status','narrative','approvedAt','version']),without(r,['status','narrative','approvedAt','version'])))fail('Snapshot cố định, không được thay số liệu hoặc kỳ.');
  if(old.status==='approved')fail('Báo cáo đã duyệt không được chỉnh sửa.');
  if(old.status==='draft'){
   if(!['admin','editor'].includes(user.role)||!['draft','submitted'].includes(r.status)||r.version!==old.version||r.approvedAt!==old.approvedAt)fail('Chuyển trạng thái không được phép.',403);
  }else{
   if(!['admin','reviewer'].includes(user.role)||!['draft','approved'].includes(r.status)||r.narrative!==old.narrative||r.version!==(r.status==='draft'?old.version+1:old.version))fail('Chỉ người duyệt được duyệt hoặc trả lại báo cáo.',403);
   if(r.status==='approved')r.approvedAt=new Date().toISOString();else delete r.approvedAt;
  }
 }
 if(archives.length>oldArchives.length&&!(old?.status==='approved'&&!r))fail('Không được tự thêm báo cáo lưu trữ.');
 if(next.report&&(typeof next.report.narrative!=='string'||next.report.narrative.length>50000))fail('Nhận xét phải là văn bản không quá 50.000 ký tự.');
 next.revision=current.revision+1;
 next.logs=[{time:new Date().toISOString(),role:user.role,action:`${user.username}: ${sourceChanged?'Cập nhật nguồn dữ liệu':'Cập nhật báo cáo'} · phiên bản ${next.revision}`},...current.logs].slice(0,5000);
 db.prepare('UPDATE workspace SET revision=?,payload=?,updated_at=? WHERE id=1').run(next.revision,json(next),new Date().toISOString());
 for(const report of [...archives,...(next.report?.status==='approved'?[next.report]:[])]){const existing=db.prepare('SELECT payload FROM snapshots WHERE id=?').get(report.id);if(existing&&existing.payload!==json(report))fail('Snapshot đã lưu không khớp.');if(!existing)db.prepare('INSERT INTO snapshots VALUES(?,?,?)').run(report.id,json(report),new Date().toISOString());}
 audit(db,user,'WORKSPACE_UPDATED',{sourceChanged,editedIndices,addedRows:next.rows.length-current.rows.length,excludedAdded:next.excluded.filter(i=>!current.excluded.includes(i)),excludedRemoved:current.excluded.filter(i=>!next.excluded.includes(i)),reportStatus:next.report?.status||null},next.revision);return next;
 });}
