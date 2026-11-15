// Continue browser sessions after pauses, without interpreting spoken commands.
export function createDictation({Recognition,onText,onInterim,onState,onNotice}) {
  let wanted=false,current=null,timer=null,emptyEnds=0,disposed=false;
  function finish(){current=null;onInterim('');onState('idle');}
  function open(){
    if(!wanted||disposed)return;
    const r=new Recognition();current=r;let received=false,ended=false;
    r.lang='vi-VN';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
    r.onstart=()=>{onState('listening');onNotice('Đang chép toàn bộ lời đọc. Bác sĩ cứ nói tự nhiên.');};
    r.onresult=e=>{
      if(ended||disposed)return;
      let partial='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const result=e.results[i];
        if(result.isFinal){received=true;emptyEnds=0;onText(result[0].transcript);}
        else partial+=result[0].transcript;
      }
      onInterim(partial);
    };
    r.onerror=e=>{
      if(disposed||e.error==='no-speech')return;
      wanted=false;
      const messages={'not-allowed':'Micro bị từ chối. Cho phép micro trong cài đặt trang rồi thử lại.','audio-capture':'Không tìm thấy micro. Kiểm tra thiết bị đầu vào.','network':'Mất kết nối nhận giọng nói. Nội dung đã chép vẫn còn. Kiểm tra mạng rồi bấm Bắt đầu.','service-not-allowed':'Trình duyệt không cho dùng dịch vụ nhận giọng nói.','aborted':'Phiên nhận giọng nói bị ngắt. Bấm Bắt đầu để tiếp tục.'};
      onNotice(messages[e.error]||`Nhận giọng nói dừng: ${e.error}. Có thể tiếp tục gõ.`);
    };
    r.onend=()=>{
      ended=true;if(disposed)return;
      if(wanted){
        emptyEnds=received?0:emptyEnds+1;
        if(emptyEnds<=3){onState('reconnecting');onNotice('Đang nối lại phiên nghe; chờ trạng thái Đang nghe rồi đọc tiếp.');timer=setTimeout(open,350);current=null;return;}
        wanted=false;onNotice('Dịch vụ liên tục ngắt khi chưa nhận được lời đọc. Kiểm tra micro rồi bấm Bắt đầu để thử lại.');
      }
      finish();
    };
    try{r.start();}catch{wanted=false;onNotice('Không khởi động được micro. Hãy thử Chrome/Edge trên localhost.');finish();}
  }
  return {
    start(){if(wanted||current||disposed)return;wanted=true;emptyEnds=0;onState('starting');open();},
    stop(){wanted=false;clearTimeout(timer);if(current){onState('stopping');onNotice('Đang kết thúc và nhận nốt câu cuối…');try{current.stop();}catch{finish();}}else finish();},
    dispose(){disposed=true;wanted=false;clearTimeout(timer);current?.abort();current=null;},
  };
}
