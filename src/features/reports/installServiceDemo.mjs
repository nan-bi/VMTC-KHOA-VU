import {DEFAULT_SERVICE_KINDS} from './serviceCalculation.mjs';
export function installServiceDemo(state,demo){
 if(state.installedDemoBatches?.includes(demo.batch)||state.report)return state;
 const existing=new Set(state.rows.map(r=>r.order_id));
 const added=demo.rows.filter(r=>!existing.has(r.order_id));
 state.rows.push(...structuredClone(added));
 state.serviceCalculation={...(state.serviceCalculation||{}),serviceKinds:state.serviceCalculation?.serviceKinds||DEFAULT_SERVICE_KINDS,packageTypes:{...demo.packageTypes,...state.serviceCalculation?.packageTypes}};
 state.installedDemoBatches=[...(state.installedDemoBatches||[]),demo.batch];
 state.imports.push({name:'Giả lập khám / siêu âm / XQ 2D–3D / combo',count:added.length,date:'Bổ sung local v8'});
 state.logs.unshift({time:new Date().toISOString(),action:`Gắn ${added.length} dòng giả lập dịch vụ/combo; giá không phải giá bệnh viện.`});
 return state;
}
