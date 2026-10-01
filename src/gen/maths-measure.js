/* ==========================================================================
   Mathematical Reasoning — measurement, money, rates, time and timetables
   ========================================================================== */
'use strict';

/* ---- litres and millilitres / kilograms and grams combined ---- */
defMaths({ id: 'm-units-combine', slot: 'units-measure', topic: 'units of measurement', fam: 'Measurement and time',
  gen(R, level) {
    const liq = R.chance(0.5);
    const [big, small, f] = liq ? ['L', 'mL', 1000] : ['kg', 'g', 1000];
    const k = byLevel(level, 3, 3, 4);
    const parts = [];
    for (let i = 0; i < k; i++) {
      const style = R.int(0, 2);
      const tot = R.int(byLevel(level, 300, 800, 900), byLevel(level, 4000, 6000, 9000));
      const v = byLevel(level, tot - tot % 5, tot, tot);
      parts.push({ v, style });
    }
    const show = p => p.style === 0 ? `${Math.floor(p.v / f)} ${big} ${p.v % f} ${small}` : p.style === 1 ? `${num(p.v)} ${small}` : `${num(round6(p.v / f))} ${big}`;
    const total = sum(parts.map(p => p.v));
    const fmt = v => `${Math.floor(v / f)} ${big} ${v % f} ${small}`;
    const label = R.shuffle(['X', 'Y', 'Z', 'W']).slice(0, k).sort();
    const cands = [
      { v: total - (total % f) + Math.round((total % f) / 10), why: `writes the ${small} as if a ${big} were 100 ${small}`, tag: 'units' },
      { v: total + 9 * (total % f), why: `misplaces the ${small} digits`, tag: 'place' },
      { v: total + f, why: `carries one ${big} too many`, tag: 'slip' },
      { v: total - f, why: `forgets to carry the ${big}`, tag: 'slip' },
      { v: total + 100, why: 'is 100 ' + small + ' out', tag: 'slip' },
    ];
    const built = numOpts(R, total, cands, { fmt, min: 1 });
    const things = liq ? 'containers hold water' : 'bags hold sand';
    return item(`Three ${things}.<br>${parts.map((p, i) => `${liq ? 'Container' : 'Bag'} ${label[i]} holds ${show(p)}.`).join('<br>')}<br>If everything is put together, what will the total be, in ${big} and ${small}?`.replace('Three', words(k).replace(/^./, c => c.toUpperCase())),
      built, explainWith(`In ${small}: ${parts.map(p => num(p.v)).join(' + ')} = ${num(total)} ${small}, which is ${fmt(total)}.`, built));
  } });

/* ---- reading a scale / juice from fruit ---- */
defMaths({ id: 'm-scale-reading', slot: 'units-measure', topic: 'reading scales', fam: 'Measurement and time',
  gen(R, level) {
    const max = byLevel(level, 1000, 2000, 5000), step = byLevel(level, 100, 200, 250);
    const per = byLevel(level, 500, 250, 400), out = byLevel(level, 0.8, 0.6, 0.45);
    let val, tries = 0;
    do { val = step * R.int(2, max / step - 1) + byLevel(level, 0, step / 2, step / 2) * R.int(0, 1); }
    while (!isInt(round6(val / per * out * 1000)) && tries++ < 50);
    if (!isInt(round6(val / per * out * 1000))) return this.gen(R, level);
    // scale drawing: a straight ruler-style scale with pointer
    const W = 380, L = 20, Rr = 360, Y = 60;
    let s = line(L, Y, Rr, Y, { w: 2 });
    for (let v = 0; v <= max; v += step / 2) {
      const x = L + v / max * (Rr - L);
      const major = v % step === 0;
      s += line(x, Y, x, Y - (major ? 14 : 7));
      if (major && (v / step) % byLevel(level, 1, 2, 4) === 0) s += txt(x, Y + 14, num(v), { size: 11 });
    }
    const px = L + val / max * (Rr - L);
    s += poly([[px, Y - 18], [px - 6, Y - 30], [px + 6, Y - 30]], { fill: 'ink' });
    s += txt(W / 2, 12, 'grams', { size: 11 });
    const pic = svg(W, 88, s, 'scale');
    const fruit = R.pick(['oranges', 'lemons', 'apples', 'mandarins']);
    const ans = round6(val / per * out * 1000);
    const who = name1(R);
    const built = numOpts(R, ans, [
      { v: round6(val / per * out * 100), why: 'converts litres to millilitres with 100 instead of 1000', tag: 'units' },
      { v: round6((val + step / 2) / per * out * 1000), why: 'misreads the scale by one small division', tag: 'misread' },
      { v: round6((val - step / 2) / per * out * 1000), why: 'misreads the scale by one small division', tag: 'misread' },
      { v: round6(val / per * 1000), why: 'forgets to multiply by the juice from each batch', tag: 'part-only' },
      { v: round6(per / val * out * 1000), why: 'divides the wrong way round', tag: 'reversed' },
    ], { fmt: x => num(x) + ' mL', min: 1, int: false });
    return item(`${who} makes juice. Every ${per} g of ${fruit} makes ${out} L of juice. A bag of ${fruit} is placed on the scale shown. How much juice can ${who} make from the bag?`,
      built, explainWith(`The scale reads ${val} g. That is ${num(round6(val / per))} lots of ${per} g, giving ${num(round6(val / per * out))} L = ${num(ans)} mL.`, built), { svg: pic });
  } });

/* ---- money: change, multi-buy, savings ---- */
defMaths({ id: 'm-money', slot: 'money', topic: 'money', fam: 'Number',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    const who = name1(R);
    if (v === 0) {
      const items = R.sample([['notebook', 2.35, 4.9], ['pen', 0.85, 2.6], ['ruler', 1.1, 3.4], ['glue stick', 1.45, 3.2], ['eraser', 0.6, 1.8], ['folder', 1.75, 4.5]], 3);
      const qty = items.map(() => R.int(1, byLevel(level, 3, 5, 7)));
      const price = items.map(it => round2(R.int(Math.round(it[1] * 20), Math.round(it[2] * 20)) / 20));
      const tot = round2(sum(price.map((p, i) => p * qty[i])));
      const paid = Math.ceil(tot / 10) * 10 + (tot % 10 > 8 ? 10 : 0);
      const ans = round2(paid - tot);
      const built = numOpts(R, ans, [
        { v: round2(paid - sum(price)), why: 'pays for only one of each item', tag: 'part-only' },
        { v: tot, why: 'gives the total cost, not the change', tag: 'misread' },
        { v: round2(ans + price[0]), why: 'leaves out one of the items', tag: 'part-only' },
        { v: round2(ans - 0.1), why: 'is ten cents out', tag: 'slip' },
        { v: round2(ans + 1), why: 'is one dollar out', tag: 'slip' },
      ], { fmt: money, min: 0.05, int: false });
      return item(`${who} buys ${items.map((it, i) => `${qty[i]} ${it[0]}${qty[i] > 1 ? 's' : ''} at ${money(price[i])} each`).join(', ')}. ${who} pays with $${paid}. How much change does ${who} get?`,
        built, explainWith(`The total is ${items.map((it, i) => `${qty[i]} × ${money(price[i])}`).join(' + ')} = ${money(tot)}. Change: $${paid} − ${money(tot)} = ${money(ans)}.`, built));
    }
    if (v === 1) {
      // working back: spent fractions
      const left = byLevel(level, R.int(3, 8) * 2, R.int(4, 9) * 2 + 0.5, R.int(5, 12) * 1.5);
      const f2 = byLevel(level, 2, 3, 4); // fraction used on book: 1/f2 of remaining
      const afterTicket = left * f2 / (f2 - 1);
      const beforeTicket = afterTicket * 2;
      const start = Math.ceil(beforeTicket / 5) * 5 + byLevel(level, 5, 5, 10);
      const snacks = round2(start - beforeTicket);
      if (!isInt(afterTicket * 100) || snacks <= 0) return this.gen(R, level);
      const built = numOpts(R, snacks, [
        { v: round2(start - afterTicket), why: 'forgets to undo the halving for the ticket', tag: 'part-only' },
        { v: round2(start - left * 2), why: 'undoes only the ticket step', tag: 'part-only' },
        { v: round2(afterTicket / 2), why: 'gives the cost of the ticket', tag: 'misread' },
        { v: round2(afterTicket - left), why: 'gives the cost of the book', tag: 'misread' },
        { v: round2(snacks + 1), why: 'is one dollar out', tag: 'slip' },
      ], { fmt: money, int: false, min: 0.05 });
      return item(`${who} had ${money(start)}. ${who} spent some of it on snacks, then spent half of what was left on a movie ticket. ${who} then used ${byLevel(level, 'one-half', 'one-third', 'one-quarter')} of the remaining money to buy a book, and after that had ${money(left)} left. How much did ${who} spend on snacks?`,
        built, explainWith(`Work backwards: before the book ${who} had ${money(afterTicket)}; before the ticket, ${money(beforeTicket)}. So the snacks cost ${money(start)} − ${money(beforeTicket)} = ${money(snacks)}.`, built));
    }
    // best way to spend: bags of fruit
    const single = byLevel(level, 0.5, 0.6, 0.45);
    const bagA = byLevel(level, [10, 4.5], [8, 4.2], [12, 4.9]), bagB = byLevel(level, [30, 13], [25, 12.5], [40, 15.5]);
    const budget = byLevel(level, R.int(20, 30), R.int(28, 45), R.int(45, 70));
    let best = 0;
    for (let b = 0; b * bagB[1] <= budget; b++) for (let a = 0; a * bagA[1] + b * bagB[1] <= budget; a++) {
      const rest = budget - a * bagA[1] - b * bagB[1];
      best = Math.max(best, b * bagB[0] + a * bagA[0] + Math.floor(round2(rest / single) + 1e-9));
    }
    const greedyB = Math.floor(budget / bagB[1]);
    const r1 = budget - greedyB * bagB[1];
    const greedy = greedyB * bagB[0] + Math.floor(r1 / bagA[1]) * bagA[0] + Math.floor(round2((r1 - Math.floor(r1 / bagA[1]) * bagA[1]) / single) + 1e-9);
    const fruit = R.pick(['mandarins', 'apples', 'kiwi fruit', 'lemons']);
    const built = numOpts(R, best, [
      { v: Math.floor(budget / single), why: 'buys every piece of fruit singly', tag: 'part-only' },
      { v: greedy === best ? best - 2 : greedy, why: 'fills up with the biggest bags first without checking other mixes', tag: 'part-only' },
      { v: Math.floor(budget / bagB[1]) * bagB[0], why: 'buys only big bags and wastes the rest of the money', tag: 'part-only' },
      { v: Math.floor(budget / bagA[1]) * bagA[0], why: 'buys only medium bags', tag: 'part-only' },
      { v: best + 1, why: 'spends more money than there is', tag: 'slip' },
    ], { min: 1 });
    return item(`A shop sells ${fruit} three ways: 1 for ${money(single)}, a bag of ${bagA[0]} for ${money(bagA[1])}, or a bag of ${bagB[0]} for ${money(bagB[1])}. ${who} has $${budget}. What is the largest number of ${fruit} ${who} can buy?`,
      built, explainWith(`Trying the mixes of bags and single fruit, the most ${fruit} for $${budget} is ${best}.`, built));
  } });

/* ---- conversion chains with invented or old units ---- */
defMaths({ id: 'm-unit-chain', slot: 'unit-chain', topic: 'conversion chains', fam: 'Measurement and time',
  gen(R, level) {
    const sets = [
      ['gill', 'pint', 'quart', 'peck'], ['tok', 'bix', 'mun', 'zarl'], ['grain', 'scruple', 'dram', 'ounce'],
      ['pip', 'tab', 'rond', 'crown'], ['link', 'chain', 'furlong', 'league'], ['zep', 'kal', 'dorn', 'vask'],
      ['span', 'cubit', 'pace', 'rod'], ['mote', 'fleck', 'lump', 'heap'],
    ];
    const u = R.pick(sets);
    const pl = w => /(s|x|ch|sh)$/.test(w) ? w + 'es' : w + 's';
    const k = byLevel(level, 3, 4, 4);
    const rel = [];
    for (let i = 0; i < k - 1; i++) rel.push(R.int(2, byLevel(level, 5, 6, 8)));
    const total = rel.reduce((a, b) => a * b, 1);
    // medium and hard state one link the other way round ("1 pint is half a quart")
    const flip = level !== 'easy' ? R.int(0, k - 2) : -1;
    const clean = rel.map((r, i) => {
      if (i === flip && (r === 2 || r === 4)) return `• 1 ${u[i]} is ${r === 2 ? 'half' : 'a quarter'} of a ${u[i + 1]}.`;
      return R.chance(0.5) ? `• ${r} ${pl(u[i])} equal 1 ${u[i + 1]}.` : `• 1 ${u[i + 1]} is the same as ${r} ${pl(u[i])}.`;
    });
    const askN = byLevel(level, 1, R.int(2, 3), R.int(3, 5));
    const ans = total * askN;
    const built = numOpts(R, ans, [
      { v: sum(rel) * askN, why: 'adds the numbers in the chain instead of multiplying', tag: 'operation' },
      { v: total / rel[rel.length - 1] * askN, why: 'leaves out the last step of the chain', tag: 'part-only' },
      { v: total, why: `finds the number in one ${u[k - 1]} only`, tag: 'misread' },
      { v: total * 2 * askN, why: 'doubles one of the steps', tag: 'slip' },
    ], { min: 1 });
    return item(`Here are some units:<br>${clean.join('<br>')}<br>How many ${pl(u[0])} are in ${askN === 1 ? '1 ' + u[k - 1] : askN + ' ' + pl(u[k - 1])}?`,
      built, explainWith(`Multiply along the chain: ${rel.join(' × ')}${askN > 1 ? ' × ' + askN : ''} = ${num(ans)}.`, built));
  } });

/* ---- rates: work together / speed ---- */
defMaths({ id: 'm-rate', slot: 'rate', topic: 'rates', fam: 'Ratio, rate and percentage',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    const who = name1(R);
    if (v === 0) {
      const speed = byLevel(level, R.pick([40, 60, 80, 90]), R.pick([45, 72, 84, 96]), R.pick([54, 66, 78, 105]));
      const mins = byLevel(level, R.pick([15, 30, 45, 90]), R.pick([20, 40, 50, 75, 100]), R.pick([25, 35, 55, 85, 110]));
      const d = round6(speed * mins / 60);
      if (!isInt(d * 10)) return this.gen(R, level);
      const built = numOpts(R, d, [
        { v: speed * mins / 100, why: 'treats an hour as 100 minutes', tag: 'units' },
        { v: speed * mins, why: 'forgets to change minutes into hours', tag: 'units' },
        { v: round6(speed / mins * 60), why: 'divides instead of multiplying', tag: 'operation' },
        { v: speed, why: 'gives the distance for one hour', tag: 'misread' },
      ], { fmt: x => num(x) + ' km', int: false, min: 0.1 });
      return item(`A train travels at a steady ${speed} km per hour. How far does it travel in ${hm(mins)}?`,
        built, explainWith(`${hm(mins)} is ${mixed(mins, 60)} of an hour, so the distance is ${speed} × ${mixed(mins, 60)} = ${num(d)} km.`, built));
    }
    if (v === 1) {
      const a = byLevel(level, R.int(2, 6) * 6, R.int(3, 8) * 6, R.int(4, 9) * 7), b = a * byLevel(level, 2, R.pick([2, 3]), R.pick([3, 4]));
      const pages = (a + b) * byLevel(level, R.int(2, 6), R.int(3, 8), R.int(4, 9));
      const ans = pages / (a + b);
      const built = numOpts(R, ans, [
        { v: pages / b, why: 'uses only the faster machine', tag: 'part-only' },
        { v: pages / a, why: 'uses only the slower machine', tag: 'part-only' },
        { v: pages / (a + b) * 2, why: 'averages the two machines instead of adding them', tag: 'operation' },
        { v: round6((pages / a + pages / b) / 2), why: 'averages the two separate times', tag: 'operation' },
      ], { fmt: x => plural(x, 'minute'), int: false, min: 0.5 });
      return item(`Two printers share a job. The older one prints ${a} pages a minute and the newer one prints ${b} pages a minute. They start together on a job of ${pages} pages. How long does the job take?`,
        built, explainWith(`Together they print ${a + b} pages a minute, so ${pages} pages take ${pages} ÷ ${a + b} = ${num(ans)} minutes.`, built));
    }
    // filling and emptying
    const fill = byLevel(level, 0, R.pick([6, 8, 10, 12]), R.pick([12, 15, 18, 20])), drain = byLevel(level, 0, fill * 2, fill * R.pick([2, 3]));
    const tank = lcm(fill, drain) * R.int(1, 3);
    const rateIn = tank / fill, rateOut = tank / drain;
    const ans = tank / (rateIn - rateOut);
    const built = numOpts(R, ans, [
      { v: fill, why: 'ignores the leak', tag: 'part-only' },
      { v: drain - fill, why: 'subtracts the times instead of the rates', tag: 'operation' },
      { v: round6(tank / (rateIn + rateOut)), why: 'adds the leak instead of taking it away', tag: 'reversed' },
      { v: (fill + drain) / 2, why: 'averages the two times', tag: 'operation' },
    ], { fmt: x => plural(x, 'minute'), int: false, min: 1 });
    return item(`A tap can fill a tank in ${fill} minutes. A hole in the bottom can empty the full tank in ${drain} minutes. The tank starts empty with the tap on and the hole open. How long does it take to fill the tank?`,
      built, explainWith(`Each minute the tap fills 1/${fill} of the tank and the hole empties 1/${drain}, a net 1/${ans} of the tank. So it takes ${ans} minutes.`, built));
  } });

/* ---- time zones ---- */
defMaths({ id: 'm-time-zones', slot: 'timetable', topic: 'time zones', fam: 'Measurement and time',
  gen(R, level) {
    const pool = [['Auckland', 13], ['Tokyo', 9], ['Dubai', 4], ['Calgary', -7], ['New York', -5], ['Nairobi', 3], ['Perth', 8], ['Honolulu', -10], ['Bangkok', 7]];
    if (level !== 'easy') pool.push(['Delhi', 5.5], ['Adelaide', 10.5], ['Kathmandu', 5.75]);
    let A, B;
    do { [A, B] = R.sample(pool, 2); } while (A[1] === B[1] || (level === 'hard' && (A[1] % 1 === 0 && B[1] % 1 === 0)));
    const t = R.int(0, 23) * 60 + byLevel(level, 0, R.pick([0, 30]), R.pick([15, 30, 45]));
    const diff = Math.round((A[1] - B[1]) * 60);
    const ans = t + diff;
    const fmt = time12;
    const desc = (c, v) => `${hm(Math.round(Math.abs(v) * 60))} ${v > 0 ? 'ahead of' : 'behind'} London`;
    const extra = level === 'hard' ? 24 * 60 * 0 : 0;
    const cands = [
      { v: t - diff, why: 'moves the clock the wrong way', tag: 'reversed' },
      { v: t + Math.round((A[1] + B[1]) * 60), why: 'adds the two differences instead of combining them properly', tag: 'operation' },
      { v: t + Math.round(A[1] * 60), why: 'uses only one of the time differences', tag: 'part-only' },
      { v: ans + 60, why: 'is one hour out', tag: 'slip' },
      { v: ans - 60, why: 'is one hour out', tag: 'slip' },
    ];
    const strs = [], whys = [], tags = [], vals = [];
    const push = (v, why, tag) => { const s = fmt(v); if (!strs.includes(s)) { strs.push(s); whys.push(why); tags.push(tag); vals.push(((v % 1440) + 1440) % 1440); } };
    push(ans + extra, null, null);
    cands.forEach(c => { if (strs.length < 5) push(c.v, c.why, c.tag); });
    const ord = vals.map((_, i) => i).sort((a, b) => vals[a] - vals[b]);
    const built = { options: ord.map(i => strs[i]), answer: ord.indexOf(0), whys: ord.map(i => whys[i]), tags: ord.map(i => tags[i]) };
    const dayNote = (ans >= 1440 || ans < 0) ? (ans >= 1440 ? ' on the next day' : ' on the day before') : '';
    return item(`The time in ${A[0]} is ${desc(A[0], A[1])}. The time in ${B[0]} is ${desc(B[0], B[1])}. When it is ${fmt(t)} in ${B[0]}, what time is it in ${A[0]}?`,
      built, explainWith(`${A[0]} is ${hm(Math.abs(diff))} ${diff >= 0 ? 'ahead of' : 'behind'} ${B[0]}, so the time is ${fmt(ans)}${dayNote}.`, built));
  } });

/* ---- bus timetable ---- */
defMaths({ id: 'm-timetable', slot: 'timetable', topic: 'timetables', fam: 'Measurement and time',
  gen(R, level) {
    const [T1, T2] = R.sample(TOWNS, 2);
    const mk = (start) => {
      const out = []; let t = start;
      for (let i = 0; i < 4; i++) { const dur = R.int(55, 80) - R.int(0, 5) * 0; out.push([t, t + dur]); t += R.int(110, 260) - (R.int(0, 11)) ; }
      return out.map(([a, b]) => [a - a % 5, b - b % 5]);
    };
    const go = mk(R.int(6 * 60 + 30, 8 * 60 + 15)), back = mk(R.int(7 * 60, 8 * 60 + 45));
    const who = name1(R);
    const k = R.int(0, 1);
    const out = go[k];
    // returns on the first bus back that leaves after arriving (+ some wait for hard)
    const wait = byLevel(level, 0, R.pick([0, 60]), R.pick([60, 90, 120]));
    const ret = back.find(b => b[0] >= out[1] + wait);
    if (!ret) return this.gen(R, level);
    const ans = ret[1] - out[0];
    const table = { caption: `Buses between ${T1} and ${T2}`, head: [`${T1} → ${T2} depart`, 'arrive', `${T2} → ${T1} depart`, 'arrive'],
      rows: go.map((g, i) => [time24(g[0]), time24(g[1]), time24(back[i][0]), time24(back[i][1])]) };
    const fmt = m => hm(m);
    const built = numOpts(R, ans, [
      { v: ret[0] - out[0], why: 'stops at the time the return bus leaves, not when it arrives', tag: 'part-only' },
      { v: ret[1] - out[1], why: 'starts counting when the first bus arrives', tag: 'misread' },
      { v: ans + 40, why: 'subtracts the times as if an hour were 100 minutes', tag: 'units' },
      { v: (back.find(b => b[0] > ret[0]) || [0, ret[1] + 120])[1] - out[0], why: 'catches a later bus back than needed', tag: 'misread' },
    ], { fmt, min: 10, step: 15 });
    const extraTxt = wait ? ` ${who} spends at least ${hm(wait)} in ${T2}, then returns on the next bus.` : ` ${who} returns on the next bus.`;
    return item(`${who} catches the ${k === 0 ? 'first' : 'second'} bus of the day from ${T1} to ${T2}.${extraTxt} How long is ${who} away from ${T1}?`,
      built, explainWith(`${who} leaves at ${time24(out[0])}, arrives in ${T2} at ${time24(out[1])}, takes the ${time24(ret[0])} bus back and arrives at ${time24(ret[1])}: ${hm(ans)} in all.`, built), { table });
  } });

/* ---- clock hands and calendars ---- */
defMaths({ id: 'm-clock-calendar', slot: 'clock-calendar', topic: 'clocks and calendars', fam: 'Measurement and time',
  gen(R, level) {
    if (R.chance(0.5)) {
      const h = R.int(1, 11), m = byLevel(level, R.pick([0, 30]), R.pick([15, 30, 45]), R.pick([10, 20, 35, 50, 25]));
      const ha = (h % 12) * 30 + m * 0.5, ma = m * 6;
      let ang = Math.abs(ha - ma); if (ang > 180) ang = 360 - ang;
      const built = numOpts(R, ang, [
        { v: Math.abs((h % 12) * 30 - ma) > 180 ? 360 - Math.abs((h % 12) * 30 - ma) : Math.abs((h % 12) * 30 - ma), why: 'forgets that the hour hand moves between the numbers', tag: 'part-only' },
        { v: 360 - ang, why: 'gives the reflex angle', tag: 'misread' },
        { v: ang + 15, why: 'moves the hour hand half an hour too far', tag: 'slip' },
        { v: Math.abs(ang - 30), why: 'is one hour-gap out', tag: 'off-by-one' },
      ], { fmt: x => num(x) + '°', int: false, min: 0 });
      return item(`What is the smaller angle between the hour hand and the minute hand of a clock at ${h}:${pad2(m)}?`,
        built, explainWith(`The minute hand is at ${ma}°. The hour hand is at ${h} × 30° + ${m} × 0.5° = ${ha}°. The angle between them is ${ang}°.`, built), { svg: clockSvg(h, m) });
    }
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = [['January', 31], ['February', 28], ['March', 31], ['April', 30], ['May', 31], ['June', 30], ['July', 31], ['August', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31]];
    const mi = R.int(0, 10), d0 = R.int(1, months[mi][1]), w0 = R.int(0, 6);
    const add = byLevel(level, R.int(10, 40), R.int(40, 120), R.int(100, 300));
    const ans = days[(w0 + add) % 7];
    // date after adding
    let m = mi, d = d0 + add;
    while (d > months[m % 12][1]) { d -= months[m % 12][1]; m++; }
    const wrongs = [
      { s: days[(w0 + add + 1) % 7], why: 'counts the starting day as well', tag: 'off-by-one' },
      { s: days[(w0 + add + 6) % 7], why: 'is one day short', tag: 'off-by-one' },
      { s: days[(w0 + add % 10) % 7], why: 'uses the last digit of the number of days instead of the remainder after dividing by 7', tag: 'operation' },
      { s: days[(w0 + Math.floor(add / 7)) % 7], why: 'counts weeks instead of leftover days', tag: 'misread' },
      { s: days[(w0 + 3) % 7], why: 'is a guess', tag: 'slip' }, { s: days[(w0 + 5) % 7], why: 'is a guess', tag: 'slip' },
    ];
    days.forEach(dd => wrongs.push({ s: dd, why: 'does not count the days correctly', tag: 'slip' }));
    const built = textOpts(R, ans, wrongs, { n: 5 });
    const ord = days.filter(x => built.options.includes(x));
    const o2 = { options: ord, answer: ord.indexOf(ans), whys: ord.map(x => x === ans ? null : built.whys[built.options.indexOf(x)]), tags: ord.map(x => x === ans ? null : built.tags[built.options.indexOf(x)]) };
    return item(`${d0} ${months[mi][0]} is a ${days[w0]}. In a year that is not a leap year, what day of the week is ${d} ${months[m % 12][0]}${m >= 12 ? ' of the following year' : ''}?`,
      o2, explainWith(`${d} ${months[m % 12][0]} is ${add} days later. ${add} = ${Math.floor(add / 7)} weeks and ${add % 7} days, so it is ${add % 7} days after ${days[w0]}: ${ans}.`, o2));
  } });
