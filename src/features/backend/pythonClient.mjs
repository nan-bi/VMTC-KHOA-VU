import {isBackend,request} from './client.mjs';
export async function pythonTask(action,payload){
 if(typeof window==='undefined'){
  const modulePath=new URL(['..','..','..','backend','python-data.mjs'].join('/'),import.meta.url).href;
  const {runPythonData}=await import(/* @vite-ignore */ modulePath);
  return (await runPythonData(action,payload)).value;
 }
 if(!isBackend())throw Error('Mở dashboard nội bộ cổng 4180 hoặc 4190 để xử lý dữ liệu bằng Python local.');
 return (await request('/api/data/'+action,{method:'POST',body:JSON.stringify(payload)})).value;
}
export function bytesFromBase64(content){
 return Uint8Array.from(atob(content),character=>character.charCodeAt(0));
}
export function base64FromBytes(bytes){
 let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);
}
