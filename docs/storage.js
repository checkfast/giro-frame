let database;
async function db(){
  if(database)return database;
  database=await new Promise((resolve,reject)=>{const r=indexedDB.open('giro-frame-v1',2);r.onupgradeneeded=()=>{const d=r.result;const p=d.objectStoreNames.contains('photos')?r.transaction.objectStore('photos'):d.createObjectStore('photos',{keyPath:'id'});if(!p.indexNames.contains('createdAt'))p.createIndex('createdAt','createdAt');if(!d.objectStoreNames.contains('cache'))d.createObjectStore('cache');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return database;
}
export async function store(name,op,...args){
  const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(name,['get','getAll'].includes(op)?'readonly':'readwrite');const r=tx.objectStore(name)[op](...args);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Memoria locale non disponibile'));});
}
// Read one photo at a time, not an event-sized getAll into iPad memory.
export async function photos(demo=false){
  const d=await db();
  return new Promise((resolve,reject)=>{
    const tx=d.transaction('photos','readwrite'), pending=[], ready=[];
    const cursor=tx.objectStore('photos').index('createdAt').openCursor(null,'prev');
    let successful=0;
    cursor.onsuccess=()=>{
      const c=cursor.result;if(!c)return;
      const r=c.value;if(!!r.demo!==!!demo){c.continue();return;}
      if(r.url && (++successful>12 || Date.now()-(r.uploadedAt||r.createdAt)>86400000))c.delete();
      else if(r.url)ready.push(r);
      else {pending.unshift(r);if(pending.length>24)pending.pop();}
      c.continue();
    };
    tx.oncomplete=()=>resolve(pending.concat(ready));tx.onerror=()=>reject(tx.error);
  });
}
