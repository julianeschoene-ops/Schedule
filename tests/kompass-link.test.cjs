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
    console,URLSearchParams,AbortController,crypto:webcrypto,Date:class extends Date {},
    location:{hash,pathname:'/Schedule/',search:''},
    history:{replaceState(_a,_b,url){c.location.hash='';c.lastUrl=url;}},
    document:{querySelector:()=>app,getElementById:()=>null,querySelectorAll:()=>[],addEventListener(){}},
    sessionStorage:storage(),localStorage:storage(),fetch:(url,init)=>url.endsWith('kompass_english_test_window')?Promise.resolve(response({open:true,test_date:'2026-10-23'})):fetch(url,init),
    setInterval(){},setTimeout,clearTimeout,confirm:()=>true,alert(){},prompt:()=>null,
    addEventListener(){},
    VOCAB:{'16':{unit:4,number:16,title:'shop – now',words:Array.from({length:23},(_,n)=>['word'+n,'Wort'+n])},'17':{unit:4,number:17,title:'way – by (bike)',words:Array.from({length:50},(_,n)=>['word'+n,'Wort'+n])},u1:{unit:1,number:1,title:'School',words:Array.from({length:10},(_,n)=>['word'+n,'Wort'+n])}}
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
  assert.equal(c.link.beginTest('vocab:lwl-u4-test-1','School'),false);
  await c.link.login('123456');assert.equal(c.link.state,'confirm');c.link.confirm();assert.equal(c.link.active,true);assert.ok(!c.sessionStorage.getItem(c.link.storageKey).includes('123456'));
});
test('only an explicit LWL assessment submits; repeated finish sends one attempt; end clears identity',async()=>{
  const submissions=[];
  const c=setup(async(url,init)=>{
    const body=JSON.parse(init.body);
    if(url.endsWith('resolve_code_v2'))return response({ok:true,first_name:'Alex'});
    submissions.push(body);return response({saved:true,attempt_id:body.p_attempt_id});
  });
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();
  vm.runInContext("current='u1';start('de-en');score=5;i=deck.length;finish()",c);
  await tick();assert.equal(submissions.length,0);
  await vm.runInContext("startAssessment('u4-test-1')",c);vm.runInContext("score=8;i=deck.length;finish();finish()",c);
  await tick();await tick();
  assert.equal(submissions.length,1);assert.equal(submissions[0].p_points,8);
  assert.equal(submissions[0].p_max_points,23);assert.equal(submissions[0].p_token,code);
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
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();c.link.beginTest('vocab:lwl-u4-test-1','School');
  c.link.finishTest(0,10);await tick();await tick();
  assert.equal(c.link.pending.length,1);assert.equal(c.link.attempt.status,'pending');
  online=true;await c.link.flush();
  assert.equal(ids[0],ids[1]);assert.equal(c.link.pending.length,0);
  assert.equal(c.link.attempt.status,'saved');
});
test('guest tests and stale responses after a reset cannot be attributed to a new child',async()=>{
  let resolveSend;
  const c=setup(async(url)=>url.endsWith('resolve_code_v2')?response({ok:true,first_name:'Alex'}):new Promise(r=>resolveSend=r));
  c.link.beginTest('vocab:lwl-u4-test-1','School');c.link.finishTest(3,10);
  assert.equal(c.link.pending.length,0);assert.equal(c.link.attempt.status,'guest');
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();c.link.beginTest('vocab:lwl-u4-test-1','School');
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

test('server time, rather than the device clock, controls test access',async()=>{
  const c=setup(async()=>response({ok:true,first_name:'Alex'}));
  c.fetch=async()=>response({open:false,test_date:'2026-10-23',server_now:'2026-10-23T18:00:00Z'});
  // Pretend the device clock says it is in the permitted morning window.
  vm.runInContext("Date.now=()=>new Date('2026-10-23T08:00:00Z').getTime()",c);
  assert.equal(await c.link.canStartTest(),false);
  c.fetch=async()=>response({open:true,test_date:'2026-10-23'});
  assert.equal(await c.link.canStartTest(),true);
});
test('a closed-window submission is discarded instead of uploading the next morning',async()=>{
  const c=setup(async(url)=>url.endsWith('resolve_code_v2')?response({ok:true,first_name:'Alex'}):response({ok:false,window_closed:true,message:'Testzeit ist geschlossen.'}));
  await c.link.connect(code);await c.link.login('123456');c.link.confirm();
  c.link.windowInfo={test_date:'2026-10-23'};c.link.beginTest('vocab:lwl-u4-test-1','School');c.link.finishTest(7,10);
  await tick();await tick();assert.equal(c.link.pending.length,0);assert.equal(c.link.attempt.status,'failed');
});


test('ordinary selfchecks stay available outside test time and never submit',async()=>{
  let calls=0;const c=setup(async()=>{calls++;return response({saved:true})});
  c.fetch=async()=>{throw Error('A practice round must not call the server')};
  vm.runInContext("current='u1';testOptions();startTest(10);score=7;i=deck.length;finish()",c);
  await tick();assert.equal(calls,0);assert.equal(c.link.attempt,null);assert.equal(c.link.pending.length,0);
  assert.match(c.document.querySelector().innerHTML,/Kein Ergebnis an KOMPASS/);
});
test('Unit 4 exposes only the two explicitly marked LWL tests',()=>{
 const c=setup(async()=>response({}));const html=vm.runInContext('lwlTestCards(4)',c);
 assert.match(html,/Vocabulary Test 1/);assert.match(html,/Vocabulary Test 2/);
 assert.match(html,/Aufgabe 2a/);assert.match(html,/Aufgabe 3a/);
 assert.match(html,/shop – now/);assert.match(html,/way – by/);
 assert.equal((html.match(/Zum Test/g)||[]).length,2);
});
test('obsolete practice payloads are never restored as assessment results',async()=>{
 const c=setup(async()=>response({}));await c.link.connect(code,[{p_token:code,p_task_key:'vocab:16'},{p_token:code,p_task_key:'vocab:lwl-u4-test-1'}]);
 assert.equal(c.link.waitingPending.length,1);assert.equal(c.link.waitingPending[0].p_task_key,'vocab:lwl-u4-test-1');
});
test('authorization errors stop retrying and give an explicit reload message',async()=>{
 const c=setup(async(url)=>url.endsWith('resolve_code_v2')?response({ok:true,first_name:'Alex'}):{ok:false,status:401,json:async()=>({code:'42501',message:'permission denied'})});
 await c.link.connect(code);await c.link.login('123456');c.link.confirm();c.link.beginTest('vocab:lwl-u4-test-1','Test 1');c.link.finishTest(7,23);
 await tick();await tick();assert.equal(c.link.pending.length,0);assert.equal(c.link.attempt.status,'failed');assert.match(c.link.resultMarkup(),/Seite neu laden/);
});
test('practice-only rejection never becomes a saved test or an endless pending result',async()=>{
 const c=setup(async(url)=>url.endsWith('resolve_code_v2')?response({ok:true,first_name:'Alex'}):response({ok:false,practice_only:true,message:'Dies ist eine Übung.'}));
 await c.link.connect(code);await c.link.login('123456');c.link.confirm();c.link.beginTest('vocab:16','Practice');c.link.finishTest(7,23);
 await tick();await tick();assert.equal(c.link.pending.length,0);assert.equal(c.link.attempt.status,'failed');assert.match(c.link.resultMarkup(),/Übung/);
});

test('formal tests require identity and never reveal answers during the round',async()=>{
 const c=setup(async()=>response({ok:true,first_name:'Alex'}));
 await vm.runInContext("startAssessment('u4-test-1')",c);assert.equal(c.link.attempt,null);
 await c.link.connect(code);await c.link.login('123456');c.link.confirm();
 await vm.runInContext("startAssessment('u4-test-1')",c);
 const html=c.document.querySelector().innerHTML;
 assert.match(html,/Deutsch → Englisch/);assert.match(html,/spellcheck="false"/);
 assert.ok(!html.includes('checkTyped'));assert.ok(!html.includes('Show answer'));assert.ok(!html.includes('Correct!'));
 vm.runInContext('i=22;renderQ()',c);assert.match(c.document.querySelector().innerHTML,/Test abgeben/);
});
