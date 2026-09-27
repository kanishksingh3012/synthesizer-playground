import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Box3, Vector3, type PerspectiveCamera } from 'three';
import { Hex16, MODEL } from './Hex16';

const TILT = (14 * Math.PI) / 180; // top view, tilted slightly toward the player
const MARGIN_Y = 64; // px above and below the synth (the start hint sits in the bottom margin)
const MARGIN_X = 28;

/**
 * Fixed top view that fits the synth into the canvas and centres it exactly: the model's bounding box
 * is projected to the screen, then distance and aim are corrected until the box sits in the middle.
 */
function TopCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  const { scene } = useGLTF(MODEL);
  useEffect(() => {
    // frame the case itself: the full box includes knob tops, which would push the synth down on screen
    const box: Box3 = (scene.userData.box ??= new Box3().setFromObject(scene.getObjectByName('case') ?? scene));
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    const dir = new Vector3(0, Math.cos(TILT), Math.sin(TILT));
    const target = box.getCenter(new Vector3());
    const t = Math.tan((camera.fov * Math.PI) / 360);
    let dist = box.getSize(new Vector3()).length() / t;
    const allowX = 1 - (2 * MARGIN_X) / width, allowY = 1 - (2 * MARGIN_Y) / height;
    const right = new Vector3(), up = new Vector3(), p = new Vector3();
    for (let pass = 0; pass < 6; pass++) {
      camera.position.copy(target).addScaledVector(dir, dist);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const c of corners) {
        p.copy(c).project(camera);
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
      }
      // aim: shift the target by the box's off-centre amount (NDC → world at the target's depth)
      camera.matrixWorld.extractBasis(right, up, new Vector3());
      const halfH = dist * t, halfW = halfH * camera.aspect;
      target.addScaledVector(right, ((x0 + x1) / 2) * halfW).addScaledVector(up, ((y0 + y1) / 2) * halfH);
      // distance: scale so the larger side just fills the allowed area
      dist *= Math.max((x1 - x0) / 2 / allowX, (y1 - y0) / 2 / allowY);
    }
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, width, height, scene]);
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
        <TopCamera />
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
