/* Shared live quiz UI. Hosting requires an authenticated teacher RPC. */
const LiveQuiz={
 epoch:0,host:false,game:null,secret:null,state:null,timer:null,clock:null,busy:false,error:'',offset:0,
 esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))},
 async rpc(action,data={}){
  const args={p_action:action,p_game:this.game,p_secret:this.secret,p_data:data};
  if(this.host){const r=await Auth.cloudClient.rpc('kompass_english_quiz',args);if(r.error)throw r.error;return r.data}
  return PracticeLink.rpc('kompass_english_quiz',args);
 },
 mount(){let el=document.getElementById('live-quiz');if(!el){el=document.createElement('dialog');el.id='live-quiz';el.setAttribute('aria-label','English Practice Live-Quiz');document.body.appendChild(el)}if(!el.open)el.showModal();el.oncancel=e=>{e.preventDefault();this.close()};return el},
 close(){this.epoch++;clearInterval(this.timer);clearInterval(this.clock);this.timer=null;this.clock=null;document.getElementById('live-quiz')?.remove();},
 shell(body){this.mount().innerHTML=`<div class="lq-top"><span>ENGLISH PRACTICE · LIVE</span><button onclick="LiveQuiz.close()" aria-label="Quizansicht schließen">×</button></div>${body}<p class="lq-error" role="status">${this.esc(this.error)}</p>`},
 async setup(force=false,listKey=null){
  if(!EnglishPractice.userKey())return;this.close();this.host=true;this.secret=null;this.game=null;this.error='';
  if(!force){try{const saved=sessionStorage.getItem('kompass-live-'+EnglishPractice.userKey());if(saved){this.game=saved;this.state=await this.rpc('state');this.paint();this.poll();return}}catch(_){}this.game=null}
  this.shell('<h1>Live-Quiz</h1><p>Vokabellisten laden …</p>');
  try{const res=await fetch('quiz-vocabulary.json?v=20261106');if(!res.ok)throw Error('Vokabellisten konnten nicht geladen werden.');this.vocab=await res.json();
   this.shell(`<h1>Live-Quiz starten</h1><p>15 Fragen · jeweils 20 Sekunden · vier Antworten</p><p>Wähle eine oder mehrere Vokabellisten.</p><div class="lq-lists">${Object.entries(this.vocab).filter(([,v])=>!v.assessmentOnly).sort((a,b)=>a[1].unit-b[1].unit||Number(a[1].number||a[0])-Number(b[1].number||b[0])).map(([k,v])=>`<label><input type="checkbox" value="${this.esc(k)}" ${String(k)===String(listKey)?'checked':''}> Unit ${v.unit} · Liste ${this.esc(v.number||k)} · ${this.esc(v.title)}</label>`).join('')}</div><p><label>Richtung <select id="lq-direction"><option value="mixed">Gemischt</option><option value="de">Deutsch → Englisch</option><option value="en">Englisch → Deutsch</option></select></label></p><button class="lq-primary" onclick="LiveQuiz.create()">Lobby mit QR-Code öffnen</button>`);
  }catch(e){this.error=e.message;this.shell('<h1>Live-Quiz</h1>')}
 },
 shuffle(a){return [...a].map(v=>({v,n:crypto.getRandomValues(new Uint32Array(1))[0]})).sort((a,b)=>a.n-b.n).map(x=>x.v)},
 buildQuestions(words,direction){
  const clean=s=>s.toLowerCase().replace(/\([^)]*\)/g,'').replace(/^(to |der |die |das |the |a |an )/,'').trim();
  const overlap=(a,b)=>a.split(/[;/]/).some(x=>b.split(/[;/]/).some(y=>clean(x)===clean(y)));
  const candidates=[];
  for(const side of (direction==='mixed'?[0,1]:[direction==='de'?1:0])){
   for(const w of words){
    // Exclude ambiguous prompts and synonym distractors.
    const targets=words.filter(x=>overlap(x[side],w[side])).map(x=>x[1-side]);
    const distractors=this.shuffle([...new Set(words.map(x=>x[1-side]))]).filter(x=>!targets.some(t=>overlap(x,t))).slice(0,3);
    if(distractors.length!==3)continue;
    const options=this.shuffle([w[1-side],...distractors]);
    candidates.push({prompt:w[side],options,answer:options.indexOf(w[1-side])});
   }
  }
  const unique=[...new Map(candidates.map(q=>[q.prompt,q])).values()];
  if(unique.length<15)throw Error('Diese Auswahl enthält zu wenige eindeutige Fragen. Bitte eine weitere Liste wählen oder die Richtung „Gemischt“ verwenden.');
  return this.shuffle(unique).slice(0,15);
 },
 async create(){if(this.busy)return;this.busy=true;try{
  const keys=[...document.querySelectorAll('.lq-lists input:checked')].map(x=>x.value);if(!keys.length)throw Error('Bitte mindestens eine Liste auswählen.');
  const words=keys.flatMap(k=>this.vocab[k].words),questions=this.buildQuestions(words,document.getElementById('lq-direction').value);
  this.state=await this.rpc('create',{title:keys.map(k=>`Unit ${this.vocab[k].unit} · Liste ${this.vocab[k].number||k}`).join(', '),questions});this.game=this.state.id;sessionStorage.setItem('kompass-live-'+EnglishPractice.userKey(),this.game);this.error='';this.paint();this.poll();
 }catch(e){this.error=e.message;const el=document.querySelector('.lq-error');if(el)el.textContent=this.error}finally{this.busy=false}},
 openList(listKey){
  this.close();this.error='';const list=VOCAB[listKey];if(!list)return;
  const teacherUrl='https://julianeschoene-ops.github.io/kompass/?quizList='+encodeURIComponent(listKey);
  this.shell(`<h1>Live-Quiz · Liste ${this.esc(list.number||listKey)}</h1><p>${this.esc(list.title)} · 15 Fragen</p><p>Deine Lehrkraft startet das Quiz. Scanne anschließend den QR-Code am Beamer oder öffne den Quiz-Link.</p><button class="lq-primary" onclick="LiveQuiz.openJoin()">Live-Quiz beitreten</button><p><a href="${teacherUrl}" target="_blank" rel="noopener">Als Lehrkraft mit dieser Liste starten →</a></p>`);
 },
 teacherEntry(){
  const key=new URLSearchParams(location.search).get('quizList');if(!key)return;
  const wait=setInterval(()=>{
   if(typeof EnglishPractice==='undefined'||typeof Auth==='undefined'||!Auth.currentUser())return;
   clearInterval(wait);const u=new URL(location.href);u.searchParams.delete('quizList');history.replaceState(null,'',u.pathname+u.search+u.hash);
   if(!EnglishPractice.userKey()){alert('Bitte mit einem Lehrkraftkonto in KOMPASS anmelden.');return}
   this.setup(true,key);
  },500);
 },
 openJoin(){this.close();this.host=false;this.game=null;this.secret=null;this.state=null;this.error='';this.shell('<h1>Live-Quiz beitreten</h1><p>Scanne den QR-Code am Beamer oder füge den Quiz-Link ein.</p><form onsubmit="event.preventDefault();LiveQuiz.fromInput()"><label>Quiz-Link <input id="lq-link" type="text" required></label><button class="lq-primary">Beitreten</button></form>')},
 fromInput(){const raw=document.getElementById('lq-link').value;const id=raw.match(/(?:live=)?([a-f0-9]{8}-[a-f0-9-]{27,})/i)?.[1];if(!id){document.querySelector('.lq-error').textContent='Bitte den vollständigen Quiz-Link einfügen.';return}location.hash='live='+id;this.joinPage(id)},
 async joinPage(id){this.close();this.host=false;this.game=id;this.secret=null;this.error='';this.state=null;
  try{const saved=JSON.parse(sessionStorage.getItem('ep-live-quiz')||'null');if(saved?.game===id)this.secret=saved.secret}catch(_){}
  await this.refresh();this.poll();
 },
 async join(mode){if(this.busy)return;this.busy=true;try{
  if(mode==='personal'&&!PracticeLink.active){PracticeLink.enterCode();this.close();return}
  const d={mode};if(mode==='personal'){PracticeLink.touch();if(!PracticeLink.active)throw Error('Bitte erneut anmelden.');d.token=PracticeLink.token;d.pin=PracticeLink.pin}
  this.state=await this.rpc('join',d);this.secret=this.state.me.secret;sessionStorage.setItem('ep-live-quiz',JSON.stringify({game:this.game,secret:this.secret}));this.error='';this.paint();
 }catch(e){this.error=e.message;this.paint()}finally{this.busy=false}},
 poll(){clearInterval(this.timer);clearInterval(this.clock);this.timer=setInterval(()=>this.refresh(),2000);this.clock=setInterval(()=>this.tick(),250)},
 async refresh(){if(this.busy)return;const epoch=this.epoch;this.busy=true;try{const state=await this.rpc('state');if(epoch!==this.epoch)return;this.state=state;this.offset=Date.parse(this.state.serverTime)-Date.now();this.error='';this.paint()}catch(e){if(epoch!==this.epoch)return;this.error=e.message;if(this.state)this.paint();else this.shell('<h1>Live-Quiz</h1><p>Quiz konnte nicht geladen werden.</p>')}finally{this.busy=false}},
 async action(action,data={}){if(this.busy)return;this.busy=true;try{this.state=await this.rpc(action,data);this.error='';this.paint()}catch(e){this.error=e.message;this.paint()}finally{this.busy=false}},
 tick(){const el=document.getElementById('lq-time');if(!el||!this.state)return;const n=Math.max(0,Math.ceil((Date.parse(this.state.deadline)-Date.now()-this.offset)/1000));el.textContent=n+' s';if(n===0)document.querySelectorAll('.lq-answer').forEach(b=>b.disabled=true)},
 paint(){const s=this.state;if(!s)return;const e=x=>this.esc(x),me=s.me;let body=`<h1>${e(s.title)}</h1>`;
  if(!this.host&&!me){body+=`<p>${s.phase==='lobby'?'Wähle, wie du mitspielen möchtest.':'Dieses Quiz läuft bereits. Beitreten ist nur in der Lobby möglich.'}</p>${s.phase==='lobby'?`<button class="lq-primary" onclick="LiveQuiz.join('guest')">Im Übungsmodus mitspielen</button> <button onclick="LiveQuiz.join('personal')">${PracticeLink.active?'Mit meinem persönlichen Code mitspielen':'Mit Code und Symbol anmelden'}</button>`:''}`;this.shell(body);return}
  body+=`<p>${this.host?'Spielleitung':e(me.alias)+(me.personal?' · persönlicher Zugang':' · Übungsmodus')} · ${s.count} dabei</p>`;
  if(s.phase==='lobby'){
   if(this.host){const url='https://julianeschoene-ops.github.io/Schedule/#live='+this.game;const qr=qrcode(0,'M');qr.addData(url);qr.make();body+=`<div class="lq-qr">${qr.createSvgTag(5,4)}</div><p><a href="${url}" target="_blank" rel="noopener">${e(url)}</a></p><p>QR-Code scannen · Spielmodus wählen · auf den Start warten</p><button class="lq-primary" onclick="LiveQuiz.action('start')" ${s.count?'':'disabled'}>15 Fragen starten</button>`}
   else body+='<h2>Du bist dabei!</h2><p>Warte, bis deine Lehrkraft das Quiz startet.</p>';
  }else if(s.phase==='finished'){body+='<h2>Quiz beendet</h2>'+(!this.host?`<p>Dein Ergebnis: <b>${me.score} Punkte</b></p>`:'')+'<p>Die Punkte gehören zu diesem Spiel. Das Quiz ist kein bewerteter Test.</p>'+(this.host?'<button class="lq-primary" onclick="LiveQuiz.setup(true)">Neues Quiz</button>':'')}
  else{
   const q=s.q;body+=`<div class="lq-question"><span>Frage ${s.question+1} / 15</span><strong id="lq-time"></strong><h2>${e(q.prompt)}</h2></div><div class="lq-answers">${q.options.map((o,n)=>`<button class="lq-answer ${s.phase==='reveal'&&n===q.answer?'lq-correct':''} ${me?.choice===n?'lq-picked':''}" ${this.host||s.phase!=='question'||me?.choice!=null?'disabled':''} onclick="LiveQuiz.action('answer',{question:${s.question},choice:${n}})"><span>${'ABCD'[n]}</span> ${e(o)}</button>`).join('')}</div><p>${s.answered} / ${s.count} Antworten${me?.choice!=null?' · Deine Antwort ist gespeichert.':''}</p>`;
   if(s.phase==='reveal')body+=`<p>Richtig: <b>${e(q.options[q.answer])}</b>${me?' · Dein Punktestand: '+me.score:''}</p>`;
   if(this.host)body+=s.phase==='question'?'<button class="lq-primary" onclick="LiveQuiz.action(\'reveal\')">Antworten auflösen</button>':`<button class="lq-primary" onclick="LiveQuiz.action('next')">${s.question===14?'Endergebnis anzeigen':'Nächste Frage'}</button>`;
  }
  if(s.leaders?.length)body+=`<ol class="lq-leaders">${s.leaders.map(p=>`<li ${me?.id===p.id?'class="lq-self"':''}>${e(p.alias)} <b>${p.score} P.</b></li>`).join('')}</ol>`;
  if(this.host&&s.phase!=='finished')body+='<p><button onclick="if(confirm(\'Dieses Quiz beenden?\'))LiveQuiz.action(\'finish\')">Quiz beenden</button></p>';
  this.shell(body);this.tick();
 }
};
