import {seedFlow} from './patientFlow.mjs';
import {assertFlow,upgradeFlow} from './flowIntegrity.mjs';
export const FLOW_KEY='vinmec-patient-flow-v1';
export function readFlow(storage=localStorage){
 const raw=storage.getItem(FLOW_KEY);return raw==null?null:upgradeFlow(JSON.parse(raw));
}
export function transactFlow(storage,expectedRevision,fn){
 const current=readFlow(storage);if(!current)throw Error('Dữ liệu chưa khởi tạo hoặc đã bị xóa; hãy tải lại trang.');
 if(current.revision!==expectedRevision)throw Error('Hồ sơ đã thay đổi ở tab khác. Đóng phiếu, xem dữ liệu mới rồi thực hiện lại; nội dung đang nhập chưa được gửi.');
 const next=structuredClone(current);const value=fn(next);assertFlow(next);next.revision=current.revision+1;
 storage.setItem(FLOW_KEY,JSON.stringify(next));return {state:next,value};
}
async function locked(fn){
 if(!navigator.locks?.request)throw Error('Trình duyệt chưa hỗ trợ khóa ghi. Dùng Chrome/Edge mới tại địa chỉ localhost hoặc 127.0.0.1.');
 return navigator.locks.request('vinmec-patient-flow-write',fn);
}
export async function initializeFlow(){return locked(()=>{
 const existing=readFlow();if(existing)return existing;
 const s=upgradeFlow(seedFlow());localStorage.setItem(FLOW_KEY,JSON.stringify(s));return s;
});}
export async function saveFlow(expectedRevision,fn){return locked(()=>transactFlow(localStorage,expectedRevision,fn));}
