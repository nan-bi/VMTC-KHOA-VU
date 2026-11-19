import {speechReady} from './speech-profile.mjs';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const python=fileURLToPath(new URL('../.speech-venv/Scripts/python.exe',import.meta.url));
if(!existsSync(python)||!existsSync(speechReady)){
 console.error('Chay CAI-DAT-SPEECH.cmd truoc de cai model mien phi.');process.exit(1);
}
process.env.VU_VOICE_KEY=randomBytes(32).toString('hex');
const child=spawn(python,['scripts/speech-server.py'],{cwd:root,env:process.env,stdio:['ignore','inherit','inherit'],windowsHide:true});
child.on('error',e=>{console.error(e.message);process.exit(1);});
child.on('exit',()=>{console.error('Dich vu STT da dung. Mo lai CHAY-SPEECH.cmd.');process.exit(1);});
process.on('exit',()=>child.kill());
process.on('SIGINT',()=>process.exit(0));
process.on('SIGTERM',()=>process.exit(0));
await import('./serve-dist.mjs');
