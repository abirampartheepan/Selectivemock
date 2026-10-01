/* ==========================================================================
   Home (the exam list) and the page for one exam
   ========================================================================== */
'use strict';

function bestFor(examId, module) {
  const rows = DB.attempts.filter(a => a.kind === 'exam' && a.exam === examId && a.module === module);
  if (!rows.length) return null;
  if (module === 'writing') return { done: true, n: rows.length, last: rows[0] };
  return { pct: Math.max.apply(null, rows.map(a => a.pct)), n: rows.length, last: rows[0] };
}
function examStatus(id) {
  const ready = MODULE_ORDER.filter(m => examReady(id, m));
  const done = MODULE_ORDER.filter(m => bestFor(id, m));
  return { ready, done, full: ready.length === 4 };
}

function renderHome() {
  const t = S.tier;
  const list = EXAMS.filter(e => e.tier === t);
  const readyCount = list.filter(e => examFullyReady(e.id)).length;
  const lastExam = DB.attempts.find(a => a.kind === 'exam');
  const open = openMistakes().length;
  // suggest the next exam: the first fully ready exam in this tier with an unsat test
  const next = list.find(e => examFullyReady(e.id) && examStatus(e.id).done.length < 4);
  return shell('home', `
    ${DB.attempts.length ? `<div class="nextup">
      <h2>Welcome back</h2>
      <div class="recs">
        ${lastExam ? `<div class="rec"><span class="who"><b>Last paper: ${esc(attemptTitle(lastExam))}</b><span>${dateLong(lastExam.ts)}${lastExam.module !== 'writing' ? ` · ${lastExam.correct}/${lastExam.n} (${lastExam.pct}%)` : ''}</span></span>
          <button class="btn" data-act="review" data-id="${esc(lastExam.id)}">Review it</button></div>` : ''}
        ${open ? `<div class="rec"><span class="who"><b>${open} question${open === 1 ? '' : 's'} in your mistakes notebook</b><span>Redo them until you get each one right twice.</span></span>
          <button class="btn" data-act="go" data-view="mistakes">Open notebook</button></div>` : ''}
        ${next ? `<div class="rec"><span class="who"><b>Next up: ${esc(next.label)}</b><span>${4 - examStatus(next.id).done.length} test${4 - examStatus(next.id).done.length === 1 ? '' : 's'} not yet sat</span></span>
          <button class="btn primary" data-act="openExam" data-id="${next.id}">Open</button></div>` : ''}
      </div>
    </div>` : `<div class="nextup">
      <h2>How this works</h2>
      <p class="lede">There are 100 complete practice exams: 40 Easy, 40 Medium and 20 Hard. Each exam has the four tests of the real Selective test, timed the same way.
      Pick an exam, sit one test or all four, and every question is marked with an explanation. Your mistakes are collected in a notebook so you can redo them.</p>
    </div>`}

    <div class="tiertabs" role="tablist">${TIER_ORDER.map(k => `<button role="tab" data-act="tier" data-t="${k}" aria-selected="${t === k}" class="tier-${k}">
      <b>${TIERS[k].label}</b><span>${TIERS[k].count} exams</span></button>`).join('')}</div>
    <p class="tierblurb">${esc(TIERS[t].blurb)}${readyCount < list.length ? ` ${readyCount} of these ${list.length} exams have all four tests ready now; the rest have Maths ready and the other tests are being added.` : ''}</p>

    <div class="examgrid">${list.map(e => {
      const st = examStatus(e.id);
      return `<button class="examcard ${st.full ? '' : 'partial'}" data-act="openExam" data-id="${e.id}">
        <span class="num">${esc(TIERS[e.tier].label.toUpperCase())}</span>
        <h3>Exam ${e.n}</h3>
        <span class="dots">${MODULE_ORDER.map(m => {
          const b = bestFor(e.id, m), ready = examReady(e.id, m);
          const cls = !ready ? 'na' : !b ? 'todo' : m === 'writing' ? 'done' : meterClass(b.pct);
          const title = `${SPEC[m].name}: ${!ready ? 'coming soon' : !b ? 'not sat' : m === 'writing' ? 'done' : 'best ' + b.pct + '%'}`;
          return `<span class="dot ${cls}" title="${esc(title)}">${SPEC[m].short[0]}${b && m !== 'writing' ? `<i>${b.pct}</i>` : ''}</span>`;
        }).join('')}</span>
        ${st.full ? '' : '<span class="soon">Maths ready</span>'}
      </button>`;
    }).join('')}</div>`);
}

function renderExam() {
  const e = EXAM_BY_ID[S.examId];
  if (!e) return renderHome();
  const st = examStatus(e.id);
  return shell('home', `
    <div class="crumbs"><button class="linkbtn" data-act="home">Exams</button> › <button class="linkbtn" data-act="tier" data-t="${e.tier}">${esc(TIERS[e.tier].label)}</button> › Exam ${e.n}</div>
    <div class="examhead">
      <div><span class="eyebrow tier-${e.tier}">${esc(TIERS[e.tier].label)}</span><h2>${esc(e.label)}</h2>
        <p class="lede">${st.full ? 'All four tests, in the order of the real test. Sit them one at a time, or all four in a row.' : 'Maths is ready now. The other tests for this exam are being written and will appear in a later update.'}</p></div>
      ${st.full ? `<button class="btn primary big" data-act="startFull" data-id="${e.id}">Sit the full exam (2 hrs 35 min)</button>` : ''}
    </div>
    <div class="modules">${MODULE_ORDER.map((m, i) => {
      const sp = SPEC[m], ready = examReady(e.id, m), b = bestFor(e.id, m);
      const tries = DB.attempts.filter(a => a.kind === 'exam' && a.exam === e.id && a.module === m);
      return `<div class="mod ${ready ? '' : 'locked'}">
        <span class="num">Test ${i + 1}</span>
        <h3>${sp.name}</h3>
        <div class="spec"><span>${m === 'writing' ? '1 task' : sp.n + ' questions'}</span><span>${sp.minutes} min</span>${b && m !== 'writing' ? `<span>best ${b.pct}%</span>` : ''}</div>
        ${ready ? `<div class="rowbtns">
          <button class="btn primary" data-act="startTest" data-id="${e.id}" data-mod="${m}">${tries.length ? 'Sit again' : 'Start'}</button>
          ${tries.length ? `<button class="btn" data-act="review" data-id="${esc(tries[0].id)}">${m === 'writing' ? 'Read my essay' : 'Review last'}</button>` : ''}
        </div>
        ${tries.length > 1 ? `<div class="tries">${tries.slice(0, 5).map(a => `<button class="linkbtn" data-act="review" data-id="${esc(a.id)}">${dateShort(a.ts)}${m !== 'writing' ? ' · ' + a.pct + '%' : ''}</button>`).join(' ')}</div>` : ''}`
        : `<p class="hint">Coming in a later update.</p>`}
      </div>`;
    }).join('')}</div>`);
}
