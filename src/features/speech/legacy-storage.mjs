// Only used once to move existing browser cases to the local server.
export const same=(a,b)=>JSON.stringify(normalize(a))===JSON.stringify(normalize(b));
function normalize(value){if(Array.isArray(value))return value.map(normalize);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,normalize(value[k])]));return value;}
const ordered=items=>[...items].sort((a,b)=>a.id.localeCompare(b.id));
async function open(){
 if(!globalThis.indexedDB)return null;
 if(indexedDB.databases&&!(await indexedDB.databases()).some(d=>d.name==='vu-voice-results'))return null;
 return new Promise((resolve,reject)=>{const r=indexedDB.open('vu-voice-results');r.onupgradeneeded=()=>{for(const n of ['results','drafts'])r.result.createObjectStore(n,{keyPath:'id'});};r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(Error('Chưa đọc được kho ca cũ.'));});
}
export async function readLegacySpeech(){
 const db=await open();if(!db)return {results:[],drafts:[]};
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction(['results','drafts'],'readonly');let results,drafts;tx.objectStore('results').getAll().onsuccess=e=>results=e.target.result;tx.objectStore('drafts').getAll().onsuccess=e=>drafts=e.target.result;tx.oncomplete=()=>resolve({results,drafts});tx.onabort=()=>reject(Error('Chưa đọc được toàn bộ kho ca cũ.'));});}finally{db.close();}
}
export async function clearLegacySpeech(snapshot){
 const db=await open();if(!db)return;
 const version=db.version;db.close();
 // Version 3 prevents old app versions (which open version 2) from writing new
 // browser cases. An upgrade transaction compares the snapshot before clearing.
 return new Promise((resolve,reject)=>{
  let canceled=false;
  const r=indexedDB.open('vu-voice-results',Math.max(3,version));
  const clean=(database,tx)=>{
   let results,drafts,reads=0;
   const check=()=>{if(++reads<2)return;if(!same(ordered(results),ordered(snapshot.results))||!same(ordered(drafts),ordered(snapshot.drafts))){tx.abort();return;}tx.objectStore('results').clear();tx.objectStore('drafts').clear();};
   tx.objectStore('results').getAll().onsuccess=e=>{results=e.target.result;check();};
   tx.objectStore('drafts').getAll().onsuccess=e=>{drafts=e.target.result;check();};
  };
  r.onblocked=()=>{canceled=true;reject(Error('Đóng các tab speech cũ rồi tải lại để hoàn tất chuyển kho.'));};
  r.onupgradeneeded=()=>{if(canceled){r.transaction.abort();return;}clean(r.result,r.transaction);};
  r.onerror=()=>reject(Error('Kho ca cũ đang thay đổi hoặc bị chặn; bản cũ chưa bị xóa. Tải lại để chuyển tiếp.'));
  r.onsuccess=()=>{
   if(canceled){r.result.close();return;}
   if(version<3){r.result.close();resolve();return;}
   const tx=r.result.transaction(['results','drafts'],'readwrite');clean(r.result,tx);
   tx.oncomplete=()=>{r.result.close();resolve();};tx.onabort=()=>{r.result.close();reject(Error('Kho ca cũ đã thay đổi; chưa xóa dữ liệu.'));};
  };
 });
}
