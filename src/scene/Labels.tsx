import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { LABELS } from './layout';

// One DOM overlay for all labels, positioned by projecting 3D points each frame.
const els: (HTMLDivElement | null)[] = [];
const v = new THREE.Vector3();

export function LabelProjector() {
  useFrame(({ camera, size }) => {
    LABELS.forEach((l, i) => {
      const el = els[i];
      if (!el) return;
      v.set(...l.pos).project(camera);
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -50%)`;
    });
  });
  return null;
}

export function LabelOverlay() {
  const show = useStore((s) => s.showLabels);
  return (
    <div className="labels" hidden={!show} aria-hidden>
      {LABELS.map((l, i) => (
        <div key={l.text} ref={(e) => void (els[i] = e)} className={l.small ? 'lbl lbl-sm' : 'lbl'}>
          {l.text}
        </div>
      ))}
    </div>
  );
}
