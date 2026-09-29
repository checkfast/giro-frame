import {cropToCanvas,compose,loadImage,safeAssetUrl,renderQr} from './core.js';
import {store,photos} from './storage.js';
import {Bridge} from './bridge.js';
const $=s=>document.querySelector(s), demo=new URLSearchParams(location.search).get('demo')==='1'||window.GIRO_BOOT.demo;
const defaults={title:'Il tuo momento in rosa.',subtitle:'Un sorriso, uno scatto. Porta con te il ricordo di questa giornata.',frameUrl:'',logoUrl:'',version:'demo'};
let config,assets,shotAssets,shotConfig,raw,current,stream,facing='environment',adminToken,loginMode='station',settingsVersion;
let token=sessionStorage.getItem('giro-station')||'', api;
const uploads=new Set();let cameraGeneration=0;
function message(t=''){$('#message').textContent=t;}
function online(){const on=navigator.onLine;$('#connection').textContent=on?'Rete disponibile':'Senza rete';$('#connection').classList.toggle('online',on);}
function stopCamera(){cameraGeneration++;stream?.getTracks().forEach(t=>t.stop());stream=null;$('#video').srcObject=null;}
function screen(id){document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);window.scrollTo({top:0,behavior:'smooth'});}
function stationState(){
  $('#station-status').textContent=demo?'Modalità dimostrativa':token?'Postazione attiva · sessione fino a 6 ore':'Attiva la postazione per iniziare';
  $('#station-button').hidden=!!token||demo;$('#begin').disabled=!config||!assets||!$('#consent').checked||(!token&&!demo);
}
function applyConfig(c){config=c;const title=$('#event-title');title.textContent=c.title;if(c.title.endsWith('in rosa.')){title.textContent=c.title.slice(0,-8);const em=document.createElement('em');em.textContent='in rosa.';title.append(em);}$('#event-subtitle').textContent=c.subtitle;stationState();}
async function imageData(url){const im=await loadImage(url);if(im.naturalWidth>6000||im.naturalHeight>6000)throw new Error('Grafica troppo grande: massimo 6000 px per lato.');const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);return c.toDataURL('image/png');}
async function prepareAssets(c){
  const frame=c.frameUrl?safeAssetUrl(c.frameUrl):new URL('assets/frame-demo.svg',location.href).href;
  const logo=c.logoUrl?safeAssetUrl(c.logoUrl):new URL('assets/logo-demo.svg',location.href).href;
  const saved=await store('cache','get','assets');
  if(saved?.frameUrl===frame && saved?.logoUrl===logo){return {frame:await loadImage(saved.frame),logo:await loadImage(saved.logo)};}
  const [f,l]=await Promise.all([imageData(frame),imageData(logo)]);
  const result={frame:await loadImage(f),logo:await loadImage(l)};
  await store('cache','put',{frameUrl:frame,logoUrl:logo,frame:f,logo:l},'assets');return result;
}
async function syncConfig(){
  const c=demo?defaults:await api.call('config');
  const a=await prepareAssets(c);assets=a;applyConfig(c);await store('cache','put',c,'config');
}
function login(mode){loginMode=mode;$('#login-title').textContent=mode==='admin'?'Sblocca impostazioni':'Attiva postazione';$('#login-error').textContent='';$('#login-password').value='';$('#login-dialog').showModal();$('#login-password').focus();}
async function camera(){
  stopCamera();const generation=cameraGeneration;$('#shutter').disabled=true;
  try{const nextStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:2560}},audio:false});if(generation!==cameraGeneration||$('#capture').hidden){nextStream.getTracks().forEach(t=>t.stop());return;}stream=nextStream;$('#video').srcObject=stream;await $('#video').play();$('#shutter').disabled=false;}
  catch{if(generation!==cameraGeneration||$('#capture').hidden)return;message('Fotocamera non disponibile nel browser. Tocca “Usa fotocamera di iPad” e scegli Scatta foto.');}
}
function preview(source){raw=cropToCanvas(source);$('#raw-preview').src=raw.toDataURL('image/jpeg',.9);stopCamera();screen('preview');message();}
async function begin(){
  if(!token&&!demo){login('station');return;}
  $('#begin').disabled=true;message('Verifica della grafica…');
  try{
    if(navigator.onLine&&!demo)await syncConfig();message();
  }catch(e){message('Uso l’ultima configurazione caricata. '+e.message);}
  finally{stationState();}
  shotAssets=assets;shotConfig={...config};screen('capture');await camera();
}
async function showResult(record){
  current=record;screen('result');$('#final-photo').src=record.jpeg;$('#print-image').src=record.jpeg;$('#save-local').href=record.jpeg;$('#save-local').download=`giro-frame-${record.id.slice(0,8)}.jpg`;
  $('#print').disabled=true;await $('#print-image').decode();$('#print').disabled=false;drawUpload();
}
function drawUpload(){
  $('#qr').replaceChildren();$('#public-link').hidden=true;$('#retry-upload').hidden=true;
  if(current.url){
    renderQr(current.url,$('#qr'));$('#upload-title').textContent='Inquadra. Scarica. Ricorda.';$('#upload-status').textContent='Apri il QR con il telefono. In Google Drive usa il pulsante di download per salvare la foto.';$('#public-link').href=current.url;$('#public-link').hidden=false;
  }else if(demo){$('#upload-title').textContent='Anteprima dimostrativa';$('#upload-status').textContent='Il QR pubblico sarà disponibile dopo la configurazione del backend.';}
  else if(uploads.has(current.id)){$('#upload-title').textContent='Salvataggio della foto…';$('#upload-status').textContent='Puoi già stampare. Il QR apparirà a caricamento completato.';}
  else{$('#upload-title').textContent='Foto conservata sull’iPad';$('#upload-status').textContent='Il QR richiede Internet e il salvataggio su Drive. Riprova quando la connessione è disponibile.';$('#retry-upload').hidden=false;}
}
async function upload(record){
  if(demo||record.demo||record.url||uploads.has(record.id))return;
  if(!token){login('station');return;}
  uploads.add(record.id);if(current?.id===record.id)drawUpload();
  try{
    const result=await api.call('upload',{token,id:record.id,jpeg:record.jpeg,configVersion:record.configVersion,consent:true});
    record.url=result.url;record.downloadUrl=result.downloadUrl;record.uploadedAt=Date.now();
    await store('photos','put',record);
    if(current?.id===record.id)current=record;
  }catch(e){message(e.message);if(/SESSIONE_SCADUTA/.test(e.message)){token='';sessionStorage.removeItem('giro-station');stationState();}}
  finally{uploads.delete(record.id);if(current?.id===record.id)drawUpload();await refreshQueue();}
}
async function refreshQueue(){
  const rows=await photos(demo);$('#pending-panel').hidden=!rows.length;$('#queue').replaceChildren();
  for(const r of rows){
    const item=document.createElement('div');item.className='queue-item';const img=document.createElement('img');img.src=r.jpeg;img.alt='Miniatura foto salvata';
    const info=document.createElement('div');const p=document.createElement('p');p.textContent=`${new Date(r.createdAt).toLocaleString('it-IT')} · ${r.url?'Online':'Da caricare'}`;
    const open=document.createElement('button');open.className='text-button';open.textContent='Apri';open.onclick=guard(async()=>{if(!$('#preview').hidden||!$('#capture').hidden){message('Completa o annulla prima lo scatto in corso.');return;}stopCamera();await showResult(r);});
    const del=document.createElement('button');del.className='text-button';del.textContent='Rimuovi';del.onclick=guard(async()=>{
      if(uploads.has(r.id)){message('Attendi la fine del caricamento.');return;}
      if(!confirm(r.url?'Rimuovere la copia da questo iPad? La foto online resterà disponibile.':'Questa foto non è online. Eliminarla definitivamente dall’iPad?'))return;
      await store('photos','delete',r.id);if(current?.id===r.id)reset();await refreshQueue();
    });info.append(p,open,del);item.append(img,info);$('#queue').append(item);
  }
}
function reset(){stopCamera();raw=null;current=null;$('#raw-preview').removeAttribute('src');$('#final-photo').removeAttribute('src');$('#print-image').removeAttribute('src');$('#save-local').removeAttribute('href');$('#qr').replaceChildren();$('#consent').checked=false;stationState();screen('start');message();}
function guard(fn){return async e=>{try{await fn(e)}catch(err){message(err.message||'Operazione non riuscita. Riprova.');}};}
$('#consent').onchange=stationState;$('#begin').onclick=guard(begin);$('#station-button').onclick=()=>login('station');
$('#settings-button').onclick=()=>{if(demo){message('Nella demo le impostazioni non vengono salvate. Configura Apps Script per attivarle.');return;}login('admin');};
$('#lock-station').onclick=()=>{token='';adminToken='';sessionStorage.removeItem('giro-station');reset();message('Postazione bloccata. Le foto locali restano disponibili su questo iPad.');};
$('#switch-camera').onclick=guard(async()=>{facing=facing==='environment'?'user':'environment';await camera();});
$('#shutter').onclick=guard(()=>preview($('#video')));
$('#file-input').onchange=guard(async e=>{const file=e.target.files[0];if(!file)return;if(file.size>25000000)throw new Error('Foto troppo grande: massimo 25 MB.');const url=URL.createObjectURL(file);try{preview(await loadImage(url));}finally{URL.revokeObjectURL(url);e.target.value='';}});
$('#cancel-capture').onclick=reset;$('#retake').onclick=guard(async()=>{screen('capture');await camera();});
$('#continue').onclick=guard(async()=>{
  $('#continue').disabled=true;
  try{
    const jpeg=compose(raw,shotAssets.frame,shotAssets.logo);
    if(jpeg.length>4000000)throw new Error('Foto troppo pesante. Riduci la complessità della cornice.');
    const r={id:crypto.randomUUID(),jpeg,createdAt:Date.now(),configVersion:shotConfig.version,url:null,demo};
    await store('photos','put',r);await showResult(r);await refreshQueue();void upload(r);raw=null;
  }finally{$('#continue').disabled=false;}
});
$('#print').onclick=()=>{window.print();};
$('#retry-upload').onclick=guard(()=>upload(current));$('#new-photo').onclick=reset;$('#refresh-queue').onclick=guard(refreshQueue);
$('#login-form').onsubmit=async e=>{
  e.preventDefault();const button=e.submitter;button.disabled=true;$('#login-error').textContent='';
  try{
    const result=await api.call('login',{password:$('#login-password').value,role:loginMode});
    $('#login-password').value='';$('#login-dialog').close();
    if(loginMode==='station'){token=result.token;sessionStorage.setItem('giro-station',token);stationState();message('Postazione attivata.');}
    else{
      adminToken=result.token;const c=await api.call('config');settingsVersion=c.version;
      const f=$('#settings-form');for(const key of ['title','subtitle','frameUrl','logoUrl'])f.elements[key].value=c[key];f.elements.newPassword.value='';$('#settings-error').textContent='';$('#settings-dialog').showModal();
    }
  }catch(err){$('#login-error').textContent=err.message;message(err.message);}
  finally{button.disabled=false;}
};
$('#settings-form').onsubmit=async e=>{
  e.preventDefault();e.submitter.disabled=true;$('#settings-error').textContent='';
  try{
    const data=Object.fromEntries(new FormData(e.target));
    await prepareAssets(data);
    const c=await api.call('saveConfig',{token:adminToken,version:settingsVersion,...data});
    assets=await prepareAssets(c);applyConfig(c);await store('cache','put',c,'config');e.target.elements.newPassword.value='';$('#settings-dialog').close();adminToken='';
    if(data.newPassword){token='';sessionStorage.removeItem('giro-station');stationState();}
    message(data.newPassword?'Impostazioni salvate. Riattiva la postazione con la nuova password.':'Impostazioni salvate nel Google Sheet.');
  }catch(err){$('#settings-error').textContent=err.message;}
  finally{e.submitter.disabled=false;}
};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
$('#settings-dialog').addEventListener('close',()=>{adminToken='';$('#settings-form').elements.newPassword.value='';});
$('#login-dialog').addEventListener('close',()=>{$('#login-password').value='';});
window.addEventListener('online',()=>{online();message('Rete ripristinata. Apri le foto in attesa e premi Riprova salvataggio.');});window.addEventListener('offline',online);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else if(!$('#capture').hidden)void camera();});
async function init(){
  online();$('#demo-banner').hidden=!demo;await refreshQueue();
  if(!demo){
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(window.GIRO_BOOT.backendUrl)){message('Configurazione iniziale necessaria: inserisci l’URL Apps Script in config.js. Per vedere l’interfaccia aggiungi ?demo=1 al link.');stationState();return;}
    api=new Bridge(window.GIRO_BOOT.backendUrl);
  }
  try{await syncConfig();}
  catch(e){const c=await store('cache','get','config');if(c && c.version!=='demo'){assets=await prepareAssets(c);applyConfig(c);message('Configurazione locale recuperata. '+e.message);}else throw e;}
  await refreshQueue();stationState();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>message('Cache offline non disponibile; mantieni la pagina aperta.'));
}
void init().catch(e=>message(e.message));
