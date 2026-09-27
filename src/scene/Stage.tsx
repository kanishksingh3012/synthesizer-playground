import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { PerspectiveCamera } from 'three';
import { Hex16 } from './Hex16';

const TARGET: [number, number, number] = [0, 0.4, 0];
const TILT = (14 * Math.PI) / 180; // top view, tilted slightly toward the player
const HALF_W = 3.75; // device half-width + margin
const HALF_D = 2.8;

/** Fixed top view that always fits the whole synth in the canvas. */
function TopCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    const t = Math.tan((camera.fov * Math.PI) / 360);
    const dist = Math.max(HALF_W / (t * (width / height)), HALF_D / t) * 1.04;
    camera.position.set(TARGET[0], TARGET[1] + dist * Math.cos(TILT), TARGET[2] + dist * Math.sin(TILT));
    camera.lookAt(...TARGET);
    camera.updateProjectionMatrix();
  }, [camera, width, height]);
  return null;
}

export function Stage() {
  return (
    <Canvas flat dpr={[1, 2]} camera={{ fov: 28 }} gl={{ antialias: false }}>
      <color attach="background" args={['#d2d3d6']} />
      <directionalLight position={[-3, 10, 6]} intensity={0.5} />
      <Suspense fallback={null}>
        <Environment files="/hdri/studio.exr" environmentIntensity={0.3} />
        <Hex16 />
      </Suspense>
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={16} blur={2.6} far={2} />
      <TopCamera />
      {/* no tone mapping pass: the baked texture already carries the renders' AgX look */}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1.5} intensity={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
