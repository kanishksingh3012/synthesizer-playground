import * as Tone from 'tone';
import { DRUMS, type Drum, type Grid } from '../state/store';

export type OscType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface SynthParams {
  osc: OscType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  cutoff: number; // synth filter
  resonance: number;
  volume: number; // synth level (dB)
  mixCutoff: number; // TONE on the whole mix: low-pass below the middle position...
  mixShelf: number; // ...high-shelf boost (dB) above it
  drumLength: number; // LENGTH on the drums: decay multiplier
  echo: number; // ECHO send 0..1 (synth + drums)
  space: number; // SPACE send 0..1 (synth + drums)
  transpose: number; // PITCH in semitones (melody + keyboard)
}

export interface Graph {
  synth: Tone.PolySynth;
  master: Tone.Gain;
  drums: Record<Drum, (time: number) => void>;
  ready: Promise<void>;
  transpose: number;
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

/** Shifts a note name by whole semitones (PITCH knob). */
export const transposeNote = (note: string, semis: number) => (semis ? Tone.Frequency(note).transpose(semis).toNote() : note);

/**
 * Builds the full signal chain in the current Tone context. Used for both live playback
 * and Tone.Offline export, so the exported file sounds identical to what you hear.
 *
 *   synth -> filter -> synthBus -+-> mix -> tone LP -> tone shelf -> master -> comp -> limiter -> tanh clip
 *   drums ----------> drumBus --+   ^
 *   kick -----------> kickBus --+   | echo + space are sends, so the knobs work on drums as well as notes
 *   *Bus -> echo send -> delay -----+
 *   *Bus -> space send -> reverb ---+
 */
export function buildGraph(p: SynthParams): Graph {
  // Limiter reacts too slowly for drum transients; a tanh soft-clip after it guarantees peaks stay below 0 dBFS.
  const clip = new Tone.WaveShaper((x) => Math.tanh(x), 4096).toDestination();
  const limiter = new Tone.Limiter(-1).connect(clip);
  const comp = new Tone.Compressor(-14, 3).connect(limiter);
  const master = new Tone.Gain(1).connect(comp);
  const shelf = new Tone.Filter({ type: 'highshelf', frequency: 3000 }).connect(master);
  const toneLp = new Tone.Filter({ type: 'lowpass', frequency: 20000, rolloff: -12, Q: 0.5 }).connect(shelf);
  const mix = new Tone.Gain(1).connect(toneLp);

  const reverb = new Tone.Reverb({ decay: 3.2, preDelay: 0.02, wet: 1 }).connect(mix);
  const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: 1 }).connect(mix);
  const echoIn = new Tone.Gain(1).connect(delay);
  const spaceIn = new Tone.Gain(1).connect(reverb);
  const send = (from: Tone.ToneAudioNode, to: Tone.Gain) => {
    const g = new Tone.Gain(0);
    from.connect(g);
    g.connect(to);
    return g;
  };

  const synthBus = new Tone.Gain(1).connect(mix);
  const filter = new Tone.Filter({ frequency: p.cutoff, Q: p.resonance, type: 'lowpass', rolloff: -24 }).connect(synthBus);
  const synth = new Tone.PolySynth(Tone.Synth).connect(filter);

  const drumBus = new Tone.Gain(Tone.dbToGain(-3)).connect(mix);
  const kickBus = new Tone.Gain(Tone.dbToGain(-3)).connect(mix);
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 } }).connect(kickBus);
  const snareHp = new Tone.Filter(1200, 'highpass').connect(drumBus);
  const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(snareHp);
  const hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.06, release: 0.02 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -16 }).connect(drumBus);
  const clapBp = new Tone.Filter({ frequency: 1300, type: 'bandpass', Q: 0.9 }).connect(drumBus);
  const clap = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: 10 }).connect(clapBp);
  const tom = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(drumBus);
  const perc = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 }, volume: -14 }).connect(drumBus);

  const synthEcho = send(synthBus, echoIn);
  const drumEcho = send(drumBus, echoIn);
  const synthSpace = send(synthBus, spaceIn);
  const drumSpace = send(drumBus, spaceIn);
  const kickSpace = send(kickBus, spaceIn);

  let hatLen = 0.06;
  const graph: Graph = {
    synth,
    master,
    ready: reverb.ready,
    transpose: 0,
    apply: (q) => {
      synth.set({
        oscillator: { type: q.osc },
        envelope: { attack: q.attack, decay: q.decay, sustain: q.sustain, release: q.release },
      });
      synth.volume.value = q.volume;
      filter.frequency.rampTo(q.cutoff, 0.03);
      filter.Q.value = q.resonance;
      toneLp.frequency.rampTo(q.mixCutoff, 0.03);
      shelf.gain.rampTo(q.mixShelf, 0.03);
      const f = q.drumLength;
      kick.envelope.decay = 0.4 * f;
      snare.envelope.decay = 0.18 * f;
      clap.envelope.decay = 0.12 * f;
      tom.envelope.decay = 0.3 * f;
      hatLen = 0.06 * f;
      hat.envelope.decay = hatLen;
      // send levels measured offline: at full, echoes/reverb sit a few dB under the dry sound
      synthEcho.gain.rampTo(q.echo * 1.2, 0.03);
      drumEcho.gain.rampTo(q.echo * 0.9, 0.03);
      delay.feedback.rampTo(0.2 + q.echo * 0.35, 0.03);
      synthSpace.gain.rampTo(q.space * 4, 0.03);
      drumSpace.gain.rampTo(q.space * 4, 0.03);
      kickSpace.gain.rampTo(q.space * 0.8, 0.03);
      graph.transpose = q.transpose;
    },
    setVolume: (v) => master.gain.rampTo(v * v, 0.05),
    drums: {
      kick: (t) => safe(() => kick.triggerAttackRelease('C1', '8n', t)),
      snare: (t) => safe(() => snare.triggerAttackRelease('16n', t)),
      hat: (t) => safe(() => hat.triggerAttackRelease(250, hatLen, t)),
      clap: (t) => safe(() => clap.triggerAttackRelease('16n', t)),
      tom: (t) => safe(() => tom.triggerAttackRelease('G2', '8n', t)),
      perc: (t) => safe(() => perc.triggerAttackRelease('A5', '32n', t)),
    },
    dispose: () => nodes.forEach((n) => n.dispose()),
  };
  const nodes = [clip, limiter, comp, master, shelf, toneLp, mix, reverb, delay, echoIn, spaceIn, synthBus, filter, synth, drumBus, kickBus,
    kick, snareHp, snare, hat, clapBp, clap, tom, perc, synthEcho, drumEcho, synthSpace, drumSpace, kickSpace];
  graph.apply(p);
  return graph;
}

export interface PatternSnapshot {
  notes: string[][];
  drums: Grid;
}

/** Triggers everything on one sequencer step. Shared by live transport and offline export. */
export function playStep(g: Graph, s: PatternSnapshot, step: number, time: number, stepDur: number): Drum[] {
  s.notes[step]?.forEach((n) => g.synth.triggerAttackRelease(transposeNote(n, g.transpose), stepDur * 0.9, time));
  const hits: Drum[] = [];
  s.drums.forEach((row, r) => {
    if (row[step]) {
      g.drums[DRUMS[r]](time);
      hits.push(DRUMS[r]);
    }
  });
  return hits;
}
