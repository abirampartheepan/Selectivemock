/* ==========================================================================
   Interface — state, saved progress, shared rendering helpers
   ========================================================================== */
'use strict';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const app = () => document.getElementById('app');

const S = {
  view: 'home', tier: 'easy', examId: null,
  paper: null, responses: {}, flags: {}, cur: 0,
  secsLeft: 0, secsUp: 0, running: false, timerId: null, countUp: false,
  navOpen: false, marked: null, essay: '', selfBands: {},
  times: {}, enteredAt: null, scratchOpen: false, scratch: '', stimOpen: true,
  reviewing: null,          // id of a saved attempt being reviewed
  papersFilter: 'all', mistakesFilter: { module: 'all', tier: 'all', fam: 'all', mastered: false },
  mistakeSel: {}, drillLevel: 'easy', toast: null,
};
let QUEUE = [];   // remaining tests in a full-exam sitting

/* ==========================================================================
   Saved progress (this browser only). One key holds everything.
   ========================================================================== */
const STORE_KEY = 'selective-practice-v3';
const MAX_ATTEMPTS = 1000;
let DB = { v: 3, attempts: [], notes: {}, mastery: {} };
function loadDB() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.attempts) DB = Object.assign({ v: 3, attempts: [], notes: {}, mastery: {} }, d); }
  } catch (e) { /* storage unavailable: work in memory */ }
}
function saveDB() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); return true; }
  catch (e) { toast('Your browser would not save progress (storage may be full or blocked). Use Backup to keep a copy.'); return false; }
}
function addAttempt(a) {
  DB.attempts.unshift(a);
  if (DB.attempts.length > MAX_ATTEMPTS) DB.attempts.length = MAX_ATTEMPTS;
  saveDB();
}
function noteFor(key) { return DB.notes[key] || ''; }
let _noteTimer = null;
function setNote(key, text) {
  if (text.trim()) DB.notes[key] = text; else delete DB.notes[key];
  clearTimeout(_noteTimer);
  _noteTimer = setTimeout(saveDB, 400);
}
/* A question is mastered once it has been redone correctly twice in a row. */
function recordRedo(key, right) {
  const m = DB.mastery[key] || { streak: 0, tries: 0 };
  m.tries++; m.streak = right ? m.streak + 1 : 0; m.last = Date.now();
  DB.mastery[key] = m;
}
function isMastered(key) { return (DB.mastery[key] || {}).streak >= 2; }

/* ==========================================================================
   Small helpers
   ========================================================================== */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* Question text may contain a small set of trusted tags written by the
   generators (<br>, <b>, <sup>, <span class="mono">). Everything else is text. */
function rich(s) {
  const keep = [];
  const t = String(s == null ? '' : s).replace(/<(\/?)(br|b|sup|sub|span)([^>]*)>/gi, (m, slash, tag, attrs) => {
    const safeAttrs = /^\s*(class="mono"|style="letter-spacing:\.2em")?\s*$/.test(attrs) ? attrs : '';
    keep.push(`<${slash}${tag.toLowerCase()}${slash ? '' : safeAttrs}>`);
    return `\u0000${keep.length - 1}\u0000`;
  }).replace(/&nbsp;/g, ' ');
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}
function plain(s) { return String(s == null ? '' : s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }
function bold(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function fmtClock(sec) { const s = Math.max(0, sec); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function mmss(sec) { const s = Math.max(0, Math.round(sec)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function dateShort(ts) { return new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); }
function dateLong(ts) { return new Date(ts).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function titleCase(t) { return String(t).replace(/[-_]/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()); }
function wordsIn(t) { return (String(t).trim().match(/[A-Za-z0-9'’-]+/g) || []).length; }
function meterClass(pct) { return pct < 55 ? 'low' : pct < 75 ? 'mid' : 'high'; }
function examLabel(id) { const e = EXAM_BY_ID[id]; return e ? e.label : id; }
function attemptTitle(a) {
  if (a.kind === 'exam') return `${examLabel(a.exam)} · ${SPEC[a.module].short}`;
  if (a.kind === 'redo') return a.label || 'Redo';
  return (a.label || 'Drill') + ' drill';
}
function toast(msg) {
  S.toast = msg;
  const el = $('#toast');
  if (el) { el.textContent = msg; el.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), 4200); }
}

/* ---------- gap markers inside cloze and gapped texts ---------- */
function gaps(s, from, curN, answered) {
  return bold(s).replace(/(?:…|\.\.\.)\((\d+)\)(?:…|\.\.\.)/g, (m, d) => {
    const qn = from + parseInt(d, 10) - 1;
    const cls = ['gapmark'];
    if (answered && answered[qn] != null) cls.push('done');
    if (qn === curN) cls.push('here');
    return `<span class="${cls.join(' ')}" data-goto="${qn}" role="button" tabindex="0">${qn}</span>`;
  });
}

/* ==========================================================================
   Rendering a passage and a question (shared by player, results, notebook)
   ========================================================================== */
function renderStimulus(sec, curN, answered) {
  const from = sec.from;
  const out = [`<div class="sec-title">${esc(sec.title)} &middot; Questions ${sec.from}&ndash;${sec.to}</div>`];
  if (sec.rubric) out.push(`<div class="rubric">${esc(sec.rubric)}</div>`);
  sec.stimulus.forEach(b => {
    if (b.kind === 'headnote') out.push(`<p class="headnote">${bold(b.text)}</p>`);
    else if (b.kind === 'title') out.push(`<h3 class="stitle">${esc(b.text)}</h3>`);
    else if (b.kind === 'label') out.push(`<div class="label">${esc(b.text)}</div>`);
    else if (b.kind === 'glossary') out.push(`<div class="gloss"><dl>${b.items.map(([w, g]) => `<dt>${esc(w)}</dt><dd>${esc(g)}</dd>`).join('')}</dl></div>`);
    else if (b.kind === 'prose') out.push(b.paras.map(p => `<p>${bold(p)}</p>`).join(''));
    else if (b.kind === 'cloze') out.push(String(b.text).split(/\n\n+/).map(p => `<p>${gaps(p, from, curN, answered)}</p>`).join(''));
    else if (b.kind === 'gapped') out.push(b.paras.map(p => `<p>${gaps(p, from, curN, answered)}</p>`).join(''));
    else if (b.kind === 'verse') {
      let n = 0;
      out.push(`<div class="verse">${b.lines.map(l => {
        if (l.trim() === '') return '<span class="brk"></span>';
        n++;
        return `<span class="ln">${n % 5 === 0 ? n : ''}</span><span class="lt">${bold(l)}</span>`;
      }).join('')}</div>`);
    } else if (b.kind === 'sentences') {
      out.push(`<div class="sentlist"><div class="label" style="margin-top:0">Sentences</div>${
        b.items.map((s, i) => `<div class="s"><span class="l">${LETTERS[i]}</span><span>${bold(s)}</span></div>`).join('')}</div>`);
    } else if (b.kind === 'extract') {
      out.push(`<div class="label"><span class="exlabel">${esc(b.letter)}</span>${esc(b.title || 'Extract ' + b.letter)}</div>`);
      out.push(b.paras.map(p => `<p>${bold(p)}</p>`).join(''));
    }
  });
  return `<div class="stim">${out.join('')}</div>`;
}
function renderTable(t) {
  return `<div class="qtable"><table>${t.caption ? `<caption>${esc(t.caption)}</caption>` : ''}
    ${t.head ? `<thead><tr>${t.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : ''}
    <tbody>${(t.rows || []).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderOptions(it, chosen, revealed) {
  const svgs = it.optionSvgs;
  const list = svgs || it.options;
  const style = it.optionStyle === 'letters' ? 'letters' : (svgs ? 'figs' : '');
  return `<div class="opts ${style}" role="radiogroup" aria-label="Answer options">${list.map((o, i) => {
    const cls = ['opt'];
    if (svgs) cls.push('figopt');
    if (chosen === i) cls.push('sel');
    if (revealed) { if (i === it.answer) cls.push('right'); else if (chosen === i) cls.push('wrong'); }
    const body = svgs ? o : esc(o);
    return `<button class="${cls.join(' ')}" ${revealed ? 'tabindex="-1"' : `data-act="answer" data-i="${i}"`} role="radio" aria-checked="${chosen === i}"><span class="l">${LETTERS[i]}</span><span class="t">${body}</span></button>`;
  }).join('')}</div>`;
}
function renderQuestionBody(it, chosen, revealed, o) {
  o = o || {};
  const parts = [];
  if (it.passage) parts.push(`<div class="qpassage">${String(it.passage).split(/\n+/).map(p => `<p>${rich(p)}</p>`).join('')}</div>`);
  if (it.svg) parts.push(`<div class="qfig">${it.svg}</div>`);
  if (it.table) parts.push(renderTable(it.table));
  parts.push(`<p class="qstem">${rich(it.stem)}</p>`);
  if (it.optionStyle === 'letters' && !revealed) parts.push(`<p class="hint" style="margin-bottom:10px">Choose the extract this statement describes.</p>`);
  parts.push(renderOptions(it, chosen, revealed));
  return parts.join('');
}
/* The feedback block under a marked question: what you chose, why it is wrong, why the answer is right, and your note. */
function renderFeedback(it, given, key) {
  const parts = [];
  if (given != null && given !== it.answer) {
    const why = it.whys && it.whys[given];
    const optTxt = it.optionSvgs ? `option ${LETTERS[given]}` : `${LETTERS[given]} (${esc(String(it.options[given]).replace(/[.]$/, ''))})`;
    const reason = !why ? '.' : it.kind === 'gen' ? `, which ${esc(why)}.` : `. Not quite: ${esc(why)}.`;
    parts.push(`<div class="yourpick"><span class="eyebrow">Your answer</span>You chose ${optTxt}${reason}</div>`);
  } else if (given == null) {
    parts.push(`<div class="yourpick"><span class="eyebrow">Your answer</span>You left this blank. A guess costs nothing on the real test, so always choose something.</div>`);
  }
  parts.push(`<div class="explain"><span class="eyebrow">Why ${LETTERS[it.answer]}</span>${rich(it.explain)}</div>`);
  if (key) parts.push(`<label class="notebox"><span class="eyebrow">My note</span><textarea data-note="${esc(key)}" rows="2" placeholder="What went wrong, or what to remember next time">${esc(noteFor(key))}</textarea></label>`);
  return parts.join('');
}

/* ==========================================================================
   Charts
   ========================================================================== */
function sparkline(vals, o) {
  o = o || {};
  const W = 148, H = 40, pad = 3;
  if (!vals.length) return '';
  const n = vals.length;
  const x = i => (n === 1 ? W / 2 : pad + i * (W - 2 * pad) / (n - 1));
  const y = v => pad + (1 - v / 100) * (H - 2 * pad);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${pts[n - 1][0].toFixed(1)} ${H - pad} L${pts[0][0].toFixed(1)} ${H - pad} Z`;
  const last = pts[n - 1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc((o.label || 'score') + ': ' + vals.join('%, ') + '%')}">` +
    `<line x1="${pad}" y1="${y(50)}" x2="${W - pad}" y2="${y(50)}" stroke="currentColor" stroke-opacity="0.14" stroke-dasharray="2 3"/>` +
    (n > 1 ? `<path d="${area}" fill="var(--chart-soft)"/>` : '') +
    `<path d="${line}" fill="none" stroke="var(--chart)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.9" fill="var(--chart)"/></svg>`;
}
/* A larger score-over-time chart with labelled axes. pts: [{ts, pct, label}] */
function scoreChart(pts, o) {
  o = o || {};
  const W = 560, H = 190, L = 34, Rr = 10, T = 10, B = 26;
  if (!pts.length) return '';
  const n = pts.length;
  const pw = W - L - Rr, ph = H - T - B;
  const x = i => L + (n === 1 ? pw / 2 : i * pw / (n - 1));
  const y = v => T + ph - v / 100 * ph;
  let s = '';
  [0, 25, 50, 75, 100].forEach(v => {
    s += `<line x1="${L}" y1="${y(v)}" x2="${W - Rr}" y2="${y(v)}" stroke="currentColor" stroke-opacity="${v === 0 ? 0.35 : 0.1}"/>`;
    s += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10.5" fill="currentColor" fill-opacity=".6">${v}%</text>`;
  });
  const d = pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.pct).toFixed(1)).join(' ');
  s += `<path d="${d}" fill="none" stroke="var(--chart)" stroke-width="2" stroke-linejoin="round"/>`;
  pts.forEach((p, i) => { s += `<circle cx="${x(i).toFixed(1)}" cy="${y(p.pct).toFixed(1)}" r="3.4" fill="var(--chart)"><title>${esc(p.label)}: ${p.pct}%</title></circle>`; });
  const step = Math.max(1, Math.ceil(n / 6));
  pts.forEach((p, i) => { if (i % step === 0 || i === n - 1) s += `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".6">${esc(dateShort(p.ts))}</text>`; });
  return `<svg class="scorechart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'scores over time')}">${s}</svg>`;
}
