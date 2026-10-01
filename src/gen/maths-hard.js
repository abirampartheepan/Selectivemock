/* ==========================================================================
   Mathematical Reasoning — challenge generators. Medium papers take a few of
   these; Hard papers replace the quick opening questions with them, which is
   what makes a Hard paper far tougher than the real test.
   All of these use slot 'challenge-x'.
   ========================================================================== */
'use strict';

function defHard(g) { g.slot = 'challenge-x'; g.fam = g.fam || 'Problem solving'; defMaths(g); }

defHard({ id: 'h-meet', topic: 'meeting problems',
  gen(R, level) {
    const [A, B] = names(R, 2);
    const va = R.pick([12, 15, 16, 18, 20]), vb = R.pick([10, 12, 14, 24, 30]);
    const delay = byLevel(level, 0, R.pick([15, 30]), R.pick([20, 30, 40]));
    const tMeet = R.pick([1, 1.5, 2, 2.5, 3]) ; // hours after B starts
    const D = round6(va * (tMeet + delay / 60) + vb * tMeet);
    if (!isInt(D * 2)) return this.gen(R, level);
    const fromA = round6(va * (tMeet + delay / 60));
    const ans = fromA;
    const built = numOpts(R, ans, [
      { v: round6(D * va / (va + vb)), why: `ignores ${A}'s head start`, tag: 'part-only' },
      { v: round6(D - fromA), why: `gives the distance from ${B}'s town`, tag: 'misread' },
      { v: round6(va * tMeet), why: `forgets the time ${A} rode alone`, tag: 'part-only' },
      { v: round6(D / 2), why: 'assumes they meet halfway', tag: 'misread' },
    ], { fmt: x => num(x) + ' km', int: false, min: 0.5 });
    return item(`${A} and ${B} live ${num(D)} km apart and cycle towards each other along the same road. ${A} rides at ${va} km/h and ${B} at ${vb} km/h.${delay ? ` ${A} sets off ${delay} minutes before ${B}.` : ' They set off at the same time.'} How far from ${A}'s home do they meet?`, built,
      explainWith(`${delay ? `In the first ${delay} minutes ${A} covers ${num(va * delay / 60)} km, leaving ${num(D - va * delay / 60)} km. ` : ''}Together they close the gap at ${va + vb} km/h, so they meet ${num(tMeet)} hours after ${B} starts. ${A} has then ridden ${num(fromA)} km.`, built));
  } });

defHard({ id: 'h-work-share', topic: 'shared work',
  gen(R, level) {
    const [A, B] = names(R, 2);
    const a = R.pick([6, 8, 10, 12, 15]), b = R.pick([10, 12, 15, 20, 24, 30]);
    if (a === b) return this.gen(R, level);
    const k = R.int(1, byLevel(level, 2, 3, 4));
    const done = k / a + k / b;
    if (done >= 1) return this.gen(R, level);
    const restDays = round6((1 - done) * b);
    if (!isInt(restDays * 2)) return this.gen(R, level);
    const built = numOpts(R, restDays, [
      { v: b - k, why: `forgets the work ${A} did`, tag: 'part-only' },
      { v: round6((1 - done) * a), why: `uses ${A}'s rate for the rest`, tag: 'misread' },
      { v: round6(b - k * 2), why: 'counts the shared days twice', tag: 'operation' },
      { v: round6(restDays + k), why: 'adds the shared days on', tag: 'misread' },
    ], { fmt: x => plural(x, 'day'), int: false, min: 0.5 });
    return item(`${A} can paint a fence alone in ${a} days. ${B} can paint the same fence alone in ${b} days. They work together for ${plural(k, 'day')}, then ${A} stops. How many more days does ${B} need to finish the fence?`, built,
      explainWith(`Each day together they paint 1/${a} + 1/${b} of the fence. In ${k} day${k > 1 ? 's' : ''} that is ${frac(Math.round(done * a * b), a * b)}, leaving ${frac(Math.round((1 - done) * a * b), a * b)}. ${B} alone does 1/${b} a day, so ${num(restDays)} more days.`, built));
  } });

defHard({ id: 'h-mixture', topic: 'mixtures',
  gen(R, level) {
    const vol = R.pick([2, 3, 4, 5, 6]) * byLevel(level, 1, 1, 2);
    const p = R.pick([20, 25, 30, 40, 50, 60]);
    const q = R.pick([10, 12, 15, 20, 24, 25].filter(x => x < p));
    if (!q) return this.gen(R, level);
    const water = round6(vol * p / q - vol);
    if (!isInt(water * 4)) return this.gen(R, level);
    const built = numOpts(R, water, [
      { v: round6(vol * (p - q) / 100), why: 'subtracts the percentages as if they were litres', tag: 'units' },
      { v: round6(vol * p / q), why: 'gives the final volume, not the water added', tag: 'misread' },
      { v: round6(vol * q / p), why: 'divides the percentages the wrong way round', tag: 'reversed' },
      { v: round6(vol * (p - q) / q / 2), why: 'adds only half the water needed', tag: 'part-only' },
    ], { fmt: x => num(x) + ' L', int: false, min: 0.25 });
    return item(`A jug holds ${vol} L of drink that is ${p}% juice and the rest water. How much water must be added so that the drink is ${q}% juice?`, built,
      explainWith(`The juice stays at ${num(vol * p / 100)} L. For that to be ${q}%, the total must be ${num(vol * p / 100)} ÷ ${q / 100} = ${num(vol * p / q)} L, so add ${num(water)} L of water.`, built));
  } });

defHard({ id: 'h-digits-reverse', topic: 'digit problems',
  gen(R, level) {
    const sols = [];
    const s = R.int(byLevel(level, 7, 9, 9), byLevel(level, 12, 14, 16));
    const diff = R.pick([9, 18, 27, 36, 45, 54]);
    for (let t = 1; t <= 9; t++) for (let u = 0; u <= 9; u++) if (t + u === s && (10 * u + t) - (10 * t + u) === diff) sols.push(10 * t + u);
    if (sols.length !== 1) return this.gen(R, level);
    const n = sols[0];
    const rev = Number(String(n).split('').reverse().join(''));
    const built = numOpts(R, n, [
      { v: rev, why: 'gives the number after its digits are swapped', tag: 'reversed' },
      { v: n + diff, why: 'adds the difference to the answer', tag: 'misread' },
      { v: s * 10 - diff, why: 'is a slip in setting up the problem', tag: 'slip' },
      { v: n + 9, why: 'swaps one digit for the next', tag: 'slip' },
    ], { min: 10 });
    return item(`A two-digit number has digits that add to ${s}. When its two digits are swapped, the new number is ${diff} more than the original. What is the original number?`, built,
      explainWith(`Swapping the digits changes the number by 9 × (difference of the digits), so the digits differ by ${diff / 9}. Digits that add to ${s} and differ by ${diff / 9}, with the smaller first: ${n}.`, built));
  } });

defHard({ id: 'h-consecutive', topic: 'consecutive numbers',
  gen(R, level) {
    const k = byLevel(level, R.int(3, 5), R.int(4, 7), R.int(5, 9));
    const start = R.int(5, 60);
    const nums = range(start, start + k - 1);
    const S = sum(nums);
    const ask = R.pick(['largest', 'smallest']);
    const ans = ask === 'largest' ? nums[k - 1] : nums[0];
    const built = numOpts(R, ans, [
      { v: Math.round(S / k), why: 'gives the middle number', tag: 'misread' },
      { v: ask === 'largest' ? nums[0] : nums[k - 1], why: `gives the ${ask === 'largest' ? 'smallest' : 'largest'} number`, tag: 'reversed' },
      { v: ans + (ask === 'largest' ? 1 : -1), why: 'is one out', tag: 'off-by-one' },
      { v: Math.round(S / k) + k, why: 'adds the count to the middle', tag: 'operation' },
    ], { min: 1 });
    return item(`${words(k).replace(/^./, c => c.toUpperCase())} consecutive whole numbers add up to ${S}. What is the ${ask} of the numbers?`, built,
      explainWith(`The middle of ${k} consecutive numbers is their mean: ${S} ÷ ${k} = ${num(S / k)}. The numbers are ${nums.join(', ')}, so the ${ask} is ${ans}.`, built));
  } });

defHard({ id: 'h-heads-legs', topic: 'heads and legs',
  gen(R, level) {
    const c = R.int(4, 30), k = R.int(3, 25);
    const three = level === 'hard' && R.chance(0.5);
    if (!three) {
      const heads = c + k, legs = 2 * c + 4 * k;
      const built = numOpts(R, k, [
        { v: c, why: 'gives the number of chickens', tag: 'misread' },
        { v: legs / 4, why: 'assumes every animal has four legs', tag: 'misread' },
        { v: Math.round(heads / 2), why: 'splits the animals in half', tag: 'misread' },
        { v: legs / 2 - heads, why: 'is right by a lucky slip', tag: 'slip' },
        { v: k + 2, why: 'is an arithmetic slip', tag: 'slip' },
      ], { min: 1 });
      return item(`A farm has only chickens and cows. Altogether they have ${heads} heads and ${legs} legs. How many cows are there?`, built,
        explainWith(`If every animal were a chicken there would be ${2 * heads} legs. The extra ${legs - 2 * heads} legs come from cows, 2 extra each: ${k} cows.`, built));
    }
    const sp = R.int(2, 8);
    const heads = c + k + sp, legs = 2 * c + 4 * k + 8 * sp;
    // condition: twice as many chickens as ... make unique using spiders count given
    const built = numOpts(R, k, [
      { v: c, why: 'gives the number of birds', tag: 'misread' },
      { v: Math.round((legs - 8 * sp) / 4), why: 'assumes the rest all have four legs', tag: 'part-only' },
      { v: k + sp, why: 'adds the spiders', tag: 'misread' },
      { v: k - 1, why: 'is one out', tag: 'off-by-one' },
    ], { min: 1 });
    return item(`A nature park has birds (2 legs), goats (4 legs) and ${sp} spiders (8 legs). Altogether there are ${heads} heads and ${legs} legs. How many goats are there?`, built,
      explainWith(`Take away the spiders: ${heads - sp} heads and ${legs - 8 * sp} legs. If all were birds there would be ${2 * (heads - sp)} legs; the extra ${legs - 8 * sp - 2 * (heads - sp)} legs give ${k} goats.`, built));
  } });

defHard({ id: 'h-page-digits', topic: 'counting digits',
  gen(R, level) {
    const N = byLevel(level, R.int(20, 99), R.int(100, 400), R.int(120, 999));
    let D = 0; for (let i = 1; i <= N; i++) D += String(i).length;
    const built = numOpts(R, N, [
      { v: Math.round(D / 3), why: 'divides every digit count by 3', tag: 'operation' },
      { v: Math.round(D / 2), why: 'divides every digit count by 2', tag: 'operation' },
      { v: N - 9, why: 'forgets the one-digit pages', tag: 'part-only' },
      { v: N + 1, why: 'is one page out', tag: 'off-by-one' },
    ], { min: 1 });
    return item(`The pages of a book are numbered 1, 2, 3, … in order. Printing all the page numbers uses ${num(D)} digits altogether. How many pages does the book have?`, built,
      explainWith(`Pages 1–9 use 9 digits${N >= 10 ? ` and pages 10–${Math.min(N, 99)} use ${2 * (Math.min(N, 99) - 9)}` : ''}${N >= 100 ? `; the remaining ${D - 9 - 180} digits are 3 per page, ${(D - 189) / 3} pages from 100` : ''}. So the last page is ${N}.`, built));
  } });

defHard({ id: 'h-units-digit', topic: 'patterns in powers',
  gen(R, level) {
    const a = R.pick([2, 3, 7, 8, 13, 17]), n = byLevel(level, R.int(10, 40), R.int(40, 200), R.int(100, 2025));
    let u = 1; for (let i = 0; i < n; i++) u = (u * a) % 10;
    const cyc = []; let x = a % 10; while (!cyc.includes(x)) { cyc.push(x); x = (x * a) % 10; }
    const built = { options: ['1', '3', '7', '9', '2', '4', '6', '8'].filter(d => cyc.includes(Number(d)) || Number(d) === u), answer: 0, whys: [], tags: [] };
    let opts = Array.from(new Set(cyc.map(String).concat([String(u), '0', '5']))).slice(0, 5);
    if (!opts.includes(String(u))) opts[0] = String(u);
    while (opts.length < 5) opts.push(String(R.int(0, 9)));
    opts = Array.from(new Set(opts)); while (opts.length < 5) { const d = String(R.int(0, 9)); if (!opts.includes(d)) opts.push(d); }
    opts.sort((p, q) => Number(p) - Number(q));
    built.options = opts; built.answer = opts.indexOf(String(u));
    built.whys = opts.map(o => o === String(u) ? null : 'comes from a wrong step in the repeating pattern');
    built.tags = opts.map(o => o === String(u) ? null : 'off-by-one');
    return item(`What is the last digit of ${a}<sup>${n}</sup>? (${a}<sup>${n}</sup> means ${n} lots of ${a} multiplied together.)`, built,
      `The last digits of the powers of ${a} repeat in a cycle of ${cyc.length}: ${cyc.join(', ')}. ${n} leaves remainder ${n % cyc.length || cyc.length} on dividing by ${cyc.length}... so the last digit is ${u}.`.replace(`${n % cyc.length || cyc.length} on dividing by ${cyc.length}...`, `${n % cyc.length} when divided by ${cyc.length}`));
  } });

defHard({ id: 'h-fast-clock', topic: 'clocks that gain time',
  gen(R, level) {
    const gain = byLevel(level, R.pick([2, 3, 5]), R.pick([2, 3, 4, 5, 6]), R.pick([3, 4, 6, 7, 9]));
    const set = R.int(6, 11) * 60;
    const hrs = byLevel(level, R.int(3, 8), R.int(6, 12), R.int(10, 30));
    const real = set + hrs * 60;
    const shows = real + gain * hrs;
    const fast = R.chance(0.6);
    const shown = fast ? shows : real - gain * hrs;
    const built = numOpts(R, shown, [
      { v: real, why: 'ignores the clock\'s error', tag: 'part-only' },
      { v: fast ? real - gain * hrs : shows, why: `treats the clock as ${fast ? 'slow' : 'fast'}`, tag: 'reversed' },
      { v: fast ? real + gain : real - gain, why: 'adds the error for one hour only', tag: 'part-only' },
      { v: fast ? shows + gain : shown - gain, why: 'counts one hour too many', tag: 'off-by-one' },
    ], { fmt: time12, min: 0 });
    return item(`A clock ${fast ? 'gains' : 'loses'} ${gain} minutes every hour. It is set to the correct time at ${time12(set)}. What time does it show when the correct time is ${time12(real)}${real >= 1440 ? ' the next day' : ''}?`, built,
      explainWith(`${hrs} hours pass, so the clock is ${fast ? 'ahead' : 'behind'} by ${hrs} × ${gain} = ${hrs * gain} minutes. It shows ${time12(shown)}.`, built));
  } });

defHard({ id: 'h-mean-remove', topic: 'changing the mean',
  gen(R, level) {
    const n = R.int(5, 12), m1 = R.int(20, 60), m2 = m1 + R.pick([-3, -2, 2, 3, 4]);
    const removed = n * m1 - (n - 1) * m2;
    if (removed <= 0) return this.gen(R, level);
    const built = numOpts(R, removed, [
      { v: m1 - m2 + m1, why: 'shifts the mean only once', tag: 'part-only' },
      { v: Math.abs(m1 - m2), why: 'gives the change in the mean', tag: 'misread' },
      { v: (n - 1) * m2, why: 'gives the new total', tag: 'misread' },
      { v: removed + (m2 - m1), why: 'is out by the change in the mean', tag: 'slip' },
    ], { min: 0 });
    return item(`The mean of ${n} numbers is ${m1}. One number is removed and the mean of the ${n - 1} numbers left is ${m2}. What number was removed?`, built,
      explainWith(`The total was ${n} × ${m1} = ${n * m1}. Afterwards it is ${n - 1} × ${m2} = ${(n - 1) * m2}. The removed number is ${removed}.`, built));
  } });

defHard({ id: 'h-coins', topic: 'coin problems',
  gen(R, level) {
    const [a, b] = R.pick([[20, 50], [10, 50], [50, 200], [20, 100], [5, 20]]);
    const x = R.int(3, 25), y = R.int(3, 25);
    const n = x + y, total = a * x + b * y;
    const who = name1(R);
    const fmt = c => c >= 100 ? '$' + c / 100 : c + 'c';
    const built = numOpts(R, y, [
      { v: x, why: `gives the number of ${fmt(a)} coins`, tag: 'misread' },
      { v: Math.round(total / b), why: `assumes every coin is ${fmt(b)}`, tag: 'part-only' },
      { v: Math.round(n / 2), why: 'splits the coins evenly', tag: 'misread' },
      { v: y + 1, why: 'is one out', tag: 'off-by-one' },
    ], { min: 0 });
    return item(`${who} has ${n} coins, all ${fmt(a)} and ${fmt(b)} coins. Their total value is ${money(total / 100)}. How many ${fmt(b)} coins does ${who} have?`, built,
      explainWith(`If all ${n} were ${fmt(a)}, the value would be ${money(n * a / 100)}. Each ${fmt(b)} coin adds ${b - a}c more, and ${money((total - n * a) / 100)} ÷ ${b - a}c = ${y}.`, built));
  } });

defHard({ id: 'h-grid-triangle', topic: 'area on a grid', fam: 'Space and geometry',
  gen(R, level) {
    const W = 8, H = 6;
    let P, area;
    for (let t = 0; t < 100; t++) {
      P = [[R.int(0, W), R.int(0, H)], [R.int(0, W), R.int(0, H)], [R.int(0, W), R.int(0, H)]];
      area = Math.abs(P[0][0] * (P[1][1] - P[2][1]) + P[1][0] * (P[2][1] - P[0][1]) + P[2][0] * (P[0][1] - P[1][1])) / 2;
      const axis = P.some((p, i) => P.some((q, j) => i < j && (p[0] === q[0] || p[1] === q[1])));
      if (area >= 5 && (level === 'hard' ? !axis : true)) break;
    }
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const box = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) * (Math.max.apply(null, ys) - Math.min.apply(null, ys));
    const built = numOpts(R, area, [
      { v: box, why: 'gives the area of the surrounding rectangle', tag: 'part-only' },
      { v: box / 2, why: 'halves the surrounding rectangle', tag: 'misread' },
      { v: area + 1, why: 'miscounts a part square', tag: 'slip' },
      { v: area - 1.5, why: 'miscounts a part square', tag: 'slip' },
    ], { fmt: x => num(x) + ' cm²', int: false, min: 0.5 });
    const c = 26, pad = 6;
    const pic = gridSvg(W, H, [], { cell: c, extra: [() => poly(P.map(([x, y]) => [pad + x * c, pad + y * c]), { fill: 'a' })] });
    return item(`The triangle is drawn on a grid of 1 cm squares. What is its area?`, built,
      explainWith(`Draw the smallest rectangle around the triangle (${box} cm²) and subtract the right-angled triangles outside the shaded one. The area is ${num(area)} cm².`, built), { svg: pic });
  } });

defHard({ id: 'h-remainders', topic: 'remainders',
  gen(R, level) {
    const divs = R.pick([[2, 3, 4], [3, 4, 5], [2, 3, 5], [4, 5, 6], [2, 3, 4, 5, 6], [3, 5, 7], [2, 5, 9], [4, 6, 9], [3, 4, 7], [5, 6, 8]]);
    const minD = Math.min.apply(null, divs);
    const r = R.int(1, minD - 1);
    const L = divs.reduce(lcm);
    const must = R.pick([7, 11, 13, 17, 19, 23].filter(m => !divs.includes(m)));
    const mode = R.pick(['smallest', 'smallest', 'largest3']);
    let n = null;
    if (mode === 'smallest') { for (let k = 1; k < 2000; k++) { const v = L * k + r; if (v % must === 0) { n = v; break; } } }
    else { for (let k = Math.floor(999 / L); k >= 1; k--) { const v = L * k + r; if (v <= 999 && v >= 100 && v % must === 0) { n = v; break; } } }
    if (!n) return this.gen(R, level);
    const built = numOpts(R, n, [
      { v: mode === 'smallest' ? L + r : n - L, why: `does not check divisibility by ${must}`, tag: 'part-only' },
      { v: L * must, why: 'multiplies the divisors together', tag: 'operation' },
      { v: mode === 'smallest' ? n + L * must : n - L * must, why: mode === 'smallest' ? 'gives a later number that works' : 'gives a smaller number that works', tag: 'misread' },
      { v: n - r, why: 'forgets the remainder', tag: 'part-only' },
    ], { min: 1 });
    return item(mode === 'smallest' ? `What is the smallest whole number that leaves a remainder of ${r} when divided by each of ${listAnd(divs.map(String))}, and is also a multiple of ${must}?`
      : `What is the largest three-digit number that leaves a remainder of ${r} when divided by each of ${listAnd(divs.map(String))}, and is also a multiple of ${must}?`, built,
      explainWith(`Numbers leaving remainder ${r} are ${r} more than a multiple of ${L}: ${L + r}, ${2 * L + r}, ${3 * L + r}, … The ${mode === 'smallest' ? 'first' : 'largest three-digit one'} of these that ${must} divides is ${n}.`, built));
  } });

defHard({ id: 'h-train-length', topic: 'speed and length',
  gen(R, level) {
    const len = R.int(8, 30) * 10, speedMs = R.pick([10, 15, 20, 25]);
    const bridge = R.int(10, 60) * 10;
    const t = (len + bridge) / speedMs;
    if (!isInt(t)) return this.gen(R, level);
    const ask = R.chance(0.5);
    const ans = ask ? t : len;
    const built = numOpts(R, ans, ask ? [
      { v: bridge / speedMs, why: 'forgets the length of the train', tag: 'part-only' },
      { v: len / speedMs, why: 'uses only the train', tag: 'part-only' },
      { v: (bridge - len) / speedMs, why: 'subtracts the lengths', tag: 'operation' },
      { v: t + 2, why: 'is a slip', tag: 'slip' },
    ] : [
      { v: speedMs * t, why: 'gives the total distance travelled', tag: 'part-only' },
      { v: bridge, why: 'gives the bridge length', tag: 'misread' },
      { v: speedMs * t - bridge + 20, why: 'is a slip', tag: 'slip' },
      { v: Math.round(bridge / 2), why: 'halves the bridge', tag: 'misread' },
    ], { fmt: x => ask ? plural(x, 'second') : x + ' m', min: 1 });
    return item(ask ? `A train ${len} m long travels at ${speedMs} metres per second. How long does it take from the moment its front reaches a ${bridge} m bridge until its back leaves the bridge?`
                    : `A train travels at ${speedMs} metres per second. From the moment its front reaches a ${bridge} m bridge until its back leaves the bridge takes ${t} seconds. How long is the train?`, built,
      explainWith(`The front must travel the bridge plus the train's own length: ${bridge} + ${len} = ${bridge + len} m, which takes ${t} seconds at ${speedMs} m/s.`, built));
  } });

defHard({ id: 'h-ratio-add', topic: 'changing ratios',
  gen(R, level) {
    const [A, B] = names(R, 2);
    const a = R.int(2, 7), b = R.int(1, a - 1 || 1);
    if (gcd(a, b) !== 1 || a === b) return this.gen(R, level);
    const unit = R.int(3, 12);
    const x = a * unit, y = b * unit;
    const add = R.int(2, 15);
    const g = gcd(x + add, y + add);
    const c = (x + add) / g, d = (y + add) / g;
    if (c > 12 || d > 12 || (c === a && d === b)) return this.gen(R, level);
    const built = numOpts(R, x + y, [
      { v: x + y + 2 * add, why: 'gives the total after the extra cards', tag: 'misread' },
      { v: x, why: `gives ${A}'s starting number only`, tag: 'part-only' },
      { v: (a + b) * add, why: 'multiplies the ratio by the cards added', tag: 'operation' },
      { v: (c + d) * unit, why: 'uses the new ratio with the old part size', tag: 'misread' },
    ], { min: 1 });
    return item(`${A} and ${B} have trading cards in the ratio ${a} : ${b}. Each of them is then given ${add} more cards, and the ratio becomes ${c} : ${d}. How many cards did they have altogether at the start?`, built,
      explainWith(`Try multiples of the first ratio: ${a}k and ${b}k with ${add} added to each must be in the ratio ${c} : ${d}. That happens when k = ${unit}: ${x} and ${y}, total ${x + y}.`, built));
  } });

defHard({ id: 'h-squares-in-grid', topic: 'counting shapes', fam: 'Space and geometry',
  gen(R, level) {
    const w = byLevel(level, R.int(3, 6), R.int(4, 7), R.int(5, 9)), h = byLevel(level, R.int(2, 4), R.int(3, 5), R.int(3, 6));
    if (w === h && R.chance(0.7)) return this.gen(R, level);
    let total = 0; for (let s = 1; s <= Math.min(w, h); s++) total += (w - s + 1) * (h - s + 1);
    const rects = (w * (w + 1) / 2) * (h * (h + 1) / 2);
    const askRect = level !== 'easy' && R.chance(0.5);
    const ans = askRect ? rects : total;
    const built = numOpts(R, ans, [
      { v: w * h, why: 'counts only the smallest squares', tag: 'part-only' },
      { v: askRect ? total : rects, why: askRect ? 'counts only the squares' : 'counts every rectangle, not just squares', tag: 'misread' },
      { v: ans - 1, why: 'forgets the largest one', tag: 'off-by-one' },
      { v: w * h + Math.min(w, h), why: 'misses the middle sizes', tag: 'part-only' },
    ], { min: 1 });
    const pic = gridSvg(w, h, [], { cell: 30 });
    return item(`How many ${askRect ? 'rectangles (including squares)' : 'squares of any size'} can be found in this ${w} by ${h} grid?`, built,
      explainWith(askRect ? `Choose 2 of the ${w + 1} vertical lines (${w * (w + 1) / 2} ways) and 2 of the ${h + 1} horizontal lines (${h * (h + 1) / 2} ways): ${rects}.` : `Count by size: ${range(1, Math.min(w, h)).map(s => `${(w - s + 1) * (h - s + 1)} of size ${s}`).join(', ')}, total ${total}.`, built), { svg: pic });
  } });
