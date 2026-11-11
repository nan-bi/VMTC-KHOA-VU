export function isDateOnly(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;
}
export function isTimestamp(value){
 if(typeof value!=='string')return false;
 if(isDateOnly(value))return true;
 const m=value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/);
 return !!m&&isDateOnly(m[1])&&+m[2]<24&&+m[3]<60&&+(m[4]||0)<60&&Number.isFinite(Date.parse(value))&&(/Z$/.test(value)||(+m[5].slice(1,3)<=14&&+m[5].slice(4)<60&&(+m[5].slice(1,3)!==14||+m[5].slice(4)===0)));
}
export function businessDate(value){
 if(!isTimestamp(value))return null;if(isDateOnly(value))return value;
 return new Date(Date.parse(value)+7*3600000).toISOString().slice(0,10);
}
export const identifier=v=>typeof v==='string'&&v.length>0&&v.length<=160&&v===v.trim();
export const numeric=v=>(typeof v==='number'&&Number.isFinite(v))||(typeof v==='string'&&/^-?\d+(?:\.\d{1,6})?$/.test(v));
export const integer=v=>numeric(v)&&Number.isSafeInteger(+v);
export function scaledQuantity(v){
 if(!numeric(v)||Math.abs(+v)>1e9)throw Error('Số lượng không hợp lệ hoặc vượt giới hạn.');
 const s=String(v);if(!/^-?\d+(?:\.\d{1,6})?$/.test(s))throw Error('Số lượng hỗ trợ tối đa 6 chữ số thập phân.');
 const negative=s.startsWith('-'),[whole,fraction='']=s.replace('-','').split('.');
 return (BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0')))*(negative?-1n:1n);
}
export function safeNumber(n){const value=Number(n);if(!Number.isSafeInteger(value))throw Error('Tổng vượt giới hạn số nguyên an toàn; không được phát hành báo cáo.');return value;}
export function grossAmount(qty,price){
 if(!integer(price)||+price<0)throw Error('Đơn giá phải là số nguyên VND an toàn.');
 const q=scaledQuantity(qty);if(q<0n)throw Error('Số lượng không được âm.');
 return safeNumber((q*BigInt(price)+500000n)/1000000n);
}
export const sumMoney=values=>safeNumber(values.reduce((s,v)=>{if(!integer(v))throw Error('Giá trị tiền không hợp lệ.');return s+BigInt(v)},0n));
export const sumQuantity=values=>{const total=values.reduce((s,v)=>s+scaledQuantity(v),0n);return safeNumber(total)/1000000;};
