/* ==========================================================================
   Mathematical Reasoning — graphs, tables, probability and counting
   ========================================================================== */
'use strict';

/* ---- column graph with a missing pair of bars ---- */
defMaths({ id: 'm-graph-missing', slot: 'graph', topic: 'column graphs', fam: 'Data and chance',
  gen(R, level) {
    const total = byLevel(level, R.int(6, 10) * 5, R.int(8, 14) * 5, R.int(10, 20) * 5);
    const labels = ['0', '1', '2', '3', '4'];
    const k = byLevel(level, 2, 3, R.pick([2, 3]));
    const b = R.int(1, byLevel(level, 4, 4, 5)); // count for "3 pets"
    const a = k * b; // count for "2 pets"
    const rest = total - a - b;
    if (rest < 6) return this.gen(R, level);
    // split rest over 0, 1, 4
    const r0 = R.int(1, rest - 2), r1 = R.int(1, rest - r0 - 1), r4 = rest - r0 - r1;
    if (r4 < 1 || Math.max(r0, r1, r4) > 20) return this.gen(R, level);
    const vals = [r0, r1, null, null, r4];
    const pic = barChart(labels, vals, { xLabel: 'number of pets', yLabel: 'children', max: Math.max(r0, r1, r4, a), step: byLevel(level, 1, 2, 2) });
    const ask2 = R.chance(0.5);
    const ans = ask2 ? a : b;
    const built = numOpts(R, ans, [
      { v: ask2 ? b : a, why: 'answers for the other missing bar', tag: 'misread' },
      { v: a + b, why: 'gives the two missing bars together', tag: 'part-only' },
      { v: Math.round((a + b) / 2), why: 'shares the missing children equally', tag: 'misread' },
      { v: ans + 2, why: 'misreads a bar', tag: 'slip' },
    ], { min: 1 });
    return item(`${total} children were asked how many pets they have. The column graph shows the results, but the bars for two and three pets are missing. The number of children with two pets is ${k === 2 ? 'twice' : 'three times'} the number with three pets. How many children have ${ask2 ? 'two' : 'three'} pets?`, built,
      explainWith(`The bars shown add to ${rest}, so ${total - rest} children have two or three pets. Splitting ${total - rest} in the ratio ${k} : 1 gives ${a} with two pets and ${b} with three.`, built), { svg: pic });
  } });

/* ---- line graph statements ---- */
defMaths({ id: 'm-graph-line', slot: 'graph', topic: 'line graphs', fam: 'Data and chance',
  gen(R, level) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const n = byLevel(level, 6, 7, 8);
    const xs = months.slice(0, n);
    const hi = [R.int(18, 30)]; for (let i = 1; i < n; i++) hi.push(Math.max(8, Math.min(40, hi[i - 1] + R.int(-6, 6))));
    const lo = hi.map(h => h - R.int(4, 12));
    const series = [{ name: 'highest', vals: hi }, { name: 'lowest', vals: lo, dash: true }];
    const pic = lineChart(xs, series, { min: Math.min.apply(null, lo) < 0 ? -10 : 0, step: 5 });
    const i1 = R.int(0, n - 1), i2 = R.int(0, n - 1);
    const s1v = hi[i1] > 2 * lo[i2];
    const s1 = { t: `The highest temperature in ${xs[i1]} was more than twice the lowest temperature in ${xs[i2]}.`, v: s1v };
    const gaps = hi.map((h, i) => h - lo[i]);
    const gi = gaps.indexOf(Math.max.apply(null, gaps));
    const claimI = R.chance(0.5) ? gi : R.int(0, n - 1);
    const s2 = { t: `The biggest difference between the highest and lowest temperatures was in ${xs[claimI]}.`, v: gaps[claimI] === gaps[gi] };
    const j = R.int(0, n - 2);
    const rise = hi[j + 1] - hi[j];
    const claim = rise + (R.chance(0.5) ? 0 : R.pick([-2, 2, 3]));
    const s3 = { t: `The highest temperature ${claim >= 0 ? 'rose' : 'fell'} by ${Math.abs(claim)} degrees from ${xs[j]} to ${xs[j + 1]}.`, v: claim === rise && claim !== 0 };
    const built = statementOpts(R, [s1.v, s2.v, s3.v], ['1', '2', '3']);
    return item(`The graph shows the highest and lowest temperatures (°C) recorded in a town each month. Which of these statements is/are correct?<br>1&nbsp; ${s1.t}<br>2&nbsp; ${s2.t}<br>3&nbsp; ${s3.t}`, built,
      `Read the values from the graph: highest ${hi.join(', ')}; lowest ${lo.join(', ')}. Statement 1 is ${s1.v ? 'true' : 'false'}, statement 2 is ${s2.v ? 'true' : 'false'} and statement 3 is ${s3.v ? 'true' : 'false'}.`, { svg: pic });
  } });

/* ---- two-way table ---- */
defMaths({ id: 'm-two-way', slot: 'graph', topic: 'tables', fam: 'Data and chance',
  gen(R, level) {
    const rows = ['Year 5', 'Year 6'], cols = R.pick([['soccer', 'netball', 'swimming'], ['art', 'music', 'drama'], ['bus', 'car', 'walk']]);
    const t = rows.map(() => cols.map(() => R.int(4, 25)));
    const hide = byLevel(level, 1, 2, 3);
    const totalsR = t.map(r => sum(r)), totalsC = cols.map((_, j) => t[0][j] + t[1][j]), grand = sum(totalsR);
    const grid = [[''].concat(cols, ['total'])].concat(rows.map((r, i) => [r].concat(t[i].map(String), [String(totalsR[i])])), [['total'].concat(totalsC.map(String), [String(grand)])]);
    // choose cells to hide (in the body), ask for one
    const cells = R.sample([[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]], hide);
    cells.forEach(([r, c]) => { grid[r][c] = '?'; });
    // make sure the asked cell is solvable: hide only one per row and per column, which keeps every cell recoverable
    const okRows = new Set(cells.map(c => c[0])).size === cells.length, okCols = new Set(cells.map(c => c[1])).size === cells.length;
    if (!okRows && !okCols) return this.gen(R, level);
    const [ar, ac] = cells[0];
    const ans = t[ar - 1][ac - 1];
    const built = numOpts(R, ans, [
      { v: totalsC[ac - 1] - ans, why: 'gives the other year group', tag: 'misread' },
      { v: totalsR[ar - 1] - ans, why: 'gives the rest of the row', tag: 'misread' },
      { v: ans + 1, why: 'is an arithmetic slip', tag: 'slip' },
      { v: ans - 2, why: 'is an arithmetic slip', tag: 'slip' },
    ], { min: 0 });
    const table = { caption: 'Students\' choices', head: grid[0], rows: grid.slice(1) };
    return item(`The table shows the choices made by students in Years 5 and 6. Some numbers are missing. How many ${rows[ar - 1]} students chose ${cols[ac - 1]}?`, built,
      explainWith(`Use the totals: the ${rows[ar - 1]} row adds to ${totalsR[ar - 1]} and the ${cols[ac - 1]} column adds to ${totalsC[ac - 1]}. The missing number is ${ans}.`, built), { table });
  } });

/* ---- probability from a bag / spinner ---- */
defMaths({ id: 'm-probability', slot: 'probability', topic: 'probability', fam: 'Data and chance',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    const who = name1(R);
    if (v === 0) {
      const total = R.pick([20, 24, 30, 36, 40, 48]);
      const [pn, pd] = R.pick([[1, 2], [1, 3], [1, 4], [1, 6], [2, 5], [3, 8], [1, 5]].filter(([a, b]) => total % b === 0));
      const red = total * pn / pd;
      const blue = R.int(2, total - red - 2);
      const yellow = total - red - blue;
      const built = numOpts(R, yellow, [
        { v: total - blue, why: 'forgets to take away the red marbles', tag: 'part-only' },
        { v: red, why: 'gives the number of red marbles', tag: 'misread' },
        { v: total - red, why: 'forgets to take away the blue marbles', tag: 'part-only' },
        { v: Math.abs(total - blue - pn), why: 'subtracts the top of the fraction instead of the number of red marbles', tag: 'misread' },
      ], { min: 0 });
      return item(`${who} has a bag of ${total} marbles. Some are blue, some are red and the rest are yellow. There are ${blue} blue marbles. If ${who} takes out a marble without looking, the probability that it is red is ${pn}/${pd}. How many yellow marbles are in the bag?`, built,
        explainWith(`${pn}/${pd} of ${total} is ${red} red marbles. Yellow: ${total} − ${blue} − ${red} = ${yellow}.`, built));
    }
    if (v === 1) {
      // decimals probability with ratio
      const pc = R.pick([0.1, 0.2, 0.3]), pg = R.pick([0.05, 0.1, 0.15]);
      const k = R.pick([2, 3]);
      const ps = round6(pg * k);
      const ph = round6(1 - pc - pg - ps);
      if (ph <= 0.04) return this.gen(R, level);
      const built = numOpts(R, ph, [
        { v: round6(1 - pc - pg), why: 'forgets the sour lollies', tag: 'part-only' },
        { v: round6(1 - pc - pg - pg), why: 'gives the sour lollies the same probability as the gummy ones', tag: 'misread' },
        { v: ps, why: 'gives the probability of a sour lolly', tag: 'misread' },
        { v: round6(ph + 0.1), why: 'is an arithmetic slip', tag: 'slip' },
      ], { int: false, min: 0.01 });
      return item(`A jar holds chocolate, gummy, hard and sour lollies. There are ${k === 2 ? 'twice' : 'three times'} as many sour lollies as gummy lollies. If ${who} takes one lolly without looking, the probability that it is chocolate is ${pc} and the probability that it is gummy is ${pg}. What is the probability that ${who} takes a hard lolly?`, built,
        explainWith(`Sour: ${k} × ${pg} = ${ps}. The probabilities add to 1, so hard = 1 − ${pc} − ${pg} − ${ps} = ${ph}.`, built));
    }
    // two dice / spinners: probability of a sum
    const s1 = R.pick([4, 5, 6]), s2 = R.pick([3, 4, 6]);
    const target = R.int(4, s1 + s2 - 1);
    const cmp = R.pick(['equal to', 'greater than']);
    let fav = 0;
    for (let a = 1; a <= s1; a++) for (let b = 1; b <= s2; b++) if (cmp === 'equal to' ? a + b === target : a + b > target) fav++;
    if (fav === 0) return this.gen(R, level);
    const tot = s1 * s2;
    const fr = [[fav, tot, null, null], [fav, s1 + s2, 'divides by the number of sections added together instead of multiplied', 'operation'],
      [fav + 1, tot, 'counts one outcome too many', 'off-by-one'], [fav - 1, tot, 'misses one outcome', 'off-by-one'],
      [tot - fav, tot, 'gives the probability that it does not happen', 'reversed'], [1, tot, 'counts only one way to make the total', 'part-only'],
      [fav + 2, tot, 'counts two outcomes too many', 'off-by-one']];
    const list = [];
    fr.forEach(f => { if (list.length < 5 && f[0] > 0 && f[0] <= f[1] && !list.some(x => Math.abs(x[0] / x[1] - f[0] / f[1]) < 1e-9)) list.push(f); });
    list.sort((x, y) => x[0] / x[1] - y[0] / y[1]);
    const built = { options: list.map(f => frac(f[0], f[1])), answer: list.findIndex(f => f[2] === null), whys: list.map(f => f[2]), tags: list.map(f => f[3]) };
    if (list.length < 5) return this.gen(R, level);
    return item(`Spinner A has ${s1} equal sections numbered 1 to ${s1}. Spinner B has ${s2} equal sections numbered 1 to ${s2}. ${who} spins both and adds the two numbers. What is the probability that the total is ${cmp} ${target}?`, built,
      explainWith(`There are ${s1} × ${s2} = ${tot} equally likely pairs, and ${fav} of them give a total ${cmp} ${target}, so the probability is ${frac(fav, tot)}.`, built));
  } });

/* ---- counting: outfits, handshakes, routes, arrangements ---- */
defMaths({ id: 'm-counting', slot: 'counting', topic: 'counting', fam: 'Data and chance',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 3));
    const [A, B] = names(R, 2);
    if (v === 0) {
      const a1 = R.int(2, 5), a2 = R.int(3, 6), b1 = R.int(2, 5), b2 = R.int(3, 7);
      if (a1 * a2 === b1 * b2) return this.gen(R, level);
      const d = a1 * a2 - b1 * b2;
      const who = d > 0 ? A : B;
      const opts = [];
      [-2, -1, 0, 1, 2].forEach(x => opts.push(x === 0 ? 'They have the same number of outfits.' : `${x > 0 ? A : B} has ${Math.abs(x) === 1 ? Math.abs(d) : Math.abs(d) + Math.abs(x) - 1 + (Math.abs(d) === 1 ? 1 : 0)} more outfit${Math.abs(d) === 1 && Math.abs(x) === 1 ? '' : 's'} than ${x > 0 ? B : A}.`));
      const correctTxt = `${who} has ${Math.abs(d)} more outfit${Math.abs(d) === 1 ? '' : 's'} than ${who === A ? B : A}.`;
      const wrongs = [
        { s: `${who === A ? B : A} has ${Math.abs(d)} more outfit${Math.abs(d) === 1 ? '' : 's'} than ${who}.`, why: 'gets the right difference for the wrong person', tag: 'reversed' },
        { s: `${A} has ${Math.abs((a1 + a2) - (b1 + b2)) || 1} more outfit${Math.abs((a1 + a2) - (b1 + b2)) === 1 ? '' : 's'} than ${B}.`, why: 'adds the clothes instead of multiplying', tag: 'operation' },
        { s: 'They have the same number of outfits.', why: 'compares the total number of clothes instead of outfits', tag: 'operation' },
        { s: `${who} has ${Math.abs(d) + 1} more outfits than ${who === A ? B : A}.`, why: 'is one out', tag: 'off-by-one' },
        { s: `${who === A ? B : A} has ${Math.abs(d) + 2} more outfits than ${who}.`, why: 'is a guess', tag: 'slip' },
      ];
      void opts;
      const built = textOpts(R, correctTxt, wrongs, { n: 5 });
      return item(`${A} has ${a1} different pairs of trousers and ${a2} different shirts. ${B} has ${b1} different pairs of trousers and ${b2} different shirts. Each person makes an outfit from their own clothes by choosing 1 pair of trousers and 1 shirt. Who can make more different outfits, and by how many?`, built,
        explainWith(`${A} can make ${a1} × ${a2} = ${a1 * a2} outfits and ${B} can make ${b1} × ${b2} = ${b1 * b2}.`, built));
    }
    if (v === 1) {
      const n = byLevel(level, R.int(4, 8), R.int(6, 12), R.int(8, 16));
      const ans = n * (n - 1) / 2;
      const built = numOpts(R, ans, [
        { v: n * (n - 1), why: 'counts each handshake twice', tag: 'reversed' },
        { v: n * n, why: 'includes people shaking their own hand', tag: 'misread' },
        { v: n - 1, why: 'counts only one person\'s handshakes', tag: 'part-only' },
        { v: ans - n + 1, why: 'leaves out the first person', tag: 'off-by-one' },
      ], { min: 1 });
      return item(`At a meeting, each of the ${n} people shakes hands once with every other person. How many handshakes are there altogether?`, built,
        explainWith(`Each person shakes ${n - 1} hands, giving ${n} × ${n - 1} = ${n * (n - 1)}, but that counts every handshake twice, so there are ${ans}.`, built));
    }
    if (v === 2) {
      // routes on a grid moving only right/up
      const w = byLevel(level, 2, R.int(2, 3), R.int(3, 4)), h = byLevel(level, 2, R.int(2, 3), R.int(2, 4));
      const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
      const ans = C(w + h, w);
      const built = numOpts(R, ans, [
        { v: w * h, why: 'multiplies the two side lengths', tag: 'operation' },
        { v: w + h, why: 'counts the steps in one route', tag: 'misread' },
        { v: ans - 1, why: 'misses one route', tag: 'off-by-one' },
        { v: 2 * (w + h), why: 'doubles the number of steps', tag: 'operation' },
        { v: Math.pow(2, w + h), why: 'allows routes that go too far', tag: 'misread' },
      ], { min: 1 });
      let s = '';
      const c = 40, pad = 18;
      for (let i = 0; i <= w; i++) s += line(pad + i * c, pad, pad + i * c, pad + h * c);
      for (let j = 0; j <= h; j++) s += line(pad, pad + j * c, pad + w * c, pad + j * c);
      s += circ(pad, pad + h * c, 5, { fill: 'ink' }) + circ(pad + w * c, pad, 5, { fill: 'ink' }) + txt(pad - 8, pad + h * c + 12, 'S', { weight: 600 }) + txt(pad + w * c + 10, pad - 8, 'F', { weight: 600 });
      return item(`An ant walks along the lines of the grid from S to F. It only ever moves right or up. How many different routes can it take?`, built,
        explainWith(`Every route is ${w} moves right and ${h} moves up in some order. Counting the routes to each corner and adding gives ${ans}.`, built), { svg: svg(w * c + 2 * pad, h * c + 2 * pad, s, 'grid of streets') });
    }
    // number of 3-digit numbers from digit cards with a condition
    const digits = R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], R.int(4, 5)).sort();
    const cond = R.pick(['even', 'greater than 500', 'odd']);
    let cnt = 0;
    for (const a of digits) for (const b of digits) for (const c of digits) {
      if (a === b || b === c || a === c) continue;
      const v2 = a * 100 + b * 10 + c;
      if (cond === 'even' ? v2 % 2 === 0 : cond === 'odd' ? v2 % 2 === 1 : v2 > 500) cnt++;
    }
    if (!cnt) return this.gen(R, level);
    const all = digits.length * (digits.length - 1) * (digits.length - 2);
    const built = numOpts(R, cnt, [
      { v: all, why: 'counts every three-digit number, ignoring the condition', tag: 'part-only' },
      { v: all - cnt, why: 'counts the numbers that do not meet the condition', tag: 'reversed' },
      { v: Math.round(all / 2), why: 'assumes exactly half meet the condition', tag: 'misread' },
      { v: cnt * 2, why: 'counts some numbers twice', tag: 'slip' },
    ], { min: 1 });
    return item(`${A} has ${digits.length} digit cards: ${digits.join(', ')}. ${A} makes three-digit numbers using three different cards. How many of these numbers are ${cond}?`, built,
      explainWith(`Fix the condition first (the ${cond === 'greater than 500' ? 'hundreds' : 'units'} digit), then count the choices for the other places: ${cnt} numbers.`, built));
  } });

/* ---- "which statements are correct" about number facts ---- */
defMaths({ id: 'm-statements', slot: 'statements', topic: 'number reasoning', fam: 'Number',
  gen(R, level) {
    const pool = [
      () => { const r = R.int(1, 7); const d = 8; const evens = [0, 2, 4, 6]; return { t: `An even number divided by ${d} can leave a remainder of ${r}.`, v: evens.includes(r) }; },
      () => { const a = R.int(2, 9); return { t: `The sum of any ${words(a)} consecutive whole numbers is a multiple of ${a}.`, v: a % 2 === 1 }; },
      () => { const n = R.int(10, 99); return { t: `${n} has an odd number of factors.`, v: Number.isInteger(Math.sqrt(n)) }; },
      () => { const p = R.pick([2, 3, 5, 7, 11, 13, 17]); return { t: `Every multiple of ${p * 2} is also a multiple of ${p}.`, v: true }; },
      () => { const n = R.pick([4, 6, 8, 9, 12]); return { t: `Every multiple of ${n} is also a multiple of ${n * 2}.`, v: false }; },
      () => { const n = R.int(21, 99); return { t: `${n} is a prime number.`, v: isPrime(n) }; },
      () => { return { t: `The product of two odd numbers is always odd.`, v: true }; },
      () => { return { t: `The sum of two odd numbers is always odd.`, v: false }; },
      () => { const n = R.int(2, 9); return { t: `${n * n} − ${n} is a multiple of ${n - 1 || 1}.`, v: true }; },
      () => { const n = R.pick([3, 9]); const k = R.int(100, 999); return { t: `${k} is divisible by ${n}.`, v: k % n === 0 }; },
    ];
    const chosen = R.sample(pool, 3).map(f => f());
    if (new Set(chosen.map(c => c.t)).size < 3) return this.gen(R, level);
    const built = statementOpts(R, chosen.map(c => c.v));
    return item(`Which of these statements is/are correct?<br>X&nbsp; ${chosen[0].t}<br>Y&nbsp; ${chosen[1].t}<br>Z&nbsp; ${chosen[2].t}`, built,
      `X is ${chosen[0].v ? 'true' : 'false'}, Y is ${chosen[1].v ? 'true' : 'false'} and Z is ${chosen[2].v ? 'true' : 'false'}. Test each statement with a few examples, then look for the reason it always (or never) works.`);
  } });
