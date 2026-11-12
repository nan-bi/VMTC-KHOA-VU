import {scryptSync,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {audit,transaction} from './database.mjs';
export const ROLES=['admin','editor','reviewer','viewer'];
export const hashToken=token=>createHash('sha256').update(token).digest('hex');
export function createUser(db,{username,password,role='viewer'}){
 if(!/^[a-zA-Z0-9_.-]{3,64}$/.test(username||''))throw Error('Tên đăng nhập cần 3–64 ký tự chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.');
 if(typeof password!=='string'||password.length<12||password.length>256)throw Error('Mật khẩu cần 12–256 ký tự.');
 if(!ROLES.includes(role))throw Error('Vai trò không hợp lệ.');
 const salt=randomBytes(16).toString('hex'),hash=scryptSync(password,salt,64).toString('hex');
 return transaction(db,()=>{const result=db.prepare('INSERT INTO users(username,password_hash,role,created_at) VALUES(?,?,?,?)').run(username,`${salt}:${hash}`,role,new Date().toISOString());const user={id:Number(result.lastInsertRowid),username,role};audit(db,user,'USER_CREATED',{role});return user});
}
export function authenticate(db,username,password){
 if(typeof username!=='string'||typeof password!=='string'||password.length>256)return null;
 const user=db.prepare('SELECT * FROM users WHERE username=? AND active=1').get(username);
 const [salt,hash]=(user?.password_hash||`${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
 const actual=scryptSync(password,salt,64),expected=Buffer.from(hash,'hex');
 if(!timingSafeEqual(actual,expected)||!user)return null;
 return {id:user.id,username:user.username,role:user.role};
}
export function createSession(db,user){
 const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex'),expires=Date.now()+8*60*60*1000;
 db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
 db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hashToken(token),user.id,csrf,expires);return {token,csrf,expires,user};
}
export function getSession(db,cookie=''){
 const token=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('vinmec_session='))?.slice(15);
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const row=db.prepare('SELECT users.id,users.username,users.role,sessions.csrf,sessions.expires_at FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>? AND users.active=1').get(hashToken(token),Date.now());
 return row?{token,user:{id:row.id,username:row.username,role:row.role},csrf:row.csrf,expires:row.expires_at}:null;
}
