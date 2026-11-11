// Blob content stays in IndexedDB; the visit contains only metadata, never base64.
const open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('vinmec-demo-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Không mở được bộ nhớ file trên trình duyệt.'));});
async function run(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('files',mode);const req=fn(tx.objectStore('files'));tx.oncomplete=()=>{db.close();resolve(req?.result)};tx.onerror=()=>{db.close();reject(Error('Không lưu được file. Hãy kiểm tra dung lượng trình duyệt.'))};});}
export async function putAttachment(file){
 if(!file.size||file.size>5*1024*1024)throw Error('Mỗi file phải lớn hơn 0 và tối đa 5 MB.');
 const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
 const pdf=bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70;
 const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(!pdf&&!png&&!jpg)throw Error('Chỉ nhận file PDF, PNG hoặc JPEG đúng định dạng.');
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const id=crypto.randomUUID();await run('readwrite',s=>s.put(new Blob([file],{type:pdf?'application/pdf':png?'image/png':'image/jpeg'}),id));
 return {id,name:file.name,size:file.size,sha256};
}
export const removeAttachment=id=>run('readwrite',s=>s.delete(id));
export async function downloadAttachment(a){const blob=await run('readonly',s=>s.get(a.id));if(!blob)throw Error('File không còn trên trình duyệt này.');if(a.sha256){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==a.sha256)throw Error('File không khớp SHA-256; dừng tải để kiểm tra dữ liệu.');}const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=a.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
