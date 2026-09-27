// Beat recipes used by the tutorial's diagram and its "Load this beat" buttons (steps are 1-based, as in the text).
export interface Recipe {
  name: string;
  bpm: number;
  kick: number[];
  snare?: number[];
  clap?: number[];
  hat?: number[];
}

const EIGHTHS = [1, 3, 5, 7, 9, 11, 13, 15];

export const RECIPES: Recipe[] = [
  { name: 'House', bpm: 124, kick: [1, 5, 9, 13], clap: [5, 13], hat: [3, 7, 11, 15] },
  { name: 'Hip‑hop', bpm: 90, kick: [1, 8, 11], snare: [5, 13], hat: EIGHTHS },
  { name: 'Pop', bpm: 110, kick: [1, 9, 11], clap: [5, 13], hat: EIGHTHS },
  { name: 'Reggaeton (dembow)', bpm: 95, kick: [1, 5, 9, 13], snare: [4, 7, 12, 15] },
];
