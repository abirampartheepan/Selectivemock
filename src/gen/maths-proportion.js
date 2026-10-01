/* ==========================================================================
   Mathematical Reasoning — fractions, percentages, ratio, best buy, averages
   ========================================================================== */
'use strict';

/* ---- fraction of a shape / fraction of a quantity ---- */
defMaths({ id: 'm-fraction-of', slot: 'fraction-of', topic: 'fractions of a quantity', fam: 'Fractions and decimals',
  gen(R, level) {
    if (R.chance(0.5)) {
      // garden/wall divided into a grid; some sections done, then a fraction of the whole, rest = ?
      const cols = R.pick([4, 5, 6]), rows = R.pick([2, 3, 4]);
      const n = cols * rows;
      const fracs = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 6], [5, 6], [2, 5], [3, 5], [1, 5]].filter(([a, b]) => n % b === 0);
      if (!fracs.length) return this.gen(R, level);
      const [fa, fb] = R.pick(fracs);
      const second = n * fa / fb;
      const firstMax = n - second - 1;
      if (firstMax < 1) return this.gen(R, level);
      const first = R.int(1, Math.min(firstMax, byLevel(level, 6, 8, 10)));
      const ans = n - first - second;
      const cells = R.sample(range(0, n - 1), first).map(i => [i % cols, Math.floor(i / cols), 'a']);
      const pic = gridSvg(cols, rows, cells, { cell: 30, label: 'wall divided into equal sections' });
      const who = name1(R);
      const [c1, c2, c3] = R.pick([['purple', 'yellow', 'green'], ['blue', 'white', 'red'], ['flowers', 'vegetables', 'herbs']]);
      const built = numOpts(R, ans, [
        { v: n - n * fa / fb, why: 'forgets the sections that were already done', tag: 'part-only' },
        { v: second, why: 'gives the number of ' + c2 + ' sections', tag: 'misread' },
        { v: Math.abs(n - first - Math.round((n - first) * fa / fb)), why: `takes ${fa}/${fb} of what is left instead of ${fa}/${fb} of the whole`, tag: 'misread' },
        { v: ans + 1, why: 'is one out', tag: 'off-by-one' },
      ], { min: 0 });
      const plants = c1 === 'flowers';
      return item(plants
        ? `${who} divides a garden bed into equal sections and plants ${c1} in the shaded sections, as shown. ${who} then plants ${fa}/${fb} of the whole bed with ${c2}. The rest is planted with ${c3}. How many sections are planted with ${c3}?`
        : `${who} divides a wall into equal sections and paints the shaded sections ${c1}, as shown. ${who} then paints ${fa}/${fb} of the whole wall ${c2}. Finally, ${who} paints the rest of the wall ${c3}. How many sections are painted ${c3}?`,
        built, explainWith(`There are ${n} sections. ${first} are shaded and ${fa}/${fb} of ${n} is ${second}, so ${n} − ${first} − ${second} = ${ans} are left.`, built), { svg: pic });
    }
    // fraction chain of quantities
    const total = byLevel(level, R.int(4, 12) * 12, R.int(5, 15) * 24, R.int(6, 20) * 60);
    const [a1, b1] = R.pick([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4]]);
    const [a2, b2] = R.pick([[1, 2], [1, 3], [1, 4], [2, 5], [3, 5], [1, 6]]);
    const after1 = total - total * a1 / b1;
    const used2 = after1 * a2 / b2;
    if (!isInt(after1) || !isInt(used2)) return this.gen(R, level);
    const ans = after1 - used2;
    const who = name1(R);
    const thing = R.pick([['stickers', 'gives', 'to a friend'], ['marbles', 'loses', 'at school'], ['cards', 'sells', 'at a market'], ['books', 'donates', 'to the library']]);
    const built = numOpts(R, ans, [
      { v: total - total * a1 / b1 - total * a2 / b2, why: `takes ${a2}/${b2} of the original amount instead of what was left`, tag: 'misread' },
      { v: after1, why: 'stops after the first step', tag: 'part-only' },
      { v: used2, why: 'gives the amount from the second step, not what is left', tag: 'misread' },
      { v: total * a1 / b1 + used2, why: 'adds up what was given away', tag: 'misread' },
    ], { min: 0 });
    return item(`${who} has ${total} ${thing[0]} and ${thing[1]} ${a1}/${b1} of them ${thing[2]}. ${who} then ${thing[1]} ${a2}/${b2} of the ${thing[0]} that are left. How many ${thing[0]} does ${who} have now?`,
      built, explainWith(`After the first step ${who} has ${total} − ${total * a1 / b1} = ${after1}. Then ${a2}/${b2} of ${after1} is ${used2}, leaving ${ans}.`, built));
  } });

/* ---- fraction arithmetic and comparison ---- */
defMaths({ id: 'm-fraction-ops', slot: 'fraction-ops', topic: 'fraction arithmetic', fam: 'Fractions and decimals',
  gen(R, level) {
    if (R.chance(0.5)) {
      // three statements about fractions, which are correct
      const mk = () => {
        const d1 = R.pick([3, 4, 5, 6, 8, 10, 12]), d2 = R.pick([3, 4, 5, 6, 8, 10, 12]);
        const n1 = R.int(1, d1 - 1), n2 = R.int(1, d2 - 1);
        const t = R.int(0, 2);
        if (t === 0) { // sum compared with a fraction
          const s = n1 / d1 + n2 / d2; const cmp = R.pick([[1, 2], [3, 4], [1, 1]]); const v = cmp[0] / cmp[1];
          if (Math.abs(s - v) < 1e-9) return null;
          const more = R.chance(0.5);
          return { text: `${n1}/${d1} + ${n2}/${d2} is ${more ? 'more' : 'less'} than ${cmp[0] === cmp[1] ? '1' : cmp[0] + '/' + cmp[1]}`, truth: more ? s > v : s < v };
        }
        if (t === 1) { // 1 − a/b compared
          const v = 1 - n1 / d1, c = n2 / d2; if (Math.abs(v - c) < 1e-9) return null;
          const more = R.chance(0.5);
          return { text: `1 − ${n1}/${d1} is ${more ? 'more' : 'less'} than ${n2}/${d2}`, truth: more ? v > c : v < c };
        }
        const a = 1 / d1, b = 1 / d2; if (d1 === d2) return null;
        const more = R.chance(0.5);
        return { text: `1/${d1} is ${more ? 'more' : 'less'} than 1/${d2}`, truth: more ? a > b : a < b };
      };
      const st = []; let guard = 0;
      while (st.length < 3 && guard++ < 50) { const s = mk(); if (s && !st.some(x => x.text === s.text)) st.push(s); }
      const built = statementOpts(R, st.map(s => s.truth), ['X', 'Y', 'Z']);
      return item(`Which of these statements is/are correct?<br>X&nbsp; ${st[0].text}<br>Y&nbsp; ${st[1].text}<br>Z&nbsp; ${st[2].text}`,
        built, `Statement X is ${st[0].truth ? 'true' : 'false'}, Y is ${st[1].truth ? 'true' : 'false'} and Z is ${st[2].truth ? 'true' : 'false'}. Change each fraction to a common denominator, or to a decimal, to compare.`);
    }
    // relative multiples: F has k times G, H has 1/m of G, F is ? times H
    const k = byLevel(level, R.int(2, 8), R.int(3, 12), R.int(4, 15)), m = byLevel(level, R.pick([2, 3, 4]), R.pick([3, 4, 5]), R.pick([4, 5, 6, 8]));
    const [F, G, H] = names(R, 3);
    const ans = k * m;
    const built = numOpts(R, ans, [
      { v: round6(k / m), why: 'divides instead of multiplying', tag: 'operation' },
      { v: k + m, why: 'adds the two numbers', tag: 'operation' },
      { v: round6(m / k), why: 'works it the wrong way round', tag: 'reversed' },
      { v: k, why: `ignores what ${H} has`, tag: 'part-only' },
    ], { fmt: x => isInt(x) ? String(x) : frac(Math.round(x * k * m), k * m), int: false, min: 0 });
    return item(`${F}, ${G} and ${H} collect stickers. ${F} has ${k} times as many stickers as ${G}. ${H} has 1/${m} as many stickers as ${G}. ${F} has ☐ times as many stickers as ${H}. What is the missing number?`,
      built, explainWith(`If ${H} has 1 sticker, ${G} has ${m} and ${F} has ${k} × ${m} = ${ans}. So ${F} has ${ans} times as many as ${H}.`, built));
  } });

/* ---- percentages ---- */
defMaths({ id: 'm-percent', slot: 'percent', topic: 'percentages', fam: 'Ratio, rate and percentage',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 3));
    const who = name1(R);
    if (v === 0) {
      const price = R.int(4, 30) * byLevel(level, 5, 4, 3);
      const p = R.pick([10, 20, 25, 30, 40, 50, 15]);
      const ans = round2(price * (1 - p / 100));
      const built = numOpts(R, ans, [
        { v: round2(price * p / 100), why: 'gives the discount, not the sale price', tag: 'misread' },
        { v: round2(price - p), why: `takes $${p} off instead of ${p}%`, tag: 'units' },
        { v: round2(price * (1 + p / 100)), why: 'adds the percentage on', tag: 'reversed' },
        { v: round2(price * (1 - p / 1000)), why: 'works out the percentage with the decimal point in the wrong place', tag: 'place' },
      ], { fmt: moneyShort, int: false, min: 0.5 });
      return item(`A jacket normally costs $${price}. In a sale, its price is reduced by ${p}%. What is the sale price?`, built,
        explainWith(`${p}% of $${price} is ${money(price * p / 100)}, so the sale price is ${money(ans)}.`, built));
    }
    if (v === 1) {
      // reverse percentage
      const p = R.pick([20, 25, 40, 50, 60, 75, 80]);
      const orig = R.int(3, 20) * (p % 40 === 0 ? 5 : 4) * byLevel(level, 1, 2, 3);
      const after = orig * (1 - p / 100);
      if (!isInt(after)) return this.gen(R, level);
      const built = numOpts(R, orig, [
        { v: round2(after * (1 + p / 100)), why: `adds ${p}% of the sale price back on`, tag: 'reversed' },
        { v: after + p, why: 'adds the percentage as dollars', tag: 'units' },
        { v: after, why: 'gives the sale price', tag: 'misread' },
        { v: round2(after / (p / 100)), why: 'divides by the percentage taken off instead of the percentage left', tag: 'misread' },
      ], { fmt: moneyShort, int: false, min: 1 });
      return item(`${who} buys a bike in a sale for $${after}. The sale price was ${p}% less than the original price. What was the original price?`, built,
        explainWith(`$${after} is ${100 - p}% of the original, so 1% is $${round2(after / (100 - p))} and 100% is $${orig}.`, built));
    }
    if (v === 2) {
      // successive percentages
      const start = R.int(4, 20) * 100;
      const up = R.pick([10, 20, 25, 50]), down = R.pick([10, 20, 25, 50]);
      const ans = round2(start * (1 + up / 100) * (1 - down / 100));
      const built = numOpts(R, ans, [
        { v: round2(start * (1 + (up - down) / 100)), why: 'combines the percentages by adding and subtracting them', tag: 'operation' },
        { v: start * (1 + up / 100), why: 'stops after the first change', tag: 'part-only' },
        { v: round2(start * (1 - down / 100)), why: 'applies only the second change', tag: 'part-only' },
        { v: start, why: 'assumes the changes cancel out', tag: 'misread' },
      ], { fmt: x => num(x), int: false, min: 1 });
      return item(`A town had ${num(start)} residents. Over one year the number grew by ${up}%. The next year it fell by ${down}%. How many residents were there at the end of the second year?`, built,
        explainWith(`After the rise: ${num(start * (1 + up / 100))}. After the fall: ${num(ans)}.`, built));
    }
    // percentage of a mixture, then a change
    const total = R.int(4, 12) * 20;
    const pA = R.pick([20, 25, 40, 60, 75]);
    const a = total * pA / 100;
    const add = R.int(1, 6) * 5;
    const newPct = round6((a + add) / (total + add) * 100);
    if (!isInt(newPct * 10)) return this.gen(R, level);
    const built = numOpts(R, newPct, [
      { v: round6((a + add) / total * 100), why: 'forgets that the total goes up as well', tag: 'part-only' },
      { v: pA + add, why: 'adds the new counters straight onto the percentage', tag: 'units' },
      { v: pA, why: 'assumes the percentage does not change', tag: 'misread' },
      { v: round6(a / (total + add) * 100), why: 'adds to the total but not to the red counters', tag: 'part-only' },
    ], { fmt: x => num(x) + '%', int: false, min: 0 });
    return item(`A bag holds ${total} counters and ${pA}% of them are red. ${who} adds another ${add} red counters. What percentage of the counters are now red?`, built,
      explainWith(`There were ${a} red counters out of ${total}. Now there are ${a + add} out of ${total + add}, which is ${num(newPct)}%.`, built));
  } });

/* ---- ratio ---- */
defMaths({ id: 'm-ratio', slot: 'ratio', topic: 'ratio', fam: 'Ratio, rate and percentage',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    const [A, B, C] = names(R, 3);
    if (v === 0) {
      const a = R.int(1, 5), b = R.int(a + 1, 8);
      if (gcd(a, b) !== 1) return this.gen(R, level);
      const unit = R.int(3, 15) * byLevel(level, 1, 2, 3);
      const total = (a + b) * unit;
      const ans = b * unit;
      const built = numOpts(R, ans, [
        { v: a * unit, why: `gives ${A}'s share`, tag: 'misread' },
        { v: Math.round(total / b) , why: 'divides by one part of the ratio instead of the total number of parts', tag: 'operation' },
        { v: total - a, why: 'subtracts the ratio number instead of the share', tag: 'misread' },
        { v: (b - a) * unit, why: 'gives the difference between the shares', tag: 'misread' },
      ], { min: 1 });
      return item(`${A} and ${B} share $${total} in the ratio ${a} : ${b}. How much does ${B} get?`, built,
        explainWith(`There are ${a + b} parts, each worth $${total} ÷ ${a + b} = $${unit}. ${B} gets ${b} × $${unit} = $${ans}.`, built), {});
    }
    if (v === 1) {
      // ratio changes after a transfer
      const a = R.int(2, 5), b = R.int(1, a - 1 || 1);
      if (a === b) return this.gen(R, level);
      const unit = R.int(4, 12);
      const x = a * unit, y = b * unit;
      // after giving g from A to B, equal
      const g = (x - y) / 2;
      if (!isInt(g) || g <= 0) return this.gen(R, level);
      const built = numOpts(R, g, [
        { v: x - y, why: 'gives the whole difference instead of half of it', tag: 'misread' },
        { v: unit, why: 'gives the size of one part', tag: 'misread' },
        { v: (x + y) / 2, why: 'gives the number each ends up with', tag: 'misread' },
        { v: a - b, why: 'uses the ratio numbers instead of the amounts', tag: 'units' },
      ], { min: 1 });
      return item(`${A} and ${B} have marbles in the ratio ${a} : ${b}. Together they have ${x + y} marbles. How many marbles must ${A} give to ${B} so that they have the same number?`, built,
        explainWith(`${A} has ${x} and ${B} has ${y}. The difference is ${x - y}, so ${A} gives half of it: ${g}.`, built));
    }
    // three-way packets: large/medium/small equivalences
    const L = R.int(3, 9) * 12;
    const lm = R.pick([[2, 3], [3, 4], [2, 5], [3, 2]]), ms = R.pick([[2, 3], [3, 4], [3, 5], [4, 3]]);
    const M = L * lm[0] / lm[1], S = M * ms[0] / ms[1];
    if (!isInt(M) || !isInt(S)) return this.gen(R, level);
    const thing = R.pick(['biscuits', 'crackers', 'muesli bars', 'tea bags']);
    const built = numOpts(R, S, [
      { v: L * ms[0] / ms[1], why: 'skips the middle-sized packet', tag: 'part-only' },
      { v: M, why: 'gives the medium packet', tag: 'misread' },
      { v: round6(L * lm[1] / lm[0] * ms[1] / ms[0]), why: 'uses each ratio upside down', tag: 'reversed' },
      { v: round6(M * ms[1] / ms[0]), why: 'turns the second ratio upside down', tag: 'reversed' },
    ], { min: 1 });
    return item(`A large packet holds ${L} ${thing}. ${words(lm[0]).replace(/^./, c => c.toUpperCase())} large packets hold the same number of ${thing} as ${words(lm[1])} medium packets. ${words(ms[0]).replace(/^./, c => c.toUpperCase())} medium packets hold the same number as ${words(ms[1])} small packets. How many ${thing} does a small packet hold?`, built,
      explainWith(`${lm[0]} × ${L} = ${lm[0] * L}, so a medium packet holds ${lm[0] * L} ÷ ${lm[1]} = ${M}. Then ${ms[0]} × ${M} = ${ms[0] * M}, so a small packet holds ${ms[0] * M} ÷ ${ms[1]} = ${S}.`, built));
  } });

/* ---- best buy ---- */
defMaths({ id: 'm-best-buy', slot: 'best-buy', topic: 'best buy', fam: 'Ratio, rate and percentage',
  gen(R, level) {
    const thing = R.pick([['juice', 'mL', 'bottle'], ['rice', 'g', 'bag'], ['shampoo', 'mL', 'bottle'], ['pasta', 'g', 'packet']]);
    const sizes = R.sample(byLevel(level, [250, 500, 750, 1000, 2000], [300, 450, 600, 750, 1200, 1500], [350, 450, 650, 800, 1250, 1750]), 4).sort((a, b) => a - b);
    const baseRate = R.int(3, 9) / 1000; // dollars per unit
    const prices = sizes.map(s => round2(s * baseRate * (1 + R.int(-12, 12) / 100)));
    const per = prices.map((p, i) => p / sizes[i]);
    const best = per.indexOf(Math.min.apply(null, per));
    if (per.filter(x => Math.abs(x - per[best]) < 1e-6).length > 1) return this.gen(R, level);
    const labels = ['P', 'Q', 'R', 'S'];
    const opts = labels.map((l, i) => `${thing[2]} ${l}`).concat(['They all cost the same per ' + thing[1]]);
    const cheapest = prices.indexOf(Math.min.apply(null, prices)), biggest = 3;
    const whys = opts.map((o, i) => i === best ? null : i === cheapest ? 'has the lowest price, not the lowest price per ' + thing[1] : i === biggest ? 'is the biggest, but bigger is not always cheaper' : i === 4 ? 'the prices per ' + thing[1] + ' are different' : 'costs more per ' + thing[1]);
    const table = { head: [thing[2], 'size', 'price'], rows: sizes.map((s, i) => [labels[i], num(s) + ' ' + thing[1], money(prices[i])]) };
    const built = { options: opts.map(cap), answer: best, whys, tags: whys.map(w => w ? 'misread' : null) };
    return item(`A shop sells ${thing[0]} in four sizes, shown in the table. Which ${thing[2]} is the best value for money?`, built,
      `Work out the price for the same amount of each: ${sizes.map((s, i) => `${labels[i]} costs ${money(prices[i] / s * 100)} per 100 ${thing[1]}`).join('; ')}. ${labels[best]} is cheapest.`, { table });
  } });

/* ---- averages ---- */
defMaths({ id: 'm-mean', slot: 'mean', topic: 'averages', fam: 'Data and chance',
  gen(R, level) {
    const v = byLevel(level, 0, R.int(0, 1), R.int(1, 2));
    const who = name1(R);
    if (v === 0) {
      const k = R.int(4, 6);
      const target = R.int(12, 25);
      const scores = range(1, k - 1).map(() => target + R.int(-6, 6));
      const last = target * k - sum(scores);
      if (last < 1 || last > 40) return this.gen(R, level);
      const built = numOpts(R, last, [
        { v: target, why: 'assumes the last score equals the average', tag: 'misread' },
        { v: target * (k - 1) - sum(scores) + target, why: 'is right by coincidence of a slip', tag: 'slip' },
        { v: Math.round(sum(scores) / (k - 1)), why: 'gives the average of the other scores', tag: 'misread' },
        { v: target * k - sum(scores) + k, why: 'adds the number of games', tag: 'slip' },
        { v: last + target, why: 'adds the average on again', tag: 'slip' },
      ], { min: 0 });
      return item(`${who} played ${k} games of basketball. The points in the first ${k - 1} games were ${scores.join(', ')}. ${who}'s mean score for all ${k} games was ${target}. How many points did ${who} score in the last game?`, built,
        explainWith(`A mean of ${target} over ${k} games is ${target * k} points in total. The first ${k - 1} games give ${sum(scores)}, so the last game was ${last}.`, built));
    }
    if (v === 1) {
      // new member changes the mean
      const n = R.int(4, 9), m1 = R.int(30, 50), m2 = m1 + R.pick([1, 2, 3]);
      const newAge = m2 * (n + 1) - m1 * n;
      const thing = R.pick([['ages', 'years old', 'joins'], ['masses', 'kg', 'joins']]);
      const built = numOpts(R, newAge, [
        { v: m2, why: 'assumes the new person is the new mean', tag: 'misread' },
        { v: m2 + (m2 - m1), why: 'adds the change in the mean only once', tag: 'part-only' },
        { v: m1 * n + m2, why: 'forgets to subtract the old total', tag: 'part-only' },
        { v: newAge + m2 - m1, why: 'is out by the change in the mean', tag: 'slip' },
      ], { min: 0 });
      return item(`The mean age of the ${n} teachers in a staffroom is ${m1}. One more teacher arrives and the mean age becomes ${m2}. How old is the teacher who arrived?`, built,
        explainWith(`Before: ${n} × ${m1} = ${n * m1} years. After: ${n + 1} × ${m2} = ${(n + 1) * m2} years. The new teacher is ${newAge}.`, built));
    }
    // median & mean statements
    const k = R.pick([5, 7]);
    const vals = range(1, k).map(() => R.int(2, 20)).sort((a, b) => a - b);
    const mean = sum(vals) / k, median = vals[(k - 1) / 2], rangeV = vals[k - 1] - vals[0];
    const mode = (() => { const c = {}; vals.forEach(x => c[x] = (c[x] || 0) + 1); const mx = Math.max.apply(null, Object.values(c)); const ms = Object.keys(c).filter(x => c[x] === mx); return mx > 1 && ms.length === 1 ? Number(ms[0]) : null; })();
    const s1 = R.chance(0.5) ? { t: `The mean is greater than the median.`, v: mean > median } : { t: `The median is ${median + (R.chance(0.5) ? 0 : 1)}.`, v: null };
    if (s1.v === null) s1.v = s1.t === `The median is ${median}.`;
    const rr = rangeV + (R.chance(0.5) ? 0 : 2);
    const s2 = { t: `The range is ${rr}.`, v: rr === rangeV };
    const add = R.int(2, 20);
    const s3 = { t: `Adding a score of ${add} would increase the mean.`, v: add > mean };
    const built = statementOpts(R, [s1.v, s2.v, s3.v]);
    return item(`Here are ${k} test scores:<br><span class="mono">${R.shuffle(vals).join(', ')}</span><br>Which of these statements is/are correct?<br>X&nbsp; ${s1.t}<br>Y&nbsp; ${s2.t}<br>Z&nbsp; ${s3.t}`, built,
      `In order the scores are ${vals.join(', ')}. The mean is ${num(round2(mean))}, the median is ${median} and the range is ${rangeV}.${mode != null ? '' : ''}`);
  } });
