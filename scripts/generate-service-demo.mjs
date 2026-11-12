import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),seed=JSON.parse(fs.readFileSync(path.join(root,'src/data/seed.json')));
const definitions={EXAM:{code:'SYN-DV001',price:450000,file:'GIALAP_KHAM_COMBO.csv'},US:{code:'SYN-DV008',price:550000,file:'GIALAP_SIEU_AM.csv'},XR2:{code:'SYN-DV005',price:700000,file:'GIALAP_XQ_2D.csv'},XR3:{code:'SYN-DV006',price:1100000,file:'GIALAP_XQ_3D.csv'}};
const tariffs={SKTQ:{EXAM:150000,US:200000,XR2:250000,XR3:400000},SLUT1:{EXAM:200000,US:300000},SLUT2:{EXAM:180000,US:250000,XR2:370000,XR3:570000}};
const rows=[];
for(let i=0;i<60;i++){
 const n=String(i+1).padStart(3,'0'),visit='SIM-COMBO-V'+n,patient='SIM-COMBO-P'+n,type=['RETAIL','SKTQ','SLUT1','SLUT2','SLUT2','EXTRA'][i%6],xray=i%6===4?'XR3':'XR2',day=19+i%7,date=`2026-10-${day}`;
 const kinds=type==='SLUT1'?['EXAM','US']:['EXAM','US',xray];
 for(const kind of kinds){const d=definitions[kind],catalog=seed.DANH_MUC_DV.find(c=>c['Mã dịch vụ mô phỏng']===d.code),pkg=['SKTQ','SLUT1','SLUT2'].includes(type),amount=pkg?tariffs[type][kind]:d.price;
  rows.push({order_id:`SIM-CALC-${n}-${kind}`,patient_id:patient,visit_id:visit,service_code:d.code,service_name:catalog['Tên đơn vị dịch vụ mô phỏng'],quantity:1,completed_qty:1,ordered_at:date+'T08:00:00+07:00',completed_at:date+'T10:00:00+07:00',status:'HOANTHANH',unit_price_vnd:d.price,gross_order_vnd:d.price,net_order_vnd:amount,completed_gross_vnd:d.price,completed_net_vnd:amount,discount_known:1,discount_vnd:pkg?null:0,price_mode:pkg?'TRONGGOI':type==='EXTRA'?'THEMNGOAIGOI':'MUALE',package_id:pkg?'SIM-'+type+'-2026':type==='EXTRA'?'SIM-SLUT2-2026':null,package_allocation_vnd:pkg?amount:null,ordering_dept:type==='SKTQ'?'KSKTQ':'VU',performing_dept:'VU',performing_room:kind==='EXAM'?'PK-VU-01':kind==='US'?'SA-VU-01':'XQ-VU',clinical_doctor:'BS GIẢ LẬP',in_snapshot:1,is_synthetic:1,source_file:d.file,source_sheet:'CANONICAL',source_row:0,source_record_key:`SIM-CALC-${n}-${kind}`,source_batch:'service-combo-demo-v1',source_system:'SIM_SERVICE_COMBO',group:catalog['Nhóm']});
 }
}
const folder=path.join(root,'data_gialap','DICH_VU_COMBO');fs.mkdirSync(folder,{recursive:true});
const csvCell=v=>v==null?'':'"'+String(v).replaceAll('"','""')+'"';
for(const file of new Set(rows.map(r=>r.source_file))){const rs=rows.filter(r=>r.source_file===file);rs.forEach((r,i)=>r.source_row=i+2);const fields=Object.keys(rs[0]).filter(k=>!['order_id','source_record_key','source_file_hash'].includes(k));const text='\uFEFF'+[fields.map(csvCell).join(','),...rs.map(r=>fields.map(k=>csvCell(r[k])).join(','))].join('\r\n')+'\r\n';fs.writeFileSync(path.join(folder,file),text);const hash=crypto.createHash('sha256').update(text).digest('hex');rs.forEach(r=>r.source_file_hash=hash);}
fs.writeFileSync(path.join(root,'src/data/service-demo.json'),JSON.stringify({batch:'service-combo-demo-v1',rows,packageTypes:{'SIM-SKTQ-2026':'SKTQ','SIM-SLUT1-2026':'SLUT1','SIM-SLUT2-2026':'SLUT2'},tariffs},null,2)+'\n');
fs.writeFileSync(path.join(folder,'GIA_GIALAP.json'),JSON.stringify({note:'Giá giả lập VND, không phải bảng giá bệnh viện. SLUT 2 dùng X-quang 2D hoặc 3D đã ghi nhận; không tự thêm cả hai.',tariffs},null,2)+'\n');
console.log(JSON.stringify({rows:rows.length,files:4,folder}));
