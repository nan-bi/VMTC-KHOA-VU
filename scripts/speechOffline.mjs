import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export function speechAssets(bundle){
  const html=bundle['speech.html'];
  if(!html)throw Error('Missing speech.html for offline build.');
  const assets=new Set(['speech.html']);
  const visit=name=>{
    name=name.replace(/^\//,'');
    if(assets.has(name))return;
    const file=bundle[name];if(!file)throw Error('Missing offline asset: '+name);
    assets.add(name);
    for(const dependency of [...(file.imports||[]),...(file.dynamicImports||[]),...(file.viteMetadata?.importedCss||[]),...(file.viteMetadata?.importedAssets||[])])visit(dependency);
    if(name.endsWith('.css'))for(const match of String(file.source).matchAll(/url\(["']?(\/assets\/[^\s)"']+)["']?\)/g))visit(match[1]);
  };
  for(const match of String(html.source).matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g))visit(match[1]);
  if(assets.size<2)throw Error('No scripts found for offline speech app.');
  return [...assets].sort();
}
export function speechOfflinePlugin(){
  return {name:'speech-offline-shell',enforce:'post',generateBundle:{order:'post',handler(options,bundle){
    const assets=speechAssets(bundle);
    const hash=createHash('sha256');
    for(const name of assets)hash.update(name).update(bundle[name].code??bundle[name].source);
    const worker=readFileSync(new URL('../src/features/speech/offline-worker.js',import.meta.url),'utf8');
    hash.update(worker);
    const version=hash.digest('hex').slice(0,16);
    this.emitFile({type:'asset',fileName:'speech-sw.js',source:`const CACHE='vu-voice-shell-${version}';\nconst ASSETS=${JSON.stringify(assets.map(n=>'/'+n))};\n${worker}`});
  }}};
}
