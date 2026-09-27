import { create } from 'zustand';

export const DRUMS = ['kick', 'snare', 'hat', 'clap', 'tom', 'perc'] as const; // engine voices
export type Drum = (typeof DRUMS)[number];
export const TRACKS = ['kick', 'snare', 'hat', 'clap', 'notes'] as const; // HEX-16 track pads
export type Track = (typeof TRACKS)[number];
export const STEPS = 16;

export type Grid = boolean[][];
export const emptyGrid = (rows: number): Grid => Array.from({ length: rows }, () => Array<boolean>(STEPS).fill(false));
export const emptyNotes = (): string[][] => Array.from({ length: STEPS }, () => []);

export type MacroKey = 'speed' | 'volume' | 'pitch' | 'tone' | 'length' | 'echo' | 'space';
export type Macros = Record<MacroKey, number>; // all 0..1

export const DEFAULT_MACROS: Macros = { speed: 0.43, volume: 0.75, pitch: 0.5, tone: 0.5, length: 0.3, echo: 0.12, space: 0.2 };

export const bpmOf = (speed: number) => Math.round(60 + speed * 120);

export interface PlaygroundState {
  soundIndex: number;
  macros: Macros;
  drums: Grid;
  notes: string[][]; // melody: notes per step
  selectedTrack: Track;
  cursor: number; // NOTES step being written (-1 = none)
  playing: boolean;
  currentStep: number;
  keyOctave: number;
  pressed: string[];
  lastNote: string;
  padHits: Record<Drum, number>;
  flashes: Record<string, number>; // control name -> last press time (keyboard-triggered press animation)
  popup: { label: string; value: number; until: number } | null;
  showKeys: boolean;
  uiSound: boolean; // mechanical click sounds on/off
  showHelp: boolean;
  audioReady: boolean;
  tutorialOpen: boolean;
  tutorialStep: number;
  highlight: string[]; // synth parts the tutorial is pointing at (node names)
  beforeTutorial: Pick<PlaygroundState, 'drums' | 'notes' | 'soundIndex' | 'macros' | 'keyOctave'> | null;
  set: (partial: Partial<PlaygroundState>) => void;
}

const storedFlag = (key: string) => {
  try {
    return localStorage.getItem(key) !== '0';
  } catch {
    return true;
  }
};

export const useStore = create<PlaygroundState>((set) => ({
  soundIndex: 0,
  macros: DEFAULT_MACROS,
  drums: emptyGrid(DRUMS.length),
  notes: emptyNotes(),
  selectedTrack: 'kick',
  cursor: -1,
  playing: false,
  currentStep: -1,
  keyOctave: 4,
  pressed: [],
  lastNote: '--',
  padHits: { kick: 0, snare: 0, hat: 0, clap: 0, tom: 0, perc: 0 },
  flashes: {},
  popup: null,
  showKeys: storedFlag('hex16.showKeys'),
  uiSound: storedFlag('hex16.uiSound'),
  showHelp: false,
  audioReady: false,
  tutorialOpen: false,
  tutorialStep: 0,
  highlight: [],
  beforeTutorial: null,
  set: (partial) => set(partial),
}));
