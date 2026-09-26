import * as Tone from 'tone';
import { STEPS, useStore, type Drum } from '../state/store';
import { buildGraph, playStep, type Graph } from './graph';

let graph: Graph | null = null;
let waveform: Tone.Waveform | null = null;
let starting: Promise<Graph> | null = null;

export const getWaveform = () => waveform;

/** Browsers only allow audio after a user gesture; every entry point goes through here. */
export function ensureAudio(): Promise<Graph> {
  if (graph) return Promise.resolve(graph);
  starting ??= (async () => {
    await Tone.start();
    const st = useStore.getState();
    const g = buildGraph(st.params);
    waveform = new Tone.Waveform(512);
    g.master.connect(waveform);

    const transport = Tone.getTransport();
    const syncTransport = () => {
      const { bpm, swing } = useStore.getState();
      transport.bpm.value = bpm;
      transport.swing = swing;
      transport.swingSubdivision = '16n';
    };
    syncTransport();

    new Tone.Sequence(
      (time, step) => {
        const s = useStore.getState();
        const hits = playStep(g, s, step, time, Tone.Time('16n').toSeconds());
        Tone.getDraw().schedule(() => {
          useStore.setState({ currentStep: step });
          hits.forEach((d) => useStore.getState().hitPad(d));
        }, time);
      },
      [...Array(STEPS).keys()],
      '16n',
    ).start(0);

    useStore.subscribe((s, prev) => {
      if (s.params !== prev.params) g.apply(s.params);
      if (s.bpm !== prev.bpm || s.swing !== prev.swing) syncTransport();
    });

    graph = g;
    useStore.setState({ audioReady: true });
    return g;
  })();
  return starting;
}

export async function noteOn(note: string) {
  useStore.getState().press(note);
  const g = await ensureAudio();
  g.synth.triggerAttack(note, Tone.now());
}

export function noteOff(note: string) {
  if (!useStore.getState().pressed.includes(note)) return;
  useStore.getState().release(note);
  graph?.synth.triggerRelease(note, Tone.now());
}

export async function hitDrum(d: Drum) {
  useStore.getState().hitPad(d);
  const g = await ensureAudio();
  g.drums[d](Tone.now());
}

export async function play() {
  await ensureAudio();
  Tone.getTransport().start('+0.05');
  useStore.setState({ playing: true });
}

export function stop() {
  Tone.getTransport().stop();
  useStore.setState({ playing: false, currentStep: -1 });
}
