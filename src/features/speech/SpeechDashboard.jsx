import React,{forwardRef,useRef,useEffect,useImperativeHandle} from 'react';
import {SPEECH_ORIGIN,isLeaveReply} from './embed-bridge.mjs';
// Use the original speech origin so existing IndexedDB drafts/results remain available.
export default forwardRef(function SpeechDashboard(_,ref){
 const frame=useRef(null),pending=useRef(new Map());
 useEffect(()=>{const receive=event=>{for(const [id,job] of pending.current){if(isLeaveReply(event,frame.current?.contentWindow,id)){clearTimeout(job.timer);pending.current.delete(id);job.resolve(!event.data.blocked);break;}}};window.addEventListener('message',receive);return()=>{window.removeEventListener('message',receive);for(const job of pending.current.values()){clearTimeout(job.timer);job.resolve(false);}pending.current.clear();};},[]);
 useImperativeHandle(ref,()=>({canLeave:()=>new Promise(resolve=>{const id=crypto.randomUUID();const timer=setTimeout(()=>{pending.current.delete(id);resolve(false);},2000);pending.current.set(id,{resolve,timer});frame.current?.contentWindow?.postMessage({type:'vu-speech:can-leave',id},SPEECH_ORIGIN);})}),[]);
 return <iframe ref={frame} className="speech-embed" title="Ghi ca và kết quả siêu âm vú" src={SPEECH_ORIGIN+'/speech-dashboard.html?embedded=1'} allow="microphone"/>;
});
