import type { Macros } from '../state/store';
import type { SynthParams } from './graph';

/** The 4 ready-made sounds behind the SOUND button; expert settings are fixed per sound. */
export const SOUNDS = [
  { name: 'BASS', osc: 'sawtooth', attack: 0.003, sustain: 0.25, resonance: 8, volume: -8 },
  { name: 'KEYS', osc: 'triangle', attack: 0.005, sustain: 0.35, resonance: 1, volume: -6 },
  { name: 'LEAD', osc: 'square', attack: 0.01, sustain: 0.6, resonance: 3, volume: -14 },
  { name: 'PAD', osc: 'sawtooth', attack: 0.4, sustain: 0.7, resonance: 1, volume: -14 },
] as const;

/** Maps the plain-language knobs onto engine parameters. */
export function toParams(soundIndex: number, m: Macros): SynthParams {
  const s = SOUNDS[soundIndex];
  return {
    osc: s.osc,
    attack: s.attack,
    sustain: s.sustain,
    resonance: s.resonance,
    volume: s.volume,
    cutoff: 80 * Math.pow(150, m.tone), // TONE: dark -> bright
    decay: 0.05 + m.length * 1.5, // LENGTH: short -> long
    release: 0.05 + m.length * 2.5,
    delay: m.echo * 0.8, // ECHO
    reverb: m.space * 0.9, // SPACE
  };
}
