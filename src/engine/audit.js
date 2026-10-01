/* ==========================================================================
   Key auditor — the answer key is itself an item. Four ways it has leaked on
   earlier papers: block permutations, perfectly even counts, too few adjacent
   repeats, and a letter that is never correct inside a section.
   ========================================================================== */
function auditKey(letters, nopts, sections) {
  const n = letters.length;
  const hard = [], soft = [];
  const alphabet = LETTERS.slice(0, nopts).split('');
  const count = {};
  alphabet.forEach(L => count[L] = 0);
  letters.forEach(L => { if (count[L] != null) count[L]++; });

  // --- blocking defects: a candidate could exploit any of these
  alphabet.forEach(L => { if (count[L] === 0) hard.push(`letter ${L} is never correct`); });
  const lo = Math.max(2, Math.floor(n / nopts * 0.42));
  const hi = Math.ceil(n / nopts * 1.75);
  alphabet.forEach(L => { if (count[L] > hi) hard.push(`letter ${L} used ${count[L]} times, more than ${hi}`); });
  for (let i = 0; i + 3 <= n; i++) {
    if (letters[i] === letters[i + 1] && letters[i + 1] === letters[i + 2]) hard.push(`three identical letters at Q${i + 1}`);
  }
  // Test 7's leak was that EVERY aligned block was a permutation of A-E. One or
  // two by chance is normal, so only an excess is a leak.
  const perms = [];
  for (let i = 0; i + nopts <= n; i += nopts) {
    const block = letters.slice(i, i + nopts);
    if (alphabet.every(L => block.includes(L))) perms.push(`Q${i + 1}–Q${i + nopts}`);
  }
  const nblocks = Math.floor(n / nopts);
  const permCap = Math.max(1, Math.round(nblocks * 0.25));
  if (perms.length > permCap) hard.push(`${perms.length} of ${nblocks} aligned blocks are permutations of A–${alphabet[nopts - 1]} (${perms.slice(0, 3).join(', ')})`);
  else if (perms.length === permCap && permCap > 1) soft.push(`${perms.length} aligned blocks are permutations of A–${alphabet[nopts - 1]}`);
  for (let i = 0; i + 7 <= n; i++) {
    const w = letters.slice(i, i + 7);
    if (new Set(w).size === 2 && w.every((L, k) => L === w[k % 2])) hard.push(`seven-item two-letter alternation at Q${i + 1}`);
  }
  (sections || []).forEach(sec => {
    const slice = letters.slice(sec.from - 1, sec.to);
    const opts = sec.opts || nopts;
    const abc = LETTERS.slice(0, opts).split('');
    if (slice.length >= opts * 2) {
      abc.forEach(L => { if (!slice.includes(L)) hard.push(`${sec.title}: letter ${L} never correct`); });
    }
    if (sec.matching) {
      const c = {}; abc.forEach(L => c[L] = 0); slice.forEach(L => c[L]++);
      abc.forEach(L => {
        if (c[L] < 2) hard.push(`${sec.title}: extract ${L} keyed only ${c[L]} time(s)`);
        if (c[L] > 4) hard.push(`${sec.title}: extract ${L} keyed ${c[L]} times`);
      });
    }
  });

  // --- advisory: a random key breaks these often, so they steer rather than block
  if (new Set(alphabet.map(L => count[L])).size === 1) soft.push('letter counts are perfectly even, which no real paper has');
  alphabet.forEach(L => { if (count[L] < lo) soft.push(`letter ${L} correct only ${count[L]} times`); });
  let reps = 0;
  for (let i = 1; i < n; i++) if (letters[i] === letters[i - 1]) reps++;
  const expected = (n - 1) / nopts;
  if (reps < Math.max(1, Math.floor(expected * 0.35))) soft.push(`only ${reps} adjacent repeats; chance gives about ${Math.round(expected)}`);
  if (reps > Math.ceil(expected * 2.1)) soft.push(`${reps} adjacent repeats; chance gives about ${Math.round(expected)}`);
  const win = nopts === 5 ? 16 : 12;
  for (let i = 0; i + win <= n; i++) {
    const w = new Set(letters.slice(i, i + win));
    alphabet.forEach(L => { if (!w.has(L)) soft.push(`no ${L} anywhere in Q${i + 1}–Q${i + win}`); });
  }

  return { ok: hard.length === 0, clean: hard.length === 0 && soft.length === 0,
           hard, soft, issues: hard.concat(soft), counts: count, reps };
}

/* An option list is "ordered" when its printed order carries meaning — numeric
   values (Maths keeps these ascending), or line/stanza references. Those must
   never be shuffled; everything else may be. */
function orderedOptions(opts) {
  if (!Array.isArray(opts)) return true;
  const num = opts.every(o => typeof o === 'string' && /\d/.test(o) &&
    /^[-−+]?\$?\s*[\d\s,]*\d(\.\d+)?\s*[a-zA-Z²³%°\/]*$/.test(o.trim()));
  if (num) return true;
  if (opts.every(o => /^(lines?|stanzas?|verse|the (first|second|third|last|fourth))\b/i.test(String(o).trim()))) return true;
  return false;
}
function permuteOptions(it, R) {
  const list = it.options || it.optionSvgs || [];
  const order = R.shuffle(list.map((_, i) => i));
  if (it.options) it.options = order.map(i => it.options[i]);
  if (it.optionSvgs) it.optionSvgs = order.map(i => it.optionSvgs[i]);
  if (it.whys) it.whys = order.map(i => it.whys[i]);
  if (it.tags) it.tags = order.map(i => it.tags[i]);
  it.answer = order.indexOf(it.answer);
}

/* Repair pass — hill-climb by swapping items that may legitimately trade
   places (same difficulty tier in Maths, same kind in Thinking Skills, the ten
   matching statements in Reading). Reordering never changes an item, so this
   costs nothing and is what earlier papers did by hand. */
function repairKey(paper, nopts, R) {
  const items = paper.items;
  const score = () => {
    const a = auditKey(items.map(i => LETTERS[i.answer]), nopts, paper.sections);
    return { a, v: a.hard.length * 100 + a.soft.length };
  };
  // Both move sets are recomputed from the live array on every step. Caching
  // indices once was a real defect in the first build: a swap changes which item
  // sits at which index, so a cached "shufflable" index could later hand a
  // numeric item to the option-shuffler and destroy its ascending order.
  const swapGroups = () => {
    const g = {};
    items.forEach((it, i) => { if (it.swapGroup) (g[it.swapGroup] = g[it.swapGroup] || []).push(i); });
    return Object.keys(g).map(k => g[k]).filter(a => a.length > 1);
  };
  const shufIdx = () => items.map((it, i) => (it.shufflable ? i : -1)).filter(i => i >= 0);

  let cur = score();
  if (!swapGroups().length && !shufIdx().length) return cur.a;
  for (let step = 0; step < 1400 && cur.v > 0; step++) {
    const groups = swapGroups(), shuf = shufIdx();
    const useShuffle = shuf.length && (!groups.length || R.int(0, 2) > 0);
    if (useShuffle) {
      const i = R.pick(shuf);
      const it = items[i];
      if (!it.shufflable) continue;
      const before = { options: it.options && it.options.slice(), optionSvgs: it.optionSvgs && it.optionSvgs.slice(),
        whys: it.whys && it.whys.slice(), tags: it.tags && it.tags.slice(), answer: it.answer };
      permuteOptions(it, R);
      const next = score();
      if (next.v <= cur.v) cur = next;
      else Object.assign(it, before);
    } else {
      const g = R.pick(groups);
      const i = R.pick(g), j = R.pick(g);
      if (i === j) continue;
      const t = items[i]; items[i] = items[j]; items[j] = t;
      const next = score();
      if (next.v <= cur.v) cur = next;
      else { const u = items[i]; items[i] = items[j]; items[j] = u; }
    }
  }
  items.forEach((it, i) => { it.n = i + 1; });
  return score().a;
}
