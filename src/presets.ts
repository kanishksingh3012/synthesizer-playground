import { DEFAULT_PARAMS, DRUMS, MELODY_ROWS, emptyGrid, type Drum, type Grid, type SynthParams } from './state/store';

export const PATCHES: Record<string, SynthParams> = {
  'Acid Bass': { ...DEFAULT_PARAMS, osc: 'sawtooth', attack: 0.003, decay: 0.18, sustain: 0.2, release: 0.12, cutoff: 900, resonance: 9, delay: 0.12, reverb: 0.1, volume: -9 },
  'Soft Pad': { ...DEFAULT_PARAMS, osc: 'triangle', attack: 0.6, decay: 0.8, sustain: 0.7, release: 2.2, cutoff: 3200, resonance: 1, delay: 0.25, reverb: 0.6, volume: -10 },
  Pluck: { ...DEFAULT_PARAMS, osc: 'square', attack: 0.002, decay: 0.15, sustain: 0, release: 0.3, cutoff: 2600, resonance: 4, delay: 0.35, reverb: 0.3, volume: -12 },
  'Chip Lead': { ...DEFAULT_PARAMS, osc: 'square', attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.08, cutoff: 12000, resonance: 0.5, delay: 0.2, reverb: 0.15, volume: -16 },
  'Warm Keys': { ...DEFAULT_PARAMS, osc: 'sine', attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.9, cutoff: 5000, resonance: 1, delay: 0.1, reverb: 0.35, volume: -6 },
};

const row = (name: (typeof MELODY_ROWS)[number]) => MELODY_ROWS.indexOf(name);

const melodyFrom = (notes: [number, (typeof MELODY_ROWS)[number]][]): Grid => {
  const g = emptyGrid(MELODY_ROWS.length);
  notes.forEach(([step, n]) => (g[row(n)][step] = true));
  return g;
};

const drumsFrom = (hits: Partial<Record<Drum, number[]>>): Grid => {
  const g = emptyGrid(DRUMS.length);
  DRUMS.forEach((d, r) => hits[d]?.forEach((s) => (g[r][s] = true)));
  return g;
};

export const DEMO = {
  params: PATCHES['Acid Bass'],
  bpm: 112,
  swing: 0.1,
  seqOctave: 3,
  melody: melodyFrom([[0, 'C'], [3, 'C'], [6, 'D#'], [8, 'F'], [10, 'G'], [11, 'A#'], [13, 'G'], [14, 'C+']]),
  drums: drumsFrom({ kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14, 15], perc: [7], tom: [14] }),
};
