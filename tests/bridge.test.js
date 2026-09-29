import test from 'node:test';
import assert from 'node:assert/strict';
import {Bridge} from '../docs/bridge.js';
test('bridge rejects spoofed channel/origin/source and correlates replies and errors',async()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 globalThis.window={addEventListener(){}};globalThis.document={createElement:()=>({remove(){}}),body:{append(){}}};
 try{
  const b=new Bridge('https://script.google.com/macros/s/example/exec'),ready=b.ready();
  const sent=[],peer={postMessage:(m,o)=>sent.push([m,o])},origin='https://test-script.googleusercontent.com';
  const event=(type,extra={},source=peer,o=origin)=>({source,origin:o,data:{type,channel:b.channel,...extra}});
  b.receive(event('giro-ready',{},peer,'https://evil.example'));assert.equal(b.peer,null);
  b.receive(event('giro-ready',{channel:'wrong'}));assert.equal(b.peer,null);
  b.receive(event('giro-ready'));await ready;assert.equal(b.peer,peer);
  const call=b.call('login',{password:'private-runtime-value'});await Promise.resolve();
  assert.equal(sent.length,1);assert(!b.frame.src.includes('private-runtime-value'));assert.equal(sent[0][1],origin);
  const id=sent[0][0].id;
  b.receive(event('giro-response',{id,result:{token:'fake'}},{postMessage(){}}));assert.equal(b.pending.size,1);
  b.receive(event('giro-response',{id,result:{token:'real'}}));assert.deepEqual(await call,{token:'real'});
  const error=b.call('config');await Promise.resolve();b.receive(event('giro-response',{id:sent[1][0].id,error:'server failure'}));await assert.rejects(error,/server failure/);
 }finally{globalThis.window=oldWindow;globalThis.document=oldDocument;}
});
