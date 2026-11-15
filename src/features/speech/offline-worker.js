// CACHE and ASSETS are supplied by the production build. Only the app shell
// is cached here; patient records remain in IndexedDB, never in Cache Storage.
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('vu-voice-shell-')&&name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(!ASSETS.includes(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    return await cache.match(url.pathname)||fetch(event.request);
  })());
});
