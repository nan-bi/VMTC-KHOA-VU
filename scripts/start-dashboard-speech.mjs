import {speechReady} from './speech-profile.mjs';
import {createServer} from 'node:net';
import {existsSync} from 'node:fs';
import {createBackend} from '../backend/server.mjs';
const root=new URL('../',import.meta.url);
if(!existsSync(new URL('.speech-venv/Scripts/python.exe',root))||!existsSync(speechReady)){console.error('Chay CAI-DAT-SPEECH.cmd truoc.');process.exit(1);}
// Fail before starting any service if one of the fixed local ports is occupied.
for(const port of [4173,4180,4181])await new Promise((resolve,reject)=>{const probe=createServer();probe.once('error',()=>reject(Error('Cong '+port+' dang duoc su dung. Dong cua so chay cu truoc.')));probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
const app=await createBackend();
app.server.on('error',e=>{console.error(e.message);process.exit(1);});
await new Promise(resolve=>app.server.listen(4180,'127.0.0.1',resolve));
console.log('Dashboard + Speech: http://127.0.0.1:4180/');
process.once('exit',()=>app.db.close());
await import('./start-speech.mjs');
