/* ==========================================================================
   Thinking Skills — logic puzzles. Every puzzle here is checked by a small
   brute-force solver, so the keyed answer is the only one that fits.
   ========================================================================== */
'use strict';

function perms(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((x, i) => perms(arr.slice(0, i).concat(arr.slice(i + 1))).forEach(p => out.push([x].concat(p))));
  return out;
}

/* Four-option builder for TS: correct first, then three wrongs, shuffled unless keep */
function opts4(R, correct, wrongs, keep) {
  return textOpts(R, correct, wrongs, { n: 4, order: keep ? 'keep' : 'shuffle' });
}
const WHOSE = (a, b) => [`${a} only`, `${b} only`, `Both ${a} and ${b}`, `Neither ${a} nor ${b}`];
function whoseOpts(a, b, va, vb) {
  const opts = WHOSE(a, b);
  const ans = va && vb ? 2 : va ? 0 : vb ? 1 : 3;
  return { options: opts, answer: ans,
    whys: opts.map((o, i) => i === ans ? null : 'misjudges whether one of the claims must follow'),
    tags: opts.map((o, i) => i === ans ? null : 'logic') };
}

/* ---- ordering in a line ---- */
const ORDER_CTX = [
  { things: 'stations', set: ['Anjar', 'Kavali', 'Wadi', 'Gadarpur', 'Bindoon', 'Corrie'], intro: (n) => `A train stops at ${n} stations on its journey.`, pos: 'stop', before: 'the train stops at {X} before {Y}', ask: 'Which station is the {k} stop?' },
  { things: 'runners', set: null, intro: (n) => `${words(n).replace(/^./, c => c.toUpperCase())} friends ran a race. There were no ties.`, pos: 'place', before: '{X} finished ahead of {Y}', ask: 'Who finished {k}?' },
  { things: 'lockers', set: null, intro: (n) => `${words(n).replace(/^./, c => c.toUpperCase())} students have lockers in a single row, numbered 1 to ${n} from left to right.`, pos: 'locker', before: "{X}'s locker is to the left of {Y}'s", ask: 'Whose locker is number {k}?' },
];
defTS({ id: 'ts-order-line', topic: 'ordering', fam: 'Logic and deduction',
  gen(R, level) {
    const n = byLevel(level, 5, 5, 6);
    const ctx = R.pick(ORDER_CTX);
    const items = ctx.set ? R.sample(ctx.set, n) : names(R, n);
    const truth = R.shuffle(items);
    const P = x => truth.indexOf(x);
    const all = perms(items);
    // clue factory
    const makeClue = () => {
      const t = R.int(0, byLevel(level, 3, 4, 5));
      const [a, b, c] = R.sample(items, 3);
      if (t === 0) return P(a) < P(b) ? { s: ctx.before.replace('{X}', a).replace('{Y}', b), f: p => p.indexOf(a) < p.indexOf(b) } : null;
      if (t === 1) return Math.abs(P(a) - P(b)) === 1 ? { s: ctx.things === 'stations' ? `${a} and ${b} are next to each other on the line` : `${a} and ${b} were next to each other`.replace('were next to each other', ctx.things === 'lockers' ? "have lockers next to each other" : 'finished next to each other'), f: p => Math.abs(p.indexOf(a) - p.indexOf(b)) === 1 } : null;
      if (t === 2) return (P(a) - P(b)) * (P(a) - P(c)) < 0 ? { s: `${a} is somewhere between ${b} and ${c}`, f: p => (p.indexOf(a) - p.indexOf(b)) * (p.indexOf(a) - p.indexOf(c)) < 0 } : null;
      if (t === 3) return P(a) !== 0 && P(a) !== n - 1 ? { s: `${a} is neither first nor last`, f: p => p.indexOf(a) !== 0 && p.indexOf(a) !== n - 1 } : null;
      if (t === 4) { const g = Math.abs(P(a) - P(b)) - 1; return g >= 1 ? { s: `there ${g === 1 ? 'is exactly one' : 'are exactly ' + words(g)} ${ctx.things === 'stations' ? 'station' : ctx.things === 'lockers' ? 'locker' : 'runner'}${g === 1 ? '' : 's'} between ${a} and ${b}`, f: p => Math.abs(p.indexOf(a) - p.indexOf(b)) - 1 === g } : null; }
      const imm = ctx.things === 'stations' ? `the train stops at ${a} immediately after ${b}` : ctx.things === 'lockers' ? `${a}'s locker is immediately to the right of ${b}'s` : `${a} finished immediately behind ${b}`;
      return P(a) === P(b) + 1 ? { s: imm, f: p => p.indexOf(a) === p.indexOf(b) + 1 } : null;
    };
    const k = R.int(1, n - 2);
    const askPos = k;
    let clues = [], pool = all, guard = 0;
    // add clues until the asked position is fixed (but whole order may stay open on hard)
    while (guard++ < 300) {
      const c = makeClue(); if (!c || clues.some(x => x.s === c.s)) continue;
      const np = pool.filter(c.f);
      if (np.length === pool.length) continue;
      clues.push(c); pool = np;
      const vals = new Set(pool.map(p => p[askPos]));
      if (vals.size === 1) break;
    }
    if (new Set(pool.map(p => p[askPos])).size !== 1 || clues.length > 6 || clues.length < 2) return this.gen(R, level);
    const ans = truth[askPos];
    const wrong = R.shuffle(items.filter(x => x !== ans)).slice(0, 3).map(x => ({ s: x, why: 'fits some of the clues but not all of them', tag: 'logic' }));
    const built = opts4(R, ans, wrong);
    const first = ctx.things === 'stations' ? ' The first stop is at the start of the line.' : '';
    return item(`${ctx.intro(n)}${first}<br>${clues.map(c => '• ' + cap(c.s) + '.').join('<br>')}<br>${ctx.ask.replace('{k}', ctx.things === 'lockers' ? String(askPos + 1) : ordinal(askPos + 1))}`, built,
      `Using every clue, the ${ctx.things === 'lockers' ? 'locker in position ' + (askPos + 1) : ordinal(askPos + 1) + ' place'} must be ${ans}.${pool.length === 1 ? ' The full order is ' + truth.join(', ') + '.' : ' The other positions are not all fixed, but this one is.'}`);
  } });

/* ---- seating round a circle (clockwise wording avoids any left/right doubt) ---- */
defTS({ id: 'ts-circle', topic: 'arrangements', fam: 'Logic and deduction',
  gen(R, level) {
    const n = 6;
    const ppl = names(R, n);
    const truth = R.shuffle(ppl);
    const S = x => truth.indexOf(x);
    const cw = (a, k) => truth[(S(a) + k) % n];
    // arrangements with ppl[0] fixed at seat 0 (rotations are the same seating)
    const rest = perms(ppl.slice(1)).map(p => [ppl[0]].concat(p));
    const align = arr => arr; // seat indices relative to ppl[0]
    const rel = (arr, x) => arr.indexOf(x);
    const mk = () => {
      const t = R.int(0, 3);
      const [a, b] = R.sample(ppl, 2);
      const d = ((S(b) - S(a)) % n + n) % n;
      if (t === 0 && d === 3) return { s: `${a} sits directly opposite ${b}`, f: p => ((rel(p, b) - rel(p, a)) % n + n) % n === 3 };
      if (t === 1 && (d === 1 || d === 5)) return { s: `${a} sits next to ${b}`, f: p => { const e = ((rel(p, b) - rel(p, a)) % n + n) % n; return e === 1 || e === 5; } };
      if (t === 2 && d === 1) return { s: `${b} sits in the next seat clockwise from ${a}`, f: p => ((rel(p, b) - rel(p, a)) % n + n) % n === 1 };
      if (t === 3 && d === 2) return { s: `${b} sits two seats clockwise from ${a}`, f: p => ((rel(p, b) - rel(p, a)) % n + n) % n === 2 };
      if (t === 3 && d !== 1 && d !== 5) return { s: `${a} does not sit next to ${b}`, f: p => { const e = ((rel(p, b) - rel(p, a)) % n + n) % n; return e !== 1 && e !== 5; } };
      return null;
    };
    const [qa] = R.sample(ppl, 1);
    const qType = R.int(0, 1);
    const ansOf = p => qType === 0 ? p[(rel(p, qa) + 3) % n] : p[(rel(p, qa) + 1) % n];
    let pool = rest.map(align), clues = [], guard = 0;
    while (guard++ < 400) {
      const c = mk(); if (!c || clues.some(x => x.s === c.s)) continue;
      const np = pool.filter(c.f); if (np.length === pool.length) continue;
      clues.push(c); pool = np;
      if (new Set(pool.map(ansOf)).size === 1) break;
    }
    if (new Set(pool.map(ansOf)).size !== 1 || clues.length < 2 || clues.length > 6) return this.gen(R, level);
    const ans = ansOf(pool[0]);
    const built = opts4(R, ans, R.shuffle(ppl.filter(x => x !== ans && x !== qa)).slice(0, 3).map(x => ({ s: x, why: 'is consistent with some clues but not all', tag: 'logic' })));
    return item(`Six friends sit evenly spaced around a round table.<br>${clues.map(c => '• ' + cap(c.s) + '.').join('<br>')}<br>${qType === 0 ? `Who sits directly opposite ${qa}?` : `Who sits in the next seat clockwise from ${qa}?`}`, built,
      `Place one person first and fit the others round using each clue. Every arrangement that fits all the clues puts ${ans} ${qType === 0 ? 'opposite' : 'next clockwise from'} ${qa}.`);
  } });

/* ---- conditional logic over properties: must be true / cannot be true ---- */
const PROP_CTX = [
  { who: 'parrot', group: 'A bird sanctuary has some parrots. Staff record which treats each parrot eats.', props: ['eats apples', 'eats carrots', 'eats melon', 'eats peas', 'eats seeds'], neg: ['does not eat apples', 'does not eat carrots', 'does not eat melon', 'does not eat peas', 'does not eat seeds'], names: ['Cliff', 'Echo', 'Muse', 'Sky', 'Pip'] },
  { who: 'student', group: 'At a school camp, every student chooses some activities.', props: ['goes kayaking', 'goes climbing', 'does archery', 'goes bushwalking', 'does craft'], neg: ['does not go kayaking', 'does not go climbing', 'does not do archery', 'does not go bushwalking', 'does not do craft'], names: null },
  { who: 'member', group: 'Members of a music club each play some instruments.', props: ['plays piano', 'plays violin', 'plays drums', 'plays guitar', 'plays flute'], neg: ['does not play piano', 'does not play violin', 'does not play drums', 'does not play guitar', 'does not play flute'], names: null },
];
function ruleText(ctx, r) {
  // r: [i, vi, j, vj] means: if (prop i is vi) then (prop j is vj)
  const [i, vi, j, vj] = r;
  const rel = ctx.who === 'parrot' ? 'that' : 'who';
  if (vi && vj) return `Every ${ctx.who} ${rel} ${ctx.props[i]} also ${ctx.props[j]}`;
  if (vi && !vj) return `No ${ctx.who} ${rel} ${ctx.props[i]} ${ctx.props[j]}`;
  if (!vi && !vj) return `Any ${ctx.who} ${rel} ${ctx.neg[i]} ${ctx.neg[j]} either`;
  return `Every ${ctx.who} ${rel} ${ctx.neg[i]} ${ctx.props[j]}`;
}
function holds(rules, a) { return rules.every(([i, vi, j, vj]) => !(a[i] === vi) || a[j] === vj); }
function assignments(k) { const out = []; for (let m = 0; m < (1 << k); m++) out.push(range(0, k - 1).map(i => !!(m & (1 << i)))); return out; }
defTS({ id: 'ts-must-be-true', topic: 'conditional logic', fam: 'Logic and deduction',
  gen(R, level) {
    const ctx = R.pick(PROP_CTX);
    const k = byLevel(level, 4, 4, 5);
    const idx = R.shuffle(range(0, 4)).slice(0, k);
    const ctxK = { who: ctx.who, props: idx.map(i => ctx.props[i]), neg: idx.map(i => ctx.neg[i]) };
    // chain rules: 0→1, 1→2, and 1 → not 3 (plus 4th for hard)
    const rules = [[0, true, 1, true], [1, true, 2, true], [1, true, 3, false]];
    if (k === 5) rules.push([4, false, 0, false]);
    const valid = assignments(k).filter(a => holds(rules, a));
    const mustHold = st => valid.every(a => !(a[st[0]] === st[1]) || a[st[2]] === st[3]);
    const cannotBe = st => valid.every(a => !(a[st[0]] === st[1] && a[st[2]] === st[3]));
    const nm = ctx.names ? R.sample(ctx.names, 4) : names(R, 4);
    const ask = level === 'hard' && R.chance(0.5) ? 'cannot' : 'must';
    const lit = (i, v) => v ? ctxK.props[i] : ctxK.neg[i];
    const cands = [];
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) if (i !== j) for (const vi of [true, false]) for (const vj of [true, false]) {
      const st = [i, vi, j, vj];
      cands.push({ st, good: ask === 'must' ? mustHold(st) : cannotBe(st) });
    }
    // avoid statements that are just a rule restated
    const isRule = st => rules.some(r => r.join() === st.join());
    const goods = cands.filter(c => c.good && !isRule(c.st) && !(ask === 'must' && c.st[1] === false && c.st[3] === false && rules.some(r => r[0] === c.st[2] && r[2] === c.st[0])));
    const bads = cands.filter(c => !c.good);
    if (!goods.length || bads.length < 3) return this.gen(R, level);
    const g = R.pick(goods);
    const bs = R.sample(bads, 3);
    const say = (c, n) => ask === 'must' ? `If ${n} ${lit(c.st[0], c.st[1])}, then ${n} ${lit(c.st[2], c.st[3])}.` : `${n} ${lit(c.st[0], c.st[1])} and ${lit(c.st[2], c.st[3])}.`;
    const built = opts4(R, say(g, nm[0]), bs.map((b, i) => ({ s: say(b, nm[i + 1]), why: ask === 'must' ? 'could be false without breaking any rule' : 'is possible without breaking any rule', tag: 'logic' })));
    const ruleLines = rules.map(r => '• ' + ruleText(ctxK, r) + '.');
    return item(`${ctx.group}<br>${ruleLines.join('<br>')}<br>Based on this information, which one of the following ${ask === 'must' ? 'must be true' : 'cannot be true'}?`, built,
      ask === 'must' ? `Follow the chain of rules: ${say(g, nm[0])} Each of the other statements could fail without breaking a rule.` : `${say(g, nm[0])} That would break the rules. Each of the other combinations is allowed.`);
  } });

/* ---- whose reasoning is correct (formal rules) ---- */
defTS({ id: 'ts-whose-formal', topic: 'evaluating reasoning', fam: 'Logic and deduction',
  gen(R, level) {
    const [A, B] = names(R, 2);
    const v = R.int(0, 2);
    if (v === 0) {
      // voting: plurality with V voters, M choices
      const M = R.int(3, 6), V = R.int(M * 3, M * 6);
      const minWin = Math.ceil((V + M - 1) / M);
      const claimMin = minWin + R.pick([-1, 0, 0, 1]);
      const sure = Math.floor(V / 2) + 1 + R.pick([-1, 0, 0, 1]);
      const vA = claimMin <= minWin; // "will need at least claimMin votes" is true if claimMin <= minWin
      const vB = sure > V - sure;
      const built = whoseOpts(A, B, vA, vB);
      return item(`At a club meeting every member gets one vote on which game to play, and everyone must vote. The game with the most votes is played. This evening there are ${V} members and ${M} games to choose from, and there is no tie for the most votes.<br>${A}: “The game we play will need at least ${claimMin} votes.”<br>${B}: “If a game gets ${sure} votes, we will definitely play it.”<br>If the information is true, whose reasoning is correct?`, built,
        `The fewest votes that can still be the most is ${minWin} (spread the rest as evenly as possible), so ${A} is ${vA ? 'right' : 'wrong'}. A game with ${sure} votes leaves ${V - sure} for the others, so it ${vB ? 'must' : 'need not'} be the most: ${B} is ${vB ? 'right' : 'wrong'}.`);
    }
    if (v === 1) {
      // rule: only if / if-then with a valid and invalid inference
      const ctx = R.pick([
        { rule: (x) => `Students may go to the excursion only if they have returned a signed permission note.`, P: 'goes on the excursion', Q: 'returned a signed note' },
        { rule: (x) => `Players can join the team only if they have been to at least three training sessions.`, P: 'joined the team', Q: 'been to at least three training sessions' },
        { rule: (x) => `Anyone who wins a heat goes through to the final.`, P: 'won a heat', Q: 'goes through to the final', direct: true },
      ]);
      const [X, Y] = names(R, 2);
      // inferences: modus ponens / tollens (valid), affirming consequent / denying antecedent (invalid)
      const forms = ctx.direct ? [
        { s: `${X} won a heat, so ${X} goes through to the final.`, v: true },
        { s: `${X} did not go through to the final, so ${X} cannot have won a heat.`, v: true },
        { s: `${X} goes through to the final, so ${X} must have won a heat.`, v: false },
        { s: `${X} did not win a heat, so ${X} will not go through to the final.`, v: false },
      ] : [
        { s: `${X} ${ctx.P.replace('goes', 'went')}, so ${X} must have ${ctx.Q.replace(/^been/, 'been')}.`, v: true },
        { s: `${X} has not ${ctx.Q.replace(/^returned/, 'returned')}, so ${X} cannot have ${ctx.P.replace('goes on', 'gone on').replace('joined', 'joined')}.`, v: true },
        { s: `${X} has ${ctx.Q}, so ${X} will definitely ${ctx.P.replace('goes on', 'go on').replace('joined', 'join')}.`, v: false },
        { s: `${X} did not ${ctx.P.replace('goes on', 'go on').replace('joined', 'join')}, so ${X} cannot have ${ctx.Q}.`, v: false },
      ];
      const [f1, f2] = R.sample(forms, 2);
      const built = whoseOpts(A, B, f1.v, f2.v);
      return item(`${ctx.rule()}<br>${A}: “${f1.s}”<br>${B}: “${f2.s.replace(new RegExp(X, 'g'), Y)}”<br>If the information is true, whose reasoning is correct?`, built,
        `${A}'s reasoning ${f1.v ? 'follows from the rule' : 'does not follow: the rule works in one direction only'}. ${B}'s reasoning ${f2.v ? 'follows from the rule' : 'does not follow: the rule works in one direction only'}.`);
    }
    // property chain with two claims
    const ctx = R.pick(PROP_CTX);
    const ctxK = { who: ctx.who, props: ctx.props.slice(0, 4), neg: ctx.neg.slice(0, 4) };
    const rules = [[0, true, 1, true], [2, true, 1, true], [1, true, 3, false]];
    const valid = assignments(4).filter(a => holds(rules, a));
    const mustHold = st => valid.every(a => !(a[st[0]] === st[1]) || a[st[2]] === st[3]);
    const lit = (i, val) => val ? ctxK.props[i] : ctxK.neg[i];
    const cands = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j) for (const vi of [true, false]) for (const vj of [true, false]) cands.push([i, vi, j, vj]);
    const [X, Y] = ctx.names ? R.sample(ctx.names, 2) : names(R, 2);
    const pickC = want => R.pick(cands.filter(c => mustHold(c) === want && !rules.some(r => r.join() === c.join())));
    const vA = R.chance(0.5), vB = R.chance(0.5);
    const c1 = pickC(vA), c2 = pickC(vB);
    const built = whoseOpts(A, B, vA, vB);
    return item(`${ctx.group}<br>${rules.map(r => '• ' + ruleText(ctxK, r) + '.').join('<br>')}<br>${A}: “${X} ${lit(c1[0], c1[1])}, so ${X} must ${lit(c1[2], c1[3]).replace(/^(eats|goes|does|plays) /, (m, v) => ({ eats: 'eat ', goes: 'go ', does: 'do ', plays: 'play ' })[v]).replace(/^does not /, 'not ')}.”<br>${B}: “${Y} ${lit(c2[0], c2[1])}, so ${Y} must ${lit(c2[2], c2[3]).replace(/^(eats|goes|does|plays) /, (m, v) => ({ eats: 'eat ', goes: 'go ', does: 'do ', plays: 'play ' })[v]).replace(/^does not /, 'not ')}.”<br>If the information is true, whose reasoning is correct?`, built,
      `${A}'s conclusion ${vA ? 'must follow from the rules' : 'could be false without breaking a rule'}; ${B}'s conclusion ${vB ? 'must follow from the rules' : 'could be false without breaking a rule'}.`);
  } });

/* ---- which question would let you deduce the order ---- */
defTS({ id: 'ts-which-question', topic: 'deduction', fam: 'Logic and deduction',
  gen(R, level) {
    const pics = R.sample(['bell', 'book', 'apple', 'cat', 'key', 'star', 'boat', 'clock'], 4);
    const truth = R.shuffle(pics);
    const all = perms(pics);
    const P = (p, x) => p.indexOf(x);
    const mk = () => {
      const [a, b, c] = R.sample(pics, 3);
      const t = R.int(0, 2);
      if (t === 0 && Math.abs(P(truth, a) - P(truth, b)) === 1) return { s: `The ${a} is next to the ${b}.`, f: p => Math.abs(P(p, a) - P(p, b)) === 1 };
      if (t === 1 && P(truth, a) > P(truth, b)) return { s: `The ${a} is somewhere to the right of the ${b}.`, f: p => P(p, a) > P(p, b) };
      if (t === 2 && (P(truth, a) - P(truth, b)) * (P(truth, a) - P(truth, c)) < 0) return { s: `The ${a} is somewhere between the ${b} and the ${c}.`, f: p => (P(p, a) - P(p, b)) * (P(p, a) - P(p, c)) < 0 };
      return null;
    };
    let pool = all, clues = [], guard = 0;
    while (guard++ < 300 && pool.length > byLevel(level, 3, 4, 4)) {
      const c = mk(); if (!c || clues.some(x => x.s === c.s)) continue;
      const np = pool.filter(c.f); if (np.length === pool.length || np.length < 2) continue;
      clues.push(c); pool = np;
    }
    if (pool.length < 2 || pool.length > 5 || clues.length < 2) return this.gen(R, level);
    // candidate questions: "Is the X next to the Y?" / "Is the X to the left of the Y?"
    const qs = [];
    pics.forEach(a => pics.forEach(b => {
      if (a < b) qs.push({ s: `Is the ${a} next to the ${b}?`, f: p => Math.abs(P(p, a) - P(p, b)) === 1 });
      if (a !== b) qs.push({ s: `Is the ${a} to the left of the ${b}?`, f: p => P(p, a) < P(p, b) });
    }));
    const works = q => { const yes = pool.filter(q.f), no = pool.filter(p => !q.f(p)); return yes.length <= 1 && no.length <= 1 && yes.length + no.length === pool.length && pool.length === 2 || (yes.length === 1 && no.length === 1); };
    const good = qs.filter(works), bad = qs.filter(q => !works(q) && pool.some(q.f) && pool.some(p => !q.f(p)));
    const useless = qs.filter(q => pool.every(q.f) || pool.every(p => !q.f(p)));
    if (!good.length || bad.length + useless.length < 3) return this.gen(R, level);
    const g = R.pick(good);
    const wrongs = R.shuffle(bad).slice(0, 2).concat(R.shuffle(useless)).slice(0, 3).map(q => ({ s: q.s, why: pool.every(q.f) || pool.every(p => !q.f(p)) ? 'has an answer you already know from the clues' : 'leaves more than one order possible for one of its answers', tag: 'logic' }));
    if (wrongs.length < 3) return this.gen(R, level);
    const built = opts4(R, g.s, wrongs);
    return item(`The code to open a door is a row of four pictures: ${listAnd(pics.map(p => 'a ' + p))}. You have these clues:<br>${clues.map(c => '• ' + c.s).join('<br>')}<br>You may ask one yes-or-no question. Which question would let you work out the code, whatever the answer?`, built,
      `The clues leave ${pool.length} possible orders: ${pool.map(p => p.join('–')).join('; ')}. "${g.s}" has a different answer for each of them, so either answer fixes the code.`);
  } });

/* ---- exactly one liar ---- */
defTS({ id: 'ts-liar', topic: 'truth and lies', fam: 'Logic and deduction',
  gen(R, level) {
    const ppl = names(R, byLevel(level, 3, 4, 4));
    const culprit = R.pick(ppl);
    const deed = R.pick(['ate the last biscuit', 'broke the window', 'left the gate open', 'hid the ball']);
    const nLiars = byLevel(level, 1, 1, R.pick([1, 2]));
    const stTypes = (sp) => {
      const o = R.pick(ppl.filter(x => x !== sp));
      return R.pick([
        { s: `“${o} did it.”`, f: c => c === o },
        { s: `“I did not do it.”`, f: c => c !== sp },
        { s: `“${o} did not do it.”`, f: c => c !== o },
        { s: `“It was either ${o} or me.”`, f: c => c === o || c === sp },
      ]);
    };
    let statements, ok = false;
    for (let t = 0; t < 200 && !ok; t++) {
      statements = ppl.map(sp => ({ sp, ...stTypes(sp) }));
      // number of liars under each culprit hypothesis
      const sols = ppl.filter(c => statements.filter(s => !s.f(c)).length === nLiars);
      ok = sols.length === 1 && sols[0] === culprit;
    }
    if (!ok) return this.gen(R, level);
    const built = opts4(R, culprit, ppl.filter(x => x !== culprit).slice(0, 3).map(x => ({ s: x, why: `would make ${nLiars === 1 ? 'a different number of people' : 'the wrong number of people'} lie`, tag: 'logic' })));
    while (built.options.length < 4) built.options.push('It cannot be worked out'), built.whys.push('one person is consistent with the statements'), built.tags.push('logic');
    return item(`Someone ${deed}. Each person made one statement, and exactly ${nLiars === 1 ? 'one of them is' : 'two of them are'} lying.<br>${statements.map(s => `${s.sp}: ${s.s}`).join('<br>')}<br>Who ${deed}?`, built,
      `Try each person as the culprit and count the false statements. Only when ${culprit} is the culprit ${nLiars === 1 ? 'is exactly one statement' : 'are exactly two statements'} false.`);
  } });

/* ---- round-robin points table ---- */
defTS({ id: 'ts-tournament', topic: 'tournament tables', fam: 'Logic and deduction',
  gen(R, level) {
    const teams = R.sample(['Lions', 'Hawks', 'Sharks', 'Wolves', 'Bears'], 4);
    const pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    const res = pairs.map(() => R.int(0, 2)); // 0 first wins, 1 draw, 2 second wins
    const pts = r => { const p = [0, 0, 0, 0]; pairs.forEach(([a, b], i) => { if (r[i] === 0) p[a] += 3; else if (r[i] === 2) p[b] += 3; else { p[a]++; p[b]++; } }); return p; };
    const P = pts(res);
    const all = [];
    for (let m = 0; m < 729; m++) { const r = []; let x = m; for (let i = 0; i < 6; i++) { r.push(x % 3); x = Math.floor(x / 3); } all.push(r); }
    const match = all.filter(r => pts(r).join() === P.join());
    const q = R.int(0, 1);
    const ansOf = r => q === 0 ? r.filter(x => x === 1).length : (() => { const [a, b] = pairs[0]; return r[0]; })();
    const vals = new Set(match.map(r => q === 0 ? r.filter(x => x === 1).length : r[0]));
    if (vals.size !== 1) return this.gen(R, level);
    const draws = res.filter(x => x === 1).length;
    if (q === 0) {
      const built = opts4(R, String(draws), [0, 1, 2, 3, 4, 5].filter(x => x !== draws).slice(0, 3).map(x => ({ s: String(x), why: 'does not give these points totals', tag: 'logic' })));
      const ord = built.options.map(Number).map((v, i) => i).sort((a, b) => Number(built.options[a]) - Number(built.options[b]));
      const b2 = { options: ord.map(i => built.options[i]), answer: ord.indexOf(built.answer), whys: ord.map(i => built.whys[i]), tags: ord.map(i => built.tags[i]) };
      return item(`Four teams each played each other once. A win scored 3 points, a draw 1 point and a loss 0 points. The final points were: ${teams.map((t, i) => `${t} ${P[i]}`).join(', ')}. How many of the matches were draws?`, b2,
        `There were 6 matches. Each win adds 3 points to the total and each draw adds 2. The total is ${sum(P)}, so 3 × wins + 2 × draws = ${sum(P)} with wins + draws = 6, giving ${draws} draw${draws === 1 ? '' : 's'}.`);
    }
    const outcome = r => r[0] === 0 ? `${teams[0]} beat ${teams[1]}` : r[0] === 2 ? `${teams[1]} beat ${teams[0]}` : `${teams[0]} and ${teams[1]} drew`;
    const ans = outcome(res);
    const wrongs = [`${teams[0]} beat ${teams[1]}`, `${teams[1]} beat ${teams[0]}`, `${teams[0]} and ${teams[1]} drew`, 'It cannot be worked out'].filter(s => s !== ans).map(s => ({ s, why: 'does not fit the points table', tag: 'logic' }));
    const built = textOpts(R, ans, wrongs, { n: 4, order: 'keep' });
    return item(`Four teams each played each other once. A win scored 3 points, a draw 1 point and a loss 0 points. The final points were: ${teams.map((t, i) => `${t} ${P[i]}`).join(', ')}. What was the result of the match between ${teams[0]} and ${teams[1]}?`, built,
      `Work out how each team could have reached its total. Every way of getting these totals has the same result in this match: ${ans}.`);
  } });

/* ---- switches and lights ---- */
defTS({ id: 'ts-switches', topic: 'switches and states', fam: 'Logic and deduction',
  gen(R, level) {
    const lights = ['red', 'green', 'blue', 'yellow'];
    const ns = byLevel(level, 3, 3, 4);
    let ctrl;
    for (let t = 0; t < 100; t++) {
      ctrl = range(1, ns).map(() => lights.filter(() => R.chance(0.45)));
      if (ctrl.every(c => c.length >= 1) && lights.every(l => ctrl.some(c => c.includes(l)))) break;
    }
    const states = [];
    for (let m = 0; m < (1 << ns); m++) {
      const on = new Set();
      ctrl.forEach((c, i) => { if (m & (1 << i)) c.forEach(l => { if (on.has(l)) on.delete(l); else on.add(l); }); });
      states.push(on);
    }
    const st = [
      { s: 'It is possible to have all four lights on.', v: states.some(o => o.size === 4) },
      ...lights.flatMap(a => lights.filter(b => b !== a).map(b => ({ s: `The ${a} light cannot be on when the ${b} light is on.`, v: !states.some(o => o.has(a) && o.has(b)) }))),
      ...lights.flatMap(a => lights.filter(b => b !== a).map(b => ({ s: `Whenever the ${a} light is on, the ${b} light is also on.`, v: states.every(o => !o.has(a) || o.has(b)) }))),
    ];
    const tr = st.filter(x => x.v), fa = st.filter(x => !x.v);
    if (!tr.length || fa.length < 3) return this.gen(R, level);
    const g = R.pick(tr);
    const built = opts4(R, g.s, R.sample(fa, 3).map(x => ({ s: x.s, why: 'fails for at least one setting of the switches', tag: 'logic' })));
    return item(`Some switches control a set of four lights. Changing a switch changes every light it controls (off to on, or on to off).<br>${ctrl.map((c, i) => `• Switch ${i + 1} controls the ${listAnd(c)} light${c.length > 1 ? 's' : ''}.`).join('<br>')}<br>When all the switches are off, all the lights are off. Which one of the following is true?`, built,
      g.s.startsWith('It is possible') ? `List what each combination of switches does. Turning on ${(() => { for (let m = 0; m < (1 << ns); m++) if (states[m].size === 4) return 'switches ' + listAnd(range(1, ns).filter(i => m & (1 << (i - 1))).map(String)); return ''; })()} lights all four. Each of the other statements fails for at least one combination.`
        : `List what each combination of switches does. "${g.s}" holds in every case, and each of the other statements fails for at least one combination.`);
  } });
