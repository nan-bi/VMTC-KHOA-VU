import {businessDate,isDateOnly,sumQuantity} from '../../shared/dataRules.mjs';
export function serviceTrendData(rows,catalog,from,toExclusive){
 if(!isDateOnly(from)||!isDateOnly(toExclusive)||from>=toExclusive)return {dates:[],series:[]};
 const dates=[];
 for(let day=Date.parse(from+'T00:00:00Z'),end=Date.parse(toExclusive+'T00:00:00Z');day<end;day+=86400000)dates.push(new Date(day).toISOString().slice(0,10));
 const groups=new Map(catalog.map(service=>[service.code,{key:service.code,label:service.name,days:new Map(),rows:[]}]));
 for(const row of rows){
  const day=businessDate(row.completed_at),service=groups.get(row.service_code);
  if(!service||row.status!=='HOANTHANH'||+row.in_snapshot!==1||!day||day<from||day>=toExclusive)continue;
  if(!service.days.has(day))service.days.set(day,[]);
  service.days.get(day).push(row);service.rows.push(row);
 }
 return {dates,series:[...groups.values()].map(service=>({key:service.key,label:service.label,rows:service.rows,total:sumQuantity(service.rows.map(row=>row.completed_qty)),points:dates.map(date=>({date,qty:sumQuantity((service.days.get(date)||[]).map(row=>row.completed_qty)),rows:service.days.get(date)||[]}))}))};
}
