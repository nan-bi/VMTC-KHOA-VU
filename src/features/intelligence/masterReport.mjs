import {integer,sumMoney} from '../../shared/dataRules.mjs';
import {TAT_POLICY} from './tat.mjs';
export const MASTER_VERSION='VU-MASTER-1';
const numberOrNull=x=>integer(x)?+x:null;
function netOf(r){
 if(!r.eligible||!r.performedInPeriod)return null;
 const v=r.row,n=numberOrNull(v.completed_net_vnd);
 if(n===null)return null;
 if(v.price_mode==='TRONGGOI'&&(numberOrNull(v.package_allocation_vnd)!==n||!v.package_id))return null;
 return n;
}
export function masterReport(analysis,{files}={}){
 if(!analysis?.records||analysis.error)throw Error('Chưa có dữ liệu phân tích hợp lệ.');
 const records=analysis.records,visible=records.filter(r=>r.orderedInPeriod||r.performedInPeriod),valid=visible.filter(r=>r.eligible),related=valid.filter(r=>r.routing_category!=='EXTERNAL_UNRELATED'),ordered=related.filter(r=>r.orderedInPeriod),completed=related.filter(r=>r.performedInPeriod);
 const exceptions=visible.filter(r=>r.warnings.length&&!r.warnings.some(w=>w.code==='DUPLICATE_EXCLUDED'));
 const sourceFiles=files?files.map(f=>({file_name:f.file,sheet_name:f.sheet,records_count:f.count,file_sha256:f.hash})):Array.from(records.reduce((m,r)=>{const v=r.row,key=JSON.stringify([v.source_file||null,v.source_sheet||null,v.source_file_hash||null]);if(!m.has(key))m.set(key,{file_name:v.source_file||null,sheet_name:v.source_sheet||null,file_sha256:v.source_file_hash||null,records_count:0});m.get(key).records_count++;return m;},new Map()).values());
 const financial=route=>{
  const rs=completed.filter(r=>r.routing_category===route),known=rs.filter(r=>numberOrNull(r.row.completed_gross_vnd)!==null);
  return {known_vnd:sumMoney(known.map(r=>r.row.completed_gross_vnd)),missing_records:rs.length-known.length};
 };
 const internal=financial('VU_INTERNAL'),outbound=financial('VU_OUTBOUND');
 const summary={total_visits:new Set(ordered.map(r=>r.row.visit_id)).size,total_unique_patients:new Set(ordered.map(r=>r.row.patient_id)).size,in_house_completed_services:completed.filter(r=>r.routing_category==='VU_INTERNAL').length,outbound_referrals_to_other_depts:ordered.filter(r=>r.routing_category==='VU_OUTBOUND').length,inbound_referrals_from_other_depts:ordered.filter(r=>r.routing_category==='VU_INBOUND').length,biopsy_and_interventions_count:analysis.kpis.interventions,estimated_gross_inhouse_vnd:internal.missing_records?null:internal.known_vnd,estimated_gross_outbound_vnd:outbound.missing_records?null:outbound.known_vnd};
 return {
  system_status:exceptions.length?'NEED_MANUAL_REVIEW':'SUCCESS',schema_version:MASTER_VERSION,
  ingestion_summary:{files_received:sourceFiles,total_raw_rows:records.length,valid_rows:records.filter(r=>r.eligible).length,duplicates_omitted:analysis.duplicates,exceptions_flagged:records.filter(r=>r.warnings.length&&!r.warnings.some(w=>w.code==='DUPLICATE_EXCLUDED')).length},
  breast_department_kpis:summary,
  categorized_records:visible.map(r=>{const v=r.row,net=netOf(r),unit=numberOrNull(v.unit_price_vnd),dupe=r.warnings.some(w=>w.code==='DUPLICATE_EXCLUDED');return {order_id:v.order_id,patient_id:v.patient_id,visit_id:v.visit_id,service_code:v.service_code,service_name:v.service_name??null,ordering_dept:r.ordering,performing_dept:r.performing,routing_type:r.routing_category,unit_price_vnd:unit,net_price_vnd:net,price_status:net===null||unit===null?'PARTIAL_UNKNOWN':'FULL_KNOWN',order_status:v.status,review_status:dupe?'DUPLICATE_OMITTED':!r.eligible&&!['HUY','HOANTIEN'].includes(v.status)?'NEED_MANUAL_REVIEW':r.warnings.length?'REVIEW_WARNINGS':'VALID',eligible:r.eligible,contributes_completed:r.eligible&&r.performedInPeriod&&r.routing_category!=='EXTERNAL_UNRELATED',in_order_period:r.orderedInPeriod,in_performed_period:r.performedInPeriod,price_mode:v.price_mode,ordering_doctor_id:v.ordering_doctor_id??null,ordering_doctor_name:v.ordering_doctor_name??null,performing_doctor_id:v.performing_doctor_id??null,performing_doctor_name:v.performing_doctor_name??null,source_audit:{file_name:v.source_file??null,sheet_name:v.source_sheet??null,row_index:v.source_row??null,file_sha256:v.source_file_hash??null},tat:r.tat};}),
  anomalies_and_audit_notes:visible.flatMap(r=>r.warnings.map(w=>({order_id:r.row.order_id,issue_type:w.code==='DUPLICATE_EXCLUDED'?'DUPLICATE_OMITTED':w.code==='INVALID_INPUT'?'NEED_MANUAL_REVIEW':w.code==='MISSING_ALLOCATION'?'UNKNOWN_NET':w.code,description:w.description,source_reference:{file_name:r.row.source_file??null,sheet_name:r.row.source_sheet??null,row_index:r.row.source_row??null,file_sha256:r.row.source_file_hash??null}}))),
  report_context:{from:analysis.from,to_exclusive:analysis.toExclusive,timezone:'Asia/Ho_Chi_Minh',profile:analysis.profile,rules_version:analysis.rulesVersion,kpi_scope:'KPI và categorized_records theo hợp ngày chỉ định / hoàn thành trong kỳ. Ingestion tính toàn nguồn.',units:{services:'dòng dịch vụ; không phải số ca hay số bệnh nhân',referrals:'dòng chỉ định trong kỳ; chưa phải distinct lượt chuyển khoa',visits:'distinct visit_id có chỉ định liên quan Vú trong kỳ',gross:'thành tiền hoàn thành trong kỳ, trước giảm; không phải thực thu',net_price_vnd:'thành tiền hoàn thành sau giảm/phân bổ của dòng, không phải đơn giá'},financial_views:analysis.finance,financial_warning:'Không cộng doanh thu chỉ định và thực hiện. Gói chỉ ghi nhận phân bổ thực tế đã đối soát; null không phải 0.',tat_policy:TAT_POLICY,tat_summary:{delayed:valid.filter(r=>r.tat?.status==='DELAYED_TAT').length,known_within_threshold:valid.filter(r=>r.tat?.status==='WITHIN_TAT').length,unknown:valid.filter(r=>r.tat?.status==='UNKNOWN_RETURN_TIME').length,invalid:valid.filter(r=>r.tat?.status==='INVALID_TAT_TIME').length},provenance_warning:'Metadata thiếu để null. Nguồn trình duyệt và file xuất không thay thế kho audit server bất biến.'}
 };
}
export function makeAuditNote(result,question,text,{now=new Date().toISOString()}={}){
 if(!result||result.unsupported||!result.rows?.length)throw Error('Cần kết quả truy vết có bằng chứng trước khi ghi chú.');
 if(typeof text!=='string'||!text.trim()||text.trim().length>2000)throw Error('Ghi chú từ 1–2000 ký tự.');
 return structuredClone({schema_version:MASTER_VERSION,created_at:now,question,mode:result.mode,scope:result.scopeText,rules_version:result.rulesVersion,answer:result.answer,note:text.trim(),evidence:result.rows.map(r=>({key:r.key,order_id:r.order_id,patient_id:r.patient_id,visit_id:r.visit_id,citation:r.citation,file_sha256:r.source_file_hash,contributes:r.contributes,value:r.value,tat:r.tat})),warning:'Ghi chú phiên local; không sửa dữ liệu gốc, chưa phải phê duyệt chuyên môn.'});
}
