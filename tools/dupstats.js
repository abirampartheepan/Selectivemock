'use strict';
const fs = require('fs'), vm = require('vm');
const { expand } = require('./load');
const order = require('./order.json').filter(f => !f.startsWith('src/ui/'));
const files = [].concat.apply([], order.map(expand)).filter(f => fs.existsSync(f));
const ctx = { console, Math, JSON, Date }; vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n') + ';this.o={EXAMS,buildExamModule,examReady};', ctx);
const seen = new Map(), dup = {};
for (const ex of ctx.o.EXAMS) for (const m of ['maths', 'thinking']) {
  if (!ctx.o.examReady(ex.id, m)) continue;
  const p = ctx.o.buildExamModule(ex.id, m);
  p.items.forEach(it => { const k = it.stem + JSON.stringify(it.options) + (it.svg || '') + JSON.stringify(it.table || ''); if (seen.has(k)) dup[it.source] = (dup[it.source] || 0) + 1; else seen.set(k, 1); });
}
console.log(Object.entries(dup).sort((a, b) => b[1] - a[1]));
