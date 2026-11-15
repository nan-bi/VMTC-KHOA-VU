export const REVENUE_FIELDS=['service_code','service_name','price_mode','package_id','status','in_snapshot','completed_qty','unit_price_vnd','package_allocation_vnd'];
export const revenuePayloadRows=rows=>rows.map(row=>Object.fromEntries(REVENUE_FIELDS.map(key=>[key,row[key]??null])));
