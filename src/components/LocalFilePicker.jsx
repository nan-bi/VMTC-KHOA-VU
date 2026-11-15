import {IMPORT_LIMITS} from '../shared/importLimits.mjs';
import React,{useRef,useState} from 'react';
import {Alert,Button} from 'antd';
import {FolderOpenOutlined,FileOutlined,DeleteOutlined} from '@ant-design/icons';
import {checkFileSelection} from '../shared/fileSelection.mjs';
export default function LocalFilePicker({files,onChange,disabled=false,reason,accept='.xlsx,.xls,.csv',maxCount=10,maxMB=IMPORT_LIMITS.fileMB,maxTotalMB=IMPORT_LIMITS.totalMB,label='Chọn file từ máy tính',allowFolder=false}){
 const folderInput=useRef(null),input=useRef(null),[error,setError]=useState(''),[dragging,setDragging]=useState(false);
 const select=incoming=>{if(disabled)return;try{const next=checkFileSelection(files,incoming,{accept,maxCount,maxMB,maxTotalMB});onChange(next);setError('');}catch(e){setError(e.message);}};
 return <div className="local-file-picker">
  <div className={'local-file-drop '+(dragging?'is-dragging':'')} role="group" aria-label="Vùng chọn file từ máy tính" onDragOver={e=>{e.preventDefault();if(!disabled)setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);select(e.dataTransfer.files)}}>
   <FolderOpenOutlined className="local-file-icon"/>
   <h3>Chọn file trên máy tính của bạn</h3>
   <p>{allowFolder?'Chọn cả thư mục (gồm thư mục con) hoặc chọn các file Excel/CSV.':'Mở thư mục để chọn file, hoặc kéo thả file vào vùng này.'}</p>
   <input ref={input} type="file" accept={accept} multiple={maxCount>1} disabled={disabled} aria-label={label} hidden onChange={e=>{select(e.target.files);e.target.value=''}}/>
   <Button type="primary" icon={<FolderOpenOutlined/>} disabled={disabled||files.length>=maxCount} onClick={()=>input.current?.click()}>{label}</Button>
   {allowFolder&&<><input ref={folderInput} type="file" webkitdirectory="" directory="" multiple hidden disabled={disabled} aria-label="Chọn thư mục Excel" onChange={e=>{const selected=Array.from(e.target.files).filter(f=>/\.(xlsx|xls|csv)$/i.test(f.name)&&!f.name.startsWith('~$'));if(!selected.length)setError('Thư mục chưa có file Excel/CSV phù hợp.');else select(selected);e.target.value=''}}/><Button style={{marginLeft:8}} disabled={disabled||files.length>=maxCount} onClick={()=>folderInput.current?.click()}>Chọn cả thư mục Excel</Button></>}
   <div className="subtle">{accept} · tối đa {maxMB} MB/file · {maxCount} file/lần{` · tổng ${maxTotalMB} MB/lần`}</div>
  </div>
  {reason&&disabled&&<Alert style={{marginTop:12}} type="info" showIcon message={reason}/>}
  {error&&<Alert style={{marginTop:12}} type="error" showIcon message={error} closable onClose={()=>setError('')}/>}
  {!!files.length&&<div className="local-file-list" aria-live="polite"><div className="local-file-list-head"><b>Đã chọn {files.length}/{maxCount} file</b><Button size="small" disabled={disabled} onClick={()=>{onChange([]);setError('')}}>Bỏ chọn tất cả</Button></div>{files.map((file,i)=><div className="local-file-row" key={i}><FileOutlined/><div><b>{file.webkitRelativePath||file.name}</b><span>{new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(file.size/1024)} KB · chờ xử lý</span></div><Button type="text" disabled={disabled} aria-label={`Bỏ chọn ${file.name}`} icon={<DeleteOutlined/>} onClick={()=>{onChange(files.filter((_,j)=>j!==i));setError('')}}/></div>)}</div>}
 </div>;
}
