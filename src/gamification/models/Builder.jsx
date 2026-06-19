import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function Builder({ position, rotation = 0, assets }) {
  const armRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Swinging hammer animation: fast arm rotation on the X axis
    if (armRef.current) {
      armRef.current.rotation.x = -Math.PI / 4 + Math.sin(t * 8) * 0.5;
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body / Torso */}
      <mesh position={[0, 0.35, 0]} castShadow geometry={assets.vestGeom} material={assets.vestMat} />
      {/* Pants */}
      <mesh position={[0, 0.15, 0]} castShadow geometry={assets.pantsGeom} material={assets.pantsMat} />
      {/* Left leg */}
      <mesh position={[-0.07, 0.05, 0]} geometry={assets.legGeom} material={assets.legMat} />
      {/* Right leg */}
      <mesh position={[0.07, 0.05, 0]} geometry={assets.legGeom} material={assets.legMat} />
      {/* Head */}
      <mesh position={[0, 0.58, 0]} castShadow geometry={assets.headGeom} material={assets.headMat} />
      {/* Builder Helmet */}
      <group position={[0, 0.68, 0]}>
        <mesh castShadow geometry={assets.helmetGeom} material={assets.helmetMat} />
        {/* Helmet brim */}
        <mesh position={[0, -0.02, 0.02]} geometry={assets.brimGeom} material={assets.brimMat} />
      </group>
      {/* Left Arm */}
      <mesh position={[-0.15, 0.35, 0]} geometry={assets.leftArmGeom} material={assets.leftArmMat} />
      {/* Right Arm (swinging hammer) */}
      <group ref={armRef} position={[0.15, 0.4, 0]}>
        {/* Arm */}
        <mesh position={[0, -0.1, 0.04]} rotation={[0.4, 0, 0]} geometry={assets.rightArmGeom} material={assets.rightArmMat} />
        {/* Hammer Handle */}
        <mesh position={[0, -0.2, 0.12]} rotation={[Math.PI / 2, 0, 0]} geometry={assets.handleGeom} material={assets.handleMat} />
        {/* Hammer Head */}
        <mesh position={[0, -0.2, 0.22]} geometry={assets.hammerHeadGeom} material={assets.hammerHeadMat} />
      </group>
      {/* Wooden construction block */}
      <mesh position={[0.18, 0.08, 0.24]} castShadow geometry={assets.blockGeom} material={assets.blockMat} />
    </group>
  );
}
