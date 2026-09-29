// Solo l'interfaccia locale. Mai richieste Google, credenziali o foto in CacheStorage.
const CACHE='giro-frame-shell-v3';
const FILES=['./','index.html','style.css','config.js','app.js','bridge.js','core.js','storage.js','vendor/qrcode.js','assets/frame-demo.svg','assets/logo-demo.svg','assets/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('giro-frame-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==location.origin)return;
  const base=new URL('./',self.registration.scope);
  if(!FILES.some(p=>new URL(p,base).pathname===url.pathname))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(url.pathname,copy)));}return r;}).catch(()=>caches.match(url.pathname).then(r=>r||caches.match(new URL('index.html',base).href))));
});
