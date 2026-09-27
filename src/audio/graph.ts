import * as Tone from 'tone';
import { DRUMS, type Drum, type Grid } from '../state/store';

export type OscType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface SynthParams {
  osc: OscType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  cutoff: number;
  resonance: number;
  delay: number;
  reverb: number;
  volume: number;
}

export interface Graph {
  synth: Tone.PolySynth;
  master: Tone.Gain;
  drums: Record<Drum, (time: number) => void>;
  ready: Promise<void>;
  apply: (p: SynthParams) => void;
  setVolume: (v: number) => void;
  dispose: () => void;
}

// Monophonic drum voices throw if retriggered at the exact same time (live pad + sequencer).
const safe = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* dropped duplicate hit */
  }
};

/**
 * Builds the full signal chain in the current Tone context. Used for both live playback
 * and Tone.Offline export, so the exported file sounds identical to what you hear.
 */
export function buildGraph(p: SynthParams): Graph {
  const limiter = new Tone.Limiter(-1).toDestination();
  const comp = new Tone.Compressor(-14, 3).connect(limiter);
  const master = new Tone.Gain(1).connect(comp);

  const reverb = new Tone.Reverb({ decay: 2.8, preDelay: 0.01, wet: p.reverb }).connect(master);
  const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.35, wet: p.delay }).connect(reverb);
  const filter = new Tone.Filter({ frequency: p.cutoff, Q: p.resonance, type: 'lowpass', rolloff: -24 }).connect(delay);
  const synth = new Tone.PolySynth(Tone.Synth).connect(filter);

  const drumBus = new Tone.Gain(Tone.dbToGain(-3)).connect(master);
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 } }).connect(drumBus);
  const snareHp = new Tone.Filter(1200, 'highpass').connect(drumBus);
  const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(snareHp);
  const hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.06, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -16 }).connect(drumBus);
  const clapBp = new Tone.Filter({ frequency: 1400, type: 'bandpass', Q: 1 }).connect(drumBus);
  const clap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: 2 }).connect(clapBp);
  const tom = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(drumBus);
  const perc = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 }, volume: -14 }).connect(drumBus);

  const apply = (q: SynthParams) => {
    synth.set({
      oscillator: { type: q.osc },
      envelope: { attack: q.attack, decay: q.decay, sustain: q.sustain, release: q.release },
    });
    synth.volume.value = q.volume;
    filter.frequency.rampTo(q.cutoff, 0.03);
    filter.Q.value = q.resonance;
    delay.wet.value = q.delay;
    reverb.wet.value = q.reverb;
  };
  apply(p);

  const nodes = [limiter, comp, master, reverb, delay, filter, synth, drumBus, kick, snareHp, snare, hat, clapBp, clap, tom, perc];

  return {
    synth,
    master,
    ready: reverb.ready,
    apply,
    setVolume: (v) => master.gain.rampTo(v * v * 1.4, 0.05),
    drums: {
      kick: (t) => safe(() => kick.triggerAttackRelease('C1', '8n', t)),
      snare: (t) => safe(() => snare.triggerAttackRelease('16n', t)),
      hat: (t) => safe(() => hat.triggerAttackRelease(250, '32n', t)),
      clap: (t) => safe(() => clap.triggerAttackRelease('16n', t)),
      tom: (t) => safe(() => tom.triggerAttackRelease('G2', '8n', t)),
      perc: (t) => safe(() => perc.triggerAttackRelease('A5', '32n', t)),
    },
    dispose: () => nodes.forEach((n) => n.dispose()),
  };
}

export interface PatternSnapshot {
  notes: string[][];
  drums: Grid;
}

/** Triggers everything on one sequencer step. Shared by live transport and offline export. */
export function playStep(g: Graph, s: PatternSnapshot, step: number, time: number, stepDur: number): Drum[] {
  s.notes[step]?.forEach((n) => g.synth.triggerAttackRelease(n, stepDur * 0.9, time));
  const hits: Drum[] = [];
  s.drums.forEach((row, r) => {
    if (row[step]) {
      g.drums[DRUMS[r]](time);
      hits.push(DRUMS[r]);
    }
  });
  return hits;
}
