import React,{useMemo} from 'react';
import {Alert,Button,Space,Table,Tag,message} from 'antd';
import {masterReport} from './masterReport.mjs';
export default function MasterPanel({analysis,files,onOpen}){
 const report=useMemo(()=>masterReport(analysis,{files}),[analysis,files]),tat=report.report_context.tat_summary;
 const rows=analysis.records.filter(r=>(r.orderedInPeriod||r.performedInPeriod)&&['DELAYED_TAT','INVALID_TAT_TIME'].includes(r.tat.status));
 function exportJSON(){try{const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`KHOA_VU_MASTER_${analysis.from}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){message.error(e.message);}}
 return <section className="panel" style={{marginTop:20}} aria-label="Đối soát MASTER PROMPT">
  <div className="eyebrow">MASTER PROMPT · HỢP ĐỒNG DỮ LIỆU LOCAL</div><h3>Đối soát đầu ra & thời gian trả kết quả</h3>
  <Space wrap><Tag color={report.system_status==='SUCCESS'?'green':'gold'}>{report.system_status}</Tag><Tag>{report.ingestion_summary.total_raw_rows} dòng nguồn</Tag><Tag>{report.ingestion_summary.duplicates_omitted} bản trùng bỏ qua</Tag><Tag>{report.ingestion_summary.exceptions_flagged} dòng cần xem</Tag><Button type="primary" onClick={exportJSON}>Xuất JSON MASTER</Button></Space>
  <p>JSON gồm tổng tiếp nhận, KPI Khoa Vú, từng dòng phân luồng và cảnh báo kèm file / sheet / dòng / SHA-256. Dòng thiếu tiền giữ null; cả nhóm trùng mã khác nội dung bị cách ly.</p>
  <Alert type="info" showIcon message={`TAT trong kỳ: ${tat.delayed} dòng hợp lệ vượt ngưỡng · ${tat.known_within_threshold} trong ngưỡng · ${tat.unknown} thiếu mốc trả · ${tat.invalid} mốc không hợp lệ`} description="Ngưỡng demo từ MASTER PROMPT: CĐHA >120 phút; GPB >4320 phút, tính từ chỉ định đến trả kết quả. Chưa phải SLA được bệnh viện duyệt. Không dùng ngày hoàn thành thay mốc trả kết quả; không có giờ/múi giờ thì chưa đánh giá được. Cảnh báo TAT không tự loại doanh thu hợp lệ."/>
  <Table style={{marginTop:12}} size="small" rowKey="key" pagination={{pageSize:5}} scroll={{x:950}} dataSource={rows} locale={{emptyText:'Chưa tìm thấy cảnh báo TAT có bằng chứng trong kỳ đã chọn.'}} columns={[{title:'Chỉ định',render:(_,r)=><Button type="link" onClick={()=>onOpen(r.key)}>{r.row.order_id}</Button>},{title:'Khoa thực hiện',dataIndex:'performing'},{title:'Nguồn',render:(_,r)=><>{r.row.source_file||'Chưa có tên file'} · {r.row.source_sheet||'Chưa có sheet'} · dòng {r.row.source_row??'chưa có'}</>},{title:'TAT / ngưỡng (phút)',render:(_,r)=>`${r.tat.tat_minutes??'Chưa tính'} / ${r.tat.threshold_minutes}`},{title:'Cảnh báo',render:(_,r)=>r.tat.status}]}/>
  <p className="subtle">KPI theo kỳ đã chọn; tổng tiếp nhận tính toàn nguồn. Số dòng dịch vụ không đồng nhất số ca. Hai góc nhìn tài chính chồng lấp, không cộng thành tổng. Không có cảnh báo chưa chứng minh mọi ca đều đúng hạn.</p>
 </section>;
}
