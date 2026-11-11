// Synthetic orchestration fixtures only. This profile does not mutate the local-12 queues.
export const VERSION='closed-loop-synthetic-1';
export const SCENARIOS={NORMAL:'Thuận lợi',SUSPICIOUS:'Nghi ngờ → can thiệp → GPB',DELAYED:'Chậm trả kết quả',CANCELLED:'Hủy / đổi chỉ định'};
export const SERVICES={
 XQ:{code:'VU-XQ-3D',name:'Nhũ ảnh 3D (giả lập)',dept:'TT_CDHA',room:'PHONG-XQ-01',price:1850000,min:15,max:20,kind:'imaging'},
 MRI:{code:'VU-MRI-01',name:'MRI vú (giả lập)',dept:'TT_CDHA',room:'PHONG-MRI-02',price:3450000,min:35,max:50,kind:'imaging'},
 BLOOD:{code:'VU-SH-01',name:'Sinh hóa (giả lập)',dept:'TT_XET_NGHIEM',room:'LAB-SINHHOA',price:250000,min:60,max:90,kind:'blood'},
 GEN:{code:'VU-GEN-BRCA',name:'BRCA (giả lập)',dept:'TT_XET_NGHIEM',room:'LAB-GEN',price:6800000,min:1440,max:4320,kind:'gen'},
 CORE:{code:'VU-CORE-01',name:'Sinh thiết lõi (giả lập)',dept:'KHOA_VU',room:'CT-VU-01',price:4500000,min:30,max:45,kind:'procedure'},
 VABB:{code:'VU-VABB-01',name:'VABB (giả lập)',dept:'KHOA_VU',room:'CT-VU-01',price:14500000,min:30,max:45,kind:'procedure'},
 GPB:{code:'VU-GPB-CORE',name:'Mô bệnh học (giả lập)',dept:'TT_XET_NGHIEM',room:'LAB-GIAIPHAUBENH',price:1450000,min:1440,max:4320,kind:'pathology'},
 US:{code:'VU-SA-01',name:'Siêu âm thay thế (kịch bản giả lập)',dept:'KHOA_VU',room:'SA-VU-01',price:550000,min:15,max:20,kind:'imaging'},
};
export const FILES={orders:'CHI_DINH_LIEN_KHOA.csv',results:'KET_QUA_TRA_VE_KHOA_VU.csv',consultations:'KET_LUAN_BENH_AN_KHOA_VU.csv'};
const ms=x=>Date.parse(x), minute=60000;
const iso=t=>new Date(t+7*3600000).toISOString().slice(0,19)+'+07:00';
function rng(seed){let s=seed>>>0;return(a,b)=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return a+s%(b-a+1);};}
export function generateJourneys({count=200,seed=20261031}={}){
 if(!Number.isInteger(count)||count<100||count>10000||count%100)throw Error('Số lượt phải là bội số 100, từ 100 đến 10000.');
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Seed phải là số nguyên uint32.');
 const rand=rng(seed),orders=[],results=[],consultations=[];
 const scenarios=Object.keys(SCENARIOS).flatMap((s,i)=>Array(count*[85,10,3,2][i]/100).fill(s));
 for(let i=scenarios.length-1;i>0;i--){const j=rand(0,i);[scenarios[i],scenarios[j]]=[scenarios[j],scenarios[i]];}
 for(let i=0;i<count;i++){
  const scenario=scenarios[i],n=String(i+1).padStart(4,'0'),patient=`SYN-BN-${n}`,visit=`SYN-VISIT-${n}`,room=`PK-VU-0${i%4+1}`,doctor=`BS-VU-0${i%4+1}`;
  const start=ms('2026-10-19T08:00:00+07:00')+(i%5)*86400000+rand(0,300)*minute;
  const consultation={visit_id:visit,patient_id:patient,primary_doctor_id:doctor,initial_diagnosis:'Tình huống giả lập phục vụ kiểm thử',origin_clinic_room:room,scenario,registered_at:iso(start-30*minute),assessment_started_at:iso(start-25*minute),assessment_completed_at:iso(start-10*minute),consultation_started_at:iso(start),all_results_received:true,final_birads:null,final_disposition:'RA_VIEN_HEN_DINH_KY',concluded_at:null,reviewed_order_ids:[],counselled_at:null,recovery_completed_at:null,synthetic:true};
  function order(key,t,{parent=null,replacement=null,cancel=false,delay=0,code=null}={}){
   const svc=SERVICES[key],id=`SYN-ORD-${n}-${orders.filter(o=>o.visit_id===visit).length+1}`;
   const received=t+rand(10,25)*minute,performed=received+(rand(svc.min,svc.max)+delay)*minute,returned=performed+5*minute;
   const o={order_id:id,patient_id:patient,visit_id:visit,origin_clinic_room:room,ordering_doctor_id:doctor,ordered_at:iso(t),received_at:cancel?null:iso(received),target_dept:svc.dept,target_room:svc.room,service_code:svc.code,service_name:svc.name,gross_price_vnd:svc.price,order_status:cancel?'HUY':'HOANTHANH',service_kind:svc.kind,parent_order_id:parent?.order_id||null,replaces_order_id:replacement?.order_id||null,specimen_id:key==='GPB'||svc.kind==='procedure'?`SYN-SP-${n}`:null,required:!cancel,cancelled_at:cancel?iso(t+10*minute):null,cancellation_reason:cancel?'Tình huống MRI không thực hiện; bác sĩ duyệt hủy':null,cancel_reviewed_by:cancel?doctor:null,payment_status:cancel?'REFUND_REVIEW_REQUIRED':'NOT_RECONCILED',delay_minutes:delay,delay_reason:delay?(key==='MRI'?'Bổ sung bước chuẩn bị theo kịch bản':'Bổ sung dấu ấn theo kịch bản'):null,synthetic:true};
   orders.push(o);
   if(!cancel){const conclusion=code||(svc.kind==='imaging'?'BIRADS_2':svc.kind==='pathology'?'BENIGN':svc.kind==='gen'?'NO_VARIANT_DEMO':svc.kind==='procedure'?'SPECIMEN_COLLECTED':'WITHIN_RANGE_DEMO');
    results.push({result_id:`RES-${id}`,order_id:id,patient_id:patient,visit_id:visit,origin_clinic_room:room,performing_doctor_id:svc.dept==='TT_CDHA'?`BS-CDHA-0${rand(1,3)}`:svc.dept==='TT_XET_NGHIEM'?`BS-XN-0${rand(1,3)}`:doctor,performed_at:iso(performed),signed_at:iso(performed+2*minute),result_returned_at:iso(returned),reviewed_at:iso(returned+15*minute),reviewed_by:doctor,findings_summary:`DỮ LIỆU GIẢ LẬP: ${conclusion}; không dùng chẩn đoán.`,conclusion_code:conclusion,tat_minutes:(returned-t)/minute});
   }return o;
  }
  const t1=start+rand(15,30)*minute;
  const resultOf=o=>results.find(r=>r.order_id===o.order_id);
  function biopsy(imaging,delayed=false){
   const review=ms(resultOf(imaging).reviewed_at);consultation.counselled_at=iso(review+5*minute);
   const proc=order(i%2?'CORE':'VABB',review+10*minute,{parent:imaging});
   consultation.recovery_completed_at=iso(ms(resultOf(proc).performed_at)+45*minute);
   order('GPB',ms(resultOf(proc).reviewed_at)+5*minute,{parent:proc,delay:delayed?720:0,code:i%2?'BENIGN':'MALIGNANT'});
   consultation.final_disposition='HOI_CHAN_SAU_GPB_DEMO';
  }
  if(scenario==='CANCELLED'){
   const cancelled=order('MRI',t1,{cancel:true});
   if(i%2)order('US',ms(cancelled.cancelled_at)+15*minute,{replacement:cancelled});
   else consultation.final_disposition='KET_THUC_SAU_DUYET_HUY_DEMO';
  }else{
   const suspicious=scenario==='SUSPICIOUS'||scenario==='DELAYED'&&i%2===0;
   const first=order(scenario==='DELAYED'?'MRI':i%2?'MRI':'XQ',t1,{delay:scenario==='DELAYED'&&!suspicious?90:0,code:suspicious?i%2?'BIRADS_4':'BIRADS_5':i%2?'BIRADS_1':'BIRADS_2'});
   if(suspicious)biopsy(first,scenario==='DELAYED');
   if(scenario==='NORMAL'&&i%5===0)order(i%10===0?'GEN':'BLOOD',t1);
  }
  const own=orders.filter(o=>o.visit_id===visit),rs=results.filter(r=>r.visit_id===visit);
  consultation.reviewed_order_ids=rs.map(r=>r.order_id);
  const birads=rs.filter(r=>/^BIRADS_[1-5]$/.test(r.conclusion_code)).map(r=>Number(r.conclusion_code.slice(-1)));
  consultation.final_birads=birads.length?Math.max(...birads):null;
  const last=Math.max(...rs.map(r=>ms(r.result_returned_at)),...own.filter(o=>o.cancelled_at).map(o=>ms(o.cancelled_at)),ms(consultation.recovery_completed_at)||0);
  consultation.concluded_at=iso(last+rand(15,30)*minute);
  consultations.push(consultation);
 }
 const data={meta:{version:VERSION,seed,count,synthetic:true,room_profile:'prompt-kb-closed-loop',catalog_policy:'Separate synthetic catalog; no automatic finance import',scenario_counts:Object.fromEntries(Object.keys(SCENARIOS).map(k=>[k,scenarios.filter(s=>s===k).length]))},orders,results,consultations};
 const errors=validateJourneys(data);if(errors.length)throw Error(JSON.stringify(errors.slice(0,5)));return data;
}
export function validateJourneys(data){
 const errors=[],add=(code,id)=>errors.push({code,id}),{orders=[],results=[],consultations=[]}=data;
 const unique=(rows,key)=>{const m=new Map();for(const row of rows){if(!row[key]||m.has(row[key]))add('DUPLICATE_OR_EMPTY_'+key,row[key]);m.set(row[key],row);}return m;};
 const os=unique(orders,'order_id'),vs=unique(consultations,'visit_id');unique(results,'result_id');
 const rs=new Map();for(const r of results){if(rs.has(r.order_id))add('MULTIPLE_RESULTS',r.order_id);rs.set(r.order_id,r);}
 const time=(x)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/.test(x)&&Number.isFinite(ms(x));
 const matches=(o,v)=>o.patient_id===v.patient_id&&o.origin_clinic_room===v.origin_clinic_room;
 for(const o of orders){
  const v=vs.get(o.visit_id),s=Object.values(SERVICES).find(s=>s.code===o.service_code),r=rs.get(o.order_id);
  if(!v||!matches(o,v))add('ORDER_IDENTITY',o.order_id);
  if(!s||s.room!==o.target_room||s.dept!==o.target_dept||s.kind!==o.service_kind||s.price!==o.gross_price_vnd)add('SERVICE_MAPPING',o.order_id);
  if(!['HOANTHANH','HUY','DANG_THUC_HIEN'].includes(o.order_status))add('STATUS',o.order_id);
  if(!time(o.ordered_at)||v&&ms(o.ordered_at)<ms(v.consultation_started_at))add('ORDER_TIME',o.order_id);
  if(v&&!o.parent_order_id&&!o.replaces_order_id){const gap=(ms(o.ordered_at)-ms(v.consultation_started_at))/minute;if(gap<15||gap>30)add('INITIAL_ORDER_TIME',o.order_id);}
  if(v&&o.ordering_doctor_id!==v.primary_doctor_id)add('ORDER_DOCTOR',o.order_id);
  if(o.order_status==='HUY'){
   if(r||o.required!==false||!o.cancellation_reason||!time(o.cancelled_at)||ms(o.cancelled_at)<ms(o.ordered_at)||o.cancel_reviewed_by!==v?.primary_doctor_id)add('CANCELLATION',o.order_id);
  }else if(!r||o.required!==true||o.order_status!=='HOANTHANH')add('MISSING_ACTIVE_RESULT',o.order_id);
  const p=os.get(o.parent_order_id),replaced=os.get(o.replaces_order_id);
  if(o.parent_order_id&&(!p||p.visit_id!==o.visit_id||p.patient_id!==o.patient_id||ms(o.ordered_at)<ms(rs.get(p.order_id)?.reviewed_at)))add('PARENT_LINK',o.order_id);
  if(s?.kind==='procedure'&&(!p||p.service_kind!=='imaging'||!['BIRADS_4','BIRADS_5'].includes(rs.get(p.order_id)?.conclusion_code)||!time(v?.counselled_at)||ms(v.counselled_at)>ms(o.ordered_at)))add('PROCEDURE_DEPENDENCY',o.order_id);
  if(s?.kind==='pathology'&&(!p||p.service_kind!=='procedure'||!o.specimen_id||o.specimen_id!==p.specimen_id))add('SPECIMEN_LINK',o.order_id);
  if(o.replaces_order_id&&(!replaced||replaced.order_status!=='HUY'||replaced.visit_id!==o.visit_id||ms(o.ordered_at)<ms(replaced.cancelled_at)))add('REPLACEMENT_LINK',o.order_id);
 }
 for(const r of results){
  const o=os.get(r.order_id),v=o&&vs.get(o.visit_id),s=o&&Object.values(SERVICES).find(s=>s.code===o.service_code);
  if(!o){add('ORPHAN_RESULT',r.result_id);continue;}
  if(r.patient_id!==o.patient_id||r.visit_id!==o.visit_id||r.origin_clinic_room!==o.origin_clinic_room||r.reviewed_by!==v?.primary_doctor_id)add('RESULT_RETURN_IDENTITY',r.result_id);
  if(![o.received_at,r.performed_at,r.signed_at,r.result_returned_at,r.reviewed_at].every(time)||!(ms(o.ordered_at)<ms(o.received_at)&&ms(o.received_at)<ms(r.performed_at)&&ms(r.performed_at)<=ms(r.signed_at)&&ms(r.signed_at)<=ms(r.result_returned_at)&&ms(r.result_returned_at)<=ms(r.reviewed_at)))add('RESULT_TIME',r.result_id);
  if((ms(r.result_returned_at)-ms(o.ordered_at))/minute!==r.tat_minutes||ms(r.result_returned_at)-ms(r.performed_at)!==5*minute)add('TAT',r.result_id);
  const wait=(ms(o.received_at)-ms(o.ordered_at))/minute,duration=(ms(r.performed_at)-ms(o.received_at))/minute-o.delay_minutes;
  if(wait<10||wait>25||!s||duration<s.min||duration>s.max||!Number.isInteger(o.delay_minutes)||o.delay_minutes<0||o.delay_minutes>0&&!o.delay_reason)add('DURATION',r.result_id);
  const allowed={imaging:/^BIRADS_[1-5]$/,pathology:/^(BENIGN|MALIGNANT)$/,gen:/^NO_VARIANT_DEMO$/,blood:/^WITHIN_RANGE_DEMO$/,procedure:/^SPECIMEN_COLLECTED$/};
  if(!allowed[o.service_kind]?.test(r.conclusion_code))add('RESULT_TYPE',r.result_id);
  const prefix=o.target_dept==='TT_CDHA'?'BS-CDHA-0':o.target_dept==='TT_XET_NGHIEM'?'BS-XN-0':null;
  if(prefix?!new RegExp(`^${prefix}[1-3]$`).test(r.performing_doctor_id):r.performing_doctor_id!==v?.primary_doctor_id)add('SIGNER',r.result_id);
 }
 for(const v of consultations){
  const own=orders.filter(o=>o.visit_id===v.visit_id),active=own.filter(o=>o.required),returned=results.filter(r=>r.visit_id===v.visit_id);
  const timeline=[v.registered_at,v.assessment_started_at,v.assessment_completed_at,v.consultation_started_at,v.concluded_at];
  if(!timeline.every(time)||timeline.some((t,i)=>i&&ms(t)<=ms(timeline[i-1])))add('INTAKE_ASSESSMENT',v.visit_id);
  if(!/^PK-VU-0[1-4]$/.test(v.origin_clinic_room)||v.primary_doctor_id!==v.origin_clinic_room.replace('PK','BS'))add('ORIGIN',v.visit_id);
  if(!own.length||v.all_results_received!==true||active.some(o=>!rs.has(o.order_id))||returned.some(r=>!v.reviewed_order_ids?.includes(r.order_id)||ms(r.reviewed_at)>ms(v.concluded_at))||v.reviewed_order_ids?.length!==returned.length)add('PREMATURE_CLOSURE',v.visit_id);
  const latest=Math.max(...returned.map(r=>ms(r.result_returned_at)),...own.filter(o=>o.cancelled_at).map(o=>ms(o.cancelled_at)),ms(v.recovery_completed_at)||0),gap=(ms(v.concluded_at)-latest)/minute;
  if(gap<15||gap>30)add('CLOSURE_TIME',v.visit_id);
  const imaging=returned.filter(r=>os.get(r.order_id)?.service_kind==='imaging').map(r=>Number(r.conclusion_code.slice(-1))),expected=imaging.length?Math.max(...imaging):null;
  if(v.final_birads!==expected)add('FINAL_BIRADS',v.visit_id);
  const procedure=own.find(o=>o.service_kind==='procedure');
  if(procedure&&(!time(v.recovery_completed_at)||ms(v.recovery_completed_at)<ms(rs.get(procedure.order_id)?.performed_at)||ms(v.recovery_completed_at)>ms(v.concluded_at)))add('RECOVERY',v.visit_id);
  if(!Object.hasOwn(SCENARIOS,v.scenario))add('SCENARIO',v.visit_id);
  const delayed=own.some(o=>o.delay_minutes>0),cancelled=own.some(o=>o.order_status==='HUY'),pathology=own.some(o=>o.service_kind==='pathology');
  if(v.scenario==='NORMAL'&&(expected==null||expected>2||procedure||delayed||cancelled||v.final_disposition!=='RA_VIEN_HEN_DINH_KY'))add('NORMAL_PATH',v.visit_id);
  if(v.scenario==='SUSPICIOUS'&&(!procedure||!pathology||expected<4||v.final_disposition!=='HOI_CHAN_SAU_GPB_DEMO'))add('INTERVENTION_PATH',v.visit_id);
  if(v.scenario==='DELAYED'&&!delayed||v.scenario!=='DELAYED'&&delayed)add('DELAYED_PATH',v.visit_id);
  if(v.scenario==='CANCELLED'&&!cancelled||v.scenario!=='CANCELLED'&&cancelled)add('CANCELLED_PATH',v.visit_id);
 }
 if(data.meta?.count!==consultations.length||new Set(consultations.map(v=>v.patient_id)).size!==consultations.length)add('COHORT_COUNT','meta');
 for(const [i,k] of Object.keys(SCENARIOS).entries()){
  const n=consultations.filter(v=>v.scenario===k).length;
  if(n!==consultations.length*[85,10,3,2][i]/100||data.meta?.scenario_counts?.[k]!==n)add('SCENARIO_RATIO',k);
 }
 return errors;
}
export function toCSV(rows){
 const keys=Object.keys(rows[0]||{}),cell=x=>'"'+String(x==null?'':Array.isArray(x)?JSON.stringify(x):x).replaceAll('"','""')+'"';
 return '\uFEFF'+[keys.map(cell).join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n')+'\r\n';
}
// Features stop at order time. Future results are labels, never input features.
export function trainingExamples(data){
 const errors=validateJourneys(data);if(errors.length)throw Error('Bộ dữ liệu không đạt toàn vẹn.');
 return data.consultations.map((v,i)=>({id:v.visit_id,patient_group:v.patient_id,split:i%10<7?'train':i%10<9?'validation':'test',synthetic:true,version:VERSION,task:'synthetic_workflow_outcome',input:{initial_service_codes:data.orders.filter(o=>o.visit_id===v.visit_id&&!o.parent_order_id&&!o.replaces_order_id).map(o=>o.service_code),origin_clinic_room:v.origin_clinic_room},label:{scenario:v.scenario,disposition:v.final_disposition},warning:'Synthetic labels only; not a clinical training reference'}));
}
