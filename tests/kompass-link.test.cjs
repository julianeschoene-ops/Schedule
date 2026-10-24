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
const catalog=[{id:'u4-test-1',task_key:'vocab:lwl-u4-test-1',unit:4,title:'Vocabulary Test 1',source:'LWL · Station 1 · Aufgabe 2a',list:'16',range:'shop – now',question_count:23,competency_id:'eng5_5',competency_text:'Ich kann Orts- und Zeitangaben verstehen und richtig benutzen.',competency_area:'Sprachliche Mittel – Wortschatz',scope:'Wortschatz-Teilnachweis'},
{id:'u4-test-2',task_key:'vocab:lwl-u4-test-2',unit:4,title:'Vocabulary Test 2',source:'LWL · Station 2 · Aufgabe 3a',list:'17',range:'way – by (bike)',question_count:50,competency_id:'eng5_5',competency_text:'Ich kann Orts- und Zeitangaben verstehen und richtig benutzen.',competency_area:'Sprachliche Mittel – Wortschatz',scope:'Wortschatz-Teilnachweis'}];
function setup(fetch, hash = '', testCatalog = catalog) {
  const app = {innerHTML:''}, c = {
    console,URLSearchParams,AbortController,crypto:webcrypto,Date:class extends Date {},
    location:{hash,pathname:'/Schedule/',search:''},
    history:{replaceState(_a,_b,url){c.location.hash='';c.lastUrl=url;}},
    document:{querySelector:()=>app,getElementById:()=>null,querySelectorAll:()=>[],addEventListener(){}},
    sessionStorage:storage(),localStorage:storage(),fetch:(url,init)=>(/kompass_english_(?:test_window|access_window)$/.test(url))?Promise.resolve(response({open:true,test_date:'2026-10-23'})):url.endsWith('kompass_english_test_catalog')?Promise.resolve(response({ok:true,open:true,tests:testCatalog})):fetch(url,init),
    setInterval(){},setTimeout,clearTimeout,confirm:()=>true,alert(){},prompt:()=>null,
    addEventListener(){},
    VOCAB:{'16':{unit:4,number:16,title:'shop – now',words:Array.from({length:23},(_,n)=>['word'+n,'Wort'+n])},'17':{unit:4,number:17,title:'way – by (bike)',words:Array.from({length:50},(_,n)=>['word'+n,'Wort'+n])},u1:{unit:1,number:1,title:'School',words:Array.from({length:10},(_,n)=>['word'+n,'Wort'+n])}}
  };
  let currentHash=hash;Object.defineProperty(c.location,'hash',{get:()=>currentHash,set:v=>currentHash=v&&!v.startsWith('#')?'#'+v:v});
  c.window = c;
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root,'kompass-link.js'),'utf8')+'\nglobalThis.link=PracticeLink;',c);
  vm.runInContext(fs.readFileSync(path.join(root,'answer-check.js'),'utf8'),c);
  vm.runInContext(fs.readFileSync(path.join(root,'vocab-test.js'),'utf8'),c);
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
test('the protected test area shows only tests with their exact competency',async()=>{
 const c=setup(async()=>response({ok:true,first_name:'Alex'}));await c.link.connect(code);await c.link.login('123456');c.link.confirm();await vm.runInContext('assessments()',c);const html=c.document.querySelector().innerHTML;
 assert.match(html,/Vocabulary Test 1/);assert.match(html,/Vocabulary Test 2/);
 assert.match(html,/Aufgabe 2a/);assert.match(html,/Aufgabe 3a/);
 assert.match(html,/shop – now/);assert.match(html,/way – by/);
 assert.equal((html.match(/Zum Test/g)||[]).length,2);assert.match(html,/Orts- und Zeitangaben/);assert.match(html,/Wortschatz-Teilnachweis/);assert.ok(!html.includes('Vocabulary lists'));assert.ok(!html.includes('Coming soon'));
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

test('closed hours hide the entire catalog including direct test links',async()=>{
 const c=setup(async()=>response({ok:true,first_name:'Alex'}));let catalogs=0;
 c.fetch=async url=>{if(url.endsWith('test_catalog'))catalogs++;return response({open:false,reason:'school_closed',message:'Herbstferien: Testbereich geschlossen.'})};
 await vm.runInContext('assessments()',c);
 assert.match(c.document.querySelector().innerHTML,/Herbstferien/);assert.ok(!c.document.querySelector().innerHTML.includes('Vocabulary Test 1'));
 await vm.runInContext("assessmentOptions('u4-test-1')",c);
 assert.match(c.document.querySelector().innerHTML,/Herbstferien/);assert.ok(!c.document.querySelector().innerHTML.includes('Test starten'));assert.equal(catalogs,0);
});
test('opening hours alone do not reveal tests without confirmed QR and PIN',async()=>{
 const c=setup(async()=>response({}));await vm.runInContext('assessments()',c);
 const html=c.document.querySelector().innerHTML;assert.match(html,/persönlichen QR-Code/);assert.ok(!html.includes('Vocabulary Test 1'));
});
test('the closing timer uses server duration and removes an unfinished test',async()=>{
 const c=setup(async()=>response({ok:true,first_name:'Alex'}));await c.link.connect(code);await c.link.login('123456');c.link.confirm();
 c.location.hash='#assessment-u4-test-1';await vm.runInContext("startAssessment('u4-test-1')",c);
 const timers=[];c.setTimeout=(fn,ms)=>{timers.push({fn,ms});return {unref(){}}};
 vm.runInContext("Date.now=()=>0;armTestGate({open:true,server_now:'2026-10-23T10:29:50Z',closes_at:'2026-10-23T10:30:00Z'})",c);
 assert.equal(timers[0].ms,10000);timers[0].fn();
 assert.equal(c.link.attempt.status,'failed');assert.equal(c.link.pending.length,0);assert.match(c.document.querySelector().innerHTML,/12:30/);assert.ok(!c.document.querySelector().innerHTML.includes('Englische Übersetzung'));
});
test('a closing test timer does not interrupt practice after leaving the area',()=>{
 const c=setup(async()=>response({}));vm.runInContext("current='u1';start('de-en')",c);c.location.hash='#list-u1';const html=c.document.querySelector().innerHTML;
 vm.runInContext("closeTestArea('closed')",c);assert.equal(c.document.querySelector().innerHTML,html);assert.equal(vm.runInContext('mode',c),'de-en');
});

const supplementary=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/unit4-checks.json'),'utf8')).map(t=>({...t,competency_id:t.competency,competency_text:'Rasterkompetenz '+t.competency,competency_area:t.kind==='reading'?'Verstehen – Leseverstehen':t.kind==='listening'?'Verstehen – Hörverstehen':'Lehrkraftbewertung'}));
async function authenticate(c){await c.link.connect(code);await c.link.login('123456');c.link.confirm()}
test('supplementary reading check submits once to its own competency without revealing solutions',async()=>{
 const submissions=[];const c=setup(async(url,init)=>{if(url.endsWith('resolve_code_v2'))return response({ok:true,first_name:'Alex'});submissions.push(JSON.parse(init.body));return response({saved:true})},'',supplementary);
 await authenticate(c);await vm.runInContext("startAssessment('u4-reading')",c);
 assert.match(c.document.querySelector().innerHTML,/Leseverstehen/);assert.ok(!c.document.querySelector().innerHTML.includes('Answer:'));
 for(let n=0;n<4;n++)vm.runInContext('answerCompetencyQuestion(i,deck[i].answer)',c);
 await tick();await tick();vm.runInContext('finish()',c);await tick();
 assert.equal(submissions.length,1);assert.equal(submissions[0].p_task_key,'assessment:lwl-u4-reading');assert.equal(submissions[0].p_points,4);assert.equal(submissions[0].p_max_points,4);
});
test('listening hides transcripts, requires hearing audio and allows at most two plays per question',async()=>{
 const spoken=[];const c=setup(async()=>response({ok:true,first_name:'Alex'}),'',supplementary);
 c.SpeechSynthesisUtterance=function(text){this.text=text};c.speechSynthesis={cancel(){},speak:u=>spoken.push(u)};
 await authenticate(c);await vm.runInContext("startAssessment('u4-listening')",c);
 const transcript=vm.runInContext('deck[0].text',c);assert.ok(!c.document.querySelector().innerHTML.includes(transcript));
 vm.runInContext('answerCompetencyQuestion(0,0)',c);assert.equal(vm.runInContext('i',c),0);
 vm.runInContext('playCompetencyAudio()',c);assert.equal(spoken[0].text,transcript);spoken[0].onend();
 vm.runInContext('playCompetencyAudio()',c);spoken[1].onend();vm.runInContext('playCompetencyAudio()',c);assert.equal(spoken.length,2);
 vm.runInContext('answerCompetencyQuestion(i,deck[i].answer)',c);assert.equal(vm.runInContext('i',c),1);
 spoken[0].onend();assert.equal(vm.runInContext('assessmentAudio.heard',c),false);
});
test('teacher-led speaking and mediation tasks never invent an automatic score',async()=>{
 const submissions=[];const c=setup(async(url,init)=>{if(url.endsWith('resolve_code_v2'))return response({ok:true,first_name:'Alex'});submissions.push(JSON.parse(init.body));return response({saved:true})},'',supplementary);
 await authenticate(c);
 for(const id of ['u4-speaking','u4-mediation']){await vm.runInContext("startAssessment('"+id+"')",c);assert.match(c.document.querySelector().innerHTML,/Bewertung durch die Lehrkraft/);assert.match(c.document.querySelector().innerHTML,/Darauf achtet die Lehrkraft/);assert.equal(c.link.attempt,null)}
 assert.equal(submissions.length,0);
});
test('an unsupported audio device cannot start a listening attempt',async()=>{
 const c=setup(async()=>response({ok:true,first_name:'Alex'}),'',supplementary);await authenticate(c);await vm.runInContext("startAssessment('u4-listening')",c);
 assert.equal(c.link.attempt,null);assert.match(c.document.querySelector().innerHTML,/Hörtexte nicht abspielen/);
});

test('personal demo access is queried with PIN only after name confirmation',async()=>{
 const calls=[];const c=setup(async()=>response({ok:true,first_name:'Alex'}));
 c.fetch=async(url,init)=>{calls.push({url,payload:JSON.parse(init.body)});return response({open:true,demo_access:true,closes_at:'2026-10-25T23:00:00Z',server_now:'2026-10-23T20:00:00Z'})};
 await c.link.testWindow();assert.ok(calls[0].url.endsWith('test_window'));assert.equal(calls[0].payload.p_pin,undefined);
 c.link.token=code;c.link.pin='123456';c.link.active=true;
 await c.link.testWindow();assert.ok(calls[1].url.endsWith('access_window'));assert.equal(calls[1].payload.p_pin,'123456');assert.equal(c.link.windowInfo.demo_access,true);
 c.link.reset();assert.equal(c.link.windowInfo,null);
});
test('a late personal access response after logout cannot restore demo access',async()=>{
 let resolve;const c=setup(async()=>response({ok:true,first_name:'Alex'}));await authenticate(c);
 c.fetch=()=>new Promise(r=>resolve=r);const pending=c.link.testWindow();c.link.reset();resolve(response({open:true,demo_access:true}));
 assert.equal(await pending,null);assert.equal(c.link.windowInfo,null);
});

test('new vocabulary tests receive no answer key and use the server result only',async()=>{
 const task={...catalog[0],differentiated:true,sample_size:20,question_count:20,kind:'vocabulary'},sent=[];
 const summary={innerHTML:''};const c=setup(async(url,init)=>{
  if(url.endsWith('resolve_code_v2'))return response({ok:true,first_name:'Alex'});
  if(url.endsWith('start_vocab'))return response({ok:true,id:'issued-test',level:'E',test_date:'2026-10-24',max_points:50,items:Array.from({length:20},(_,n)=>({word_id:'word-'+n,prompt:n<15?'die Bushaltestelle':'Die Bushaltestelle ist neben dem Park.',kind:n<15?'de-en':'sentence',max_points:n<15?2:4}))});
  sent.push({url,body:JSON.parse(init.body)});return response({saved:true,points:35,max_points:50,needs_review:true,feedback:[]});
 },'',[task]);
 c.document.getElementById=id=>id==='ep-test-level'?{value:'E'}:id==='ans'?{value:'the bus stop'}:id==='ep-vocab-summary'?summary:null;
 await authenticate(c);await vm.runInContext("startAssessment('u4-test-1')",c);
 assert.equal(vm.runInContext('deck.length',c),20);assert.equal(vm.runInContext("deck.some(q=>'accepted' in q)",c),false);
 vm.runInContext("AnswerCheck.word=()=>{throw new Error('Test must be marked on server')};for(let n=0;n<20;n++)VocabTest.answer(false)",c);
 await tick();await tick();assert.equal(sent.length,1);assert.ok(sent[0].url.endsWith('submit_vocab'));
 assert.equal(sent[0].body.p_answers.length,20);assert.equal(sent[0].body.p_answers[0].points,undefined);assert.equal(sent[0].body.p_points,undefined);
 assert.equal(c.link.attempt.status,'saved');assert.match(summary.innerHTML,/35\/50/);assert.match(summary.innerHTML,/Vorläufig/);
});
test('home exposes a prominent test destination before the illustration',()=>{
 const c=setup(async()=>response({}));const html=c.document.querySelector().innerHTML;
 assert.ok(html.includes('entry-switch'));assert.ok(html.indexOf('Zum Testbereich')<html.indexOf('hero home-hero'));
});
