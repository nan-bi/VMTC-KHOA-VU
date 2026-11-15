import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {prompts,csv,sampleRow} from './prompts.mjs';
import {createTrainingRecorder} from './recorder.mjs';
import './training.css';

function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function App(){
 const [speaker,setSpeaker]=useState('BS01'),[session,setSession]=useState('BS01_BUOI01'),[split,setSplit]=useState('train'),[pace,setPace]=useState('thuong'),[condition,setCondition]=useState('yen_tinh');
 const [index,setIndex]=useState(0),[consent,setConsent]=useState(false),[phase,setPhase]=useState('idle'),[recording,setRecording]=useState(null),[url,setUrl]=useState(''),[text,setText]=useState(''),[reviewed,setReviewed]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('Chưa có mẫu ghi âm. Model đang dùng chưa được huấn luyện lại.');
 const [rows,setRows]=useState([]),[dirty,setDirty]=useState(false),[added,setAdded]=useState(false);
 const recorder=useRef(null),leaveState=useRef({}),prompt=prompts[index],busy=phase!=='idle';
 const locked=busy||!!recording;
 leaveState.current={busy,unsaved:!!recording&&!added,dirty};
 useEffect(()=>{
  recorder.current=createTrainingRecorder({onState:setPhase,onDone:next=>{setRecording(next);setText('');setReviewed(false);setAdded(false);setNotice('Nghe lại toàn bộ đoạn thu, chép đúng lời thực tế rồi xác nhận.');},onError:setError});
  const hide=()=>{if(document.hidden)recorder.current.stop();};
  const leave=e=>{const s=leaveState.current;if(s.busy||s.unsaved||s.dirty){e.preventDefault();e.returnValue='';}};
  document.addEventListener('visibilitychange',hide);window.addEventListener('beforeunload',leave);
  return()=>{recorder.current.dispose();document.removeEventListener('visibilitychange',hide);window.removeEventListener('beforeunload',leave);};
 },[]);
 useEffect(()=>{if(!recording){setUrl('');return;}const next=URL.createObjectURL(recording.blob);setUrl(next);return()=>URL.revokeObjectURL(next);},[recording]);
 function clear(){if(recording&&!added&&!window.confirm('Bỏ đoạn thu chưa tải? Âm thanh này sẽ mất.'))return;setRecording(null);setText('');setReviewed(false);setAdded(false);setError('');}
 function add(){
  try{
   if(!consent||!reviewed||!recording||added)return;
   if(recording.seconds<2)throw Error('Đoạn thu dưới 2 giây; hãy thu lại một câu đầy đủ.');
   if(rows.some(row=>row.session_id===session&&(row.split!==split||row.speaker_id!==speaker)))throw Error('Mỗi mã buổi thu phải thuộc cùng bác sĩ và cùng nhóm train/dev/test.');
   const row=sampleRow({prompt,speaker,session,split,pace,condition,text,id:`${speaker}_${session}_${prompt.id}_${crypto.randomUUID().slice(0,8)}`});
   download(recording.blob,row.audio.slice(6));setRows(current=>[...current,row]);setDirty(true);setAdded(true);setError('');setNotice('Đã yêu cầu tải WAV. Kiểm tra thư mục tải về, sau đó tải danh sách CSV và chuyển WAV vào thư mục audio.');
  }catch(e){setError(e.message);}
 }
 return <main><header><a href="/speech.html">← Về Ghi ca</a><span>VÚ VOICE · THU MẪU GIỌNG</span></header><h1>Thu mẫu giọng đọc</h1><p>80 câu giả lập cho siêu âm vú và ngoại khoa liên quan. Đây là bước thu dữ liệu, chưa huấn luyện lại model và chưa bao phủ mọi chuyên khoa.</p>
 <section className="note"><strong>Chỉ thu ca giả lập, không có thông tin người bệnh.</strong><p>Trang này chủ động tạo tệp ghi âm khác với màn hình Ghi ca. Không gửi âm thanh lên Internet, không tự đưa mẫu vào model. Âm thanh chỉ ở bộ nhớ tab đến khi bạn tải WAV; đóng tab có thể mất phần chưa tải.</p></section>
 <section><h2>1. Mã người đọc và buổi thu</h2><fieldset disabled={locked}><div className="fields"><label>Mã bác sĩ<input value={speaker} onChange={e=>setSpeaker(e.target.value)} placeholder="BS01 — không nhập tên thật"/></label><label>Mã buổi thu<input value={session} onChange={e=>setSession(e.target.value)} placeholder="BS01_BUOI01"/></label><label>Nhóm dữ liệu<select value={split} onChange={e=>setSplit(e.target.value)}><option value="train">Train · dùng để học</option><option value="dev">Dev · chọn cấu hình</option><option value="test">Test · đánh giá giữ riêng</option></select></label><label>Tốc độ đọc<select value={pace} onChange={e=>setPace(e.target.value)}><option value="thuong">Bình thường</option><option value="nhanh_tu_nhien">Nhanh tự nhiên, có luyến âm</option></select></label><label>Điều kiện<select value={condition} onChange={e=>setCondition(e.target.value)}><option value="yen_tinh">Yên tĩnh</option><option value="phong_gia_lap">Phòng làm việc giả lập, không có người bệnh</option></select></label></div></fieldset><p className="hint">Một buổi chỉ thuộc một nhóm dữ liệu. Dùng buổi khác cho dev/test; bổ sung câu tự do mới để kiểm tra khả năng nhận dạng ngoài bộ câu luyện.</p></section>
 <section><h2>2. Đọc và thu một đoạn</h2><label>Câu gợi ý<select disabled={locked} value={index} onChange={e=>setIndex(Number(e.target.value))}>{prompts.map((p,i)=><option key={p.id} value={i}>{p.id} · {p.category}</option>)}</select></label><blockquote>{prompt.text}</blockquote><p>Các câu gợi ý cần bác sĩ duyệt thuật ngữ trước khi thu. Với chữ viết tắt, bác sĩ đọc theo thói quen thật. Có thể nói lại bằng lời tự nhiên; giữ cả lời tự sửa. Không cố luyến âm khác thói quen.</p>
 <label className="check"><input type="checkbox" checked={consent} disabled={locked} onChange={e=>setConsent(e.target.checked)}/>Người đọc đồng ý thu giọng và dùng mẫu giả lập này để huấn luyện, đánh giá model tại đơn vị.</label>
 <div className="actions"><button className="primary" disabled={!consent||!!recording} onClick={()=>{setError('');if(busy)recorder.current.stop();else recorder.current.start();}}>{busy?'■ Dừng thu':'● Thu mẫu'}</button><span role="status">{phase==='starting'?'Đang mở micro…':phase==='recording'?'Đang thu · tự dừng ở 29 giây':'Micro đã tắt'}</span></div><p className="hint">Mục tiêu 5–20 giây/đoạn. Đợi khoảng nửa giây trước và sau câu. Chuyển tab sẽ dừng thu.</p>
 {recording&&<><audio aria-label="Nghe lại mẫu đã thu" controls src={url}/><p>Độ dài: {recording.seconds.toFixed(1)} giây. Chưa xác nhận tải thành công xuống máy.</p><label>Bản chép nguyên văn thực tế<textarea rows={5} value={text} disabled={added} onChange={e=>{setText(e.target.value);setReviewed(false);}} placeholder="Nghe lại rồi chép đủ lời đã nói, cả ngập ngừng, phủ định và tự sửa. Không tự dán câu gợi ý làm nhãn."/></label><label className="check"><input type="checkbox" checked={reviewed} disabled={added} onChange={e=>setReviewed(e.target.checked)}/>Bác sĩ/người duyệt đã nghe lại và xác nhận bản chép đúng lời thực tế, gồm số đo, bên vú và chữ viết tắt.</label><div className="actions"><button className="primary" disabled={added||!reviewed||!text.trim()||recording.seconds<2} onClick={add}>Tải WAV và thêm vào danh sách</button><button onClick={clear}>{added?'Chuẩn bị mẫu tiếp theo':'Bỏ đoạn này để thu lại'}</button></div></>}
 </section><section><h2>3. Tải danh sách mẫu</h2><p>{rows.length} mẫu đã yêu cầu tải trong phiên này. {dirty?'Danh sách có thay đổi chưa tải CSV.':'Không có thay đổi CSV chưa tải.'}</p><button disabled={!rows.length||busy} onClick={()=>{download(new Blob([csv(rows)],{type:'text/csv;charset=utf-8'}),`manifest-${Date.now()}.csv`);setDirty(false);}}>Tải danh sách CSV</button><p className="hint">Đặt WAV vào speech-training/audio và CSV vào speech-training. Danh sách ở RAM, không tự lưu sau đóng tab. Giữ bản CSV đã tải, ghép các phiên bằng công cụ kiểm tra dữ liệu trước huấn luyện. Không có xuất JSON.</p></section>
 {error&&<p className="error" role="alert">{error}</p>}<p className="note" role="status">{notice}</p><footer>Thu xong chưa có nghĩa model đã học. Cần kiểm tra dữ liệu, huấn luyện trên máy phù hợp và so sánh với model gốc trên tập test giữ riêng.</footer></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
