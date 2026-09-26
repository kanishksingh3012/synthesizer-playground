import * as THREE from 'three';
import { KNOBS } from '../state/controls';
import { BODY, KEY, OLED, PAD, knobPos, padPos, stepPos } from './layout';

const PX = 256; // texture pixels per world unit
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const INK = '#50555e';
const INK_SOFT = '#7c818a';

/** Silkscreen print for the top panel: labels, section marks, screws, wordmark, speaker grille. */
export function createPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = BODY.w * PX;
  canvas.height = Math.round(BODY.d * PX);
  const ctx = canvas.getContext('2d')!;
  const X = (x: number) => (x + BODY.w / 2) * PX;
  const Z = (z: number) => (z + BODY.d / 2) * PX;

  const text = (s: string, x: number, z: number, size: number, opts: { color?: string; weight?: number; align?: CanvasTextAlign; spacing?: number } = {}) => {
    ctx.font = `${opts.weight ?? 600} ${size}px ${FONT}`;
    ctx.fillStyle = opts.color ?? INK;
    ctx.textAlign = opts.align ?? 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${opts.spacing ?? 3}px`;
    ctx.fillText(s, X(x), Z(z));
  };
  const rrect = (x0: number, z0: number, x1: number, z1: number, r: number, fill: string) => {
    ctx.beginPath();
    ctx.roundRect(X(x0), Z(z0), (x1 - x0) * PX, (z1 - z0) * PX, r * PX);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  // Recessed wells behind keys and pads: dark gaps between caps.
  const keysL = KEY.x0 - KEY.pitch / 2 - 0.04;
  const keysR = KEY.x0 + 14 * KEY.pitch + KEY.pitch / 2 + 0.04;
  rrect(keysL, KEY.sharpZ - KEY.d / 2 - 0.06, keysR, KEY.naturalZ + KEY.d / 2 + 0.06, 0.05, '#2a2c31');
  rrect(padPos(0)[0] - PAD.size / 2 - 0.06, KEY.sharpZ - PAD.size / 2 - 0.06, padPos(2)[0] + PAD.size / 2 + 0.06, KEY.naturalZ + PAD.size / 2 + 0.06, 0.05, '#2a2c31');

  // OLED bezel.
  rrect(OLED.x - OLED.w / 2 - 0.07, OLED.z - OLED.d / 2 - 0.07, OLED.x + OLED.w / 2 + 0.07, OLED.z + OLED.d / 2 + 0.07, 0.06, '#1a1b1f');

  // Knob labels + group marks.
  KNOBS.forEach((k, i) => {
    const [x, z] = knobPos(i);
    text(k.label.toUpperCase(), x, z + 0.37, 20);
  });

  // Step numbers under every 4th dot.
  [0, 4, 8, 12, 15].forEach((i) => text(String(i + 1), stepPos(i)[0], stepPos(i)[1] + 0.14, 16, { color: INK_SOFT, spacing: 1 }));

  // Wordmark + speaker grille on the front strip.
  const frontZ = BODY.d / 2 - 0.2;
  text('SYN-01', -3.72, frontZ, 40, { weight: 800, color: '#2b2e33', align: 'left', spacing: 2 });
  text('SYNTHESIZER PLAYGROUND', -2.62, frontZ + 0.01, 19, { align: 'left', color: INK, spacing: 5 });
  ctx.fillStyle = '#8d929a';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 24; c++) {
      ctx.beginPath();
      ctx.arc(X(2.35 + c * 0.06 + (r % 2) * 0.03), Z(frontZ - 0.06 + r * 0.06), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Corner screws.
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const x = X(sx * (BODY.w / 2 - 0.12));
      const z = Z(sz * (BODY.d / 2 - 0.12));
      ctx.beginPath();
      ctx.arc(x, z, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#b4b8bf';
      ctx.fill();
      ctx.strokeStyle = '#7e838b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 6, z - 6);
      ctx.lineTo(x + 6, z + 6);
      ctx.moveTo(x + 6, z - 6);
      ctx.lineTo(x - 6, z + 6);
      ctx.stroke();
    }),
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/** Small printed name for the top of a drum pad cap. */
export function createCapLabel(name: string): THREE.CanvasTexture {
  const canvas = Object.assign(document.createElement('canvas'), { width: 128, height: 128 });
  const ctx = canvas.getContext('2d')!;
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = '#5a5f68';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '3px';
  ctx.fillText(name.toUpperCase(), 64, 100);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
