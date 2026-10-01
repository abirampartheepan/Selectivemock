/* ==========================================================================
   Mathematical Reasoning — algebra, working backwards, LCM/HCF, multi-step
   problems and challenge items
   ========================================================================== */
'use strict';

/* ---- symbols standing for numbers ---- */
defMaths({ id: 'm-algebra', slot: 'algebra', topic: 'unknowns', fam: 'Patterns and algebra',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 3));
    const [S1, S2, S3] = R.sample(['▲', '●', '■', '◆', '★'], 3);
    if (v === 0) {
      const a = R.int(3, 15), b = R.int(2, 12);
      const k = R.int(2, 12);
      const c = 2 * b + a;
      const built = numOpts(R, b, [
        { v: a, why: `gives the value of ${S1}`, tag: 'misread' },
        { v: c - a, why: `forgets to halve`, tag: 'part-only' },
        { v: (c + a) / 2, why: `adds ${S1} instead of subtracting it`, tag: 'reversed' },
        { v: b + 1, why: 'is one out', tag: 'slip' },
      ], { int: false, min: 0 });
      return item(`${S1} and ${S2} stand for different numbers.<br>${k} × ${S1} = ${k * a}<br>${S2} + ${S2} + ${S1} = ${c}<br>What is ${S2}?`, built,
        explainWith(`${S1} = ${k * a} ÷ ${k} = ${a}. Then ${S2} + ${S2} = ${c} − ${a} = ${c - a}, so ${S2} = ${b}.`, built));
    }
    if (v === 1) {
      // balance scales
      const x = R.int(2, 12) * 5, y = R.int(2, 9) * 5;
      const p = R.int(2, 4), q = R.int(1, 3);
      const total = p * x + q * y;
      const r = R.int(1, 3);
      const left2 = x + r * y;
      const built = numOpts(R, x, [
        { v: y, why: 'gives the mass of the other shape', tag: 'misread' },
        { v: Math.round(total / (p + q)), why: 'shares the mass equally among all the shapes', tag: 'misread' },
        { v: total / p, why: `ignores the ${S2}s on the first scale`, tag: 'part-only' },
        { v: x + y, why: 'adds the two masses', tag: 'operation' },
      ], { min: 1 });
      return item(`On a balance, ${p} ${S1} and ${q} ${S2} together weigh ${total} g. On another balance, 1 ${S1} and ${r} ${S2} together weigh ${left2} g. All ${S1} have the same mass and all ${S2} have the same mass. What is the mass of one ${S1}?`, built,
        explainWith(`From the two balances, ${S1} = ${x} g and ${S2} = ${y} g: check ${p} × ${x} + ${q} × ${y} = ${total} and ${x} + ${r} × ${y} = ${left2}.`, built));
    }
    if (v === 2) {
      // half-full can problem: (half) and (quarter) masses -> three-quarters
      const can = R.int(3, 12) * 5, full = R.int(8, 30) * 10;
      const half = can + full / 2, quarter = can + full / 4;
      const ask = R.pick([[3, 4, 'three-quarters'], [1, 1, 'completely'], [0, 1, 'empty']]);
      const ans = can + full * ask[0] / ask[1];
      const thing = R.pick(['sweetcorn', 'paint', 'honey', 'soup']);
      const built = numOpts(R, ans, [
        { v: half + quarter, why: 'adds the two readings, which counts the can twice', tag: 'misread' },
        { v: half * ask[0] / ask[1] * 2, why: 'scales the whole reading, can included', tag: 'part-only' },
        { v: ans - can, why: 'leaves out the can', tag: 'part-only' },
        { v: ans + (half - quarter), why: 'adds one quarter too many', tag: 'off-by-one' },
      ], { fmt: x => num(x) + ' g', min: 1 });
      return item(`When a can of ${thing} is half full, the can and ${thing} together have a mass of ${half} g. When it is one-quarter full, they have a mass of ${quarter} g. What is the mass of the can and ${thing} together when the can is ${ask[2]}${ask[2] === 'completely' ? ' full' : ask[2] === 'empty' ? '' : ' full'}?`, built,
        explainWith(`Half minus a quarter is one quarter of the ${thing}: ${half} − ${quarter} = ${half - quarter} g. So the full amount is ${full} g and the can is ${can} g. The answer is ${ans} g.`, built));
    }
    // three symbols with sums
    const a = R.int(2, 15), b = R.int(2, 15), c = R.int(2, 15);
    const e1 = a + b, e2 = b + c, e3 = a + c;
    const ask = R.int(0, 2);
    const ans = [a, b, c][ask];
    const built = numOpts(R, ans, [
      { v: (e1 + e2 + e3) / 2, why: 'gives the sum of all three', tag: 'part-only' },
      { v: [b, c, a][ask], why: 'gives a different symbol', tag: 'misread' },
      { v: Math.round((e1 + e2 + e3) / 3), why: 'averages the totals', tag: 'operation' },
      { v: ans + 2, why: 'is an arithmetic slip', tag: 'slip' },
    ], { int: false, min: 0 });
    return item(`${S1} + ${S2} = ${e1}<br>${S2} + ${S3} = ${e2}<br>${S1} + ${S3} = ${e3}<br>What is ${[S1, S2, S3][ask]}?`, built,
      explainWith(`Adding all three lines gives 2 × (${S1} + ${S2} + ${S3}) = ${e1 + e2 + e3}, so ${S1} + ${S2} + ${S3} = ${(e1 + e2 + e3) / 2}. Subtract the line without ${[S1, S2, S3][ask]}: ${ans}.`, built));
  } });

/* ---- working backwards ---- */
defMaths({ id: 'm-backwards', slot: 'backwards', topic: 'working backwards', fam: 'Patterns and algebra',
  gen(R, level) {
    if (R.chance(0.5)) {
      // ticket sales halving each day + fixed day
      const thu = R.int(4, 16) * 10;
      const wed = R.int(2, 8) * 10 * byLevel(level, 1, 1, 1);
      const ratio = byLevel(level, 2, R.pick([2, 3]), R.pick([2, 3, 4]));
      const tue = wed * ratio, mon = tue * ratio;
      const total = mon + tue + wed + thu;
      const built = numOpts(R, mon, [
        { v: tue, why: 'gives Tuesday', tag: 'misread' },
        { v: Math.round((total - thu) / 3), why: 'shares the tickets equally over three days', tag: 'misread' },
        { v: (total - thu) / 2, why: 'halves the remaining tickets once', tag: 'part-only' },
        { v: total - thu - wed, why: 'forgets Tuesday', tag: 'part-only' },
      ], { min: 1 });
      const share = ratio === 2 ? 'half as many' : ratio === 3 ? 'one-third as many' : 'one-quarter as many';
      return item(`A cinema sold ${total} tickets over four days, Monday to Thursday. On Tuesday it sold ${share} tickets as on Monday. On Wednesday it sold ${share} tickets as on Tuesday. On Thursday it sold ${thu} tickets. How many tickets were sold on Monday?`, built,
        explainWith(`Monday to Wednesday sold ${total - thu}. If Wednesday is 1 part, Tuesday is ${ratio} and Monday is ${ratio * ratio}: ${1 + ratio + ratio * ratio} parts. Each part is ${wed}, so Monday is ${mon}.`, built));
    }
    // number machine backwards
    const steps = byLevel(level, 3, 4, 5);
    const ops = [];
    for (let i = 0; i < steps; i++) ops.push(R.pick([['+', R.int(2, 15)], ['−', R.int(2, 9)], ['×', R.int(2, 4)], ['÷', 2]]));
    let x = R.int(2, 20), cur = x, ok = true;
    for (const [o, k] of ops) {
      if (o === '+') cur += k; else if (o === '−') cur -= k; else if (o === '×') cur *= k; else { if (cur % k) { ok = false; break; } cur /= k; }
      if (cur <= 0) ok = false;
    }
    if (!ok) return this.gen(R, level);
    const who = name1(R);
    // wrong: apply ops forwards to output; reverse order but same ops
    let w1 = cur; for (const [o, k] of ops) { if (o === '+') w1 += k; else if (o === '−') w1 -= k; else if (o === '×') w1 *= k; else w1 /= k; }
    let w2 = cur; for (const [o, k] of ops.slice().reverse()) { if (o === '+') w2 += k; else if (o === '−') w2 -= k; else if (o === '×') w2 *= k; else w2 /= k; }
    let w3 = cur; for (const [o, k] of ops) { if (o === '+') w3 -= k; else if (o === '−') w3 += k; else if (o === '×') w3 /= k; else w3 *= k; }
    const built = numOpts(R, x, [
      { v: w2, why: 'undoes the steps in the right order but does them instead of undoing them', tag: 'reversed' },
      { v: w3, why: 'undoes the steps but in the wrong order', tag: 'reversed' },
      { v: w1, why: 'runs the machine forwards again', tag: 'reversed' },
      { v: x + 1, why: 'is an arithmetic slip', tag: 'slip' },
    ], { int: false, min: 0 });
    return item(`${who} thinks of a number and then, in order: ${ops.map(([o, k]) => o === '+' ? `adds ${k}` : o === '−' ? `subtracts ${k}` : o === '×' ? `multiplies by ${k}` : `halves the result`).join(', then ')}. The answer is ${cur}. What number did ${who} start with?`, built,
      explainWith(`Start from ${cur} and undo each step in reverse order: ${ops.slice().reverse().map(([o, k]) => o === '+' ? `subtract ${k}` : o === '−' ? `add ${k}` : o === '×' ? `divide by ${k}` : 'double').join(', ')}. That gives ${x}.`, built));
  } });

/* ---- LCM / HCF in context ---- */
defMaths({ id: 'm-lcm-hcf', slot: 'lcm-hcf', topic: 'LCM and HCF', fam: 'Number',
  gen(R, level) {
    const v = byLevel(level, 0, R.int(0, 1), R.int(1, 2));
    if (v === 0) {
      const t = R.sample([6, 8, 9, 10, 12, 15, 4, 5], 3);
      const L = lcm(lcm(t[0], t[1]), t[2]);
      if (L > 180) return this.gen(R, level);
      const ppl = names(R, 3);
      const built = numOpts(R, L, [
        { v: t[0] * t[1] * t[2], why: 'multiplies the three times', tag: 'operation' },
        { v: lcm(t[0], t[1]), why: 'uses only two of the runners', tag: 'part-only' },
        { v: sum(t), why: 'adds the three times', tag: 'operation' },
        { v: L * 2, why: 'gives a later meeting, not the first one', tag: 'misread' },
      ], { min: 1 });
      return item(`${ppl[0]}, ${ppl[1]} and ${ppl[2]} run laps of a track, starting together on the start line. ${ppl[0]} runs a lap every ${t[0]} minutes, ${ppl[1]} every ${t[1]} minutes and ${ppl[2]} every ${t[2]} minutes. After how many minutes are they next on the start line together?`, built,
        explainWith(`They meet at the lowest common multiple of ${t.join(', ')}, which is ${L}.`, built));
    }
    if (v === 1) {
      // pair with given HCF & LCM
      const h = R.pick([2, 3, 4, 5, 6]);
      const pairs = [];
      const m = R.pick([6, 10, 12, 15, 30]);
      for (let a = 1; a <= m; a++) for (let b = a; b <= m; b++) if (gcd(a, b) === 1 && a * b === m) pairs.push([a * h, b * h]);
      if (pairs.length < 2) return this.gen(R, level);
      const [p1, p2] = pairs.slice(0, 2);
      const ans = p2[0] + p2[1];
      const built = numOpts(R, ans, [
        { v: p1[0] + p1[1], why: 'gives the sum of the first pair', tag: 'misread' },
        { v: h * m + h, why: 'adds the HCF and LCM', tag: 'operation' },
        { v: ans + h, why: 'is out by the HCF', tag: 'slip' },
        { v: p2[0] * p2[1] / h, why: 'gives the LCM', tag: 'misread' },
      ], { min: 1 });
      return item(`The numbers ${p1[0]} and ${p1[1]} have highest common factor ${h} and lowest common multiple ${h * m}. A different pair of numbers also has highest common factor ${h} and lowest common multiple ${h * m}. What is the sum of this second pair?`, built,
        explainWith(`Write the numbers as ${h} × a and ${h} × b where a and b share no factor and a × b = ${m}. Besides ${p1[0] / h} and ${p1[1] / h}, the other choice is ${p2[0] / h} and ${p2[1] / h}, giving ${p2[0]} + ${p2[1]} = ${ans}.`, built));
    }
    // tiles: largest square tile for a rectangular floor (HCF) and how many
    const h = R.pick([15, 20, 25, 30, 40, 50]);
    const a = h * R.int(2, 7), b = h * R.int(2, 7);
    if (gcd(a, b) !== h) return this.gen(R, level);
    const n = (a / h) * (b / h);
    const built = numOpts(R, n, [
      { v: (a / 10) * (b / 10), why: 'uses 10 cm tiles, which are not the largest that fit', tag: 'misread' },
      { v: a / h + b / h, why: 'adds the tiles along each side instead of multiplying', tag: 'operation' },
      { v: (a / (h / 5)) * (b / (h / 5)) / 25, why: 'is an arithmetic slip', tag: 'slip' },
      { v: n * 2, why: 'uses a tile that is too small', tag: 'misread' },
      { v: Math.round(n / 2), why: 'uses a tile that does not fit exactly', tag: 'misread' },
    ], { min: 1 });
    return item(`A floor measures ${a} cm by ${b} cm. It is covered with the largest possible square tiles that fit exactly with no cutting. How many tiles are needed?`, built,
      explainWith(`The largest square that fits both sides exactly has side equal to the HCF of ${a} and ${b}: ${h} cm. That gives ${a / h} × ${b / h} = ${n} tiles.`, built));
  } });

/* ---- multi-step word problems ---- */
defMaths({ id: 'm-multi-step', slot: 'multi-step', topic: 'multi-step problems', fam: 'Number',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 3));
    const who = name1(R);
    if (v === 0) {
      // half-full bag, transfer
      const cap = R.int(10, 40) * 10;
      const inBag = cap / 2;
      const removed = inBag / 2;
      const jar = R.int(cap, cap * 3);
      const moved = cap - (inBag - removed);
      const ans = jar - moved;
      const built = numOpts(R, ans, [
        { v: jar - inBag, why: 'forgets the marbles taken out first', tag: 'part-only' },
        { v: jar - removed, why: 'moves only as many as were taken out', tag: 'misread' },
        { v: moved, why: 'gives the number moved, not the number left', tag: 'misread' },
        { v: jar - cap, why: 'fills the bag from empty', tag: 'misread' },
      ], { min: 0 });
      return item(`A bag is half full with ${inBag} white marbles. A jar holds ${jar} black marbles. ${who} takes out half of the marbles in the bag, then tips black marbles from the jar into the bag until the bag is completely full. How many marbles are left in the jar?`, built,
        explainWith(`A full bag holds ${cap}. After taking out ${removed}, the bag has ${inBag - removed}, so ${moved} black marbles go in. The jar has ${jar} − ${moved} = ${ans} left.`, built));
    }
    if (v === 1) {
      // broken scales offset
      const off = R.int(2, 8) * 250;
      const blockN = R.int(4, 12), block = R.pick([125, 200, 250, 400, 500]);
      const right = blockN * block - off;
      if (right <= 0) return this.gen(R, level);
      const built = numOpts(R, block, [
        { v: round6(right / blockN), why: 'ignores the fault in the scales', tag: 'part-only' },
        { v: round6((right + 2 * off) / blockN), why: 'corrects for the fault twice', tag: 'operation' },
        { v: round6(off / blockN), why: 'uses only the fault mass', tag: 'misread' },
        { v: round6((right + off) / (blockN + 1)), why: 'divides by one block too many', tag: 'off-by-one' },
      ], { fmt: x => num(x) + ' g', int: false, min: 1 });
      return item(`A pair of balance scales is faulty: with nothing on them, an extra ${num(off)} g is needed on the right-hand pan to make them balance. ${who} puts ${blockN} identical blocks on the left pan and ${num(right)} g of weights on the right pan, and the scales balance. What is the mass of one block?`, built,
        explainWith(`The right pan needs ${num(off)} g more than the left to balance, so the blocks weigh ${num(right)} + ${num(off)} = ${num(right + off)} g in total, and each block is ${num(block)} g.`, built));
    }
    if (v === 2) {
      // drivers sharing a road trip
      const ppl = R.int(5, 12), cars = R.int(2, 3);
      const each = frac(cars, ppl);
      const opts = [frac(1, ppl), each, frac(1, cars), frac(cars, ppl + cars), frac(ppl, cars * 10)];
      const uniq = [];
      opts.forEach(o => { if (!uniq.includes(o)) uniq.push(o); });
      if (uniq.length < 5) return this.gen(R, level);
      const vals = uniq.map(s => { const [a, b] = s.split('/').map(Number); return b ? a / b : a; });
      const ord = vals.map((_, i) => i).sort((x, y) => vals[x] - vals[y]);
      const whyMap = { [frac(1, ppl)]: 'forgets that two cars are driven at the same time', [frac(1, cars)]: 'shares the trip between the cars, not the people', [frac(cars, ppl + cars)]: 'counts the cars as people', [frac(ppl, cars * 10)]: 'is not a fair share' };
      const built = { options: ord.map(i => uniq[i]), answer: ord.indexOf(uniq.indexOf(each)), whys: ord.map(i => uniq[i] === each ? null : whyMap[uniq[i]]), tags: ord.map(i => uniq[i] === each ? null : 'misread') };
      return item(`${words(ppl).replace(/^./, c => c.toUpperCase())} friends go on a road trip in ${words(cars)} cars that travel together the whole way. They share the driving so that each person drives for the same amount of time. For what fraction of the journey time does each person drive?`, built,
        explainWith(`At any moment ${cars} people are driving, so there are ${cars} journeys' worth of driving to share among ${ppl} people: ${each} each.`, built));
    }
    // age problem
    const kid = R.int(5, 12), k = R.int(3, 5), adult = kid * k;
    const yrs = R.int(2, 15);
    const ansA = adult + yrs, ansK = kid + yrs;
    const ratio = ansA / ansK;
    if (!isInt(ratio * 2)) return this.gen(R, level);
    const built = numOpts(R, yrs, [
      { v: adult - kid, why: 'gives the age difference', tag: 'misread' },
      { v: yrs + 1, why: 'is one year out', tag: 'off-by-one' },
      { v: kid, why: 'gives the child\'s age now', tag: 'misread' },
      { v: Math.max(1, yrs - 2), why: 'is a slip', tag: 'slip' },
    ], { min: 1 });
    return item(`${who} is ${kid} years old and ${who}'s grandmother is ${k} times as old. In how many years will the grandmother be ${isInt(ratio) ? ratio : num(ratio)} times as old as ${who}?`, built,
      explainWith(`The age gap is always ${adult - kid} years. When the grandmother is ${num(ratio)} times as old, ${who} is ${ansK}, which is in ${yrs} years.`, built));
  } });

/* ---- challenge: magic squares, digit puzzles, grids ---- */
defMaths({ id: 'm-challenge', slot: 'challenge', topic: 'problem solving', fam: 'Patterns and algebra',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 3));
    if (v === 0) {
      // magic square with missing numbers (3x3 from base)
      const base = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
      const add = R.int(0, 15), mul = R.int(1, 3);
      let sq = base.map(r => r.map(x => x * mul + add));
      if (R.chance(0.5)) sq = sq.map(r => r.slice().reverse());
      if (R.chance(0.5)) sq = sq[0].map((_, i) => sq.map(r => r[i]));
      const hideCount = byLevel(level, 5, 6, 6);
      const cells = R.shuffle(range(0, 8));
      const shown = new Set(cells.slice(hideCount));
      const askCell = cells[0];
      // the asked cell must be solvable; brute check: magic sum known from any full line? ensure a line with only askCell hidden OR center known
      const r = Math.floor(askCell / 3), c = askCell % 3;
      const known = i => shown.has(i);
      const rowOk = [0, 1, 2].every(j => j === c || known(r * 3 + j)), colOk = [0, 1, 2].every(i => i === r || known(i * 3 + c));
      if (!rowOk && !colOk) return this.gen(R, level);
      const ans = sq[r][c];
      const grid = sq.map((row, i) => row.map((x, j) => (i * 3 + j) === askCell ? '?' : known(i * 3 + j) ? String(x) : ''));
      const built = numOpts(R, ans, [
        { v: ans + mul, why: 'is one step out', tag: 'slip' },
        { v: ans - mul, why: 'is one step out', tag: 'slip' },
        { v: 15 * mul + 3 * add - ans, why: 'confuses the missing number with the rest of the line', tag: 'misread' },
        { v: 5 * mul + add, why: 'gives the centre number', tag: 'misread' },
      ], { min: 0 });
      return item(`In a magic square, every row, every column and both diagonals add up to the same total. Some numbers in this magic square are missing. What number should replace the question mark?`, built,
        explainWith(`The magic total is three times the centre number, ${3 * (5 * mul + add)}. Using a line with the question mark gives ${ans}.`, built), { table: { rows: grid } });
    }
    if (v === 1) {
      // missing digits in prices: greatest possible difference
      const a = R.int(50, 90), b = a - R.int(1, 3);
      const t1 = R.int(0, 9), t2 = R.int(0, 9);
      // prices $a.t1? and $b.?t2 with one missing digit each; largest difference = max first - min second
      const max1 = a + t1 / 10 + 9 / 100, min2 = b + 0 / 10 + t2 / 100;
      const ans = round2(max1 - min2);
      const built = numOpts(R, ans, [
        { v: round2(a + t1 / 10 - (b + t2 / 100)), why: 'puts 0 in both gaps', tag: 'misread' },
        { v: round2(a + t1 / 10 + 0.09 - (b + 0.9 + t2 / 100)), why: 'makes the second price as large as possible', tag: 'reversed' },
        { v: round2(a - b), why: 'compares only the dollars', tag: 'part-only' },
        { v: round2(ans + 0.1), why: 'is ten cents out', tag: 'slip' },
      ], { fmt: money, int: false, min: 0.01 });
      return item(`In the prices below, each ■ is a missing digit.<br><span class="mono">$${a}.${t1}■ &nbsp;&nbsp; $${b}.■${t2}</span><br>What is the greatest possible difference between the two prices?`, built,
        explainWith(`Make the first price as large as possible (${money(max1)}) and the second as small as possible (${money(min2)}): the difference is ${money(ans)}.`, built));
    }
    if (v === 2) {
      // grid reference of nth box in a zigzag pattern
      const cols = ['A', 'B', 'C', 'D', 'E'];
      const per = 3; // boxes per diagonal run
      const n = byLevel(level, R.int(12, 30), R.int(30, 60), R.int(60, 150));
      // boxes go B2, C3, D4, then B5, C6, D7, ... column cycles B,C,D, row = n+1
      const colIdx = 1 + (n - 1) % per, row = n + 1;
      const ans = `${cols[colIdx]}${row}`;
      const wrongs = [
        { s: `${cols[colIdx]}${n}`, why: 'forgets the pattern starts in row 2', tag: 'off-by-one' },
        { s: `${cols[1 + n % per]}${row}`, why: 'counts the columns from the wrong box', tag: 'off-by-one' },
        { s: `${cols[colIdx]}${row + per}`, why: 'goes one run too far', tag: 'misread' },
        { s: `${cols[1 + (n + 1) % per]}${row - 1}`, why: 'is one box early', tag: 'off-by-one' },
        { s: `${cols[colIdx]}${row * 2}`, why: 'doubles the row number', tag: 'operation' },
      ];
      const built = textOpts(R, ans, wrongs, { n: 5 });
      return item(`Boxes are drawn on a grid with columns A to E and rows numbered from 1 downwards. Box 1 is at B2, box 2 at C3, box 3 at D4, box 4 at B5, box 5 at C6, and so on, following the same pattern. What is the grid reference of box ${n}?`, built,
        explainWith(`Box n is always in row n + 1, and the columns repeat B, C, D. ${n} leaves remainder ${(n - 1) % per + 1 === 3 ? 0 : (n - 1) % per + 1} when divided by 3, so the column is ${cols[colIdx]}: ${ans}.`, built));
    }
    // digit sum puzzle: how many numbers between X and Y have digit sum S
    const lo = byLevel(level, 100, 100, 1000), hi = byLevel(level, 300, 999, 3000);
    const S = R.int(byLevel(level, 5, 8, 10), byLevel(level, 9, 14, 20));
    let cnt = 0;
    for (let x = lo; x <= hi; x++) if (String(x).split('').reduce((a, d) => a + Number(d), 0) === S) cnt++;
    if (!cnt) return this.gen(R, level);
    const built = numOpts(R, cnt, [
      { v: cnt - 1, why: 'misses one number', tag: 'off-by-one' },
      { v: cnt + 1, why: 'counts one number twice', tag: 'off-by-one' },
      { v: cnt * 2, why: 'counts the numbers twice', tag: 'slip' },
      { v: Math.round(cnt * 0.7), why: 'misses the numbers with a zero digit', tag: 'part-only' },
    ], { min: 1 });
    return item(`How many whole numbers from ${num(lo)} to ${num(hi)} have digits that add up to ${S}?`, built,
      explainWith(`Work through the numbers by their first digit and count systematically: there are ${cnt}.`, built));
  } });
