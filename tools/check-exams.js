/* Builds every test of every exam and checks it.
   - right number of questions and options, valid answers
   - no question appears twice anywhere in the 100 exams
   - answer-key audit result
   usage: node tools/check-exams.js [--verbose] */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { expand, ROOT } = require('./load');
const order = require('./order.json').filter(f => !f.startsWith('src/ui/'));
const files = [].concat.apply([], order.map(expand)).filter(f => fs.existsSync(f));
const code = files.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n') +
  ';this.__o = { EXAMS, buildExamModule, examReady, examFullyReady, CONTENT, SPEC, MODULE_ORDER };';
const ctx = { console, Math, JSON, Date };
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'bundle.js' });
const L = ctx.__o;
const verbose = process.argv.includes('--verbose');
const seen = new Map();
let problems = 0, built = 0, notClean = 0;
const t0 = Date.now();
for (const ex of L.EXAMS) {
  for (const m of L.MODULE_ORDER) {
    if (!L.examReady(ex.id, m)) continue;
    let p;
    try { p = L.buildExamModule(ex.id, m); } catch (e) { console.log(`✗ ${ex.id} ${m}: throws ${e.message}`); problems++; continue; }
    built++;
    if (m === 'writing') { if (!p.prompt || !p.prompt.prompt) { console.log(`✗ ${ex.id} writing: no prompt`); problems++; } continue; }
    const want = L.SPEC[m].n;
    if (p.items.length !== want) { console.log(`✗ ${ex.id} ${m}: ${p.items.length} questions, want ${want}`); problems++; }
    p.items.forEach(it => {
      const opts = it.optionSvgs || it.options;
      const nOpt = m === 'maths' ? 5 : m === 'thinking' ? 4 : it.opts;
      if (!opts || (m !== 'reading' && opts.length !== nOpt)) { console.log(`✗ ${ex.id} ${m} Q${it.n}: ${opts && opts.length} options`); problems++; }
      if (!(it.answer >= 0 && it.answer < opts.length)) { console.log(`✗ ${ex.id} ${m} Q${it.n}: answer ${it.answer}`); problems++; }
      if (m !== 'reading') {
        const k = it.stem + '||' + JSON.stringify(it.options) + (it.svg || '') + JSON.stringify(it.table || '') + (it.optionSvgs || []).join('');
        if (seen.has(k)) { console.log(`✗ duplicate question: ${ex.id} ${m} Q${it.n} = ${seen.get(k)}`); problems++; }
        else seen.set(k, `${ex.id} ${m} Q${it.n}`);
      }
    });
    if (p.audit && !p.audit.ok) { notClean++; if (verbose) console.log(`  key audit ${ex.id} ${m}: ${p.audit.hard.join('; ')}`); }
  }
}
console.log(`\n${built} tests built in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${problems} problems, ${notClean} keys with an audit warning`);
const full = L.EXAMS.filter(e => L.examFullyReady(e.id)).map(e => e.id);
console.log(`Exams with all four tests ready: ${full.length} ${full.join(' ')}`);
process.exit(problems ? 1 : 0);
