import {businessDate} from '../../shared/dataRules.mjs';
import {revenueScope} from '../intelligence/revenueAI.mjs';
export function calculationStatus(state,checked,stats){
 const scope=revenueScope(checked.valid,state.serviceCalculation);
 const dates=scope.included.filter(r=>r.status==='HOANTHANH'&&+r.in_snapshot===1).map(r=>businessDate(r.completed_at)).filter(Boolean).sort();
 const reasons=new Map();for(const issue of checked.issues)for(const reason of issue.reasons)reasons.set(reason,(reasons.get(reason)||0)+1);
 return {source:state.rows.length,valid:checked.valid.length,blocked:checked.issues.length,excluded:state.excluded.length,
  included:scope.included.length,outside:scope.excluded.length,pending:scope.pending.length,inPeriod:stats.completed.length,
  referenceRows:state.imports.reduce((n,f)=>n+(f.referenceTables||[]).reduce((m,t)=>m+t.rows.length,0),0),
  availableRange:dates.length?[dates[0],dates.at(-1)]:null,reasons:[...reasons].sort((a,b)=>b[1]-a[1])};
}
