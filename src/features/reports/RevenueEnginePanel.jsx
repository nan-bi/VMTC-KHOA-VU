import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Alert,Button,Space,Table,Tag} from 'antd';
import {isBackend,request} from '../backend/client.mjs';
import {revenuePayloadRows} from './calculationPayload.mjs';
import ServiceRevenue from './ServiceRevenue.jsx';
import {money} from './core.mjs';
export default function RevenueEnginePanel({rows,config,baseline,onConfigure}){
 const [storedComparison,setComparison]=useState(null),[engine,setEngine]=useState('javascript'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const requestBody=useMemo(()=>JSON.stringify({rows:revenuePayloadRows(rows),config:Object.fromEntries(['rates','serviceKinds','packageTypes'].filter(key=>config?.[key]!=null).map(key=>[key,config[key]]))}),[rows,config]);
 const comparison=storedComparison?.inputKey===requestBody?storedComparison:null;
 const current=useRef();current.current=requestBody;
 useEffect(()=>{setComparison(null);setEngine('javascript');setError('');},[requestBody]);
 async function compare(){
  const snapshot=current.current;setBusy(true);setError('');
  try{
   const result=await request('/api/calculation/compare',{method:'POST',body:snapshot});
   if(current.current===snapshot)setComparison({...result,inputKey:snapshot});
  }catch(e){if(current.current===snapshot)setError(e.message);}
  finally{setBusy(false);}
 }
 const value=engine==='python'&&comparison?.match?comparison.python:baseline;
 return <>
  <div className="mutedbox" style={{marginTop:16}}>
   <Space wrap><b>Bộ tính doanh thu đang xem</b><Tag color={engine==='python'?'magenta':'default'}>{engine==='python'?'Python local':'JavaScript hiện tại'}</Tag><Button loading={busy} disabled={!isBackend()||!!baseline.error} onClick={compare}>So sánh JavaScript / Python</Button>{comparison?.match&&<><Button onClick={()=>setEngine('javascript')}>Xem bằng JavaScript</Button><Button onClick={()=>setEngine('python')}>Xem bằng Python</Button></>}</Space>
   <p className="subtle">Đợt chuyển đổi 1: Python tính giá × số lượng và tách nhóm giá trên cùng các dòng đã lọc. Phân loại khoa, chốt và xuất báo cáo vẫn dùng bộ tính hiện tại; lựa chọn này chỉ đổi bảng xem, không sửa dữ liệu hoặc bản đã duyệt.</p>
   {!isBackend()&&<Alert type="info" message="Mở dashboard backend để chạy phép tính Python local."/>}
   {error&&<Alert type="warning" showIcon message="Chưa so sánh được; giữ kết quả JavaScript" description={error+' Nếu bộ chạy cũ chưa có API này, mở CHAY-SO-SANH-PYTHON.cmd tại cổng 4190.'}/>}
   {comparison&&<><Alert style={{marginTop:10}} showIcon type={comparison.match?'success':'error'} message={comparison.match?'Khớp toàn bộ kết quả tính: dòng, nhóm giá, số lượng và doanh thu':'Kết quả chưa khớp — chưa cho sử dụng bản Python'} description={`${comparison.rows} dòng đã lọc · JS ${comparison.timing.javascriptMs.toFixed(2)} ms · Python tính ${comparison.timing.pythonComputeMs.toFixed(2)} ms · Python gồm khởi động ${comparison.timing.pythonTotalMs.toFixed(2)} ms. Đây là đối chiếu hai chương trình, chưa phải độ chính xác so với dữ liệu chuẩn bệnh viện.`}/>
   <Table style={{marginTop:10}} size="small" pagination={false} rowKey="kind" dataSource={comparison.javascript.totals.map(js=>({kind:js.kind,label:js.label,javascript:js.knownRevenue,python:comparison.python.totals.find(py=>py.kind===js.kind)?.knownRevenue??null}))} columns={[{title:'Nhóm dịch vụ',dataIndex:'label'},{title:'JavaScript · VND',dataIndex:'javascript',render:money},{title:'Python · VND',dataIndex:'python',render:v=>v==null?'Chưa có':money(v)},{title:'Chênh lệch · VND',render:(_,r)=>r.python==null?'—':money(r.python-r.javascript)}]}/></>}
  </div>
  <ServiceRevenue value={value} onConfigure={onConfigure}/>
 </>;
}
