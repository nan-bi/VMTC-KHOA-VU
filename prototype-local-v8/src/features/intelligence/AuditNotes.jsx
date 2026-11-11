import React,{useState} from 'react';
import {Button,Input,Space,message} from 'antd';
import {makeAuditNote} from './masterReport.mjs';
export default function AuditNotes({result,question}){
 const [text,setText]=useState(''),[notes,setNotes]=useState([]);
 function add(){try{const note=makeAuditNote(result,question,text);setNotes(old=>[...old,note]);setText('');message.success('Đã lưu ghi chú cùng bản chụp bằng chứng trong phiên này.');}catch(e){message.error(e.message);}}
 function exportNotes(){const url=URL.createObjectURL(new Blob([JSON.stringify({schema_version:'VU-AUDIT-NOTES-1',notes},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='KHOA_VU_GHI_CHU_TRUY_VET.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <div style={{marginTop:20}}><h4>Ghi chú hành chính gắn bằng chứng</h4><Input.TextArea aria-label="Ghi chú truy vết" maxLength={2000} rows={2} value={text} onChange={e=>setText(e.target.value)} placeholder="Ghi nội dung cần đối soát sau khi truy vết. Ghi chú không sửa dòng nguồn."/><Space wrap style={{marginTop:8}}><Button disabled={!text.trim()||!result?.rows?.length||result.unsupported} onClick={add}>Lưu ghi chú gắn bằng chứng</Button><Button disabled={!notes.length} onClick={exportNotes}>Xuất ghi chú JSON ({notes.length})</Button></Space><p className="subtle">Chỉ giữ trong phiên trình duyệt; tải JSON để lưu lâu dài. Mỗi ghi chú giữ câu hỏi, kỳ, chế độ, kết quả và toàn bộ dẫn chứng tại thời điểm lưu; không phải phê duyệt nghiệp vụ.</p>{notes.slice(-3).map((n,i)=><div className="mutedbox" key={i}><b>{n.created_at} · {n.evidence.length} dòng bằng chứng</b><div>{n.note}</div><small>{n.scope} · {n.question}</small></div>)}</div>;
}
