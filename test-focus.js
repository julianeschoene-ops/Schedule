/* Browser visibility reports are interruptions, never evidence of cheating. */
const TestFocus={
 id:null,count:0,paused:false,
 get running(){return this.id===PracticeLink.attempt?.id&&PracticeLink.attempt?.status==='started'&&mode==='assessment'&&isTestRoute()},
 start(id){this.stop();this.id=id;this.count=0},
 stop(){this.id=null;this.paused=false;this.count=0;const overlay=document.getElementById('test-pause');if(overlay)overlay.remove();if(typeof app!=='undefined')app.inert=false},
 snapshot(){return {count:this.id===PracticeLink.attempt?.id?this.count:0}},
 leave(){if(!this.running||this.paused)return;this.paused=true;this.count++;if(typeof pauseAssessmentAudio==='function')pauseAssessmentAudio();this.show()},
 show(){if(!this.paused||!this.running)return;if(typeof app!=='undefined')app.inert=true;if(document.getElementById('test-pause'))return;const panel=document.createElement('div');panel.id='test-pause';panel.className='test-pause';panel.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="test-pause-title"><h1 id="test-pause-title">Dein Test pausiert</h1><p>Du hast die Testseite verlassen. Bleibe während des Tests auf dieser Seite.</p><p>Deine Antworten bleiben erhalten. Die Unterbrechung wird beim Ergebnis vermerkt.</p><button class="btn" onclick="TestFocus.resume()">Test fortsetzen</button></section>';document.body.appendChild(panel);panel.querySelector('button').focus()},
 async resume(){if(!this.paused||!this.running){this.stop();return}const id=this.id,generation=PracticeLink.generation;const info=await PracticeLink.testWindow();if(id!==this.id||generation!==PracticeLink.generation)return;if(!info?.open){this.stop();closeTestArea(info?.message||'Die Testzeit konnte nicht geprüft werden. Bitte den Testbereich erneut öffnen.');return}this.paused=false;document.getElementById('test-pause')?.remove();app.inert=false;if(activeAssessment?.kind==='listening')renderQ();document.getElementById('ans')?.focus()}
};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')TestFocus.leave();else TestFocus.show()});
window.addEventListener('blur',()=>TestFocus.leave());
window.addEventListener('focus',()=>TestFocus.show());
