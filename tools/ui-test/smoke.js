/* Drives the built page in Chromium: home, exam page, sit a maths test, finish, review, notebook, progress. */
const path = require('path');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const out = process.argv[2] || '/tmp/claude-0/shots';
  require('fs').mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto('file://' + path.resolve(__dirname, '../../dist/index.html'));
  await page.waitForSelector('.examgrid');
  await page.screenshot({ path: out + '/01-home.png', fullPage: true });
  await page.click('[data-act=openExam][data-id=E01]');
  await page.screenshot({ path: out + '/02-exam.png', fullPage: true });
  await page.click('[data-act=startTest][data-mod=maths]');
  await page.waitForSelector('.qpane');
  await page.screenshot({ path: out + '/03-player.png' });
  // answer each question: pick option A for odd, B for even, move on
  for (let i = 0; i < 35; i++) {
    const opts = await page.$$('.opt');
    if (opts.length) await opts[i % opts.length].click();
    if (i === 3) await page.screenshot({ path: out + '/04-q4.png' });
    const next = await page.$('[data-act=next]');
    if (next) await next.click(); else break;
  }
  await page.click('[data-act=finish]');
  await page.waitForSelector('.scoreline');
  await page.screenshot({ path: out + '/05-results.png', fullPage: true });
  await page.click('[data-act=openAll]');
  await page.screenshot({ path: out + '/06-results-open.png', fullPage: false });
  await page.click('.crumbs [data-act=home]');
  await page.click('[data-act=go][data-view=mistakes]');
  await page.waitForSelector('.review');
  const first = await page.$('details[data-act=openMistake] summary');
  await first.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: out + '/07-mistakes.png', fullPage: true });
  await page.click('[data-act=go][data-view=progress]');
  await page.screenshot({ path: out + '/08-progress.png', fullPage: true });
  await page.click('[data-act=go][data-view=papers]');
  await page.screenshot({ path: out + '/09-papers.png', fullPage: true });
  await page.click('[data-act=go][data-view=drills]');
  await page.click('[data-act=drill]');
  await page.waitForSelector('.qpane');
  await page.screenshot({ path: out + '/10-drill.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('[data-act=leave]');
  await page.click('[data-act=go][data-view=home]').catch(() => {});
  await page.screenshot({ path: out + '/11-mobile-home.png', fullPage: false });
  console.log(errors.length ? errors.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
