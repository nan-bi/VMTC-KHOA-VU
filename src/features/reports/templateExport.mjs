import {pythonTask,bytesFromBase64} from '../backend/pythonClient.mjs';
export const TEMPLATE_VERSION='DATA-KHOAVU-1';
export const colName=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};
export async function templateReport(options){return pythonTask('template-model',options);}
export async function templateWorkbook(options){
 const {report,content}=await pythonTask('template-workbook',options);
 return {report,bytes:bytesFromBase64(content)};
}
