import {sumMoney} from '../../shared/dataRules.mjs';
export const EXECUTIVE_SHEETS=['01_TONG_HOP_GIAO_BAN','02_KHOA_VU_TU_THUC_HIEN','03_KHOA_NGOAI_CHUYEN_DEN','04_KHOA_VU_GUI_KHOA_BAN','05_CHI_TIET_GOI_DICH_VU'];
const columns=['STT','Mã chỉ định','Mã BN','Mã lượt','Mã dịch vụ','Tên dịch vụ','Khoa chỉ định','Bác sĩ chỉ định','Khoa thực hiện','Phòng thực hiện','Ngày chỉ định','Ngày hoàn thành','Số lượng','Số lượng hoàn thành','Đơn giá VND','Thành tiền trước giảm','Thành tiền sau giảm','Giá trị dịch vụ chỉ định','Mã gói','Tên gói dịch vụ','Cơ chế giá','Trạng thái','Đủ điều kiện','Trong kỳ chỉ định','Trong kỳ thực hiện','Ghi nhận chỉ định VND','Ghi nhận thực hiện trước giảm VND','Ghi nhận thực hiện sau giảm VND','Cảnh báo','File nguồn','Sheet nguồn','Dòng nguồn','SHA-256 file'];
const packageColumns=['STT','Mã gói','Tên gói dịch vụ','Mã chỉ định con','Mã BN','Mã lượt','Dịch vụ trong gói','Khoa chỉ định','Khoa thực hiện','Giá gốc dịch vụ','Tiền phân bổ nguồn','Tiền phân bổ thực tế cho Khoa Vú','Tiền phân bổ cho khoa khác','Trạng thái','Đóng góp phân bổ','Cảnh báo','File nguồn','Sheet nguồn','Dòng nguồn','SHA-256 file'];
const sum=(rs,fn)=>sumMoney(rs.map(fn).filter(v=>v!=null));
export function executiveReport(snapshot){
 const a=snapshot.analysis,period=r=>r.orderedInPeriod||r.performedInPeriod,related=r=>r.routing_category&&r.routing_category!=='EXTERNAL_UNRELATED';
 const ordered=r=>r.eligible&&r.orderedInPeriod&&r.ordering==='VU';
 const performed=r=>r.eligible&&r.performedInPeriod&&r.performing==='VU';
 const provenance=r=>({'File nguồn':r.row.source_file??null,'Sheet nguồn':r.row.source_sheet??null,'Dòng nguồn':r.row.source_row??null,'SHA-256 file':r.row.source_file_hash??null});
 const detail=(r,i)=>{const v=r.row;return {'STT':i+1,'Mã chỉ định':v.order_id,'Mã BN':v.patient_id,'Mã lượt':v.visit_id,'Mã dịch vụ':v.service_code,'Tên dịch vụ':v.service_name??null,'Khoa chỉ định':v.ordering_dept,'Bác sĩ chỉ định':v.ordering_doctor_name??v.ordering_doctor??null,'Khoa thực hiện':v.performing_dept,'Phòng thực hiện':v.performing_room??null,'Ngày chỉ định':v.ordered_at,'Ngày hoàn thành':v.completed_at??null,'Số lượng':v.quantity,'Số lượng hoàn thành':v.completed_qty??null,'Đơn giá VND':v.unit_price_vnd,'Thành tiền trước giảm':v.completed_gross_vnd??null,'Thành tiền sau giảm':v.completed_net_vnd??null,'Giá trị dịch vụ chỉ định':v.gross_order_vnd??null,'Mã gói':v.package_id??null,'Tên gói dịch vụ':v.package_name??null,'Cơ chế giá':v.price_mode,'Trạng thái':v.status,'Đủ điều kiện':r.eligible?1:0,'Trong kỳ chỉ định':r.orderedInPeriod?1:0,'Trong kỳ thực hiện':r.performedInPeriod?1:0,'Ghi nhận chỉ định VND':ordered(r)?r.orderGross:null,'Ghi nhận thực hiện trước giảm VND':performed(r)?v.completed_gross_vnd:null,'Ghi nhận thực hiện sau giảm VND':performed(r)?v.completed_net_vnd:null,'Cảnh báo':r.warnings.map(w=>w.code+': '+w.description).join('; '),...provenance(r)};};
 const routeRows=route=>a.records.filter(r=>period(r)&&r.routing_category===route).map(detail);
 const sheets=[{name:EXECUTIVE_SHEETS[0],rows:[],columns:['Chỉ tiêu','Số lượng','Đơn vị tính','Giá trị VND','Thiếu dữ liệu','Ghi chú']},...['VU_INTERNAL','VU_INBOUND','VU_OUTBOUND'].map((route,i)=>({name:EXECUTIVE_SHEETS[i+1],rows:routeRows(route),columns}))];
 const summary=sheets[0].rows;
 const metric=(name,qty,unit,value=null,note='',missing=null)=>summary.push({'Chỉ tiêu':name,'Số lượng':qty,'Đơn vị tính':unit,'Giá trị VND':value,'Thiếu dữ liệu':missing,'Ghi chú':note});
 const completed=a.records.filter(r=>r.eligible&&r.performedInPeriod&&related(r));
 const exams=completed.filter(r=>r.performing==='VU'&&r.kpi_category==='KHÁM');
 metric('Lượt khám hoàn thành tại Khoa Vú',new Set(exams.map(r=>r.row.visit_id)).size,'lượt',null,'visit_id duy nhất có dòng khám hoàn thành tại Vú; gồm nội bộ và chuyển đến.');
 metric('Can thiệp hoàn thành tại Vú',completed.filter(r=>r.performing==='VU'&&r.kpi_category==='CAN_THIỆP_TIỂU_PHẪU').length,'dòng dịch vụ',null,'Chưa có mã ca thủ thuật; không đổi số dòng thành số ca.');
 metric('CĐHA cao cấp hoàn thành liên quan Vú',completed.filter(r=>r.kpi_category==='CĐHA_CAO_CẤP').length,'dòng dịch vụ',null,'Bao gồm tại Vú và liên khoa theo nơi thực hiện thực tế.');
 for(const [route,label] of [['VU_INTERNAL','Khoa Vú tự thực hiện'],['VU_INBOUND','Khoa khác chuyển đến Vú']]){
  const rs=a.records.filter(r=>performed(r)&&r.routing_category===route);
  metric(label+' · trước giảm',rs.length,'dòng hoàn thành',sum(rs,r=>r.row.completed_gross_vnd),'Theo ngày hoàn thành; đối chiếu cột Ghi nhận thực hiện trước giảm VND tại sheet luồng.');
  metric(label+' · sau giảm/phân bổ đã biết',rs.length,'dòng hoàn thành',sum(rs,r=>r.row.completed_net_vnd),'Chỉ cộng số tiền nguồn đã biết.',rs.filter(r=>r.row.completed_net_vnd==null).length);
 }
 const outbound=a.records.filter(r=>ordered(r)&&r.routing_category==='VU_OUTBOUND');
 metric('Vú gửi khoa bạn · giá trị chỉ định đã biết',outbound.length,'dòng chỉ định',sum(outbound,r=>r.orderGross),'Theo ngày chỉ định, không phải doanh thu Vú thực hiện hoặc tiền thực thu.',outbound.filter(r=>r.orderGross==null).length);
 metric('Vú chỉ định · tổng giá trị đã biết',a.records.filter(ordered).length,'dòng chỉ định',a.finance.ordered.known_vnd,'Gồm nội bộ và chuyển ra; không cộng với góc nhìn thực hiện.',a.finance.ordered.missing_records);
 metric('Vú thực hiện · tổng trước giảm',a.records.filter(performed).length,'dòng hoàn thành',a.finance.performed.gross_vnd,'Bằng tổng nội bộ và chuyển đến, theo ngày hoàn thành.');
 metric('Vú thực hiện · tổng sau giảm/phân bổ đã biết',a.records.filter(performed).length,'dòng hoàn thành',a.finance.performed.known_net_vnd,'Không tự tính giảm giá/phân bổ thiếu.',a.finance.performed.missing_net_records);
 const referral=a.kpis.referral;
 metric('Chuyển tiếp CĐHA cao cấp / di truyền',referral.percent,'%',null,`${referral.numerator}/${referral.denominator} lượt đủ điều kiện; ${referral.percent==null?'chưa đủ mẫu số.':''} không chứng minh giữ chân BN hoặc quan hệ nhân quả.`);
 const inPeriod=a.records.filter(period);
 metric('Dòng bị chặn trong kỳ',inPeriod.filter(r=>!r.eligible&&!r.warnings.some(w=>w.code==='DUPLICATE_EXCLUDED')).length,'dòng',null,'Không ghi nhận tiền; xem file đối soát 10 sheet cho toàn bộ dòng chưa phân loại.');
 metric('Bản trùng loại khỏi tổng trong kỳ',inPeriod.filter(r=>r.warnings.some(w=>w.code==='DUPLICATE_EXCLUDED')).length,'dòng',null,'Giữ bản nguồn để truy vết; nhóm cùng mã khác nội dung bị cách ly toàn bộ.');
 // Package comparison is scoped to the same patient AND visit. A package product ID is not an episode ID.
 const packageKey=r=>r.row.package_id&&r.row.patient_id&&r.row.visit_id?JSON.stringify([r.row.package_id,r.row.patient_id,r.row.visit_id]):null;
 const packageKeys=new Set(a.records.filter(r=>period(r)&&related(r)&&r.row.price_mode==='TRONGGOI').map(packageKey).filter(Boolean));
 const packages=a.records.filter(r=>period(r)&&r.row.price_mode==='TRONGGOI'&&(related(r)||packageKeys.has(packageKey(r))));
 const allocations=packages.map((r,i)=>{const v=r.row,valid=r.eligible&&r.performedInPeriod&&+v.discount_known===1&&v.package_allocation_vnd!=null&&v.completed_net_vnd!=null&&+v.package_allocation_vnd===+v.completed_net_vnd;return {'STT':i+1,'Mã gói':v.package_id??null,'Tên gói dịch vụ':v.package_name??null,'Mã chỉ định con':v.order_id,'Mã BN':v.patient_id,'Mã lượt':v.visit_id,'Dịch vụ trong gói':v.service_name??null,'Khoa chỉ định':v.ordering_dept,'Khoa thực hiện':v.performing_dept,'Giá gốc dịch vụ':v.unit_price_vnd,'Tiền phân bổ nguồn':v.package_allocation_vnd??null,'Tiền phân bổ thực tế cho Khoa Vú':valid&&r.performing==='VU'?v.package_allocation_vnd:null,'Tiền phân bổ cho khoa khác':valid&&r.performing!=='VU'?v.package_allocation_vnd:null,'Trạng thái':v.status,'Đóng góp phân bổ':valid?1:0,'Cảnh báo':[...r.warnings.map(w=>w.code),...(!v.package_id?['Thiếu mã gói']:[]),...(v.package_allocation_vnd==null?['Thiếu tiền phân bổ nguồn']:[])].join('; '),...provenance(r)};});
 sheets.push({name:EXECUTIVE_SHEETS[4],rows:allocations,columns:packageColumns});
 metric('Phân bổ gói đã biết cho Vú',allocations.filter(r=>r['Tiền phân bổ thực tế cho Khoa Vú']!=null).length,'dòng hoàn thành',sum(allocations,r=>r['Tiền phân bổ thực tế cho Khoa Vú']),'Đã nằm trong góc nhìn thực hiện; không cộng thêm với sheet luồng.',packages.filter(r=>performed(r)&&r.row.completed_net_vnd==null).length);
 for(const [name,note] of [['Mã bộ báo cáo',snapshot.meta.id],['SHA-256 snapshot',snapshot.meta.sha256],['Kỳ báo cáo',`${a.from} → trước ${a.toExclusive} · Asia/Ho_Chi_Minh`],['Thời điểm tạo UTC',snapshot.meta.createdAt],['Địa bàn / quy tắc',`${snapshot.meta.profileName} · ${a.rulesVersion}`],['Cách đọc',snapshot.meta.note],['Phạm vi chi tiết','Sheet 02–04 giữ các dòng phân loại được, có ngày chỉ định hoặc hoàn thành trong kỳ, kể cả dòng bị loại. Chỉ cộng cột Ghi nhận đúng góc nhìn.'],['Phạm vi gói','Sheet 05 là lát cắt bổ sung, có thể trùng sheet 02–04. Khoa khác trong cùng gói chỉ nối bằng mã gói + mã BN + mã lượt, không nối khác khách. Chỉ nhận price_mode=TRONGGOI; không đoán từ tên.'],['Thông tin thiếu','Tên gói, bác sĩ và metadata thiếu để trống. Nguồn chưa phân loại/ngoài phạm vi không tạo sheet riêng; dùng bản 10 sheet để truy toàn nguồn.'],['Nhận xét tự động','Nhận xét theo quy tắc từ các số đếm phía trên, chưa gọi AI. Chưa so sánh kỳ trước hoặc có đủ dữ liệu bệnh tật để kết luận xu hướng.'],['Loại báo cáo','Snapshot số liệu đã tính; sửa ô Excel không tự cập nhật tổng.']])metric(name,null,null,null,note);
 return {meta:snapshot.meta,sheets};
}
export async function executiveWorkbook(snapshot){
 const XLSX=await import('xlsx'),report=executiveReport(snapshot),book=XLSX.utils.book_new();
 book.Props={Title:'Giao ban Khoa Vú · 5 sheet',Subject:snapshot.meta.id,Comments:snapshot.meta.note};
 for(const data of report.sheets){
  const rows=data.rows.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>{if(typeof v==='string'&&v.length>32767)throw Error('Có ô báo cáo vượt 32.767 ký tự; cần tách nội dung trước khi xuất.');return [k,v??null]})));
  const sheet=XLSX.utils.json_to_sheet(rows,{header:data.columns});sheet['!autofilter']={ref:sheet['!ref']};sheet['!cols']=data.columns.map(k=>({wch:k==='STT'?6:k==='Chỉ tiêu'?65:k==='Ghi chú'?110:k==='Cảnh báo'?85:Math.max(k.length+2,/Tên|Dịch vụ|File|SHA/.test(k)?40:/tiền|VND|phân bổ/i.test(k)?24:22)}));
  const range=XLSX.utils.decode_range(sheet['!ref']);for(let r=1;r<=range.e.r;r++)for(let c=0;c<=range.e.c;c++){const cell=sheet[XLSX.utils.encode_cell({r,c})];if(cell?.t==='n')cell.z=Number.isInteger(cell.v)?'#,##0':'#,##0.######';}
  XLSX.utils.book_append_sheet(book,sheet,data.name);
 }
 return {book,report,bytes:XLSX.write(book,{bookType:'xlsx',type:'array',compression:true})};
}
