/* End-to-end: full exam sitting, writing, review, notes, redo + mastery, backup round trip. */
const path = require('path'), fs = require('fs');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const shots = process.argv[2] || '/tmp/claude-0/shots2';
fs.mkdirSync(shots, { recursive: true });
const ok = (c, m) => { if (!c) { console.log('FAIL: ' + m); process.exitCode = 1; } else console.log('ok: ' + m); };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  const url = 'file://' + path.resolve(__dirname, '../../dist/index.html');
  await page.goto(url);
  await page.click('[data-act=openExam][data-id=E01]');
  await page.click('[data-act=startFull]');
  // reading, thinking, maths: answer everything with option A then finish
  for (const mod of ['Reading', 'Thinking Skills', 'Mathematical Reasoning']) {
    await page.waitForSelector('.qpane');
    const title = await page.textContent('.topbar .who b');
    ok(title === mod, `sitting ${mod} (saw ${title})`);
    for (let i = 0; i < 45; i++) {
      const o = await page.$$('.opt'); if (o.length) await o[(i * 3) % o.length].click();
      const n = await page.$('[data-act=next]'); if (!n) break; await n.click();
    }
    await page.click('[data-act=finish]');
    await page.waitForSelector('.scoreline');
    await page.screenshot({ path: `${shots}/res-${mod.split(' ')[0]}.png`, fullPage: true });
    ok(await page.$('[data-act=nextTest]') !== null || mod === 'Mathematical Reasoning', `next-test button after ${mod}`);
    const nx = await page.$('[data-act=nextTest]'); if (nx) await nx.click();
  }
  await page.waitForSelector('#essay');
  await page.fill('#essay', 'The best place I know is the back step of my grandmother’s house. In the morning the concrete is cold and the magpies are loud.');
  await page.click('[data-act=finishWriting]');
  await page.waitForSelector('.bandbtn');
  await page.click('[data-act=band][data-crit=ideas][data-band="3"]');
  await page.screenshot({ path: `${shots}/writing-result.png`, fullPage: true });
  // papers
  await page.click('[data-act=openExam]');
  await page.click('[data-act=go][data-view=papers]');
  const rows = await page.$$('table.papers tbody tr');
  ok(rows.length === 4, `My papers lists 4 attempts (saw ${rows.length})`);
  // review the reading attempt and write a note
  await page.click('table.papers tbody tr:nth-child(4) [data-act=review]');
  await page.waitForSelector('.scoreline');
  await page.click('[data-act=openAll]');
  const note = await page.$('textarea[data-note]');
  await note.fill('Re-read the question stem before choosing.');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${shots}/review-reading.png` });
  // reload and check the note persisted
  await page.reload();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('selective-practice-v3')));
  ok(Object.values(stored.notes).includes('Re-read the question stem before choosing.'), 'note saved across reload');
  ok(stored.attempts.find(a => a.module === 'writing').bands.ideas === 3, 'writing self-mark saved');
  ok(stored.attempts.find(a => a.module === 'writing').essay.includes('back step'), 'essay text saved');
  // mistakes notebook and redo
  await page.click('[data-act=go][data-view=mistakes]');
  await page.waitForSelector('.review');
  await page.screenshot({ path: `${shots}/mistakes.png` });
  await page.click('[data-act=redoMistakes]');
  await page.waitForSelector('.qpane');
  // answer correctly using the key from the paper object
  const n = await page.evaluate(() => S.paper.items.length);
  for (let i = 0; i < n; i++) {
    await page.evaluate(() => { const it = S.paper.items[S.cur]; S.responses[it.n] = it.answer; });
    const nb = await page.$('[data-act=next]'); if (nb) await nb.click(); else break;
  }
  await page.click('[data-act=finish]');
  await page.waitForSelector('.scoreline');
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('selective-practice-v3')));
  ok(Object.keys(st2.mastery).length >= 1, `redo recorded in mastery (${Object.keys(st2.mastery).length})`);
  // progress page
  await page.click('[data-act=go][data-view=papers]');
  await page.click('[data-act=go][data-view=progress]');
  await page.screenshot({ path: `${shots}/progress.png`, fullPage: true });
  // backup export / import round-trip in a fresh context
  await page.click('[data-act=go][data-view=backup]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=export]')]);
  const file = path.join(shots, 'backup.json'); await dl.saveAs(file);
  const ctx2 = await browser.newContext(); const p2 = await ctx2.newPage(); p2.on('dialog', d => d.accept());
  await p2.goto(url); await p2.click('[data-act=go][data-view=backup]');
  await p2.setInputFiles('input[type=file]', file);
  await p2.waitForTimeout(500);
  const st3 = await p2.evaluate(() => JSON.parse(localStorage.getItem('selective-practice-v3')));
  ok(st3.attempts.length === st2.attempts.length, `backup restored ${st3.attempts.length} attempts`);
  // mobile pass on player
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(url); await m.click('[data-act=tier][data-t=medium]'); await m.click('[data-act=openExam][data-id=M01]'); await m.click('[data-act=startTest][data-mod=reading]');
  await m.screenshot({ path: `${shots}/mobile-reading.png` });
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 392, `mobile reading has no sideways scroll (${sw})`);
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
