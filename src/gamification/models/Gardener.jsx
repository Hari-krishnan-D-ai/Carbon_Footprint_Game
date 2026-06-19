import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function Gardener({ position, rotation = 0, assets }) {
  const bodyRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Bending and digging animation: bobbing up/down and rotating body
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 3.5) * 0.03;
      bodyRef.current.rotation.x = 0.2 + Math.sin(t * 3.5) * 0.08;
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group ref={bodyRef}>
        {/* Body */}
        <mesh position={[0, 0.35, 0]} castShadow geometry={assets.tunicGeom} material={assets.tunicMat} />
        {/* Pants */}
        <mesh position={[0, 0.15, 0]} castShadow geometry={assets.pantsGeom} material={assets.pantsMat} />
        {/* Legs */}
        <mesh position={[-0.06, 0.05, 0]} geometry={assets.legGeom} material={assets.legMat} />
        <mesh position={[0.06, 0.05, 0]} geometry={assets.legGeom} material={assets.legMat} />
        {/* Head */}
        <mesh position={[0, 0.58, 0]} castShadow geometry={assets.headGeom} material={assets.headMat} />
        {/* Hood/Cap */}
        <mesh position={[0, 0.65, -0.02]} castShadow geometry={assets.hoodGeom} material={assets.hoodMat} />
        {/* Arm holding a shovel */}
        <mesh position={[-0.14, 0.3, 0.05]} rotation={[0.4, 0, 0]} geometry={assets.leftArmGeom} material={assets.leftArmMat} />
        <group position={[0.14, 0.3, 0.05]} rotation={[-0.4, 0, 0.2]}>
          <mesh geometry={assets.leftArmGeom} material={assets.leftArmMat} />
          {/* Shovel handle */}
          <mesh position={[0.05, -0.1, 0.1]} rotation={[1, 0, 0]} geometry={assets.handleGeom} material={assets.handleMat} />
          {/* Shovel blade */}
          <mesh position={[0.05, -0.28, 0.18]} rotation={[1, 0, 0]} geometry={assets.bladeGeom} material={assets.bladeMat} />
        </group>
      </group>
      {/* Dirt mound */}
      <mesh position={[0.2, 0.01, 0.1]} receiveShadow geometry={assets.dirtGeom} material={assets.dirtMat} />
    </group>
  );
}
