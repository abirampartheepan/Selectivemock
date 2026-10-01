/* ==========================================================================
   Hub pages — My papers, Mistakes, Progress, Drills, Backup
   ========================================================================== */
'use strict';

function hubNav(active) {
  const tabs = [['home', 'Exams'], ['papers', 'My papers'], ['mistakes', 'Mistakes'], ['progress', 'Progress'], ['drills', 'Drills'], ['backup', 'Backup']];
  return `<div class="masthead">
    <div><h1>Selective <span>Exam</span> Practice</h1>
      <p class="sub">100 full practice exams for the NSW Selective High School Placement Test: Reading, Thinking Skills, Mathematical Reasoning and Writing.</p></div>
    <div class="toolbar"><button class="icon-btn" data-act="theme">Theme</button></div>
  </div>
  <nav class="hubnav" aria-label="Sections">${tabs.map(([v, l]) => `<button data-act="go" data-view="${v}" aria-current="${active === v ? 'page' : 'false'}">${l}${v === 'mistakes' && openMistakes().length ? ` <span class="badge">${openMistakes().length}</span>` : ''}</button>`).join('')}</nav>`;
}
function shell(active, body) {
  return `<div class="home">${hubNav(active)}${body}
    <footer class="fine"><span>Practice material written for this site. Not an official publication of the NSW Department of Education.</span>
    <span>Your progress is saved in this browser only. Use Backup to move it to another device.</span>
    <span>Keys while sitting a test: A–E or 1–7 to answer · ← → to move · M to flag</span></footer></div>`;
}

/* ==========================================================================
   My papers
   ========================================================================== */
function renderPapers() {
  const f = S.papersFilter;
  const list = DB.attempts.filter(a => f === 'all' ? true : f === 'practice' ? a.kind !== 'exam' : a.kind === 'exam' && a.module === f);
  const chips = [['all', 'All'], ['reading', 'Reading'], ['thinking', 'Thinking Skills'], ['maths', 'Maths'], ['writing', 'Writing'], ['practice', 'Drills and redos']];
  return shell('papers', `
    <div class="panel">
      <h2>My papers</h2>
      <p class="lede">Every test you have finished, newest first. Open one to see every question again with your answers, the explanations and your notes.</p>
      <div class="chiprow">${chips.map(([k, l]) => `<button class="tchip" data-act="papersFilter" data-f="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
      ${list.length ? `<table class="grid papers"><thead><tr><th>Date</th><th>Paper</th><th>Score</th><th class="hide-sm">Time</th><th></th></tr></thead><tbody>
        ${list.map(a => `<tr>
          <td>${dateShort(a.ts)}</td>
          <td><b>${esc(attemptTitle(a))}</b>${a.kind === 'exam' ? ` <span class="tierdot tier-${a.tier}" title="${esc(TIERS[a.tier].label)}"></span>` : ''}</td>
          <td class="num">${a.module === 'writing' ? a.words + ' words' : `${a.correct}/${a.n} <span class="pct">${a.pct}%</span>`}</td>
          <td class="num hide-sm">${Math.max(1, Math.round((a.secondsUsed || 0) / 60))} min</td>
          <td class="num"><button class="icon-btn" data-act="review" data-id="${esc(a.id)}">${a.module === 'writing' ? 'Read' : 'Review'}</button>
            ${(a.missed || []).length ? `<button class="icon-btn" data-act="redoAttempt" data-id="${esc(a.id)}">Redo ${a.missed.length}</button>` : ''}</td>
        </tr>`).join('')}</tbody></table>` : `<p class="empty">Nothing here yet. Finished tests appear here automatically.</p>`}
    </div>`);
}

/* ==========================================================================
   Mistakes notebook
   ========================================================================== */
/* Every question answered wrongly (or left blank) in an exam or drill, newest first,
   one entry per question. A question leaves the list once you redo it correctly twice. */
function allMistakes() {
  const seen = new Map();
  DB.attempts.forEach(a => (a.missed || []).forEach(mm => {
    if (!mm.rec) return;
    const k = recKey(mm.rec);
    if (seen.has(k)) { seen.get(k).times++; return; }
    seen.set(k, { key: k, rec: mm.rec, given: mm.given, fam: mm.fam, module: mm.module, tag: mm.tag, ts: a.ts, tier: a.tier, attempt: a.id, times: 1, slow: mm.slow });
  }));
  return Array.from(seen.values());
}
function openMistakes() { return allMistakes().filter(x => !isMastered(x.key)); }
function renderMistakes() {
  const F = S.mistakesFilter;
  const all = allMistakes();
  const fams = Array.from(new Set(all.map(x => x.fam).filter(Boolean))).sort();
  const list = all.filter(x => (F.mastered || !isMastered(x.key)) && (F.module === 'all' || x.module === F.module) &&
    (F.tier === 'all' || x.tier === F.tier) && (F.fam === 'all' || x.fam === F.fam));
  const sel = Object.keys(S.mistakeSel).filter(k => S.mistakeSel[k]);
  const shown = list.slice(0, 60);
  return shell('mistakes', `
    <div class="panel">
      <h2>Mistakes notebook</h2>
      <p class="lede">Every question you got wrong, in one place. Open one to see your answer, the right answer, why your choice was wrong and the full explanation, and add your own note.
      Redo a question correctly twice and it counts as mastered.</p>
      <div class="filters">
        <label>Test <select data-act="mf" data-k="module"><option value="all">All tests</option>${MODULE_ORDER.filter(m => m !== 'writing').map(m => `<option value="${m}" ${F.module === m ? 'selected' : ''}>${SPEC[m].name}</option>`).join('')}</select></label>
        <label>Level <select data-act="mf" data-k="tier"><option value="all">All levels</option>${TIER_ORDER.map(t => `<option value="${t}" ${F.tier === t ? 'selected' : ''}>${TIERS[t].label}</option>`).join('')}</select></label>
        <label>Topic <select data-act="mf" data-k="fam"><option value="all">All topics</option>${fams.map(f => `<option ${F.fam === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" data-act="mfMastered" ${F.mastered ? 'checked' : ''}> Show mastered</label>
      </div>
      <div class="rowbtns">
        <button class="btn primary" data-act="redoMistakes" ${list.length ? '' : 'disabled'}>Redo ${sel.length ? sel.length + ' selected' : Math.min(20, list.length) + ' shown'}</button>
        ${sel.length ? `<button class="btn" data-act="clearSel">Clear selection</button>` : ''}
        <span class="hint">${list.length} question${list.length === 1 ? '' : 's'}${list.length > 60 ? ', first 60 shown' : ''}</span>
      </div>
    </div>
    ${shown.length ? `<div class="review">${shown.map(x => renderMistakeRow(x)).join('')}</div>` : `<p class="empty">${all.length ? 'No mistakes match these filters.' : 'No mistakes yet. Questions you get wrong in any test will be collected here.'}</p>`}`);
}
function renderMistakeRow(x) {
  const it = S.openMistake === x.key ? materialise(x.rec) : null;
  const mastered = isMastered(x.key);
  const label = x.rec.kind === 'exam' ? `${examLabel(x.rec.exam)} · ${SPEC[x.rec.module].short} Q${x.rec.n}` : `Drill · ${x.fam}`;
  return `<details class="rev ${mastered ? 'ok' : 'no'}" ${it ? 'open' : ''} data-act="openMistake" data-key="${esc(x.key)}">
    <summary><input type="checkbox" class="selbox" data-act="selMistake" data-key="${esc(x.key)}" ${S.mistakeSel[x.key] ? 'checked' : ''} aria-label="Select for redo">
      <span class="st">${mastered ? 'Mastered' : x.given == null ? 'Blank' : 'Wrong'}</span>
      <span class="sq">${esc(label)} · ${esc(x.fam || '')}</span>
      <span class="counter">${dateShort(x.ts)}${x.times > 1 ? ` · missed ${x.times}×` : ''}</span>${noteFor(x.key) ? '<span class="hasnote" title="You wrote a note">✎</span>' : ''}</summary>
    <div class="body">${it ? `
      ${it._sec ? `<details class="rev passage"><summary><span class="n">§</span><span class="sq">Show the passage</span></summary><div class="body">${renderStimulus(Object.assign({}, it._sec), it.n)}</div></details>` : ''}
      ${renderQuestionBody(it, x.given, true)}${renderFeedback(it, x.given, x.key)}
      <div class="rowbtns"><button class="btn small" data-act="redoOne" data-key="${esc(x.key)}">Redo this question</button></div>` : '<p class="hint">Loading…</p>'}</div>
  </details>`;
}

/* ==========================================================================
   Progress
   ========================================================================== */
function renderProgress() {
  const exams = DB.attempts.filter(a => a.kind === 'exam' && a.module !== 'writing').slice().sort((a, b) => a.ts - b.ts);
  const byMod = {};
  exams.forEach(a => { (byMod[a.module] = byMod[a.module] || []).push(a); });
  const charts = ['reading', 'thinking', 'maths'].map(m => {
    const pts = (byMod[m] || []).map(a => ({ ts: a.ts, pct: a.pct, label: examLabel(a.exam) }));
    const avg = pts.length ? Math.round(pts.reduce((s, p) => s + p.pct, 0) / pts.length) : null;
    const last5 = pts.slice(-5), prev5 = pts.slice(-10, -5);
    const a5 = last5.length ? Math.round(last5.reduce((s, p) => s + p.pct, 0) / last5.length) : null;
    const p5 = prev5.length ? Math.round(prev5.reduce((s, p) => s + p.pct, 0) / prev5.length) : null;
    return `<div class="panel chartpanel"><header><h3>${SPEC[m].name}</h3>
      ${pts.length ? `<span class="fig">${pts.length} paper${pts.length > 1 ? 's' : ''} · average ${avg}%${a5 != null && p5 != null ? ` · last 5 ${a5}% <span class="delta ${a5 > p5 ? 'up' : a5 < p5 ? 'down' : ''}">${a5 > p5 ? '+' : ''}${a5 - p5}</span>` : ''}</span>` : ''}</header>
      ${pts.length ? scoreChart(pts, { label: SPEC[m].name + ' scores' }) : '<p class="empty">No papers yet.</p>'}</div>`;
  }).join('');

  // topic accuracy over the last five papers of each test
  const famRows = ['reading', 'thinking', 'maths'].map(m => {
    const last = (byMod[m] || []).slice(-5);
    const agg = {};
    last.forEach(a => (a.topics || []).forEach(t => { agg[t.topic] = agg[t.topic] || { r: 0, t: 0 }; agg[t.topic].r += t.right; agg[t.topic].t += t.total; }));
    const rows = Object.keys(agg).map(k => ({ topic: k, pct: Math.round(agg[k].r / agg[k].t * 100), r: agg[k].r, t: agg[k].t })).sort((a, b) => a.pct - b.pct);
    if (!rows.length) return '';
    return `<div class="famblock"><span class="eyebrow">${SPEC[m].name} · last ${last.length} paper${last.length > 1 ? 's' : ''}</span>
      ${rows.map(r => `<div class="rec"><span class="who"><b>${esc(r.topic)}</b><span>${r.r} of ${r.t} right</span></span>
        <span class="meter"><i class="${meterClass(r.pct)}" style="width:${r.pct}%"></i></span><span class="fig">${r.pct}%</span>
        ${drillFamilies().some(f => f.key === m + '·' + r.topic) ? `<button class="btn small" data-act="drill" data-fam="${esc(m + '·' + r.topic)}">Drill</button>` : ''}</div>`).join('')}</div>`;
  }).join('');

  // mistake patterns across everything
  const tagC = {};
  DB.attempts.forEach(a => (a.missed || []).forEach(mm => { if (mm.tag) tagC[mm.tag] = (tagC[mm.tag] || 0) + 1; }));
  const tagRows = Object.keys(tagC).map(k => ({ tag: k, n: tagC[k] })).sort((a, b) => b.n - a.n);
  const tagMax = tagRows.length ? tagRows[0].n : 1;

  // timing habits
  const timing = ['reading', 'thinking', 'maths'].map(m => {
    const list = (byMod[m] || []).slice(-5);
    if (!list.length) return '';
    const per = list.map(a => a.secondsUsed / Math.max(1, a.n));
    const avg = per.reduce((s, x) => s + x, 0) / per.length;
    const budget = SPEC[m].minutes * 60 / SPEC[m].n;
    const ranOut = list.filter(a => !a.countUp && a.secondsUsed >= a.minutes * 60).length;
    const slow = list.reduce((s, a) => s + (a.missed || []).filter(x => x.slow).length, 0);
    const blanks = list.reduce((s, a) => s + (a.missed || []).filter(x => x.given == null).length, 0);
    return `<tr><td>${SPEC[m].short}</td><td class="num">${mmss(avg)}</td><td class="num">${mmss(budget)}</td><td class="num">${ranOut}/${list.length}</td><td class="num">${slow}</td><td class="num">${blanks}</td></tr>`;
  }).join('');
  const essays = DB.attempts.filter(a => a.module === 'writing');

  return shell('progress', `
    ${exams.length ? '' : `<div class="nextup"><h2>Nothing to show yet</h2><p class="lede">Finish a Reading, Thinking Skills or Maths test and your scores, weak topics, mistake habits and timing will appear here.</p></div>`}
    <div class="charts">${charts}</div>
    ${famRows ? `<div class="panel"><h2>Topics, weakest first</h2><p class="lede">Accuracy in each topic over your last five papers of each test. Drills give fresh questions on that topic.</p>${famRows}</div>` : ''}
    ${tagRows.length ? `<div class="panel"><h2>Your mistake habits</h2><p class="lede">Every wrong option is built from a particular mistake. These are the ones you make most, across every test and drill.</p>
      <div class="tagrows">${tagRows.map(t => `<div class="tagrow"><span class="tagname">${esc(MISTAKE[t.tag] || t.tag)}</span>
        <span class="bar"><i style="width:${Math.round(t.n / tagMax * 100)}%"></i></span><span class="tagn">${t.n}</span><span class="tagtip">${esc(TAG_TIPS[t.tag] || '')}</span></div>`).join('')}</div></div>` : ''}
    ${timing ? `<div class="panel"><h2>Timing habits</h2><p class="lede">Your last five papers of each test. "Slow and wrong" counts questions that took more than twice the even pace and were still wrong: those are the ones to skip and come back to.</p>
      <table class="grid"><thead><tr><th>Test</th><th>Your pace</th><th>Even pace</th><th>Ran out</th><th>Slow and wrong</th><th>Left blank</th></tr></thead><tbody>${timing}</tbody></table></div>` : ''}
    ${essays.length ? `<div class="panel"><h2>Your writing</h2><table class="grid"><thead><tr><th>Date</th><th>Task</th><th>Words</th><th></th></tr></thead><tbody>
      ${essays.map(a => `<tr><td>${dateShort(a.ts)}</td><td>${esc(a.promptTitle || '')} <span class="hint">${esc(a.genre || '')}</span></td><td class="num">${a.words}</td><td class="num"><button class="icon-btn" data-act="review" data-id="${esc(a.id)}">Read</button></td></tr>`).join('')}
      </tbody></table></div>` : ''}`);
}

/* ==========================================================================
   Drills
   ========================================================================== */
function renderDrills() {
  const fams = drillFamilies();
  return shell('drills', `
    <div class="panel">
      <h2>Drills</h2>
      <p class="lede">Fresh questions on one topic, made new every time, with a stopwatch instead of a countdown. Drills use the Maths and Thinking Skills puzzle types, so they never use up questions from the 100 exams.</p>
      <div class="field"><span class="eyebrow">Level</span><div class="seg">${TIER_ORDER.map(t => `<button data-act="drillLevel" data-t="${t}" aria-pressed="${S.drillLevel === t}">${TIERS[t].label}</button>`).join('')}</div></div>
      ${['maths', 'thinking'].map(m => `<div class="chiprow" style="margin-top:16px"><span class="eyebrow">${SPEC[m].name}</span>
        ${fams.filter(f => f.module === m).map(f => `<button class="tchip" data-act="drill" data-fam="${esc(f.key)}">${esc(f.family)}<span class="n">${f.gens.length} types</span></button>`).join('')}</div>`).join('')}
    </div>`);
}

/* ==========================================================================
   Backup
   ========================================================================== */
function renderBackup() {
  const n = DB.attempts.length;
  let size = 0; try { size = (localStorage.getItem(STORE_KEY) || '').length; } catch (e) { /* ignore */ }
  return shell('backup', `
    <div class="panel">
      <h2>Backup and move your progress</h2>
      <p class="lede">Your papers, mistakes, notes and essays are saved in this browser only. Clearing browser data or using a different device or browser starts you from scratch. Download a backup file now and then, and load it on another device to carry on there.</p>
      <p class="hint">${n} saved paper${n === 1 ? '' : 's'}, ${Object.keys(DB.notes).length} note${Object.keys(DB.notes).length === 1 ? '' : 's'}${size ? `, about ${Math.ceil(size / 1024)} KB` : ''}.</p>
      <div class="rowbtns">
        <button class="btn primary" data-act="export">Download backup file</button>
        <label class="btn filebtn">Load a backup file<input type="file" accept=".json,application/json" data-act="import" hidden></label>
      </div>
      <p class="hint" id="backupMsg"></p>
    </div>
    <div class="panel">
      <h2>Start again</h2>
      <p class="lede">Deletes every saved paper, mistake and note in this browser. Download a backup first if you might want them back.</p>
      <button class="btn danger" data-act="resetAll">Delete all my progress</button>
    </div>`);
}
function exportBackup() {
  const blob = new Blob([JSON.stringify(Object.assign({ exported: new Date().toISOString(), site: 'selective-exam-practice' }, DB))], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `selective-practice-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  const m = $('#backupMsg'); if (m) m.textContent = 'Backup downloaded. Keep the file somewhere safe.';
}
function importBackup(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || !Array.isArray(d.attempts)) throw new Error('not a backup');
      const ids = new Set(DB.attempts.map(a => a.id));
      const added = d.attempts.filter(a => a && a.id && !ids.has(a.id));
      DB.attempts = DB.attempts.concat(added).sort((a, b) => b.ts - a.ts).slice(0, MAX_ATTEMPTS);
      DB.notes = Object.assign({}, d.notes || {}, DB.notes);
      Object.keys(d.mastery || {}).forEach(k => { if (!DB.mastery[k] || (d.mastery[k].last || 0) > (DB.mastery[k].last || 0)) DB.mastery[k] = d.mastery[k]; });
      saveDB();
      render();
      toast(`Backup loaded: ${added.length} paper${added.length === 1 ? '' : 's'} added.`);
    } catch (e) { toast('That file is not a backup from this site.'); }
  };
  rd.readAsText(file);
}
