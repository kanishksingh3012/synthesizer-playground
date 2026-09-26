// World-space layout of the SYN-01 top panel. x: left→right, z: back→front, y: up.
export const BODY = { w: 8, h: 0.28, d: 3.6, lift: 0.03 };
export const TOP = BODY.lift + BODY.h; // y of the top panel surface

export const OLED = { x: -2.6, z: -1.03, w: 2.2, d: 0.95 };

// Two groups of 4 encoders.
export const knobPos = (i: number): [number, number] => [(i < 4 ? -0.95 : -0.65) + i * 0.6, -1.22];
export const KNOB_R = 0.22;
export const KNOB_COLORS = ['#3a6df0', '#3fbf6f', '#f2f2f2', '#ff6a2b'];

export const stepPos = (i: number): [number, number] => [-0.95 + i * 0.3, -0.5];

export const KEY = { pitch: 0.36, w: 0.32, d: 0.6, h: 0.07, x0: -1.42, naturalZ: 1.05, sharpZ: 0.35 };

export const PAD = { size: 0.52 };
export const padPos = (i: number): [number, number] => [-3.5 + (i % 3) * 0.6, i < 3 ? KEY.sharpZ : KEY.naturalZ];
export const PAD_COLORS = ['#ff6a2b', '#3a6df0', '#3fbf6f', '#ffd23f', '#b07cff', '#ff4f8b'];

export interface LabelDef {
  text: string;
  pos: [number, number, number];
  small?: boolean;
}

// Optional "What's this?" helper overlay. Permanent labels are printed on the panel texture.
export const LABELS: LabelDef[] = [
  { text: 'Screen · live waveform', pos: [OLED.x, TOP + 0.35, OLED.z - 0.75] },
  { text: 'Sound knobs · drag ↕', pos: [1.3, TOP + 0.45, -1.75] },
  { text: '16 steps · the loop', pos: [1.3, TOP + 0.2, -0.3] },
  { text: 'Drum pads', pos: [-2.9, TOP + 0.3, 1.75] },
  { text: 'Keys · click or type A–K', pos: [1.18, TOP + 0.3, 1.75] },
];
