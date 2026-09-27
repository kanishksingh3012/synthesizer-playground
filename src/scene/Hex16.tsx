import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { DRUMS, TRACKS, useStore, type MacroKey, type Track } from '../state/store';
import { clearTrack, keyNote, nextSound, pressKey, releaseNote, setMacro, shiftOctave, tapStep, tapTrack, togglePlay } from '../controller';
import { createScreen } from './screenTexture';
import { detentsOf } from '../audio/sounds';
import { Spring, reducedMotion } from './spring';

const MODEL = '/models/hex16.glb';
const CONTROL = /^(key_\d+|step_\d+|track_(kick|snare|hat|clap|notes)|btn_(play|sound|clear|oct0|oct1)|knob_(speed|volume|pitch|tone|length|echo|space))$/;
const TRAVEL = 0.03; // press depth (model units)
const HOVER_LIFT = 0.006;

const controlOf = (o: THREE.Object3D | null): THREE.Object3D | null => {
  for (let n = o; n; n = n.parent) if (CONTROL.test(n.name)) return n;
  return null;
};
const knobAngle = (v: number) => (0.75 - v * 1.5) * Math.PI;

/** The HEX-16 model (baked by blender/bake_hex16.py), wired to the controller by node name. */
export function Hex16() {
  const { scene } = useGLTF(MODEL);
  const maxAnisotropy = useThree((st) => st.gl.capabilities.getMaxAnisotropy());
  // Setup mutates the shared glTF scene, so it runs once per scene (StrictMode double-invokes memos).
  const rig = useMemo(() => {
    if (scene.userData.rig) return scene.userData.rig as ReturnType<typeof setup>;
    return (scene.userData.rig = setup());
  }, [scene]);

  function setup() {
    const screen = createScreen();
    const movers: { obj: THREE.Object3D; y0: number; spring: Spring }[] = [];
    const keys: THREE.Object3D[] = [];
    const leds: THREE.MeshStandardMaterial[] = [];
    const knobs: Partial<Record<MacroKey, { obj: THREE.Object3D; spring: Spring }>> = {};
    const rims: Partial<Record<Track, THREE.MeshStandardMaterial>> = {};
    const hints: THREE.Object3D[] = [];
    const baked = new Map<THREE.Material, THREE.MeshBasicMaterial>();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      let m: RegExpExecArray | null;
      const src = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mesh.isMesh && src?.name === 'baked' && src.map) {
        // Cycles already baked light, shadows and the display transform into this texture: show it unlit
        if (!baked.has(src)) {
          src.map.anisotropy = maxAnisotropy;
          baked.set(src, new THREE.MeshBasicMaterial({ map: src.map, toneMapped: false }));
        }
        mesh.material = baked.get(src)!;
      }
      if (CONTROL.test(o.name) && !o.name.startsWith('knob_')) movers.push({ obj: o, y0: o.position.y, spring: new Spring(0) });
      if ((m = /^key_(\d+)$/.exec(o.name))) keys[+m[1]] = o;
      if ((m = /^knob_(\w+)$/.exec(o.name))) knobs[m[1] as MacroKey] = { obj: o, spring: new Spring(o.rotation.y, 700, 45) };
      if ((m = /^led_(\d+)$/.exec(o.name)) && mesh.isMesh) {
        leds[+m[1]] = mesh.material = new THREE.MeshStandardMaterial({ color: '#160302', emissive: '#ff2a14', roughness: 0.25, toneMapped: false });
      }
      if ((m = /^track_(\w+)_rim$/.exec(o.name)) && mesh.isMesh) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        const e = mat.emissive;
        e.multiplyScalar(1 / Math.max(e.r, e.g, e.b, 1e-6)); // export bakes strength into the colour; keep pure hue
        mat.toneMapped = false;
        rims[m[1] as Track] = mesh.material = mat;
      }
      if (/^track_(kick|snare|hat|clap|notes)$/.test(o.name) && mesh.isMesh) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.emissiveIntensity = 0; // selection glow is driven by the rim at runtime
        mesh.material = mat;
      }
      if (o.name.startsWith('hint_')) hints.push(o);
      if (o.name === 'screen' && mesh.isMesh) {
        mesh.material = new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false, color: new THREE.Color(2.2, 2.2, 2.2) });
      }
      if (mesh.isMesh && !controlOf(o)) mesh.raycast = () => {}; // labels, LEDs, case: clicks fall through to controls
    });
    const ledLevel = leds.map(() => 0);
    return { movers, keys, leds, ledLevel, knobs, rims, hints, screen };
  }

  const held = useRef<{ id: string; note?: string } | null>(null);
  const hovered = useRef<string | null>(null);
  const instant = useMemo(reducedMotion, []);

  useEffect(() => {
    const up = () => {
      if (held.current?.note) releaseNote(held.current.note);
      held.current = null;
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  useFrame((_, delta) => {
    const s = useStore.getState();
    const now = performance.now();
    const dt = Math.min(delta, 1 / 30);
    for (const { obj, y0, spring } of rig.movers) {
      const i = /^key_(\d+)$/.exec(obj.name);
      const down = i ? s.pressed.includes(keyNote(+i[1])) : held.current?.id === obj.name || now - (s.flashes[obj.name] ?? 0) < 110;
      const pad = /^track_(kick|snare|hat|clap)$/.exec(obj.name);
      const bump = pad ? Math.max(0, 1 - (now - s.padHits[pad[1] as (typeof DRUMS)[number]]) / 120) * 0.4 : 0; // pads bounce with the beat
      const target = down ? -TRAVEL : -TRAVEL * bump + (hovered.current === obj.name ? HOVER_LIFT : 0);
      obj.position.y = y0 + spring.step(target, dt, instant);
    }
    (Object.keys(rig.knobs) as MacroKey[]).forEach((k) => {
      const { obj, spring } = rig.knobs[k]!;
      const n = detentsOf(k);
      obj.rotation.y = spring.step(knobAngle(Math.round(s.macros[k] * n) / n), dt, instant); // snaps to detents
    });
    const row = DRUMS.indexOf(s.selectedTrack as (typeof DRUMS)[number]);
    rig.leds.forEach((mat, i) => {
      const on = s.selectedTrack === 'notes' ? s.notes[i].length > 0 : s.drums[row][i];
      const cursor = s.selectedTrack === 'notes' && s.cursor === i;
      const target = i === s.currentStep ? 7 : cursor ? (Math.floor(now / 250) % 2 ? 5 : 0.4) : on ? 2.2 : 0;
      const tau = target > rig.ledLevel[i] ? 0.03 : 0.18; // fast rise, slow bulb-like decay
      rig.ledLevel[i] += (target - rig.ledLevel[i]) * (instant ? 1 : 1 - Math.exp(-dt / tau));
      mat.emissiveIntensity = rig.ledLevel[i];
    });
    TRACKS.forEach((t) => {
      const mat = rig.rims[t];
      if (!mat) return;
      const hit = t === 'notes' ? 0 : Math.max(0, 1 - (now - s.padHits[t]) / 220);
      mat.emissiveIntensity = (t === s.selectedTrack ? 7 : 0.15) + hit * 8;
    });
    rig.hints.forEach((h) => (h.visible = s.showKeys));
    rig.screen.draw(s, now);
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    const c = controlOf(e.object);
    if (!c) return;
    e.stopPropagation();
    const id = c.name;
    held.current = { id };
    let m: RegExpExecArray | null;
    if ((m = /^key_(\d+)$/.exec(id))) held.current.note = pressKey(+m[1]);
    else if ((m = /^step_(\d+)$/.exec(id))) tapStep(+m[1]);
    else if ((m = /^track_(\w+)$/.exec(id))) tapTrack(m[1] as Track);
    else if (id === 'btn_play') togglePlay();
    else if (id === 'btn_sound') nextSound();
    else if (id === 'btn_clear') clearTrack();
    else if (id === 'btn_oct0' || id === 'btn_oct1') shiftOctave(id === 'btn_oct0' ? -1 : 1);
    else if ((m = /^knob_(\w+)$/.exec(id))) {
      const k = m[1] as MacroKey;
      const startY = e.nativeEvent.clientY;
      const startV = useStore.getState().macros[k];
      const move = (ev: PointerEvent) => setMacro(k, startV + (startY - ev.clientY) / 180);
      const stopDrag = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stopDrag);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stopDrag);
    }
  };

  const onWheel = (e: ThreeEvent<WheelEvent>) => {
    const m = /^knob_(\w+)$/.exec(controlOf(e.object)?.name ?? '');
    if (!m) return;
    e.stopPropagation();
    const k = m[1] as MacroKey;
    const v = useStore.getState().macros[k];
    if (k === 'pitch') {
      if (Math.abs(e.deltaY) >= 4) setMacro(k, (Math.round(v * 24) - Math.sign(e.deltaY)) / 24); // one semitone per notch
    } else setMacro(k, v - e.deltaY * 0.0012);
  };

  return (
    <primitive
      object={scene}
      onPointerDown={onDown}
      onWheel={onWheel}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        const c = controlOf(e.object);
        hovered.current = c?.name ?? null;
        document.body.style.cursor = c ? 'pointer' : '';
      }}
      onPointerOut={() => {
        hovered.current = null;
        document.body.style.cursor = '';
      }}
    />
  );
}

useGLTF.preload(MODEL);
