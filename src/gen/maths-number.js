/* ==========================================================================
   Mathematical Reasoning — number, time, place value, patterns, factors
   ========================================================================== */
'use strict';

/* ---- time: 12-hour / 24-hour conversion with an elapsed interval ---- */
defMaths({ id: 'm-time-convert', slot: 'time-convert', topic: 'time conversion', fam: 'Measurement and time',
  gen(R, level) {
    const who = name1(R);
    const start = R.int(level === 'easy' ? 6 * 60 : 0, 23 * 60 + 59 - 0);
    const startR = start - start % 5;
    const adds = byLevel(level,
      [[15, 'one quarter of an hour'], [30, 'half an hour'], [45, 'three-quarters of an hour'], [90, 'one and a half hours']],
      [[75, 'one and a quarter hours'], [105, 'one and three-quarter hours'], [135, 'two and a quarter hours'], [165, 'two and three-quarter hours']],
      [[200, '3 hours 20 minutes'], [415, '6 hours 55 minutes'], [530, '8 hours 50 minutes'], [745, '12 hours 25 minutes']]);
    const [add, addTxt] = R.pick(adds);
    const to24 = R.chance(0.5);
    const shown = to24 ? time12(startR) : time24(startR);
    const end = startR + add;
    const fmt = v => to24 ? time24(v) : time12(v);
    const cands = [
      { v: startR + add + 12 * 60, why: 'gives the right clock time but on the wrong half of the day', tag: 'misread' },
      { v: startR - add, why: 'goes back in time instead of forward', tag: 'reversed' },
      { v: startR + (add % 60) + Math.floor(add / 60) * 100 % 60, why: 'treats the hours as if there were 100 minutes in an hour', tag: 'units' },
      { v: startR + add + 60, why: 'adds one hour too many', tag: 'slip' },
      { v: startR + add - 60, why: 'adds one hour too few', tag: 'slip' },
      { v: startR + add + 10, why: 'is ten minutes out', tag: 'slip' },
    ];
    // build string options; dedupe on formatted text
    const strs = [], whys = [], tags = [];
    const push = (v, why, tag) => { const s = fmt(v); if (!strs.includes(s)) { strs.push(s); whys.push(why); tags.push(tag); } };
    push(end, null, null);
    R.shuffle(cands).forEach(c => { if (strs.length < 5) push(c.v, c.why, c.tag); });
    const order = strs.map((s, i) => i).sort((a, b) => {
      const va = [end, ...cands.map(c => c.v)].find(v => fmt(v) === strs[a]);
      const vb = [end, ...cands.map(c => c.v)].find(v => fmt(v) === strs[b]);
      return (((va % 1440) + 1440) % 1440) - (((vb % 1440) + 1440) % 1440);
    });
    const built = { options: order.map(i => strs[i]), answer: order.indexOf(0), whys: order.map(i => whys[i]), tags: order.map(i => tags[i]) };
    const stem = `${who}'s ${to24 ? 'watch' : 'phone'} shows ${shown}. What is the time ${addTxt} later, in ${to24 ? '24-hour' : '12-hour'} time?`;
    return item(stem, built, explainWith(`${shown} is ${to24 ? time24(startR) : time12(startR)} in the other format. Adding ${hm(add)} gives ${fmt(end)}.`, built));
  } });

/* ---- place value: value of a digit / rounding difference ---- */
defMaths({ id: 'm-place-value', slot: 'place-value', topic: 'place value', fam: 'Number',
  gen(R, level) {
    const v = R.int(0, 2);
    if (v === 0 || level === 'easy' && v === 2) {
      // rounding two ways and the difference
      const big = byLevel(level, R.int(1000, 9999) * 100 + R.int(0, 99), R.int(100000, 999999) * 10 + R.int(0, 9), R.int(1000000, 9999999) * 10 + R.int(1, 9));
      const places = byLevel(level, [[100, 'hundred'], [1000, 'thousand']], [[1000, 'thousand'], [10000, 'ten thousand']], [[10000, 'ten thousand'], [100000, 'hundred thousand']]);
      const [p1, n1] = places[0], [p2, n2] = places[1];
      const r1 = Math.round(big / p1) * p1, r2 = Math.round(big / p2) * p2;
      const [a, b] = names(R, 2);
      const diff = Math.abs(r1 - r2);
      const built = numOpts(R, diff, [
        { v: Math.abs(Math.floor(big / p1) * p1 - Math.floor(big / p2) * p2), why: 'rounds both numbers down instead of to the nearest', tag: 'place' },
        { v: Math.abs(big - r2), why: 'compares the original number with only one rounded value', tag: 'part-only' },
        { v: Math.abs(big - r1), why: 'compares the original number with only one rounded value', tag: 'part-only' },
        { v: diff * 10, why: 'puts a digit in the wrong place', tag: 'place' },
        { v: p2 - p1, why: 'subtracts the place values instead of the rounded numbers', tag: 'misread' },
      ], { min: 0 });
      return item(`${a} and ${b} both round the number ${num(big)}. ${a} rounds it to the nearest ${n1}. ${b} rounds it to the nearest ${n2}. What is the difference between their answers?`,
        built, explainWith(`${a} gets ${num(r1)} and ${b} gets ${num(r2)}, so the difference is ${num(diff)}.`, built));
    }
    // multiply largest/smallest numbers of given digit lengths
    const d1 = byLevel(level, R.int(3, 4), R.int(3, 5), R.int(4, 6)), d2 = byLevel(level, 2, R.int(2, 3), R.int(2, 4));
    const largest1 = Math.pow(10, d1) - 1, smallest1 = Math.pow(10, d1 - 1);
    const largest2 = Math.pow(10, d2) - 1, smallest2 = Math.pow(10, d2 - 1);
    const mode = R.int(0, 1);
    const A = mode ? largest1 : smallest1, B = mode ? smallest2 : largest2;
    const who = name1(R);
    const ans = A * B;
    const built = numOpts(R, ans, [
      { v: (mode ? smallest1 : largest1) * (mode ? largest2 : smallest2), why: 'swaps which number is largest and which is smallest', tag: 'reversed' },
      { v: A * B / 10, why: 'drops a zero', tag: 'place' },
      { v: A * B * 10, why: 'adds an extra zero', tag: 'place' },
      { v: A + B, why: 'adds instead of multiplying', tag: 'operation' },
      { v: (mode ? largest1 + 1 : smallest1 - 1) * B, why: 'uses a number with the wrong number of digits', tag: 'off-by-one' },
    ], { min: 1 });
    const desc = (big, d) => `${big ? 'largest' : 'smallest'} ${words(d)}-digit whole number`;
    return item(`${who} multiplies the ${desc(mode === 1, d1)} by the ${desc(mode === 0, d2)}. What is the answer?`,
      built, explainWith(`The numbers are ${num(A)} and ${num(B)}, and ${num(A)} × ${num(B)} = ${num(ans)}.`, built));
  } });

/* ---- decimals: middle card / closest value ---- */
defMaths({ id: 'm-decimals', slot: 'decimals', topic: 'decimals', fam: 'Number',
  gen(R, level) {
    if (R.chance(0.5)) {
      const k = byLevel(level, 7, 9, 11);
      const set = new Set();
      while (set.size < k) {
        const d = byLevel(level, R.int(1, 2), R.int(1, 3), R.int(1, 3));
        const v = R.int(1, 9) / 10 + (d >= 2 ? R.int(0, 9) / 100 : 0) + (d >= 3 ? R.int(1, 9) / 1000 : 0);
        set.add(round6(byLevel(level, v, v, v + R.int(0, 1))));
      }
      const vals = Array.from(set);
      const sorted = vals.slice().sort((a, b) => a - b);
      const mid = sorted[Math.floor(k / 2)];
      const lex = vals.slice().sort((a, b) => String(a).length - String(b).length || a - b);
      const cands = [
        { v: lex[Math.floor(k / 2)], why: 'orders the cards by how many digits they have', tag: 'place' },
        { v: sorted[Math.floor(k / 2) - 1], why: 'is one card away from the middle', tag: 'off-by-one' },
        { v: sorted[Math.floor(k / 2) + 1], why: 'is one card away from the middle', tag: 'off-by-one' },
        { v: vals[Math.floor(k / 2)], why: 'takes the middle card before putting the cards in order', tag: 'misread' },
      ].concat(vals.map(v => ({ v, why: 'is not in the middle once the cards are in order', tag: 'place' })));
      const built = numOpts(R, mid, cands, { int: false, sort: false });
      return item(`Here are some number cards:<br>${R.shuffle(vals).map(v => `<span class="mono">[ ${v} ]</span>`).join(' ')}<br>${name1(R)} arranges all the cards in a line so that the numbers increase from left to right. Which number is on the middle card?`,
        built, explainWith(`In order: ${sorted.join(', ')}. The middle card is ${mid}.`, built));
    }
    // closest to a fraction
    const pairs = byLevel(level, [[3, 4], [2, 5], [7, 10], [1, 8], [3, 8]], [[5, 8], [7, 20], [11, 25], [5, 16], [7, 40]], [[13, 16], [17, 40], [9, 32], [23, 125], [19, 80]]);
    const [n, d] = R.pick(pairs);
    const target = n / d;
    const wrong = [
      { v: round6(n / d / 10), why: 'is the right digits with the decimal point in the wrong place', tag: 'place' },
      { v: round6(n / 10 + (d % 10) / 100), why: 'writes the numerator and denominator side by side as decimals', tag: 'misread' },
      { v: round6(target + byLevel(level, 0.04, 0.02, 0.006)), why: 'is close, but not as close as the answer', tag: 'slip' },
      { v: round6(target - byLevel(level, 0.05, 0.025, 0.008)), why: 'is close, but not as close as the answer', tag: 'slip' },
      { v: round6(d / n / 10), why: 'divides the wrong way round', tag: 'reversed' },
    ];
    const near = round6(Math.round(target * byLevel(level, 100, 1000, 1000)) / byLevel(level, 100, 1000, 1000) + byLevel(level, 0.002, 0.0004, 0.0003));
    const built = numOpts(R, near, wrong, { int: false, sort: false });
    return item(`Which of these numbers is closest to ${n}/${d}?`, built,
      explainWith(`${n}/${d} = ${round6(target)}, and ${near} is closest to it.`, built));
  } });

/* ---- number patterns ---- */
defMaths({ id: 'm-pattern', slot: 'pattern', topic: 'number patterns', fam: 'Patterns and algebra',
  gen(R, level) {
    const kind = byLevel(level, R.int(0, 2), R.int(1, 3), R.int(2, 4));
    let seq, ans, rule, cands, hideAt;
    if (kind === 0) { // arithmetic
      const a = R.int(3, 40), d = R.int(3, 13);
      seq = range(0, 5).map(i => a + i * d); hideAt = R.int(1, 4); rule = `add ${d} each time`;
    } else if (kind === 1) { // geometric
      const a = R.int(2, 5), r = R.int(2, 4);
      seq = range(0, 5).map(i => a * Math.pow(r, i)); hideAt = R.int(1, 4); rule = `multiply by ${r} each time`;
    } else if (kind === 2) { // growing difference
      const a = R.int(1, 20), d = R.int(1, 5), e = R.int(1, 3);
      seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + d + (i - 1) * e);
      hideAt = R.int(2, 5); rule = `the gap grows by ${e} each time`;
    } else if (kind === 3) { // alternating two operations
      const a = R.int(2, 9), m = R.int(2, 3), p = R.int(1, 6);
      seq = [a]; for (let i = 1; i < 6; i++) seq.push(i % 2 ? seq[i - 1] * m : seq[i - 1] + p);
      hideAt = R.int(2, 5); rule = `multiply by ${m}, then add ${p}, and repeat`;
    } else { // Fibonacci-like
      const a = R.int(1, 6), b = R.int(a + 1, 12);
      seq = [a, b]; for (let i = 2; i < 7; i++) seq.push(seq[i - 1] + seq[i - 2]);
      hideAt = R.int(3, 6); rule = 'each term is the sum of the two before it';
    }
    ans = seq[hideAt];
    const prev = seq[hideAt - 1], next = seq[hideAt + 1];
    cands = [
      { v: prev + (prev - seq[hideAt - 2 >= 0 ? hideAt - 2 : 0]), why: 'repeats the previous gap instead of following the rule', tag: 'part-only' },
      { v: next != null ? Math.round((prev + next) / 2) : ans + 1, why: 'takes the halfway point between the neighbours', tag: 'misread' },
      { v: ans + (seq[1] - seq[0]), why: 'adds the first gap once too often', tag: 'off-by-one' },
      { v: ans - 1, why: 'is one out', tag: 'slip' },
      { v: prev * 2, why: 'doubles the term before', tag: 'operation' },
    ];
    const shown = seq.slice(0, Math.max(hideAt + 2, 5)).map((x, i) => i === hideAt ? '▲' : num(x));
    const built = numOpts(R, ans, cands, { min: 0 });
    return item(`What is the missing number ▲ in this number pattern?<br><span class="mono">${shown.join(',&nbsp;&nbsp; ')}, …</span>`,
      built, explainWith(`The rule is: ${rule}. So ▲ = ${num(ans)}.`, built));
  } });

/* ---- remainders / factors / primes ---- */
defMaths({ id: 'm-factors', slot: 'factors', topic: 'factors and multiples', fam: 'Number',
  gen(R, level) {
    const v = R.int(0, 2);
    if (v === 0) {
      // same remainder except one
      const d = byLevel(level, R.pick([4, 5, 6]), R.pick([6, 7, 8, 9]), R.pick([11, 12, 13]));
      const r = R.int(1, d - 1);
      const set = new Set();
      while (set.size < 4) set.add(d * R.int(byLevel(level, 3, 8, 20), byLevel(level, 25, 60, 150)) + r);
      let odd;
      do { odd = d * R.int(byLevel(level, 3, 8, 20), byLevel(level, 25, 60, 150)) + R.int(0, d - 1); } while (odd % d === r || set.has(odd));
      const all = R.shuffle(Array.from(set).concat([odd]));
      const built = { options: all.map(String), answer: all.indexOf(odd),
        whys: all.map(x => x === odd ? null : `leaves remainder ${r} like the others`), tags: all.map(x => x === odd ? null : 'slip') };
      return item(`Four of these numbers leave the same remainder when divided by ${d}:<br><span class="mono">${all.join('&nbsp;&nbsp; ')}</span><br>Which number leaves a different remainder?`,
        built, `${odd} ÷ ${d} leaves remainder ${odd % d}; each of the others leaves remainder ${r}.`);
    }
    if (v === 1) {
      // largest multiple minus smallest prime in a range
      const lo = byLevel(level, R.int(20, 60), R.int(50, 150), R.int(100, 400)), hi = lo + byLevel(level, R.int(100, 300), R.int(300, 700), R.int(500, 2000));
      const m = byLevel(level, R.pick([4, 6, 9, 12]), R.pick([12, 15, 18, 25]), R.pick([17, 23, 27, 35]));
      let bigM = Math.floor((hi - 1) / m) * m;
      let p = lo + 1; while (!isPrime(p)) p++;
      const [a, b] = names(R, 2);
      const ans = bigM - p;
      const built = numOpts(R, ans, [
        { v: Math.floor(hi / m) * m - p + (hi % m === 0 ? 0 : m), why: 'uses a multiple that is not less than ' + hi, tag: 'off-by-one' },
        { v: bigM - (lo + 1), why: 'takes the first number above ' + lo + ' without checking it is prime', tag: 'misread' },
        { v: bigM - m - p, why: 'uses the second-largest multiple', tag: 'off-by-one' },
        { v: hi - p, why: 'uses ' + hi + ' itself, which is not allowed', tag: 'misread' },
        { v: bigM + p, why: 'adds instead of finding the difference', tag: 'operation' },
      ], { min: 0 });
      return item(`${a} and ${b} each think of a different whole number greater than ${lo} and less than ${hi}. ${a}'s number is a multiple of ${m}. ${b}'s number is a prime number. What is the difference between the largest possible value of ${a}'s number and the smallest possible value of ${b}'s number?`,
        built, explainWith(`The largest multiple of ${m} below ${hi} is ${bigM}; the smallest prime above ${lo} is ${p}. ${bigM} − ${p} = ${ans}.`, built));
    }
    // whole number range from inequalities: sum of possible values
    const a = byLevel(level, R.int(2, 4), R.int(3, 6), R.int(4, 9)), b = a * R.int(2, 3);
    const lim1 = a * R.int(8, 14) + R.int(1, a - 1 || 1), lim2 = b * R.int(3, 6) - R.int(1, 5);
    const poss = range(1, 400).filter(x => x * a < lim1 && x * b > lim2);
    if (poss.length < 2) return this.gen(R, level);
    const ans = sum(poss);
    const who = name1(R);
    const strict = poss;
    const incl = range(1, 400).filter(x => x * a <= lim1 && x * b >= lim2);
    const built = numOpts(R, ans, [
      { v: sum(incl) === ans ? ans + strict[strict.length - 1] + 1 : sum(incl), why: 'includes a number that only makes one of the answers equal, not less or greater', tag: 'off-by-one' },
      { v: strict.length, why: 'counts the possible numbers instead of adding them', tag: 'misread' },
      { v: strict[0] + strict[strict.length - 1], why: 'adds only the smallest and largest possibilities', tag: 'part-only' },
      { v: ans - strict[0], why: 'leaves out the smallest possibility', tag: 'off-by-one' },
    ], { min: 0 });
    return item(`${who} is thinking of a whole number. If ${who} multiplies the number by ${a}, the answer is less than ${lim1}. If ${who} multiplies the number by ${b}, the answer is greater than ${lim2}. There is more than one number ${who} could be thinking of. What is the sum of all of the numbers ${who} could be thinking of?`,
      built, explainWith(`The number must be less than ${num(round2(lim1 / a))} and greater than ${num(round2(lim2 / b))}, so it is one of ${strict.join(', ')}. Their sum is ${ans}.`, built));
  } });

/* ---- large-number arithmetic in context ---- */
defMaths({ id: 'm-big-arith', slot: 'big-arith', topic: 'operations', fam: 'Number',
  gen(R, level) {
    const v = R.int(0, 2);
    if (v === 0) {
      // number sentence matching a division with remainder
      const per = byLevel(level, R.int(6, 15), R.int(12, 25), R.int(17, 45)), groups = byLevel(level, R.int(7, 15), R.int(12, 25), R.int(15, 45)), left = R.int(1, per - 1);
      const total = per * groups + left;
      const thing = R.pick([['eggs', 'cartons'], ['oranges', 'baskets'], ['pencils', 'boxes'], ['books', 'shelves'], ['seedlings', 'trays']]);
      const right = `${groups} × ${per} + ${left} = ${total}`;
      const wrongs = [
        { s: `${groups} × ${per} − ${left} = ${total}`, why: 'takes the leftovers away instead of adding them', tag: 'reversed' },
        { s: `${total} ÷ ${groups} + ${left} = ${per}`, why: 'adds the leftovers to the share instead of the total', tag: 'misread' },
        { s: `${groups} × ${left} + ${per} = ${total}`, why: 'mixes up the share and the leftovers', tag: 'misread' },
        { s: `${total} − ${left} = ${groups} + ${per}`, why: 'adds two numbers that should be multiplied', tag: 'operation' },
      ];
      const built = textOpts(R, right, wrongs, { n: 5 });
      return item(`A farmer has ${total} ${thing[0]}. They are shared equally among ${groups} ${thing[1]} and there are ${left} ${thing[0]} left over. Each of the ${thing[1]} holds ${per} ${thing[0]}. Which number sentence matches this information?`,
        built, `${groups} ${thing[1]} of ${per} make ${groups * per}; adding the ${left} left over gives ${total}.`);
    }
    if (v === 1) {
      // container mass: scale minus empty jar
      const need = byLevel(level, R.int(40, 90) * 10, R.int(60, 150) * 10, R.int(105, 260) * 10);
      const jar = byLevel(level, R.int(15, 40) * 10, R.int(18, 45) * 10 + 5, R.int(21, 55) * 10 + 5);
      const reading = jar + R.int(10, Math.floor(need / 10) - 5) * 10;
      const have = reading - jar;
      const ans = need - have;
      const who = name1(R);
      const thing = R.pick(['cooking sauce', 'flour', 'rice', 'honey', 'yoghurt']);
      const built = numOpts(R, ans, [
        { v: need - reading, why: 'forgets to take off the mass of the empty jar', tag: 'part-only' },
        { v: have, why: 'gives the amount already in the jar', tag: 'misread' },
        { v: need - jar, why: 'subtracts the jar from the amount needed', tag: 'misread' },
        { v: ans + 100, why: 'is 100 g out', tag: 'slip' },
      ], { min: 1, fmt: x => num(x) + ' g' });
      return item(`${who} needs ${num(need)} grams of ${thing}. A glass jar of ${thing} is put on a scale and the scale reads ${num(reading)} g. The jar weighs ${jar} g when empty. How much more ${thing} does ${who} need?`,
        built, explainWith(`The jar holds ${reading} − ${jar} = ${have} g, so ${who} needs ${need} − ${have} = ${ans} g more.`, built));
    }
    // estimating a product / quotient
    const a = byLevel(level, R.int(18, 49), R.int(41, 99), R.int(101, 499)), b = byLevel(level, R.int(18, 49), R.int(21, 99), R.int(41, 199));
    const x = a * b + byLevel(level, 0, R.int(1, 9), R.int(1, 99));
    const q = x / a;
    const ans = Math.round(q);
    const who = name1(R);
    const built = numOpts(R, ans, [
      { v: Math.round(x / b), why: 'divides by the other number', tag: 'misread' },
      { v: Math.round(q * 10), why: 'is ten times too big', tag: 'place' },
      { v: Math.round(q / 10) || 1, why: 'is ten times too small', tag: 'place' },
      { v: ans + 2, why: 'is a rough estimate that is too high', tag: 'slip' },
      { v: ans - 2, why: 'is a rough estimate that is too low', tag: 'slip' },
    ], { min: 1 });
    return item(`${who} divides ${num(x)} by ${a}. Which of these is the answer rounded to the nearest whole number?`,
      built, explainWith(`${num(x)} ÷ ${a} = ${num(round2(q))}, which rounds to ${ans}.`, built));
  } });
