import { DRUMS, STEPS, emptyGrid, emptyNotes, type Macros, type PlaygroundState } from './store';

// A beat fits in the URL hash (#beat=...), so sharing needs no server or account.
// Format v1: base64url(JSON { v, s: sound, m: 6 knobs ×100, d: drum rows as hex bitmasks, n: MIDI notes per step }).

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KNOBS: (keyof Macros)[] = ['speed', 'volume', 'tone', 'length', 'echo', 'space'];
const SOUND_COUNT = 4;

const toMidi = (n: string) => {
  const m = /^([A-G]#?)(-?\d)$/.exec(n);
  return m ? NAMES.indexOf(m[1]) + 12 * (Number(m[2]) + 1) : -1;
};
const fromMidi = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

type Beat = Pick<PlaygroundState, 'soundIndex' | 'macros' | 'drums' | 'notes'>;

export function encodeBeat(b: Beat): string {
  return b64url(
    JSON.stringify({
      v: 1,
      s: b.soundIndex,
      m: KNOBS.map((k) => Math.round(b.macros[k] * 100)),
      d: b.drums.map((row) => row.reduce((a, on, i) => a | (on ? 1 << i : 0), 0).toString(16)),
      n: b.notes.map((cell) => cell.map(toMidi).filter((x) => x >= 0)),
    }),
  );
}

/** Returns null for anything malformed — a bad link must never crash the synth. */
export function decodeBeat(code: string): Beat | null {
  try {
    const p = JSON.parse(unb64url(code));
    if (p?.v !== 1 || !Array.isArray(p.m) || p.m.length !== KNOBS.length || !Array.isArray(p.d) || !Array.isArray(p.n)) return null;
    const int = (x: unknown, lo: number, hi: number) => Number.isInteger(x) && (x as number) >= lo && (x as number) <= hi;
    if (!int(p.s, 0, SOUND_COUNT - 1) || !p.m.every((x: unknown) => int(x, 0, 100))) return null;
    const drums = emptyGrid(DRUMS.length);
    p.d.slice(0, DRUMS.length).forEach((hex: unknown, r: number) => {
      const mask = parseInt(String(hex), 16);
      if (Number.isNaN(mask)) throw new Error('bad mask');
      for (let i = 0; i < STEPS; i++) drums[r][i] = (mask & (1 << i)) !== 0;
    });
    const notes = emptyNotes();
    p.n.slice(0, STEPS).forEach((cell: unknown, i: number) => {
      if (!Array.isArray(cell)) throw new Error('bad cell');
      notes[i] = cell.filter((m) => int(m, 12, 107)).slice(0, 8).map(fromMidi);
    });
    const macros = Object.fromEntries(KNOBS.map((k, i) => [k, p.m[i] / 100])) as Macros;
    return { soundIndex: p.s, macros, drums, notes };
  } catch {
    return null;
  }
}

export const shareUrl = (b: Beat) => `${location.origin}${location.pathname}#beat=${encodeBeat(b)}`;

/** Reads #beat=… from the address bar. */
export function beatFromHash(): Beat | 'invalid' | null {
  const m = /[#&]beat=([^&]*)/.exec(location.hash);
  if (!m) return null;
  return decodeBeat(m[1]) ?? 'invalid';
}
