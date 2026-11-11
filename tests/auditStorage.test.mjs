import test from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_KEY,readReport,transactReport} from '../src/features/reports/reportStore.mjs';
import {emptyFlow} from '../src/features/patients/patientFlow.mjs';
import {assertFlow} from '../src/features/patients/flowIntegrity.mjs';
const base=()=>({version:1,revision:0,rows:[],excluded:[],logs:[],imports:[],hashes:[],report:null});
function memory(value){let raw=JSON.stringify(value);return {getItem:k=>k===REPORT_KEY?raw:null,setItem:(k,v)=>{assert.equal(k,REPORT_KEY);raw=v;}};}
test('Báo cáo từ chối ghi đè phiên bản cũ và giữ bản đã chốt',()=>{
 const store=memory(base());transactReport(store,0,s=>{s.rows.push({order_id:'A'});return s;});
 assert.throws(()=>transactReport(store,0,s=>{s.rows=[];return s;}));assert.equal(readReport(store).rows[0].order_id,'A');
});
test('Lỗi dung lượng hoặc callback không làm biến đổi bản đã lưu',()=>{
 const store=memory(base()),before=store.getItem(REPORT_KEY);store.setItem=()=>{throw Error('QuotaExceededError');};
 assert.throws(()=>transactReport(store,0,s=>{s.logs.push('new');return s;}));assert.equal(store.getItem(REPORT_KEY),before);
 assert.throws(()=>transactReport(store,0,s=>{s.rows.push({});throw Error('fail');}));assert.equal(store.getItem(REPORT_KEY),before);
});
test('Dữ liệu báo cáo hỏng và phiên bản không nguyên bị chặn trước ghi',()=>{
 assert.throws(()=>readReport({getItem:()=>'{bad'}));
 for(const revision of [-1,0.5,'0',Number.MAX_SAFE_INTEGER])assert.throws(()=>readReport(memory({...base(),revision})));
 const store=memory(base());assert.throws(()=>transactReport(store,0,s=>{s.rows=null;return s;}));assert.deepEqual(readReport(store).rows,[]);
});
test('Dữ liệu cũ không revision được đọc là 0; hồ sơ phòng từ chối revision hỏng',()=>{
 const old=base();delete old.revision;assert.equal(readReport(memory(old)).revision,0);
 for(const revision of [-1,0.5,'0',Number.MAX_SAFE_INTEGER])assert.throws(()=>assertFlow({...emptyFlow(),revision}));
});
