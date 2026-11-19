import React,{useEffect,useMemo,useState} from 'react';
import {Alert,Button,Select,Table,Tabs} from 'antd';
import {departmentRevenue,departmentKey} from './departmentRevenue.mjs';
import {isBackend} from '../backend/client.mjs';
import {pythonTask} from '../backend/pythonClient.mjs';
import ServiceRevenue from './ServiceRevenue.jsx';
import {money} from './core.mjs';
export default function AllRevenuePanel({rows,config={},frozenValue=null,legacy=false}){
 const [filter,setFilter]=useState('ALL'),[retry,setRetry]=useState(0),[response,setResponse]=useState(null),[failure,setFailure]=useState(null);
 const source=frozenValue?.sourceRows||rows,settings=frozenValue?.configuration||config;
 const selected=useMemo(()=>{if(filter==='ALL')return source;const [axis,...code]=filter.split(':');return source.filter(r=>departmentKey(r[axis])===code.join(':'));},[source,filter]);
 const key=useMemo(()=>JSON.stringify({rows:selected,config:settings}),[selected,settings]);
 const local=useMemo(()=>{try{return !isBackend()?departmentRevenue(selected,settings):null;}catch(e){return {error:e.message};}},[selected,settings]);
 useEffect(()=>{if(!isBackend()||(frozenValue&&filter==='ALL'))return;let active=true;setFailure(null);pythonTask('department-revenue',JSON.parse(key)).then(value=>{if(active)setResponse({key,value});}).catch(e=>{if(active)setFailure({key,message:e.message});});return()=>{active=false;};},[key,retry,frozenValue,filter]);
 const value=frozenValue&&filter==='ALL'?frozenValue:isBackend()?(response?.key===key?response.value:null):local;
 const full=useMemo(()=>{try{return frozenValue||departmentRevenue(source,settings);}catch(e){return {error:e.message,byOrdering:[],byPerforming:[]};}},[source,settings,frozenValue]);
 const options=[{value:'ALL',label:'Tất cả khoa'},{label:'Theo khoa chỉ định',options:full.byOrdering.map(r=>({value:'ordering_dept:'+r.key,label:r.label+' · chỉ định'}))},{label:'Theo khoa thực hiện',options:full.byPerforming.map(r=>({value:'performing_dept:'+r.key,label:r.label+' · thực hiện'}))}];
 const cols=[{title:'Khoa / nhóm',dataIndex:'label',width:260},{title:'Dòng dịch vụ',dataIndex:'records',render:money},{title:'Số lượng',dataIndex:'qty',render:money},{title:'Doanh thu đủ giá · VND',dataIndex:'knownRevenue',render:v=><b>{money(v)}</b>},{title:'Dòng chưa đủ giá',dataIndex:'missingRecords',render:money}];
 return <section className="panel"><div className="panel-head"><div><h2>Doanh thu toàn bộ khoa</h2><div className="subtle">{frozenValue?'Số liệu cố định tại thời điểm chốt':'Dữ liệu hợp lệ trong kỳ đang chọn'} · gồm mọi dịch vụ, nhóm giá và khoa có trong nguồn.</div></div><Select aria-label="Lọc doanh thu theo khoa" style={{minWidth:270}} value={filter} options={options} onChange={setFilter}/></div>
 {legacy&&<Alert type="info" showIcon message="Bản chốt cũ chưa có tổng hợp toàn bộ khoa. Phần này hiển thị nguồn hiện tại theo lịch; số đã chốt bên dưới được giữ nguyên."/>}
 <div className="mutedbox">Theo khoa chỉ định và theo khoa thực hiện là hai cách phân tích cùng các dòng dịch vụ. Mỗi dòng chỉ cộng một lần trong tổng; không cộng hai bảng khoa với nhau. Giá lẻ, SKTQ, SLUT và gói khác được tách riêng.</div>
 {full.error||value?.error?<Alert type="error" showIcon message={full.error||value.error}/>:!value?<Alert type={failure?.key===key?'error':'info'} showIcon message={failure?.key===key?failure.message:'Đang tổng hợp doanh thu các khoa…'} action={failure?.key===key?<Button onClick={()=>setRetry(n=>n+1)}>Thử lại</Button>:null}/>:<>
 {value.pendingRecords>0&&<Alert type="warning" showIcon message={`${money(value.pendingRecords)} dòng chưa xác định khoa, chưa cộng vào tổng doanh thu`} description="Xác nhận cặp khoa ở phần đối soát; hệ thống không tự gán doanh thu từ tên dịch vụ."/>}
 <Tabs items={[['byOrdering','Theo khoa chỉ định'],['byPerforming','Theo khoa thực hiện'],['byRoute','Luồng liên khoa'],['byBilling','Lẻ, SKTQ, SLUT & gói khác']].map(([key,label])=>({key,label,children:<Table rowKey="key" size="small" columns={cols} dataSource={value[key]} pagination={{pageSize:10,showSizeChanger:true}} scroll={{x:850}}/>}))}/>
 <ServiceRevenue value={value.revenue} showChart/>
 </>}
 </section>;
}
