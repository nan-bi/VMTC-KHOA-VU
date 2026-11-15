import {pythonTask,bytesFromBase64} from '../backend/pythonClient.mjs';
export async function meetingSlides(report){return pythonTask('meeting-model',report);}
export async function meetingPresentation(report){
 const {content}=await pythonTask('meeting-presentation',report),bytes=bytesFromBase64(content);
 return {
  write:async()=>bytes.buffer,
  async writeFile({fileName}){
   const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}));
   const link=document.createElement('a');link.href=url;link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
 };
}
