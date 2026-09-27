import { clearTrack, nextSound, pressKey, releaseNote, shiftOctave, tapTrack, togglePlay } from '../controller';
import { useStore, type Track } from '../state/store';

const NOTE_KEYS = 'awsedftgyhujk'; // 13 keys = one octave C..C
const TRACK_KEYS: Record<string, Track> = { z: 'kick', x: 'snare', c: 'hat', v: 'clap', b: 'notes' };

/** Computer-keyboard layer. Knobs are mouse-only (drag / wheel); steps are mouse/touch only. */
export function installKeyboard(): () => void {
  const held = new Map<string, string>();
  const typing = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

  const down = (e: KeyboardEvent) => {
    if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('[role=dialog]')) return; // dialogs own the keyboard (Space/Enter on their buttons)
    if (e.key === '?') {
      useStore.getState().set({ showHelp: !useStore.getState().showHelp });
      return;
    }
    const k = e.key.toLowerCase();
    const i = NOTE_KEYS.indexOf(k);
    if (i >= 0) {
      if (!e.repeat && !held.has(k)) {
        const note = pressKey(i);
        if (note) held.set(k, note);
      }
      return;
    }
    if (e.repeat) return;
    if (k in TRACK_KEYS) tapTrack(TRACK_KEYS[k]);
    else if (k === ' ') {
      e.preventDefault();
      togglePlay();
    } else if (k === 'n') nextSound();
    else if (k === 'backspace') {
      e.preventDefault();
      clearTrack();
    } else if (k === '-') shiftOctave(-1);
    else if (k === '=' || k === '+') shiftOctave(1);
    else if (k === 'escape') useStore.getState().set({ showHelp: false });
  };
  const up = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const note = held.get(k);
    if (note) {
      held.delete(k);
      releaseNote(note);
    }
  };
  const releaseAll = () => {
    held.forEach((n) => releaseNote(n));
    held.clear();
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', releaseAll);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', releaseAll);
  };
}
