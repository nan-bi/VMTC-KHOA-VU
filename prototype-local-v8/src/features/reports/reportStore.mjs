export const REPORT_KEY='vinmec-demo-v1';
export function readReport(storage=localStorage){
 const raw=storage.getItem(REPORT_KEY);if(raw==null)return null;
 const s=JSON.parse(raw);
 if(s?.version!==1||!Array.isArray(s.rows)||!Array.isArray(s.excluded)||!Array.isArray(s.logs)||!Array.isArray(s.imports)||!Array.isArray(s.hashes)||s.rows.some(r=>!r||typeof r!=='object')||(s.report&&(!['draft','submitted','approved'].includes(s.report.status)||!Array.isArray(s.report.stats?.table))))throw Error('Dữ liệu báo cáo lưu có lỗi; giữ nguyên để kiểm tra, không tự thay bằng dữ liệu mẫu.');
 const revision=s.revision??0;if(!Number.isSafeInteger(revision)||revision<0||revision>=Number.MAX_SAFE_INTEGER)throw Error('Phiên bản cập nhật báo cáo không hợp lệ.');
 return {...s,revision};
}
export function transactReport(storage,expected,fn){
 const current=readReport(storage);if(!current||current.revision!==expected)throw Error('Báo cáo đã thay đổi ở tab khác hoặc đã bị xóa. Kiểm tra dữ liệu mới trước khi thao tác lại.');
 const next=fn(structuredClone(current));next.revision=current.revision+1;
 const raw=JSON.stringify(next);readReport({getItem:()=>raw});storage.setItem(REPORT_KEY,raw);return next;
}
async function lock(fn){if(!navigator.locks?.request)throw Error('Dùng Chrome/Edge mới trên localhost để bảo đảm khóa ghi báo cáo.');return navigator.locks.request('vinmec-report-write',fn);}
export const initializeReport=base=>lock(()=>{const existing=readReport();if(existing)return existing;const s={...base,revision:0};localStorage.setItem(REPORT_KEY,JSON.stringify(s));return s;});
export const saveReport=(expected,fn)=>lock(()=>transactReport(localStorage,expected,fn));
