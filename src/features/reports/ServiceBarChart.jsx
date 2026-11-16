import React from 'react';
import {Empty} from 'antd';
import {money} from './core.mjs';
const palette=['#ae5d80','#d58da8','#e8b5c8','#8c729d','#c5a0ba','#adb1bf'];
export default function ServiceBarChart({title,description,rows=[],unit,legend=[],onSelect}){
 const max=Math.max(0,...rows.map(r=>r.value??0));
 return <section className="service-chart" aria-label={title}><div className="panel-head"><div><h3>{title}</h3><div className="subtle">{description}</div></div><span className="service-chart-unit">{unit}</span></div>
  {!!legend.length&&<div className="service-chart-legend">{legend.map((item,i)=><span key={item.key}><i style={{background:palette[i%palette.length]}}/>{item.label}</span>)}</div>}
  {!rows.length?<Empty description="Chưa có dịch vụ trong phạm vi đang chọn."/>:<div className="service-chart-canvas"><div className="service-chart-scale" aria-hidden="true"><span>{money(max)}</span><span>{money(max/2)}</span><span>0</span></div><div className="service-chart-scroll"><div className="service-chart-rows" style={{minWidth:`${rows.length*120}px`,gridTemplateColumns:`repeat(${rows.length}, minmax(120px, 1fr))`}}>{rows.map(row=>{
   const valueText=row.value==null?'Chưa xác định':`${money(row.value)} ${unit}`;
   const content=<><span className="service-chart-plot"><span className="service-chart-track" style={{height:max?`${(row.value??0)/max*100}%`:'0%'}}><span className="service-chart-value">{row.value==null?'Chưa xác định':money(row.value)}</span>{(row.segments||[{key:'total',value:row.value??0}]).map(segment=><i aria-hidden="true" key={segment.key} style={{height:row.value?`${segment.value/row.value*100}%`:'0%',background:palette[Math.max(0,legend.findIndex(item=>item.key===segment.key))%palette.length]}}/>)}</span></span><span className="service-chart-name">{row.label}<small>{row.key}</small>{row.missingRecords>0&&<small className="service-chart-missing">Còn {money(row.missingQty)} đơn vị thiếu giá/phân loại</small>}</span></>;
   return onSelect?<button type="button" key={row.key} className="service-chart-row" title={`${row.label}: ${valueText}. Bấm để xem chi tiết.`} onClick={()=>onSelect(row)}>{content}</button>:<div key={row.key} className="service-chart-row">{content}</div>;
  })}</div></div></div>}
 </section>;
}
