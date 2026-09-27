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

/** Starter beat loaded on first visit: acid bass line over a four-on-the-floor groove at 112 BPM. */
export const DEMO = {
  soundIndex: 0,
  drums: drums({ kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14, 15] }),
  notes: notes([[0, 'C2'], [3, 'C2'], [6, 'D#2'], [8, 'F2'], [10, 'G2'], [11, 'A#2'], [13, 'G2'], [14, 'C3']]),
};
