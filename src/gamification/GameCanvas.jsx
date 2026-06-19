import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TownHallMesh from './TownHallMesh.jsx';
import Environment from './Environment.jsx';

function ResponsiveCameraController() {
  const { camera, size, controls } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    
    // Base camera coordinates
    const basePos = [6, 4.5, 8];
    const targetAspect = 1.6; // Standard landscape aspect ratio
    
    let multiplier = 1.0;
    if (aspect < targetAspect) {
      // Zoom out proportionally if screen aspect ratio is narrow (e.g. mobile, portrait, laptop split window)
      multiplier = targetAspect / aspect;
    }
    
    // Clamp the multiplier so it does not zoom out too far
    multiplier = Math.min(Math.max(multiplier, 1.0), 2.2);

    camera.position.set(basePos[0] * multiplier, basePos[1] * multiplier, basePos[2] * multiplier);
    camera.lookAt(0, 1.0, 0); // Focus on the center of the Town Hall
    camera.updateProjectionMatrix();
    if (controls) {
      controls.update();
    }
  }, [size.width, size.height, camera, controls]);

  return null;
}

export default function GameCanvas() {
  return (
    <Canvas camera={{ position: [6, 4.5, 8], fov: 45 }} shadows dpr={[1, 2]}>
      <ResponsiveCameraController />
      <Environment />
      <TownHallMesh />
      <OrbitControls
        makeDefault
        target={[0, 1.0, 0]}
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={25}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={false}
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}
