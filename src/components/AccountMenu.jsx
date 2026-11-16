import React,{useEffect,useRef,useState} from 'react';
import {Button,message} from 'antd';

export default function AccountMenu({username,canLogout,onLogout}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const host=useRef(null);
 useEffect(()=>{
  if(!open)return;
  const outside=e=>{if(!host.current?.contains(e.target))setOpen(false);};
  const escape=e=>{if(e.key==='Escape'){setOpen(false);host.current?.querySelector('button')?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 async function signOut(){setBusy(true);try{await onLogout();}catch(e){message.error(e.message);}finally{setBusy(false);}}
 return <div className="account-control" ref={host} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>{if(!host.current?.contains(document.activeElement))setOpen(false);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
  <Button type="text" shape="circle" className="account-trigger" aria-label="Mở menu tài khoản" aria-expanded={open} aria-controls="account-panel" onClick={()=>setOpen(true)}>KV</Button>
  {open&&<div className="account-popup" id="account-panel"><div className="account-menu"><strong>{username}</strong>{canLogout&&<Button block loading={busy} onClick={signOut}>Đăng xuất</Button>}</div></div>}
 </div>;
}
