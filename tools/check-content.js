/* Checks the written content of every exam file for structural mistakes. */
'use strict';
const fs = require('fs'), vm = require('vm');
const { expand } = require('./load');
const order = require('./order.json').filter(f => !f.startsWith('src/ui/'));
const files = [].concat.apply([], order.map(expand)).filter(f => fs.existsSync(f));
const ctx = { console, Math, JSON, Date };
vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n') + ';this.C = CONTENT;', ctx);
let bad = 0;
const err = (id, m) => { bad++; console.log(`✗ ${id}: ${m}`); };
const letterRef = /\b(option|answer|choice) [A-G]\b|\(([A-G])\) is/;
for (const id of Object.keys(ctx.C).sort()) {
  const c = ctx.C[id];
  const want = { s1: [8, 4], s2: [8, 4], s3: [6, 4], s4: [6, 7], s5: [10, 4] };
  const types = (c.reading || []).map(u => u.type).join(',');
  if (types !== 's1,s2,s3,s4,s5') err(id, 'reading sections are ' + types);
  (c.reading || []).forEach(u => {
    const [n, k] = want[u.type];
    if (u.questions.length !== n) err(u.id, `${u.questions.length} questions, want ${n}`);
    u.questions.forEach((q, i) => {
      if (q.options.length !== k) err(u.id, `Q${i + 1} has ${q.options.length} options`);
      if (!(q.answer >= 0 && q.answer < q.options.length)) err(u.id, `Q${i + 1} answer ${q.answer}`);
      if (new Set(q.options).size !== q.options.length) err(u.id, `Q${i + 1} duplicate options`);
      if (!q.explain || q.explain.length < 25) err(u.id, `Q${i + 1} explanation missing or short`);
      if (letterRef.test(q.explain) && u.type !== 's5' && u.type !== 's4') err(u.id, `Q${i + 1} explanation names a letter`);
      if (q.whys && (q.whys.length !== q.options.length || q.whys[q.answer] != null)) err(u.id, `Q${i + 1} whys do not line up`);
    });
    const text = JSON.stringify(u.stimulus);
    if (u.type === 's2' || u.type === 's4') {
      const gaps = (text.match(/(…|\.\.\.)\(\d\)(…|\.\.\.)/g) || []).length;
      if (gaps !== n) err(u.id, `${gaps} gap markers, want ${n}`);
    }
    if (u.type === 's4') {
      const ans = u.questions.map(q => q.answer);
      if (new Set(ans).size !== 6) err(u.id, 'two gaps share an answer');
    }
    if (u.type === 's5') {
      const cnt = [0, 0, 0, 0]; u.questions.forEach(q => cnt[q.answer]++);
      if (cnt.some(x => x < 2 || x > 4)) err(u.id, 'extract counts ' + cnt.join(','));
    }
  });
  const t = c.thinking || [];
  if (t.length !== 16) err(id, `${t.length} thinking items, want 16`);
  const roles = {};
  t.forEach((q, i) => {
    roles[q.role] = (roles[q.role] || 0) + 1;
    if (q.options.length !== 4) err(id, `TS${i + 1} has ${q.options.length} options`);
    if (!(q.answer >= 0 && q.answer < 4)) err(id, `TS${i + 1} answer ${q.answer}`);
    if (new Set(q.options).size !== 4) err(id, `TS${i + 1} duplicate options`);
    if (!q.explain || q.explain.length < 25) err(id, `TS${i + 1} explanation short`);
    if (q.whys && (q.whys.length !== 4 || q.whys[q.answer] != null)) err(id, `TS${i + 1} whys do not line up`);
    if (letterRef.test(q.explain)) err(id, `TS${i + 1} explanation names a letter`);
  });
  if (!c.writing || !c.writing.prompt || !c.writing.genre) err(id, 'writing task incomplete');
  console.log(`${bad ? '' : '✓'} ${id}  roles: ${Object.entries(roles).map(([k, v]) => k + ' ' + v).join(', ')}`);
}
process.exit(bad ? 1 : 0);
