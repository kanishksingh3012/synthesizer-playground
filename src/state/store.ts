import { create } from 'zustand';

export type OscType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface SynthParams {
  osc: OscType;
  attack: number; // s
  decay: number; // s
  sustain: number; // 0..1
  release: number; // s
  cutoff: number; // Hz
  resonance: number; // Q
  delay: number; // wet 0..1
  reverb: number; // wet 0..1
  volume: number; // dB
}

export const DRUMS = ['kick', 'snare', 'hat', 'clap', 'tom', 'perc'] as const;
export type Drum = (typeof DRUMS)[number];

export const STEPS = 16;
// Melody grid rows, top to bottom (one octave + top C). Octave offset is applied at playback.
export const MELODY_ROWS = ['C+', 'B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'] as const;

export type Grid = boolean[][];

export const emptyGrid = (rows: number): Grid =>
  Array.from({ length: rows }, () => Array<boolean>(STEPS).fill(false));

export const rowToNote = (row: number, octave: number): string => {
  const name = MELODY_ROWS[row];
  return name === 'C+' ? `C${octave + 1}` : `${name}${octave}`;
};

export interface PlaygroundState {
  params: SynthParams;
  melody: Grid;
  drums: Grid;
  seqOctave: number;
  bpm: number;
  swing: number;
  playing: boolean;
  currentStep: number;
  keyOctave: number;
  pressed: string[];
  padHits: Record<Drum, number>;
  audioReady: boolean;
  showLabels: boolean;
  setParam: <K extends keyof SynthParams>(k: K, v: SynthParams[K]) => void;
  setParams: (p: SynthParams) => void;
  toggleMelody: (row: number, step: number) => void;
  toggleDrum: (row: number, step: number) => void;
  set: (partial: Partial<PlaygroundState>) => void;
  press: (note: string) => void;
  release: (note: string) => void;
  hitPad: (d: Drum) => void;
}

const toggle = (g: Grid, r: number, s: number): Grid =>
  g.map((row, i) => (i === r ? row.map((v, j) => (j === s ? !v : v)) : row));

export const DEFAULT_PARAMS: SynthParams = {
  osc: 'sawtooth',
  attack: 0.01,
  decay: 0.2,
  sustain: 0.4,
  release: 0.4,
  cutoff: 2200,
  resonance: 3,
  delay: 0.2,
  reverb: 0.25,
  volume: -8,
};

export const useStore = create<PlaygroundState>((set) => ({
  params: DEFAULT_PARAMS,
  melody: emptyGrid(MELODY_ROWS.length),
  drums: emptyGrid(DRUMS.length),
  seqOctave: 4,
  bpm: 110,
  swing: 0,
  playing: false,
  currentStep: -1,
  keyOctave: 4,
  pressed: [],
  padHits: { kick: 0, snare: 0, hat: 0, clap: 0, tom: 0, perc: 0 },
  audioReady: false,
  showLabels: false,
  setParam: (k, v) => set((s) => ({ params: { ...s.params, [k]: v } })),
  setParams: (params) => set({ params }),
  toggleMelody: (r, st) => set((s) => ({ melody: toggle(s.melody, r, st) })),
  toggleDrum: (r, st) => set((s) => ({ drums: toggle(s.drums, r, st) })),
  set: (partial) => set(partial),
  press: (note) => set((s) => (s.pressed.includes(note) ? s : { pressed: [...s.pressed, note] })),
  release: (note) => set((s) => ({ pressed: s.pressed.filter((n) => n !== note) })),
  hitPad: (d) => set((s) => ({ padHits: { ...s.padHits, [d]: performance.now() } })),
}));
