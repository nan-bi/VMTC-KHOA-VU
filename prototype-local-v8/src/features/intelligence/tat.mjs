import {isTimestamp,isDateOnly} from '../../shared/dataRules.mjs';
export const TAT_POLICY={version:'MASTER-TAT-DEMO-1',approved:false,cdha_minutes:120,gpb_minutes:4320};
export function assessTat(row,{performing,kpi_category,service_group}={}){
 const threshold=performing==='CDHA'?TAT_POLICY.cdha_minutes:(performing==='GPB'||service_group==='Giải phẫu bệnh')?TAT_POLICY.gpb_minutes:null;
 const base={policy:TAT_POLICY.version,threshold_minutes:threshold,tat_minutes:null,ordered_at:row.ordered_at??null,result_returned_at:row.result_returned_at??null};
 if(threshold===null||['HUY','HOANTIEN'].includes(row.status))return {...base,status:'NOT_APPLICABLE'};
 if(!row.result_returned_at)return {...base,status:'UNKNOWN_RETURN_TIME'};
 const precise=v=>isTimestamp(v)&&!isDateOnly(v);
 if(!precise(row.ordered_at)||!precise(row.result_returned_at)||Date.parse(row.result_returned_at)<Date.parse(row.ordered_at))return {...base,status:'INVALID_TAT_TIME'};
 const duration=(Date.parse(row.result_returned_at)-Date.parse(row.ordered_at))/60000;
 return {...base,tat_minutes:duration,status:duration>threshold?'DELAYED_TAT':'WITHIN_TAT'};
}
