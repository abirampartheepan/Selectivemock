/* Runs every generator many times at every level and checks the output.
   usage: node tools/check-gen.js [generator-id-substring] [--show N] */
'use strict';
const { load } = require('./load');
const fs = require('fs');
const path = require('path');

// tolerate files that do not exist yet
const order = require('./order.json');
const ROOT = path.join(__dirname, '..');
const missing = order.filter(f => !f.endsWith('/*') && !fs.existsSync(path.join(ROOT, f)));
if (missing.length) {
  const tmp = order.filter(f => !missing.includes(f));
  fs.writeFileSync(path.join(__dirname, '.order.tmp.json'), JSON.stringify(tmp));
  require.cache[require.resolve('./order.json')] = { exports: tmp };
}
const L = load();
const filter = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const showIdx = process.argv.indexOf('--show');
const SHOW = showIdx > 0 ? parseInt(process.argv[showIdx + 1], 10) : 0;
const N = 400;
let bad = 0;
const all = L.GEN.maths.map(g => ['maths', g]).concat(L.GEN.ts.map(g => ['ts', g]));
const stats = {};
for (const [mod, g] of all) {
  if (filter && !g.id.includes(filter)) continue;
  const nOpts = mod === 'maths' ? 5 : 4;
  const errs = new Set();
  let shown = {};
  const stems = new Set();
  for (const level of ['easy', 'medium', 'hard']) {
    for (let s = 1; s <= N; s++) {
      let it;
      try { it = g.gen(L.makeRng(L.hashSeed(g.id + '|' + level + '|' + s)), level); }
      catch (e) { errs.add('throws: ' + e.message.slice(0, 120)); continue; }
      if (!it) { errs.add('returned nothing'); continue; }
      const opts = it.optionSvgs || it.options;
      if (!Array.isArray(opts) || opts.length !== nOpts) errs.add(`${level}: ${opts ? opts.length : 0} options`);
      else {
        if (new Set(opts).size !== opts.length) errs.add(`${level}: duplicate options ${JSON.stringify(opts).slice(0, 160)}`);
        if (opts.some(o => /NaN|undefined|Infinity|null/.test(String(o)))) errs.add(`${level}: bad option text ${JSON.stringify(opts).slice(0, 160)}`);
      }
      if (!(it.answer >= 0 && it.answer < nOpts)) errs.add(`${level}: answer index ${it.answer}`);
      if (!it.stem || /NaN|undefined|Infinity/.test(it.stem)) errs.add(`${level}: bad stem ${String(it.stem).slice(0, 160)}`);
      if (!it.explain || /NaN|undefined|Infinity/.test(it.explain)) errs.add(`${level}: bad explain ${String(it.explain).slice(0, 200)}`);
      if (it.whys && it.whys[it.answer] != null) errs.add(`${level}: correct option has a why`);
      stems.add(it.stem + JSON.stringify(opts));
      if (SHOW && (shown[level] || 0) < SHOW && s % 37 === 1) {
        shown[level] = (shown[level] || 0) + 1;
        console.log(`\n[${g.id} · ${level}] ${it.stem.replace(/<br>/g, '\n   ')}`);
        opts.forEach((o, i) => console.log(`   ${'ABCDE'[i]}${i === it.answer ? '*' : ' '} ${it.optionSvgs ? '[svg]' : o}${it.whys && it.whys[i] ? '   — ' + it.whys[i] : ''}`));
        console.log('   EXPLAIN: ' + it.explain);
        if (it.table) console.log('   TABLE: ' + JSON.stringify(it.table).slice(0, 300));
      }
    }
  }
  stats[g.id] = stems.size;
  if (errs.size) { bad++; console.log(`✗ ${g.id}`); Array.from(errs).slice(0, 6).forEach(e => console.log('    ' + e)); }
  else if (!SHOW) console.log(`✓ ${g.id}  (${stems.size} distinct of ${3 * N})`);
}
console.log(`\n${all.length} generators, ${bad} with problems`);
process.exit(bad ? 1 : 0);
