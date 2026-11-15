import {wavBlob} from '../speech/local-dictation.mjs';

export function createTrainingRecorder({onState,onDone,onError,mediaDevices=navigator.mediaDevices,AudioContextClass=window.AudioContext}){
 let stream,context,processor,source,mute,frames=[],length=0,active=false,starting=false,disposed=false,generation=0;
 function release(){active=false;processor?.disconnect();source?.disconnect();mute?.disconnect();stream?.getTracks().forEach(t=>t.stop());if(context)context.close().catch(()=>{});}
 function stop(){
  generation++;starting=false;
  const wasActive=active,rate=context?.sampleRate;release();
  if(wasActive&&length&&!disposed){const samples=new Float32Array(length);let offset=0;for(const frame of frames){samples.set(frame,offset);offset+=frame.length;}onDone({blob:wavBlob(samples,rate),seconds:length/rate});}
  frames=[];length=0;if(!disposed)onState('idle');
 }
 return {
  async start(){
   if(active||starting||disposed)return;
   const attempt=++generation;starting=true;onState('starting');let acquired,opened;
   try{
    acquired=await mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
    if(disposed||attempt!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
    opened=new AudioContextClass({sampleRate:16000});await opened.resume();
    if(disposed||attempt!==generation){acquired.getTracks().forEach(t=>t.stop());await opened.close();return;}
    stream=acquired;context=opened;frames=[];length=0;
    source=context.createMediaStreamSource(stream);processor=context.createScriptProcessor(4096,1,1);mute=context.createGain();mute.gain.value=0;
    source.connect(processor);processor.connect(mute);mute.connect(context.destination);active=true;
    stream.getTracks().forEach(track=>{track.onended=()=>{if(active)stop();};});
    processor.onaudioprocess=event=>{
     if(!active)return;
     const incoming=event.inputBuffer.getChannelData(0),remaining=Math.floor(29*context.sampleRate)-length;
     const frame=new Float32Array(incoming.slice(0,remaining));frames.push(frame);length+=frame.length;
     if(length>=Math.floor(29*context.sampleRate))stop();
    };
    onState('recording');
   }catch(e){acquired?.getTracks().forEach(t=>t.stop());if(opened&&opened!==context)opened.close().catch(()=>{});if(attempt===generation&&!disposed){release();onState('idle');onError(e.message);}}
   finally{if(attempt===generation)starting=false;}
  },
  stop,
  dispose(){disposed=true;generation++;starting=false;release();frames=[];length=0;}
 };
}
