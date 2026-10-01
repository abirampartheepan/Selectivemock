/* ==========================================================================
   Rendering and events
   ========================================================================== */
'use strict';

function render() {
  const views = { home: renderHome, exam: renderExam, player: renderPlayer, results: renderResults, review: renderResults,
    writing: renderWriting, writingResult: renderWritingResult, papers: renderPapers, mistakes: renderMistakes,
    progress: renderProgress, drills: renderDrills, backup: renderBackup };
  const v = views[S.view] || renderHome;
  app().innerHTML = v() + `<div id="toast" class="toast" role="status" aria-live="polite"></div>`;
  if (S.view === 'writing') {
    const ta = $('#essay');
    if (ta) {
      ta.value = S.essay;
      ta.addEventListener('input', () => {
        S.essay = ta.value;
        const n = wordsIn(S.essay) + ' words';
        const a = $('#wc'), b = $('#wc2'); if (a) a.textContent = n; if (b) b.textContent = n;
      });
      if (!S.essay) ta.focus();
    }
  }
  if (S.view === 'player') {
    const qp = $('#qpane'); if (qp) qp.scrollTop = 0;
    const sp = $('#scratch'); if (sp) { sp.value = S.scratch; sp.addEventListener('input', () => { S.scratch = sp.value; }); }
    const here = $('.gapmark.here'); if (here && here.scrollIntoView) here.scrollIntoView({ block: 'nearest' });
    enterQuestion();
  }
}
function go(view) {
  if (S.timerId && (S.view === 'player' || S.view === 'writing')) return;
  S.view = view; S.openMistake = null; render(); window.scrollTo(0, 0);
}
function leaveTest() {
  if (!confirm('Leave this test? Your answers so far will not be saved.')) return;
  stopTimer(); QUEUE = []; S.view = S.paper && S.paper.examId ? 'exam' : 'home'; render(); window.scrollTo(0, 0);
}
function openReview(id) {
  const a = DB.attempts.find(x => x.id === id);
  if (!a) return;
  S.reviewing = id; S.onlyWrong = false; S.openAll = false;
  S.paper = null;
  S.view = a.module === 'writing' ? 'writingResult' : 'review';
  render(); window.scrollTo(0, 0);
}
function attemptMissedRecords(a) { return (a.missed || []).map(m => m.rec).filter(Boolean); }

document.addEventListener('click', (ev) => {
  const goto = ev.target.closest('[data-goto]');
  const el = ev.target.closest('[data-act]');
  if (goto && S.view === 'player') { bankTime(); S.cur = parseInt(goto.dataset.goto, 10) - 1; render(); return; }
  if (!el) return;
  const a = el.dataset.act;
  if (a === 'closenav' && ev.target.closest('[data-stop]') && !ev.target.closest('button')) return;
  if (a === 'selMistake') { ev.preventDefault(); ev.stopPropagation(); const k = el.dataset.key; S.mistakeSel[k] = !S.mistakeSel[k]; render(); return; }
  if (el.tagName === 'DETAILS' || el.tagName === 'INPUT' || el.tagName === 'SELECT') {
    // handled by change/toggle listeners below
    return;
  }
  switch (a) {
    case 'theme': {
      const root = document.documentElement, now = root.getAttribute('data-theme');
      const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const nextT = now ? (now === 'dark' ? 'light' : null) : (sysDark ? 'light' : 'dark');
      if (nextT) root.setAttribute('data-theme', nextT); else root.removeAttribute('data-theme');
      try { localStorage.setItem('sel-theme', nextT || ''); } catch (e) { /* ignore */ }
      return;
    }
    case 'go': go(el.dataset.view); return;
    case 'home': stopTimer(); QUEUE = []; S.view = 'home'; render(); window.scrollTo(0, 0); return;
    case 'tier': S.tier = el.dataset.t; S.view = 'home'; render(); return;
    case 'openExam': S.examId = el.dataset.id; S.view = 'exam'; render(); window.scrollTo(0, 0); return;
    case 'startTest': QUEUE = []; startExamTest(el.dataset.id, el.dataset.mod); return;
    case 'startFull': startFullExam(el.dataset.id); return;
    case 'nextTest': { const m = QUEUE.shift(); if (m) startExamTest(S.paper.examId || S.examId, m); return; }
    case 'answer': {
      if (S.view !== 'player') return;
      const it = S.paper.items[S.cur], i = parseInt(el.dataset.i, 10);
      if (S.responses[it.n] === i) delete S.responses[it.n]; else S.responses[it.n] = i;
      render(); return;
    }
    case 'flag': { const n = S.paper.items[S.cur].n; S.flags[n] = !S.flags[n]; render(); return; }
    case 'nav': bankTime(); S.navOpen = true; render(); return;
    case 'closenav': S.navOpen = false; render(); return;
    case 'goto': bankTime(); S.cur = parseInt(el.dataset.n, 10) - 1; S.navOpen = false; render(); return;
    case 'prev': bankTime(); if (S.cur > 0) S.cur--; render(); return;
    case 'next': bankTime(); if (S.cur < S.paper.items.length - 1) S.cur++; render(); return;
    case 'finish': {
      const left = S.paper.items.length - Object.keys(S.responses).length;
      if (left && S.secsLeft > 0 && !S.countUp && !confirm(`You have ${left} unanswered question${left > 1 ? 's' : ''}. Finish anyway?`)) return;
      finish(); return;
    }
    case 'finishWriting': if (S.secsLeft > 60 && !confirm('Finish your writing now?')) return; finishWriting(); return;
    case 'pause': bankTime(); S.running = !S.running; render(); return;
    case 'scratch': bankTime(); S.scratchOpen = !S.scratchOpen; render(); return;
    case 'stim': S.stimOpen = !S.stimOpen; render(); return;
    case 'leave': leaveTest(); return;
    case 'review': openReview(el.dataset.id); return;
    case 'redoAttempt': { const at = DB.attempts.find(x => x.id === el.dataset.id); if (at) startRedo(attemptMissedRecords(at), 'Mistakes from ' + attemptTitle(at)); return; }
    case 'drill': startDrill(el.dataset.fam, parseInt(el.dataset.n || '8', 10)); return;
    case 'drillLevel': S.drillLevel = el.dataset.t; render(); return;
    case 'band': {
      const at = DB.attempts.find(x => x.id === S.reviewing); if (!at) return;
      at.bands = at.bands || {}; at.bands[el.dataset.crit] = parseInt(el.dataset.band, 10); saveDB(); render(); return;
    }
    case 'copyEssay': {
      const at = DB.attempts.find(x => x.id === S.reviewing);
      if (at && navigator.clipboard) navigator.clipboard.writeText(at.essay || '').then(() => toast('Copied.'), () => toast('Select the text and copy it instead.'));
      return;
    }
    case 'print': $$('details.rev').forEach(d => { d.open = true; }); setTimeout(() => window.print(), 50); return;
    case 'openAll': S.openAll = !S.openAll; $$('details.rev:not(.passage)').forEach(d => { d.open = S.openAll; }); return;
    case 'papersFilter': S.papersFilter = el.dataset.f; render(); return;
    case 'redoMistakes': {
      const F = S.mistakesFilter;
      const sel = Object.keys(S.mistakeSel).filter(k => S.mistakeSel[k]);
      let list = allMistakes().filter(x => (F.mastered || !isMastered(x.key)) && (F.module === 'all' || x.module === F.module) && (F.tier === 'all' || x.tier === F.tier) && (F.fam === 'all' || x.fam === F.fam));
      if (sel.length) list = list.filter(x => sel.includes(x.key)); else list = list.slice(0, 20);
      S.mistakeSel = {};
      startRedo(list.map(x => x.rec), 'Mistakes notebook'); return;
    }
    case 'redoOne': { const x = allMistakes().find(m => m.key === el.dataset.key); if (x) startRedo([x.rec], 'One question'); return; }
    case 'clearSel': S.mistakeSel = {}; render(); return;
    case 'export': exportBackup(); return;
    case 'resetAll':
      if (!confirm('Delete every saved paper, mistake and note in this browser? This cannot be undone.')) return;
      DB = { v: 3, attempts: [], notes: {}, mastery: {} }; saveDB(); render(); toast('All progress deleted.'); return;
  }
});

/* opening a mistake builds its question only when needed */
document.addEventListener('toggle', (ev) => {
  const d = ev.target;
  if (!(d instanceof HTMLElement) || d.dataset.act !== 'openMistake') return;
  if (d.open && S.openMistake !== d.dataset.key) {
    S.openMistake = d.dataset.key;
    const x = allMistakes().find(m => m.key === d.dataset.key);
    if (x) { const tmp = document.createElement('div'); tmp.innerHTML = renderMistakeRow(x); d.replaceWith(tmp.firstElementChild); }
  }
}, true);

document.addEventListener('change', (ev) => {
  const el = ev.target;
  const a = el.dataset && el.dataset.act;
  if (a === 'onlyWrong') { S.onlyWrong = el.checked; render(); return; }
  if (a === 'mf') { S.mistakesFilter[el.dataset.k] = el.value; render(); return; }
  if (a === 'mfMastered') { S.mistakesFilter.mastered = el.checked; render(); return; }
  if (a === 'import' && el.files && el.files[0]) { importBackup(el.files[0]); el.value = ''; }
});
document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.note != null) setNote(el.dataset.note, el.value);
});

document.addEventListener('keydown', (ev) => {
  if (ev.target && /^(TEXTAREA|INPUT|SELECT)$/.test(ev.target.tagName)) {
    if (ev.key === 'Escape' && S.scratchOpen) { S.scratchOpen = false; render(); }
    return;
  }
  if (S.view !== 'player') return;
  const it = S.paper.items[S.cur];
  const nopts = (it.optionSvgs || it.options || []).length;
  const k = ev.key.toUpperCase();
  const li = LETTERS.indexOf(k);
  if (li >= 0 && li < nopts && k.length === 1) { S.responses[it.n] = li; render(); ev.preventDefault(); return; }
  if (/^[1-7]$/.test(k)) { const i = parseInt(k, 10) - 1; if (i < nopts) { S.responses[it.n] = i; render(); ev.preventDefault(); } return; }
  if (ev.key === 'ArrowRight' && S.cur < S.paper.items.length - 1) { bankTime(); S.cur++; render(); ev.preventDefault(); }
  if (ev.key === 'ArrowLeft' && S.cur > 0) { bankTime(); S.cur--; render(); ev.preventDefault(); }
  if (k === 'M') { S.flags[it.n] = !S.flags[it.n]; render(); ev.preventDefault(); }
  if (ev.key === 'Escape') { if (S.navOpen) { S.navOpen = false; render(); } else if (S.scratchOpen) { S.scratchOpen = false; render(); } }
});
window.addEventListener('beforeunload', (ev) => {
  if ((S.view === 'player' || S.view === 'writing') && S.timerId) { ev.preventDefault(); ev.returnValue = ''; }
});

(function boot() {
  try { const t = localStorage.getItem('sel-theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) { /* ignore */ }
  loadDB();
  render();
})();
