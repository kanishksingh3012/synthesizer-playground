import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { DRUMS, STEPS, useStore, type Drum } from '../state/store';
import { KNOBS, fromNorm, toNorm, type ControlDef } from '../state/controls';
import { getWaveform, hitDrum, noteOff, noteOn } from '../audio/live';
import { BODY, KEY, KNOB_COLORS, KNOB_R, OLED, PAD, PAD_COLORS, TOP, knobPos, padPos, stepPos } from './layout';
import { createCapLabel, createPanelTexture } from './panelTexture';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SHARP = new Set([1, 3, 6, 8, 10]);
const ACCENT = '#ff6a2b';
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const hover = {
  onPointerOver: () => void (document.body.style.cursor = 'pointer'),
  onPointerOut: () => void (document.body.style.cursor = ''),
};

function Chassis() {
  const gl = useThree((s) => s.gl);
  const print = useMemo(() => createPanelTexture(gl.capabilities.getMaxAnisotropy()), [gl]);
  useEffect(() => () => print.dispose(), [print]);
  const baseH = 0.08;
  return (
    <group>
      {/* darker anodized base, inset so it reads as a chamfer under the top slab */}
      <RoundedBox args={[BODY.w - 0.08, baseH, BODY.d - 0.08]} radius={0.035} position={[0, BODY.lift + baseH / 2, 0]}>
        <meshStandardMaterial color="#6e737b" metalness={0.8} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[BODY.w, BODY.h - baseH, BODY.d]} radius={0.06} smoothness={5} position={[0, BODY.lift + baseH + (BODY.h - baseH) / 2, 0]}>
        <meshStandardMaterial color="#cfd2d6" metalness={0.85} roughness={0.36} />
      </RoundedBox>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (BODY.w / 2 - 0.5), BODY.lift / 2, sz * (BODY.d / 2 - 0.4)]}>
            <cylinderGeometry args={[0.14, 0.14, BODY.lift, 24]} />
            <meshStandardMaterial color="#1e1f22" roughness={0.9} />
          </mesh>
        )),
      )}
      <mesh rotation-x={-Math.PI / 2} position={[0, TOP + 0.001, 0]}>
        <planeGeometry args={[BODY.w, BODY.d]} />
        <meshStandardMaterial map={print} transparent roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Oled() {
  const W = 512;
  const H = Math.round((W * OLED.d) / OLED.w);
  const canvas = useMemo(() => Object.assign(document.createElement('canvas'), { width: W, height: H }), [H]);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame(({ clock }) => {
    const ctx = canvas.getContext('2d')!;
    const s = useStore.getState();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#eef3ff';
    ctx.font = `700 22px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('SYN-01', 18, 26);
    ctx.textAlign = 'right';
    ctx.fillText(`${s.bpm} BPM`, W - 18, 26);
    ctx.font = `500 15px ${FONT}`;
    ctx.fillStyle = '#8a93a8';
    ctx.fillText(s.playing ? '▶ PLAYING' : '■ STOPPED', W - 18, 50);
    ctx.textAlign = 'left';
    ctx.fillText(s.params.osc.toUpperCase(), 18, 50);

    const vals = getWaveform()?.getValue() as Float32Array | undefined;
    const mid = H * 0.52;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 160; i++) {
      const t = i / 159;
      const y = vals ? mid - vals[Math.floor(t * (vals.length - 1))] * 55 : mid - Math.sin(t * Math.PI * 4 + clock.elapsedTime * 2) * 16;
      if (i === 0) ctx.moveTo(18 + t * (W - 36), y);
      else ctx.lineTo(18 + t * (W - 36), y);
    }
    ctx.stroke();

    const cell = (W - 36) / STEPS;
    for (let i = 0; i < STEPS; i++) {
      const used = s.melody.some((r) => r[i]) || s.drums.some((r) => r[i]);
      ctx.fillStyle = i === s.currentStep ? ACCENT : used ? '#d9e0f0' : '#262a33';
      ctx.fillRect(18 + i * cell + 2, H - 30, cell - 4, 12);
    }
    tex.needsUpdate = true;
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[OLED.x, TOP + 0.006, OLED.z]}>
      <planeGeometry args={[OLED.w, OLED.d]} />
      <meshBasicMaterial map={tex} color={new THREE.Color(1.35, 1.35, 1.35)} />
    </mesh>
  );
}

function Encoder({ def, index }: { def: ControlDef; index: number }) {
  const value = useStore((s) => s.params[def.key]);
  const setParam = useStore((s) => s.setParam);
  const get = useThree((s) => s.get);
  const [x, z] = knobPos(index);
  const color = KNOB_COLORS[index % 4];
  const n = toNorm(def, value);
  const angle = (0.75 - n * 1.5) * Math.PI;

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const startY = e.nativeEvent.clientY;
    const startN = n;
    const controls = get().controls as unknown as { enabled: boolean } | null;
    if (controls) controls.enabled = false;
    const move = (ev: PointerEvent) => setParam(def.key, fromNorm(def, startN + (startY - ev.clientY) / 180));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (controls) controls.enabled = true;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <group position={[x, TOP, z]}>
      <mesh position={[0, 0.006, 0]}>
        <cylinderGeometry args={[KNOB_R + 0.045, KNOB_R + 0.045, 0.012, 48]} />
        <meshStandardMaterial color="#34373d" roughness={0.6} />
      </mesh>
      <group rotation-y={angle} onPointerDown={onDown} {...hover}>
        {/* faceted side reads as a knurled grip */}
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[KNOB_R, KNOB_R, 0.2, 22]} />
          <meshStandardMaterial color={color} roughness={0.5} flatShading />
        </mesh>
        <mesh position={[0, 0.215, 0]}>
          <cylinderGeometry args={[KNOB_R - 0.035, KNOB_R - 0.005, 0.012, 48]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.224, -(KNOB_R - 0.075)]}>
          <cylinderGeometry args={[0.028, 0.028, 0.006, 16]} />
          <meshStandardMaterial color={index % 4 === 2 ? '#26282d' : '#ffffff'} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function StepDots() {
  const current = useStore((s) => s.currentStep);
  const melody = useStore((s) => s.melody);
  const drums = useStore((s) => s.drums);
  return (
    <group>
      {Array.from({ length: STEPS }, (_, i) => {
        const [x, z] = stepPos(i);
        const on = current === i;
        const used = melody.some((r) => r[i]) || drums.some((r) => r[i]);
        return (
          <mesh key={i} position={[x, TOP + 0.006, z]}>
            <cylinderGeometry args={[0.045, 0.045, 0.012, 20]} />
            <meshStandardMaterial
              color={on ? ACCENT : used ? '#ffffff' : '#5d626b'}
              emissive={on ? ACCENT : '#ffffff'}
              emissiveIntensity={on ? 4 : used ? 0.9 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Key({ note, x, z, sharp }: { note: string; x: number; z: number; sharp: boolean }) {
  const down = useStore((s) => s.pressed.includes(note));
  return (
    <RoundedBox
      args={[KEY.w, KEY.h, KEY.d]}
      radius={0.025}
      smoothness={3}
      position={[x, TOP + KEY.h / 2 + 0.005 - (down ? 0.025 : 0), z]}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        void noteOn(note);
      }}
      onPointerUp={() => noteOff(note)}
      onPointerLeave={() => noteOff(note)}
      {...hover}
    >
      <meshStandardMaterial color={sharp ? '#3b3e45' : '#e2e4e8'} roughness={0.55} emissive={ACCENT} emissiveIntensity={down ? 1.2 : 0} />
    </RoundedBox>
  );
}

function Keybed() {
  const octave = useStore((s) => s.keyOctave);
  const keys = useMemo(() => {
    let natural = -1;
    return Array.from({ length: 25 }, (_, i) => {
      const sharp = SHARP.has(i % 12);
      if (!sharp) natural++;
      const x = KEY.x0 + natural * KEY.pitch + (sharp ? KEY.pitch / 2 : 0);
      return { note: `${NOTE_NAMES[i % 12]}${octave + Math.floor(i / 12)}`, x, z: sharp ? KEY.sharpZ : KEY.naturalZ, sharp };
    });
  }, [octave]);
  return (
    <group>
      {keys.map((k) => (
        <Key key={k.note} {...k} />
      ))}
    </group>
  );
}

function Pad({ drum, index }: { drum: Drum; index: number }) {
  const group = useRef<THREE.Group>(null);
  const dot = useRef<THREE.MeshStandardMaterial>(null);
  const [x, z] = padPos(index);
  const label = useMemo(() => createCapLabel(drum), [drum]);
  useEffect(() => () => label.dispose(), [label]);
  useFrame(() => {
    const k = Math.max(0, 1 - (performance.now() - useStore.getState().padHits[drum]) / 220);
    if (dot.current) dot.current.emissiveIntensity = 0.5 + k * 5;
    if (group.current) group.current.position.y = TOP - k * 0.025;
  });
  return (
    <group
      ref={group}
      position={[x, TOP, z]}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        void hitDrum(drum);
      }}
      {...hover}
    >
      <RoundedBox args={[PAD.size, 0.08, PAD.size]} radius={0.03} smoothness={3} position={[0, 0.045, 0]}>
        <meshStandardMaterial color="#c4c7cc" roughness={0.75} />
      </RoundedBox>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0855, 0]}>
        <planeGeometry args={[PAD.size - 0.04, PAD.size - 0.04]} />
        <meshStandardMaterial map={label} transparent roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.088, -0.05]}>
        <cylinderGeometry args={[0.06, 0.06, 0.006, 24]} />
        <meshStandardMaterial ref={dot} color={PAD_COLORS[index]} emissive={PAD_COLORS[index]} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export function Synth3D() {
  return (
    <group>
      <Chassis />
      <Oled />
      {KNOBS.map((k, i) => (
        <Encoder key={k.key} def={k} index={i} />
      ))}
      <StepDots />
      {DRUMS.map((d, i) => (
        <Pad key={d} drum={d} index={i} />
      ))}
      <Keybed />
    </group>
  );
}
