import * as Tone from 'tone';
import { bpmOf, useStore } from '../state/store';
import { buildGraph, playStep } from '../audio/graph';
import { toParams } from '../audio/sounds';

/** Dev-only: renders 2 bars of the current pattern offline and returns level stats (no speakers needed). */
export async function audioCheck() {
  const st = useStore.getState();
  const bpm = bpmOf(st.macros.speed);
  const stepDur = 60 / bpm / 4;
  const len = stepDur * 32;
  const buf = await Tone.Offline(async ({ transport }) => {
    const g = buildGraph(toParams(st.soundIndex, st.macros));
    g.setVolume(st.macros.volume);
    await g.ready;
    transport.bpm.value = bpm;
    new Tone.Sequence((time, step) => playStep(g, st, step, time, stepDur), [...Array(16).keys()], '16n').start(0).stop(len);
    transport.start(0);
  }, len + 1, 2, 44100);
  const ch = buf.getChannelData(0);
  const sr = 44100;
  let sum = 0;
  let peak = 0;
  for (const v of ch) {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const win = (step: number) => {
    let e = 0;
    const a = Math.floor(step * stepDur * sr);
    for (let i = a; i < a + Math.floor(0.03 * sr); i++) e += ch[i] * ch[i];
    return Math.sqrt(e / (0.03 * sr));
  };
  return {
    seconds: +(ch.length / sr).toFixed(2),
    rms: +Math.sqrt(sum / ch.length).toFixed(4),
    peak: +peak.toFixed(3),
    stepOnsetRms: [...Array(16).keys()].map((i) => +win(i).toFixed(3)),
  };
}
