const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const {webcrypto} = require('node:crypto');
const root = path.join(__dirname, '..');
const tick = () => new Promise(resolve => setImmediate(resolve));
function storage() {
  const data = {};
  return new Proxy({getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]}, {
    ownKeys:()=>Object.keys(data),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})
  });
}
function setup(fetch, hash = '') {
  const app = {innerHTML:''}, c = {
    console,URLSearchParams,AbortController,crypto:webcrypto,Date,
    location:{hash,pathname:'/Schedule/',search:''},
    history:{replaceState(_a,_b,url){c.location.hash='';c.lastUrl=url;}},
    document:{querySelector:()=>app,getElementById:()=>null,addEventListener(){}},
    sessionStorage:storage(),localStorage:storage(),fetch,
    setInterval(){},setTimeout,clearTimeout,confirm:()=>true,alert(){},prompt:()=>null,
    addEventListener(){},
    VOCAB:{u1:{unit:1,number:1,title:'School',words:Array.from({length:10},(_,n)=>['word'+n,'Wort'+n])}}
  };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root,'kompass-link.js'),'utf8')+'\nglobalThis.link=PracticeLink;',c);
  vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),c);
  return c;
}
const response = data => ({ok:true,json:async()=>data});
const code = 'a'.repeat(64);
test('QR token is removed from the URL; a child must confirm their name',async()=>{
  const c=setup(async()=>response({ok:true,first_name:'Alex'}),'#code='+code);
  assert.equal(c.location.hash,'');assert.equal(c.lastUrl,'/Schedule/');
  await c.link.boot();assert.equal(c.link.active,false);assert.equal(c.link.state,'pin');assert.equal(c.link.name,'');
  assert.equal(c.link.beginTest('vocab:u1','School'),false);
  await c.link.login('123456');assert.equal(c.link.state,'confirm');c.link.confirm();assert.equal(c.link.active,true);assert.ok(!c.sessionStorage.getItem(c.link.storageKey).includes('123456'));
});
test('only test mode submits; repeated finish sends one attempt; end clears identity',async()=>{
  const submissions=[];
  const c=setup(async(url,init)=>{
    const body=JSON.parse(init.body);
    if(url.endsWith('resolve_code_v2'))return response({ok:true,first_name:'Alex'});
    submissions.push(body);return response({saved:true,attempt_id:body.p_attempt_id});
  });
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();
  vm.runInContext("current='u1';start('de-en');score=5;i=deck.length;finish()",c);
  await tick();assert.equal(submissions.length,0);
  vm.runInContext("startTest(10);score=8;i=deck.length;finish();finish()",c);
  await tick();await tick();
  assert.equal(submissions.length,1);assert.equal(submissions[0].p_points,8);
  assert.equal(submissions[0].p_max_points,10);assert.equal(submissions[0].p_token,code);
  assert.equal(c.link.attempt.status,'saved');
  vm.runInContext('endSession()',c);
  assert.equal(c.link.token,null);assert.equal(c.sessionStorage.getItem(c.link.storageKey),null);
});
test('network failure keeps the same attempt for retry and never claims success early',async()=>{
  let online=false;const ids=[];
  const c=setup(async(url,init)=>{
    if(url.endsWith('resolve_code_v2'))return response({ok:true,first_name:'Alex'});
    const p=JSON.parse(init.body);ids.push(p.p_attempt_id);
    if(!online)throw new TypeError('offline');
    return response({saved:true});
  });
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();c.link.beginTest('vocab:u1','School');
  c.link.finishTest(0,10);await tick();await tick();
  assert.equal(c.link.pending.length,1);assert.equal(c.link.attempt.status,'pending');
  online=true;await c.link.flush();
  assert.equal(ids[0],ids[1]);assert.equal(c.link.pending.length,0);
  assert.equal(c.link.attempt.status,'saved');
});
test('guest tests and stale responses after a reset cannot be attributed to a new child',async()=>{
  let resolveSend;
  const c=setup(async(url)=>url.endsWith('resolve_code_v2')?response({ok:true,first_name:'Alex'}):new Promise(r=>resolveSend=r));
  c.link.beginTest('vocab:u1','School');c.link.finishTest(3,10);
  assert.equal(c.link.pending.length,0);assert.equal(c.link.attempt.status,'guest');
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();c.link.beginTest('vocab:u1','School');
  c.link.finishTest(3,10);await tick();c.link.reset();resolveSend(response({saved:true}));await tick();
  assert.equal(c.link.token,null);assert.equal(c.link.pending.length,0);assert.equal(c.link.attempt,null);
});
test('inactivity clears the connection before starting another test',async()=>{
  const c=setup(async()=>response({ok:true,first_name:'Alex'}));
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();c.link.last=Date.now()-31*60*1000;
  c.link.touch();assert.equal(c.link.active,false);assert.equal(c.link.token,null);
});

test('wrong PIN never reveals a name or enables submissions',async()=>{
  const c=setup(async()=>response({ok:false,message:'QR-Code oder PIN ungültig.'}));
  await c.link.connect(code);await c.link.login('000000');
  assert.equal(c.link.state,'pin');assert.equal(c.link.active,false);assert.equal(c.link.name,'');assert.equal(c.link.pin,null);
});
