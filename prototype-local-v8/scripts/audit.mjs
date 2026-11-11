import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validate,aggregate} from '../src/features/reports/core.mjs';
const raw=await fs.readFile(new URL('../src/data/seed.json',import.meta.url));
const seed=JSON.parse(raw),catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng']}));
const checked=validate(seed.CANONICAL,catalog);
const fields={qty:'completed_qty',gross:'completed_gross',net:'known_completed_net',missing:'missing_net',patients:'patients',visits:'visits',late:'late_rows_excluded'};
const checks=[];
for(const reference of seed.THAM_CHIEU_TUAN){
 const actual=aggregate(checked.valid,catalog,reference.week_start,reference.week_end_exclusive);
 for(const [key,refKey] of Object.entries(fields)){
  const expected=reference[refKey],value=actual[key],absoluteError=Math.abs(value-expected);
  const relativeErrorPercent=expected===0?(absoluteError===0?0:null):absoluteError/Math.abs(expected)*100;
  checks.push({from:reference.week_start,toExclusive:reference.week_end_exclusive,metric:key,expected,actual:value,absoluteError,relativeErrorPercent,pass:relativeErrorPercent!==null&&relativeErrorPercent<0.05});
 }
}
const report={generatedAt:new Date().toISOString(),timezone:'Asia/Ho_Chi_Minh',rulesVersion:'SIM-2',thresholdPercent:0.05,
 dataSHA256:createHash('sha256').update(raw).digest('hex'),rows:seed.CANONICAL.length,validRows:checked.valid.length,inputIssues:checked.issues.length,duplicateRows:checked.duplicates.length,
 referencePeriods:seed.THAM_CHIEU_TUAN.length,comparisonCount:checks.length,maxRelativeErrorPercent:Math.max(...checks.map(c=>c.relativeErrorPercent??Infinity)),
 passed:checked.issues.length===0&&checks.every(c=>c.pass),checks,
 limits:['Synthetic reference only; not evidence of clinical diagnostic accuracy.','Net is known portion only; missing net rows remain explicit.','No real hospital reference or multi-device backend validation provided.']};
const folder=new URL('../docs/audit/',import.meta.url);await fs.mkdir(folder,{recursive:true});
await fs.writeFile(new URL('reference-results.json',folder),JSON.stringify(report,null,2)+'\n');
const columns=['from','toExclusive','metric','expected','actual','absoluteError','relativeErrorPercent','pass'];
await fs.writeFile(new URL('reference-results.csv',folder),'\uFEFF'+columns.join(',')+'\r\n'+checks.map(c=>columns.map(k=>c[k]??'UNDEFINED').join(',')).join('\r\n')+'\r\n');
console.log(JSON.stringify({passed:report.passed,rows:report.rows,comparisonCount:report.comparisonCount,maxRelativeErrorPercent:report.maxRelativeErrorPercent,thresholdPercent:report.thresholdPercent}));
if(!report.passed)process.exitCode=1;
