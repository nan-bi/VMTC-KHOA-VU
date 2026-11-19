import React,{useState} from 'react';
import {Alert,Button,Table,Tag,Modal} from 'antd';
import ServiceBarChart from './ServiceBarChart.jsx';
import {revenueChartRows} from './serviceChartData.mjs';
import {money} from './core.mjs';
import {BILLING_TYPES,SERVICE_KINDS} from './serviceCalculation.mjs';
export default function ServiceRevenue({value,onConfigure,showChart=false}){
 const [chartService,setChartService]=useState(null);
 const revenueColumns=[
   {title:'Dịch vụ',width:240,render:(_,r)=><>{r.name}<div className="subtle">{SERVICE_KINDS[r.kind]}</div></>},
   {title:'Nhóm giá',width:150,render:(_,r)=>BILLING_TYPES[r.type]},
   {title:'Đơn giá áp dụng · VND',width:170,render:(_,r)=>r.price==null?'Chưa có giá':money(r.price)},
   {title:'Số lượng thực hiện',dataIndex:'qty',width:140,render:money},
   {title:'Cách tính',width:220,render:(_,r)=>r.price==null?'Chờ đối soát':`${money(r.price)} × ${money(r.qty)} (cộng từng dòng)`},
   {title:'Doanh thu · VND',width:170,render:(_,r)=>r.revenue==null?<Tag color="gold">Chưa tính</Tag>:<b>{money(r.revenue)}</b>},
   {title:'Căn cứ đơn giá',dataIndex:'basis',width:230}
  ];
 if(value.error)return <Alert style={{marginTop:18}} type="error" showIcon message="Chưa thể tính doanh thu" description={value.error} action={onConfigure&&<Button onClick={onConfigure}>Kiểm tra đơn giá</Button>}/>;
 return <div style={{marginTop:18}}><div className="panel-head"><div><h3>Doanh thu theo giá và số lượng</h3><div className="subtle">Mọi dịch vụ trong phạm vi chọn được hiển thị. Giá lẻ, SKTQ, SLUT 1/2 và gói khác tính riêng; X-quang 2D và 3D không gộp giá.</div></div>{onConfigure&&<Button onClick={onConfigure}>Sửa đơn giá áp dụng</Button>}</div>
  <div className="dw-metrics service-revenue-metrics">{value.totals.map(r=><div key={r.kind}><span>{r.label}</span><b>{money(r.knownRevenue)} <small>VND</small></b>{r.missingRecords>0&&<Tag color="gold">Thiếu giá/phân loại: {money(r.missingQty)} đơn vị</Tag>}</div>)}</div>
  <div className="mutedbox"><b>{value.missingRecords?'Doanh thu tính được (chưa đầy đủ)':'Tổng doanh thu theo đơn giá × số lượng'}: {money(value.knownRevenue)} VND</b><div>Cộng các dòng giá × số lượng bên dưới; không cộng thêm giá bán gói cha hoặc cộng lại phân bổ gói.</div></div>
  {value.missingRecords>0&&<Alert type="warning" showIcon message={`${value.missingRecords} dòng (${money(value.missingQty)} đơn vị) chưa đủ giá hoặc phân loại, chưa cộng doanh thu`} description="Gán đúng loại gói và nhập đơn giá tương ứng. Không lấy giá lẻ thay giá gói; ô chưa xác định giữ trống."/>}
  {showChart&&<ServiceBarChart title="Doanh thu theo từng dịch vụ" description="Cùng kỳ và nhóm khoa chỉ định đang chọn · bấm cột để xem cách tính" unit="VND" rows={revenueChartRows(value.lines)} legend={Object.entries(BILLING_TYPES).filter(([key])=>key!=='UNKNOWN').map(([key,label])=>({key,label}))} onSelect={row=>setChartService(row.key)}/>}
  <Modal title="Chi tiết doanh thu dịch vụ" open={!!chartService} onCancel={()=>setChartService(null)} footer={null} width={1000}><Table rowKey="key" columns={revenueColumns} dataSource={value.lines.filter(line=>line.code===chartService)} pagination={{pageSize:8}} scroll={{x:1200}}/></Modal>
  <Table rowKey="key" size="small" dataSource={value.lines} pagination={{pageSize:8,showSizeChanger:true}} scroll={{x:1200}} columns={revenueColumns}/>
  <p className="subtle">Dùng đơn giá cấu hình nếu đã khai báo; nếu để trống, giá lẻ dùng đơn giá nguồn, giá gói dùng phân bổ nguồn chia số lượng khi xác định được đơn giá nguyên VND. Cùng dịch vụ có nhiều giá nguồn sẽ tách thành nhiều phép nhân. Số lượng có tối đa 6 chữ số thập phân; tiền làm tròn nửa lên trên từng dòng nguồn rồi cộng; tổng giá × lượng có thể lệch do làm tròn nếu lượng lẻ. Đây là doanh thu tính theo giá dịch vụ, chưa phải thực thu; dữ liệu giảm giá/hoàn tiền vẫn xem và đối soát riêng.</p>
 </div>;
}
