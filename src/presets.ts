import { DRUMS, emptyGrid, emptyNotes, type Drum } from './state/store';

const drums = (hits: Partial<Record<Drum, number[]>>) => {
  const g = emptyGrid(DRUMS.length);
  DRUMS.forEach((d, r) => hits[d]?.forEach((s) => (g[r][s] = true)));
  return g;
};

const notes = (list: [number, string][]) => {
  const n = emptyNotes();
  list.forEach(([step, note]) => n[step].push(note));
  return n;
};

/** Starter beat loaded on first visit: acid line (octave 3: audible on laptop speakers) over a four-on-the-floor groove at 112 BPM. */
export const DEMO = {
  soundIndex: 0,
  drums: drums({ kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14, 15] }),
  notes: notes([[0, 'C3'], [3, 'C3'], [6, 'D#3'], [8, 'F3'], [10, 'G3'], [11, 'A#3'], [13, 'G3'], [14, 'C4']]),
};
