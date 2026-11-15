export const SPEECH_ORIGIN='http://127.0.0.1:4173';
export const DASHBOARD_ORIGINS=new Set([SPEECH_ORIGIN,'http://127.0.0.1:4180','http://127.0.0.1:5173']);
export function isLeaveRequest(event,parent){return parent&&event.source===parent&&DASHBOARD_ORIGINS.has(event.origin)&&event.data?.type==='vu-speech:can-leave'&&typeof event.data.id==='string'&&event.data.id.length<=64;}
export function isLeaveReply(event,frame,id){return event.source===frame&&event.origin===SPEECH_ORIGIN&&event.data?.type==='vu-speech:leave-state'&&event.data.id===id&&typeof event.data.blocked==='boolean';}
export function leaveBlocked({audio=false,draft=false,saving=false,review=false,switching=false}={}){return !!(audio||draft||saving||review||switching);}
