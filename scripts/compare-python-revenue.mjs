// Reproducible synthetic comparison; never reads the user's SQLite or browser cases.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {compareRevenue} from '../backend/python-revenue.mjs';
import {DEFAULT_SERVICE_KINDS} from '../src/features/reports/serviceCalculation.mjs';
const root=new URL('../',import.meta.url),baseline='6b6069ab0fa920606e477f34a3fcc79567b2059c';
const demo=JSON.parse(await readFile(new URL('src/data/service-demo.json',root)));
const config={packageTypes:demo.packageTypes,serviceKinds:DEFAULT_SERVICE_KINDS};
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const benchmarks=[];
for(const count of [demo.rows.length,1000,10000,100000]){
 const rows=Array.from({length:count},(_,i)=>demo.rows[i%demo.rows.length]);const runs=[];
 for(let i=0;i<3;i++){
  const result=await compareRevenue(rows,config);if(!result.match)throw Error('Mismatch at '+count);
  runs.push(result.timing);
 }
 const sample=await compareRevenue(rows,config);
 benchmarks.push({rows:count,runs:3,allOutputsMatch:true,knownRevenue:sample.python.knownRevenue,
  javascriptMedianMs:median(runs.map(x=>x.javascriptMs)),pythonComputeMedianMs:median(runs.map(x=>x.pythonComputeMs)),pythonTotalMedianMs:median(runs.map(x=>x.pythonTotalMs))});
}
function summarize(files){
 const result={JavaScript:0,Python:0};for(const {path,size} of files){if(/\.(js|jsx|mjs)$/.test(path))result.JavaScript+=size;if(path.endsWith('.py'))result.Python+=size;}
 return {...result,pythonPercent:100*result.Python/(result.Python+result.JavaScript)};
}
const tree=execFileSync('git',['ls-tree','-rl',baseline]).toString().split('\n').filter(Boolean).map(line=>{const [meta,path]=line.split('\t');return {path,size:Number(meta.trim().split(/\s+/).at(-1))};});
const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
const current=[];for(const path of paths){if(!/\.(js|jsx|mjs|py)$/.test(path))continue;const text=await readFile(new URL(path,root),'utf8');current.push({path,size:Buffer.byteLength(text.replaceAll('\r\n','\n'))});}
const report={baselineCommit:baseline,phase:1,scope:'Price x quantity only; department classification and approved report snapshots remain JavaScript.',
 fixture:'Synthetic service-demo.json repeated deterministically; not a clinical accuracy test.',benchmarks,
 languageBytes:{definition:'UTF-8 bytes .js/.jsx/.mjs vs .py; excludes vendor/build/venv; not GitHub Linguist.',
  wholeRepository:{before:summarize(tree),after:summarize(current)},
  excludingArchive:{before:summarize(tree.filter(x=>!x.path.startsWith('prototype-local-v8/'))),after:summarize(current.filter(x=>!x.path.startsWith('prototype-local-v8/')))}}};
await writeFile(new URL('docs/audit/python-migration-comparison.json',root),JSON.stringify(report,null,2)+'\n');
const rows=benchmarks.map(r=>'| '+r.rows+' | '+r.javascriptMedianMs.toFixed(2)+' | '+r.pythonComputeMedianMs.toFixed(2)+' | '+r.pythonTotalMedianMs.toFixed(2)+' | Khớp toàn bộ |').join('\n');
const before=report.languageBytes.wholeRepository.before,after=report.languageBytes.wholeRepository.after;
await writeFile(new URL('docs/21-SO-SANH-JAVASCRIPT-PYTHON.md',root),
 '# So sánh chuyển đổi Python · đợt 1\n\n'+
 'Bản đối chiếu cũ: commit `'+baseline+'`. Giữ nguyên giao diện và cách chọn dữ liệu. Chuyển riêng bộ tính giá × số lượng, giá lẻ/SKTQ/SLUT1/SLUT2, phân bổ và làm tròn tiền sang Python chuẩn, không thêm thư viện pip. JavaScript vẫn là bản chuẩn để đối chiếu.\n\n'+
 '## Xem trên dashboard\n\n'+
 'Chạy `CHAY-SO-SANH-PYTHON.cmd`, mở http://127.0.0.1:4190/ và dùng tài khoản hiện có. Bản thử dùng cùng SQLite của dashboard; thao tác So sánh chỉ đọc/tính, không sửa dữ liệu. Bộ chạy cũ 4180 được giữ, không bị dừng. Vào Chi tiết số liệu → Bóc tách khám/siêu âm/XQ → So sánh JavaScript / Python. Khi toàn bộ kết quả khớp, chọn Xem bằng Python hoặc Xem bằng JavaScript. Thay kỳ, dữ liệu hoặc cấu hình sẽ bỏ kết quả so sánh cũ.\n\n'+
 'Python chỉ nhận các cột dịch vụ cần tính trong bộ nhớ; bỏ tên/định danh người bệnh, số điện thoại, tên file và nhãn học. Có đăng nhập/CSRF, giới hạn dòng/dung lượng, timeout và giới hạn hai tiến trình đồng thời. Không ghi âm thanh hoặc ca ra thư mục.\n\n'+
 '**Giới hạn đợt 1:** lựa chọn Python chỉ thay bảng doanh thu đang xem. Phân loại khoa, chốt snapshot và xuất báo cáo vẫn dùng JavaScript; chưa chuyển backend hay toàn bộ hệ thống sang Python. Thiếu Python hoặc có kết quả khác nhau sẽ báo lỗi và giữ JavaScript.\n\n'+
 '## Kết quả đo trên máy hiện tại\n\n'+
 'Dữ liệu tổng hợp cố định, lặp từ service-demo; mỗi cỡ 3 lần, bảng lấy trung vị. So cả dòng/nhóm/số lượng/giá/doanh thu, không chỉ tổng cuối. Không suy ra sai số so với chuẩn bệnh viện.\n\n'+
 '| Số dòng | JS tính (ms) | Python tính (ms) | Python gồm mở tiến trình + JSON (ms) | Đối chiếu |\n|---:|---:|---:|---:|---|\n'+rows+'\n\n'+
 'Python không mặc nhiên nhanh hơn. Bản đợt 1 khởi động tiến trình riêng mỗi lần so sánh nên thêm chi phí; chưa dùng worker dài hạn. Giao tiếp/hiển thị qua HTTP còn thêm độ trễ ngoài bảng đo này.\n\n'+
 '## Tỷ lệ mã nguồn thực đo\n\n'+
 'Tính dung lượng UTF-8 của .js/.jsx/.mjs và .py, chuẩn hóa LF; gồm cả test/tool và bản lưu lịch sử. Đây không phải số GitHub Linguist.\n\n'+
 '| Phiên bản | JavaScript (byte) | Python (byte) | Python trong hai nhóm |\n|---|---:|---:|---:|\n'+
 '| Trước | '+before.JavaScript+' | '+before.Python+' | '+before.pythonPercent.toFixed(2)+'% |\n'+
 '| Sau đợt 1 | '+after.JavaScript+' | '+after.Python+' | '+after.pythonPercent.toFixed(2)+'% |\n\n'+
 '**Chưa đạt xấp xỉ 50/50.** Không thêm mã rỗng, nhân bản Python hoặc ép Linguist để đổi tỷ lệ. Muốn tăng vai trò Python thật cần các đợt tiếp theo: chuyển phân loại khoa/đối soát; chuyển đọc Excel/CSV; sau khi kiểm chứng mới chuyển snapshot và xuất báo cáo. Giữ frontend React cho bảng, lịch, biểu đồ và micro.\n\n'+
 'Tái chạy: `node scripts/compare-python-revenue.mjs`. Cần Python trên PATH, môi trường speech đã cài hoặc biến VINMEC_PYTHON trỏ tới Python. Dữ liệu chi tiết đo ở docs/audit/python-migration-comparison.json. Không huấn luyện hoặc đổi model speech trong đợt này.\n');
console.log(JSON.stringify({benchmarks,wholeRepository:report.languageBytes.wholeRepository},null,2));
