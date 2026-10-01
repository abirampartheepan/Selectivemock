/* ==========================================================================
   Written content registry. Each exam file calls defExam(id, {...}) with its
   five reading units, sixteen written Thinking Skills items and one writing
   task. Maths and the Thinking Skills puzzles are generated, so they need no
   entry here. The helpers below keep the exam files short and consistent.
   Explanations never name an option letter, because options are shuffled.
   ========================================================================== */
'use strict';

const CONTENT = {};
function defExam(id, c) { CONTENT[id] = c; }

/* Reasons may be written as [null, reason for each wrong option in order];
   this puts the null at the correct option. */
function alignWhys(whys, answer) {
  if (!whys || whys[answer] === null || whys[0] !== null) return whys || null;
  const reasons = whys.slice(1);
  const out = [];
  for (let i = 0, k = 0; i < whys.length; i++) out.push(i === answer ? null : reasons[k++]);
  return out;
}
/* one multiple-choice question */
function Q(stem, options, answer, explain, whys, extra) {
  return Object.assign({ stem, options, answer, explain, whys: alignWhys(whys, answer) }, extra || {});
}

/* Section 1: one or two extracts, 8 questions.
   o = { id, headnote, extracts:[{label, title?, paras}], glossary?, questions } */
function readS1(o) {
  const stimulus = [];
  if (o.headnote) stimulus.push({ kind: 'headnote', text: o.headnote });
  if (o.glossary) stimulus.push({ kind: 'glossary', items: o.glossary });
  o.extracts.forEach(e => {
    if (e.label) stimulus.push({ kind: 'label', text: e.label });
    if (e.title) stimulus.push({ kind: 'title', text: e.title });
    stimulus.push({ kind: 'prose', paras: e.paras });
  });
  return { id: o.id, type: 's1', stimulus, questions: o.questions };
}
/* Section 2: cloze, 8 gaps marked …(1)… in the text.
   o = { id, title, text, gaps:[[options, answer, explain, whys?], ...] } */
function readS2(o) {
  const stimulus = [{ kind: 'headnote', text: 'Read the text below. Eight words have been removed. Choose the word that best fits each gap.' }];
  if (o.title) stimulus.push({ kind: 'title', text: o.title });
  stimulus.push({ kind: 'cloze', text: o.text });
  return { id: o.id, type: 's2', stimulus,
    questions: o.gaps.map((g, i) => Q(`Which word best fits gap (${i + 1})?`, g[0], g[1], g[2], g[3] || null, { topic: 'vocabulary in context' })) };
}
/* Section 3: poem, 6 questions. o = { id, headnote, title, poet?, lines, questions } */
function readS3(o) {
  const stimulus = [];
  if (o.headnote) stimulus.push({ kind: 'headnote', text: o.headnote });
  if (o.title) stimulus.push({ kind: 'title', text: o.title });
  stimulus.push({ kind: 'verse', lines: o.lines });
  return { id: o.id, type: 's3', stimulus, questions: o.questions };
}
/* Section 4: gapped text with six removed sentences and seven choices.
   o = { id, title, paras (with ...(1)... markers), sentences[7], answers[6] (indexes into sentences), explains[6] } */
function readS4(o) {
  // list the seven sentences in a fixed shuffled order so the key is not A, B, C …
  const R = makeRng(hashSeed(o.id));
  const order = R.shuffle(o.sentences.map((_, i) => i));
  o = Object.assign({}, o, { sentences: order.map(i => o.sentences[i]), answers: o.answers.map(a => order.indexOf(a)) });
  const stimulus = [];
  if (o.title) stimulus.push({ kind: 'title', text: o.title });
  stimulus.push({ kind: 'gapped', paras: o.paras });
  stimulus.push({ kind: 'sentences', items: o.sentences });
  return { id: o.id, type: 's4', stimulus,
    questions: o.answers.map((a, i) => Q(`Which sentence best fits gap (${i + 1})?`, o.sentences.slice(), a, o.explains[i], null, { topic: 'text structure', optionStyle: 'sentences' })) };
}
/* Section 5: four extracts, ten statements. o = { id, headnote, extracts:[{title, paras}], items:[[statement, 'A'..'D', explain], ...] } */
function readS5(o) {
  const stimulus = [{ kind: 'headnote', text: o.headnote }];
  o.extracts.forEach((e, i) => stimulus.push({ kind: 'extract', letter: 'ABCD'[i], title: e.title, paras: e.paras }));
  return { id: o.id, type: 's5', stimulus,
    questions: o.items.map(([st, L, ex]) => Q(`Which extract ${st}`, ['A', 'B', 'C', 'D'], 'ABCD'.indexOf(L), ex, null, { optionStyle: 'letters', topic: 'matching' })) };
}

/* Thinking Skills written items */
function TS(role, passage, stem, options, answer, explain, whys) {
  return { role, passage, stem, options, answer, explain, whys: alignWhys(whys, answer) };
}
/* "Whose reasoning is correct?" — options always in the real paper's order */
function WR(passage, a, b, aOk, bOk, explain) {
  const options = [`${a} only`, `${b} only`, `Both ${a} and ${b}`, `Neither ${a} nor ${b}`];
  const answer = aOk && bOk ? 2 : aOk ? 0 : bOk ? 1 : 3;
  return { role: 'whose-reasoning', passage, stem: 'If the information in the box is true, whose reasoning is correct?', options, answer, explain, keepOrder: true,
    whys: options.map((o, i) => i === answer ? null : (i === 0 || i === 2) && !aOk ? `${a}'s conclusion does not have to follow` : (i === 1 || i === 2) && !bOk ? `${b}'s conclusion does not have to follow` : 'leaves out a conclusion that does follow') };
}
