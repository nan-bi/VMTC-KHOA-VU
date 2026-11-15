import {runPythonData} from './python-data.mjs';
import {transaction,audit} from './database.mjs';
export class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
const json=value=>JSON.stringify(value);
export function getWorkspace(db){const r=db.prepare('SELECT payload FROM workspace WHERE id=1').get();return r?JSON.parse(r.payload):null;}
export function seedWorkspace(db,state){if(!getWorkspace(db))db.prepare('INSERT INTO workspace VALUES(1,?,?,?)').run(state.revision||0,json(state),new Date().toISOString());}
export async function updateWorkspace(db,{expectedRevision,state},user,catalog){
 const current=getWorkspace(db);
 const result=await runPythonData('transition',{current,state,user,catalog,expectedRevision});
 return transaction(db,()=>{
  // The subprocess ran outside the SQLite write lock. Recheck the revision
  // inside BEGIN IMMEDIATE so two clients cannot commit the same base state.
  if(getWorkspace(db).revision!==current.revision)throw new HttpError(409,'Dữ liệu đã đổi ở phiên khác. Tải lại trước khi lưu.');
  const next=result.value.state;
  db.prepare('UPDATE workspace SET revision=?,payload=?,updated_at=? WHERE id=1').run(next.revision,json(next),new Date().toISOString());
  for(const report of [...(next.archivedReports||[]),...(next.report?.status==='approved'?[next.report]:[])]){
   const existing=db.prepare('SELECT payload FROM snapshots WHERE id=?').get(report.id);
   if(existing&&existing.payload!==json(report))throw new HttpError(400,'Snapshot đã lưu không khớp.');
   if(!existing)db.prepare('INSERT INTO snapshots VALUES(?,?,?)').run(report.id,json(report),new Date().toISOString());
  }
  audit(db,user,'WORKSPACE_UPDATED',result.value.audit,next.revision);return next;
 });
}
