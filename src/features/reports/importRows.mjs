import {normalizeDate} from './core.mjs';
import {grossAmount,integer} from '../../shared/dataRules.mjs';
export function normalizeIncomingRows(rows,fileName){
 return rows.map((r,i)=>{
  const n={...r,ordered_at:normalizeDate(r.ordered_at),completed_at:normalizeDate(r.completed_at),ingested_at:normalizeDate(r.ingested_at),source_file:fileName,source_row:i+2};
  if(r.status==='HOANTHANH'){
   try{if(n.completed_gross_vnd==null)n.completed_gross_vnd=grossAmount(n.completed_qty,n.unit_price_vnd);}catch{}
   if(n.completed_net_vnd==null&&+n.discount_known===1){
    if(n.price_mode==='TRONGGOI'&&integer(n.package_allocation_vnd))n.completed_net_vnd=+n.package_allocation_vnd;
    else if(['MUALE','THEMNGOAIGOI'].includes(n.price_mode)&&integer(n.completed_gross_vnd)&&integer(n.discount_vnd))n.completed_net_vnd=+n.completed_gross_vnd-(+n.discount_vnd);
   }
  }
  return n;
 });
}
