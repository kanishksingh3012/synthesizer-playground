// Offline sound probe against the dev server: note levels, and how much each knob changes drums and the full mix.
//   npx vite --port 5174 &   then   node scripts/sound-probe.cjs
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:5174'); await p.waitForTimeout(4000);
  const out = await p.evaluate(async () => {
    const Tone = await import('/node_modules/.vite/deps/tone.js').catch(() => window.__tone);
    const { buildGraph, playStep } = await import('/src/audio/graph.ts');
    const { toParams } = await import('/src/audio/sounds.ts');
    const { DEMO } = await import('/src/presets.ts');
    const { emptyGrid, emptyNotes, DRUMS } = await import('/src/state/store.ts');
    const T = window.__tone;
    const SR = 44100, base = { speed: 0.43, volume: 0.75, pitch: 0.5, tone: 0.5, length: 0.3, echo: 0.12, space: 0.2 };
    // laptop-speaker band: 2x one-pole high-pass at 200 Hz
    const hp = (x, f = 200) => { const a = 1 / (1 + 2 * Math.PI * f / SR); let y = new Float32Array(x.length); for (let k = 0; k < 2; k++) { let py = 0, px = 0; const src = k ? y.slice() : x; for (let i = 0; i < x.length; i++) { py = a * (py + src[i] - px); px = src[i]; y[i] = py; } } return y; };
    const rms = (x, a = 0, e = x.length) => { let s = 0; for (let i = a; i < e; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, e - a)); };
    const db = v => +(20 * Math.log10(v + 1e-9)).toFixed(1);
    async function render({ sound = 0, m = {}, drums = null, notes = null, held = null, secs = 4.3 }) {
      const mac = { ...base, ...m };
      const buf = await T.Offline(async ({ transport }) => {
        const g = buildGraph(toParams(sound, mac)); g.setVolume(mac.volume); await g.ready;
        if (held) { g.synth.triggerAttackRelease(held, 0.5, 0.1); return; }
        transport.bpm.value = 60 + mac.speed * 120;
        const st = { drums: drums ?? emptyGrid(DRUMS.length), notes: notes ?? emptyNotes() };
        const sd = 60 / transport.bpm.value / 4;
        new T.Sequence((t, s) => playStep(g, st, s, t, sd), [...Array(16).keys()], '16n').start(0).stop(sd * 32);
        transport.start(0);
      }, secs, 1, SR);
      return buf.getChannelData(0).slice();
    }
    const res = {};
    // 1) keyboard notes vs drum hits, full band and laptop band
    res.drumPeaks = {};
    for (const [r, name] of [[0,'kick'],[1,'snare'],[2,'hat'],[3,'clap']]) { const g = emptyGrid(DRUMS.length); g[r][0] = true; const x = await render({ drums: g, secs: 1 }); let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); res.drumPeaks[name] = [db(pk), db(rms(hp(x), 0, 13000))]; }
    const kick = await render({ drums: (() => { const g = emptyGrid(DRUMS.length); g[0][0] = true; return g; })(), secs: 1 });
    const clap = await render({ drums: (() => { const g = emptyGrid(DRUMS.length); g[3][0] = true; return g; })(), secs: 1 });
    res.drums = { kick: [db(rms(kick, 0, 13000)), db(rms(hp(kick), 0, 13000))], clap: [db(rms(clap, 0, 13000)), db(rms(hp(clap), 0, 13000))] };
    res.notes = {};
    for (const s of [0, 1, 2, 3]) for (const n of ['C3', 'C4']) { const x = await render({ sound: s, held: n, secs: 1 }); res.notes[`${s}/${n}`] = [db(rms(x, 4410, 26460)), db(rms(hp(x), 4410, 26460))]; }
    // 2) knob sweeps: relative difference (dB) between knob 0 and 1, on the drums-only demo and the full demo
    const drumsOnly = { drums: DEMO.drums }, full = { drums: DEMO.drums, notes: DEMO.notes };
    res.knobs = {};
    const L = 4.29; // 2 bars at 112 BPM
    const stats = x => { const n = Math.round(L * SR); const h = hp(hp(x, 2000), 2000); return { level: db(rms(x, 0, n)), bright: db(rms(h, 0, n) / rms(x, 0, n)), tail: db(rms(x, n + 4410, x.length)) }; };
    for (const k of ['echo', 'space']) for (const [label, pat] of [['drums', drumsOnly], ['full', full]]) {
      const r = {};
      for (const v of [0, 0.5, 1]) r[v] = stats(await render({ ...pat, m: { [k]: v }, secs: L + 2 }));
      res.knobs[`${k}/${label}`] = r;
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
