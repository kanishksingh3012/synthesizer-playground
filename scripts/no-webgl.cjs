// With WebGL switched off, the page must show the "couldn't start 3D graphics" message, not a blank page.
//   node scripts/no-webgl.cjs <url> <screenshot.png>
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis', '--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(process.argv[2]); await p.waitForTimeout(8000);
  const shown = await p.getByText("Your browser couldn't start 3D graphics").count();
  console.log(shown ? 'PASS  no-WebGL fallback shown' : 'FAIL  no-WebGL fallback missing', '| header still there:', await p.getByRole('button', { name: 'Export' }).count() > 0);
  await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
