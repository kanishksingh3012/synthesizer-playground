/** @jsxRuntime automatic */
/** @jsxImportSource react */
// Renders the tutorial (src/tutorial) to one static HTML page for review before it goes into the site.
//   npx tsx --tsconfig tsconfig.app.json scripts/tutorial-preview.tsx tutorial-preview.html
import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { LESSONS, PARTS } from '../src/tutorial/lessons';

const css = `
:root{--accent:#ff6a2b;--bg:#d2d3d6;--surface:#eceded;--ink:#1f2226;--muted:#62666d;--line:#c2c4c8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--surface);border-bottom:1px solid var(--line);padding:14px 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.brand{letter-spacing:.18em;font-weight:600}.brand b{color:var(--accent)}
nav a{color:var(--muted);text-decoration:none;font-size:13px;margin-right:12px}nav a:hover{color:var(--accent)}
main{max-width:470px;margin:24px auto 80px;padding:0 16px}
h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:36px 0 10px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 18px 16px;margin:0 0 14px}
.meta{font-size:12px;color:var(--muted);display:flex;justify-content:space-between}
.card h3{font-size:19px;margin:4px 0 8px}.card p{margin:0 0 10px}
.fig{background:#fff;border-radius:10px;padding:10px;margin:12px 0}
.try{border-left:3px solid var(--accent);background:#fff;border-radius:0 10px 10px 0;padding:10px 12px;margin:12px 0 8px}
.try b.label{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.tip{font-size:13.5px;color:var(--muted)}
.tut-kbd{display:inline-block;min-width:1.6em;padding:0 5px;border:1px solid var(--line);border-bottom-width:2px;border-radius:5px;background:#fff;font:600 12px/1.6 ui-monospace,Menlo,monospace;text-align:center}
.tut-legend{margin:6px 0 0;padding-left:0;list-style:none;counter-reset:n}.tut-legend li{counter-increment:n;margin:4px 0;position:relative;padding-left:28px}
.tut-legend li:before{content:counter(n);position:absolute;left:0;top:2px;width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center}
.tut-recipes h4{margin:10px 0 2px;font-size:13px}
.tut-glossary{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}.tut-glossary dt{font-weight:700}.tut-glossary dd{margin:0;color:var(--muted)}
.buttons{display:flex;gap:8px;margin-top:10px}.btn{font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:#fff}.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.note{max-width:470px;margin:16px auto 0;padding:0 16px;color:var(--muted);font-size:13px}
`;

let n = 0;
const body = renderToStaticMarkup(
  <>
    <header>
      <div className="brand">HEX<b>-16</b> · Tutorial (review draft)</div>
      <nav>{PARTS.map((p, i) => <a key={p} href={`#part-${i}`}>{i + 1}. {p}</a>)}</nav>
    </header>
    <p className="note">This is every lesson of the tutorial on one page. On the site each card is one screen of the Tutorial panel, with Back / Next, a ✓ when you've done the task, a "Show me" button, and glowing rings on the real synth controls it talks about.</p>
    <main>
      {PARTS.map((p, pi) => (
        <section key={p} id={`part-${pi}`}>
          <h2>Part {pi + 1} · {p}</h2>
          {LESSONS.filter((l) => l.part === p).map((l) => {
            n += 1;
            return (
              <article className="card" key={l.id}>
                <div className="meta"><span>{p}</span><span>{n} / {LESSONS.length}</span></div>
                <h3>{l.title}</h3>
                {l.body}
                {l.diagram && <div className="fig">{l.diagram}</div>}
                {l.tryIt && <div className="try"><b className="label">Try it</b>{l.tryIt}</div>}
                {l.tip && <p className="tip">💡 {l.tip}</p>}
                <div className="buttons"><span className="btn">Back</span>{l.tryIt && <span className="btn">Show me</span>}<span className="btn primary">Next</span></div>
              </article>
            );
          })}
        </section>
      ))}
    </main>
  </>,
);

writeFileSync(process.argv[2] ?? 'tutorial-preview.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HEX-16 Tutorial</title><style>${css}</style></head><body>${body}</body></html>`);
console.log('lessons', LESSONS.length);
