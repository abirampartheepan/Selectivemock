/* ==========================================================================
   Sitting a test — player, navigator, timer, writing task
   ========================================================================== */
'use strict';

/* ---------- time spent on each question ---------- */
function bankTime() {
  if (S.enteredAt == null) return;
  const it = S.paper && S.paper.items[S.cur];
  if (it) { const dt = (Date.now() - S.enteredAt) / 1000; if (dt > 0.15 && dt < 3600) S.times[it.n] = (S.times[it.n] || 0) + dt; }
  S.enteredAt = null;
}
function enterQuestion() { if (S.enteredAt == null && S.running) S.enteredAt = Date.now(); }

function tick() {
  if (!S.running) return;
  if (S.countUp) S.secsUp++; else S.secsLeft--;
  const c = $('.clock');
  if (c) { c.textContent = S.countUp ? mmss(S.secsUp) : fmtClock(S.secsLeft); c.classList.toggle('warn', !S.countUp && S.secsLeft <= 300); }
  if (!S.countUp && S.secsLeft <= 0) {
    bankTime(); S.running = false;
    if (S.view === 'writing') finishWriting(); else if (S.view === 'player') finish();
  }
}
function startTimer(mins, countUp) {
  S.countUp = !!countUp; S.secsLeft = mins * 60; S.secsUp = 0; S.running = true;
  if (S.timerId) clearInterval(S.timerId);
  S.timerId = setInterval(tick, 1000);
}
function stopTimer() { bankTime(); S.running = false; if (S.timerId) clearInterval(S.timerId); S.timerId = null; }
function usedSeconds() {
  const p = S.paper; if (!p) return 0;
  return S.countUp ? S.secsUp : Math.max(0, p.spec.minutes * 60 - Math.max(0, S.secsLeft));
}
function resetSitting() {
  S.responses = {}; S.flags = {}; S.cur = 0; S.marked = null; S.navOpen = false; S.essay = ''; S.selfBands = {};
  S.times = {}; S.enteredAt = null; S.scratch = ''; S.scratchOpen = false; S.stimOpen = true; S.reviewing = null;
}

/* ---------- starting things ---------- */
function startExamTest(examId, module) {
  const p = buildExamModule(examId, module);
  if (!p) { toast('That test is not available yet.'); return; }
  S.paper = p; S.examId = examId;
  resetSitting();
  if (module === 'writing') { S.view = 'writing'; startTimer(SPEC.writing.minutes); }
  else { S.view = 'player'; startTimer(SPEC[module].minutes); }
  render(); window.scrollTo(0, 0);
}
function startFullExam(examId) {
  const mods = MODULE_ORDER.filter(m => examReady(examId, m));
  if (!mods.length) return;
  QUEUE = mods.slice(1);
  startExamTest(examId, mods[0]);
}
function startDrill(famKey, n) {
  const p = assembleDrill(famKey, S.drillLevel, n || 8, (Date.now() % 1e9) + 7);
  if (!p) return;
  QUEUE = []; S.paper = p; resetSitting(); S.view = 'player'; startTimer(p.spec.minutes, true);
  render(); window.scrollTo(0, 0);
}
/* Redo questions from saved records. Cloze and gapped texts are redone whole,
   because a passage with eight gaps and two questions makes no sense. */
function startRedo(records, label) {
  if (!records || !records.length) { toast('Nothing to redo here.'); return; }
  const out = [], seen = new Set();
  records.forEach(r => {
    if (r.kind === 'exam' && r.module === 'reading') {
      const p = buildExamModule(r.exam, 'reading');
      const it = p && p.items.find(x => x.n === r.n);
      const sec = it && p.sections[it.sectionIdx];
      if (sec && (sec.type === 's2' || sec.type === 's4')) {
        for (let n = sec.from; n <= sec.to; n++) { const rr = { kind: 'exam', exam: r.exam, module: 'reading', n }; const k = recKey(rr); if (!seen.has(k)) { seen.add(k); out.push(rr); } }
        return;
      }
    }
    const k = recKey(r); if (!seen.has(k)) { seen.add(k); out.push(r); }
  });
  const p = buildSet(out.slice(0, 40), { mode: 'redo', name: label || 'Redo', short: 'Redo', restTitle: label || 'Questions to redo' });
  if (!p) { toast('Those questions could not be rebuilt.'); return; }
  QUEUE = []; S.paper = p; resetSitting(); S.view = 'player'; startTimer(p.spec.minutes, true);
  render(); window.scrollTo(0, 0);
}

/* ---------- finishing ---------- */
function finish() {
  bankTime();
  const usedSec = usedSeconds();
  stopTimer();
  const p = S.paper;
  S.marked = mark(p, S.responses);
  S.view = 'results'; S.navOpen = false; S.scratchOpen = false;
  const missed = p.items.filter(it => S.responses[it.n] !== it.answer).map(it => ({ rec: recordOf(it, p), given: S.responses[it.n] == null ? null : S.responses[it.n], fam: it.fam, module: it.module || p.module, tag: it.tags && S.responses[it.n] != null ? it.tags[S.responses[it.n]] : null, slow: (S.times[it.n] || 0) > 2 * (p.spec.minutes * 60 / p.items.length) }));
  if (p.mode === 'redo') p.items.forEach(it => { const r = recordOf(it, p); if (r) recordRedo(recKey(r), S.responses[it.n] === it.answer); });
  const a = {
    id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(),
    kind: p.mode === 'exam' ? 'exam' : p.mode, exam: p.examId || null, tier: p.tier || p.level, module: p.mode === 'exam' ? p.module : (p.module || 'practice'),
    label: p.mode === 'exam' ? null : p.label || p.spec.name,
    responses: Object.assign({}, S.responses), flags: Object.assign({}, S.flags),
    times: p.items.map(it => Math.round(S.times[it.n] || 0)),
    correct: S.marked.correct, n: S.marked.n, pct: S.marked.pct,
    secondsUsed: Math.round(usedSec), minutes: p.spec.minutes, countUp: S.countUp,
    topics: S.marked.topics, missed,
    records: p.mode === 'exam' ? null : p.items.map(it => recordOf(it, p)),
  };
  addAttempt(a);
  S.reviewing = a.id;
  render(); window.scrollTo(0, 0);
}
function finishWriting() {
  const usedSec = usedSeconds();
  stopTimer();
  S.view = 'writingResult';
  const p = S.paper;
  const a = {
    id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(),
    kind: 'exam', exam: p.examId, tier: p.tier, module: 'writing',
    essay: S.essay, words: wordsIn(S.essay), bands: {}, promptTitle: p.prompt.title, genre: p.prompt.genre,
    secondsUsed: Math.round(usedSec), minutes: 30,
  };
  addAttempt(a);
  S.reviewing = a.id;
  render(); window.scrollTo(0, 0);
}

/* ==========================================================================
   Player
   ========================================================================== */
function renderPlayer() {
  const p = S.paper, it = p.items[S.cur];
  const sec = p.sections[it.sectionIdx] || p.sections[0];
  const answered = Object.keys(S.responses).length;
  const hasStim = !!(sec && sec.stimulus);
  const warn = !S.countUp && S.secsLeft <= 300;
  const sub = p.mode === 'exam' ? `${examLabel(p.examId)} · ${QUEUE.length ? 'full exam' : 'single test'}` : p.mode === 'redo' ? 'redoing questions' : `${TIERS[p.level].label} drill`;
  return `
  <div class="player">
    <div class="topbar">
      <div class="who"><b>${esc(p.spec.name)}</b><span>${esc(sub)}</span></div>
      <span class="counter">Question ${it.n} of ${p.items.length}</span>
      <div class="spacer"></div>
      <button class="btn flag" data-act="flag" aria-pressed="${!!S.flags[it.n]}">${S.flags[it.n] ? 'Flagged' : 'Flag'}</button>
      <button class="btn hide-sm" data-act="scratch" aria-pressed="${S.scratchOpen}">Working</button>
      <button class="btn" data-act="nav">Questions</button>
      <span class="clock ${warn ? 'warn' : ''} ${S.running ? '' : 'paused'}">${S.countUp ? mmss(S.secsUp) : fmtClock(S.secsLeft)}</span>
      <button class="btn hide-sm" data-act="pause">${S.running ? 'Pause' : 'Resume'}</button>
    </div>
    ${hasStim ? `<div class="stimhead"><button data-act="stim">${S.stimOpen ? 'Hide the passage' : 'Show the passage'}</button><span>${esc(sec.title)} · Q${sec.from}–${sec.to}</span></div>` : ''}
    <div class="stage${hasStim && !S.stimOpen ? ' folded' : ''}">
      ${hasStim ? `<div class="stimpane" id="stimpane">${renderStimulus(sec, it.n, S.responses)}</div>` : ''}
      <div class="qpane" id="qpane"><div class="inner">
        <div class="qhead"><span class="qnum">Question ${it.n}</span>${p.mode !== 'exam' && it.fam ? `<span class="qtopic">${esc(it.fam)}</span>` : ''}</div>
        ${renderQuestionBody(it, S.responses[it.n], false)}
      </div></div>
    </div>
    <div class="botbar">
      <button class="btn" data-act="prev" ${S.cur === 0 ? 'disabled' : ''}>Previous</button>
      <span class="progress" title="${answered} of ${p.items.length} answered"><i style="width:${answered / p.items.length * 100}%"></i></span>
      <span class="counter">${answered}/${p.items.length} answered</span>
      <div class="spacer"></div>
      <button class="btn" data-act="leave">Leave</button>
      ${S.cur === p.items.length - 1 ? `<button class="btn primary" data-act="finish">Finish and mark</button>` : `<button class="btn primary" data-act="next">Next</button>`}
    </div>
    ${S.navOpen ? renderNav() : ''}
    ${S.scratchOpen ? `<div class="notepad"><header><span class="eyebrow">Working out</span><button data-act="scratch">Close</button></header>
      <textarea id="scratch" spellcheck="false" aria-label="Working out" placeholder="Room to work. Nothing here is marked.">${esc(S.scratch)}</textarea>
      <p class="hint">Kept for this sitting only.</p></div>` : ''}
  </div>`;
}
function renderNav() {
  const p = S.paper;
  const groups = p.sections.length > 1
    ? p.sections.map(s => ({ title: `${s.title} · Q${s.from}–${s.to}`, items: p.items.filter(i => i.n >= s.from && i.n <= s.to) }))
    : [{ title: 'All questions', items: p.items }];
  const left = p.items.length - Object.keys(S.responses).length;
  return `<div class="navwrap" data-act="closenav"><div class="navcard" data-stop="1">
    <h3>Questions</h3>
    <p class="lede">Filled squares are answered. A corner mark means you flagged it.${left ? ` ${left} still unanswered.` : ''}</p>
    ${groups.map(g => `<div class="navsec">${esc(g.title)}</div><div class="chips">${g.items.map(i => {
      const cls = ['chip']; if (S.responses[i.n] != null) cls.push('answered'); if (S.flags[i.n]) cls.push('flagged'); if (i.n - 1 === S.cur) cls.push('here');
      return `<button class="${cls.join(' ')}" data-act="goto" data-n="${i.n}">${i.n}</button>`;
    }).join('')}</div>`).join('')}
    <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
      <button class="btn" data-act="closenav">Back to the test</button>
      <button class="btn primary" data-act="finish">Finish and mark</button>
    </div>
  </div></div>`;
}

/* ==========================================================================
   Writing
   ========================================================================== */
function renderWriting() {
  const p = S.paper.prompt, warn = S.secsLeft <= 300;
  return `
  <div class="player">
    <div class="topbar">
      <div class="who"><b>Writing</b><span>${esc(examLabel(S.paper.examId))} · ${esc(p.genre)}</span></div>
      <span class="counter" id="wc">${wordsIn(S.essay)} words</span>
      <div class="spacer"></div>
      <span class="clock ${warn ? 'warn' : ''} ${S.running ? '' : 'paused'}">${fmtClock(S.secsLeft)}</span>
      <button class="btn" data-act="pause">${S.running ? 'Pause' : 'Resume'}</button>
    </div>
    <div class="writing">
      <div class="taskcard">
        <span class="genre">${esc(p.genre)} · 30 minutes</span>
        <h2>${esc(p.title || 'Writing task')}</h2>
        ${p.stimulus && p.stimulus.length ? `<div class="stimulus">${p.stimulus.map(l => `<p>${bold(l)}</p>`).join('')}</div>` : ''}
        <p class="task">${bold(p.prompt)}</p>
        ${p.guidance && p.guidance.length ? `<ul class="guide">${p.guidance.map(g => `<li>${bold(g)}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="editor">
        <span class="eyebrow">Your response</span>
        <textarea id="essay" spellcheck="false" placeholder="Plan for a few minutes, then write." aria-label="Your response">${esc(S.essay)}</textarea>
        <div class="editmeta"><span id="wc2">${wordsIn(S.essay)} words</span><span>${RUBRIC.timePlan.map(t => `${t.minutes} min: ${t.do.split(/[.:]/)[0]}`).join(' · ')}</span></div>
      </div>
      <div style="display:flex;gap:10px"><button class="btn" data-act="leave">Leave</button><button class="btn primary" data-act="finishWriting">Finish and mark it yourself</button></div>
    </div>
  </div>`;
}
function renderWritingResult() {
  const a = DB.attempts.find(x => x.id === S.reviewing);
  if (!a) return renderHome();
  const p = (CONTENT[a.exam] || {}).writing || { title: a.promptTitle, genre: a.genre, prompt: '' };
  const rb = RUBRIC;
  const bands = a.bands || {};
  const chosen = Object.keys(bands).length;
  const total = rb.criteria.reduce((n, c) => n + (bands[c.id] ? c.weight * (bands[c.id] / 4) : 0), 0);
  const scored = rb.criteria.reduce((n, c) => n + (bands[c.id] ? c.weight : 0), 0);
  const pct = scored ? Math.round(total / scored * 100) : null;
  const notes = rb.genreNotes[p.genre] || [];
  const live = !!QUEUE.length || S.view === 'writingResult';
  return `
  <div class="results">
    <div class="crumbs"><button class="linkbtn" data-act="home">Exams</button> › <button class="linkbtn" data-act="openExam" data-id="${esc(a.exam)}">${esc(examLabel(a.exam))}</button> › Writing</div>
    <div class="scoreline">
      <div class="big">${a.words}<s> words</s></div>
      <div class="meta"><b>${esc(p.title || 'Writing task')} · ${esc(p.genre)}</b><span>${esc(p.rubricNotes || '')}</span></div>
      <div class="pills">
        <span class="pill">${dateShort(a.ts)}</span>
        <span class="pill good">${Math.max(1, Math.round(a.secondsUsed / 60))} min of 30</span>
        ${pct != null ? `<span class="pill">self-mark ${pct}%</span>` : ''}
      </div>
    </div>
    <div class="panel">
      <h2>The task</h2>
      ${p.stimulus && p.stimulus.length ? `<div class="qpassage">${p.stimulus.map(l => `<p>${bold(l)}</p>`).join('')}</div>` : ''}
      <p class="qstem"><b>${bold(p.prompt)}</b></p>
    </div>
    <div class="panel">
      <h2>Your response</h2>
      <p class="lede">${a.words} words. This is saved with your papers, so you can read it again later.</p>
      <div class="qpassage essay">${a.essay && a.essay.trim() ? a.essay.split(/\n+/).map(x => `<p>${esc(x)}</p>`).join('') : '<p class="empty">You did not write anything.</p>'}</div>
      <div class="rowbtns"><button class="btn" data-act="copyEssay">Copy text</button><button class="btn" data-act="print">Print / save as PDF</button></div>
    </div>
    ${notes.length ? `<div class="panel"><h2>What markers look for in ${esc(p.genre)} writing</h2><ul class="guide">${notes.map(n => `<li>${bold(n)}</li>`).join('')}</ul></div>` : ''}
    <div class="panel">
      <h2>Mark your own response</h2>
      <p class="lede">Read your writing against each description and pick the band that honestly fits. ${chosen < rb.criteria.length ? `${rb.criteria.length - chosen} still to judge.` : 'All five judged.'} Your marks are saved with the essay.</p>
      <div class="rubric">${rb.criteria.map(c => `<div class="crit">
        <header><h4>${esc(c.name)}</h4><span class="w">${c.weight}%</span></header>
        <ul class="checks">${c.selfCheck.map(q => `<li>${bold(q)}</li>`).join('')}</ul>
        <div class="bands">${[4, 3, 2, 1].map(bn => `<button class="bandbtn" data-act="band" data-crit="${c.id}" data-band="${bn}" aria-pressed="${bands[c.id] === bn}"><b>Band ${bn}</b>${esc(c.descriptors[String(bn)])}</button>`).join('')}</div>
      </div>`).join('')}</div>
    </div>
    <div class="rowbtns">
      ${QUEUE.length ? `<button class="btn primary" data-act="nextTest">Next test: ${esc(SPEC[QUEUE[0]].name)} →</button>` : ''}
      <button class="btn" data-act="openExam" data-id="${esc(a.exam)}">Back to ${esc(examLabel(a.exam))}</button>
      <button class="btn" data-act="go" data-view="papers">My papers</button>
    </div>
    ${live ? '' : ''}
  </div>`;
}
