export function caseDay(record){
 const local=record.completedAt?.local||record.updatedAt?.local||'';
 const match=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(local);
 return match?match[3]+'-'+match[2]+'-'+match[1]:'';
}
export function filterResults(records,{status='all',query='',from='',to=''}={}){
 const search=query.toLocaleLowerCase('vi').trim();
 return records.filter(r=>{
  const day=caseDay(r);
  return (status==='all'||r.status===status)&&(!from||day>=from)&&(!to||day<=to)&&[r.patient.pid,r.patient.name,r.patient.visit,r.patient.order,r.patient.doctor,r.completedAt.local].join(' ').toLocaleLowerCase('vi').includes(search);
 });
}
