import {mkdir,writeFile} from 'node:fs/promises';
import {prompts,csv,columns} from '../src/features/speech-training/prompts.mjs';
const root=new URL('../speech-training/',import.meta.url);
await mkdir(new URL('audio/',root),{recursive:true});
async function create(name,body){try{await writeFile(new URL(name,root),body,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;console.log('Kept existing file: '+name);}}
await create('cau-doc-gia-lap.csv',csv(prompts,['id','category','text']));
// This deliberately empty manifest is not a dataset of verified recordings.
await create('manifest-mau.csv',csv([],columns));
await create('tu-dien-cua-bac-si.csv',csv(['BI-RADS','Doppler','FNA','CNB','VABB','ER','PR','HER2','Ki-67','DCIS','LCIS','IHC','MRI','CT'].map(term=>({term,spoken_forms:'',speaker_id:'',confirmed:'no',notes:'Chờ bác sĩ điền cách đọc thực tế và duyệt; không tự mở rộng chữ viết tắt.'})),['term','spoken_forms','speaker_id','confirmed','notes']));
await create('cau-doc-gia-lap.md','# 80 câu đọc giả lập — cần bác sĩ duyệt trước khi thu\n\nKhông phải mẫu kết luận hay hướng dẫn điều trị. Không gán câu đọc dự kiến làm nhãn nếu người đọc nói khác.\n\n'+prompts.map(p=>`- **${p.id} · ${p.category}:** ${p.text}`).join('\n')+'\n');
console.log(`Prepared ${prompts.length} synthetic prompts and an EMPTY manifest template.`);
