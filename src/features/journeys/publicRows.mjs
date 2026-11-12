// Public CSVs separate HIS identifiers from the technical links used by synthetic workflows.
const link=value=>typeof value==='string'?value.replaceAll('SYN-ORD-','local-link:'):value;
export function publicJourneyRows(rows){
 const fields={order_id:'internal_link_key',parent_order_id:'internal_parent_key',replaces_order_id:'internal_replaces_key',reviewed_order_ids:'internal_reviewed_keys'};
 return rows.map(row=>Object.fromEntries([
  ...Object.entries(row).filter(([key])=>key!=='his_order_id').map(([key,value])=>[fields[key]||key,Array.isArray(value)?value.map(link):link(value)])
 ]));
}
