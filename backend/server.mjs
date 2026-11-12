import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {openDatabase,audit,transaction} from './database.mjs';
import {authenticate,createSession,getSession,hashToken,createUser} from './auth.mjs';
import {getWorkspace,seedWorkspace,updateWorkspace,HttpError} from './workspace.mjs';
import {installServiceDemo} from '../src/features/reports/installServiceDemo.mjs';
const project=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
function send(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));}
async function body(req,limit){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>limit)throw new HttpError(413,'Nội dung vượt giới hạn.');chunks.push(c)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new HttpError(400,'JSON không hợp lệ.')}}
export async function createBackend({databasePath=path.join(project,'backend/data/vinmec.sqlite'),dist=path.join(project,'dist'),initialState,catalog:providedCatalog,secureCookie=false}={}){
 const db=openDatabase(databasePath);
 const seed=JSON.parse(await readFile(path.join(project,'src/data/seed.json'),'utf8')),demo=JSON.parse(await readFile(path.join(project,'src/data/service-demo.json'),'utf8'));
 const catalog=providedCatalog||seed.DANH_MUC_DV.map(r=>({code:r['Mã dịch vụ mô phỏng'],name:r['Tên đơn vị dịch vụ mô phỏng'],group:r['Nhóm'],dept:r['Khoa thực hiện mô phỏng'],price:r['Giá SIM-P2 (VND)']}));
 seedWorkspace(db,initialState||installServiceDemo({version:1,revision:0,rows:seed.CANONICAL,excluded:[],imports:[],hashes:[],logs:[],report:null},demo));
 const attempts=new Map();
 const cookie=token=>`vinmec_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secureCookie?'; Secure':''}`;
 const server=http.createServer(async(req,res)=>{
  const requestId=randomUUID();res.setHeader('X-Request-ID',requestId);res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  try{
   const url=new URL(req.url,'http://localhost'),route=url.pathname;
   // No CORS: browser mutations must come from the same origin as the dashboard.
   if(!['GET','HEAD'].includes(req.method)){
    if(!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host)throw new HttpError(403,'Nguồn yêu cầu không hợp lệ.');
    if(!(req.headers['content-type']||'').startsWith('application/json'))throw new HttpError(415,'Yêu cầu application/json.');
   }
   if(route==='/api/health'&&req.method==='GET')return send(res,200,{service:'vinmec-internal-backend',status:'ok',version:1,setupRequired:!db.prepare('SELECT 1 FROM users WHERE active=1 LIMIT 1').get()});
   if(route==='/api/auth/login'&&req.method==='POST'){
    const key=req.socket.remoteAddress,now=Date.now(),attempt=attempts.get(key);if(attempt&&attempt.until>now&&attempt.count>=10)throw new HttpError(429,'Quá nhiều lần đăng nhập. Thử lại sau 15 phút.');
    const b=await body(req,4096),user=authenticate(db,b.username,b.password);
    if(!user){const previous=attempt?.until>now?attempt:{count:0,until:now+900000};attempts.set(key,{count:previous.count+1,until:previous.until});audit(db,null,'LOGIN_FAILED');throw new HttpError(401,'Tên đăng nhập hoặc mật khẩu không đúng.');}
    attempts.delete(key);const session=createSession(db,user);audit(db,user,'LOGIN');return send(res,200,{user,csrf:session.csrf,expires:session.expires},{'Set-Cookie':cookie(session.token)});
   }
   if(route.startsWith('/api/')){
    const session=getSession(db,req.headers.cookie);if(!session)throw new HttpError(401,'Cần đăng nhập.');
    if(!['GET','HEAD'].includes(req.method)&&req.headers['x-csrf-token']!==session.csrf)throw new HttpError(403,'Mã bảo vệ phiên không hợp lệ.');
    const user=session.user;
    if(route==='/api/auth/session'&&req.method==='GET')return send(res,200,{user,csrf:session.csrf,expires:session.expires});
    if(route==='/api/auth/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(session.token));audit(db,user,'LOGOUT');return send(res,200,{ok:true},{'Set-Cookie':'vinmec_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
    if(route==='/api/workspace'&&req.method==='GET')return send(res,200,getWorkspace(db));
    if(route==='/api/workspace'&&req.method==='PUT')return send(res,200,updateWorkspace(db,await body(req,25*1024*1024),user,catalog));
    if(route==='/api/catalog'&&req.method==='GET')return send(res,200,{services:catalog});
    if(route==='/api/reviews'&&req.method==='GET')return send(res,200,JSON.parse(db.prepare('SELECT payload FROM review_state WHERE id=1').get().payload));
    if(route==='/api/reviews'&&req.method==='PUT'){
     if(!['admin','editor'].includes(user.role))throw new HttpError(403,'Không có quyền gán nhãn dữ liệu.');
     const b=await body(req,16384),v=b.value;
     if(typeof b.key!=='string'||!b.key||b.key.length>500||['__proto__','constructor','prototype'].includes(b.key)||!v||!['VU_INTERNAL','VU_OUTBOUND','VU_INBOUND','EXTERNAL_UNRELATED'].includes(v.label)||typeof v.fingerprint!=='string'||typeof v.reason!=='string'||v.reason.trim().length<8||v.reason.length>1000)throw new HttpError(400,'Nhãn hoặc căn cứ xác nhận không hợp lệ.');
     const state=transaction(db,()=>{const s=JSON.parse(db.prepare('SELECT payload FROM review_state WHERE id=1').get().payload);if(s.revision!==b.expectedRevision)throw new HttpError(409,'Nhãn đã được cập nhật ở phiên khác.');s.items[b.key]={label:v.label,fingerprint:v.fingerprint,reason:v.reason,profile:v.profile,rulesVersion:v.rulesVersion,reviewer:user.username,reviewedAt:new Date().toISOString()};s.revision++;db.prepare('UPDATE review_state SET revision=?,payload=? WHERE id=1').run(s.revision,JSON.stringify(s));audit(db,user,'REVIEW_SAVED',{key:b.key,label:v.label},s.revision);return s});return send(res,200,state);
    }
    if(route==='/api/snapshots'&&req.method==='GET')return send(res,200,{snapshots:db.prepare('SELECT id,created_at FROM snapshots ORDER BY created_at DESC').all()});
    if(route.startsWith('/api/snapshots/')&&req.method==='GET'){const row=db.prepare('SELECT payload FROM snapshots WHERE id=?').get(decodeURIComponent(route.slice(15)));if(!row)throw new HttpError(404,'Không tìm thấy snapshot.');return send(res,200,JSON.parse(row.payload));}
    if(route==='/api/admin/users'){
     if(user.role!=='admin')throw new HttpError(403,'Chỉ quản trị viên được quản lý tài khoản.');
     if(req.method==='GET')return send(res,200,{users:db.prepare('SELECT id,username,role,active,created_at FROM users ORDER BY id').all()});
     if(req.method==='POST'){const b=await body(req,4096);let created;try{created=createUser(db,b)}catch(e){throw new HttpError(e.message.includes('UNIQUE')?409:400,e.message.includes('UNIQUE')?'Tên đăng nhập đã tồn tại.':e.message)}audit(db,user,'ADMIN_CREATED_USER',{userId:created.id,role:created.role});return send(res,201,{user:created});}
    }
    if(route==='/api/admin/audit'&&req.method==='GET'){
     if(user.role!=='admin')throw new HttpError(403,'Chỉ quản trị viên được xem nhật ký hệ thống.');
     const before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)throw new HttpError(400,'Con trỏ nhật ký không hợp lệ.');
     return send(res,200,{events:db.prepare('SELECT * FROM audit WHERE id<? ORDER BY id DESC LIMIT 100').all(before)});
    }
    throw new HttpError(404,'Không có đường dẫn nội bộ này.');
   }
   if(!['GET','HEAD'].includes(req.method))throw new HttpError(405,'Phương thức không được hỗ trợ.');
   const target=path.resolve(dist,'.'+(route==='/'?'/index.html':decodeURIComponent(route))),relative=path.relative(dist,target);
   if(relative.startsWith('..')||path.isAbsolute(relative))throw new HttpError(403,'Không được truy cập đường dẫn này.');
   let data;try{data=await readFile(target)}catch{throw new HttpError(404,'Không có file. Chạy npm run build nếu chưa có dashboard.');}
   res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
  }catch(e){const status=e.status||500;if(status===500)console.error(`[${requestId}] Backend error:`,e.message);if(!res.headersSent)send(res,status,{error:status===500?'Lỗi hệ thống nội bộ.':e.message,requestId});else res.end();}
 });
 server.requestTimeout=30000;server.headersTimeout=10000;
 return {server,db,close:async()=>{server.closeIdleConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));db.close()}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.VINMEC_PORT||4180),host=process.env.VINMEC_HOST||'127.0.0.1';
 const app=await createBackend({databasePath:process.env.VINMEC_DB||path.join(project,'backend/data/vinmec.sqlite'),secureCookie:process.env.VINMEC_SECURE_COOKIE==='1'});
 app.server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is already in use.`:e.message);app.db.close();process.exitCode=1});
 app.server.listen(port,host,()=>console.log(`VinMec internal dashboard: http://${host}:${port}/\nDatabase: ${process.env.VINMEC_DB||path.join(project,'backend/data/vinmec.sqlite')}\nCreate account: node backend/manage.mjs create-user\nNo external API or cloud service.`));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.close().then(()=>process.exit(0)));
}
