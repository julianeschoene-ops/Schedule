/* Personal, session-only connection. No child roster or teacher credentials. */
const PracticeLink = {
  url: 'https://gexhcpyzwzybrpuygqmf.supabase.co/rest/v1/rpc/',
  key: 'sb_publishable_U7Dp3SXHADswPjg4Vj7mzw_kG27owvK',
  storageKey: 'ep-kompass-session', idleMs: 30 * 60 * 1000,
  token: null, pin: null, waitingPending: [], candidate: null, name: '', active: false, last: 0,
  pending: [], attempt: null, state: 'guest', message: '', flushing: false, generation: 0,
  retiredPractice: false,
  initialCode: new URLSearchParams(location.hash.slice(1)).get('code'),
  capture() {
    if (this.initialCode !== null) history.replaceState(null, '', location.pathname + location.search);
  },
  escape(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  persist() {
    try {
      const code = this.token || this.candidate;
      if (!code) return sessionStorage.removeItem(this.storageKey);
      sessionStorage.setItem(this.storageKey, JSON.stringify({token:code,last:this.last,pending:this.token ? this.pending : this.waitingPending}));
    } catch (_) { /* Current tab still works if session storage is unavailable. */ }
  },
  async rpc(name, payload) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    try {
      const r = await fetch(this.url + name, {method:'POST',cache:'no-store',referrerPolicy:'no-referrer',
        headers:{'Content-Type':'application/json',apikey:this.key},body:JSON.stringify(payload),signal:controller.signal});
      const data = await r.json();
      if (!r.ok) {
        const e = new Error(data.message || 'Verbindung fehlgeschlagen.');
        e.status = r.status; e.code = data.code; throw e;
      }
      return data;
    } finally { clearTimeout(timer); }
  },
  reset() {
    if(typeof TestFocus!=='undefined')TestFocus.stop();
    this.generation++; this.token = null; this.pin = null; this.waitingPending = []; this.candidate = null; this.name = ''; this.active = false;
    this.pending = []; this.attempt = null; this.windowInfo = null; this.state = 'guest'; this.message = ''; this.retiredPractice = false;
    try { sessionStorage.removeItem(this.storageKey); } catch (_) {}
    if(typeof TestHistory!=='undefined')TestHistory.reset();
    if (typeof clearAssessmentAccess === 'function') clearAssessmentAccess();
    this.paint();
  },
  touch() {
    if (this.token && Date.now() - this.last > this.idleMs) {
      this.reset();
      if (typeof clearPracticeData === 'function') clearPracticeData();
      return;
    }
    if (this.token) { this.last = Date.now(); this.persist(); }
  },
  async boot() {
    let stored = null;
    try { stored = JSON.parse(sessionStorage.getItem(this.storageKey) || 'null'); } catch (_) {}
    const code = this.initialCode;
    this.initialCode = null;
    if (code !== null) {
      this.reset();
      if (typeof clearPracticeData === 'function') clearPracticeData();
      return this.connect(code);
    }
    if (stored?.token && Date.now() - Number(stored.last) < this.idleMs) {
      return this.connect(stored.token, stored.pending);
    }
    this.reset();
  },
  async connect(raw, pending = []) {
    let code = String(raw || '').trim();
    if (code.includes('#code=')) code = code.split('#code=')[1].split('&')[0];
    this.reset();
    if (!/^[a-f0-9]{64}$/.test(code)) {
      this.state = 'error'; this.message = 'Dieser QR-Code ist ungültig. Bitte deinen persönlichen QR-Code scannen.';
      return this.paint();
    }
    this.retiredPractice = Array.isArray(pending) && pending.some(p => p?.p_token === code && !/^(?:vocab|assessment):lwl-/.test(p.p_task_key || ''));
    this.candidate = code; this.state = 'pin'; this.last = Date.now();
    this.waitingPending = Array.isArray(pending) ? pending.filter(p => p?.p_token === code && /^(?:vocab|assessment):lwl-/.test(p.p_task_key || '')).slice(-30) : [];
    this.persist(); this.paint();
  },
  async login(pinValue) {
    const code = this.candidate;
    const pin = String(pinValue ?? document.getElementById('practice-pin')?.value ?? '').trim();
    if (!code || !/^[0-9]{6}$/.test(pin)) {
      this.message = 'Bitte deine sechsstellige PIN eingeben.'; this.paint(); return;
    }
    const generation = this.generation;
    this.state = 'checking'; this.message = ''; this.paint();
    try {
      const data = await this.rpc('kompass_english_resolve_code_v2', {p_token:code,p_pin:pin});
      if (generation !== this.generation) return;
      if (!data.ok) {
        this.state = 'pin'; this.message = data.message || 'QR-Code oder PIN ungültig.'; this.paint(); return;
      }
      this.token = code; this.pin = pin; this.name = data.first_name; this.last = Date.now();
      this.pending = this.waitingPending || []; this.waitingPending = [];
      this.state = 'confirm'; this.persist(); this.paint();
    } catch (e) {
      if (generation !== this.generation) return;
      this.state = 'pin';
      this.message = 'Deine PIN konnte gerade nicht geprüft werden. Bitte die Verbindung prüfen und erneut versuchen.';
      this.paint();
    }
  },
  confirm() {
    if (this.state !== 'confirm' || !this.token) return;
    this.active = true; this.state = 'active'; this.last = Date.now(); this.persist();
    this.paint(); this.flush();
    if(location.hash==='#test-history'&&typeof TestHistory!=='undefined')TestHistory.open();
    else if(location.hash.startsWith('#test-result-')&&typeof TestHistory!=='undefined')TestHistory.detail(location.hash.slice(13));
    else if (location.hash.startsWith('#assessment-') && typeof assessmentOptions === 'function') assessmentOptions(location.hash.slice(12));
    else if (location.hash === '#tests' && typeof assessments === 'function') assessments();
  },
  enterCode() {
    if (this.active && !confirm('Mit einem anderen Übungscode fortfahren? Bitte zuerst alle Testergebnisse übertragen.')) return;
    const code = prompt('Persönlichen Übungslink eingeben. Alternativ deinen QR-Code scannen:');
    if (code !== null) { if (typeof clearPracticeData === 'function') clearPracticeData(); this.connect(code); }
  },
  markup() {
    const button = '<button class="btn secondary" onclick="PracticeLink.enterCode()">Übungslink eingeben</button>';
    if (this.state === 'pin') return `<div class="practice-link"><form onsubmit="event.preventDefault();PracticeLink.login()"><label for="practice-pin"><b>Deine persönliche PIN</b></label><p>Gib die sechs Ziffern von deiner Zugangskarte ein.</p><input id="practice-pin" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" aria-describedby="practice-pin-error" style="width:160px;font-size:1.2rem;padding:10px;border:1px solid #d4bfc3;border-radius:8px"><button class="btn" type="submit">Anmelden</button><p id="practice-pin-error" role="status">${this.escape(this.message)}</p></form><button class="btn secondary" onclick="PracticeLink.reset()">Ohne Anmeldung üben</button></div>`;
    if (this.state === 'checking') return '<div class="practice-link" role="status">Dein Übungscode wird geprüft …</div>';
    if (this.state === 'confirm') return `<div class="practice-link"><b>Hallo ${this.escape(this.name)}! Bist du das?</b><p></p><button class="btn" onclick="PracticeLink.confirm()">Ja, das bin ich</button> <button class="btn secondary" onclick="PracticeLink.reset()">Das bin ich nicht</button></div>`;
    if (this.active) return `<div class="practice-link" role="status"><b>Hallo ${this.escape(this.name)}!</b> ${this.retiredPractice ? '<p>Die vorherige ausstehende Runde war ein Selbstcheck und wurde deshalb nicht als Test übernommen.</p>' : ''}${this.message ? `<p>${this.escape(this.message)}</p>` : ''}${this.pending.length ? `<p>${this.pending.length} Ergebnis(se) warten auf Übertragung. <button class="btn secondary" onclick="PracticeLink.flush()">Erneut senden</button></p>` : ''}</div>`;
    if (this.state === 'error') return `<div class="practice-link" role="status">${this.escape(this.message)} ${this.candidate ? '<button class="btn secondary" onclick="PracticeLink.connect(PracticeLink.candidate)">Erneut prüfen</button>' : ''} ${button}</div>`;
    return `<div class="practice-link"><span>Du kannst sofort üben. Für Tests melde dich mit deinem QR-Code an.</span> ${button}</div>`;
  },
  paint() {
    const target = document.getElementById('practice-connection');
    if (target) target.innerHTML = this.markup();
    const status = document.getElementById('ep-result-status');
    if (status) status.innerHTML = this.resultMarkup();
    if(typeof VocabTest!=='undefined')VocabTest.paint();
  },
  async testWindow() {
    try {
      const generation=this.generation,personal=Boolean(this.active&&this.token&&this.pin),token=this.token;
      const info = await this.rpc(personal?'kompass_english_access_window':'kompass_english_test_window',personal?{p_token:this.token,p_pin:this.pin}:{});
      if(generation!==this.generation||personal!==Boolean(this.active&&this.token&&this.pin)||(personal&&token!==this.token))return null;
      this.windowInfo = info;
      if (typeof armTestGate === 'function') armTestGate(info);
      return info;
    } catch (_) { return null; }
  },
  async canStartTest() {
    const info = await this.testWindow();
    if (!info) { alert('Die Testzeit konnte nicht geprüft werden. Bitte die Verbindung prüfen. Üben geht weiterhin.'); return false; }
    if (!info.open) { alert(info.message || 'Der Testbereich ist geschlossen. Üben kannst du jederzeit.'); return false; }
    return true;
  },
  beginTest(taskKey, topic) {
    this.touch();
    if (this.candidate && !this.active) {
      alert('Bitte zuerst oben deine PIN eingeben und deinen Namen bestätigen.'); return false;
    }
    if (!this.active && !confirm('Du übst ohne persönlichen Code. Dieser Test wird nicht an deine Lehrkraft übertragen. Trotzdem starten?')) return false;
    this.attempt = {id:crypto.randomUUID(),token:this.active ? this.token : null,taskKey,topic,testDate:this.windowInfo?.test_date,status:'started'};
    if(typeof TestFocus!=='undefined')TestFocus.start(this.attempt.id);
    return true;
  },
  finishTest(points, max) {
    const a = this.attempt;
    if (!a || a.status !== 'started') return;
    this.touch();
    if (this.attempt !== a) return;
    if (!a.token || !this.active || a.token !== this.token) { a.status = 'guest'; return; }
    a.status = 'pending';
    this.pending.push({p_token:a.token,p_attempt_id:a.id,p_task_key:a.taskKey,p_topic:a.topic,p_points:points,p_max_points:max,p_test_date:a.testDate,interruptions:typeof TestFocus!=='undefined'?TestFocus.snapshot():{count:0}});
    if(typeof TestFocus!=='undefined')TestFocus.stop();
    this.persist(); this.flush();
  },
  finishVocab(answers) {
    const a=this.attempt;if(!a||a.status!=='started')return;this.touch();if(this.attempt!==a||!this.active||a.token!==this.token)return;
    a.status='pending';
    this.pending.push({protocol:'vocab_lnw',p_token:a.token,p_attempt_id:a.id,p_task_key:a.taskKey,p_answers:answers,interruptions:typeof TestFocus!=='undefined'?TestFocus.snapshot():{count:0}});if(typeof TestFocus!=='undefined')TestFocus.stop();this.persist();this.flush();
  },
  resultMarkup() {
    const a = this.attempt;
    if (!a || a.status === 'guest' || !a.token) return 'Ohne persönlichen Code: Dieses Ergebnis wurde nicht an KOMPASS übertragen.';
    if (a.status === 'saved') return '✓ Dein Ergebnis ist gespeichert.'+(a.needsReview?' Eine Antwort wird noch geprüft.':'');
    if (a.status === 'failed') return this.escape(this.message || 'Dieses Ergebnis konnte nicht gespeichert werden. Bitte deine Lehrkraft fragen.');
    return 'Dein Ergebnis wartet auf Übertragung. Bitte diese Seite offen lassen. <button class="btn secondary" onclick="PracticeLink.flush()">Erneut senden</button>';
  },
  async flush() {
    if (this.flushing || !this.active || !this.token) return;
    this.touch();
    if (!this.active) return;
    this.flushing = true;
    const generation = this.generation, token = this.token;
    try {
      for (const payload of [...this.pending]) {
        if (generation !== this.generation || !this.active || payload.p_token !== token) break;
        try {
          const {interruptions,...submission}=payload;
          const r = payload.protocol==='vocab_lnw'?await this.rpc('kompass_english_submit_vocab',{p_token:payload.p_token,p_pin:this.pin,p_attempt_id:payload.p_attempt_id,p_answers:payload.p_answers}):await this.rpc('kompass_english_submit_result_v3', {...submission,p_pin:this.pin});
          if (generation !== this.generation) break;
          if (!r.saved) {
            if (r.window_closed || r.practice_only || r.update_required) {
              this.pending = this.pending.filter(p => p.p_attempt_id !== payload.p_attempt_id);
              if (this.attempt?.id === payload.p_attempt_id) { this.attempt.status = 'failed'; this.message = r.message; }
              this.persist(); this.paint(); continue;
            }
            if (this.attempt?.id === payload.p_attempt_id) this.attempt.status = 'failed';
            this.message = r.message || 'Speicherung nicht bestätigt.'; this.paint(); break;
          }
          if(interruptions?.count>0){const report=await this.rpc('kompass_english_report_interruptions',{p_token:token,p_pin:this.pin,p_attempt_id:payload.p_attempt_id,p_count:interruptions.count});if(generation!==this.generation)break;if(!report.ok)throw new Error(report.message||'Unterbrechungsvermerk konnte nicht gespeichert werden.');}
          this.pending = this.pending.filter(p => p.p_attempt_id !== payload.p_attempt_id);
          if (this.attempt?.id === payload.p_attempt_id){this.attempt.status = 'saved';if(r.needs_review!==undefined)this.attempt.needsReview=r.needs_review;if(payload.protocol==='vocab_lnw')this.attempt.outcome=r;}
          this.persist(); this.paint();
        } catch (e) {
          if (generation !== this.generation) break;
          if (e.status >= 400 && e.status < 500) {
            this.message = [401,403,404].includes(e.status) || e.code === 'PGRST202' ? 'Diese Seitenversion kann nicht mehr übertragen. Bitte Seite neu laden und QR-Code / PIN erneut öffnen.' : (e.message || 'Ergebnis abgelehnt. Bitte deine Lehrkraft fragen.');
            this.pending = this.pending.filter(p => p.p_attempt_id !== payload.p_attempt_id);
            if(this.attempt?.id === payload.p_attempt_id) this.attempt.status = 'failed';
            this.persist();
          }
          this.paint(); break;
        }
      }
    } finally { this.flushing = false; }
  },
  canEnd() {
    return !this.pending.length || confirm('Es warten noch Testergebnisse auf die Übertragung. Beim Beenden werden sie auf diesem Gerät gelöscht. Trotzdem beenden?');
  }
};
PracticeLink.capture();
document.addEventListener('click', () => PracticeLink.touch(), {passive:true});
document.addEventListener('keydown', () => PracticeLink.touch(), {passive:true});
window.addEventListener('online', () => PracticeLink.flush());
setInterval(() => {
  if (PracticeLink.token && Date.now() - PracticeLink.last > PracticeLink.idleMs) PracticeLink.reset();
}, 30000);
