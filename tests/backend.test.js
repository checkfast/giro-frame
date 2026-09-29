import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
function harness(){
 const properties=new Map(),cache=new Map(),files=new Map();let failShare=false,created=0;
 class Sheet{
  constructor(){this.rows=[];}
  getDataRange(){return {getValues:()=>this.rows.map(r=>[...r])};}
  getRange(row,col,n=1,w=1){if(typeof row==='string')return {setNumberFormat(){return this}};const s=this;return {setNumberFormat(){return this},setValue(v){return this.setValues([[v]])},setValues(values){for(let i=0;i<n;i++){s.rows[row+i-1]??=[];for(let j=0;j<w;j++)s.rows[row+i-1][col+j-1]=values[i][j];}return this},clearContent(){return this.setValues(Array.from({length:n},()=>Array(w).fill('')))}};}
  appendRow(r){this.rows.push([...r]);}getLastRow(){return this.rows.length}setFrozenRows(){}setColumnWidth(){}
 }
 const sheets=new Map(),ss={getId:()=> 'sheet-id',getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=new Sheet();sheets.set(n,s);return s;}};
 const prop={getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>{properties.set(k,v);return prop},deleteProperty:k=>properties.delete(k)};
 const folder={getId:()=> 'folder-id',createFile:()=>{const id='file-'+(++created);const f={id,shared:false,trashed:false,getId:()=>id,getResourceKey:()=> 'resource-key',setSharing(access){if(failShare)throw new Error('Sharing disabled');this.shared=access==='public';return this},setTrashed(v){this.trashed=v;return this}};files.set(id,f);return f;}};
 const ctx=vm.createContext({console,Date,PropertiesService:{getScriptProperties:()=>prop},SpreadsheetApp:{getActiveSpreadsheet:()=>ss,openById:()=>ss,flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},CacheService:{getScriptCache:()=>({put:(k,v)=>cache.set(k,v),get:k=>cache.get(k)||null})},DriveApp:{createFolder:()=>folder,getFolderById:()=>folder,getFileById:id=>files.get(id),Access:{ANYONE_WITH_LINK:'public',PRIVATE:'private'},Permission:{VIEW:'view',NONE:'none'}},Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(a,s)=>[...crypto.createHash(a).update(s).digest()],computeHmacSha256Signature:(s,key)=>[...crypto.createHmac('sha256',key).update(s).digest()],base64Decode:s=>[...Buffer.from(s,'base64')],newBlob:b=>b}});
 vm.runInContext(source,ctx);ctx.setup_();
 function edit(k,v){const s=sheets.get('Config');s.rows.find(r=>r[0]===k)[1]=v;}
 return {ctx,sheets,files,edit,properties,setFailShare:v=>failShare=v,created:()=>created};
}
function jpeg(w=1200,h=1800){return 'data:image/jpeg;base64,'+Buffer.from([255,216,255,192,0,17,8,h>>8,h&255,w>>8,w&255,3,1,17,0,2,17,0,3,17,0,255,217]).toString('base64');}
function login(h,role='station',password='2006'){return h.ctx.api('login',{role,password}).token;}
function photo(h,token){return {token,id:crypto.randomUUID(),jpeg:jpeg(),configVersion:h.ctx.api('config').version,consent:true};}

test('initial config is public; password and digest never leave server',()=>{const h=harness(),c=h.ctx.api('config');assert.deepEqual(Object.keys(c).sort(),['frameUrl','logoUrl','subtitle','title','version']);assert(!JSON.stringify(c).includes('2006'));assert.equal(c.version.length,64);assert(!h.sheets.get('Config').rows.some(r=>r[1]==='2006'));});
test('settings require an admin session; unknown API and unauthenticated uploads rejected',()=>{const h=harness(),t=login(h),c=h.ctx.api('config');assert.throws(()=>h.ctx.api('saveConfig',{...c,token:t}),/amministratore/);assert.throws(()=>h.ctx.api('upload',{}),/SESSIONE_SCADUTA/);assert.throws(()=>h.ctx.api('setup_',{}),/non consentita/);});
test('Sheet edits are immediately visible and reject stale saves',()=>{const h=harness(),t=login(h,'admin'),c=h.ctx.api('config');h.edit('title','Nuovo evento');assert.equal(h.ctx.api('config').title,'Nuovo evento');assert.throws(()=>h.ctx.api('saveConfig',{...c,token:t}),/nel frattempo/);});
test('password change from Sheet clears plaintext and revokes all sessions',()=>{const h=harness(),t=login(h);h.edit('password_new','nuova-password-sicura');h.ctx.api('config');assert.equal(h.sheets.get('Config').rows.find(r=>r[0]==='password_new')[1],'');assert.throws(()=>h.ctx.api('upload',photo(h,t)),/SESSIONE_SCADUTA/);assert.throws(()=>login(h),/non corretta/);assert.equal(login(h,'admin','nuova-password-sicura').length,72);});
test('app save persists configuration and password in Sheet',()=>{const h=harness(),t=login(h,'admin'),c=h.ctx.api('config');const r=h.ctx.api('saveConfig',{...c,token:t,title:'Evento Rosa',newPassword:'rosa-2027-evento'});assert.equal(r.title,'Evento Rosa');assert.notEqual(c.version,r.version);assert.throws(()=>h.ctx.api('saveConfig',{...r,token:t}),/SESSIONE_SCADUTA/);assert(login(h,'admin','rosa-2027-evento'));});
test('login throttling persists on server',()=>{const h=harness();for(let i=0;i<10;i++)assert.throws(()=>login(h,'admin','wrong'),/non corretta/);assert.throws(()=>login(h),/Troppi tentativi/);assert(h.properties.has('LOGIN_RATE'));});
test('upload is idempotent including public resource key',()=>{const h=harness(),t=login(h),p=photo(h,t),a=h.ctx.api('upload',p),b=h.ctx.api('upload',p);assert.equal(a.url,b.url);assert.match(a.url,/resourcekey=resource-key/);assert.equal(h.created(),1);assert.equal(h.sheets.get('Photos').rows.length,2);assert.equal(h.sheets.get('Photos').rows[1][6],'ready');});
test('sharing failure emits no QR; retry resumes same file',()=>{const h=harness(),p=photo(h,login(h));h.setFailShare(true);assert.throws(()=>h.ctx.api('upload',p),/Sharing disabled/);assert.equal(h.sheets.get('Photos').rows[1][6],'pending');assert.equal(h.sheets.get('Photos').rows[1][3],'');h.setFailShare(false);assert(h.ctx.api('upload',p).url);assert.equal(h.created(),1);});
test('consent, dimensions, payload and duplicate content are validated',()=>{const h=harness(),p=photo(h,login(h));assert.throws(()=>h.ctx.api('upload',{...p,consent:false}),/non valida/);assert.throws(()=>h.ctx.api('upload',{...p,jpeg:jpeg(300,400)}),/1200/);assert.throws(()=>h.ctx.api('upload',{...p,jpeg:'not-jpeg'}),/JPEG/);h.ctx.api('upload',p);assert.throws(()=>h.ctx.api('upload',{...p,jpeg:jpeg(600,900)}),/diversa/);assert.equal(h.created(),1);});
test('retention removes public access and expired IDs cannot be resurrected',()=>{const h=harness(),p=photo(h,login(h));h.ctx.api('upload',p);h.sheets.get('Photos').rows[1][1]='2000-01-01T00:00:00.000Z';assert.equal(h.ctx.cleanup_(),1);const f=[...h.files.values()][0];assert(f.trashed);assert.equal(f.shared,false);assert.equal(h.sheets.get('Photos').rows[1][6],'deleted');assert.throws(()=>h.ctx.api('upload',p),/scaduta/);});
test('project setup is idempotent and never resets an existing password',()=>{const h=harness();h.edit('password_new','secret-long-pass');h.ctx.api('config');h.ctx.setup_();assert(login(h,'admin','secret-long-pass'));});
