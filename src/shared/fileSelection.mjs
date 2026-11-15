export function checkFileSelection(current,incoming,{accept,maxCount,maxMB,maxTotalMB=Infinity}){
 const files=Array.from(incoming),extensions=accept.split(',').map(x=>x.trim().toLowerCase());
 if(current.length+files.length>maxCount)throw Error(`Chọn tối đa ${maxCount} file. Lượt chọn này chưa được thêm; hãy chọn ít file hơn.`);
 for(const file of files){
  if(!extensions.some(ext=>file.name.toLowerCase().endsWith(ext)))throw Error(`${file.name}: chỉ nhận ${accept}.`);
  if(!file.size)throw Error(`${file.name}: file rỗng, hãy kiểm tra lại.`);
  if(file.size>maxMB*1024*1024)throw Error(`${file.name}: tối đa ${maxMB} MB/file.`);
 }
 if([...current,...files].reduce((sum,file)=>sum+file.size,0)>maxTotalMB*1024*1024)throw Error(`Tổng dung lượng mỗi lần tối đa ${maxTotalMB} MB. Lượt chọn này chưa được thêm.`);
 return [...current,...files];
}
