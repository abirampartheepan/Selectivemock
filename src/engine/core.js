/* ==========================================================================
   Core — test specification, seeded random numbers, small shared helpers
   ========================================================================== */
'use strict';

const SPEC = {
  reading:  { key:'reading',  name:'Reading',                short:'Reading',  n:38, minutes:45, opts:4 },
  maths:    { key:'maths',    name:'Mathematical Reasoning', short:'Maths',    n:35, minutes:40, opts:5 },
  thinking: { key:'thinking', name:'Thinking Skills',        short:'Thinking', n:40, minutes:40, opts:4 },
  writing:  { key:'writing',  name:'Writing',                short:'Writing',  n:1,  minutes:30, opts:0 },
};
const MODULE_ORDER = ['reading', 'thinking', 'maths', 'writing'];
const LETTERS = 'ABCDEFG';

/* What the student sees is Easy / Medium / Hard. What each tier actually is:
   easy is the real test's standard, medium sits above it, hard is well above. */
const TIERS = {
  easy:   { key:'easy',   label:'Easy',   prefix:'E', count:40,
            blurb:'A good place to start.' },
  medium: { key:'medium', label:'Medium', prefix:'M', count:40,
            blurb:'Harder questions, more steps and closer wrong answers.' },
  hard:   { key:'hard',   label:'Hard',   prefix:'H', count:20,
            blurb:'Very hard. For students already scoring well on Medium.' },
};
const TIER_ORDER = ['easy', 'medium', 'hard'];

/* ---------- seeded rng ---------- */
function makeRng(seed) {
  let s = seed >>> 0;
  if (s === 0) s = 0x9e3779b9;
  function next() {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  }
  const R = {
    raw: next,
    int(a, b) { return a + Math.floor(next() * (b - a + 1)); },
    pick(arr) { return arr[R.int(0, arr.length - 1)]; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = R.int(0, i); const t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    sample(arr, n) { return R.shuffle(arr).slice(0, n); },
    chance(p) { return next() < p; },
  };
  return R;
}

/* String -> 32-bit seed (FNV-1a), so "E07|maths|12" always builds the same question. */
function hashSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0 || 1;
}
