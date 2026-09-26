import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Synth3D } from './Synth3D';
import { BODY } from './layout';
import { LabelOverlay, LabelProjector } from './Labels';

const media = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;
const isSmall = media('(max-width: 720px)');
const isDark = media('(prefers-color-scheme: dark)');

const TARGET: [number, number, number] = [0, 0.2, 0.15];

/** Backs the camera off until the whole synth fits the viewport width (phones), and tilts to top-down when narrow. */
function FitCamera() {
  const camera = useThree((s) => s.camera) as import('three').PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    const aspect = width / height;
    const dir = aspect < 1 ? [0, 0.9, 0.44] : [0, 0.65, 0.76];
    const halfW = BODY.w / 2 + 0.35;
    const fit = halfW / (Math.tan((camera.fov * Math.PI) / 360) * aspect);
    const dist = Math.min(18, Math.max(7.7, fit));
    camera.position.set(TARGET[0] + dir[0] * dist, TARGET[1] + dir[1] * dist, TARGET[2] + dir[2] * dist);
    camera.lookAt(...TARGET);
  }, [camera, width, height]);
  return null;
}

export function Stage() {
  return (
    <>
      <Canvas dpr={[1, isSmall ? 1.5 : 2]} camera={{ position: [0, 5.2, 6], fov: isSmall ? 40 : 34 }} gl={{ antialias: false, preserveDrawingBuffer: true }}>
        <color attach="background" args={[isDark ? '#17181b' : '#e4e6ea']} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[2.5, 8, 4]} intensity={1.1} />
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
          <Lightformer intensity={1.2} position={[0, 3, -7]} scale={[14, 3, 1]} />
          <Lightformer intensity={0.8} position={[-7, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer intensity={0.8} position={[7, 2, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        </Environment>
        <FitCamera />
        <Synth3D />
        <LabelProjector />
        <ContactShadows position={[0, 0, 0]} opacity={isDark ? 0.7 : 0.4} scale={14} blur={2.6} far={2.5} />
        <OrbitControls
          makeDefault
          target={TARGET}
          enablePan={false}
          minDistance={5}
          maxDistance={18}
          minPolarAngle={0.2}
          maxPolarAngle={1.3}
          minAzimuthAngle={-1}
          maxAzimuthAngle={1}
        />
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.8} />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      </Canvas>
      <LabelOverlay />
    </>
  );
}
