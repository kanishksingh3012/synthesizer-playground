// What each tutorial lesson asks the learner to do: how to tell it's done, and how "Show me" does it for them.
// Everything goes through the controller, so "Show me" presses the real synth (with its sounds and motion).
import { DRUMS, bpmOf, emptyGrid, useStore, type PlaygroundState, type Track } from '../state/store';
import { clearTrack, pressKey, releaseNote, setMacro, shiftOctave, tapStep, tapTrack, togglePlay, nextSound } from '../controller';
import type { Recipe } from './recipes';

type S = PlaygroundState;
interface Task {
  done?: (s: S, base: S) => boolean;
  showMe?: () => void;
}

const S = () => useStore.getState();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const row = (s: S, d: (typeof DRUMS)[number]) => s.drums[DRUMS.indexOf(d)];
const has = (s: S, d: (typeof DRUMS)[number], steps: number[]) => steps.every((i) => row(s, d)[i - 1]);
const pitchClass = (n: string) => n.replace(/-?\d+$/, '');
const noteCount = (s: S) => s.notes.reduce((a, c) => a + c.length, 0);

/** Select a drum track and switch on the given steps (leaves steps that are already on alone). */
async function fill(track: Track, steps: number[]) {
  tapTrack(track);
  for (const i of steps) {
    await wait(160);
    if (!row(S(), track as (typeof DRUMS)[number])[i - 1]) tapStep(i - 1);
  }
}

async function tap(key: number, hold = 200) {
  const note = pressKey(key);
  await wait(hold);
  if (note) releaseNote(note);
}

/** Write notes: [step (1-based), keyboard key index] pairs on the NOTES track. */
async function writeNotes(pairs: [number, number][]) {
  tapTrack('notes');
  for (const [step, key] of pairs) {
    await wait(220);
    if (S().cursor !== step - 1) tapStep(step - 1);
    await wait(120);
    await tap(key, 180);
  }
}

/** Turn a knob smoothly through a list of positions (so you can hear it move). */
async function sweep(k: Parameters<typeof setMacro>[0], stops: number[], ms = 700) {
  for (const to of stops) {
    const from = S().macros[k];
    for (let t = 1; t <= 14; t++) {
      setMacro(k, from + ((to - from) * t) / 14);
      await wait(ms / 14);
    }
  }
}

const play = () => {
  if (!S().playing) togglePlay();
};

export const TASKS: Record<string, Task> = {
  loop: { done: (s) => s.playing, showMe: play },
  kick: { done: (s) => has(s, 'kick', [1, 5, 9, 13]), showMe: () => void fill('kick', [1, 5, 9, 13]) },
  clap: { done: (s) => has(s, 'clap', [5, 13]), showMe: () => void fill('clap', [5, 13]) },
  hats: { done: (s) => has(s, 'hat', [3, 7, 11, 15]), showMe: () => void fill('hat', [3, 7, 11, 15]) },
  keyboard: {
    done: (s, b) => s.lastNote !== b.lastNote,
    showMe: async () => {
      for (const k of [0, 2, 4, 5, 7, 9, 11, 12]) await tap(k, 220);
    },
  },
  octaves: {
    done: (s, b) => s.keyOctave !== b.keyOctave,
    showMe: async () => {
      shiftOctave(1);
      await wait(200);
      await tap(0, 300);
      shiftOctave(-1);
      await wait(150);
      shiftOctave(-1);
      await wait(200);
      await tap(0, 300);
    },
  },
  'write-notes': {
    done: (s, b) => noteCount(s) >= noteCount(b) + 4,
    showMe: () => void writeNotes([[1, 0], [2, 4], [3, 7], [4, 4]]),
  },
  chords: {
    done: (s) => (['C', 'E', 'G', 'E'] as const).every((n, i) => s.notes[i * 4].some((x) => pitchClass(x) === n)),
    showMe: async () => {
      tapTrack('notes');
      await wait(150);
      clearTrack();
      await writeNotes([[1, 0], [5, 4], [9, 7], [13, 4]]);
    },
  },
  sound: { done: (s, b) => s.soundIndex !== b.soundIndex, showMe: () => nextSound() },
  tone: { done: (s, b) => Math.abs(s.macros.tone - b.macros.tone) > 0.2, showMe: () => void sweep('tone', [0.08, 0.95, 0.5], 1200) },
  length: { done: (s, b) => Math.abs(s.macros.length - b.macros.length) > 0.15, showMe: () => void sweep('length', [0.05, 0.9, 0.3], 1000) },
  'echo-space': {
    done: (s, b) => s.macros.echo - b.macros.echo > 0.1 || s.macros.space - b.macros.space > 0.1,
    showMe: async () => {
      await sweep('echo', [0.5], 700);
      await sweep('space', [0.45], 700);
    },
  },
  'speed-pitch': {
    done: (s, b) => Math.abs(bpmOf(s.macros.speed) - bpmOf(b.macros.speed)) >= 6 || s.macros.pitch !== b.macros.pitch,
    showMe: async () => {
      await sweep('speed', [0.25, 0.5333], 1000);
      await sweep('pitch', [0.5 + 5 / 24, 0.5], 900);
    },
  },
};

/** Replace the drum tracks with a recipe and set its speed. */
export function loadRecipe(r: Recipe) {
  const drums = emptyGrid(DRUMS.length);
  const put = (d: (typeof DRUMS)[number], steps?: number[]) => steps?.forEach((i) => (drums[DRUMS.indexOf(d)][i - 1] = true));
  put('kick', r.kick);
  put('snare', r.snare);
  put('clap', r.clap);
  put('hat', r.hat);
  S().set({ drums, macros: { ...S().macros, speed: (r.bpm - 60) / 120 }, selectedTrack: 'kick', cursor: -1 });
  play();
}
