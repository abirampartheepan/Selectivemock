/* ==========================================================================
   Generator library — shared by every Mathematical Reasoning and Thinking
   Skills question generator.

   A generator is { id, topic, fam, slot, gen(R, level) } and gen returns
     { stem, options, answer, explain, svg?, table?, optionSvgs?, whys?, tags? }
   whys[i] says what mistake produces wrong option i; tags[i] is the short
   mistake category used by the "mistake patterns" panel. The correct option
   has null in both.
   ========================================================================== */
'use strict';

const GEN = { maths: [], ts: [] };
function defMaths(g) { GEN.maths.push(g); }
function defTS(g) { GEN.ts.push(g); }

/* The mistake categories. Every wrong numeric option is tagged with one. */
const MISTAKE = {
  'part-only':  'Stopped after one step',
  'operation':  'Used the wrong operation',
  'units':      'Mixed up units',
  'place':      'Place value slip',
  'off-by-one': 'Counted one too many or too few',
  'misread':    'Answered a different question',
  'reversed':   'Worked it the wrong way round',
  'slip':       'Arithmetic slip',
  'logic':      'Logic error',
  'spatial':    'Visualising error',
};

/* ---------- numbers and formatting ---------- */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
function lcm(a, b) { return a / gcd(a, b) * b; }
function round2(x) { return Math.round(x * 100) / 100; }
function isInt(x) { return Math.abs(x - Math.round(x)) < 1e-9; }
function comma(n) {
  // Australian style: thin spaces are hard to read on screen, so commas from 10 000 up
  const neg = n < 0; n = Math.abs(n);
  const [i, d] = String(n).split('.');
  const s = i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i;
  return (neg ? '−' : '') + s + (d ? '.' + d : '');
}
function num(n) { return comma(round6(n)); }
function round6(x) { return Math.round(x * 1e6) / 1e6; }
function money(x) {
  const neg = x < 0; x = Math.abs(round2(x));
  const [i, d] = x.toFixed(2).split('.');
  return (neg ? '−' : '') + '$' + comma(Number(i)) + '.' + d;
}
function moneyShort(x) { return isInt(x) ? '$' + comma(Math.round(x)) : money(x); }
function frac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1; n /= g; d /= g;
  if (d === 1) return String(n);
  return n + '/' + d;
}
function mixed(n, d) {
  const g = gcd(n, d) || 1; n /= g; d /= g;
  if (d === 1) return String(n);
  if (Math.abs(n) < d) return n + '/' + d;
  const w = Math.trunc(n / d), r = Math.abs(n % d);
  return w + ' ' + r + '/' + d;
}
function pad2(n) { return String(n).padStart(2, '0'); }
function time24(mins) { mins = ((mins % 1440) + 1440) % 1440; return pad2(Math.floor(mins / 60)) + ':' + pad2(mins % 60); }
function time12(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60), m = mins % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + pad2(m) + (h < 12 ? ' am' : ' pm');
}
function hm(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (!h) return m + ' minutes';
  if (!m) return h + (h === 1 ? ' hour' : ' hours');
  return h + (h === 1 ? ' hour ' : ' hours ') + m + ' minutes';
}
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function isPrime(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
function factors(n) { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; }
function sum(a) { return a.reduce((s, x) => s + x, 0); }
function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function listAnd(a) { return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
const WORDNUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
function words(n) { return WORDNUM[n] || String(n); }

/* by tier: easy → a, medium → b, hard → c */
function byLevel(level, a, b, c) { return level === 'hard' ? c : level === 'medium' ? b : a; }

/* ---------- people and places ---------- */
const NAMES = ['Aisha', 'Ben', 'Chloe', 'Dev', 'Ella', 'Farid', 'Grace', 'Hamish', 'Isla', 'Jai', 'Kiara', 'Liam',
  'Mei', 'Nikhil', 'Olivia', 'Priya', 'Quinn', 'Rohan', 'Sofia', 'Tariq', 'Uma', 'Vikram', 'Willow', 'Xavier',
  'Yasmin', 'Zac', 'Amira', 'Bao', 'Caleb', 'Divya', 'Eli', 'Freya', 'Gus', 'Hana', 'Ivan', 'Jasmine', 'Kai',
  'Leila', 'Marcus', 'Nadia', 'Oscar', 'Pippa', 'Ravi', 'Saanvi', 'Theo', 'Vanessa', 'Wei', 'Yusuf', 'Zara',
  'Anika', 'Callum', 'Elena', 'Harvey', 'Ines', 'Jun', 'Lachlan', 'Maya', 'Noah', 'Ruby', 'Sami', 'Tom', 'Ava',
  'Arjun', 'Bella', 'Daniel', 'Emily', 'Felix', 'Georgia', 'Hugo', 'Imogen', 'Jack', 'Lucy', 'Minh', 'Nora'];
function names(R, k) { return R.sample(NAMES, k); }
function name1(R) { return R.pick(NAMES); }
const TOWNS = ['Ashford', 'Bellbrook', 'Carrowdale', 'Dunmore', 'Eastvale', 'Farley', 'Glenroy', 'Hillside',
  'Ironbark', 'Jarrah Bay', 'Kurrajong', 'Lindfield', 'Millbrook', 'Narrabeen', 'Oakhurst', 'Pinecliff',
  'Queenscliff', 'Riverton', 'Stonehaven', 'Tallow Creek', 'Wattle Flat', 'Yarrabee'];

/* ---------- option builders ---------- */

/* Numeric options. `correct` is a number; `cands` are wrong values with the
   mistake that produces each. Options are distinct after formatting, sorted
   ascending (as the real Maths paper prints them) unless sort:false. */
function numOpts(R, correct, cands, o) {
  o = o || {};
  const n = o.n || 5, fmt = o.fmt || num;
  const min = o.min == null ? -Infinity : o.min;
  const intOnly = o.int !== false && isInt(correct);
  const dp = x => { const t = String(round6(Math.abs(x))); const i = t.indexOf('.'); return i < 0 ? 0 : t.length - i - 1; };
  const maxDp = Math.max(o.maxDp == null ? 2 : o.maxDp, dp(correct));
  const cs = fmt(correct);
  const seen = new Set([cs]);
  const valid = c => {
    const v = round6(c.v);
    if (!isFinite(v) || v < min) return null;
    if (dp(v) > maxDp) return null;
    if (intOnly && !isInt(v)) return null;
    if (o.max != null && v > o.max) return null;
    const s = fmt(v);
    if (seen.has(s)) return null;
    return { v, s, ok: false, why: c.why || 'comes from a slip in the working', tag: c.tag || 'slip' };
  };
  // reasoned wrong answers, split by side of the correct value
  const named = [];
  (cands || []).forEach(c => { const x = valid(c); if (x) { seen.add(x.s); named.push(x); } });
  const unit = Math.pow(10, -maxDp);
  let step = o.step || (intOnly ? Math.max(1, Math.round(Math.abs(correct) / 10)) : Math.max(unit, Math.abs(correct) / 10));
  if (!intOnly) step = Math.max(unit, Math.round(step / unit) * unit);
  const filler = side => {
    for (let t = 0; t < 80; t++) {
      const k = R.int(1, 3 + Math.floor(t / 8));
      const raw = correct + side * k * step;
      const x = valid({ v: intOnly ? Math.round(raw) : Math.round(raw / unit) * unit, why: 'comes from a slip in the working', tag: 'slip' });
      if (x) { seen.add(x.s); return x; }
    }
    return null;
  };
  let picked;
  if (o.sort === false) {
    picked = named.slice(0, n - 1);
    while (picked.length < n - 1) { const f = filler(R.chance(0.5) ? 1 : -1) || filler(1); if (!f) break; picked.push(f); }
  } else {
    // choose where the correct answer will sit (A–E evenly), then fill each side
    const below = named.filter(x => x.v < correct), above = named.filter(x => x.v > correct);
    const lo = Math.max(0, (n - 1) - above.length - 2), hi = Math.min(n - 1, below.length + 2);
    const rank = lo <= hi ? R.int(lo, hi) : R.int(0, n - 1);
    const take = (arr, k) => arr.slice(0, k);
    picked = take(below, rank).concat(take(above, n - 1 - rank));
    let need = n - 1 - picked.length;
    let side = picked.filter(x => x.v < correct).length < rank ? -1 : 1;
    while (need > 0) {
      const wantBelow = picked.filter(x => x.v < correct).length < rank;
      const f = filler(wantBelow ? -1 : 1) || filler(wantBelow ? 1 : -1);
      if (!f) break;
      picked.push(f); need--; side = -side;
    }
  }
  const list = [{ v: correct, s: cs, ok: true, why: null, tag: null }].concat(picked).slice(0, n);
  const out = o.sort === false ? R.shuffle(list) : list.slice().sort((a, b) => a.v - b.v);
  return {
    options: out.map(x => x.s),
    answer: out.findIndex(x => x.ok),
    whys: out.map(x => x.ok ? null : x.why),
    tags: out.map(x => x.ok ? null : x.tag),
    values: out.map(x => x.v),
  };
}

/* Text options where each wrong option carries its own reason. `order` can
   be 'shuffle' (default) or 'keep'. */
function textOpts(R, correct, wrongs, o) {
  o = o || {};
  const n = o.n || Math.min(5, wrongs.length + 1);
  const list = [{ s: correct, ok: true, why: null, tag: null }];
  const seen = new Set([correct]);
  wrongs.forEach(w => {
    if (list.length >= n) return;
    const s = typeof w === 'string' ? w : w.s;
    if (seen.has(s)) return;
    seen.add(s);
    list.push({ s, ok: false, why: (w && w.why) || 'does not fit all of the information', tag: (w && w.tag) || 'logic' });
  });
  const out = o.order === 'keep' ? list : R.shuffle(list);
  return { options: out.map(x => x.s), answer: out.findIndex(x => x.ok),
           whys: out.map(x => x.ok ? null : x.why), tags: out.map(x => x.ok ? null : x.tag) };
}

/* "Which statements are correct?" — the five standard combinations the real
   paper uses, always including the true combination. labels like ['X','Y','Z'] */
function statementOpts(R, truth, labels, n) {
  n = n || 5;
  labels = labels || ['X', 'Y', 'Z'];
  const describe = set => {
    if (!set.length) return 'none of them';
    if (set.length === labels.length) return 'statements ' + listAnd(set);
    return (set.length === 1 ? 'statement ' : 'statements ') + listAnd(set) + ' only';
  };
  const all = [];
  const k = labels.length;
  for (let mask = 0; mask < (1 << k); mask++) {
    const set = labels.filter((_, i) => mask & (1 << i));
    all.push({ mask, s: describe(set) });
  }
  const trueMask = truth.reduce((m, t, i) => m | (t ? 1 << i : 0), 0);
  const correct = all.find(a => a.mask === trueMask);
  const pool = R.shuffle(all.filter(a => a.mask !== trueMask));
  // near misses first: differ by one statement
  const bits = m => m.toString(2).split('').filter(c => c === '1').length;
  pool.sort((a, b) => bits(a.mask ^ trueMask) - bits(b.mask ^ trueMask));
  const chosen = [correct].concat(pool.slice(0, n - 1));
  chosen.sort((a, b) => bits(a.mask) - bits(b.mask) || a.mask - b.mask);
  return {
    options: chosen.map(c => cap(c.s)),
    answer: chosen.indexOf(correct),
    whys: chosen.map(c => c === correct ? null : 'gets at least one of the statements wrong'),
    tags: chosen.map(c => c === correct ? null : 'misread'),
  };
}

/* Explanations name the right value, then the most tempting wrong one. */
function explainWith(text, built, idx) {
  if (idx == null) {
    // the nearest wrong option that has a specific reason
    idx = built.whys.findIndex((w, i) => w && built.tags[i] !== 'slip');
  }
  if (idx == null || idx < 0) return text;
  return text + ' ' + built.options[idx] + ' ' + built.whys[idx] + '.';
}

function item(stem, built, explain, extra) {
  return Object.assign({ stem, options: built.options, answer: built.answer, whys: built.whys, tags: built.tags,
                         explain }, extra || {});
}

/* ==========================================================================
   SVG helpers. Everything is drawn in currentColor so it reads in both themes.
   ========================================================================== */
const SVG_ACCENT = 'style="fill:var(--harbour);fill-opacity:.32"';
const SVG_ACCENT2 = 'style="fill:var(--ochre);fill-opacity:.38"';
function svg(w, h, inner, label) {
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${(label || 'diagram').replace(/"/g, '')}" ` +
    `font-family="IBM Plex Sans, Arial, sans-serif" font-size="13" fill="none" stroke="currentColor" stroke-width="1.4">${inner}</svg>`;
}
function txt(x, y, s, o) {
  o = o || {};
  return `<text x="${x}" y="${y}" fill="currentColor" stroke="none" text-anchor="${o.anchor || 'middle'}"` +
    `${o.size ? ` font-size="${o.size}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''} dominant-baseline="middle">${s}</text>`;
}
function line(x1, y1, x2, y2, o) {
  o = o || {};
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${o.dash ? ' stroke-dasharray="4 3"' : ''}${o.w ? ` stroke-width="${o.w}"` : ''}${o.op ? ` stroke-opacity="${o.op}"` : ''}/>`;
}
function rect(x, y, w, h, o) {
  o = o || {};
  const fill = o.fill === 'a' ? SVG_ACCENT : o.fill === 'b' ? SVG_ACCENT2 : o.fill === 'ink' ? 'style="fill:currentColor;fill-opacity:.75"' : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${fill}${o.dash ? ' stroke-dasharray="4 3"' : ''}${o.noStroke ? ' stroke="none"' : ''}/>`;
}
function poly(pts, o) {
  o = o || {};
  const fill = o.fill === 'a' ? SVG_ACCENT : o.fill === 'b' ? SVG_ACCENT2 : o.fill === 'ink' ? 'style="fill:currentColor;fill-opacity:.75"' : '';
  return `<polygon points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" ${fill}/>`;
}
function circ(cx, cy, r, o) {
  o = o || {};
  const fill = o.fill === 'a' ? SVG_ACCENT : o.fill === 'b' ? SVG_ACCENT2 : o.fill === 'ink' ? 'style="fill:currentColor"' : '';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill}/>`;
}

/* A shape made of grid cells. cells: [[col,row],...]; marks: {key:'a'|'b'} */
function gridSvg(cols, rows, filled, o) {
  o = o || {};
  const c = o.cell || 26, pad = 6;
  let s = '';
  if (o.grid !== false) {
    for (let i = 0; i <= cols; i++) s += line(pad + i * c, pad, pad + i * c, pad + rows * c, { op: 0.22, w: 1 });
    for (let j = 0; j <= rows; j++) s += line(pad, pad + j * c, pad + cols * c, pad + j * c, { op: 0.22, w: 1 });
  }
  (filled || []).forEach(([x, y, f]) => { s += rect(pad + x * c, pad + y * c, c, c, { fill: f || 'a' }); });
  (o.extra || []).forEach(e => { s += e(pad, c); });
  return svg(cols * c + pad * 2, rows * c + pad * 2, s, o.label || 'grid');
}

/* Column graph. values: numbers; labels: strings */
function barChart(labels, values, o) {
  o = o || {};
  const W = o.w || 360, H = o.h || 220, L = 44, B = 36, T = 14, Rt = 10;
  const max = o.max || Math.max.apply(null, values);
  const step = o.step || niceStep(max);
  const top = Math.ceil(max / step) * step;
  const pw = W - L - Rt, ph = H - T - B;
  const bw = pw / labels.length * 0.56;
  let s = '';
  for (let v = 0; v <= top; v += step) {
    const y = T + ph - v / top * ph;
    s += line(L, y, W - Rt, y, { op: 0.18, w: 1 });
    s += txt(L - 6, y, num(v), { anchor: 'end', size: 11 });
  }
  s += line(L, T, L, T + ph) + line(L, T + ph, W - Rt, T + ph);
  labels.forEach((lb, i) => {
    const cx = L + pw / labels.length * (i + 0.5);
    const v = values[i];
    if (v != null) {
      const h = v / top * ph;
      s += rect(cx - bw / 2, T + ph - h, bw, h, { fill: 'a' });
    } else {
      s += txt(cx, T + ph - 12, '?', { size: 14, weight: 600 });
    }
    s += txt(cx, T + ph + 13, lb, { size: 11 });
  });
  if (o.xLabel) s += txt(L + pw / 2, H - 6, o.xLabel, { size: 11 });
  if (o.yLabel) s += `<text x="12" y="${T + ph / 2}" fill="currentColor" stroke="none" font-size="11" text-anchor="middle" transform="rotate(-90 12 ${T + ph / 2})">${o.yLabel}</text>`;
  return svg(W, H, s, o.label || 'column graph');
}
function niceStep(max) {
  const raw = max / 5;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/* Line graph with one or more series. xs labels, series: [{name, vals, dash}] */
function lineChart(xs, series, o) {
  o = o || {};
  const W = o.w || 380, H = o.h || 230, L = 44, B = 40, T = 14, Rt = 12;
  const all = [].concat.apply([], series.map(s => s.vals));
  const max = o.max || Math.max.apply(null, all), min = o.min != null ? o.min : 0;
  const step = o.step || niceStep(max - min);
  const top = Math.ceil(max / step) * step, bot = Math.floor(min / step) * step;
  const pw = W - L - Rt, ph = H - T - B;
  const X = i => L + (xs.length === 1 ? pw / 2 : i * pw / (xs.length - 1));
  const Y = v => T + ph - (v - bot) / (top - bot) * ph;
  let s = '';
  for (let v = bot; v <= top + 1e-9; v += step) {
    s += line(L, Y(v), W - Rt, Y(v), { op: 0.18, w: 1 }) + txt(L - 6, Y(v), num(round6(v)), { anchor: 'end', size: 11 });
  }
  s += line(L, T, L, T + ph) + line(L, T + ph, W - Rt, T + ph);
  xs.forEach((x, i) => { s += txt(X(i), T + ph + 13, x, { size: 10.5 }); });
  series.forEach((sr, k) => {
    const d = sr.vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    s += `<path d="${d}"${sr.dash ? ' stroke-dasharray="5 4"' : ''} stroke-width="2"/>`;
    sr.vals.forEach((v, i) => { s += k === 0 ? circ(X(i), Y(v), 3, { fill: 'ink' }) : `<rect x="${X(i) - 3}" y="${Y(v) - 3}" width="6" height="6" style="fill:currentColor"/>`; });
  });
  if (series.length > 1) {
    series.forEach((sr, k) => {
      const lx = L + 8 + k * 130, ly = H - 9;
      s += `<line x1="${lx}" y1="${ly}" x2="${lx + 22}" y2="${ly}" stroke-width="2"${sr.dash ? ' stroke-dasharray="5 4"' : ''}/>` + txt(lx + 28, ly, sr.name, { anchor: 'start', size: 11 });
    });
  }
  return svg(W, H, s, o.label || 'line graph');
}

/* Analogue clock face showing h:m */
function clockSvg(h, m, o) {
  o = o || {};
  const r = 70, cx = 80, cy = 80;
  let s = circ(cx, cy, r);
  for (let i = 1; i <= 12; i++) {
    const a = i * Math.PI / 6;
    s += txt(cx + Math.sin(a) * (r - 14), cy - Math.cos(a) * (r - 14), i, { size: 12 });
    s += line(cx + Math.sin(a) * (r - 4), cy - Math.cos(a) * (r - 4), cx + Math.sin(a) * r, cy - Math.cos(a) * r);
  }
  const ma = m * Math.PI / 30, ha = ((h % 12) + m / 60) * Math.PI / 6;
  s += line(cx, cy, cx + Math.sin(ha) * 38, cy - Math.cos(ha) * 38, { w: 3.2 });
  s += line(cx, cy, cx + Math.sin(ma) * 56, cy - Math.cos(ma) * 56, { w: 1.8 });
  s += circ(cx, cy, 3, { fill: 'ink' });
  return svg(160, 160, s, 'clock');
}

/* Isometric stack of unit cubes. heights[r][c] */
function cubeStackSvg(heights, o) {
  o = o || {};
  const u = o.u || 22;
  const rows = heights.length, cols = heights[0].length;
  const iso = (x, y, z) => [(x - y) * u * 0.866, (x + y) * u * 0.5 - z * u];
  const faces = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (let z = 0; z < heights[r][c]; z++) {
    faces.push({ d: r + c + z * 0.01, x: c, y: r, z });
  }
  faces.sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.z - b.z);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const polys = [];
  faces.forEach(({ x, y, z }) => {
    const top = [iso(x, y, z + 1), iso(x + 1, y, z + 1), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)];
    const left = [iso(x, y + 1, z + 1), iso(x + 1, y + 1, z + 1), iso(x + 1, y + 1, z), iso(x, y + 1, z)];
    const right = [iso(x + 1, y, z + 1), iso(x + 1, y + 1, z + 1), iso(x + 1, y + 1, z), iso(x + 1, y, z)];
    polys.push([top, 'a'], [left, 'b'], [right, null]);
    top.concat(left, right).forEach(([px, py]) => { minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); });
  });
  const ox = -minX + 6, oy = -minY + 6;
  const body = polys.map(([pts, f]) => {
    const fill = f === 'a' ? 'style="fill:var(--harbour);fill-opacity:.28"' : f === 'b' ? 'style="fill:var(--harbour);fill-opacity:.12"' : 'style="fill:var(--surface)"';
    return `<polygon points="${pts.map(p => (p[0] + ox).toFixed(1) + ',' + (p[1] + oy).toFixed(1)).join(' ')}" ${fill}/>`;
  }).join('');
  return svg(Math.ceil(maxX - minX + 12), Math.ceil(maxY - minY + 12), body, 'stack of cubes');
}

/* Simple labelled rectangle composite: list of rects in units, scale */
function shapeSvg(polys, labels, o) {
  o = o || {};
  const sc = o.scale || 14, pad = 34;
  let maxX = 0, maxY = 0;
  polys.forEach(p => p.pts.forEach(([x, y]) => { maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }));
  let s = '';
  polys.forEach(p => { s += poly(p.pts.map(([x, y]) => [pad + x * sc, pad + y * sc]), { fill: p.fill }); });
  (labels || []).forEach(l => { s += txt(pad + l[0] * sc, pad + l[1] * sc, l[2], { size: 12, anchor: l[3] || 'middle' }); });
  if (o.note) s += txt(pad + maxX * sc / 2, pad + maxY * sc + 24, o.note, { size: 10.5 });
  return svg(Math.ceil(maxX * sc + pad * 2), Math.ceil(maxY * sc + pad * 2 + (o.note ? 14 : 0)), s, o.label || 'shape');
}
