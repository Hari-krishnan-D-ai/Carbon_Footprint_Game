import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TownHallMesh from './TownHallMesh.jsx';
import Environment from './Environment.jsx';

export default function GameCanvas() {
  return (
    <Canvas camera={{ position: [6, 4.5, 8], fov: 45 }} shadows dpr={[1, 2]}>
      <Environment />
      <TownHallMesh />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={false}
        autoRotateSpeed={0.8}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
