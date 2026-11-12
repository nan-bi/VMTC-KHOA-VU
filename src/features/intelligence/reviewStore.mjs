import {isBackend,backendReviews,saveBackendReview} from '../backend/client.mjs';
const KEY='vinmec-routing-reviews-v1';
export function readReviews(storage=localStorage){if(isBackend())return backendReviews();const raw=storage.getItem(KEY);if(!raw)return {version:1,revision:0,items:{}};const s=JSON.parse(raw);if(s.version!==1||!Number.isSafeInteger(s.revision)||s.revision<0||!s.items||Array.isArray(s.items)||typeof s.items!=='object')throw Error('Kho nhãn lỗi; giữ nguyên để đối soát.');return s;}
export async function saveReview(expected,key,value){if(isBackend())return saveBackendReview(expected,key,value);if(!navigator.locks?.request)throw Error('Cần Chrome/Edge mới hỗ trợ Web Locks.');return navigator.locks.request(KEY,()=>{const s=readReviews();if(s.revision!==expected)throw Error('Nhãn đã được cập nhật ở tab khác; tải lại danh sách.');s.items[key]=value;s.revision++;localStorage.setItem(KEY,JSON.stringify(s));return s;});}
export {KEY as REVIEW_KEY};
