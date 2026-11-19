import React,{useState,useEffect} from 'react';
import {Alert,Button,Table} from 'antd';
import {pythonTask} from '../backend/pythonClient.mjs';
import {money} from './core.mjs';
import {BILLING_TYPES} from './serviceCalculation.mjs';
export default function FinanceReview({rows,config,department}){
 const [busy,setBusy]=useState(false);
 const [value,setValue]=useState(null),[error,setError]=useState('');
 const input=JSON.stringify({rows,config,department});
 useEffect(()=>{setValue(null);setError('');},[input]);
 async function run(){setBusy(true);setError('');try{const result=await pythonTask('finance-review',JSON.parse(input));setValue({input,result});}catch(e){setError(e.message)}finally{setBusy(false)}}
 const current=value?.input===input?value.result:null;
 return <details className="panel disclosure-panel"><summary>Kiểm tra doanh thu & đơn giá bất thường</summary><p>Đối chiếu tổng giá × lượng với sau giảm/phân bổ nguồn theo từng dịch vụ và nhóm giá. Chênh lệch cần giải thích bằng giảm giá, cấu hình giá hoặc nguồn; không tự bù trừ. IQR chỉ tạo lưu ý.</p><Button loading={busy} onClick={run}>Chạy kiểm tra doanh thu</Button>{error&&<Alert type="error" message={error}/>} {current&&<><Table rowKey="key" size="small" scroll={{x:1000}} dataSource={current.checks} pagination={{pageSize:6}} columns={[{title:'Dịch vụ',render:(_,n)=><>{n.name}<div>{BILLING_TYPES[n.type]}</div></>},{title:'Giá × lượng',dataIndex:'calculated',render:money},{title:'Sau giảm nguồn đã biết',dataIndex:'sourceNetKnown',render:money},{title:'Chênh lệch',render:(_,n)=>n.difference==null?'Thiếu căn cứ':money(n.difference)},{title:'Cần kiểm tra',render:(_,n)=>n.missingPrice||n.missingNet?`${n.missingPrice} thiếu giá · ${n.missingNet} thiếu sau giảm`:n.difference?'Đối chiếu giảm giá / giá cấu hình':'Khớp nguồn'}]}/><Alert type={current.outliers.length?'warning':'info'} showIcon message={`${current.outliers.length} dòng có đơn giá ngoài khoảng IQR`} description="So sánh riêng cùng mã dịch vụ và nhóm giá, tối thiểu 8 dòng. Không phát hiện không có nghĩa dữ liệu đã đúng; không tự xóa hay sửa tiền."/><Table rowKey={(_,i)=>i} size="small" dataSource={current.outliers} pagination={{pageSize:5}} columns={[{title:'Dịch vụ',dataIndex:'code'},{title:'Nhóm giá',dataIndex:'type',render:v=>BILLING_TYPES[v]},{title:'Đơn giá',dataIndex:'price',render:money},{title:'File / dòng',render:(_,n)=>`${n.source_file} · ${n.source_row}`},{title:'Lưu ý',dataIndex:'reason'}]}/></>}</details>;
}
