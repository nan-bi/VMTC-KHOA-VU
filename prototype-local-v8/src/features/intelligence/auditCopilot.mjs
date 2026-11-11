import {sumMoney} from '../../shared/dataRules.mjs';
export const AUDIT_MODES={lookup:'Tra cứu & đối soát nguồn',ordered_count:'Dòng chỉ định liên quan Vú',performed_count:'Dòng hoàn thành liên quan Vú',ordered_money:'Vú chỉ định · trước giảm',performed_gross:'Vú thực hiện · trước giảm',performed_net:'Vú thực hiện · sau giảm / phân bổ'};
const norm=s=>String(s??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/_/g,' ').replace(/\s+/g,' ').trim();
export function citation(r){const v=r.row;return `[File: ${v.source_file||'Chưa có tên file'}, Sheet: ${v.source_sheet||'Chưa có metadata sheet'}, Dòng: ${v.source_row??'Chưa có metadata dòng'}, Khoa CĐ: ${v.ordering_dept??'Thiếu'}, Khoa TH: ${v.performing_dept??'Thiếu'}, Mã CĐ: ${v.order_id??'Thiếu'}, BS CĐ: ${v.ordering_doctor_name||v.ordering_doctor_id||'Chưa có'}, BS TH: ${v.performing_doctor_name||v.performing_doctor_id||'Chưa có'}]`;}
const categories=[[/sieu am/, 'SIÊU_ÂM'],[/x.?quang|mammo|tomo/,'XQ_VÚ'],[/\bmri\b|cong huong tu/,'CĐHA_CAO_CẤP'],[/\bbrca\b|di truyen|giai phau benh/,'GIẢI_PHẪU_BỆNH_GEN'],[/\bkham\b/,'KHÁM'],[/can thiep|sinh thiet|\bvabb\b|\bfna\b|core biopsy/,'CAN_THIỆP_TIỂU_PHẪU']];
export function askAudit(analysis,question,{mode='lookup',scope='period',fileCount}={}){
 if(!AUDIT_MODES[mode])throw Error('Chế độ truy vết không hợp lệ.');
 if(!['period','all'].includes(scope)||scope==='all'&&mode!=='lookup')throw Error('Tổng hợp chỉ áp dụng kỳ đang chọn; toàn nguồn chỉ dùng tra cứu.');
 const q=norm(question);if(!q||q.length>1000)throw Error('Nhập câu hỏi từ 1 đến 1.000 ký tự.');
 const records=analysis.records;
 const files=fileCount??new Set(records.map(r=>r.row.source_file||'Nguồn hiện tại')).size;
 const base=records.filter(r=>scope==='all'||r.orderedInPeriod||r.performedInPeriod);
 const filters=[],descriptions=[];let semanticQ=q;
 // Recognize exact known IDs/names first. Never use the first 8 rows to calculate a total.
 for(const field of ['patient_id','order_id','visit_id','service_code','patient_name']){
  const values=[...new Set(records.map(r=>r.row[field]).filter(v=>typeof v==='string'&&v.trim()))];
  const hits=values.filter(v=>{const n=norm(v),i=q.indexOf(n);return i>=0&&(!i||!/[\p{L}\p{N}-]/u.test(q[i-1]))&&(!q[i+n.length]||!/[\p{L}\p{N}-]/u.test(q[i+n.length]));});
  if(hits.length){filters.push(r=>hits.includes(r.row[field]));descriptions.push(`${field}: ${hits.join(', ')}`);for(const hit of hits)semanticQ=semanticQ.replaceAll(norm(hit),' ');}
 }
 const knownFiles=[...new Set(records.map(r=>r.row.source_file).filter(Boolean))].filter(f=>q.includes(norm(f)));
 const mentionedFiles=knownFiles.length?knownFiles:question.match(/[^\s"“”]+\.(?:xlsx|xls|csv)\b/gi)||[];
 if(mentionedFiles.length){filters.push(r=>mentionedFiles.some(f=>norm(f)===norm(r.row.source_file)));descriptions.push(`File: ${mentionedFiles.join(', ')}`);for(const f of mentionedFiles)semanticQ=semanticQ.replaceAll(norm(f),' ');}
 const cats=categories.filter(([re])=>re.test(semanticQ)).map(([,c])=>c);
 // A specific technique must not broaden to every intervention in its category.
 const technique=semanticQ.match(/\bvabb\b|\bfna\b|core biopsy|\bbrca\b|\bmri\b|\b3d\b/);
 if(technique){filters.push(r=>norm(r.row.service_name).includes(technique[0]));descriptions.push(`Kỹ thuật: ${technique[0]}`);}
 else if(cats.length){filters.push(r=>cats.includes(r.kpi_category));descriptions.push(`Nhóm: ${cats.join(', ')}`);}
 const quoted=[...question.matchAll(/["“]([^"”]+)["”]/g)].map(m=>norm(m[1]));
 if(quoted.length){filters.push(r=>quoted.some(t=>norm([r.row.service_name,r.row.patient_name,r.row.source_file].join(' ')).includes(t)));descriptions.push('Cụm từ trong ngoặc kép');}
 const unknownId=q.match(/\b(?:bn|pat|patient|ord|order|visit|lk)-[a-z0-9-]+\b/g);
 if(unknownId){filters.push(r=>unknownId.every(id=>[r.row.patient_id,r.row.order_id,r.row.visit_id].some(v=>norm(v)===id)));descriptions.push(`Mã yêu cầu: ${unknownId.join(', ')}`);}
 const idCounts=new Map();for(const r of records)idCounts.set(r.row.order_id,(idCounts.get(r.row.order_id)||0)+1);
 if(/vu gui|vu chi dinh.*khoa khac|chuyen ra/.test(q)){filters.push(r=>r.routing_category==='VU_OUTBOUND');descriptions.push('Vú chỉ định → khoa khác thực hiện');}
 if(/khoa khac.*vu (lam|thuc hien)|chuyen den/.test(q)){filters.push(r=>r.routing_category==='VU_INBOUND');descriptions.push('Khoa khác chỉ định → Vú thực hiện');}
 if(/\btat\b|tre ket qua|tre hen|cham tra/.test(semanticQ)){filters.push(r=>r.tat?.status==='DELAYED_TAT');descriptions.push('TAT vượt ngưỡng demo, chỉ xét mốc trả kết quả có trong nguồn');}
 const anomaly=/trung|xung dot|bat thuong|ngoai le|thieu|huy|hoan tien/.test(semanticQ);
 if(anomaly){filters.push(r=>/trung|xung dot/.test(semanticQ)?idCounts.get(r.row.order_id)>1:/huy|hoan tien/.test(semanticQ)?['HUY','HOANTIEN'].includes(r.row.status):/thieu/.test(semanticQ)?r.warnings.some(w=>/MISSING|INVALID/.test(w.code)):r.warnings.length>0);descriptions.push('Dòng có cảnh báo theo câu hỏi');}
 if(!filters.length&&!/tong|toan bo|tat ca|doanh thu|gia tri|so lieu|bao nhieu/.test(q))return {unsupported:true,answer:'Chưa xác định được đối tượng truy vết. Hãy nhập mã BN/chỉ định, nhóm dịch vụ (siêu âm, VABB, MRI…), tên file, hoặc đặt tên dịch vụ trong ngoặc kép.',rows:[]};
 if(!filters.length){const generic=new Set('tong toan bo tat ca doanh thu gia tri so lieu bao nhieu vu khoa chi dinh thuc hien truoc sau giam phan bo goi lay tu dau file nao dong trong ky dang chon duoc tinh nhu the va cua cac nhung nay cho toi xem bang chung nguon tien'.split(' '));const unknown=semanticQ.split(/[^\p{L}\p{N}]+/u).filter(w=>w&&!generic.has(w));if(unknown.length)return {unsupported:true,answer:'Có đối tượng chưa nhận diện trong câu hỏi. Hãy dùng mã hoặc đặt tên dịch vụ trong ngoặc kép; chưa tính tổng để tránh mở rộng nhầm phạm vi.',rows:[]};}
 // Questions outside administrative data are explicitly unsupported, even if a technique name appears.
 if(/chan doan(?! hinh anh)|dieu tri|tien luong|co bi ung thu|ke don|du doan/.test(q))return {unsupported:true,answer:'Trợ lý này chỉ truy vết dữ liệu hành chính; không trả lời chẩn đoán, điều trị hoặc dự đoán.',rows:[]};
 if(/khong phai|ngoai tru|tru di/.test(semanticQ))return {unsupported:true,answer:'Chưa hỗ trợ câu hỏi có phép loại trừ. Hãy tách thành câu hỏi trực tiếp theo mã, dịch vụ hoặc file và kiểm tra bộ lọc hiển thị.',rows:[]};
 const matched=base.filter(r=>filters.every(f=>f(r)));
 const related=r=>r.routing_category&&r.routing_category!=='EXTERNAL_UNRELATED';
 const contributes=r=>r.eligible&&related(r)&&(mode.startsWith('ordered')?r.orderedInPeriod&&(mode==='ordered_count'||r.ordering==='VU'):r.performedInPeriod&&(mode==='performed_count'||r.performing==='VU'));
 const contributors=mode==='lookup'?matched.filter(r=>r.eligible):matched.filter(contributes);
 const moneyMode=['ordered_money','performed_gross','performed_net'].includes(mode),valueOf=r=>mode==='ordered_money'?r.orderGross:mode==='performed_gross'?r.row.completed_gross_vnd:r.row.completed_net_vnd;
 const missing=moneyMode?contributors.filter(r=>valueOf(r)==null).length:0;
 const value=moneyMode?sumMoney(contributors.filter(r=>valueOf(r)!=null).map(valueOf)):contributors.length;
 const contributorKeys=new Set(contributors.map(r=>r.key));
 const rows=matched.map(r=>({key:r.key,order_id:r.row.order_id,patient_id:r.row.patient_id,visit_id:r.row.visit_id,service_name:r.row.service_name,source_file:r.row.source_file||'Chưa có tên file',source_sheet:r.row.source_sheet||'Chưa có metadata sheet',source_row:r.row.source_row??null,source_file_hash:r.row.source_file_hash||null,ordering_dept:r.row.ordering_dept,performing_dept:r.row.performing_dept,status:r.row.status,ordering_doctor:r.row.ordering_doctor_name||r.row.ordering_doctor_id||null,performing_doctor:r.row.performing_doctor_name||r.row.performing_doctor_id||null,tat:r.tat,contributes:contributorKeys.has(r.key),value:moneyMode&&contributorKeys.has(r.key)?valueOf(r):null,warnings:[...r.warnings.map(w=>w.code+': '+w.description),...(idCounts.get(r.row.order_id)>1?['Mã chỉ định xuất hiện nhiều dòng; xem toàn bộ nhóm nguồn.']:[])].join('; '),citation:citation(r)}));
 const groups=new Map();for(const r of rows){const key=JSON.stringify([r.source_file,r.source_sheet,r.source_file_hash]);if(!groups.has(key))groups.set(key,{file:r.source_file,sheet:r.source_sheet,hash:r.source_file_hash,source_rows:[],matched:0,contributing:0,value:0});const g=groups.get(key);g.matched++;g.source_rows.push(r.source_row);if(r.contributes){g.contributing++;if(r.value!=null)g.value=sumMoney([g.value,r.value]);}}
 const scopeText=scope==='all'?'toàn nguồn':`${analysis.from} → trước ${analysis.toExclusive} (giờ Việt Nam)`;
 const answer=!matched.length?`Không tìm thấy dữ liệu liên quan trong các file đã tải lên. Đã tra ${files} file/nguồn, phạm vi ${scopeText}.`:mode==='lookup'?`Tìm thấy ${matched.length} dòng nguồn; ${contributors.length} dòng qua kiểm tra. Đây là số dòng, chưa đồng nhất với số ca hoặc số bệnh nhân.`:`${AUDIT_MODES[mode]}: ${new Intl.NumberFormat('vi-VN').format(value)} ${moneyMode?'VND đã biết':'dòng đủ điều kiện'}. ${contributors.length} dòng đóng góp; ${missing} dòng thiếu tiền. Không cộng góc nhìn chỉ định và thực hiện.`;
 const tatCaveat=/\btat\b|tre ket qua|tre hen|cham tra/.test(q)?' Chỉ kiểm tra được dòng có mốc trả kết quả chính xác; không tìm thấy ca trễ không chứng minh mọi ca đều đúng hạn.':'';
 return {answer:answer+tatCaveat,mode,scopeText,filters:descriptions,files,value,missing,matched:matched.length,contributing:contributors.length,rows,groups:[...groups.values()],warnings:rows.filter(r=>r.warnings),rulesVersion:analysis.rulesVersion};
}
