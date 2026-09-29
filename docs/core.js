export const WIDTH = 1200, HEIGHT = 1800, FOOTER = 200;
export function cropRect(w,h,tw=WIDTH,th=HEIGHT){
  if (!(w>0 && h>0)) throw new Error('Dimensioni immagine non valide');
  const ratio=tw/th;
  const cw=Math.min(w,h*ratio), ch=cw/ratio;
  return [(w-cw)/2,(h-ch)/2,cw,ch];
}
export function safeAssetUrl(value,base=location.href){
  const url=new URL(value,base);
  if(url.protocol!=='https:' && !(url.origin===location.origin && ['localhost','127.0.0.1'].includes(url.hostname))) throw new Error('Le immagini devono usare HTTPS.');
  if(url.username || url.password) throw new Error('URL immagine non valido.');
  return url.href;
}
export async function loadImage(url){
  return new Promise((resolve,reject)=>{
    const i=new Image(); i.crossOrigin='anonymous';
    const t=setTimeout(()=>{i.src='';reject(new Error('Immagine non raggiungibile. Controlla URL, rete e CORS.'));},18000);
    i.onload=()=>{clearTimeout(t);resolve(i)};
    i.onerror=()=>{clearTimeout(t);reject(new Error('Immagine non caricabile. Usa un link HTTPS diretto con CORS.'));}; i.src=url;
  });
}
export function cropToCanvas(source){
  const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;
  const w=source.videoWidth||source.naturalWidth||source.width,h=source.videoHeight||source.naturalHeight||source.height;
  c.getContext('2d').drawImage(source,...cropRect(w,h),0,0,WIDTH,HEIGHT);return c;
}
export function compose(raw,frame,logo){
  const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;const x=c.getContext('2d');
  x.fillStyle='white';x.fillRect(0,0,WIDTH,HEIGHT);x.drawImage(raw,0,0,WIDTH,HEIGHT);
  x.fillRect(0,HEIGHT-FOOTER,WIDTH,FOOTER);
  x.drawImage(frame,0,0,WIDTH,HEIGHT);
  const scale=Math.min(960/logo.naturalWidth,140/logo.naturalHeight);
  const w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;
  x.drawImage(logo,(WIDTH-w)/2,HEIGHT-FOOTER+(FOOTER-h)/2,w,h);
  return c.toDataURL('image/jpeg',.92);
}
export function renderQr(url,host){
  const qr=window.qrcode(0,'M');qr.addData(url);qr.make();
  const n=qr.getModuleCount(),scale=6,margin=4;
  const c=document.createElement('canvas');c.width=c.height=(n+margin*2)*scale;
  c.setAttribute('role','img');c.setAttribute('aria-label','QR per aprire e scaricare la foto');
  const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='black';
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))ctx.fillRect((x+margin)*scale,(y+margin)*scale,scale,scale);
  host.replaceChildren(c);return c;
}
