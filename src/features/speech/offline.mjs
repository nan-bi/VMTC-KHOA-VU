export async function prepareOffline(){
  if(!('serviceWorker' in navigator))throw Error('Trình duyệt chưa hỗ trợ mở lại trang ngoại tuyến. Nhập và lưu trong trang đang mở vẫn dùng được.');
  const registration=await navigator.serviceWorker.register('/speech-sw.js',{scope:'/',updateViaCache:'none'});
  let timeout;
  const deadline=new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Chưa xác nhận chuẩn bị ngoại tuyến. Giữ trang mở và thử tải lại khi kết nối hoạt động.')),20000);});
  try{await Promise.race([navigator.serviceWorker.ready,deadline]);
  if(!navigator.serviceWorker.controller)await Promise.race([new Promise(resolve=>{
    const change=()=>{if(navigator.serviceWorker.controller){navigator.serviceWorker.removeEventListener('controllerchange',change);resolve();}};
    navigator.serviceWorker.addEventListener('controllerchange',change);change();
  }),deadline]);}finally{clearTimeout(timeout);}
  return registration;
}
