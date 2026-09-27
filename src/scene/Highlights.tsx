import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { useStore } from '../state/store';
import { MODEL } from './Hex16';

const PAD = 7; // px around the part

/** Tutorial highlight rings: a pulsing orange outline around each synth part the current lesson talks about. */
export function Highlights() {
  const names = useStore((s) => s.highlight);
  const { scene } = useGLTF(MODEL);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const rings = useRef<(HTMLDivElement | null)[]>([]);
  const box = useMemo(() => new Box3(), []);
  const v = useMemo(() => new Vector3(), []);

  useFrame(() => {
    names.forEach((name, i) => {
      const el = rings.current[i];
      const part = scene.getObjectByName(name);
      if (!el || !part) return;
      box.setFromObject(part);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let c = 0; c < 8; c++) {
        v.set(c & 1 ? box.max.x : box.min.x, c & 2 ? box.max.y : box.min.y, c & 4 ? box.max.z : box.min.z).project(camera);
        const x = ((v.x + 1) / 2) * size.width, y = ((1 - v.y) / 2) * size.height;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      el.style.transform = `translate(${x0 - PAD}px, ${y0 - PAD}px)`;
      el.style.width = `${x1 - x0 + PAD * 2}px`;
      el.style.height = `${y1 - y0 + PAD * 2}px`;
    });
  });

  if (!names.length) return null;
  return (
    <Html fullscreen pointerEvents="none" zIndexRange={[5, 0]}>
      {names.map((n, i) => (
        <div key={n} className="tut-ring" ref={(el) => void (rings.current[i] = el)} />
      ))}
    </Html>
  );
}
