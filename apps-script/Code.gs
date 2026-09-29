/** GIRO FRAME — functions ending in _ are private to google.script.run. */
const CONFIG_KEYS_ = ['title','subtitle','frameUrl','logoUrl'];
const HEADERS_ = ['id','createdAt','fileId','url','downloadUrl','configVersion','status','sha256','consentAt'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('GIRO FRAME')
    .addItem('1. Inizializza progetto', 'setup_')
    .addItem('Applica modifiche / nuova password', 'syncSheet_')
    .addItem('Installa pulizia giornaliera', 'installCleanup_')
    .addItem('Esegui pulizia foto scadute', 'cleanup_').addToUi();
}

function setup_() {
  return locked_(function(){
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    if(!ss)throw new Error('Apri Apps Script dal Google Sheet: Estensioni → Apps Script.');
    const props=PropertiesService.getScriptProperties();
    const existing=props.getProperty('SPREADSHEET_ID');
    if(existing && existing!==ss.getId())throw new Error('Questo progetto è già collegato a un altro Sheet.');
    props.setProperty('SPREADSHEET_ID',ss.getId());
    if(!props.getProperty('PEPPER'))props.setProperty('PEPPER',random_());
    if(!props.getProperty('PHOTO_FOLDER_ID'))props.setProperty('PHOTO_FOLDER_ID',DriveApp.createFolder('GIRO FRAME — Foto').getId());
    if(!props.getProperty('MAX_PHOTOS'))props.setProperty('MAX_PHOTOS','2000');
    let s=ss.getSheetByName('Config');
    if(!s){
      s=ss.insertSheet('Config');
      const rows=[['key','value','istruzioni'],
        ['title','Il tuo momento in rosa.','Titolo dell’app, massimo 80 caratteri'],
        ['subtitle','Un sorriso, uno scatto. Porta con te il ricordo di questa giornata.','Sottotitolo, massimo 200 caratteri'],
        ['frameUrl','','URL HTTPS cornice trasparente 1200 × 1800; vuoto = demo'],
        ['logoUrl','','URL HTTPS logo trasparente; vuoto = demo'],
        ['password_new','','Inserisci nuova password (min. 8 caratteri), poi menu GIRO FRAME → Applica modifiche'],
        ['password_hash','','GESTITO DAL SERVER: non modificare'],
        ['retentionDays','7','Giorni prima della rimozione dal Drive; installare il trigger di pulizia']];
      s.getRange(1,1,rows.length,3).setNumberFormat('@').setValues(rows);s.setFrozenRows(1);s.setColumnWidth(1,150);s.setColumnWidth(2,480);s.setColumnWidth(3,510);
      setPassword_(s,'2006');
    }
    if(!ss.getSheetByName('Photos')){
      const p=ss.insertSheet('Photos');p.appendRow(HEADERS_);p.setFrozenRows(1);p.getRange('A:I').setNumberFormat('@');
    }
    return 'Pronto. Configura APP_ORIGIN nelle proprietà script e cambia la password iniziale.';
  });
}

function doGet(e) {
  const props=PropertiesService.getScriptProperties();
  const origin=props.getProperty('APP_ORIGIN')||'';
  const channel=String(e && e.parameter && e.parameter.channel || '');
  if(!/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?$/.test(origin)||!/^[a-f0-9-]{36}$/.test(channel)){
    return HtmlService.createHtmlOutput('GIRO FRAME: apri l’app dal link GitHub Pages. Verifica APP_ORIGIN nelle proprietà script.');
  }
  const t=HtmlService.createTemplateFromFile('Bridge');
  t.originJson=JSON.stringify(origin).replace(/</g,'\\u003c');
  t.channelJson=JSON.stringify(channel);
  return t.evaluate().setTitle('GIRO FRAME — collegamento').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Sole API entry point. Origin is a transport boundary, never an auth substitute.
function api(action, payload) {
  if(!['config','login','saveConfig','upload'].includes(action))throw new Error('Operazione non consentita.');
  const p=payload||{};
  return locked_(function(){
    const ss=sheet_(), cs=ss.getSheetByName('Config');
    const map=configMap_(cs);
    // Also handles pasted Sheet passwords even if the editor forgot to use the menu.
    if(map.password_new){validatePassword_(map.password_new);setPassword_(cs,map.password_new);map.password_hash=configMap_(cs).password_hash;map.password_new='';}
    validateConfig_(map);
    if(action==='config')return publicConfig_(map);
    if(action==='login')return login_(p,map);
    const session=authorize_(p.token,map,action==='saveConfig'?'admin':null);
    if(action==='saveConfig')return saveConfig_(cs,p,map);
    return upload_(ss,p,session);
  });
}
function locked_(fn){const l=LockService.getScriptLock();if(!l.tryLock(30000))throw new Error('Servizio occupato. Riprova tra pochi secondi.');try{return fn();}finally{l.releaseLock();}}
function sheet_(){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw new Error('Esegui setup_ dal progetto Apps Script.');return SpreadsheetApp.openById(id);}
function random_(){return Utilities.getUuid()+Utilities.getUuid();}
function hex_(bytes){return bytes.map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function digest_(s){return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8));}
function hmac_(s){return hex_(Utilities.computeHmacSha256Signature(s,PropertiesService.getScriptProperties().getProperty('PEPPER'),Utilities.Charset.UTF_8));}
function equal_(a,b){a=String(a);b=String(b);let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0;}
function configMap_(s){
  if(!s)throw new Error('Foglio Config mancante.');const map={};
  s.getDataRange().getValues().slice(1).forEach(r=>{const key=String(r[0]);if(!key)return;if(Object.prototype.hasOwnProperty.call(map,key))throw new Error('Chiave duplicata in Config: '+key);map[key]=String(r[1]);});return map;
}
function row_(s,key){const rows=s.getDataRange().getValues();const index=rows.findIndex(r=>String(r[0])===key);if(index<1)throw new Error('Chiave Config mancante: '+key);return index+1;}
function put_(s,key,value){s.getRange(row_(s,key),2).setNumberFormat('@').setValue(value);}
function validatePassword_(p){if(typeof p!=='string'||p.length<8||p.length>128)throw new Error('La nuova password deve contenere da 8 a 128 caratteri.');}
function setPassword_(s,password){const salt=random_();put_(s,'password_hash',salt+':'+hmac_(salt+':'+password));put_(s,'password_new','');SpreadsheetApp.flush();}
function validateUrl_(s){if(s && (!/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:[/?#][^\s]*)?$/.test(s)||s.length>2000))throw new Error('URL immagine non valido: usa un link HTTPS diretto.');}
function validateConfig_(m){
  for(const k of CONFIG_KEYS_)if(typeof m[k]!=='string')throw new Error('Config incompleta: manca '+k);
  if(!m.title.trim()||m.title.length>80||!m.subtitle.trim()||m.subtitle.length>200)throw new Error('Titolo o sottotitolo non valido nel foglio Config.');
  validateUrl_(m.frameUrl);validateUrl_(m.logoUrl);
  if(!/^.{72}:[a-f0-9]{64}$/.test(m.password_hash||''))throw new Error('Password non inizializzata.');
  if(!/^\d+$/.test(m.retentionDays)||+m.retentionDays<1||+m.retentionDays>365)throw new Error('retentionDays deve essere tra 1 e 365.');
}
function publicConfig_(m){const c={};CONFIG_KEYS_.forEach(k=>c[k]=m[k]);c.version=digest_(JSON.stringify(CONFIG_KEYS_.map(k=>m[k]).concat(m.password_hash)));return c;}
function login_(p,m){
  if(!['station','admin'].includes(p.role)||typeof p.password!=='string'||p.password.length>128)throw new Error('Accesso non valido.');
  // Persisted server-side, globally scoped because Apps Script exposes no trusted client IP.
  const props=PropertiesService.getScriptProperties(),now=Date.now();
  let rate=JSON.parse(props.getProperty('LOGIN_RATE')||'{"count":0,"until":0}');
  if(now>rate.until)rate={count:0,until:now+15*60*1000};
  if(rate.count>=10)throw new Error('Troppi tentativi. Attendi 15 minuti o chiedi al gestore.');
  const parts=m.password_hash.split(':');
  if(!equal_(hmac_(parts[0]+':'+p.password),parts[1])){
    rate.count++;props.setProperty('LOGIN_RATE',JSON.stringify(rate));throw new Error('Password non corretta.');
  }
  props.deleteProperty('LOGIN_RATE');
  const token=random_(),session={role:p.role,credential:m.password_hash,expires:now+21600000};
  CacheService.getScriptCache().put('session:'+digest_(token),JSON.stringify(session),21600);
  return {token,expires:session.expires};
}
function authorize_(token,m,role){
  if(typeof token!=='string'||!/^[a-f0-9-]{72}$/.test(token))throw new Error('SESSIONE_SCADUTA: attiva nuovamente la postazione.');
  const raw=CacheService.getScriptCache().get('session:'+digest_(token));
  const session=raw?JSON.parse(raw):null;
  if(!session||session.expires<Date.now()||!equal_(session.credential,m.password_hash))throw new Error('SESSIONE_SCADUTA: attiva nuovamente la postazione.');
  if(role&&session.role!==role)throw new Error('Accesso amministratore richiesto.');return session;
}
function saveConfig_(s,p,m){
  if(p.version!==publicConfig_(m).version)throw new Error('Configurazione modificata nel frattempo. Chiudi e riapri Impostazioni per leggere i valori aggiornati.');
  const next=Object.assign({},m);
  CONFIG_KEYS_.forEach(k=>{if(typeof p[k]!=='string')throw new Error('Valore mancante: '+k);next[k]=p[k].trim();});
  validateConfig_(next);if(p.newPassword)validatePassword_(p.newPassword);
  // Single range write avoids partial config on ordinary errors; the Sheet remains the source of truth.
  const rows=s.getDataRange().getValues();
  rows.forEach((r,i)=>{if(i && CONFIG_KEYS_.includes(String(r[0])))r[1]=next[r[0]];});
  s.getRange(1,1,rows.length,rows[0].length).setValues(rows);
  if(p.newPassword)setPassword_(s,p.newPassword);
  SpreadsheetApp.flush();return publicConfig_(configMap_(s));
}
function jpegDimensions_(bytes){
  const b=bytes.map(x=>x&255);if(b[0]!==255||b[1]!==216||b[b.length-2]!==255||b[b.length-1]!==217)throw new Error('JPEG non valido.');
  let i=2;
  while(i+4<b.length){
    if(b[i++]!==255)throw new Error('JPEG non valido.');while(b[i]===255)i++;
    const marker=b[i++];if(marker===218||marker===217)break;
    const size=(b[i]<<8)|b[i+1];if(size<2||i+size>b.length)break;
    if([192,193,194].includes(marker))return {height:(b[i+3]<<8)|b[i+4],width:(b[i+5]<<8)|b[i+6]};i+=size;
  }
  throw new Error('Dimensioni JPEG non leggibili.');
}
function upload_(ss,p){
  if(!/^[a-f0-9-]{36}$/.test(p.id||'')||p.consent!==true)throw new Error('Richiesta foto non valida.');
  if(typeof p.jpeg!=='string'||p.jpeg.length>4000000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(p.jpeg))throw new Error('JPEG richiesto, massimo 3 MB.');
  if(!/^[a-f0-9]{64}$/.test(p.configVersion||''))throw new Error('Versione grafica non valida.');
  const hash=digest_(p.jpeg),s=ss.getSheetByName('Photos'),rows=s.getDataRange().getValues();
  let index=rows.findIndex((r,i)=>i>0 && String(r[0])===p.id),file;
  if(index>=1){
    const r=rows[index];if(String(r[7])!==hash)throw new Error('Identificativo già usato per una foto diversa.');
    if(r[6]==='deleted')throw new Error('Foto scaduta: non può essere ripubblicata con lo stesso identificativo.');
    if(r[6]==='ready')return {url:String(r[3]),downloadUrl:String(r[4])};
    file=DriveApp.getFileById(String(r[2]));
  }else{
    const max=Number(PropertiesService.getScriptProperties().getProperty('MAX_PHOTOS')||2000);
    if(rows.length-1>=max)throw new Error('Limite foto raggiunto. Il gestore può aumentare MAX_PHOTOS.');
    const bytes=Utilities.base64Decode(p.jpeg.slice(23));const dim=jpegDimensions_(bytes);
    if(dim.width!==1200||dim.height!==1800)throw new Error('La foto deve misurare 1200 × 1800 px.');
    const folder=DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('PHOTO_FOLDER_ID'));
    file=folder.createFile(Utilities.newBlob(bytes,'image/jpeg','giro-frame-'+p.id+'.jpg'));
    try{s.appendRow([p.id,new Date().toISOString(),file.getId(),'','',p.configVersion,'pending',hash,new Date().toISOString()]);SpreadsheetApp.flush();}
    catch(e){file.setTrashed(true);throw e;}
    index=s.getLastRow()-1;
  }
  // If sharing is disabled by Workspace policy, remain pending; never emit an unusable QR.
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  const key=file.getResourceKey();const suffix=key?'&resourcekey='+encodeURIComponent(key):'';
  const url='https://drive.google.com/file/d/'+file.getId()+'/view'+(key?'?resourcekey='+encodeURIComponent(key):'');
  const download='https://drive.google.com/uc?export=download&id='+file.getId()+suffix;
  s.getRange(index+1,4,1,2).setValues([[url,download]]);s.getRange(index+1,7).setValue('ready');SpreadsheetApp.flush();
  return {url,downloadUrl:download};
}
function syncSheet_(){return api('config',{});}
function installCleanup_(){
  const exists=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='cleanup_');
  if(!exists)ScriptApp.newTrigger('cleanup_').timeBased().everyDays(1).atHour(3).create();
}
function cleanup_(){
  return locked_(function(){
    const ss=sheet_(),m=configMap_(ss.getSheetByName('Config'));validateConfig_(m);
    const cutoff=Date.now()-Number(m.retentionDays)*86400000,s=ss.getSheetByName('Photos'),rows=s.getDataRange().getValues();
    let count=0;
    // Bound each run. Next daily execution continues remaining rows.
    for(let i=1;i<rows.length&&count<100;i++){
      const r=rows[i];if(r[6]==='deleted'||new Date(r[1]).getTime()>cutoff)continue;
      try{
        const file=DriveApp.getFileById(String(r[2]));file.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);file.setTrashed(true);
        s.getRange(i+1,4,1,2).clearContent();s.getRange(i+1,7).setValue('deleted');count++;
      }catch(e){console.warn('Pulizia non riuscita per riga '+(i+1)+': controllare file e permessi.');}
    }
    return count;
  });
}
