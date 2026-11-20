/* Voluntary, pupil-reported practice. Never changes competency assessments. */
const PracticeJournal={
 baseStars:0,progressPromise:null,
 resetProgress(){this.baseStars=0;this.progressPromise=null},
 loadProgress(){
  const generation=PracticeLink.generation,id=this.payload().id;
  this.progressPromise=(async()=>{
   try{
    const r=await PracticeLink.rpc('kompass_english_practice_progress',{p_token:PracticeLink.token,p_pin:PracticeLink.pin,p_exclude_id:id});
    if(generation!==PracticeLink.generation||!PracticeLink.active||!r.ok)return;
    this.baseStars=Math.max(0,Number(r.stars)||0);
    const g=game();g.stars+=this.baseStars;localStorage.setItem('ep-game',JSON.stringify(g));
    document.querySelectorAll('.gamebar').forEach(el=>el.outerHTML=gameBadges());
    if(location.hash==='#practice-summary')this.render();
   }catch(_){/* The local practice remains usable while offline. */}
  })();
  return this.progressPromise;
 },
 state(){try{return JSON.parse(localStorage.getItem('ep-journal')||'null')||{id:crypto.randomUUID(),grammar:[]}}catch(_){return {id:crypto.randomUUID(),grammar:[]}}},
 activity(title,points,max){const s=this.state();s.grammar.push({title,points,max,at:new Date().toISOString()});s.grammar=s.grammar.slice(-100);localStorage.setItem('ep-journal',JSON.stringify(s))},
 grammar(key,points,max){const s=this.state();s.grammar.push({key,title:GRAMMAR[key].title,points,max,at:new Date().toISOString()});s.grammar=s.grammar.slice(-100);localStorage.setItem('ep-journal',JSON.stringify(s))},
 open(){if(!PracticeLink.canEnd())return;mode=null;if(typeof TestFocus!=='undefined')TestFocus.stop();location.hash='practice-summary';this.render()},
 payload(){const s=this.state();localStorage.setItem('ep-journal',JSON.stringify(s));const stars=Math.max(0,game().stars-this.baseStars);return {id:s.id,stars,starsTotal:game().stars,xp:stars*10,grammar:s.grammar,controls:Object.entries(LwlGuide.state()).map(([id,p])=>({id,title:LWL5_DATA.exercises[id]?.title||id,attempted:!!p.attempted,compared:!!p.compared,star:!!p.star,at:p.at,correct:(p.correctQuestions||[]).length})).slice(0,100)}},
 render(message=''){const p=this.payload();app.innerHTML=`<section class="question"><h1>Dein Übungsstand</h1>${gameBadges()}<p>⭐ ${p.starsTotal} Sterne · Level ${levelInfo(p.starsTotal).number}: ${levelInfo(p.starsTotal).name} · ${p.controls.filter(x=>x.compared).length} Aufgaben verglichen · ${p.controls.filter(x=>x.star).length} Kontrollsterne</p><p>Möchtest du deinem Lerncoach zeigen, was du geübt und kontrolliert hast?</p><div id="practice-connection">${PracticeLink.state==='guest'?'':PracticeLink.markup()}</div>${PracticeLink.active?`<p>Angemeldet als <b>${esc(PracticeLink.name)}</b>. Speichere den Übungsstand in KOMPASS.</p><button class="btn" onclick="PracticeJournal.send()">An KOMPASS übertragen</button>`:(['guest','error'].includes(PracticeLink.state)?`<button class="btn" onclick="PracticeJournal.login()">Mit Code und Symbol anmelden</button>`:'')}<p role="status">${esc(message)}</p><p class="small">Freiwilliger Übungsbericht – keine Kompetenzbewertung. Vergleiche sind deine eigenen Angaben.</p><div class="controls"><button class="btn secondary" onclick="endSession(true)">Ohne weitere Übertragung abmelden</button><button class="btn secondary" onclick="LwlGuide.overview()">Weiterüben</button></div></section>`},
 login(){PracticeLink.reset();PracticeLink.state='access';this.render()},
 async send(){if(!PracticeLink.active||this.sending)return this.render();this.sending=true;const generation=PracticeLink.generation;try{if(this.progressPromise)await this.progressPromise;if(generation!==PracticeLink.generation)return;const r=await PracticeLink.rpc('kompass_english_save_practice',{p_token:PracticeLink.token,p_pin:PracticeLink.pin,p_report:this.payload()});if(generation!==PracticeLink.generation)return;if(!r.ok)return this.render(r.message||'Nicht gespeichert.');this.render('✓ In KOMPASS gespeichert. Du kannst dich jetzt abmelden.')}catch(_){this.render('Die Übertragung hat nicht geklappt. Dein Übungsstand bleibt hier erhalten. Versuche es noch einmal.')}finally{this.sending=false}}
 ,async sendSilently(){
  if(!PracticeLink.active)return;
  // Send each complete snapshot in order, so an older request cannot overwrite a newer round.
  const generation=PracticeLink.generation;
  const previous=this.silentQueue||Promise.resolve();
  const task=previous.catch(()=>{}).then(async()=>{
   if(this.progressPromise)await this.progressPromise;
   if(generation!==PracticeLink.generation||!PracticeLink.active)return;
   const report=this.payload();
   const el=document.getElementById('grammar-save-status');if(el)el.textContent='Übungsstand wird an KOMPASS übertragen …';
   try{const r=await PracticeLink.rpc('kompass_english_save_practice',{p_token:PracticeLink.token,p_pin:PracticeLink.pin,p_report:report});if(generation!==PracticeLink.generation)return;const current=document.getElementById('grammar-save-status');if(current)current.textContent=r.ok?'✓ Übungsstand in KOMPASS gespeichert.':'Übertragung fehlgeschlagen. Beim Abmelden erneut senden.'}
   catch(_){if(generation===PracticeLink.generation){const current=document.getElementById('grammar-save-status');if(current)current.textContent='Übertragung fehlgeschlagen. Beim Abmelden erneut senden.'}}
  });
  this.silentQueue=task;return task;
 }
};
