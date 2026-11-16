import {sumMoney,sumQuantity} from '../../shared/dataRules.mjs';
// Aggregate the existing calculated lines, never recompute price or package allocations.
export function revenueChartRows(lines=[]){
 const services=new Map();
 for(const line of lines){
  if(!services.has(line.code))services.set(line.code,{key:line.code,label:line.name,lines:[]});
  services.get(line.code).lines.push(line);
 }
 return [...services.values()].map(service=>{
  const known=service.lines.filter(line=>line.revenue!=null),missing=service.lines.filter(line=>line.revenue==null);
  const types=[...new Set(known.map(line=>line.type))];
  return {...service,value:known.length?sumMoney(known.map(line=>line.revenue)):null,
   segments:types.map(type=>({key:type,value:sumMoney(known.filter(line=>line.type===type).map(line=>line.revenue))})),
   missingQty:sumQuantity(missing.map(line=>line.qty)),missingRecords:missing.reduce((n,line)=>n+line.recordCount,0)};
 }).sort((a,b)=>(b.value??-1)-(a.value??-1)||a.label.localeCompare(b.label,'vi'));
}
