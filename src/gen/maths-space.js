/* ==========================================================================
   Mathematical Reasoning — angles, symmetry, perimeter, area, volume, 3D
   ========================================================================== */
'use strict';

/* ---- angles: triangle / straight line / isosceles / around a point ---- */
defMaths({ id: 'm-angles', slot: 'angles', topic: 'angles', fam: 'Space and geometry',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(1, 2), R.int(2, 3));
    if (v === 0) {
      // straight line split into angles
      const a = R.int(25, 70), b = R.int(25, 70);
      const x = 180 - a - b;
      const W = 320, H = 150, cx = 160, cy = 120;
      const ang = [0, a, a + b, 180];
      let s = line(20, cy, 300, cy, { w: 2 });
      [a, a + b].forEach(t => { const r = t * Math.PI / 180; s += line(cx, cy, cx + Math.cos(Math.PI - r) * -120 * -1 * 1, cy - Math.sin(r) * 110); });
      // labels
      const mid = (t1, t2) => (t1 + t2) / 2 * Math.PI / 180;
      const lab = (t1, t2, str) => { const m = mid(t1, t2); return txt(cx + Math.cos(m) * 48, cy - Math.sin(m) * 40, str, { size: 13 }); };
      s = line(20, cy, 300, cy, { w: 2 });
      [a, a + b].forEach(t => { const r = t * Math.PI / 180; s += line(cx, cy, cx + Math.cos(r) * 120, cy - Math.sin(r) * 110); });
      s += lab(0, a, a + '°') + lab(a, a + b, b + '°') + lab(a + b, 180, 'x');
      const pic = svg(W, H, s, 'angles on a straight line');
      void ang;
      const built = numOpts(R, x, [
        { v: 360 - a - b, why: 'uses 360° instead of 180° for a straight line', tag: 'misread' },
        { v: 90 - Math.min(a, b), why: 'treats one angle as part of a right angle', tag: 'misread' },
        { v: a + b, why: 'adds the two marked angles', tag: 'operation' },
        { v: x + 10, why: 'is a slip of 10°', tag: 'slip' },
      ], { fmt: n => n + '°', min: 1 });
      return item(`Three angles meet on a straight line, as shown. What is the size of angle x?`, built,
        explainWith(`Angles on a straight line add to 180°, so x = 180° − ${a}° − ${b}° = ${x}°.`, built), { svg: pic });
    }
    if (v === 1) {
      // isosceles triangle with exterior angle
      const apex = R.int(20, 100) * 1;
      if (apex % 2) return this.gen(R, level);
      const base = (180 - apex) / 2;
      const ext = 180 - base;
      const built = numOpts(R, ext, [
        { v: base, why: 'gives the inside base angle', tag: 'part-only' },
        { v: 180 - apex, why: 'uses the top angle instead of the base angle', tag: 'misread' },
        { v: apex + base, why: 'adds the wrong two angles', tag: 'misread' },
        { v: 360 - ext, why: 'goes all the way round', tag: 'misread' },
      ], { fmt: n => n + '°', min: 1 });
      const pts = [[40, 150], [200, 150], [120, 150 - 80 / Math.tan(apex / 2 * Math.PI / 180)]];
      const top = Math.max(10, pts[2][1]);
      const s = poly([[40, 150], [200, 150], [120, top]]) + line(200, 150, 290, 150) +
        txt(120, top + 22, apex + '°', { size: 12 }) + txt(222, 138, 'y', { size: 14 }) +
        line(78, 146, 82, 154) + line(158, 146, 162, 154) + txt(150, 175, 'The two marked sides are equal.', { size: 11 });
      return item(`The triangle is isosceles: the two sloping sides are equal. The top angle is ${apex}°. One side is extended, as shown. What is the size of angle y?`, built,
        explainWith(`The two base angles are equal, so each is (180° − ${apex}°) ÷ 2 = ${base}°. Angle y is on a straight line with one of them: 180° − ${base}° = ${ext}°.`, built),
        { svg: svg(300, 185, s, 'isosceles triangle') });
    }
    if (v === 2) {
      // regular polygon interior angle / angle in a shape with symmetry
      const n = R.pick([5, 6, 8, 9, 10, 12]);
      const interior = 180 - 360 / n;
      const built = numOpts(R, interior, [
        { v: 360 / n, why: 'gives the exterior angle', tag: 'misread' },
        { v: 180 * n / n - 180 / n, why: 'divides 180° instead of 360°', tag: 'operation' },
        { v: 180 * (n - 2), why: 'gives the total of all the angles', tag: 'part-only' },
        { v: interior + 360 / n, why: 'adds the exterior angle', tag: 'slip' },
      ], { fmt: x => num(x) + '°', int: false, min: 1 });
      return item(`A regular polygon has ${n} equal sides and ${n} equal angles. What is the size of each inside angle?`, built,
        explainWith(`Walking round the shape turns through 360°, so each outside angle is 360° ÷ ${n} = ${num(360 / n)}°, and each inside angle is 180° − ${num(360 / n)}° = ${num(interior)}°.`, built));
    }
    // two parallel lines and a transversal plus triangle: hard
    const a = R.int(30, 75), b = R.int(30, 75);
    const c = 180 - a - b;
    if (c < 20) return this.gen(R, level);
    // kite shape: angles a, b, c, d in a quadrilateral with one line of symmetry
    const p = R.int(50, 130), q = R.int(40, 120);
    const other = (360 - p - q) / 2;
    if (!isInt(other) || other < 20 || other > 160) return this.gen(R, level);
    const built = numOpts(R, other, [
      { v: 360 - p - q, why: 'forgets that the remaining angle is shared by two equal angles', tag: 'part-only' },
      { v: (180 - p - q / 2), why: 'uses 180° for a four-sided shape', tag: 'misread' },
      { v: (360 - p) / 3, why: 'treats three angles as equal', tag: 'misread' },
      { v: other + 5, why: 'is a slip of 5°', tag: 'slip' },
    ], { fmt: n => num(n) + '°', int: false, min: 1 });
    const s = poly([[150, 20], [250, 110], [150, 190], [50, 110]]) + line(150, 10, 150, 200, { dash: true, op: 0.6 }) +
      txt(150, 44, p + '°', { size: 12 }) + txt(150, 168, q + '°', { size: 12 }) + txt(78, 110, 'P', { size: 14, weight: 600 }) + txt(222, 110, '?', { size: 14 });
    return item(`This shape has one line of symmetry, shown dashed. Two of its angles are ${p}° and ${q}°. What is the size of angle P?`, built,
      explainWith(`The angles of a four-sided shape add to 360°. The two side angles are equal by symmetry, so each is (360° − ${p}° − ${q}°) ÷ 2 = ${num(other)}°.`, built),
      { svg: svg(300, 210, s, 'kite') });
  } });

/* ---- symmetry: calculator digits / tiles to add ---- */
const SEG = { // seven-segment: a top, b top-right, c bottom-right, d bottom, e bottom-left, f top-left, g middle
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function segSymmetry(numStr) {
  // segments of a whole number drawn side by side; check vertical & horizontal mirror lines
  const segs = [];
  numStr.split('').forEach((ch, k) => SEG[ch].split('').forEach(s => segs.push([k, s])));
  const key = (k, s) => k + s;
  const set = new Set(segs.map(([k, s]) => key(k, s)));
  const n = numStr.length;
  const hMap = { a: 'd', d: 'a', b: 'c', c: 'b', e: 'f', f: 'e', g: 'g' };
  const vMap = { a: 'a', d: 'd', g: 'g', b: 'f', f: 'b', c: 'e', e: 'c' };
  const horiz = segs.every(([k, s]) => set.has(key(k, hMap[s])));
  const vert = segs.every(([k, s]) => set.has(key(n - 1 - k, vMap[s])));
  return (horiz ? 1 : 0) + (vert ? 1 : 0);
}
function segSvg(numStr) {
  const w = 30, h = 54, gap = 14, pad = 8;
  let s = '';
  numStr.split('').forEach((ch, k) => {
    const x = pad + k * (w + gap), y = pad;
    const P = { a: [[x, y], [x + w, y]], b: [[x + w, y], [x + w, y + h / 2]], c: [[x + w, y + h / 2], [x + w, y + h]], d: [[x, y + h], [x + w, y + h]],
      e: [[x, y + h / 2], [x, y + h]], f: [[x, y], [x, y + h / 2]], g: [[x, y + h / 2], [x + w, y + h / 2]] };
    SEG[ch].split('').forEach(sg => { const [[x1, y1], [x2, y2]] = P[sg]; s += line(x1, y1, x2, y2, { w: 4 }); });
  });
  return s;
}
defMaths({ id: 'm-symmetry', slot: 'symmetry', topic: 'symmetry', fam: 'Space and geometry',
  gen(R, level) {
    if (R.chance(0.55)) {
      const digits = byLevel(level, 2, 3, 3);
      const want = R.int(0, 2);
      const pool = [];
      for (let t = 0; t < 400 && pool.length < 60; t++) {
        let n = String(R.int(Math.pow(10, digits - 1), Math.pow(10, digits) - 1));
        pool.push([n, segSymmetry(n)]);
      }
      const uniq = pool.filter((p, i) => pool.findIndex(q => q[0] === p[0]) === i);
      const right = uniq.filter(p => p[1] === want);
      const wrong = uniq.filter(p => p[1] !== want);
      if (!right.length || wrong.length < 4) return this.gen(R, level);
      const ans = R.pick(right);
      const ws = [];
      R.shuffle(wrong).forEach(w => { if (ws.length < 4 && !ws.some(x => x[0] === w[0])) ws.push(w); });
      const all = [ans].concat(ws).sort((a, b) => Number(a[0]) - Number(b[0]));
      const built = { options: all.map(x => x[0]), answer: all.indexOf(ans),
        whys: all.map(x => x === ans ? null : `has ${x[1] === 0 ? 'no' : x[1] === 1 ? 'one' : 'two'} line${x[1] === 1 ? '' : 's'} of symmetry`), tags: all.map(x => x === ans ? null : 'spatial') };
      const ex = '8' .repeat(digits);
      const pic = svg(digits * 44 + 10, 72, segSvg(ex), 'calculator digits');
      const wd = ['no lines', 'exactly one line', 'exactly two lines'][want];
      return item(`'Calculator numbers' are written in the style of digits on a calculator, like the number ${ex} shown. A line of symmetry can run across the whole number, either up-and-down or side-to-side. Which of these numbers has ${wd} of symmetry when written as a calculator number?`,
        built, `${ans[0]} has ${wd} of symmetry. Check each number for a side-to-side line through the middle of every digit, and for an up-and-down line through the middle of the whole number.`, { svg: pic });
    }
    // add the fewest tiles to make a shape symmetric about a given line
    const cols = 6, rows = byLevel(level, 4, 5, 6);
    const mid = cols / 2; // vertical mirror between col 2 and 3
    const cells = new Set();
    const pairs = byLevel(level, R.int(1, 2), R.int(2, 4), R.int(3, 6)), lone = byLevel(level, R.int(2, 4), R.int(3, 6), R.int(4, 8));
    let guard = 0;
    while (cells.size < pairs * 2 && guard++ < 200) { const x = R.int(0, cols / 2 - 1), y = R.int(0, rows - 1); cells.add(x + ',' + y); cells.add((cols - 1 - x) + ',' + y); }
    guard = 0;
    while (cells.size < pairs * 2 + lone && guard++ < 400) { const x = R.int(0, cols - 1), y = R.int(0, rows - 1); if (!cells.has((cols - 1 - x) + ',' + y)) cells.add(x + ',' + y); }
    const arr = Array.from(cells).map(s => s.split(',').map(Number));
    const need = arr.filter(([x, y]) => !cells.has((cols - 1 - x) + ',' + y)).length;
    if (need < 2) return this.gen(R, level);
    const built = numOpts(R, need, [
      { v: arr.length, why: 'copies every tile instead of only the ones without a partner', tag: 'misread' },
      { v: cols * rows - arr.length, why: 'fills the whole grid', tag: 'misread' },
      { v: need - 1, why: 'misses one tile', tag: 'off-by-one' },
      { v: need + 1, why: 'counts one tile twice', tag: 'off-by-one' },
    ], { min: 1 });
    const pic = gridSvg(cols, rows, arr.map(([x, y]) => [x, y, 'a']), { cell: 28, label: 'tiles',
      extra: [(pad, c) => line(pad + mid * c, pad - 4, pad + mid * c, pad + rows * c + 4, { dash: true, w: 2 })] });
    return item(`Some square tiles are placed on a grid, as shown. What is the smallest number of tiles that must be added so that the pattern is symmetrical about the dashed line?`, built,
      explainWith(`Reflect each tile in the dashed line. ${need} of the tiles have no partner on the other side, so ${need} tiles must be added.`, built), { svg: pic });
  } });

/* ---- perimeter: cut square / L-shape with cut-outs ---- */
defMaths({ id: 'm-perimeter', slot: 'perimeter', topic: 'perimeter', fam: 'Space and geometry',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    if (v === 0) {
      const side = R.int(3, 12) * 4;
      const P = side * 4;
      const cuts = R.pick([[2, 2], [3, 3], [2, 4]]);
      const pw = side / cuts[0], ph = side / cuts[1];
      if (!isInt(pw) || !isInt(ph)) return this.gen(R, level);
      const ans = 2 * (pw + ph);
      const s = rect(10, 10, 180, 180) + range(1, cuts[0] - 1).map(i => line(10 + i * 180 / cuts[0], 10, 10 + i * 180 / cuts[0], 190)).join('') +
        range(1, cuts[1] - 1).map(i => line(10, 10 + i * 180 / cuts[1], 190, 10 + i * 180 / cuts[1])).join('') + txt(100, 208, `perimeter = ${P} cm`, { size: 12 });
      const built = numOpts(R, ans, [
        { v: P / (cuts[0] * cuts[1]), why: 'divides the perimeter by the number of pieces', tag: 'operation' },
        { v: side, why: 'gives the side of the big square', tag: 'misread' },
        { v: pw * ph, why: 'gives the area of a piece', tag: 'misread' },
        { v: P / 2, why: 'halves the perimeter', tag: 'operation' },
      ], { fmt: x => x + ' cm', min: 1 });
      return item(`The perimeter of a square is ${P} cm. It is cut into ${cuts[0] * cuts[1]} equal rectangles, as shown. What is the perimeter of one of the rectangles?`, built,
        explainWith(`Each side of the square is ${side} cm, so each piece is ${pw} cm by ${ph} cm, with perimeter 2 × (${pw} + ${ph}) = ${ans} cm.`, built), { svg: svg(200, 218, s, 'square cut into rectangles') });
    }
    if (v === 1) {
      // rectangle with notches cut from edges
      const W = R.int(10, 15), H = R.int(6, 11);
      const nw = R.int(2, 3), nh = R.int(2, 3);
      // notch 1 from the top edge, notch 2 from the right edge; each adds 2*depth
      const ans = 2 * (W + H) + 4 * nh;
      const pts = [[0, 0], [3, 0], [3, nh], [3 + nw, nh], [3 + nw, 0], [W, 0], [W, 2], [W - nh, 2], [W - nh, 2 + nw], [W, 2 + nw], [W, H], [0, H]];
      const pic = shapeSvg([{ pts, fill: 'a' }], [[W / 2, H + 1.2, W + ' m'], [-1.4, H / 2, H + ' m'], [3 + nw / 2, nh + 0.9, nw + ' m'], [3 + nw + 0.9, nh / 2, nh + ' m', 'start'], [W - nh / 2, 2 + nw + 0.9, nh + ' m'], [W - nh - 0.4, 2 + nw / 2, nw + ' m', 'end']], { scale: 18, note: 'diagram not to scale' });
      const built = numOpts(R, ans, [
        { v: 2 * (W + H), why: 'ignores the extra edges made by the cut-outs', tag: 'part-only' },
        { v: 2 * (W + H) + 2 * nh, why: 'counts the extra edges for only one cut-out', tag: 'part-only' },
        { v: 2 * (W + H) + 2 * nh + 2 * nw, why: 'adds the cut-out widths as well', tag: 'slip' },
        { v: W * H - 2 * nw * nh, why: 'works out the area instead', tag: 'misread' },
        { v: 2 * (W + H) - nw - nh, why: 'subtracts the cut-out widths', tag: 'reversed' },
      ], { fmt: x => x + ' m', min: 1 });
      return item(`Two rectangles are cut out of the edges of a rectangular playground to make room for garden beds. The shaded shape is the playground that is left. What is the perimeter of the shaded shape?`, built,
        explainWith(`Pushing the edges of each cut-out back out gives the full rectangle, with perimeter 2 × (${W} + ${H}) = ${2 * (W + H)} m. Each cut-out also adds two sides of ${nh} m, so the perimeter is ${2 * (W + H)} + 4 × ${nh} = ${ans} m.`, built), { svg: pic });
    }
    // squares arranged in a row with overlaps: perimeter of a staircase
    const n = R.int(3, 6), s = R.int(2, 6);
    const ans = 4 * n * s; // staircase made of n squares each side s placed diagonally touching edges -> perimeter equals 4*n*s? Use stair: rows of 1..n squares
    const stair = n * s * 4;
    const pts = [[0, 0]];
    for (let i = 0; i < n; i++) { pts.push([(i + 1) * s, i * s]); pts.push([(i + 1) * s, (i + 1) * s]); }
    pts.push([0, n * s]);
    const built = numOpts(R, stair, [
      { v: n * s * 2 + 2 * s, why: 'counts only the outside edges of the bottom row and one column', tag: 'part-only' },
      { v: s * s * n * (n + 1) / 2, why: 'works out the area', tag: 'misread' },
      { v: 4 * s * n * (n + 1) / 2, why: 'adds the perimeters of all the squares', tag: 'misread' },
      { v: stair - 2 * s, why: 'misses two edges', tag: 'slip' },
    ], { fmt: x => x + ' cm', min: 1 });
    void ans;
    const pic = shapeSvg([{ pts, fill: 'a' }], [[n * s / 2, n * s + 1, `${n * s} cm`], [-1.3, n * s / 2, `${n * s} cm`]], { scale: Math.max(6, Math.floor(160 / (n * s))) });
    return item(`This staircase shape is made of squares of side ${s} cm. It is ${n} steps high and ${n} steps wide. What is its perimeter?`, built,
      explainWith(`Every step's top and side edges can be pushed out to make a ${n * s} cm by ${n * s} cm square, so the perimeter is 4 × ${n * s} = ${stair} cm.`, built), { svg: pic });
  } });

/* ---- area: rectangles in a design / shaded square ---- */
defMaths({ id: 'm-area', slot: 'area', topic: 'area', fam: 'Space and geometry',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    if (v === 0) {
      // pinwheel: four rectangles around a square
      const w = R.int(2, 6), l = w + R.int(2, 7);
      const areaR = w * l;
      const sq = (l - w) * (l - w);
      const s = l + w, sc = 200 / s, o = 8;
      const rects = [[0, 0, l, w], [l, 0, w, l], [w, l, l, w], [0, w, w, l]];
      let body = rects.map(([x, y, ww, hh]) => rect(o + x * sc, o + y * sc, ww * sc, hh * sc)).join('');
      body += rect(o + w * sc, o + w * sc, (l - w) * sc, (l - w) * sc, { fill: 'a' });
      const built = numOpts(R, sq, [
        { v: (l + w) * (l + w), why: 'gives the area of the whole design', tag: 'misread' },
        { v: w * w, why: 'uses the width of a rectangle as the side of the square', tag: 'misread' },
        { v: (l + w) * (l + w) - 4 * areaR + w, why: 'is a slip in the subtraction', tag: 'slip' },
        { v: l * l, why: 'uses the length of a rectangle as the side of the square', tag: 'misread' },
        { v: l - w, why: 'gives the side of the square, not its area', tag: 'part-only' },
      ], { fmt: x => x + ' cm²', min: 1 });
      return item(`The design is made of four identical white rectangles around a shaded square. Each rectangle is ${w} cm wide and has an area of ${areaR} cm². What is the area of the shaded square?`, built,
        explainWith(`Each rectangle is ${areaR} ÷ ${w} = ${l} cm long. The square's side is the length minus the width: ${l} − ${w} = ${l - w} cm, so its area is ${sq} cm².`, built), { svg: svg(216, 216, body, 'pinwheel design') });
    }
    if (v === 1) {
      // compare shapes on a grid: area & perimeter statements
      const mk = () => { const set = new Set(['0,0']); const k = R.int(5, 9); while (set.size < k) { const [x, y] = R.pick(Array.from(set)).split(',').map(Number); const d = R.pick([[1, 0], [0, 1], [-1, 0], [0, -1]]); const nx = x + d[0], ny = y + d[1]; if (nx >= 0 && ny >= 0 && nx < 5 && ny < 4) set.add(nx + ',' + ny); } return Array.from(set).map(s => s.split(',').map(Number)); };
      const per = cells => { const set = new Set(cells.map(c => c.join(','))); let p = 0; cells.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!set.has((x + dx) + ',' + (y + dy))) p++; })); return p; };
      const X = mk(), Y = mk();
      const aX = X.length, aY = Y.length, pX = per(X), pY = per(Y);
      const st = [{ t: 'Shape X has a larger perimeter than shape Y.', v: pX > pY }, { t: 'Shapes X and Y have the same perimeter.', v: pX === pY },
        { t: 'Shape X has a larger area than shape Y.', v: aX > aY }];
      const built = statementOpts(R, st.map(s => s.v), ['1', '2', '3']);
      const pic = gridSvg(12, 4, X.map(([x, y]) => [x, y, 'a']).concat(Y.map(([x, y]) => [x + 7, y, 'b'])), { cell: 24,
        extra: [(pad, c) => txt(pad + 2.5 * c, pad + 4 * c + 12, 'X', { weight: 600 }), (pad, c) => txt(pad + 9.5 * c, pad + 4 * c + 12, 'Y', { weight: 600 })] });
      return item(`The shapes X and Y are drawn on a square grid. Which of the following statements is/are correct?<br>1&nbsp; ${st[0].t}<br>2&nbsp; ${st[1].t}<br>3&nbsp; ${st[2].t}`,
        built, `X has area ${aX} squares and perimeter ${pX} units; Y has area ${aY} squares and perimeter ${pY} units.`, { svg: pic.replace(/height="[^"]*"/, '') });
    }
    // area of a triangle inside a rectangle (shaded region)
    const W = R.int(6, 14) * 2, H = R.int(4, 10) * 2;
    const px = R.int(1, W - 1);
    const area = W * H / 2;
    const built = numOpts(R, area, [
      { v: W * H, why: 'gives the area of the whole rectangle', tag: 'misread' },
      { v: px * H / 2, why: 'uses only part of the base', tag: 'part-only' },
      { v: (W + H) * 2, why: 'works out the perimeter', tag: 'misread' },
      { v: W * H / 4, why: 'halves the area twice', tag: 'operation' },
    ], { fmt: x => x + ' cm²', min: 1 });
    const sc = 220 / W;
    const s = rect(10, 10, W * sc, H * sc) + poly([[10, 10 + H * sc], [10 + W * sc, 10 + H * sc], [10 + px * sc, 10]], { fill: 'a' }) +
      txt(10 + W * sc / 2, 24 + H * sc, `${W} cm`, { size: 12 }) + txt(W * sc + 30, 10 + H * sc / 2, `${H} cm`, { size: 12 });
    return item(`A triangle is drawn inside a ${W} cm by ${H} cm rectangle, as shown. Its top corner touches the top edge of the rectangle. What is the area of the shaded triangle?`, built,
      explainWith(`The triangle has base ${W} cm and height ${H} cm, so its area is ${W} × ${H} ÷ 2 = ${area} cm², wherever the top corner sits.`, built), { svg: svg(W * sc + 60, H * sc + 40, s, 'triangle in rectangle') });
  } });

/* ---- volume: cylinders, boxes, cubes in a box ---- */
defMaths({ id: 'm-volume', slot: 'volume', topic: 'volume', fam: 'Space and geometry',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    if (v === 0) {
      const l = R.int(3, 9), w = R.int(2, 6), h = R.int(2, 8);
      const c = R.pick([1, 2]);
      const L = l * c, W = w * c, H = h * c;
      const ans = l * w * h;
      const built = numOpts(R, ans, [
        { v: L * W * H, why: `ignores that each cube has side ${c} cm`, tag: 'units' },
        { v: l * w + w * h + l * h, why: 'adds the face areas', tag: 'misread' },
        { v: l * w, why: 'counts only one layer', tag: 'part-only' },
        { v: 2 * (l * w + w * h + l * h), why: 'works out the surface area', tag: 'misread' },
      ], { min: 1 });
      return item(`A box measures ${L} cm long, ${W} cm wide and ${H} cm high on the inside. How many cubes of side ${c} cm fit exactly inside it?`, built,
        explainWith(`Along each edge fit ${l}, ${w} and ${h} cubes, so ${l} × ${w} × ${h} = ${ans} cubes.`, built));
    }
    if (v === 1) {
      // equal volume, different base
      const r1 = R.pick([2, 3, 4, 6]), h1 = R.int(2, 8) * 2;
      const k = R.pick([2, 3]);
      const r2 = r1 * (R.chance(0.5) ? k : 1), r1b = r2 === r1 ? r1 * k : r1;
      const hA = h1, rA = r1b, rB = r2;
      const hB = hA * rA * rA / (rB * rB);
      if (!isInt(hB)) return this.gen(R, level);
      const built = numOpts(R, hB, [
        { v: hA * rA / rB, why: 'scales by the radius instead of the radius squared', tag: 'operation' },
        { v: hA, why: 'assumes the heights are the same', tag: 'misread' },
        { v: hA * rB / rA, why: 'scales the wrong way', tag: 'reversed' },
        { v: hA * rB * rB / (rA * rA), why: 'scales by the square the wrong way', tag: 'reversed' },
      ], { fmt: x => num(x) + ' cm', int: false, min: 0.5 });
      return item(`Cylinders J and K have the same volume. Cylinder J has radius ${rA} cm and height ${hA} cm. Cylinder K has radius ${rB} cm. What is the height of cylinder K?`, built,
        explainWith(`Volume depends on radius × radius × height. ${rA} × ${rA} × ${hA} = ${rB} × ${rB} × h, so h = ${num(hB)} cm.`, built));
    }
    // water poured between containers
    const a = R.int(10, 20), b = R.int(8, 15), h = R.int(10, 30);
    const fill = R.int(4, h - 2);
    const vol = a * b * fill;
    const A2 = R.int(6, 12), B2 = R.int(5, 10);
    const newH = vol / (A2 * B2);
    if (!isInt(newH * 10) || newH > 60) return this.gen(R, level);
    const built = numOpts(R, newH, [
      { v: fill, why: 'assumes the water stays at the same height', tag: 'misread' },
      { v: round6(vol / (A2 * B2 * 10)), why: 'is ten times too small', tag: 'place' },
      { v: round6(vol / (A2 + B2) / 10), why: 'divides by the sum of the sides', tag: 'operation' },
      { v: round6(newH + fill), why: 'adds the old height', tag: 'slip' },
    ], { fmt: x => num(x) + ' cm', int: false, min: 0.1 });
    return item(`A rectangular tank ${a} cm long and ${b} cm wide holds water to a depth of ${fill} cm. All the water is poured into an empty tank with a base ${A2} cm by ${B2} cm. How deep is the water in the second tank?`, built,
      explainWith(`Volume of water: ${a} × ${b} × ${fill} = ${num(vol)} cm³. Depth in the second tank: ${num(vol)} ÷ (${A2} × ${B2}) = ${num(newH)} cm.`, built));
  } });

/* ---- 3D: hidden cubes, painted faces, stacks ---- */
defMaths({ id: 'm-solid-3d', slot: 'solid-3d', topic: '3D shapes', fam: 'Space and geometry',
  gen(R, level) {
    const v = byLevel(level, R.int(0, 1), R.int(0, 2), R.int(1, 2));
    if (v === 0) {
      // count cubes in a stack drawing
      const rows = R.int(2, 3), cols = R.int(2, 4);
      const hts = range(1, rows).map(() => range(1, cols).map(() => R.int(1, byLevel(level, 3, 3, 4))));
      // make heights non-increasing to the back so all are visible enough
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (r > 0) hts[r][c] = Math.min(hts[r][c], hts[r - 1][c]);
        if (c > 0) hts[r][c] = Math.min(hts[r][c], hts[r][c - 1]);
      }
      const n = sum(hts.map(r => sum(r)));
      const visibleTop = rows * cols;
      const pic = cubeStackSvg(hts.slice().reverse().map(r => r.slice().reverse()));
      const built = numOpts(R, n, [
        { v: visibleTop, why: 'counts only the top layer', tag: 'part-only' },
        { v: n - 1, why: 'misses one hidden cube', tag: 'off-by-one' },
        { v: n + rows, why: 'counts some cubes twice', tag: 'slip' },
        { v: Math.max.apply(null, hts.map(r => Math.max.apply(null, r))) * rows * cols, why: 'assumes the whole block is full', tag: 'spatial' },
      ], { min: 1 });
      return item(`A solid is built from identical cubes, as shown. No cubes are hidden except those directly under other cubes, and every cube rests on the table or on another cube. How many cubes are in the solid?`, built,
        explainWith(`Count each column of cubes: ${hts.map(r => r.join(' + ')).join(' + ')} = ${n}.`, built), { svg: pic });
    }
    if (v === 1) {
      // big cube of n^3: hidden cubes / painted faces
      const n = byLevel(level, R.int(3, 4), R.int(3, 5), R.int(4, 6));
      const q = R.int(0, 2);
      const hidden = Math.pow(n - 2, 3), oneFace = 6 * Math.pow(n - 2, 2), twoFace = 12 * (n - 2);
      const [ans, ask] = q === 0 ? [hidden, 'cannot be seen from any direction'] : q === 1 ? [oneFace, 'have paint on exactly one face'] : [twoFace, 'have paint on exactly two faces'];
      const built = numOpts(R, ans, [
        { v: hidden, why: 'counts the cubes completely inside', tag: 'spatial' },
        { v: oneFace, why: 'counts the cubes with one painted face', tag: 'spatial' },
        { v: twoFace, why: 'counts the cubes along the edges', tag: 'spatial' },
        { v: 8, why: 'counts the corner cubes', tag: 'spatial' },
        { v: Math.pow(n - 1, 3), why: 'takes off only one layer', tag: 'part-only' },
        { v: Math.pow(n, 3) - Math.pow(n - 2, 3), why: 'counts all the cubes on the outside', tag: 'misread' },
      ], { min: 0 });
      return item(`A large cube is made from ${Math.pow(n, 3)} identical small cubes (${n} along each edge). ${q === 0 ? 'The large cube can be picked up and looked at from every direction.' : 'The outside of the large cube is painted.'} How many of the small cubes ${ask}?`, built,
        explainWith(q === 0 ? `Only the cubes not on any face are hidden: a ${n - 2} × ${n - 2} × ${n - 2} block, ${hidden} cubes.` : q === 1 ? `Each face has a ${n - 2} × ${n - 2} middle, and there are 6 faces: ${oneFace}.` : `Each of the 12 edges has ${n - 2} cubes that are not corners: ${twoFace}.`, built));
    }
    // faces/edges/vertices of prisms & pyramids
    const sides = R.int(3, 10);
    const prism = R.chance(0.5);
    const F = prism ? sides + 2 : sides + 1, E = prism ? 3 * sides : 2 * sides, V = prism ? 2 * sides : sides + 1;
    const ask = R.pick([['edges', E], ['vertices (corners)', V], ['faces', F]]);
    const total = R.chance(0.5);
    const ans = total ? F + E + V : ask[1];
    const built = numOpts(R, ans, [
      { v: total ? F + E + V - 2 : (prism ? (ask[0] === 'edges' ? 2 * sides : ask[0] === 'faces' ? sides : sides) : (ask[0] === 'edges' ? sides : ask[0] === 'faces' ? sides : sides)), why: 'forgets some of the edges, faces or corners', tag: 'spatial' },
      { v: total ? F + E + V + 2 : ask[1] + 1, why: 'counts one too many', tag: 'off-by-one' },
      { v: total ? 2 * (F + V) : (prism ? (sides + 1) * 2 : sides * 2 + 2), why: 'mixes up a prism and a pyramid', tag: 'spatial' },
      { v: total ? E + V : ask[1] - 1, why: total ? 'leaves out the faces' : 'misses one', tag: 'part-only' },
    ], { min: 1 });
    const shape = prism ? `prism whose two ends are ${sides}-sided polygons` : `pyramid whose base is a ${sides}-sided polygon`;
    return item(total ? `A ${shape}. What is the total number of faces, edges and vertices (corners) it has?`.replace(/^A /, 'A solid is a ') : `A solid is a ${shape}. How many ${ask[0]} does it have?`, built,
      explainWith(`It has ${F} faces, ${E} edges and ${V} vertices.`, built));
  } });

/* ---- composite geometry: squares in a rectangle, overlapping shapes ---- */
defMaths({ id: 'm-composite-geo', slot: 'composite-geo', topic: 'composite shapes', fam: 'Space and geometry',
  gen(R, level) {
    if (R.chance(0.5)) {
      // overlap of two rectangles: total area covered
      const a = R.int(5, 12), b = R.int(4, 9), c = R.int(4, 11), d = R.int(3, 8);
      const ox = R.int(1, Math.min(a, c) - 1), oy = R.int(1, Math.min(b, d) - 1);
      const covered = a * b + c * d - ox * oy;
      const built = numOpts(R, covered, [
        { v: a * b + c * d, why: 'counts the overlap twice', tag: 'part-only' },
        { v: a * b + c * d - 2 * ox * oy, why: 'takes the overlap away twice', tag: 'operation' },
        { v: ox * oy, why: 'gives only the overlap', tag: 'misread' },
        { v: a * b + c * d - ox - oy, why: 'subtracts the overlap sides instead of its area', tag: 'misread' },
      ], { fmt: x => x + ' cm²', min: 1 });
      const sc = 12, x2 = a - ox, y2 = b - oy;
      const s = rect(10, 10, a * sc, b * sc, { fill: 'a' }) + rect(10 + x2 * sc, 10 + y2 * sc, c * sc, d * sc, { fill: 'b' });
      return item(`A ${a} cm by ${b} cm rectangle and a ${c} cm by ${d} cm rectangle overlap, as shown. The overlap is a ${ox} cm by ${oy} cm rectangle. What is the total area covered by the two rectangles?`, built,
        explainWith(`${a * b} + ${c * d} counts the overlap twice, so subtract it once: ${a * b + c * d} − ${ox * oy} = ${covered} cm².`, built), { svg: svg((x2 + c) * sc + 20, (y2 + d) * sc + 20, s, 'overlapping rectangles') });
    }
    // rectangle made of squares of different sizes (sides given relationally)
    const s1 = R.int(2, 6), s2 = s1 * 2;
    const W = s2 + s1 * 2, H = s2;
    const P = 2 * (W + H);
    const built = numOpts(R, P, [
      { v: W * H, why: 'gives the area', tag: 'misread' },
      { v: 4 * s2 + 8 * s1, why: 'adds the perimeters of all the squares', tag: 'misread' },
      { v: 2 * (s2 + s1), why: 'uses only one small square', tag: 'part-only' },
      { v: P - 2 * s1, why: 'misses an edge', tag: 'slip' },
    ], { fmt: x => x + ' cm', min: 1 });
    const sc = 160 / W;
    const s = rect(10, 10, s2 * sc, s2 * sc, { fill: 'a' }) +
      [[s2, 0], [s2 + s1, 0], [s2, s1], [s2 + s1, s1]].map(([x, y]) => rect(10 + x * sc, 10 + y * sc, s1 * sc, s1 * sc)).join('');
    return item(`A rectangle is made from one large square and four identical small squares, as shown. Each small square has a perimeter of ${4 * s1} cm. What is the perimeter of the rectangle?`, built,
      explainWith(`A small square has side ${s1} cm, so the large square has side ${s2} cm. The rectangle is ${W} cm by ${H} cm, so its perimeter is ${P} cm.`, built), { svg: svg(W * sc + 20, H * sc + 20, s, 'rectangle of squares') });
  } });

/* ---- positions along a line / compass directions ---- */
defMaths({ id: 'm-positions', slot: 'positions', topic: 'distance and position', fam: 'Space and geometry',
  gen(R, level) {
    const ppl = names(R, 5);
    // positions along a road, increasing
    const step = byLevel(level, 50, 25, 10);
    let pos;
    for (let t = 0; t < 200; t++) {
      const p = [0]; for (let i = 1; i < 5; i++) p.push(p[i - 1] + step * R.int(2, 8));
      // need Gina = 3 * (Heng - Gina) structure: p1 such that p1 - p0 = 3 (p2 - p1) for hard/medium
      pos = p;
      if (level === 'easy') break;
      const g = (3 * p[2]) / 4; if (isInt(g / step) && g > 0) { pos = [0, g, p[2], p[2] + (p[2] - g), p[4] < p[2] + (p[2] - g) + step ? p[2] + (p[2] - g) + step * 3 : p[4]]; break; }
    }
    pos = pos.map(round6);
    if (pos.some((x, i) => i && x <= pos[i - 1])) return this.gen(R, level);
    const [F, G, H, J, K] = ppl;
    const ans = pos[4] - pos[3];
    let clues;
    if (level === 'easy') clues = [`${F} lives ${pos[2]} m from ${H} and ${pos[4]} m from ${K}.`, `${G} lives ${pos[1]} m from ${F}.`, `${J} lives ${pos[3] - pos[2]} m from ${H}.`];
    else clues = [`${F} lives ${pos[2]} m from ${H} and ${pos[4]} m from ${K}.`, `${G} lives three times as far from ${F} as from ${H}.`, `${G} and ${J} live equal distances from ${H}.`];
    const built = numOpts(R, ans, [
      { v: pos[4] - pos[2], why: `gives the distance from ${H} to ${K}`, tag: 'misread' },
      { v: pos[4] - pos[1] * 2, why: 'places one of the houses on the wrong side', tag: 'reversed' },
      { v: pos[3], why: `gives the distance from ${F} to ${J}`, tag: 'misread' },
      { v: ans + step * 2, why: 'is a slip in one of the distances', tag: 'slip' },
    ], { fmt: x => num(x) + ' m', min: 1, step });
    return item(`Five friends live in houses on a long straight road, in this order:<br><b>${ppl.join(', ')}</b><br>${clues.join(' ')}<br>How far does ${J} live from ${K}?`, built,
      explainWith(`Measuring from ${F}: ${G} is at ${pos[1]} m, ${H} at ${pos[2]} m, ${J} at ${pos[3]} m and ${K} at ${pos[4]} m. So ${J} is ${ans} m from ${K}.`, built));
  } });
