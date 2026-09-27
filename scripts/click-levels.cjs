// Peak level of each UI click vs a kick hit on the real output (dev server on :5174).
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.goto('http://localhost:5174'); await p.waitForTimeout(6000);
  const out = await p.evaluate(async () => {
    const T = window.__tone; await T.start();
    const { uiSound } = await import('/src/audio/uiSounds.ts');
    const { hitDrum, ensureAudio } = await import('/src/audio/live.ts');
    await ensureAudio();
    const m = new T.Meter({ smoothing: 0 }); T.getDestination().connect(m);
    const peak = async (fn) => { fn(); let pk = -200; const t0 = performance.now(); while (performance.now() - t0 < 400) { pk = Math.max(pk, m.getValue()); await new Promise(r => setTimeout(r, 5)); } await new Promise(r => setTimeout(r, 300)); return +pk.toFixed(1); };
    const r = { kick: await peak(() => hitDrum('kick')) };
    for (const k of ['keyDown', 'keyUp', 'button', 'step', 'latch', 'tick']) r[k] = await peak(() => uiSound(k));
    return r;
  });
  console.log(JSON.stringify(out)); await b.close();
})();
