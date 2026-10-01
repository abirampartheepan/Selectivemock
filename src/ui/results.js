/* ==========================================================================
   Results and review — the same page serves a test just finished and any
   saved attempt opened later from My papers.
   ========================================================================== */
'use strict';

/* Rebuild the paper a saved attempt was sat on. */
function paperForAttempt(a) {
  if (a.kind === 'exam') return buildExamModule(a.exam, a.module);
  if (a.records) return buildSet(a.records.filter(Boolean), { mode: a.kind, name: a.label, short: a.label, restTitle: a.label, module: a.module });
  return null;
}
function paceStrip(paper, responses, times) {
  const secs = paper.items.map((it, i) => times[i] || 0);
  const max = Math.max.apply(null, secs.concat([1]));
  return '<div class="pacestrip">' + paper.items.map((it, i) => {
    const g = responses[it.n];
    const cls = g == null ? 'skip' : (g === it.answer ? 'ok' : 'no');
    const h = Math.max(3, Math.round(secs[i] / max * 100));
    return `<span class="b ${cls}" style="height:${h}%" title="${esc('Q' + it.n + ' · ' + (secs[i] ? mmss(secs[i]) : 'not visited') + ' · ' + (g == null ? 'blank' : g === it.answer ? 'correct' : 'wrong'))}"></span>`;
  }).join('') + '</div>';
}
function tagCounts(paper, responses) {
  const c = {};
  paper.items.forEach(it => {
    const g = responses[it.n];
    if (g == null || g === it.answer || !it.tags) return;
    const t = it.tags[g]; if (t) c[t] = (c[t] || 0) + 1;
  });
  return Object.keys(c).map(k => ({ tag: k, n: c[k] })).sort((a, b) => b.n - a.n);
}
const TAG_TIPS = {
  'part-only': 'You did the first step and stopped. Before choosing, re-read the question and ask: is this the thing it actually asked for?',
  'operation': 'You added where you should multiply, or similar. Say the calculation in words before doing it.',
  'units': 'Units tripped you up (minutes and hours, mL and L). Convert everything to one unit first.',
  'place': 'A decimal point or zero went astray. Estimate the size of the answer before you calculate.',
  'off-by-one': 'You counted one too many or too few. Check where your counting starts and ends.',
  'misread': 'You answered a slightly different question. Underline exactly what is being asked.',
  'reversed': 'You worked something the wrong way round. Check the direction: before or after, more or less.',
  'slip': 'An arithmetic slip. Check the last step of your working, where slips are most common.',
  'logic': 'A logic step did not hold. Test the option against every rule, not just one.',
  'spatial': 'A visualising mistake. Track one corner or one face at a time.',
};

function renderResults() {
  const a = DB.attempts.find(x => x.id === S.reviewing);
  if (!a) return renderHome();
  if (a.module === 'writing') return renderWritingResult();
  const p = S.paper && S.paper._attemptId === a.id ? S.paper : paperForAttempt(a);
  if (!p) return `<div class="results"><p class="empty">This paper can no longer be rebuilt.</p><button class="btn" data-act="go" data-view="papers">Back</button></div>`;
  p._attemptId = a.id;
  S.paper = p;
  const resp = a.responses || {};
  const m = { correct: a.correct, n: a.n, pct: a.pct, attempted: Object.keys(resp).length };
  const b = band(m.pct);
  const fresh = S.view === 'results' && Date.now() - a.ts < 10 * 60 * 1000;
  const budget = a.minutes * 60 / Math.max(1, p.items.length);
  const times = a.times || [];
  const slowWrong = p.items.map((it, i) => ({ it, t: times[i] || 0 })).filter(x => x.t > 2 * budget && resp[x.it.n] !== x.it.answer);
  const missedRecs = p.items.filter(it => resp[it.n] !== it.answer).map(it => recordOf(it, p)).filter(Boolean);
  const tags = tagCounts(p, resp);
  const topics = (a.topics || []).slice().sort((x, y) => x.right / x.total - y.right / y.total);
  const weakest = topics.find(t => t.right < t.total && drillFamilies().some(f => f.key === t.module + '·' + t.topic));
  const groups = p.sections.length > 1
    ? p.sections.map(s => ({ sec: s, items: p.items.filter(i => i.n >= s.from && i.n <= s.to) }))
    : [{ sec: p.sections[0], items: p.items }];
  const onlyWrong = S.onlyWrong;
  const crumbs = a.kind === 'exam'
    ? `<button class="linkbtn" data-act="home">Exams</button> › <button class="linkbtn" data-act="openExam" data-id="${esc(a.exam)}">${esc(examLabel(a.exam))}</button> › ${esc(SPEC[a.module].name)}`
    : `<button class="linkbtn" data-act="go" data-view="papers">My papers</button> › ${esc(attemptTitle(a))}`;
  return `
  <div class="results">
    <div class="crumbs">${crumbs}</div>
    <div class="scoreline">
      <div class="big">${m.correct}<s>/${m.n}</s></div>
      <div class="meta"><b>${esc(b.label)} · ${m.pct}%</b><span>${esc(b.note)}</span></div>
      <div class="pills">
        <span class="pill">${dateShort(a.ts)}</span>
        ${a.kind === 'exam' ? `<span class="pill tier-${a.tier}">${esc(TIERS[a.tier].label)}</span>` : `<span class="pill">${a.kind === 'redo' ? 'Redo' : 'Drill'}</span>`}
        <span class="pill ${!a.countUp && a.secondsUsed >= a.minutes * 60 ? 'warn' : 'good'}">${!a.countUp && a.secondsUsed >= a.minutes * 60 ? 'Time ran out' : Math.max(1, Math.round(a.secondsUsed / 60)) + ' min' + (a.countUp ? '' : ' of ' + a.minutes)}</span>
        ${m.attempted < m.n ? `<span class="pill warn">${m.n - m.attempted} left blank</span>` : ''}
      </div>
    </div>

    <div class="rowbtns">
      ${fresh && QUEUE.length ? `<button class="btn primary" data-act="nextTest">Next test: ${esc(SPEC[QUEUE[0]].name)} →</button>` : ''}
      ${missedRecs.length ? `<button class="btn ${fresh && QUEUE.length ? '' : 'primary'}" data-act="redoAttempt" data-id="${esc(a.id)}">Redo the ${missedRecs.length} you missed</button>` : ''}
      ${weakest ? `<button class="btn" data-act="drill" data-fam="${esc(weakest.module + '·' + weakest.topic)}">Drill ${esc(weakest.topic)}</button>` : ''}
      <button class="btn" data-act="print">Print / save as PDF</button>
      ${a.kind === 'exam' ? `<button class="btn" data-act="openExam" data-id="${esc(a.exam)}">Back to ${esc(examLabel(a.exam))}</button>` : `<button class="btn" data-act="go" data-view="papers">My papers</button>`}
    </div>

    ${tags.length ? `<div class="panel">
      <h2>Your mistakes in this paper</h2>
      <p class="lede">Each wrong option on this site is built from a particular mistake. Here is what your wrong answers had in common.</p>
      <div class="tagrows">${tags.map(t => `<div class="tagrow"><span class="tagname">${esc(MISTAKE[t.tag] || t.tag)}</span><span class="tagn">${t.n}</span><span class="tagtip">${esc(TAG_TIPS[t.tag] || '')}</span></div>`).join('')}</div>
    </div>` : ''}

    <div class="panel">
      <h2>By topic</h2>
      <p class="lede">Weakest first.</p>
      <table class="grid"><thead><tr><th>Topic</th><th>Score</th><th></th></tr></thead><tbody>
      ${topics.map(t => { const pc = Math.round(t.right / t.total * 100); return `<tr><td>${esc(t.topic)}</td><td class="num" style="width:56px">${t.right}/${t.total}</td><td style="width:40%"><span class="bar"><i class="${meterClass(pc)}" style="width:${pc}%"></i></span></td></tr>`; }).join('')}
      </tbody></table>
    </div>

    ${times.some(x => x > 0) ? `<div class="panel">
      <h2>Where the time went</h2>
      <p class="lede">One bar per question, tall where you spent longest. An even pace for this test is about ${mmss(budget)} a question.</p>
      <div class="pace">${paceStrip(p, resp, times)}
        <div class="pacekey"><span><i style="background:var(--good)"></i>Correct</span><span><i style="background:var(--bad)"></i>Wrong</span><span><i style="background:var(--rule)"></i>Blank</span></div>
        ${slowWrong.length ? `<div class="notice"><b>${slowWrong.length} question${slowWrong.length > 1 ? 's' : ''} took more than twice the even pace and still went wrong</b> (Q${slowWrong.map(x => x.it.n).join(', Q')}). In the real test, skip a question like this, flag it and come back at the end.</div>` : ''}
      </div>
    </div>` : ''}

    <div class="revhead"><h2>Every question, worked</h2>
      <label class="check"><input type="checkbox" data-act="onlyWrong" ${onlyWrong ? 'checked' : ''}> Show only my mistakes</label>
      <button class="btn small" data-act="openAll">Open all</button></div>
    ${groups.map(g => {
      const its = g.items.filter(it => !onlyWrong || resp[it.n] !== it.answer);
      if (!its.length) return '';
      return `${g.sec && g.sec.stimulus ? `<details class="rev passage"><summary><span class="n">§</span><span class="st">Text</span><span class="sq">${esc(g.sec.title)}: read the passage again</span></summary><div class="body">${renderStimulus(g.sec, -1, resp)}</div></details>` : ''}
      <div class="review">${its.map(it => {
        const given = resp[it.n];
        const cls = given == null ? 'skip' : given === it.answer ? 'ok' : 'no';
        const st = given == null ? 'Blank' : given === it.answer ? 'Correct' : 'Wrong';
        const rec = recordOf(it, p);
        const key = rec ? recKey(rec) : null;
        return `<details class="rev ${cls}"${S.openAll ? ' open' : ''}>
          <summary><span class="n">${it.n}</span><span class="st">${st}</span><span class="sq">${esc(plain(it.stem).slice(0, 110))}</span>
            <span class="counter">${given == null ? '—' : LETTERS[given]} → ${LETTERS[it.answer]}</span>${key && noteFor(key) ? '<span class="hasnote" title="You wrote a note">✎</span>' : ''}</summary>
          <div class="body"><div class="qhead"><span class="qnum">Question ${it.n}</span><span class="qtopic">${esc(it.fam || '')}</span></div>
            ${renderQuestionBody(it, given, true)}${renderFeedback(it, given, key)}</div>
        </details>`;
      }).join('')}</div>`;
    }).join('')}

    ${p.key ? `<div class="panel"><h2>Answer key</h2><div class="keystrip">${p.key.split('').map((c, i) => (i % 10 === 0 && i ? ' &nbsp;' : '') + c).join('')}</div></div>` : ''}
  </div>`;
}
