import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon'};
if(Number(process.versions.node.split('.')[0])<22){console.error('Please install Node.js 22 or later: https://nodejs.org/');process.exit(1);}
try{await stat(path.join(root,'index.html'));}catch{console.error('Missing dist/index.html. Run npm ci and npm run build first.');process.exit(1);}
const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403).end('Forbidden');return;}
  const data=await readFile(target);
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch(e){res.writeHead(e.code==='ENOENT'||e.code==='EISDIR'?404:400).end('File unavailable');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port 4173 is already in use. Close the previous demo terminal or open http://127.0.0.1:4173/':e.message);process.exit(1);});
server.listen(port,'127.0.0.1',()=>console.log('\nVinMec Khoa Vu - local demo\nOpen: http://127.0.0.1:4173/\nStop: Ctrl+C\nSynthetic data only.\n'));
