// Production smoke test (Playwright): render, export WAV+MP3, share round-trip, broken link, phone gate.
//   npm run build && npx vite preview --port 4180 &   then   node scripts/qa.cjs <out-dir> [url]
const { chromium, devices } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.argv[3] || 'http://localhost:4180';
const dir = process.argv[2];
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  // ---------- desktop ----------
  const ctx = await b.newContext({ ...{},  viewport: { width: 1400, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  ctx.setDefaultTimeout(120000);
  const p = await ctx.newPage();
  const errs = [], failed = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 150)));
  p.on('response', r => r.status() >= 400 && failed.push(r.status() + ' ' + r.url()));
  p.on('requestfailed', r => failed.push('failed ' + r.url()));
  const dls = []; p.on('download', async d => { const f = dir + '/qa-' + d.suggestedFilename(); await d.saveAs(f); dls.push(f); });
  await p.goto(URL); await p.waitForTimeout(8000);
  ok('synth canvas rendered', await p.locator('canvas').count() > 0);
  await p.screenshot({ path: dir + '/qa_desktop.png' });
  await p.mouse.click(533, 466); await p.mouse.click(376, 585);            // SNARE pad, step 3
  await p.keyboard.press('n'); await p.keyboard.down('a'); await p.waitForTimeout(150); await p.keyboard.up('a');
  await p.mouse.move(887, 245); await p.mouse.down(); await p.mouse.move(887, 215, { steps: 5 }); await p.mouse.up();
  await p.keyboard.press(' '); await p.waitForTimeout(2500); await p.keyboard.press(' ');
  ok('no page errors after interaction', errs.length === 0, errs.join(' | '));
  for (const label of ['WAV', 'MP3']) {
    await p.getByRole('button', { name: 'Export', exact: true }).click(); await p.waitForTimeout(7000);
    await p.getByRole('dialog').getByText(new RegExp(label)).click();
    await p.getByRole('dialog').getByRole('button', { name: 'Export' }).click();
    const t0 = Date.now(); while (dls.length < (label === 'WAV' ? 1 : 2) && Date.now() - t0 < 60000) await p.waitForTimeout(500);
    await p.waitForTimeout(8000);
  }
  ok('export produced 2 files', dls.length === 2, dls.map(f => f.split('/').pop()).join(', '));
  await p.getByRole('button', { name: 'Share' }).click(); await p.waitForTimeout(7000);
  await p.getByRole('button', { name: 'Copy link' }).click(); await p.waitForTimeout(800);
  const url = await p.evaluate(() => navigator.clipboard.readText());
  ok('share link has beat', /#beat=[\w-]+/.test(url), url.length + ' chars');
  await p.close(); // the test browser renders 3D in software; one 3D page at a time
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('p2 ' + e.message));
  await p2.goto(url); await p2.waitForTimeout(8000);
  await p2.getByRole('button', { name: 'Share' }).click(); await p2.waitForTimeout(7000);
  const url2 = await p2.locator('#share-url').inputValue();
  ok('share round-trip identical', url2.split('#')[1] === url.split('#')[1]);
  await p2.close();
  const broken = await ctx.newPage(); await broken.goto(URL + '/#beat=%%%garbage'); await broken.getByText(/looks broken/).first().waitFor({ timeout: 90000 }).catch(() => {});
  ok('broken link handled', (await broken.getByText(/looks broken/).count()) > 0);
  ok('no failed requests', failed.length === 0, failed.join(' | '));
  ok('no page errors overall', errs.length === 0, errs.join(' | '));
  await broken.close();
  // ---------- phone ----------
  const phone = await b.newContext({ ...devices['iPhone 13'] });
  phone.setDefaultTimeout(120000);
  const m = await phone.newPage(); const reqs = []; m.on('request', r => reqs.push(r.url()));
  await m.goto(URL); await m.waitForTimeout(3000);
  ok('phone sees desktop gate', await m.getByText(/Made for desktop/).count() > 0);
  ok('phone did not download 3D bundle', !reqs.some(u => /Stage-|hex16\.glb|studio\.exr/.test(u)));
  await m.screenshot({ path: dir + '/qa_phone_gate.png' });
  await m.getByRole('button', { name: 'Try anyway' }).click(); await m.waitForTimeout(9000);
  ok('try anyway loads synth', await m.locator('canvas').count() > 0);
  await m.screenshot({ path: dir + '/qa_phone_try.png' });
  await b.close();
})();
