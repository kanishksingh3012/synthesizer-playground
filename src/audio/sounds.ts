import type { MacroKey, Macros } from '../state/store';
import type { SynthParams } from './graph';

/** The 4 ready-made sounds behind the SOUND button; expert settings are fixed per sound. */
export const SOUNDS = [
  { name: 'BASS', osc: 'sawtooth', attack: 0.003, sustain: 0.25, resonance: 8, volume: -8 },
  { name: 'KEYS', osc: 'triangle', attack: 0.005, sustain: 0.35, resonance: 1, volume: -6 },
  { name: 'LEAD', osc: 'square', attack: 0.01, sustain: 0.6, resonance: 3, volume: -14 },
  { name: 'PAD', osc: 'sawtooth', attack: 0.4, sustain: 0.7, resonance: 1, volume: -9 },
] as const;

/** Detent count per knob: PITCH clicks in semitones (±12), the others in 40 steps. */
export const detentsOf = (k: MacroKey) => (k === 'pitch' ? 24 : 40);
export const semitones = (pitch: number) => Math.round((pitch - 0.5) * 24);

/** Maps the plain-language knobs onto engine parameters. Every knob changes the drums too, except PITCH. */
export function toParams(soundIndex: number, m: Macros): SynthParams {
  const s = SOUNDS[soundIndex];
  const dark = Math.min(1, m.tone / 0.5); // left half of TONE closes a low-pass on the whole mix
  return {
    osc: s.osc,
    attack: s.attack,
    sustain: s.sustain,
    resonance: s.resonance,
    volume: s.volume,
    cutoff: 150 * Math.pow(100, m.tone), // TONE: synth filter 150 Hz .. 15 kHz
    mixCutoff: 500 * Math.pow(40, dark), // 500 Hz .. 20 kHz (open from the middle up)
    mixShelf: Math.max(0, m.tone - 0.5) * 16, // right half adds up to +8 dB of sparkle
    decay: 0.05 + m.length * 1.5, // LENGTH: short -> long notes
    release: 0.05 + m.length * 2.5,
    drumLength: m.length <= 0.3 ? 0.35 + (0.65 * m.length) / 0.3 : 1 + ((m.length - 0.3) / 0.7) * 2, // 0.35x .. 1x (default) .. 3x
    echo: m.echo,
    space: m.space,
    transpose: semitones(m.pitch),
  };
}
