import fs from 'node:fs/promises';
import {breastAggregate} from '../src/features/reports/breastRevenue.mjs';
const seed=JSON.parse(await fs.readFile(new URL('../src/data/seed.json',import.meta.url)));
const catalog=seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng']}));
const checks=[];
// Independent synthetic reference: raw canonical department codes, source dates and arithmetic.
for(const period of seed.THAM_CHIEU_TUAN){
 const from=period.week_start,to=period.week_end_exclusive;
 const rows=seed.CANONICAL.filter(r=>r.ordering_dept==='VU'&&r.status==='HOANTHANH'&&+r.in_snapshot===1&&r.completed_at.slice(0,10)>=from&&r.completed_at.slice(0,10)<to);
 const expected={qty:rows.reduce((n,r)=>n+(+r.completed_qty),0),gross:rows.reduce((n,r)=>n+(+r.completed_gross_vnd),0),net:rows.reduce((n,r)=>n+(r.completed_net_vnd==null?0:+r.completed_net_vnd),0),missing:rows.filter(r=>r.completed_net_vnd==null).length};
 const actual=breastAggregate(seed.CANONICAL,catalog,from,to);
 for(const [metric,value] of Object.entries(expected))checks.push({from,to,metric,expected:value,actual:actual[metric],pass:value===actual[metric]});
}
const result={createdAt:new Date().toISOString(),scope:'ORDERING_VU',source:'synthetic seed only',checks:checks.length,passed:checks.every(c=>c.pass),maxAbsoluteError:Math.max(...checks.map(c=>Math.abs(c.expected-c.actual))),limits:'Synthetic arithmetic and scope comparison only. Not a real hospital model accuracy benchmark; no claim of <0.05% error on real data.',results:checks};
await fs.writeFile(new URL('../docs/audit/revenue-scope-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,results:undefined}));if(!result.passed)process.exitCode=1;
