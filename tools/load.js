/* Loads the non-UI source files into one Node context for testing. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

function sourceList(withUI) {
  const order = require('./order.json');
  return order.filter(f => withUI || !f.startsWith('src/ui/'));
}
function expand(f) {
  const p = path.join(ROOT, f);
  if (f.endsWith('/*')) {
    const dir = p.slice(0, -2);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(x => x.endsWith('.js')).sort().map(x => path.join(dir, x));
  }
  return [p];
}
function load() {
  const files = [].concat.apply([], sourceList(false).map(expand));
  const code = files.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n') +
    '\n;this.__out = { GEN, makeRng, hashSeed, SPEC, TIERS, MISTAKE, ' +
    'EXAMS: typeof EXAMS !== "undefined" ? EXAMS : null, buildExamModule: typeof buildExamModule !== "undefined" ? buildExamModule : null, ' +
    'CONTENT: typeof CONTENT !== "undefined" ? CONTENT : null, auditKey };';
  const ctx = { console, window: {}, Math, JSON, Date, Set, Map, Array, Object, String, Number };
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'bundle.js' });
  return ctx.__out;
}
module.exports = { load, sourceList, expand, ROOT };
