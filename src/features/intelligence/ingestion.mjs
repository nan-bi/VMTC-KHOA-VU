import {IMPORT_LIMITS} from '../../shared/importLimits.mjs';
import {pythonTask,base64FromBytes} from '../backend/pythonClient.mjs';
// Upload bytes only to the authenticated local backend; never to a cloud API.
export async function ingestFiles(files,{folder=false,columnMappings=[]}={}){
 const max=folder?100:10;if(!files.length||files.length>max)throw Error(`Chọn từ 1 đến ${max} file.`);
 if(files.reduce((n,f)=>n+f.size,0)>IMPORT_LIMITS.totalMB*1024*1024)throw Error(`Tổng dung lượng mỗi lần tối đa ${IMPORT_LIMITS.totalMB} MB.`);
 const combined={rows:[],files:[],skippedSheets:[]};
 for(const file of files){
  if(!/\.(xlsx|xls|csv)$/i.test(file.name))throw Error(`${file.name}: chỉ hỗ trợ Excel / CSV.`);
  if(file.size>IMPORT_LIMITS.fileMB*1024*1024)throw Error(`${file.name}: mỗi file tối đa ${IMPORT_LIMITS.fileMB} MB.`);
  const bytes=new Uint8Array(await file.arrayBuffer());
  const loaded=await pythonTask('ingest',{name:file.webkitRelativePath||file.name,folder,analyzeAll:true,columnMappings,content:base64FromBytes(bytes)});
  if(combined.rows.length+loaded.rows.length+combined.files.reduce((n,f)=>n+(f.referenceTables||[]).reduce((m,t)=>m+t.rows.length,0),0)+loaded.files.reduce((n,f)=>n+(f.referenceTables||[]).reduce((m,t)=>m+t.rows.length,0),0)>IMPORT_LIMITS.batchRows)throw Error('Vượt giới hạn tổng dòng một lần phân tích.');
  combined.rows.push(...loaded.rows);combined.files.push(...loaded.files);combined.skippedSheets.push(...loaded.skippedSheets);
 }
 return combined;
}
