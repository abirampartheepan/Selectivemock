/* ==========================================================================
   Thinking Skills — number and code puzzles (four options, A–D)
   ========================================================================== */
'use strict';

function numOpts4(R, correct, cands, o) { return numOpts(R, correct, cands, Object.assign({ n: 4 }, o || {})); }

/* ---- letters counted from a daily starting position ---- */
defTS({ id: 'ts-letter-position', topic: 'codes', fam: 'Number and code puzzles',
  gen(R, level) {
    const sentences = ['Only members will be allowed in.', 'Every good plan begins with a question.', 'Bring your own lunch on Friday.',
      'The quickest route is not always the shortest.', 'Please knock twice before entering.', 'Silence is golden in the library.'];
    const sent = R.pick(sentences);
    const letters = sent.replace(/[^A-Za-z]/g, '').toLowerCase().split('');
    const L = letters.length;
    const start = R.int(1, Math.min(12, L - 12));
    const at = (st, k) => letters[(st - 1 + k - 1) % L];
    const [p1, p2] = [R.int(2, 6), R.int(7, 11)];
    const first = [at(start, p1), at(start, p2)];
    // the start must be the only one consistent with the first answer
    const starts = range(1, L).filter(st => at(st, p1) === first[0] && at(st, p2) === first[1]);
    if (starts.length !== 1) return this.gen(R, level);
    const [q1, q2] = byLevel(level, [R.int(2, 6), R.int(7, 12)], [R.int(3, 9), R.int(10, 16)], [R.int(5, 12), R.int(14, 22)]);
    const ans = `${at(start, q1)} and ${at(start, q2)}`;
    const wrongs = [
      { s: `${letters[q1 - 1]} and ${letters[q2 - 1]}`, why: 'counts from the start of the sentence instead of the starting position', tag: 'misread' },
      { s: `${at(start + 1, q1)} and ${at(start + 1, q2)}`, why: 'starts counting one letter late', tag: 'off-by-one' },
      { s: `${at(start - 1 > 0 ? start - 1 : L, q1)} and ${at(start - 1 > 0 ? start - 1 : L, q2)}`, why: 'starts counting one letter early', tag: 'off-by-one' },
      { s: `${at(start, q2)} and ${at(start, q1)}`, why: 'gives the letters in the wrong order', tag: 'reversed' },
    ];
    const built = textOpts(R, ans, wrongs, { n: 4 });
    if (built.options.length < 4) return this.gen(R, level);
    return item(`To get into a secret club you must answer two questions about this sentence:<br><b>${sent}</b><br>Each day there is a secret starting letter. You are given two numbers and must say the letters in those positions, counting the starting letter as 1 and ignoring spaces and punctuation. Today the first person was given ${p1} and ${p2}, and correctly answered <b>${first[0]}</b> and <b>${first[1]}</b>. The second person is given ${q1} and ${q2}. What should they answer?`, built,
      `${first[0]} and ${first[1]} only fit if today's starting letter is letter ${start} of the sentence. Counting from there, positions ${q1} and ${q2} are ${ans}.`);
  } });

/* ---- symbol substitution code ---- */
const CODE_SETS = [
  ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'], ['MONDAY', 'FRIDAY', 'SUNDAY', 'TUESDAY'], ['YELLOW', 'PURPLE', 'ORANGE', 'SILVER'],
  ['TIGER', 'ZEBRA', 'CAMEL', 'KOALA'], ['PIANO', 'FLUTE', 'DRUMS', 'CELLO'], ['APPLE', 'MANGO', 'LEMON', 'PEACH'],
];
const SYMS = ['@', '#', '$', '%', '&', '!', '?', '+', '=', '~', '^', '*', '§', '¤', '◇', '○', '△', '□', '☆', '♠', '♣', '♥', '♦', '¶', '∞', '≈'];
defTS({ id: 'ts-cipher', topic: 'codes', fam: 'Number and code puzzles',
  gen(R, level) {
    const words4 = R.pick(CODE_SETS);
    const target = R.pick(words4);
    const map = {}; const syms = R.shuffle(SYMS);
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => { map[c] = syms[i]; });
    const enc = w => w.split('').map(c => map[c]).join(' ');
    const knownPool = ['JODY', 'TODD', 'MARK', 'LUCY', 'IVAN', 'NOAH', 'RUBY', 'OMAR', 'ELLA', 'SAMI', 'PRIYA', 'GRACE'];
    const known = R.sample(knownPool, byLevel(level, 2, 2, 1));
    // the coded word must be identifiable: exactly one option fits the known letters and the symbol pattern
    const fits = w => {
      if (w.length !== target.length) return false;
      const m = {}; const used = {};
      known.forEach(k => k.split('').forEach(c => { m[c] = map[c]; used[map[c]] = c; }));
      const code = target.split('').map(c => map[c]);
      for (let i = 0; i < w.length; i++) {
        const c = w[i], s = code[i];
        if (m[c] && m[c] !== s) return false;
        if (used[s] && used[s] !== c) return false;
        m[c] = s; used[s] = c;
      }
      return true;
    };
    const opts = words4.filter(w => w.length === target.length || true);
    const ok = opts.filter(fits);
    if (ok.length !== 1 || ok[0] !== target) return this.gen(R, level);
    const built = textOpts(R, cap(target.toLowerCase()), opts.filter(w => w !== target).map(w => ({ s: cap(w.toLowerCase()), why: w.length !== target.length ? 'has the wrong number of letters' : 'clashes with a letter whose symbol is already known', tag: 'logic' })), { n: 4, order: 'keep' });
    return item(`Two friends write messages in a code in which every letter of the alphabet always has its own symbol. In this code, ${known.map(k => `${cap(k.toLowerCase())} is written <span class="mono">${enc(k)}</span>`).join(' and ')}. One of them writes this word: <span class="mono">${enc(target)}</span>. Which word is it?`, built,
      `Line up each word with the coded symbols. Only ${cap(target.toLowerCase())} has the right number of letters and agrees with every symbol already known from ${listAnd(known.map(k => cap(k.toLowerCase())))}, with different letters always getting different symbols.`);
  } });

/* ---- exchange rates (barter) ---- */
defTS({ id: 'ts-exchange', topic: 'exchange rates', fam: 'Number and code puzzles',
  gen(R, level) {
    const items = R.pick([['shells', 'beads', 'feathers', 'stones'], ['azzes', 'bayos', 'cotts', 'duits'], ['red tokens', 'blue tokens', 'gold tokens', 'silver tokens']]);
    const r1 = [R.int(2, 5), R.int(2, 5)], r2 = [R.int(2, 6), R.int(2, 6)];
    if (r1[0] === r1[1] || r2[0] === r2[1]) return this.gen(R, level);
    // r1[0] A = r1[1] B ; r2[0] B = r2[1] C ; how many A for n C
    const n = lcm(r2[1], 1) * R.int(1, 4) * byLevel(level, 1, 2, 3);
    const B = n * r2[0] / r2[1];
    const A = B * r1[0] / r1[1];
    if (!isInt(A) || !isInt(B) || A > 400) return this.gen(R, level);
    const built = numOpts4(R, A, [
      { v: B, why: 'stops at the middle item', tag: 'part-only' },
      { v: round6(n * r2[1] / r2[0] * r1[1] / r1[0]), why: 'turns both rates upside down', tag: 'reversed' },
      { v: round6(n * r1[0] * r2[0]), why: 'multiplies without dividing', tag: 'operation' },
    ], { min: 1 });
    return item(`At a market, ${r1[0]} ${items[0]} can be swapped for ${r1[1]} ${items[1]}, and ${r2[0]} ${items[1]} can be swapped for ${r2[1]} ${items[2]}. How many ${items[0]} are needed to get ${n} ${items[2]}?`, built,
      explainWith(`${n} ${items[2]} cost ${B} ${items[1]} (${n} × ${r2[0]} ÷ ${r2[1]}), and ${B} ${items[1]} cost ${A} ${items[0]} (${B} × ${r1[0]} ÷ ${r1[1]}).`, built));
  } });

/* ---- token piles ---- */
defTS({ id: 'ts-token-piles', topic: 'number puzzles', fam: 'Number and code puzzles',
  gen(R, level) {
    const vals = R.pick([[2, 5, 10], [3, 4, 6], [2, 7, 9], [5, 8, 12], [1, 4, 10]]);
    const k = R.int(4, 14);
    const pair = R.sample([0, 1, 2], 2);
    const other = [0, 1, 2].find(i => !pair.includes(i));
    const tot2 = (vals[pair[0]] + vals[pair[1]]) * k;
    const ans = vals[other] * k;
    const built = numOpts4(R, ans, [
      { v: tot2 - ans, why: 'subtracts instead of finding the number of tokens first', tag: 'operation' },
      { v: vals[other] * Math.round(tot2 / vals[other] / 3), why: 'shares the total equally between the piles', tag: 'misread' },
      { v: (vals[0] + vals[1] + vals[2]) * k, why: 'gives the total of all three piles', tag: 'misread' },
      { v: ans + vals[other], why: 'counts one token too many', tag: 'off-by-one' },
    ], { fmt: x => x + ' points', min: 1 });
    return item(`In a game, tokens are worth ${vals[0]}, ${vals[1]} or ${vals[2]} points. I have one pile of each kind of token, and each pile has the same number of tokens. The ${vals[pair[0]]}-point pile and the ${vals[pair[1]]}-point pile together are worth ${tot2} points. What is the ${vals[other]}-point pile worth?`, built,
      explainWith(`One token from each of the two piles is worth ${vals[pair[0]] + vals[pair[1]]}, so each pile has ${tot2} ÷ ${vals[pair[0]] + vals[pair[1]]} = ${k} tokens. The other pile is ${k} × ${vals[other]} = ${ans} points.`, built));
  } });

/* ---- target zones: unknown values, deduce a score ---- */
defTS({ id: 'ts-target', topic: 'number puzzles', fam: 'Number and code puzzles',
  gen(R, level) {
    const zones = ['inner ring', 'second ring', 'third ring', 'outer ring'];
    // values: inner highest, each ring fewer than the one inside it
    for (let t = 0; t < 200; t++) {
      const v = R.sample(range(1, byLevel(level, 9, 12, 15)), 4).sort((a, b) => b - a);
      const ppl = names(R, 4);
      const shots = ppl.map(() => { const s = [0, 0, 0, 0, 0]; for (let i = 0; i < 3; i++) s[R.int(0, 4)]++; return s; }); // index 4 = miss
      const score = s => s[0] * v[0] + s[1] * v[1] + s[2] * v[2] + s[3] * v[3];
      const scores = shots.map(score);
      // solve: which value sets (strictly decreasing, 1..15) fit the first three players
      const fitting = [];
      for (let a = 1; a <= 15; a++) for (let b = 1; b < a; b++) for (let c = 1; c < b; c++) for (let d = 1; d < c; d++) {
        const vv = [a, b, c, d];
        if (shots.slice(0, 3).every((s, i) => s[0] * a + s[1] * b + s[2] * c + s[3] * d === scores[i])) fitting.push(vv);
      }
      const answers = new Set(fitting.map(vv => shots[3][0] * vv[0] + shots[3][1] * vv[1] + shots[3][2] * vv[2] + shots[3][3] * vv[3]));
      if (answers.size !== 1 || shots[3][4] === 3) continue;
      const desc = s => { const parts = []; zones.forEach((z, i) => { if (s[i]) parts.push(`${s[i]} in the ${z}`); }); if (s[4]) parts.push(`${s[4]} miss${s[4] > 1 ? 'es' : ''}`); return parts.join(', '); };
      const ans = scores[3];
      const built = numOpts4(R, ans, [
        { v: ans + v[3], why: 'gives one ring the wrong value', tag: 'logic' },
        { v: Math.max(1, ans - v[3]), why: 'gives one ring the wrong value', tag: 'logic' },
        { v: ans + 2, why: 'is a slip', tag: 'slip' },
        { v: Math.round(sum(scores.slice(0, 3)) / 3), why: 'averages the other scores', tag: 'misread' },
      ], { min: 0 });
      return item(`Four friends each had three shots at a target with four rings. Each ring is worth a different whole number of points; the inner ring is worth the most and each ring is worth less than the ring inside it.<br>${ppl.slice(0, 3).map((p, i) => `${p}: ${desc(shots[i])}, scoring ${scores[i]}`).join('<br>')}<br>${ppl[3]}: ${desc(shots[3])}<br>What did ${ppl[3]} score?`, built,
        explainWith(`The first three results fix the rings at ${fitting.length === 1 ? v.join(', ') + ' points (inner to outer)' : 'values that always give the same total'}, so ${ppl[3]} scored ${ans}.`, built));
    }
    return this.gen(R, level);
  } });

/* ---- Venn counting ---- */
defTS({ id: 'ts-venn', topic: 'sorting into groups', fam: 'Number and code puzzles',
  gen(R, level) {
    const ctx = R.pick([
      { intro: 'On a cold morning a teacher counted what the children were wearing.', g: ['a beanie', 'a scarf', 'gloves'], ph: (n, x) => `${n} ${n === 1 ? 'was' : 'were'} wearing ${x}`, both: (n, x, y) => `${n} ${n === 1 ? 'was' : 'were'} wearing both ${x} and ${y}`, all: n => `${n} ${n === 1 ? 'was' : 'were'} wearing all three`, none: n => `${n} ${n === 1 ? 'was' : 'were'} wearing none of them`, q: 'How many children were there?' },
      { intro: 'Every student in a class was asked which sports they play.', g: ['soccer', 'tennis', 'basketball'], ph: (n, x) => `${n} play${n === 1 ? 's' : ''} ${x}`, both: (n, x, y) => `${n} play${n === 1 ? 's' : ''} both ${x} and ${y}`, all: n => `${n} play${n === 1 ? 's' : ''} all three`, none: n => `${n} play${n === 1 ? 's' : ''} none of them`, q: 'How many students are in the class?' },
      { intro: 'Every family in a street was asked about their pets.', g: ['a dog', 'a cat', 'a bird'], ph: (n, x) => `${n} ${n === 1 ? 'has' : 'have'} ${x}`, both: (n, x, y) => `${n} ${n === 1 ? 'has' : 'have'} both ${x} and ${y}`, all: n => `${n} ${n === 1 ? 'has' : 'have'} all three`, none: n => `${n} ${n === 1 ? 'has' : 'have'} none of them`, q: 'How many families live in the street?' },
    ]);
    const [A, B, C] = ctx.g;
    const r = { a: R.int(2, 9), b: R.int(1, 6), c: R.int(1, 7), ab: R.int(0, 4), ac: R.int(1, 5), bc: R.int(0, 4), abc: R.int(1, 4), none: R.int(0, 5) };
    if (level === 'easy') { r.bc = 0; r.ab = 0; }
    const nA = r.a + r.ab + r.ac + r.abc, nB = r.b + r.ab + r.bc + r.abc, nC = r.c + r.ac + r.bc + r.abc;
    const total = r.a + r.b + r.c + r.ab + r.ac + r.bc + r.abc + r.none;
    const facts = [
      `${ctx.ph(nA, A)}, ${ctx.ph(nB, B)} and ${ctx.ph(nC, C)}.`,
      `${ctx.both(r.ab + r.abc, A, B)}.`,
      `${ctx.both(r.ac + r.abc, A, C)}, and ${ctx.both(r.bc + r.abc, B, C)}.`,
      `${ctx.all(r.abc)}.`,
      `${ctx.none(r.none)}.`,
    ];
    const ans = total;
    const built = numOpts4(R, ans, [
      { v: nA + nB + nC + r.none, why: 'adds the groups without allowing for overlaps', tag: 'part-only' },
      { v: total - r.none, why: 'forgets the people in none of the groups', tag: 'part-only' },
      { v: nA + nB + nC - (r.ab + r.abc) - (r.ac + r.abc) - (r.bc + r.abc) + r.none, why: 'takes away the overlaps but does not add back the people in all three', tag: 'part-only' },
      { v: total + r.abc, why: 'counts the people in all three groups twice', tag: 'slip' },
    ], { min: 1 });
    return item(`${ctx.intro}<br>${facts.join('<br>')}<br>${ctx.q}`, built,
      explainWith(`Fill in a three-circle diagram from the middle outwards: ${r.abc} in all three, then the pairs, then each group alone. Adding every region and the ${r.none} outside gives ${total}.`, built));
  } });

/* ---- string with no repeated three-symbol run ---- */
defTS({ id: 'ts-symbol-string', topic: 'patterns', fam: 'Number and code puzzles',
  gen(R, level) {
    const sy = ['$', '&', '@', '#'];
    const len = byLevel(level, 16, 20, 24);
    const triples = s => { const seen = new Set(); for (let i = 0; i + 3 <= s.length; i++) { const t = s.slice(i, i + 3).join(''); if (seen.has(t)) return false; seen.add(t); } return true; };
    for (let t = 0; t < 400; t++) {
      const s = []; let ok = true;
      while (s.length < len) {
        const c = R.shuffle(sy).find(x => triples(s.concat([x])));
        if (!c) { ok = false; break; }
        s.push(c);
      }
      if (!ok) continue;
      const good = sy.filter(x => triples(s.concat([x])));
      if (good.length !== 1) continue;
      const built = textOpts(R, good[0], sy.filter(x => x !== good[0]).map(x => ({ s: x, why: 'would repeat a run of three symbols already in the string', tag: 'logic' })), { n: 4, order: 'keep' });
      return item(`The string below uses only the symbols ${sy.join(', ')}.<br><span class="mono" style="letter-spacing:.2em">${s.join(' ')}</span><br>Which one symbol can be added to the right-hand end so that no run of three symbols in a row appears twice anywhere in the string?`, built,
        `Adding a symbol creates one new run: the last two symbols followed by the new one. For three of the symbols that run already appears earlier, so only ${good[0]} works.`);
    }
    return this.gen(R, level);
  } });

/* ---- words with no shared letters, ordered ---- */
const WC_DICT = ['AGE', 'CAN', 'COT', 'PAD', 'SUN', 'PET', 'SUD', 'PAT', 'BOG', 'CAT', 'DOG', 'MET', 'SUP', 'FIG', 'HUM', 'JAR', 'KEY', 'LOW', 'NIB', 'RUG', 'VAN', 'WEB', 'YAK', 'ZIP', 'BED', 'COW', 'FAN', 'HIT', 'LID', 'MOP', 'NUT', 'RAY', 'SOB', 'TUG', 'VIM', 'WAX', 'BUS', 'CUP', 'DIM', 'FOX', 'GUM', 'HEN', 'INK', 'JOB', 'KIT', 'LAP'];
function wcShare(a, b) { return a.split('').some(c => b.includes(c)); }
function wcCanOrder(ws) {
  const n = ws.length;
  const adj = ws.map(a => ws.map(b => a !== b && !wcShare(a, b)));
  const dfs = (cur, used, k) => { if (k === n) return true; for (let j = 0; j < n; j++) if (!(used & (1 << j)) && adj[cur][j] && dfs(j, used | (1 << j), k + 1)) return true; return false; };
  for (let i = 0; i < n; i++) if (dfs(i, 1 << i, 1)) return true;
  return false;
}
defTS({ id: 'ts-word-chain', topic: 'word puzzles', fam: 'Number and code puzzles',
  gen(R, level) {
    for (let t = 0; t < 400; t++) {
      const four = R.sample(WC_DICT, 4);
      if (!wcCanOrder(four)) continue;
      const rest = WC_DICT.filter(w => !four.includes(w));
      const good = rest.filter(w => four.some(f => wcShare(f, w)) && wcCanOrder(four.concat([w])));
      const bad = rest.filter(w => !wcCanOrder(four.concat([w])));
      if (!good.length || bad.length < 3) continue;
      const g = R.pick(good);
      const built = opts4(R, g, R.sample(bad, 3).map(w => ({ s: w, why: 'shares letters with too many of the other words for any order to work', tag: 'logic' })));
      return item(`Some sets of three-letter words can be put in an order so that no two neighbouring words have any letter in common. For example: BOG, CAT, DOG, MET, SUP.<br>Another such set is shown below, but one word is missing and the words are not in order:<br><b>${four.join(', ')}</b><br>Which one of the following could be the missing word?`, built,
        `With ${g} added, the words can be ordered so that no neighbours share a letter. Each other choice shares letters with too many of the words for any order to work.`);
    }
    throw new Error('word chain: no puzzle found');
  } });

/* ---- two-sided letter cards ---- */
const CARD_WORDS = ['COAT', 'BOAT', 'CLAP', 'SLOT', 'BOLT', 'COST', 'BATS', 'BLOT', 'CABS', 'LOBS', 'SLAB', 'CLOT', 'BOTS', 'PACT', 'SPOT', 'PLOT', 'CAPS', 'TABS', 'STAB', 'SCAB', 'COLT', 'COPS', 'TOPS', 'STOP', 'POTS', 'SPAT', 'PATS', 'LOTS', 'SALT', 'LAST', 'CATS', 'ACTS', 'COBS', 'LAPS', 'PALS', 'SLAP', 'OPTS', 'BLOC', 'LOST', 'PLAT', 'TACO', 'COLA', 'PACS', 'POST', 'SPAT', 'TAPS', 'BOAS', 'OATS', 'STOA', 'ALSO', 'CLOP', 'SCOT'.slice(0, 0)].filter(Boolean);
defTS({ id: 'ts-letter-cards', topic: 'word puzzles', fam: 'Number and code puzzles',
  gen(R, level) {
    const letters = 'COATBSLP'.split('');
    const words = Array.from(new Set(CARD_WORDS)).filter(w => new Set(w).size === 4 && w.split('').every(c => letters.includes(c)));
    const usesEach = (w, p) => p.every(card => card.filter(c => w.includes(c)).length === 1);
    const pairings = [];
    const rec = (rest, acc) => { if (!rest.length) { pairings.push(acc); return; } const a = rest[0]; for (let i = 1; i < rest.length; i++) rec(rest.slice(1, i).concat(rest.slice(i + 1)), acc.concat([[a, rest[i]]])); };
    rec(letters, []);
    for (let t = 0; t < 300; t++) {
      const cards = R.pick(pairings);
      const makeable = words.filter(w => usesEach(w, cards));
      if (makeable.length < 4) continue;
      const shown = R.sample(makeable, byLevel(level, 3, 3, 2) + (makeable.length > 6 ? 0 : 0));
      const cons = pairings.filter(p => shown.every(w => usesEach(w, p)));
      const always = words.filter(w => !shown.includes(w) && cons.every(p => usesEach(w, p)));
      const never = words.filter(w => !shown.includes(w) && cons.every(p => !usesEach(w, p)));
      if (!always.length || never.length < 3) continue;
      const g = R.pick(always);
      const built = opts4(R, g, R.sample(never, 3).map(w => ({ s: w, why: 'needs two letters that must be on the same card', tag: 'logic' })));
      return item(`I have four cards with a letter printed on each side. No letter appears twice. By turning the cards over and changing their order, I can make each of these words: <b>${shown.join(', ')}</b>. Each word uses one side of every card. Which one of the following words could also be made with the cards?`, built,
        `Each card shows exactly one letter of every word. From ${listAnd(shown)}, work out which letters must share a card. ${g} uses one letter from each card; every other choice needs two letters from the same card.`);
    }
    throw new Error('letter cards: no puzzle found');
  } });

/* ---- ages ---- */
defTS({ id: 'ts-ages', topic: 'number puzzles', fam: 'Number and code puzzles',
  gen(R, level) {
    const ppl = names(R, 3);
    const a = R.int(6, 14), gapB = R.int(2, 8), gapC = R.int(10, 30);
    const ages = [a, a + gapB, a + gapC];
    const yrs = R.int(2, Math.min(9, a - 1));
    const sumThen = sum(ages) - 3 * yrs;
    const ans = ages[2];
    const built = numOpts4(R, ans, [
      { v: ans - yrs, why: 'gives the age back then, not now', tag: 'misread' },
      { v: ans + yrs, why: 'adds the years instead of subtracting', tag: 'reversed' },
      { v: Math.round((sumThen + 3 * yrs) / 3), why: 'gives the average age now', tag: 'misread' },
      { v: ans - 1, why: 'is one year out', tag: 'off-by-one' },
    ], { min: 1 });
    return item(`${ppl[1]} is ${gapB} years older than ${ppl[0]}. ${ppl[2]} is ${gapC} years older than ${ppl[0]}. ${yrs} years ago, their ages added up to ${sumThen}. How old is ${ppl[2]} now?`, built,
      explainWith(`Now their ages add to ${sumThen} + 3 × ${yrs} = ${sumThen + 3 * yrs}. That is ${ppl[0]}'s age three times plus ${gapB + gapC}, so ${ppl[0]} is ${a} and ${ppl[2]} is ${ans}.`, built));
  } });

/* ---- maximum / minimum reasoning ---- */
defTS({ id: 'ts-at-least', topic: 'counting arguments', fam: 'Number and code puzzles',
  gen(R, level) {
    const v = R.int(0, 1);
    if (v === 0) {
      const colours = R.int(3, 6), need = R.int(2, 4);
      const ans = colours * (need - 1) + 1;
      const built = numOpts4(R, ans, [
        { v: colours * need, why: 'takes enough to get a full set of every colour', tag: 'misread' },
        { v: need, why: 'assumes the first socks match', tag: 'misread' },
        { v: colours * (need - 1), why: 'stops one sock short', tag: 'off-by-one' },
        { v: colours + need, why: 'adds the numbers', tag: 'operation' },
      ], { min: 1 });
      return item(`A drawer holds lots of socks in ${colours} different colours. In the dark, ${name1(R)} takes socks out one at a time. What is the smallest number of socks that must be taken out to be certain of having ${need} socks of the same colour?`, built,
        explainWith(`In the worst case ${name1(R)} gets ${need - 1} of every colour first: ${colours * (need - 1)} socks. The next sock must make ${need} of one colour, so ${ans}.`, built));
    }
    const n = R.int(4, 7), total = R.int(n * 3, n * 7);
    const ans = Math.ceil(total / n);
    const built = numOpts4(R, ans, [
      { v: Math.floor(total / n), why: 'rounds down instead of up', tag: 'off-by-one' },
      { v: total - n + 1, why: 'gives the most one shelf could hold', tag: 'reversed' },
      { v: n, why: 'gives the number of shelves', tag: 'misread' },
      { v: ans + 1, why: 'is one too many', tag: 'off-by-one' },
    ], { min: 1 });
    return item(`${total} books are placed on ${n} shelves. Which number of books must be on at least one of the shelves, however the books are arranged? (Give the largest number that is certain.)`, built,
      explainWith(`If every shelf had ${ans - 1} or fewer, there would be at most ${(ans - 1) * n} books, which is fewer than ${total}. So some shelf has at least ${ans}.`, built));
  } });
