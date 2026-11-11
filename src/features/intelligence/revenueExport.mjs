import {sumMoney} from '../../shared/dataRules.mjs';
import {ROUTE_NAMES,ROOM_PROFILES} from './routing.mjs';
export const EXPORT_NOTE='Hai góc nhìn chỉ định và thực hiện có phần chồng lấp, không cộng thành tổng doanh thu. Chưa phải tiền thực thu. Ô trống là thiếu dữ liệu, không phải 0.';
export const PRICE_NAMES={MUALE:'Mua lẻ',THEMNGOAIGOI:'Phát sinh ngoài gói',TRONGGOI:'Trong gói'};
const safeCell=v=>{const x=v==null?null:typeof v==='object'?JSON.stringify(v):typeof v==='number'&&!Number.isFinite(v)?String(v):v;if(typeof x==='string'&&x.length>32767)throw Error('Có ô nguồn dài quá 32.767 ký tự; cần tách nội dung trước khi xuất Excel đầy đủ.');return x;};
export async function revenueSnapshot(analysis){
 if(!analysis?.records||analysis.error)throw Error('Chưa có kết quả tính hợp lệ để xuất.');
 const a=structuredClone(analysis),encoded=new TextEncoder().encode(JSON.stringify(a));
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoded))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const meta={id:'BC-'+crypto.randomUUID().toUpperCase(),createdAt:new Date().toISOString(),sha256,from:a.from,toExclusive:a.toExclusive,rulesVersion:a.rulesVersion,profile:a.profile,profileName:ROOM_PROFILES[a.profile].name,currency:'VND',note:EXPORT_NOTE};
 const ordered=r=>r.eligible&&r.orderedInPeriod&&r.ordering==='VU';
 const performed=r=>r.eligible&&r.performedInPeriod&&r.performing==='VU';
 const detail=r=>({order_id:r.row.order_id,patient_id:r.row.patient_id,visit_id:r.row.visit_id,source_file:r.row.source_file??null,source_row:r.row.source_row??r.index+1,...Object.fromEntries(Object.entries(r.row).map(([k,v])=>[k,safeCell(v)])),routing_category:r.routing_category,kpi_category:r.kpi_category,eligible:r.eligible?1:0,counted_order:ordered(r)?1:0,counted_performed:performed(r)?1:0,action_required:r.action_required,warnings:r.warnings.map(w=>w.code).join('; ')});
 const routeRows=a.routing.map(t=>{const rs=a.records.filter(r=>r.routing_category===t.route),ord=rs.filter(ordered),perf=rs.filter(performed);return {Luồng:ROUTE_NAMES[t.route],'Dòng chỉ định trong kỳ':t.records,'Dòng hoàn thành trong kỳ':t.performed_records,'Vú chỉ định đã biết VND':sumMoney(ord.filter(r=>r.orderGross!=null).map(r=>r.orderGross)),'Dòng thiếu tiền chỉ định':ord.filter(r=>r.orderGross==null).length,'Vú thực hiện trước giảm VND':sumMoney(perf.map(r=>r.row.completed_gross_vnd)),'Sau giảm đã biết VND':sumMoney(perf.filter(r=>r.row.completed_net_vnd!=null).map(r=>r.row.completed_net_vnd)),'Dòng thiếu sau giảm':perf.filter(r=>r.row.completed_net_vnd==null).length};});
 const buckets=a.finance.buckets.map(b=>({'Cơ chế giá':PRICE_NAMES[b.mode],'Mã':b.mode,'Vú chỉ định đã biết VND':b.ordered.known_vnd,'Dòng thiếu tiền chỉ định':b.ordered.missing_records,'Vú thực hiện trước giảm VND':b.performed.gross_vnd,'Sau giảm / phân bổ đã biết VND':b.performed.known_net_vnd,'Dòng thiếu sau giảm / phân bổ':b.performed.missing_net_records}));
 const summaries=[['Vú chỉ định · trước giảm đã biết',a.finance.ordered.known_vnd,'VND'],['Thiếu tiền chỉ định',a.finance.ordered.missing_records,'dòng'],['Vú thực hiện · trước giảm',a.finance.performed.gross_vnd,'VND'],['Vú thực hiện · sau giảm đã biết',a.finance.performed.known_net_vnd,'VND'],['Thiếu sau giảm / phân bổ',a.finance.performed.missing_net_records,'dòng'],['Vú chỉ định ra khoa khác · đã biết',a.finance.outbound.known_vnd,'VND'],['Dòng nguồn toàn bộ',a.total,'dòng'],['Dòng trùng không cộng lại',a.duplicates,'dòng'],['Dòng bị chặn / loại trừ toàn nguồn',a.blocked,'dòng']];
 const sources=a.records.map(detail);
 return {meta,analysis:a,summaries,routeRows,buckets,sheets:[
  {name:'Tong_quan',rows:[{Mục:'Mã bộ báo cáo',Giá_trị:meta.id},{Mục:'Ngày bắt đầu',Giá_trị:meta.from},{Mục:'Ngày kết thúc không gồm',Giá_trị:meta.toExclusive},{Mục:'Tạo lúc UTC',Giá_trị:meta.createdAt},{Mục:'Múi giờ tính',Giá_trị:'Asia/Ho_Chi_Minh'},{Mục:'Quy tắc',Giá_trị:meta.rulesVersion},{Mục:'Địa bàn',Giá_trị:meta.profileName},{Mục:'SHA-256 kết quả',Giá_trị:meta.sha256},{Mục:'Phạm vi',Giá_trị:'Tổng hợp theo kỳ; Nguon_day_du và Doi_soat chứa toàn nguồn, kể cả ngoài kỳ.'},{Mục:'Cách đọc',Giá_trị:meta.note},{Mục:'Loại báo cáo',Giá_trị:'Snapshot số liệu đã tính; chỉnh ô nguồn trong Excel không tự tính lại tổng.'},...summaries.map(([Mục,Giá_trị,Đơn_vị])=>({Mục,Giá_trị,Đơn_vị}))]},
  {name:'Theo_luong',rows:routeRows},
  {name:'Co_che_gia',rows:buckets},
  {name:'KPI',rows:a.kpis.service_groups.map(g=>({'Nhóm KPI':g.category,'Dòng chỉ định liên quan Vú':g.ordered_records,'Dòng hoàn thành liên quan Vú':g.completed_records,'Đơn vị hoàn thành':g.completed_qty,'Dòng làm tại Vú':g.at_vu_records}))},
  {name:'Ty_le_va_dinh_nghia',rows:[{'Chỉ tiêu':'Referral CĐHA cao cấp / di truyền','Tử số':a.kpis.referral.numerator,'Mẫu số':a.kpis.referral.denominator,'Tỷ lệ %':a.kpis.referral.percent,'Giới hạn':'Cùng lượt, cùng kỳ; không chứng minh nhân quả hoặc giữ chân.'},{'Chỉ tiêu':'BI-RADS 4/5 đồng xuất hiện GPB/phẫu thuật','Tử số':a.kpis.birads.downstream_visits,'Mẫu số':a.kpis.birads.suspicious_visits,'Tỷ lệ %':a.kpis.birads.percent,'Giới hạn':`Có BI-RADS ${a.kpis.birads.observed}/${a.kpis.birads.imaging_records} dòng CĐHA. Chưa đủ dữ liệu thì tỷ lệ để trống; không kết luận ác tính.`}]},
  {name:'Chi_dinh',rows:a.records.filter(ordered).map(detail)},
  {name:'Thuc_hien',rows:a.records.filter(performed).map(detail)},
  {name:'Trong_goi',rows:a.records.filter(r=>r.row.price_mode==='TRONGGOI'&&(ordered(r)||performed(r))).map(detail)},
  {name:'Doi_soat',rows:a.warnings.map(w=>({...w,'Trong kỳ':a.records.find(r=>r.key===w.key)?.orderedInPeriod||a.records.find(r=>r.key===w.key)?.performedInPeriod?1:0}))},
  {name:'Nguon_day_du',rows:sources},
 ]};
}
export async function revenueWorkbook(snapshot){
 const XLSX=await import('xlsx'),book=XLSX.utils.book_new();
 book.Props={Title:'Báo cáo giá trị dịch vụ Khoa Vú',Subject:snapshot.meta.id,Comments:snapshot.meta.note};
 for(const data of snapshot.sheets){
  const rows=data.rows.length?data.rows:[{Thông_tin:'Không có dòng trong phạm vi này'}];
  const sheet=XLSX.utils.json_to_sheet(rows);const range=XLSX.utils.decode_range(sheet['!ref']);
  sheet['!autofilter']={ref:sheet['!ref']};sheet['!cols']=Array.from({length:range.e.c+1},(_,c)=>({wch:data.name==='Tong_quan'?(c===0?40:90):c===0?34:24}));
  for(let r=1;r<=range.e.r;r++)for(let c=0;c<=range.e.c;c++){const cell=sheet[XLSX.utils.encode_cell({r,c})];if(cell?.t==='n')cell.z=Number.isInteger(cell.v)?'#,##0':'#,##0.######';}
  XLSX.utils.book_append_sheet(book,sheet,data.name);
 }
 return {book,bytes:XLSX.write(book,{bookType:'xlsx',type:'array',compression:true})};
}
const format=n=>new Intl.NumberFormat('vi-VN').format(n);
export async function revenuePresentation(snapshot){
 const {default:PptxGenJS}=await import('pptxgenjs');const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Khoa Vú · Prototype local';pptx.subject=snapshot.meta.id;pptx.title='Giá trị dịch vụ Khoa Vú';pptx.lang='vi-VN';pptx.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'vi-VN'};
 const teal='006F73',ink='24474C',muted='5C7477',bg='F5F9F9';
 let slideNumber=0;
 function slide(title,subtitle){const s=pptx.addSlide();s.background={color:bg};s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.16,fill:{color:teal},line:{color:teal}});s.addText(title,{x:.65,y:.48,w:12,h:.65,fontSize:28,bold:true,color:ink,margin:0});s.addText(subtitle,{x:.65,y:1.22,w:12,h:.6,fontSize:14,color:muted,margin:0});s.addText(`${snapshot.meta.from} → trước ${snapshot.meta.toExclusive} · ${snapshot.meta.rulesVersion} · ${++slideNumber}`,{x:.65,y:7,w:12,h:.25,fontSize:10,color:muted,margin:0});s.addNotes(`Bộ số liệu ${snapshot.meta.id}\nSHA-256 ${snapshot.meta.sha256}\n${snapshot.meta.note}\nNguồn: snapshot phân tích local, không gọi AI.`);return s;}
 const table=(s,headers,rows,widths,y=2)=>{const styled=[headers.map(text=>({text,options:{bold:true,color:'FFFFFF',fill:teal}})),...rows.map(row=>row.map(v=>String(v??'Chưa đủ dữ liệu')))];s.addTable(styled,{x:.65,y,w:12.03,colW:widths,border:{type:'solid',pt:.5,color:'D5E1E1'},color:ink,fontFace:'Arial',fontSize:15,margin:.12,rowH:.55,fill:'FFFFFF',autoPage:false,verbose:false});};
 let s=slide('Giá trị dịch vụ Khoa Vú','Hai góc nhìn độc lập: khoa chỉ định và khoa thực hiện. Đơn vị tiền: VND.');
 table(s,['Chỉ tiêu','Giá trị đã biết','Thiếu dữ liệu'],[['Vú chỉ định · trước giảm',format(snapshot.analysis.finance.ordered.known_vnd),`${snapshot.analysis.finance.ordered.missing_records} dòng`],['Vú thực hiện · trước giảm',format(snapshot.analysis.finance.performed.gross_vnd),'Theo ngày hoàn thành'],['Vú thực hiện · sau giảm / phân bổ',format(snapshot.analysis.finance.performed.known_net_vnd),`${snapshot.analysis.finance.performed.missing_net_records} dòng`]], [6,3,3]);
 s.addText('Không cộng hai góc nhìn thành tổng doanh thu. Chưa phải tiền thực thu.',{x:.65,y:6.3,w:12,h:.48,fontSize:16,bold:true,color:teal,margin:0});
 s=slide('Giá trị theo từng luồng','Dòng làm tại khoa và liên khoa được tách theo nơi chỉ định / thực hiện.');
 table(s,['Luồng','Vú chỉ định đã biết','Vú thực hiện trước giảm','Sau giảm đã biết'],snapshot.routeRows.map(r=>[r.Luồng,...['Vú chỉ định đã biết VND','Vú thực hiện trước giảm VND','Sau giảm đã biết VND'].map(k=>format(r[k]))]),[4.5,2.5,2.5,2.5]);
 s=slide('Mua lẻ, phát sinh và phân bổ gói','Giá trước giảm của dòng trong gói là tham chiếu nguồn, không phải khoản thu thêm.');
 table(s,['Cơ chế giá','Vú chỉ định đã biết','Vú thực hiện trước giảm','Sau giảm / phân bổ'],snapshot.buckets.map(r=>[r['Cơ chế giá'],...['Vú chỉ định đã biết VND','Vú thực hiện trước giảm VND','Sau giảm / phân bổ đã biết VND'].map(k=>format(r[k]))]),[4.5,2.5,2.5,2.5]);
 const groups=snapshot.analysis.kpis.service_groups;for(let i=0;i<groups.length;i+=6){s=slide(`Sản lượng theo nhóm dịch vụ${groups.length>6?` · phần ${Math.floor(i/6)+1}`:''}`,'Dòng dịch vụ, đơn vị hoàn thành và lượt bệnh nhân là các đại lượng khác nhau.');table(s,['Nhóm KPI','Dòng chỉ định','Dòng hoàn thành','Đơn vị hoàn thành','Dòng làm tại Vú'],groups.slice(i,i+6).map(g=>[g.category,g.ordered_records,g.completed_records,format(g.completed_qty),g.at_vu_records]),[4.1,1.95,1.95,2,2]);}
 s=slide('Chất lượng dữ liệu và phạm vi báo cáo','Số liệu trình bày là phần đủ điều kiện; ngoại lệ và nguồn đầy đủ có trong Excel.');
 table(s,['Nội dung','Số liệu / giới hạn'],[['Dòng nguồn toàn bộ',snapshot.analysis.total],['Dòng bị chặn / loại trừ toàn nguồn',snapshot.analysis.blocked],['Dòng trùng không cộng lại',snapshot.analysis.duplicates],['BI-RADS có cấu trúc',`${snapshot.analysis.kpis.birads.observed}/${snapshot.analysis.kpis.birads.imaging_records} dòng CĐHA`],['Referral trong kỳ',snapshot.analysis.kpis.referral.percent==null?'Chưa đủ mẫu số':`${snapshot.analysis.kpis.referral.numerator}/${snapshot.analysis.kpis.referral.denominator} lượt · ${format(snapshot.analysis.kpis.referral.percent)}%`]], [6,6]);
 s=slide('Thông tin bộ xuất và cách đối chiếu','PowerPoint và Excel cùng dùng một snapshot; thay kỳ hoặc nguồn sẽ tạo bộ mới.');
 table(s,['Thuộc tính','Giá trị'],[['Mã bộ xuất',snapshot.meta.id],['Địa bàn phân tích',snapshot.meta.profileName],['Thời điểm tạo UTC',snapshot.meta.createdAt],['SHA-256 kết quả',snapshot.meta.sha256],['Đối chiếu Excel','Tong_quan, Theo_luong, Co_che_gia, Chi_dinh, Thuc_hien, Doi_soat, Nguon_day_du']], [3,9]);
 return pptx;
}
