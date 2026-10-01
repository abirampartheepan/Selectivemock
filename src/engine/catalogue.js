/* ==========================================================================
   Catalogue — the 100 fixed exams and how each test in an exam is built.

   An exam is Easy 1–40, Medium 1–40 or Hard 1–20. Every exam has the same four
   tests as the real paper. Building a test is deterministic: the same exam id
   always produces exactly the same questions in the same order, so a sitting
   can be stored as just its answers and rebuilt later for review.
   ========================================================================== */
'use strict';

const EXAMS = [];
TIER_ORDER.forEach(t => {
  const T = TIERS[t];
  for (let i = 1; i <= T.count; i++) {
    const id = T.prefix + String(i).padStart(2, '0');
    EXAMS.push({ id, tier: t, n: i, label: `${T.label} ${i}` });
  }
});
const EXAM_BY_ID = {};
EXAMS.forEach(e => { EXAM_BY_ID[e.id] = e; });
function examReady(id, module) {
  if (module === 'maths') return true;
  const c = CONTENT[id];
  if (!c) return false;
  if (module === 'reading') return !!(c.reading && c.reading.length === 5);
  if (module === 'thinking') return !!(c.thinking && c.thinking.length >= 16);
  if (module === 'writing') return !!c.writing;
  return false;
}
function examFullyReady(id) { return MODULE_ORDER.every(m => examReady(id, m)); }

/* ---------- topic families: how results are grouped ---------- */
const READING_FAMILY = {
  s1: 'Comparing texts', s2: 'Vocabulary in context', s3: 'Poetry',
  s4: 'Text structure', s5: 'Matching across extracts',
};
const TS_ROLE_FAMILY = {
  strengthen: 'Strengthen and weaken', weaken: 'Strengthen and weaken',
  flaw: 'Spotting the mistake', assumption: 'Assumptions and conclusions', conclusion: 'Assumptions and conclusions',
  'whose-reasoning': 'Whose reasoning is correct', 'must-follow': 'Whose reasoning is correct',
};
function famOfGen(g) { return g.fam || 'Problem solving'; }

/* ==========================================================================
   Mathematical Reasoning — 35 blueprint slots, quick items first
   ========================================================================== */
const MATH_SLOTS = ['time-convert', 'place-value', 'big-arith', 'decimals', 'units-measure', 'fraction-of', 'money', 'pattern',
  'factors', 'angles', 'symmetry', 'perimeter', 'statements', 'area', 'percent', 'ratio', 'rate', 'timetable', 'graph',
  'probability', 'counting', 'mean', 'fraction-ops', 'volume', 'solid-3d', 'algebra', 'unit-chain', 'best-buy', 'backwards',
  'lcm-hcf', 'composite-geo', 'positions', 'clock-calendar', 'multi-step', 'challenge'];
// how many of the opening slots each tier swaps for challenge problems
const MATH_SWAP = { easy: 0, medium: 6, hard: 15 };
function gensForSlot(slot) { return GEN.maths.filter(g => g.slot === slot); }

/* Per-question salts written by tools/dedupe.js so no question appears twice in the 100 exams. */
const SALT_TABLE = typeof SALTS !== 'undefined' ? SALTS : {};
function slotSeed(slotKey) { return hashSeed(slotKey + '|' + (SALT_TABLE[slotKey] || 0)); }
function examRng(id, module, salt) { return makeRng(hashSeed(id + '|' + module + '|' + (salt || 0))); }
function examIndex(id) { const e = EXAM_BY_ID[id]; return e ? e.n + (e.tier === 'medium' ? 100 : e.tier === 'hard' ? 200 : 0) : 0; }

function genItem(g, seed, level) {
  const it = g.gen(makeRng(seed), level);
  return {
    kind: 'gen', source: g.id, itemSeed: seed, genLevel: level,
    stem: it.stem, options: it.options, optionSvgs: it.optionSvgs || null,
    svg: it.svg || null, table: it.table || null, answer: it.answer, explain: it.explain,
    whys: it.whys || null, tags: it.tags || null,
    topic: g.topic, fam: famOfGen(g), optionStyle: it.optionSvgs ? 'figures' : 'text',
  };
}

function buildMathsExam(id, tier, salt) {
  const R = examRng(id, 'maths', salt);
  const idx = examIndex(id);
  const challenge = R.shuffle(gensForSlot('challenge-x'));
  const swap = MATH_SWAP[tier];
  const items = [];
  MATH_SLOTS.forEach((slot, si) => {
    let g;
    if (si < swap) g = challenge[si % challenge.length];
    else { const gs = gensForSlot(slot); g = gs[(idx + si) % gs.length]; }
    const slotKey = `${id}|maths|${si}`;
    const it = genItem(g, slotSeed(slotKey), tier);
    it.slotKey = slotKey;
    it.swapGroup = si < 12 ? 'm0' : si < 24 ? 'm1' : 'm2';
    items.push(it);
  });
  // Hard: move the challenge problems through the paper rather than all at the front
  if (tier === 'hard') {
    const ch = items.slice(0, swap), rest = items.slice(swap);
    const out = [];
    let c = 0, r = 0;
    for (let k = 0; k < items.length; k++) out.push((k % 2 === 0 && c < ch.length) || r >= rest.length ? ch[c++] : rest[r++]);
    items.length = 0; out.forEach(x => items.push(x));
  }
  items.forEach((it, i) => { it.n = i + 1; it.sectionIdx = 0; it.opts = 5; it.module = 'maths'; });
  return { module: 'maths', items, sections: [{ title: 'Mathematical Reasoning', from: 1, to: items.length, opts: 5 }] };
}

/* ==========================================================================
   Thinking Skills — 16 written critical-thinking items + 24 puzzles
   ========================================================================== */
const TS_PUZZLE_ORDER = ['ts-order-line', 'ts-exchange', 'ts-must-be-true', 'ts-letter-position', 'ts-cube-net', 'ts-token-piles',
  'ts-whose-formal', 'ts-circle', 'ts-cipher', 'ts-transform', 'ts-target', 'ts-switches', 'ts-venn', 'ts-which-question',
  'ts-paper-punch', 'ts-symbol-string', 'ts-liar', 'ts-word-chain', 'ts-transform', 'ts-tournament', 'ts-letter-cards',
  'ts-ages', 'ts-at-least', 'ts-whose-formal'];
// written (C) and puzzle (P) slots, interleaved as the real paper mixes them
const TS_PATTERN = 'PCPCPPCPCPPCPCPPCPCPPCPCPPCPCPPCPCPCPPCP'.split('');

function buildThinkingExam(id, tier, salt) {
  const R = examRng(id, 'thinking', salt);
  const written = (CONTENT[id] && CONTENT[id].thinking || []).slice(0, 16).map((q, k) => ({
    kind: 'static', source: id + '-ts-' + k, role: q.role,
    passage: q.passage || null, stem: q.stem, options: q.options.slice(), answer: q.answer, explain: q.explain,
    whys: q.whys || null, tags: q.whys ? q.whys.map(w => w ? 'logic' : null) : null,
    topic: q.role ? q.role.replace(/-/g, ' ') : 'critical thinking', fam: TS_ROLE_FAMILY[q.role] || 'Critical thinking',
    optionStyle: 'text', shufflable: q.role !== 'whose-reasoning' && !q.keepOrder,
  }));
  const gens = TS_PUZZLE_ORDER.map(gid => GEN.ts.find(g => g.id === gid)).filter(Boolean);
  const puzzles = gens.map((g, k) => { const slotKey = `${id}|thinking|${k}`; const it = genItem(g, slotSeed(slotKey), tier); it.slotKey = slotKey; return it; });
  const pz = R.shuffle(puzzles), wr = written.slice();
  const items = [];
  TS_PATTERN.forEach(c => {
    if (c === 'C' && wr.length) items.push(wr.shift());
    else if (pz.length) items.push(pz.shift());
    else if (wr.length) items.push(wr.shift());
  });
  while (wr.length) items.push(wr.shift());
  while (pz.length) items.push(pz.shift());
  items.forEach((it, i) => { it.n = i + 1; it.sectionIdx = 0; it.opts = 4; it.module = 'thinking'; it.swapGroup = it.kind === 'static' ? 'ct' : 'ps'; });
  return { module: 'thinking', items, sections: [{ title: 'Thinking Skills', from: 1, to: items.length, opts: 4 }] };
}

/* ==========================================================================
   Reading — five sections, as the real paper
   ========================================================================== */
const READING_SECTIONS = [
  { type: 's1', title: 'Section 1', n: 8, opts: 4, rubric: 'Read the extract(s), then answer questions {A}–{B}.' },
  { type: 's2', title: 'Section 2', n: 8, opts: 4, rubric: 'Each numbered box marks a gap in the text. Choose the word that best fits each gap. Click a number to jump to that question.' },
  { type: 's3', title: 'Section 3', n: 6, opts: 4, rubric: 'Read the poem, then answer questions {A}–{B}. Line numbers are printed every five lines.' },
  { type: 's4', title: 'Section 4', n: 6, opts: 7, rubric: 'Six sentences have been removed from the text. Choose the sentence (A–G) that fits each gap. There is one extra sentence you do not need.' },
  { type: 's5', title: 'Section 5', n: 10, opts: 4, rubric: 'Read the four extracts, then decide which extract each statement describes. An extract may be chosen more than once.' },
];
function buildReadingExam(id) {
  const units = CONTENT[id].reading;
  const items = [], sections = [];
  let n = 0;
  READING_SECTIONS.forEach((sd, si) => {
    const unit = units.find(u => u.type === sd.type) || units[si];
    const from = n + 1;
    const gapped = sd.type === 's2' || sd.type === 's4';
    unit.questions.forEach((q, qi) => {
      n++;
      const stem = gapped ? String(q.stem).replace(/gap\s*\(?(\d+)\)?/gi, (m, d) => 'gap ' + (from + parseInt(d, 10) - 1)) : q.stem;
      items.push({
        n, sectionIdx: si, opts: sd.opts, module: 'reading',
        stem, options: q.options.slice(), answer: q.answer, explain: q.explain,
        whys: q.whys || null, tags: q.whys ? q.whys.map(w => w ? 'misread' : null) : null,
        topic: q.topic || READING_FAMILY[sd.type],
        optionStyle: q.optionStyle || (sd.type === 's4' ? 'sentences' : sd.type === 's5' ? 'letters' : 'text'),
        gapIndex: gapped ? qi + 1 : null,
        source: unit.id, kind: 'read', qIndex: qi,
        swapGroup: sd.type === 's5' ? 's5' : null,
        fam: READING_FAMILY[sd.type],
        shufflable: (sd.type === 's2' || sd.type === 's1' || sd.type === 's3') && !orderedOptions(q.options) && !q.keepOrder,
      });
    });
    sections.push({
      title: sd.title, type: sd.type, unitId: unit.id, stimulus: unit.stimulus, from, to: n, opts: sd.opts,
      matching: sd.type === 's5', rubric: sd.rubric.replace('{A}', from).replace('{B}', n),
      sentences: (unit.stimulus.find(b => b.kind === 'sentences') || {}).items || null,
      sourceNote: unit.sourceNote || '',
    });
  });
  return { module: 'reading', items, sections };
}

/* ==========================================================================
   Assemble one test of one exam (cached), with an audited answer key
   ========================================================================== */
const _EXAM_CACHE = {};
function buildExamModule(id, module) {
  const key = id + '|' + module;
  if (_EXAM_CACHE[key]) return _EXAM_CACHE[key];
  const ex = EXAM_BY_ID[id];
  if (!ex || !examReady(id, module)) return null;
  let paper;
  if (module === 'writing') {
    paper = { module: 'writing', prompt: CONTENT[id].writing, items: [], sections: [] };
  } else {
    let best = null, bestScore = Infinity;
    for (let t = 0; t < 8; t++) {
      const p = module === 'maths' ? buildMathsExam(id, ex.tier, t) : module === 'thinking' ? buildThinkingExam(id, ex.tier, t) : buildReadingExam(id);
      const R = examRng(id, module + '-key', t);
      p.items.forEach(it => { if (it.shufflable) permuteOptions(it, R); });
      const audit = repairKey(p, SPEC[module].opts, R);
      const v = audit.hard.length * 100 + audit.soft.length;
      if (v < bestScore) { bestScore = v; best = { p, audit }; }
      if (audit.ok || module === 'reading') break;
    }
    paper = best.p;
    paper.audit = best.audit;
    paper.key = paper.items.map(i => LETTERS[i.answer]).join('');
  }
  paper.examId = id; paper.tier = ex.tier; paper.level = ex.tier; paper.mode = 'exam';
  paper.spec = SPEC[module]; paper.seed = id;
  _EXAM_CACHE[key] = paper;
  return paper;
}

/* ==========================================================================
   Marking
   ========================================================================== */
function mark(paper, responses) {
  let correct = 0, attempted = 0;
  const byTopic = {};
  paper.items.forEach(it => {
    const given = responses[it.n];
    const right = given != null && given === it.answer;
    if (given != null) attempted++;
    if (right) correct++;
    const t = it.fam || 'Other';
    const mod = it.module || paper.module;
    byTopic[mod + '·' + t] = byTopic[mod + '·' + t] || { topic: t, module: mod, right: 0, total: 0 };
    byTopic[mod + '·' + t].total++; if (right) byTopic[mod + '·' + t].right++;
  });
  const n = paper.items.length;
  return { correct, attempted, n, pct: n ? Math.round(correct / n * 100) : 0,
           topics: Object.values(byTopic).sort((a, b) => a.topic.localeCompare(b.topic)) };
}
const BANDS = [
  { min: 88, label: 'Excellent', note: 'The marks you lost are probably one or two specific gaps. Find them in the review below.' },
  { min: 74, label: 'Strong', note: 'A solid paper. The next marks usually come from timing on the last third.' },
  { min: 58, label: 'Developing', note: 'The middle of the paper is holding up. Work on the multi-step questions and on not losing easy marks early.' },
  { min: 40, label: 'Building', note: 'Work on one topic at a time from the breakdown below, rather than sitting more whole papers.' },
  { min: 0, label: 'Getting started', note: 'Read the explanation for every question you missed. That is worth more than another paper right now.' },
];
function band(pct) { return BANDS.find(b => pct >= b.min); }

/* ==========================================================================
   Records — the smallest thing that rebuilds one question exactly
     { kind:'exam', exam:'E07', module:'maths', n:12 }
     { kind:'gen',  source:<generator id>, itemSeed, genLevel }
   ========================================================================== */
function recordOf(it, paper) {
  if (it._rec) return it._rec;
  if (paper && paper.mode === 'exam') return { kind: 'exam', exam: paper.examId, module: paper.module, n: it.n };
  if (it.kind === 'gen') return { kind: 'gen', source: it.source, itemSeed: it.itemSeed, genLevel: it.genLevel };
  return null;
}
function recKey(r) { return r.kind === 'exam' ? `${r.exam}|${r.module}|${r.n}` : `gen|${r.source}|${r.itemSeed}|${r.genLevel}`; }
function allGens() { return GEN.maths.concat(GEN.ts); }
function materialise(rec) {
  if (rec.kind === 'exam') {
    const p = buildExamModule(rec.exam, rec.module);
    if (!p) return null;
    const it = p.items.find(x => x.n === rec.n);
    if (!it) return null;
    const sec = p.sections[it.sectionIdx];
    return Object.assign({}, it, { _rec: rec, _sec: sec && sec.stimulus ? sec : null, module: rec.module });
  }
  if (rec.kind === 'gen') {
    const g = allGens().find(x => x.id === rec.source);
    if (!g) return null;
    const it = genItem(g, rec.itemSeed, rec.genLevel || 'easy');
    const maths = GEN.maths.includes(g);
    return Object.assign(it, { _rec: rec, module: maths ? 'maths' : 'thinking', opts: maths ? 5 : 4 });
  }
  return null;
}

const PER_ITEM_SECONDS = { reading: 63, thinking: 60, maths: 69 };
/* A practice set from records (drills and redos). Reading questions bring
   their passage with them; questions sharing a passage are grouped. */
function buildSet(records, o) {
  o = o || {};
  const items = [], sections = [];
  const built = records.map(materialise).filter(Boolean);
  const groups = [];
  built.forEach(it => {
    const sk = it._sec ? it._rec.exam + '|' + it._rec.module + '|' + it._sec.unitId : null;
    let g = sk ? groups.find(x => x.key === sk) : null;
    if (!g) { g = { key: sk || 'loose-' + groups.length, sec: it._sec, items: [] }; groups.push(g); }
    g.items.push(it);
  });
  // passage groups first, loose questions after
  groups.sort((a, b) => (a.sec ? 0 : 1) - (b.sec ? 0 : 1));
  let n = 0;
  const loose = [];
  groups.forEach(g => {
    if (!g.sec) { loose.push.apply(loose, g.items); return; }
    const si = sections.length, from = n + 1;
    g.items.sort((a, b) => a.n - b.n).forEach(it => {
      n++;
      const orig = it.n;
      if (it.gapIndex != null) it.stem = String(it.stem).replace(/gap\s*\d+/i, 'gap ' + n);
      it.origN = orig; it.n = n; it.sectionIdx = si; items.push(it);
    });
    const s = g.sec;
    sections.push(Object.assign({}, s, { from, to: n, gapBase: s.from, title: s.title, rubric: s.rubric }));
  });
  if (loose.length) {
    const si = sections.length, from = n + 1;
    loose.forEach(it => { n++; it.origN = it.n; it.n = n; it.sectionIdx = si; items.push(it); });
    sections.push({ title: o.restTitle || 'Questions', from, to: n, opts: 4 });
  }
  if (!items.length) return null;
  const secs = items.reduce((s, it) => s + (PER_ITEM_SECONDS[it.module] || 60), 0);
  return {
    module: o.module || 'practice', items, sections, mode: o.mode || 'drill', level: o.level || 'easy',
    seed: o.seed || 1, audit: null, key: items.map(i => LETTERS[i.answer]).join(''),
    label: o.name, drillKey: o.drillKey || null,
    spec: { key: 'practice', name: o.name || 'Practice', short: o.short || 'Practice', n: items.length,
            minutes: Math.max(3, Math.ceil(secs / 60)), opts: 0 },
  };
}

/* ---------- drills: fresh generated questions on one topic family ---------- */
function drillFamilies() {
  const m = {};
  GEN.maths.forEach(g => { const k = 'maths·' + famOfGen(g); (m[k] = m[k] || { key: k, module: 'maths', family: famOfGen(g), gens: [] }).gens.push(g); });
  GEN.ts.forEach(g => { const k = 'thinking·' + famOfGen(g); (m[k] = m[k] || { key: k, module: 'thinking', family: famOfGen(g), gens: [] }).gens.push(g); });
  return Object.keys(m).sort().map(k => m[k]);
}
function assembleDrill(famKey, level, count, seed) {
  const f = drillFamilies().find(x => x.key === famKey);
  if (!f) return null;
  const R = makeRng(seed);
  const gens = R.shuffle(f.gens);
  const recs = [];
  for (let i = 0; i < count; i++) recs.push({ kind: 'gen', source: gens[i % gens.length].id, itemSeed: R.int(1, 2 ** 30), genLevel: level });
  return buildSet(recs, { mode: 'drill', module: f.module, level, seed, name: f.family, short: f.family, restTitle: f.family, drillKey: famKey });
}
