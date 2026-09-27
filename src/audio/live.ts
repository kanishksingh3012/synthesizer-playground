import * as Tone from 'tone';
import { STEPS, bpmOf, useStore, type Drum } from '../state/store';
import { buildGraph, playStep, transposeNote, type Graph } from './graph';
import { toParams } from './sounds';

let graph: Graph | null = null;
let starting: Promise<Graph> | null = null;

/** Browsers only allow audio after a user gesture; every entry point goes through here. */
export function ensureAudio(): Promise<Graph> {
  if (graph) return Promise.resolve(graph);
  starting ??= (async () => {
    await Tone.start();
    const st = useStore.getState();
    const g = buildGraph(toParams(st.soundIndex, st.macros));
    g.setVolume(st.macros.volume);

    const transport = Tone.getTransport();
    transport.bpm.value = bpmOf(st.macros.speed);

    new Tone.Sequence(
      (time, step) => {
        const hits = playStep(g, useStore.getState(), step, time, Tone.Time('16n').toSeconds());
        Tone.getDraw().schedule(() => {
          const now = performance.now();
          const padHits = { ...useStore.getState().padHits };
          hits.forEach((d) => (padHits[d] = now));
          useStore.setState({ currentStep: step, padHits });
        }, time);
      },
      [...Array(STEPS).keys()],
      '16n',
    ).start(0);

    useStore.subscribe((s, prev) => {
      if (s.soundIndex !== prev.soundIndex || s.macros !== prev.macros) g.apply(toParams(s.soundIndex, s.macros));
      if (s.macros.volume !== prev.macros.volume) g.setVolume(s.macros.volume);
      if (s.macros.speed !== prev.macros.speed) transport.bpm.rampTo(bpmOf(s.macros.speed), 0.05);
    });

    graph = g;
    useStore.setState({ audioReady: true });
    return g;
  })();
  return starting;
}

const sounding = new Map<string, string>(); // key note -> pitch actually playing (PITCH may move while a key is held)

export async function noteOn(note: string) {
  const g = await ensureAudio();
  const played = transposeNote(note, g.transpose);
  sounding.set(note, played);
  g.synth.triggerAttack(played, Tone.now());
}

export function noteOff(note: string) {
  const played = sounding.get(note) ?? note;
  sounding.delete(note);
  graph?.synth.triggerRelease(played, Tone.now());
}

export async function hitDrum(d: Drum) {
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
