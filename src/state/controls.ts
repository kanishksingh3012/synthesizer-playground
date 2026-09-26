import type { SynthParams } from './store';

type NumKey = Exclude<keyof SynthParams, 'osc'>;

export interface ControlDef {
  key: NumKey;
  label: string;
  min: number;
  max: number;
  curve: 'lin' | 'log';
  format: (v: number) => string;
}

const sec = (v: number) => (v < 1 ? `${Math.round(v * 1000)}ms` : `${v.toFixed(2)}s`);
const pct = (v: number) => `${Math.round(v * 100)}%`;

// The 8 knobs on the 3D synth, in panel order.
export const KNOBS: ControlDef[] = [
  { key: 'cutoff', label: 'Cutoff', min: 80, max: 12000, curve: 'log', format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`) },
  { key: 'resonance', label: 'Reso', min: 0.5, max: 15, curve: 'lin', format: (v) => v.toFixed(1) },
  { key: 'attack', label: 'Attack', min: 0.001, max: 2, curve: 'log', format: sec },
  { key: 'decay', label: 'Decay', min: 0.01, max: 2, curve: 'log', format: sec },
  { key: 'sustain', label: 'Sustain', min: 0, max: 1, curve: 'lin', format: pct },
  { key: 'release', label: 'Release', min: 0.01, max: 4, curve: 'log', format: sec },
  { key: 'delay', label: 'Delay', min: 0, max: 0.8, curve: 'lin', format: pct },
  { key: 'reverb', label: 'Reverb', min: 0, max: 0.9, curve: 'lin', format: pct },
];

export const VOLUME: ControlDef = { key: 'volume', label: 'Volume', min: -30, max: 0, curve: 'lin', format: (v) => `${Math.round(v)}dB` };

export const toNorm = (c: ControlDef, v: number) =>
  c.curve === 'log' ? Math.log(v / c.min) / Math.log(c.max / c.min) : (v - c.min) / (c.max - c.min);

export const fromNorm = (c: ControlDef, n: number) => {
  const t = Math.min(1, Math.max(0, n));
  return c.curve === 'log' ? c.min * Math.pow(c.max / c.min, t) : c.min + t * (c.max - c.min);
};
