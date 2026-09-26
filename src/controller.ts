import { DRUMS, STEPS, emptyNotes, useStore, type MacroKey, type Track } from './state/store';
import { SOUNDS } from './audio/sounds';
import { hitDrum, noteOff, noteOn, play, stop } from './audio/live';

// Every control action lives here, so the 3D synth, the computer keyboard and any 2D UI behave identically.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const S = () => useStore.getState();
const set = (p: Parameters<ReturnType<typeof S>['set']>[0]) => S().set(p);
const flash = (id: string) => set({ flashes: { ...S().flashes, [id]: performance.now() } });

export const keyNote = (i: number) => `${NOTE_NAMES[i % 12]}${S().keyOctave + Math.floor(i / 12)}`;

/** Plays key i; on the NOTES track with a step selected, also writes the note into that step. Returns the note held. */
export function pressKey(i: number): string | undefined {
  const s = S();
  const note = keyNote(i);
  if (s.pressed.includes(note)) return undefined;
  set({ pressed: [...s.pressed, note], lastNote: note });
  void noteOn(note);
  if (s.selectedTrack === 'notes' && s.cursor >= 0) {
    const notes = s.notes.map((n) => [...n]);
    const cell = notes[s.cursor];
    const at = cell.indexOf(note);
    if (at >= 0) cell.splice(at, 1);
    else cell.push(note);
    set({ notes, cursor: (s.cursor + 1) % STEPS });
  }
  return note;
}

export function releaseNote(note: string) {
  set({ pressed: S().pressed.filter((n) => n !== note) });
  noteOff(note);
}

export function tapTrack(t: Track) {
  flash(`track_${t}`);
  set({ selectedTrack: t, cursor: -1 });
  if (t !== 'notes') {
    set({ padHits: { ...S().padHits, [t]: performance.now() } });
    void hitDrum(t);
  }
}

export function tapStep(i: number) {
  flash(`step_${i}`);
  const s = S();
  if (s.selectedTrack === 'notes') {
    // first click selects the step for writing, second click clears it
    if (s.cursor === i) set({ notes: s.notes.map((n, j) => (j === i ? [] : n)), cursor: -1 });
    else set({ cursor: i });
    return;
  }
  const row = DRUMS.indexOf(s.selectedTrack);
  set({ drums: s.drums.map((r, ri) => (ri === row ? r.map((v, j) => (j === i ? !v : v)) : r)) });
}

export function togglePlay() {
  flash('btn_play');
  if (S().playing) stop();
  else void play();
}

export function nextSound() {
  flash('btn_sound');
  set({ soundIndex: (S().soundIndex + 1) % SOUNDS.length });
}

export function clearTrack() {
  flash('btn_clear');
  const s = S();
  if (s.selectedTrack === 'notes') {
    set({ notes: emptyNotes(), cursor: -1 });
    return;
  }
  const row = DRUMS.indexOf(s.selectedTrack);
  set({ drums: s.drums.map((r, ri) => (ri === row ? r.map(() => false) : r)) });
}

export function shiftOctave(d: -1 | 1) {
  flash(d < 0 ? 'btn_oct0' : 'btn_oct1');
  set({ keyOctave: Math.min(6, Math.max(1, S().keyOctave + d)) });
}

export function setMacro(k: MacroKey, v: number) {
  const value = Math.min(1, Math.max(0, v));
  set({ macros: { ...S().macros, [k]: value }, popup: { label: k.toUpperCase(), value, until: performance.now() + 1000 } });
}
