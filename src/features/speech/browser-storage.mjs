import {completedRecord,reviewedRecord,hasDraftContent,draftSnapshot} from './records.mjs';
import {deviceStamp} from './clock.mjs';
export const same=(a,b)=>JSON.stringify(normalize(a))===JSON.stringify(normalize(b));
function normalize(value){if(Array.isArray(value))return value.map(normalize);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,normalize(value[k])]));return value;}
export function createBrowserSpeechStore({indexedDB=globalThis.indexedDB,name='vu-voice-results'}={}){
 async function open(){
  if(!indexedDB)throw Error('Trình duyệt không hỗ trợ IndexedDB để lưu ca.');
  return new Promise((resolve,reject)=>{
   let canceled=false;const request=indexedDB.open(name);
   request.onupgradeneeded=()=>{for(const key of ['results','drafts'])if(!request.result.objectStoreNames.contains(key))request.result.createObjectStore(key,{keyPath:'id'});};
   request.onblocked=()=>{canceled=true;reject(Error('Kho ca bị chặn. Đóng tab speech cũ rồi mở lại.'));};
   request.onerror=()=>reject(Error('Không mở được kho ca trình duyệt: '+request.error?.message));
   request.onsuccess=()=>{const db=request.result;if(canceled){db.close();return;}db.onversionchange=()=>db.close();resolve(db);};
  });
 }
 async function transaction(mode,work){
  const db=await open();
  return new Promise((resolve,reject)=>{
   let output,reason,tx;
   try{tx=db.transaction(['results','drafts'],mode,{durability:'strict'});}catch(e){if(e.name!=='TypeError'){db.close();reject(e);return;}tx=db.transaction(['results','drafts'],mode);}
   const fail=message=>{reason=Error(message);tx.abort();};
   tx.oncomplete=()=>{db.close();resolve(output);};
   tx.onabort=()=>{db.close();reject(reason||Error(tx.error?.name==='QuotaExceededError'?'Bộ nhớ trình duyệt đã đầy. Nội dung chưa lưu vẫn ở trên màn hình; cần giải phóng dung lượng thiết bị.':'Chưa lưu được ca trong trình duyệt: '+(tx.error?.message||'Giao dịch bị hủy.')));};
   try{work(tx.objectStore('results'),tx.objectStore('drafts'),value=>output=value,fail);}catch(e){reason=e;tx.abort();}
  });
 }
 return {
  async listResults(){return (await transaction('readonly',(r,d,done)=>{r.getAll().onsuccess=e=>done(e.target.result);})).sort((a,b)=>b.completedAt.iso.localeCompare(a.completedAt.iso));},
  async listDrafts(){return (await transaction('readonly',(r,d,done)=>{d.getAll().onsuccess=e=>done(e.target.result);})).filter(d=>hasDraftContent(d.state)).sort((a,b)=>b.updatedAt.iso.localeCompare(a.updatedAt.iso));},
  async saveDraft(identity,state){
   const next={id:identity.id,owner:identity.owner,state:draftSnapshot(state),updatedAt:deviceStamp()};
   await transaction('readwrite',(r,d,done,fail)=>{r.get(identity.id).onsuccess=e=>{
    if(e.target.result){fail('Ca đã hoàn thành; không ghi lại bản nháp.');return;}
    d.get(identity.id).onsuccess=e=>{const old=e.target.result;
     if((!old&&identity.claimed)||(old&&old.owner!==identity.owner)){fail('Bản nháp đã được mở ở tab khác hoặc không còn. Tải lại danh sách.');return;}
     d.put(next);done(next);
    };
   };});identity.claimed=true;return next;
  },
  restoreDraft(id,owner){return transaction('readwrite',(r,d,done,fail)=>{d.get(id).onsuccess=e=>{if(!e.target.result){fail('Bản nháp không còn. Tải lại danh sách.');return;}const next={...e.target.result,owner};d.put(next);done(next);};});},
  saveCompletedResult(record,identity){return transaction('readwrite',(r,d,done,fail)=>{
   r.get(record.id).onsuccess=e=>{if(e.target.result){fail('Ca đã được lưu. Tải lại Kết quả.');return;}
    d.get(record.id).onsuccess=e=>{const draft=e.target.result;
     if(!identity||identity.id!==record.id||!draft||draft.owner!==identity.owner){fail('Bản nháp đã mở ở tab khác hoặc chưa lưu xong.');return;}
     let expected;try{expected=completedRecord(draft.state,record.id,record.completedAt);}catch(error){fail(error.message);return;}
     if(!same(expected,record)){fail('Kết quả không khớp bản nháp đã lưu. Lưu nháp rồi thử lại.');return;}
     r.add(record);d.delete(record.id);done(record);
    };
   };
  });},
  saveReviewedResult(id,revision,review){return transaction('readwrite',(r,d,done,fail)=>{r.get(id).onsuccess=e=>{
   const old=e.target.result;if(!old||old.revision!==revision){fail('Kết quả đã thay đổi. Tải lại danh sách.');return;}
   let next;try{next=reviewedRecord(old,review);}catch(error){fail(error.message);return;}r.put(next);done(next);
  };});}
 };
}
export async function browserStorageStatus(storage=globalThis.navigator?.storage,request=false){
 if(!storage?.persisted)return 'unsupported';
 try{if(await storage.persisted())return 'persistent';if(request&&storage.persist&&await storage.persist())return 'persistent';return 'best-effort';}catch{return 'unsupported';}
}
