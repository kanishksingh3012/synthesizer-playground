import * as THREE from 'three';
import { DRUMS, STEPS, bpmOf, type PlaygroundState } from '../state/store';
import { SOUNDS, semitones } from '../audio/sounds';

// 5x7 dot-matrix glyphs ('#' = lit), same font as the Blender design renders.
const G: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
};

const W = 140;
const H = 32;
const PX = 6;

/** Red graphic dot-matrix screen: track · sound · BPM / octave · note (or knob value) / step map. */
export function createScreen() {
  const canvas = Object.assign(document.createElement('canvas'), { width: W * PX, height: H * PX });
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false; // glTF UV convention
  texture.colorSpace = THREE.SRGBColorSpace;
  let last = '';

  const draw = (s: PlaygroundState, now: number) => {
    const popup = s.popup && s.popup.until > now ? s.popup : null;
    const blink = Math.floor(now / 250) % 2;
    const row = DRUMS.indexOf(s.selectedTrack as (typeof DRUMS)[number]);
    const on = (i: number) => (s.selectedTrack === 'notes' ? s.notes[i].length > 0 : s.drums[row][i]);
    const key = JSON.stringify([s.selectedTrack, s.soundIndex, s.macros.speed, s.macros.pitch, s.keyOctave, s.lastNote, s.cursor, s.currentStep,
      popup && [popup.label, popup.value], s.cursor >= 0 && blink, [...Array(STEPS).keys()].map(on)]);
    if (key === last) return;
    last = key;

    const lit = new Set<number>();
    const dot = (x: number, y: number) => lit.add(y * W + x);
    const text = (str: string, x: number, y: number) =>
      [...str].forEach((ch, ci) => (G[ch] ?? []).forEach((bits, gy) => [...bits].forEach((b, gx) => b === '#' && dot(x + ci * 6 + gx, y + gy))));

    for (let y = 2; y < 9; y++) [1, 2].forEach((x) => dot(x, y)); // marker bar = selected track
    text(s.selectedTrack.toUpperCase(), 5, 2);
    text(SOUNDS[s.soundIndex].name, 48, 2);
    const bpm = `${bpmOf(s.macros.speed)} BPM`;
    text(bpm, W - bpm.length * 6 - 1, 2);
    const semis = semitones(s.macros.pitch);
    const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
    if (popup?.label === 'PITCH') {
      text(`PITCH ${signed(semitones(popup.value))}`, 2, 12);
    } else if (popup) {
      text(popup.label, 2, 12);
      const cells = Math.round(popup.value * 10);
      for (let c = 0; c < 10; c++) for (let y = 12; y < 19; y++) for (let x = 0; x < 4; x++) if (c < cells || x === 0 || x === 3 || y === 12 || y === 18) dot(62 + c * 6 + x, y);
    } else {
      text(`OCT ${s.keyOctave}`, 2, 12);
      text(s.selectedTrack === 'notes' && s.cursor >= 0 ? `STEP ${s.cursor + 1}` : `NOTE ${s.lastNote}`, 48, 12);
      if (semis) text(`P${signed(semis)}`, W - (signed(semis).length + 1) * 6 - 1, 12); // melody transposed
    }
    let x = 2;
    for (let i = 0; i < STEPS; i++) {
      const fill = on(i) !== (s.cursor === i && blink === 1);
      for (let cx = 0; cx < 7; cx++) for (let cy = 0; cy < 7; cy++) if (fill || cx === 0 || cx === 6 || cy === 0 || cy === 6) dot(x + cx, 22 + cy);
      if (i === s.currentStep) for (let cx = 0; cx < 7; cx++) dot(x + cx, 30);
      x += 8 + (i % 4 === 3 ? 3 : 0);
    }

    ctx.fillStyle = '#0c0202';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const [color, want] of [['#2c0806', false], ['#ff3220', true]] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let y = 0; y < H; y++)
        for (let xx = 0; xx < W; xx++)
          if (lit.has(y * W + xx) === want) {
            ctx.moveTo((xx + 0.5) * PX + PX * 0.4, (y + 0.5) * PX);
            ctx.arc((xx + 0.5) * PX, (y + 0.5) * PX, PX * 0.4, 0, Math.PI * 2);
          }
      ctx.fill();
    }
    texture.needsUpdate = true;
  };
  return { texture, draw };
}
