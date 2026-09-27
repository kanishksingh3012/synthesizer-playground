import * as Tone from 'tone';
import { useStore } from '../state/store';
import { ensureAudio } from './live';

// Mechanical "feel" sounds for the controls. They go straight to the speakers, never through the
// synth's master bus — and export renders its own offline graph — so they can't end up in a song.

export type UiSound = 'keyDown' | 'keyUp' | 'button' | 'step' | 'latch' | 'tick';

interface Voice {
  noise: Tone.NoiseSynth;
  filter: Tone.Filter;
  body?: Tone.MembraneSynth;
}

let voices: Record<UiSound, Voice> | null = null;
let lastTick = 0;

// Levels measured on the output: clicks peak ~6–10 dB under a kick hit (softer key-up and detent tick).
const SPEC: Record<UiSound, { type: BiquadFilterType; freq: number; decay: number; db: number; body?: number }> = {
  keyDown: { type: 'bandpass', freq: 2600, decay: 0.014, db: -7, body: 140 }, // plastic key clack
  keyUp: { type: 'bandpass', freq: 3600, decay: 0.008, db: -9 }, // softer return
  button: { type: 'lowpass', freq: 900, decay: 0.03, db: -8, body: 190 }, // rubber thock
  step: { type: 'bandpass', freq: 1900, decay: 0.012, db: 0 },
  latch: { type: 'bandpass', freq: 1500, decay: 0.02, db: -8, body: 110 }, // PLAY latch (2 clicks)
  tick: { type: 'highpass', freq: 4200, decay: 0.004, db: -13 }, // knob detent
};

function build(): Record<UiSound, Voice> {
  const out = new Tone.Gain(1).toDestination();
  const make = (k: UiSound): Voice => {
    const s = SPEC[k];
    const filter = new Tone.Filter({ type: s.type, frequency: s.freq, Q: 1.2 }).connect(out);
    const noise = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: s.decay, sustain: 0 }, volume: s.db }).connect(filter);
    const body = s.body
      ? new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 1.5, envelope: { attack: 0.001, decay: s.decay * 1.6, sustain: 0 }, volume: s.db - 4 }).connect(out)
      : undefined;
    return { noise, filter, body };
  };
  return { keyDown: make('keyDown'), keyUp: make('keyUp'), button: make('button'), step: make('step'), latch: make('latch'), tick: make('tick') };
}

const jitter = () => 0.95 + Math.random() * 0.1; // ±5 % so repeated hits don't sound machine-gunned

function trigger(v: Voice, k: UiSound, t: number) {
  const s = SPEC[k];
  try {
    v.filter.frequency.setValueAtTime(s.freq * jitter(), t);
    v.noise.triggerAttackRelease(s.decay, t, jitter());
    if (v.body && s.body) v.body.triggerAttackRelease(s.body * jitter(), s.decay * 1.6, t, jitter() * 0.8);
  } catch {
    /* same-instant retrigger on a monophonic voice: drop it */
  }
}

export function uiSound(k: UiSound) {
  if (!useStore.getState().uiSound) return;
  if (k === 'tick') {
    const now = performance.now();
    if (now - lastTick < 33) return; // ~30 ticks/s max while spinning a knob
    lastTick = now;
  }
  void ensureAudio().then(() => {
    voices ??= build();
    const t = Tone.now();
    trigger(voices[k], k, t);
    if (k === 'latch') trigger(voices[k], k, t + 0.018);
  });
}
