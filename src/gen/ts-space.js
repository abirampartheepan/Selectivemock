/* ==========================================================================
   Thinking Skills — spatial puzzles: cube nets, folded and punched paper,
   turning and reflecting patterns. Answers are computed, not drawn by hand.
   ========================================================================== */
'use strict';

/* ---- folding a net into a cube ---- */
function foldNet(cells) {
  // returns map cellKey -> normal "x,y,z" or null if the cells do not fold to a cube
  const key = (x, y) => x + ',' + y;
  const set = new Set(cells.map(c => key(c[0], c[1])));
  const neg = v => v.map(x => -x);
  const out = {};
  const start = cells[0];
  const stack = [[start, [0, 0, -1], [1, 0, 0], [0, 1, 0]]];
  out[key(start[0], start[1])] = [0, 0, -1];
  while (stack.length) {
    const [[x, y], n, e, s] = stack.pop();
    const moves = [[1, 0, e, neg(n), s, 'e'], [-1, 0, neg(e), n, s, 'w'], [0, 1, s, e, neg(n), 's'], [0, -1, neg(s), e, n, 'n']];
    for (const [dx, dy, nn, ne, ns, dir] of moves) {
      const k = key(x + dx, y + dy);
      if (!set.has(k) || out[k]) continue;
      let N2, E2, S2;
      if (dir === 'e') { N2 = e; E2 = neg(n); S2 = s; }
      else if (dir === 'w') { N2 = neg(e); E2 = n; S2 = s; }
      else if (dir === 's') { N2 = s; E2 = e; S2 = neg(n); }
      else { N2 = neg(s); E2 = e; S2 = n; }
      void nn; void ne; void ns;
      out[k] = N2;
      stack.push([[x + dx, y + dy], N2, E2, S2]);
    }
  }
  const normals = Object.values(out).map(v => v.join(','));
  if (normals.length !== 6 || new Set(normals).size !== 6) return null;
  return out;
}
function randomHexomino(R) {
  const set = new Set(['0,0']);
  while (set.size < 6) {
    const [x, y] = R.pick(Array.from(set)).split(',').map(Number);
    const [dx, dy] = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    set.add((x + dx) + ',' + (y + dy));
  }
  let cells = Array.from(set).map(s => s.split(',').map(Number));
  const mx = Math.min.apply(null, cells.map(c => c[0])), my = Math.min.apply(null, cells.map(c => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]);
}
defTS({ id: 'ts-cube-net', topic: 'cube nets', fam: 'Space and shape',
  gen(R, level) {
    let cells, fold;
    for (let t = 0; t < 500; t++) { cells = randomHexomino(R); fold = foldNet(cells); if (fold) break; }
    if (!fold) return this.gen(R, level);
    const symbols = byLevel(level, ['A', 'B', 'C', 'D', 'E', 'F'], ['P', 'Q', 'R', 'S', 'T', 'U'], ['●', '▲', '■', '★', '◆', '✚']);
    const labels = R.shuffle(symbols);
    const keyOf = c => c[0] + ',' + c[1];
    const lab = {}; cells.forEach((c, i) => { lab[keyOf(c)] = labels[i]; });
    const ask = R.pick(cells);
    const nv = fold[keyOf(ask)].map(x => -x).join(',');
    const opp = cells.find(c => fold[keyOf(c)].join(',') === nv);
    const ans = lab[keyOf(opp)];
    const adj = cells.filter(c => c !== ask && c !== opp).map(c => lab[keyOf(c)]);
    const built = textOpts(R, ans, R.sample(adj, 3).map(a => ({ s: a, why: 'shares an edge with it once the cube is folded', tag: 'spatial' })), { n: 4 });
    const c = 40, pad = 6;
    const W = Math.max.apply(null, cells.map(q => q[0])) + 1, H = Math.max.apply(null, cells.map(q => q[1])) + 1;
    let s = '';
    cells.forEach(([x, y]) => { s += rect(pad + x * c, pad + y * c, c, c, { fill: keyOf([x, y]) === keyOf(ask) ? 'a' : null }) + txt(pad + x * c + c / 2, pad + y * c + c / 2, lab[keyOf([x, y])], { size: 17, weight: 600 }); });
    return item(`This net is folded to make a cube. Which ${symbols[0] === 'A' || symbols[0] === 'P' ? 'letter' : 'symbol'} is on the face opposite ${lab[keyOf(ask)]}?`, built,
      `When the net folds, faces that touch along an edge become neighbours. ${ans} is the only face that never meets ${lab[keyOf(ask)]}, so it ends up opposite.`,
      { svg: svg(W * c + pad * 2, H * c + pad * 2, s, 'cube net') });
  } });

/* ---- fold, punch, unfold ---- */
function holesSvg(N, holes, o) {
  o = o || {};
  const c = o.cell || 18, pad = 4;
  let s = rect(pad, pad, N * c, N * c);
  for (let i = 1; i < N; i++) { s += line(pad + i * c, pad, pad + i * c, pad + N * c, { op: 0.12, w: 1 }) + line(pad, pad + i * c, pad + N * c, pad + i * c, { op: 0.12, w: 1 }); }
  holes.forEach(([x, y]) => { s += circ(pad + x * c + c / 2, pad + y * c + c / 2, c * 0.3, { fill: 'ink' }); });
  return svg(N * c + pad * 2, N * c + pad * 2, s, 'square of paper');
}
defTS({ id: 'ts-paper-punch', topic: 'folding and punching', fam: 'Space and shape',
  gen(R, level) {
    const N = byLevel(level, 4, 4, 8);
    const folds = byLevel(level, [R.pick(['v', 'h'])], ['v', 'h'], R.shuffle(['v', 'h', R.pick(['v', 'h'])]));
    // folded size
    let w = N, h = N;
    folds.forEach(f => { if (f === 'v') w /= 2; else h /= 2; });
    if (!isInt(w) || !isInt(h)) return this.gen(R, level);
    const nh = byLevel(level, 1, R.int(1, 2), R.int(2, 3));
    const punched = [];
    while (punched.length < nh) { const p = [R.int(0, w - 1), R.int(0, h - 1)]; if (!punched.some(q => q[0] === p[0] && q[1] === p[1])) punched.push(p); }
    // unfold in reverse: v fold folded the right half onto the left (region x < w); unfolding mirrors to x' = 2w-1-x
    const unfold = (holes, seq) => {
      let H = holes.slice(), cw = w, ch = h;
      seq.slice().reverse().forEach(f => {
        if (f === 'v') { H = H.concat(H.map(([x, y]) => [2 * cw - 1 - x, y])); cw *= 2; }
        else { H = H.concat(H.map(([x, y]) => [x, 2 * ch - 1 - y])); ch *= 2; }
      });
      return H;
    };
    const correct = unfold(punched, folds);
    const sig = H => H.map(p => p.join(',')).sort().join(';');
    const wrongs = [];
    // wrong 1: forget the last unfold
    let cw2 = w, ch2 = h;
    const partial = (() => { let H = punched.slice(); cw2 = w; ch2 = h; folds.slice(1).reverse().forEach(f => { if (f === 'v') { H = H.concat(H.map(([x, y]) => [2 * cw2 - 1 - x, y])); cw2 *= 2; } else { H = H.concat(H.map(([x, y]) => [x, 2 * ch2 - 1 - y])); ch2 *= 2; } }); return H; })();
    wrongs.push({ H: partial, why: 'misses the holes made through one of the folded layers', tag: 'spatial' });
    // wrong 2: shift instead of mirror
    const shifted = (() => { let H = punched.slice(), cw = w, ch = h; folds.slice().reverse().forEach(f => { if (f === 'v') { H = H.concat(H.map(([x, y]) => [x + cw, y])); cw *= 2; } else { H = H.concat(H.map(([x, y]) => [x, y + ch])); ch *= 2; } }); return H; })();
    wrongs.push({ H: shifted, why: 'copies the holes across instead of reflecting them', tag: 'spatial' });
    // wrong 3: reflect the whole correct pattern
    wrongs.push({ H: correct.map(([x, y]) => [y, x]), why: 'swaps the across and down positions', tag: 'spatial' });
    wrongs.push({ H: correct.map(([x, y]) => [x, N - 1 - y]).map(([x, y]) => [N - 1 - x, y]).concat([[0, 0]]), why: 'has an extra hole', tag: 'spatial' });
    const seen = new Set([sig(correct)]);
    const ws = wrongs.filter(x => { const k = sig(x.H); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
    if (ws.length < 3) return this.gen(R, level);
    const all = R.shuffle([{ H: correct, ok: true }].concat(ws));
    const desc = folds.map((f, i) => `${i === 0 ? 'First' : i === 1 ? 'Then' : 'Finally'} it is folded in half ${f === 'v' ? 'from right to left' : 'from bottom to top'}.`).join(' ');
    const folded = holesSvg(Math.max(w, h), punched.filter(() => true), { cell: 18 }).replace(/viewBox="0 0 (\d+) (\d+)"/, (m) => m);
    // draw the folded piece at its true shape
    const fc = 18, fp = 4;
    let fs = rect(fp, fp, w * fc, h * fc, { fill: 'a' });
    punched.forEach(([x, y]) => { fs += circ(fp + x * fc + fc / 2, fp + y * fc + fc / 2, fc * 0.3, { fill: 'ink' }); });
    void folded;
    return {
      stem: `A square piece of paper is folded. ${desc} Holes are then punched right through the folded paper, at the places shown on the shaded folded piece (its top-left corner is the top-left corner of the original square). Which picture shows the paper when it is unfolded?`,
      svg: svg(w * fc + fp * 2, h * fc + fp * 2, fs, 'folded paper with holes'),
      options: all.map((_, i) => 'option ' + LETTERS[i]),
      optionSvgs: all.map(x => holesSvg(N, x.H, { cell: N > 4 ? 13 : 20 })),
      answer: all.findIndex(x => x.ok),
      whys: all.map(x => x.ok ? null : x.why), tags: all.map(x => x.ok ? null : x.tag),
      explain: `Unfold one step at a time, in reverse order. Each unfold reflects every hole in the fold line, doubling the number of holes, so there are ${correct.length} holes in the end.`,
    };
  } });

/* ---- turning and reflecting a pattern ---- */
function patSvg(N, cells) {
  return gridSvg(N, N, cells.map(([x, y]) => [x, y, 'a']), { cell: 22 });
}
defTS({ id: 'ts-transform', topic: 'turning and reflecting', fam: 'Space and shape',
  gen(R, level) {
    const N = byLevel(level, 3, 4, 5);
    const k = byLevel(level, 3, 5, 7);
    const sig = cs => cs.map(c => c.join(',')).sort().join(';');
    const rot = cs => cs.map(([x, y]) => [N - 1 - y, x]);     // quarter turn clockwise
    const rotA = cs => cs.map(([x, y]) => [y, N - 1 - x]);    // anticlockwise
    const half = cs => rot(rot(cs));
    const flipH = cs => cs.map(([x, y]) => [N - 1 - x, y]);
    const flipV = cs => cs.map(([x, y]) => [x, N - 1 - y]);
    let cells;
    for (let t = 0; t < 200; t++) {
      const set = new Set(); while (set.size < k) set.add(R.int(0, N - 1) + ',' + R.int(0, N - 1));
      cells = Array.from(set).map(s => s.split(',').map(Number));
      const imgs = [cells, rot(cells), rotA(cells), half(cells), flipH(cells), flipV(cells)].map(sig);
      if (new Set(imgs).size === 6) break; cells = null;
    }
    if (!cells) return this.gen(R, level);
    const mode = R.pick(level === 'easy' ? ['cw', 'mirror'] : ['cw', 'acw', 'half', 'mirror', 'below']);
    const ops = { cw: rot, acw: rotA, half, mirror: flipH, below: flipH };
    const answer = ops[mode](cells);
    const pool = [
      { H: rot(cells), why: 'turns it clockwise', tag: 'spatial', m: 'cw' }, { H: rotA(cells), why: 'turns it anticlockwise', tag: 'spatial', m: 'acw' },
      { H: half(cells), why: 'gives a half turn', tag: 'spatial', m: 'half' }, { H: flipH(cells), why: 'reflects it left to right', tag: 'spatial', m: 'mirror' },
      { H: flipV(cells), why: 'reflects it top to bottom', tag: 'spatial', m: 'flipV' }, { H: cells, why: 'is the pattern unchanged', tag: 'spatial', m: 'same' },
    ].filter(p => sig(p.H) !== sig(answer));
    const ws = R.shuffle(pool).slice(0, 3);
    const all = R.shuffle([{ H: answer, ok: true }].concat(ws));
    const stems = {
      cw: 'The pattern is turned a quarter turn clockwise. Which picture shows the result?',
      acw: 'The pattern is turned a quarter turn anticlockwise. Which picture shows the result?',
      half: 'The pattern is turned upside down (a half turn). Which picture shows the result?',
      mirror: 'The pattern is held up to a mirror placed along its right-hand edge. Which picture shows its reflection?',
      below: 'The pattern is drawn on a glass table and seen from directly above. Which picture shows the same pattern seen from underneath the table?',
    };
    return {
      stem: stems[mode], svg: patSvg(N, cells),
      options: all.map((_, i) => 'option ' + LETTERS[i]), optionSvgs: all.map(x => patSvg(N, x.H)),
      answer: all.findIndex(x => x.ok), whys: all.map(x => x.ok ? null : x.why), tags: all.map(x => x.ok ? null : x.tag),
      explain: mode === 'below' ? 'Seen from underneath, left and right swap but top and bottom stay where they are, so the view is a left-to-right reflection.'
        : mode === 'mirror' ? 'A mirror on the right-hand edge swaps left and right and leaves top and bottom alone.'
        : `Follow one corner square: after a ${mode === 'half' ? 'half' : 'quarter'} turn${mode === 'half' ? '' : mode === 'cw' ? ' clockwise' : ' anticlockwise'} the top row becomes the ${mode === 'cw' ? 'right-hand column' : mode === 'acw' ? 'left-hand column' : 'bottom row, reversed'}.`,
    };
  } });

