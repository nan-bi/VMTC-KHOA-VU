export function checkFileSelection(current,incoming,{accept,maxCount,maxMB}){
 const files=Array.from(incoming),extensions=accept.split(',').map(x=>x.trim().toLowerCase());
 if(current.length+files.length>maxCount)throw Error(`Chọn tối đa ${maxCount} file. Lượt chọn này chưa được thêm; hãy chọn ít file hơn.`);
 for(const file of files){
  if(!extensions.some(ext=>file.name.toLowerCase().endsWith(ext)))throw Error(`${file.name}: chỉ nhận ${accept}.`);
  if(!file.size)throw Error(`${file.name}: file rỗng, hãy kiểm tra lại.`);
  if(file.size>maxMB*1024*1024)throw Error(`${file.name}: tối đa ${maxMB} MB/file.`);
 }
 return [...current,...files];
}
