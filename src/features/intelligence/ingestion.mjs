import {IMPORT_LIMITS} from '../../shared/importLimits.mjs';
import * as XLSX from 'xlsx';
import {adaptRows,inspectSchema} from './importSchema.mjs';

// Read actual bytes, never trust provenance supplied by a workbook.
export async function ingestFiles(files,{folder=false}={}){
 const max=folder?100:10;if(!files.length||files.length>max)throw Error(`Chọn từ 1 đến ${max} file.`);
 if(files.reduce((n,f)=>n+f.size,0)>IMPORT_LIMITS.totalMB*1024*1024)throw Error(`Tổng dung lượng mỗi lần tối đa ${IMPORT_LIMITS.totalMB} MB.`);
 const loaded=[],skippedSheets=[],ingestedAt=new Date().toISOString();let total=0;
 for(const f of files){
  const file=f.webkitRelativePath||f.name;
  if(!/\.(xlsx|xls|csv)$/i.test(f.name))throw Error(`${file}: chỉ hỗ trợ Excel / CSV.`);
  if(f.size>IMPORT_LIMITS.fileMB*1024*1024)throw Error(`${file}: mỗi file tối đa ${IMPORT_LIMITS.fileMB} MB.`);
  const bytes=await f.arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
  let book;try{book=XLSX.read(bytes,{type:'array',cellDates:false});}catch(e){if(!folder)throw e;skippedSheets.push({file,sheet:'',reason:'Không đọc được workbook: '+e.message});continue;}
  const names=folder?book.SheetNames:[book.Sheets.CANONICAL?'CANONICAL':book.SheetNames[0]],rows=[],sheets=[];let schema;
  for(const name of names){try{
   const sheet=book.Sheets[name];if(!sheet?.['!ref'])throw Error('Sheet rỗng.');
   const range=XLSX.utils.decode_range(sheet['!ref']);
   if(range.e.r-range.s.r>100000||range.e.c-range.s.c>300)throw Error('Phạm vi sheet quá lớn; cần thu gọn vùng dữ liệu.');
   const grid=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,blankrows:true,range:range.s.r});
   let headerIndex=0;if(folder){const found=grid.slice(0,30).findIndex(row=>{const h=row.filter(v=>v!=null&&v!=='').map(String);return h.length>0&&inspectSchema([Object.fromEntries(h.map(k=>[k,null]))],{internalKeys:true}).missing.length===0;});if(found>=0)headerIndex=found;}
   const headers=grid[headerIndex]?.map(v=>v==null?'':String(v).trim())||[];
   if(headers.filter(Boolean).some((h,i,a)=>a.indexOf(h)!==i))throw Error('Có tiêu đề cột trùng.');
   const data=[],rowNumbers=[];
   for(let i=headerIndex+1;i<grid.length;i++){
    const row=grid[i];if(!row.some(v=>v!=null&&v!==''))continue;
    if(row.some((v,c)=>v!=null&&v!==''&&!headers[c]))throw Error(`Dòng ${range.s.r+i+1} có dữ liệu ở cột không có tiêu đề.`);
    data.push(Object.fromEntries(headers.flatMap((h,c)=>h?[[h,row[c]??null]]:[])));rowNumbers.push(range.s.r+i+1);
   }
   if(!data.length||data.length>IMPORT_LIMITS.sheetRows)throw Error(`Sheet phải có từ 1 đến ${IMPORT_LIMITS.sheetRows.toLocaleString('vi-VN')} dòng dữ liệu.`);
   let internalKeys;if(folder){internalKeys=await Promise.all(data.map(async row=>{const text=JSON.stringify(Object.keys(row).filter(k=>!['source_file','source_sheet','source_row','source_file_hash','file_hash','source_hash','ingested_at'].includes(k)).sort().map(k=>[k,row[k]]));const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return 'LOCAL-'+Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');}));}
   const parsed=adaptRows(data,file,{sheet:name,hash,rowNumbers,ingestedAt,internalKeys});
   total+=parsed.rows.length;if(total>IMPORT_LIMITS.batchRows)throw Error('LIMIT_TOTAL_ROWS');
   rows.push(...parsed.rows);sheets.push(name);schema=parsed.schema;
  }catch(e){if(e.message==='LIMIT_TOTAL_ROWS')throw Error('Vượt giới hạn tổng dòng một lần phân tích.');if(!folder)throw Error(`${file}: ${e.message}`);skippedSheets.push({file,sheet:name,reason:e.message});}}
  if(rows.length)loaded.push({file,sheet:sheets.join(', '),hash,count:rows.length,schema,rows});
 }
 return {rows:loaded.flatMap(f=>f.rows),files:loaded.map(({rows,...meta})=>meta),skippedSheets};
}
