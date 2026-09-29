// HTML Service bridge: nessun fetch no-cors, JSONP o segreto negli URL.
export class Bridge{
  constructor(url){this.url=url;this.pending=new Map();this.peer=null;this.readyPromise=null;this.listener=e=>this.receive(e);window.addEventListener('message',this.listener);}
  receive(e){
    const m=e.data;
    if(!m || m.channel!==this.channel || !/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(e.origin))return;
    if(m.type==='giro-ready' && !this.peer){this.peer=e.source;this.origin=e.origin;this.resolveReady();return;}
    if(e.source!==this.peer || e.origin!==this.origin || m.type!=='giro-response')return;
    const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);
    m.error?p.reject(new Error(m.error)):p.resolve(m.result);
  }
  ready(){
    if(this.peer)return Promise.resolve();if(this.readyPromise)return this.readyPromise;
    this.channel=crypto.randomUUID();
    this.readyPromise=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.readyPromise=null;this.frame?.remove();reject(new Error('Backend non raggiungibile. Controlla Internet, deployment pubblico e APP_ORIGIN.'));},25000);
      this.resolveReady=()=>{clearTimeout(timer);resolve();};
      const u=new URL(this.url);u.searchParams.set('channel',this.channel);
      this.frame=document.createElement('iframe');this.frame.id='backend-frame';this.frame.title='Collegamento sicuro al salvataggio';this.frame.src=u.href;document.body.append(this.frame);
    });return this.readyPromise;
  }
  async call(action,payload={}){
    await this.ready();const id=crypto.randomUUID();
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Risposta lenta o rete assente. La foto resta salvata sul dispositivo: riprova.'));},90000);
      this.pending.set(id,{resolve,reject,timer});this.peer.postMessage({type:'giro-request',channel:this.channel,id,action,payload},this.origin);
    });
  }
}
