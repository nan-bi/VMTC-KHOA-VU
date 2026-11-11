import * as XLSX from 'xlsx';
import {adaptRows} from './importSchema.mjs';

// Ingest the bytes actually selected, never trust provenance columns inside a file.
export async function ingestFiles(files){
 if(!files.length||files.length>10)throw Error('Chọn từ 1 đến 10 file.');
 const loaded=[],ingestedAt=new Date().toISOString();let total=0;
 for(const f of files){
  if(!/\.(xlsx|xls|csv)$/i.test(f.name))throw Error(`${f.name}: chỉ hỗ trợ Excel / CSV.`);
  if(f.size>10*1024*1024)throw Error(`${f.name}: mỗi file tối đa 10 MB.`);
  const bytes=await f.arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const book=XLSX.read(bytes,{type:'array',cellDates:false}),name=book.Sheets.CANONICAL?'CANONICAL':book.SheetNames[0],sheet=book.Sheets[name];
  if(!sheet?.['!ref'])throw Error(`${f.name}: sheet rỗng.`);
  const range=XLSX.utils.decode_range(sheet['!ref']);
  if(range.e.r-range.s.r>100000||range.e.c-range.s.c>300)throw Error(`${f.name}: phạm vi sheet quá lớn; cần thu gọn vùng dữ liệu.`);
  const grid=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,blankrows:true,range:range.s.r});
  const headers=grid[0]?.map(v=>v==null?'':String(v).trim())||[];
  if(headers.filter(Boolean).some((h,i,a)=>a.indexOf(h)!==i))throw Error(`${f.name}: có tiêu đề cột trùng.`);
  const data=[],rowNumbers=[];
  for(let i=1;i<grid.length;i++){
   const row=grid[i];if(!row.some(v=>v!=null&&v!==''))continue;
   if(row.some((v,c)=>v!=null&&v!==''&&!headers[c]))throw Error(`${f.name}: dòng ${range.s.r+i+1} có dữ liệu ở cột không có tiêu đề.`);
   data.push(Object.fromEntries(headers.flatMap((h,c)=>h?[[h,row[c]??null]]:[])));rowNumbers.push(range.s.r+i+1);
  }
  if(!data.length||data.length>10000)throw Error(`${f.name}: file phải có từ 1 đến 10.000 dòng dữ liệu.`);
  total+=data.length;if(total>20000)throw Error('Tối đa 20.000 dòng cho một lần phân tích.');
  const parsed=adaptRows(data,f.name,{sheet:name,hash,rowNumbers,ingestedAt});
  loaded.push({file:f.name,sheet:name,hash,count:parsed.rows.length,headerRow:range.s.r+1,schema:parsed.schema,rows:parsed.rows});
 }
 return {rows:loaded.flatMap(f=>f.rows),files:loaded.map(({rows,...meta})=>meta)};
}
