// Tutorial diagrams: plain SVG in the HEX-16 palette, drawn at the width of the tutorial panel (~400 px).
// They are pure markup, so they also render to static HTML for the review page (scripts/tutorial-preview.tsx).
import type { ReactNode } from 'react';

export const C = {
  ink: '#1f2226',
  muted: '#62666d',
  line: '#c2c4c8',
  soft: '#e2e3e6',
  surface: '#eceded',
  panel: '#dcd8cf', // warm-grey upper plate of the synth
  dark: '#2b2e33', // charcoal strip
  orange: '#ff6a2b',
  red: '#e2482f',
  amber: '#f0955a',
  yellow: '#e8cc86',
  white: '#f4f2ee',
  led: '#ff3b1f',
  screen: '#1a0504',
};
const STEP = [C.red, C.red, C.red, C.red, C.amber, C.amber, C.amber, C.amber, C.yellow, C.yellow, C.yellow, C.yellow, C.white, C.white, C.white, C.white];
const font = { fontFamily: 'inherit' };

function Svg({ w, h, label, children }: { w: number; h: number; label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} style={{ display: 'block', ...font }}>
      {children}
    </svg>
  );
}

const T = ({ x, y, s = 11, c = C.muted, w = 500, a = 'middle', children }: { x: number; y: number; s?: number; c?: string; w?: number; a?: 'start' | 'middle' | 'end'; children: ReactNode }) => (
  <text x={x} y={y} fontSize={s} fill={c} fontWeight={w} textAnchor={a} dominantBaseline="middle">
    {children}
  </text>
);

const Badge = ({ x, y, n }: { x: number; y: number; n: number | string }) => (
  <g>
    <circle cx={x} cy={y} r={9} fill={C.orange} />
    <T x={x} y={y + 0.5} s={10} c="#fff" w={700}>
      {n}
    </T>
  </g>
);

/* ---------------------------------------------------------------- Part 1 */

/** Flat map of the synth with numbered zones (legend lives in the lesson text). */
export function SynthMap() {
  const knob = (x: number, y: number, r = 11) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill={C.ink} stroke="#000" strokeWidth={1} />;
  return (
    <Svg w={400} h={300} label="Map of the HEX-16 synthesizer with numbered areas">
      <rect x={10} y={8} width={380} height={284} rx={12} fill={C.dark} />
      <rect x={18} y={16} width={364} height={118} rx={6} fill={C.panel} />
      <T x={30} y={28} s={10} c={C.ink} w={800} a="start">
        HEX<tspan fill={C.orange}>-16</tspan>
      </T>
      <rect x={28} y={38} width={196} height={46} rx={3} fill={C.screen} />
      {[0, 1, 2].map((r) => (
        <rect key={r} x={34} y={44 + r * 13} width={120 + r * 30} height={7} rx={1} fill={C.led} opacity={0.55} />
      ))}
      {[40, 80, 120, 160, 200].map((x) => knob(x, 108))}
      {knob(262, 62, 14)}
      {knob(334, 62, 14)}
      <rect x={244} y={98} width={46} height={22} rx={4} fill="#9a9ea5" />
      <rect x={312} y={98} width={46} height={22} rx={4} fill="#9a9ea5" />
      {[C.red, C.yellow, '#8ccfc2', '#98b2e6', C.white].map((c, i) => (
        <rect key={i} x={26 + i * 71} y={144} width={64} height={20} rx={4} fill={c} opacity={0.9} />
      ))}
      {STEP.map((c, i) => (
        <g key={i}>
          <circle cx={36 + i * 21.8} cy={174} r={2.5} fill={i % 4 === 0 ? C.led : '#55191a'} />
          <rect x={27 + i * 21.8} y={181} width={18} height={24} rx={3} fill={c} />
        </g>
      ))}
      <rect x={18} y={214} width={364} height={70} rx={6} fill="#23262a" />
      <rect x={28} y={226} width={52} height={44} rx={6} fill="#f2ad7e" />
      <T x={54} y={248} s={11} c={C.ink} w={700}>
        ▶■
      </T>
      <rect x={92} y={234} width={28} height={28} rx={4} fill="#9a9ea5" />
      <rect x={126} y={234} width={28} height={28} rx={4} fill="#9a9ea5" />
      {[...Array(8).keys()].map((i) => (
        <rect key={i} x={170 + i * 26} y={222} width={24} height={56} rx={2} fill={C.white} />
      ))}
      {[0, 1, 3, 4, 5].map((i) => (
        <rect key={i} x={187 + i * 26} y={222} width={16} height={32} rx={2} fill={C.ink} />
      ))}
      <Badge x={126} y={30} n={1} />
      <Badge x={120} y={126} n={2} />
      <Badge x={298} y={40} n={3} />
      <Badge x={300} y={128} n={4} />
      <Badge x={372} y={154} n={5} />
      <Badge x={372} y={193} n={6} />
      <Badge x={54} y={216} n={7} />
      <Badge x={123} y={226} n={8} />
      <Badge x={278} y={216} n={9} />
    </Svg>
  );
}

/** The dot-matrix screen with what each line means. */
export function ScreenDiagram() {
  const line = (y: number, parts: [string, number, boolean?][]) =>
    parts.map(([txt, x, dim]) => (
      <text key={txt + x} x={x} y={y} fontSize={15} fill={C.led} opacity={dim ? 0.45 : 1} fontFamily="ui-monospace, Menlo, monospace" fontWeight={700} letterSpacing={1}>
        {txt}
      </text>
    ));
  return (
    <Svg w={400} h={200} label="The screen: selected track, sound, speed, octave, last note and the step map">
      <rect x={20} y={10} width={360} height={104} rx={6} fill={C.screen} />
      {line(36, [['▌KICK', 30], ['BASS', 140], ['112 BPM', 262]])}
      {line(62, [['OCT 4', 30], ['NOTE C4', 140], ['P+3', 322]])}
      {STEP.map((_, i) => {
        const x = 32 + i * 20.6 + Math.floor(i / 4) * 6;
        const on = i % 4 === 0;
        return <rect key={i} x={x} y={80} width={14} height={14} fill={on ? C.led : 'none'} stroke={C.led} strokeWidth={1.5} opacity={on ? 1 : 0.7} />;
      })}
      <rect x={32 + 6 * 20.6 + 6} y={99} width={14} height={2.5} fill={C.led} />
      {(
        [
          [60, 'track you are editing'],
          [155, 'sound'],
          [300, 'speed'],
        ] as [number, string][]
      ).map(([x, t]) => (
        <g key={t}>
          <line x1={x} y1={120} x2={x} y2={134} stroke={C.line} />
          <T x={x} y={142} s={11}>
            {t}
          </T>
        </g>
      ))}
      {(
        [
          [58, 'octave'],
          [175, 'last note'],
          [338, 'pitch'],
        ] as [number, string][]
      ).map(([x, t]) => (
        <g key={t}>
          <line x1={x} y1={148} x2={x} y2={160} stroke={C.line} />
          <T x={x} y={168} s={11}>
            {t}
          </T>
        </g>
      ))}
      <T x={200} y={190} s={11} c={C.ink} w={600}>
        bottom row = the 16 steps of that track · underline = playhead
      </T>
    </Svg>
  );
}

/** 16 steps around a ring: the loop never ends, the playhead goes round. */
export function LoopRing() {
  const cx = 200, cy = 110, r = 80;
  return (
    <Svg w={400} h={220} label="Sixteen steps in a ring; the playhead goes round and round">
      {STEP.map((c, i) => {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        return (
          <g key={i}>
            <rect x={x - 11} y={y - 11} width={22} height={22} rx={4} fill={c} stroke={i === 5 ? C.orange : 'none'} strokeWidth={3} transform={`rotate(${(i / 16) * 360} ${x} ${y})`} />
            <T x={cx + Math.cos(a) * (r + 22)} y={cy + Math.sin(a) * (r + 22)} s={9}>
              {i + 1}
            </T>
          </g>
        );
      })}
      <path d={`M ${cx} ${cy - 44} A 44 44 0 1 1 ${cx - 31} ${cy - 31}`} fill="none" stroke={C.orange} strokeWidth={3} markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX={5} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={C.orange} />
        </marker>
      </defs>
      <T x={cx} y={cy - 6} s={12} c={C.ink} w={700}>
        1 bar
      </T>
      <T x={cx} y={cy + 10} s={10}>
        repeats forever
      </T>
      <T x={330} y={40} s={10} c={C.orange} w={600} a="start">
        playhead
      </T>
      <line x1={328} y1={46} x2={cx + Math.cos((5 / 16) * Math.PI * 2 - Math.PI / 2) * r + 12} y2={cy + Math.sin((5 / 16) * Math.PI * 2 - Math.PI / 2) * r - 6} stroke={C.orange} />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Part 2 */

/** 16 steps = 4 beats of 4, counted "1 e & a". */
export function StepsAndBeats() {
  const counts = ['e', '&', 'a'];
  return (
    <Svg w={400} h={130} label="Sixteen steps grouped into four beats, counted one e and a">
      {STEP.map((c, i) => {
        const x = 12 + i * 23.5 + Math.floor(i / 4) * 4;
        return (
          <g key={i}>
            <rect x={x} y={40} width={20} height={28} rx={4} fill={c} stroke={i >= 12 ? C.line : 'none'} />
            <T x={x + 10} y={80} s={9}>
              {i + 1}
            </T>
            <T x={x + 10} y={28} s={i % 4 ? 11 : 14} c={i % 4 ? C.muted : C.ink} w={i % 4 ? 500 : 800}>
              {i % 4 ? counts[(i % 4) - 1] : i / 4 + 1}
            </T>
          </g>
        );
      })}
      {[0, 1, 2, 3].map((b) => {
        const x0 = 12 + b * 4 * 23.5 + b * 4, x1 = x0 + 4 * 23.5 - 3.5;
        return (
          <g key={b}>
            <path d={`M ${x0} 92 v 6 H ${x1} v -6`} fill="none" stroke={C.muted} />
            <T x={(x0 + x1) / 2} y={108} s={10}>
              beat {b + 1}
            </T>
          </g>
        );
      })}
      <T x={200} y={124} s={10} c={C.ink} w={600}>
        4 beats = 1 bar · say it out loud: "1 e & a 2 e & a 3 e & a 4 e & a"
      </T>
    </Svg>
  );
}

export interface Row {
  label: string;
  color: string;
  on: number[]; // 1-based steps, as written in the lesson text
}

/** A mini step sequencer: one row per drum, lit cells = hits. `focus` outlines the row being taught. */
export function StepGrid({ rows, focus, caption }: { rows: Row[]; focus?: string; caption?: string }) {
  const top = 22, rh = 26;
  const h = top + rows.length * rh + (caption ? 26 : 8);
  return (
    <Svg w={400} h={h} label={`Step grid: ${rows.map((r) => `${r.label} on ${r.on.join(', ')}`).join('; ')}`}>
      {[...Array(16).keys()].map((i) => (
        <T key={i} x={72 + i * 19.5 + Math.floor(i / 4) * 4 + 8} y={10} s={9} c={i % 4 ? C.muted : C.ink} w={i % 4 ? 500 : 700}>
          {i + 1}
        </T>
      ))}
      {rows.map((r, ri) => {
        const y = top + ri * rh;
        const f = r.label === focus;
        return (
          <g key={r.label}>
            {f && <rect x={2} y={y - 3} width={396} height={rh - 2} rx={6} fill="none" stroke={C.orange} strokeWidth={2} />}
            <T x={10} y={y + 10} s={11} c={C.ink} w={f ? 800 : 600} a="start">
              {r.label}
            </T>
            {[...Array(16).keys()].map((i) => {
              const on = r.on.includes(i + 1);
              return <rect key={i} x={72 + i * 19.5 + Math.floor(i / 4) * 4} y={y} width={16} height={20} rx={3} fill={on ? r.color : C.soft} stroke={on && r.color === C.white ? C.line : 'none'} />;
            })}
          </g>
        );
      })}
      {caption && (
        <T x={200} y={h - 10} s={10} c={C.ink} w={600}>
          {caption}
        </T>
      )}
    </Svg>
  );
}

export const DRUM_COLORS = { KICK: C.red, SNARE: '#d9a441', HAT: '#3fa892', CLAP: '#5a82d6' };

/* ---------------------------------------------------------------- Part 3 */

const WHITE = [
  { k: 'A', n: 'C' },
  { k: 'S', n: 'D' },
  { k: 'D', n: 'E' },
  { k: 'F', n: 'F' },
  { k: 'G', n: 'G' },
  { k: 'H', n: 'A' },
  { k: 'J', n: 'B' },
  { k: 'K', n: 'C' },
];
const BLACK = [
  { k: 'W', n: 'C#', after: 0 },
  { k: 'E', n: 'D#', after: 1 },
  { k: 'T', n: 'F#', after: 3 },
  { k: 'Y', n: 'G#', after: 4 },
  { k: 'U', n: 'A#', after: 5 },
];

/** One octave: computer letter on each key, note name under it. `mark` lists note names to highlight (by white-key index for repeated C). */
export function KeyboardDiagram({ mark = [], caption }: { mark?: number[]; caption?: string }) {
  const kw = 46, x0 = 16;
  return (
    <Svg w={400} h={caption ? 182 : 160} label="One-octave keyboard: computer letters and note names">
      {WHITE.map((w, i) => {
        const on = mark.includes(i);
        return (
          <g key={w.k}>
            <rect x={x0 + i * kw} y={10} width={kw - 3} height={120} rx={4} fill={on ? '#ffe3d6' : C.white} stroke={on ? C.orange : C.line} strokeWidth={on ? 2.5 : 1} />
            <T x={x0 + i * kw + (kw - 3) / 2} y={112} s={12} c={C.ink} w={800}>
              {w.k}
            </T>
            <T x={x0 + i * kw + (kw - 3) / 2} y={144} s={12} c={on ? C.orange : C.muted} w={700}>
              {w.n}
            </T>
          </g>
        );
      })}
      {BLACK.map((b) => {
        const x = x0 + (b.after + 1) * kw - 15;
        return (
          <g key={b.k}>
            <rect x={x} y={10} width={27} height={70} rx={3} fill={C.ink} />
            <T x={x + 13.5} y={64} s={11} c="#fff" w={800}>
              {b.k}
            </T>
            <T x={x + 13.5} y={20} s={8} c="#b9bcc2" w={600}>
              {b.n}
            </T>
          </g>
        );
      })}
      {caption && (
        <T x={200} y={170} s={10} c={C.ink} w={600}>
          {caption}
        </T>
      )}
    </Svg>
  );
}

/** OCT − / OCT + move the whole keyboard down or up by 12 notes. */
export function OctaveDiagram() {
  const oct = (y: number, n: number, on: boolean) => (
    <g key={n}>
      <T x={40} y={y + 12} s={12} c={on ? C.orange : C.muted} w={on ? 800 : 600}>
        OCT {n}
      </T>
      {[...Array(8).keys()].map((i) => (
        <rect key={i} x={80 + i * 22} y={y} width={20} height={24} rx={2} fill={on ? '#ffe3d6' : C.white} stroke={on ? C.orange : C.line} />
      ))}
      <T x={270} y={y + 12} s={10} a="start">
        C{n} … C{n + 1}
      </T>
    </g>
  );
  return (
    <Svg w={400} h={150} label="Octaves: OCT minus and plus move the keyboard by twelve notes">
      {oct(10, 5, false)}
      {oct(48, 4, true)}
      {oct(86, 3, false)}
      <T x={200} y={138} s={10} c={C.ink} w={600}>
        OCT + goes up, OCT − goes down · one octave up = twice the pitch
      </T>
      <T x={372} y={41} s={11} c={C.orange} w={800}>
        ↑ +
      </T>
      <T x={372} y={79} s={11} c={C.muted} w={800}>
        ↓ −
      </T>
    </Svg>
  );
}

/** Writing a note: pick NOTES, click a step, press a key, cursor moves on. */
export function NoteEntryFlow() {
  const box = (x: number, n: number, title: string, body: ReactNode) => (
    <g key={n}>
      <rect x={x} y={10} width={118} height={130} rx={10} fill={C.surface} stroke={C.line} />
      <Badge x={x + 16} y={26} n={n} />
      <T x={x + 30} y={26} s={11} c={C.ink} w={700} a="start">
        {title}
      </T>
      {body}
    </g>
  );
  const steps = (x: number, sel: number, notes: Record<number, string>) =>
    [0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={x + 10 + i * 25} y={70} width={21} height={28} rx={3} fill={notes[i] ? C.orange : C.red} stroke={i === sel ? C.ink : 'none'} strokeWidth={2} strokeDasharray={i === sel ? '3 2' : undefined} />
        {notes[i] && (
          <T x={x + 20.5 + i * 25} y={84} s={9} c="#fff" w={800}>
            {notes[i]}
          </T>
        )}
      </g>
    ));
  return (
    <Svg w={400} h={170} label="Writing notes: tap NOTES, click a step, press a key; the cursor moves to the next step">
      {box(
        6,
        1,
        'Tap NOTES',
        <g>
          <rect x={22} y={62} width={86} height={34} rx={6} fill={C.white} stroke={C.orange} strokeWidth={2.5} />
          <T x={65} y={79} s={12} c={C.ink} w={800}>
            B · NOTES
          </T>
        </g>,
      )}
      {box(141, 2, 'Click a step', <g>{steps(141, 0, {})}<T x={200} y={116} s={10}>its light blinks</T></g>)}
      {box(276, 3, 'Press a key', <g>{steps(276, 1, { 0: 'C' })}<T x={335} y={116} s={10}>note written, next</T></g>)}
      <T x={200} y={160} s={10} c={C.ink} w={600}>
        click the selected step again to empty it
      </T>
    </Svg>
  );
}

/* ---------------------------------------------------------------- Part 4 */

/** The four instruments behind SOUND, each with its wave shape. */
export function SoundTiles() {
  const tiles: [string, string, string][] = [
    ['BASS', 'M4 20 L14 4 L14 20 L24 4 L24 20 L34 4 L34 20', 'deep, buzzy'],
    ['KEYS', 'M4 12 L11 4 L25 20 L34 12', 'soft, round'],
    ['LEAD', 'M4 20 V4 H14 V20 H24 V4 H34 V20', 'bright, cutting'],
    ['PAD', 'M4 12 C 10 0, 16 0, 19 12 S 28 24, 34 12', 'slow, smooth'],
  ];
  return (
    <Svg w={400} h={112} label="SOUND switches between BASS, KEYS, LEAD and PAD">
      {tiles.map(([name, d, sub], i) => (
        <g key={name} transform={`translate(${6 + i * 98} 8)`}>
          <rect width={92} height={96} rx={10} fill={i === 0 ? '#ffe3d6' : C.surface} stroke={i === 0 ? C.orange : C.line} strokeWidth={i === 0 ? 2 : 1} />
          <g transform="translate(27 14)">
            <path d={d} fill="none" stroke={C.orange} strokeWidth={2.5} strokeLinejoin="round" />
          </g>
          <T x={46} y={58} s={13} c={C.ink} w={800}>
            {name}
          </T>
          <T x={46} y={78} s={10}>
            {sub}
          </T>
        </g>
      ))}
    </Svg>
  );
}

/** TONE: how much of the high end gets through (dark vs bright). */
export function ToneCurve() {
  const curve = (knee: number) => `M 40 40 H ${knee} C ${knee + 30} 40, ${knee + 40} 120, ${knee + 70} 130`;
  return (
    <Svg w={400} h={170} label="TONE: turning left cuts the high frequencies, turning right lets them through">
      <line x1={40} y1={140} x2={380} y2={140} stroke={C.line} />
      <line x1={40} y1={30} x2={40} y2={140} stroke={C.line} />
      <path d={curve(90)} fill="none" stroke={C.muted} strokeWidth={2.5} strokeDasharray="5 4" />
      <path d={`M 40 40 H 370`} fill="none" stroke={C.orange} strokeWidth={3} />
      <line x1={172} y1={96} x2={220} y2={104} stroke={C.muted} />
      <T x={224} y={104} s={11} c={C.muted} w={700} a="start">
        TONE left: highs cut, dark
      </T>
      <T x={300} y={26} s={11} c={C.orange} w={700}>
        TONE right: bright, crisp
      </T>
      <T x={60} y={156} s={10}>
        low
      </T>
      <T x={210} y={156} s={10}>
        pitch of the sound's parts →
      </T>
      <T x={360} y={156} s={10}>
        high
      </T>
      <T x={22} y={85} s={10}>
        loud
      </T>
    </Svg>
  );
}

/** LENGTH: how long each hit rings (short pluck vs long tone). */
export function LengthEnvelope() {
  return (
    <Svg w={400} h={150} label="LENGTH: short sounds stop quickly, long sounds ring out">
      <line x1={30} y1={120} x2={380} y2={120} stroke={C.line} />
      <path d="M 30 120 L 36 30 C 50 90, 70 118, 110 120" fill="rgba(98,102,109,.15)" stroke={C.muted} strokeWidth={2.5} />
      <path d="M 200 120 L 206 30 C 240 60, 300 100, 380 118" fill="rgba(255,106,43,.15)" stroke={C.orange} strokeWidth={2.5} />
      <T x={30} y={140} s={11} c={C.muted} w={700} a="start">
        left: short, plucky
      </T>
      <T x={380} y={140} s={11} c={C.orange} w={700} a="end">
        right: long, ringing
      </T>
      <T x={205} y={16} s={10}>
        each hit starts loud, then fades →
      </T>
    </Svg>
  );
}

/** ECHO repeats, SPACE adds a room tail. */
export function EchoSpace() {
  return (
    <Svg w={400} h={170} label="ECHO repeats each hit; SPACE adds a smooth room tail">
      <T x={10} y={16} s={11} c={C.ink} w={800} a="start">
        ECHO: the hit comes back, quieter each time
      </T>
      {[1, 0.7, 0.49, 0.34, 0.24, 0.17].map((a, i) => (
        <rect key={i} x={20 + i * 58} y={70 - 44 * a} width={12} height={44 * a} rx={2} fill={i ? C.orange : C.ink} opacity={i ? a + 0.1 : 1} />
      ))}
      <T x={10} y={96} s={11} c={C.ink} w={800} a="start">
        SPACE: the hit rings in a room, small → big hall
      </T>
      <rect x={20} y={112} width={12} height={40} rx={2} fill={C.ink} />
      <path d="M 34 118 C 90 124, 160 146, 380 151 L 380 152 L 34 152 Z" fill={C.orange} opacity={0.35} />
      <path d="M 34 132 C 60 140, 90 150, 140 152 L 34 152 Z" fill={C.orange} opacity={0.6} />
      <T x={120} y={142} s={9} c={C.ink} w={600}>
        small room
      </T>
      <T x={300} y={140} s={9} c={C.ink} w={600}>
        big hall
      </T>
    </Svg>
  );
}

/** SPEED in BPM with the usual genre ranges. */
export function SpeedScale() {
  const x = (bpm: number) => 20 + ((bpm - 60) / 120) * 360;
  const marks: [number, string][] = [
    [90, 'hip-hop'],
    [110, 'pop'],
    [124, 'house'],
    [170, 'drum & bass'],
  ];
  return (
    <Svg w={400} h={110} label="SPEED from 60 to 180 BPM with genre markers">
      <rect x={20} y={46} width={360} height={10} rx={5} fill={C.soft} />
      <rect x={20} y={46} width={x(112) - 20} height={10} rx={5} fill={C.orange} />
      <circle cx={x(112)} cy={51} r={9} fill="#fff" stroke={C.orange} strokeWidth={3} />
      {[60, 90, 120, 150, 180].map((b) => (
        <T key={b} x={x(b)} y={72} s={10}>
          {b}
        </T>
      ))}
      {marks.map(([b, g]) => (
        <g key={g}>
          <line x1={x(b)} y1={22} x2={x(b)} y2={42} stroke={C.ink} />
          <T x={x(b)} y={14} s={10} c={C.ink} w={700}>
            {g}
          </T>
        </g>
      ))}
      <T x={200} y={96} s={10} c={C.ink} w={600}>
        BPM = beats per minute · the demo starts at 112
      </T>
    </Svg>
  );
}

/** PITCH moves the melody in semitones (±12 = one octave). */
export function PitchLadder() {
  const y = (s: number) => 50 - s * 5;
  const melody = [0, 4, 7, 4];
  return (
    <Svg w={400} h={190} label="PITCH shifts the whole melody up or down in semitones">
      {[-12, 0, 12].map((s) => (
        <g key={s}>
          <line x1={60} y1={y(s) + 40} x2={380} y2={y(s) + 40} stroke={s ? C.soft : C.line} strokeDasharray={s ? '4 3' : undefined} />
          <T x={30} y={y(s) + 40} s={10} c={s ? C.muted : C.ink} w={700}>
            {s > 0 ? `+${s}` : s}
          </T>
        </g>
      ))}
      {melody.map((n, i) => (
        <g key={i}>
          <circle cx={100 + i * 40} cy={y(n) + 40} r={6} fill={C.muted} />
          <circle cx={240 + i * 40} cy={y(n + 5) + 40} r={6} fill={C.orange} />
        </g>
      ))}
      <T x={160} y={180} s={10}>
        PITCH 0
      </T>
      <T x={300} y={180} s={10} c={C.orange} w={700}>
        PITCH +5: same tune, higher
      </T>
    </Svg>
  );
}

/** Export saves a file, Share makes a link. */
export function SaveShare() {
  const card = (x: number, title: string, sub: string, icon: ReactNode) => (
    <g key={title}>
      <rect x={x} y={10} width={180} height={90} rx={10} fill={C.surface} stroke={C.line} />
      <g transform={`translate(${x + 16} 28)`}>{icon}</g>
      <T x={x + 64} y={42} s={13} c={C.ink} w={800} a="start">
        {title}
      </T>
      <T x={x + 64} y={62} s={10} a="start">
        {sub}
      </T>
    </g>
  );
  return (
    <Svg w={400} h={110} label="Export saves an audio file; Share copies a link to your beat">
      {card(
        10,
        'Export',
        'WAV or MP3 file',
        <path d="M18 0 V26 M8 16 L18 26 L28 16 M4 34 H32" stroke={C.orange} strokeWidth={3} fill="none" strokeLinecap="round" />,
      )}
      {card(
        210,
        'Share',
        'a link to your beat',
        <g stroke={C.orange} strokeWidth={3} fill="none" strokeLinecap="round">
          <path d="M14 20 L22 12" />
          <path d="M10 16 L6 20 a6 6 0 0 0 8 8 l4 -4" />
          <path d="M26 16 L30 12 a6 6 0 0 0 -8 -8 l-4 4" />
        </g>,
      )}
    </Svg>
  );
}
