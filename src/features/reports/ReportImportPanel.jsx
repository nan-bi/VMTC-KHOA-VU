import React,{useRef,useState} from 'react';
import {Alert,Button,Descriptions,Space,Steps,Table,Tag} from 'antd';
import LocalFilePicker from '../../components/LocalFilePicker.jsx';
import {prepareReportImport} from './prepareImport.mjs';
export default function ReportImportPanel({state,catalog,canEdit,frozen,onCommit,onTemplate}){
 const [files,setFiles]=useState([]),[preview,setPreview]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const running=useRef(false);
 const stale=preview&&preview.baseRevision!==state.revision;
 const locked=!canEdit||frozen;
 const reason=frozen?'Nguồn đang có báo cáo đã chốt. Mở lại kỳ làm việc tại Báo cáo giao ban trước khi nhập thêm.':'Chuyển vai trò sang Nhập / đối soát để chọn và nhập file.';
 async function inspect(){if(running.current||locked||!files.length)return;running.current=true;setBusy(true);setError('');setPreview(null);try{setPreview(await prepareReportImport(files,state,catalog));}catch(e){setError(e.message)}finally{running.current=false;setBusy(false)}}
 async function commit(){if(running.current||locked||!preview||stale)return;running.current=true;setBusy(true);try{if(await onCommit(preview)){setFiles([]);setPreview(null)}}catch(e){setError(e.message)}finally{running.current=false;setBusy(false)}}
 return <section className="panel report-import-panel"><div className="panel-head"><div><h2>Nhập file từ máy tính</h2><div className="subtle">Chọn file → kiểm tra trước → xác nhận nhập</div></div><Tag color="cyan">Excel / CSV · local</Tag></div>
  <Steps size="small" current={preview?1:0} items={[{title:'Chọn file'},{title:'Xem trước'},{title:'Nhập & đối soát'}]}/>
  <p className="subtle">File được đọc trên trình duyệt này. Việc chọn hoặc xem trước chưa thay đổi dữ liệu báo cáo.</p>
  <LocalFilePicker files={files} disabled={locked||busy} reason={reason} onChange={next=>{setFiles(next);setPreview(null);setError('')}}/>
  <Space wrap style={{marginTop:16}}><Button type="primary" loading={busy} disabled={locked||!files.length} onClick={inspect}>Kiểm tra & xem trước</Button><Button onClick={onTemplate}>Tải file mẫu Excel</Button></Space>
  {error&&<Alert style={{marginTop:16}} type="error" showIcon message="Chưa nhập file" description={error}/>}
  {preview&&<div style={{marginTop:20}}><Alert type={stale?'warning':preview.issues.length?'warning':'success'} showIcon message={stale?'Dữ liệu đã đổi. Hãy kiểm tra lại trước khi nhập.':`${preview.readCount} dòng đã đọc · ${preview.rows.length} dòng sẽ thêm`} description={`${preview.skippedFiles.length} file trùng nội dung không nhập lại; ${preview.duplicateCount} dòng giống hệt được bỏ. ${preview.issues.length} dòng mới có lỗi và ${preview.existingConflicts.length} dòng hiện tại cần đối soát. Dòng lỗi bị cách ly khỏi tổng hợp cho tới khi xử lý.`}/>
   <Table style={{marginTop:12}} size="small" rowKey={r=>r.hash+r.file} dataSource={[...preview.files,...preview.skippedFiles.map(f=>({...f,skipped:true}))]} pagination={false} scroll={{x:550}} columns={[{title:'File đã chọn',dataIndex:'file'},{title:'Sheet',dataIndex:'sheet'},{title:'Dòng',dataIndex:'count'},{title:'Trạng thái',render:(_,f)=><Tag color={f.skipped?'default':'cyan'}>{f.skipped?'Bỏ file trùng':'Sẵn sàng nhập'}</Tag>}]}/>
   <h3 style={{margin:'18px 0 10px'}}>Xem trước dòng dữ liệu</h3><Table size="small" rowKey={(_,i)=>i} dataSource={preview.rows.slice(0,5)} pagination={false} scroll={{x:750}} columns={[{title:'Chỉ định',dataIndex:'order_id'},{title:'Mã BN / lượt',render:(_,r)=><>{r.patient_id}<div className="subtle">{r.visit_id}</div></>},{title:'Dịch vụ',dataIndex:'service_code'},{title:'Trạng thái',dataIndex:'status'},{title:'Nguồn',render:(_,r)=>`${r.source_file} · ${r.source_sheet} · dòng ${r.source_row}`}]} locale={{emptyText:'Không có dòng mới để nhập.'}}/>
   <Descriptions size="small" column={1} style={{margin:'16px 0'}} items={[{key:'scope',label:'Phạm vi nhập',children:`Thêm vào ${state.rows.length} dòng hiện tại; không thay thế hoặc tự ghép bệnh nhân.`},{key:'mapping',label:'Cấu trúc',children:'Sheet CANONICAL hoặc sheet đầu. Hỗ trợ tên cột chuẩn và các tên tiếng Việt đã ánh xạ.'}]}/>
   <Button type="primary" loading={busy} disabled={locked||stale||!preview.files.length} onClick={commit}>Xác nhận nhập vào dữ liệu báo cáo</Button>
  </div>}
 </section>;
}
