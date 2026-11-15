import {revenueScope} from '../intelligence/revenueAI.mjs';
import {sumMoney,sumQuantity} from '../../shared/dataRules.mjs';

export const PENDING_RULES=[
 ['Nguồn số chính thức','Khoa xác nhận nguồn ưu tiên cho từng chỉ tiêu giữa Report, HIS/OH, EMR, eForm và file SKTQ. Hiện giữ nguồn và dòng gốc, chưa tự chọn nguồn thắng khi lệch.'],
 ['Giá và phân bổ gói','Giá lẻ, SKTQ, SLUT 1–2 lấy theo bảng giá cấu hình; danh mục khởi tạo chưa được khoa xác nhận. Cần khoa xác nhận mức giá, cấu phần và thời điểm áp dụng.'],
 ['Xét nghiệm máu và bảo hiểm','Cần xác nhận phần BHYT/BHXH không cộng vào báo cáo và các cột nguồn tương ứng. Chưa tự trừ bảo hiểm.'],
 ['Nội trú và chuyển kỳ','Cần xác nhận mốc ghi nhận và cách trừ giường, dược, hai loại vật tư. Hiện lọc ngày hoàn thành; chưa coi đó là quy tắc quyết toán nội trú.'],
 ['IVF, phiếu khám và tái khám','Cần danh mục điều kiện loại chỉ định IVF, không tính phiếu khám và cách xác định giá tái khám; chưa tự suy từ tên dịch vụ/bác sĩ.'],
 ['Mẫu giao ban và đơn vị','Cần khoa duyệt ánh xạ đủ 8 bảng và mẫu slide, phân biệt lượt/người/đơn vị dịch vụ. Các mục chưa có nguồn giữ trống.']
];
export const ROUTE_LABELS={INTERNAL:'Vú chỉ định · Vú thực hiện',OUTBOUND:'Vú chỉ định · khoa khác thực hiện',INBOUND:'Khoa khác chỉ định · Vú thực hiện',EXTERNAL:'Ngoài phạm vi Khoa Vú',UNKNOWN:'Chưa rõ khoa · cần đối soát'};
export function financeRoutes(rows,config={}){
 const buckets=Object.fromEntries(Object.keys(ROUTE_LABELS).map(key=>[key,[]]));
 for(const record of revenueScope(rows,config).records){const row=record.row;if(row.status!=='HOANTHANH'||+row.in_snapshot!==1)continue;
  const key=({VU_INTERNAL:'INTERNAL',VU_OUTBOUND:'OUTBOUND',VU_INBOUND:'INBOUND',EXTERNAL_UNRELATED:'EXTERNAL'})[record.label]||'UNKNOWN';buckets[key].push(row);
 }
 return Object.entries(buckets).map(([key,rows])=>({key,label:ROUTE_LABELS[key],rows,qty:sumQuantity(rows.map(r=>r.completed_qty)),gross:sumMoney(rows.map(r=>r.completed_gross_vnd))}));
}
