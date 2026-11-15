import {aggregate} from './core.mjs';
import {revenueScope,AI_VERSION} from '../intelligence/revenueAI.mjs';
import {businessDate} from '../../shared/dataRules.mjs';
export function breastAggregate(rows,catalog,from,to,config={}){
 const scope=revenueScope(rows,config),stats=aggregate(scope.included,catalog,from,to);
 const inPeriod=r=>{const d=businessDate(r.completed_at);return r.status==='HOANTHANH'&&+r.in_snapshot===1&&d&&d>=from&&d<to;};
 return {...stats,revenueScope:'ORDERING_VU',classification:{version:AI_VERSION,reviewedPairs:scope.model.reviewedCount,included:scope.included.filter(inPeriod).length,excluded:scope.excluded.filter(r=>inPeriod(r.row)).length,pending:scope.pending.filter(r=>inPeriod(r.row)).length},scopeLabel:'Khoa Vú chỉ định · bao gồm khoa khác thực hiện'};
}
