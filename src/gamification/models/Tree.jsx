import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore.js';

export function Tree({ position, threshold, forceSpawn, assets }) {
  const groupRef = useRef();
  const townHallHealth = useGameStore((state) => state.townHallHealth);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = (forceSpawn || (threshold !== undefined && townHallHealth >= threshold)) ? 1 : 0;
    const current = groupRef.current.scale.x;
    const next = THREE.MathUtils.damp(current, target, 4, delta);
    groupRef.current.scale.setScalar(Math.max(next, 0.001));
    // Gentle sway
    groupRef.current.rotation.z = Math.sin(performance.now() * 0.001 + (threshold || 12)) * 0.02;
  });

  return (
    <group ref={groupRef} position={position} scale={0.001}>
      {/* Trunk */}
      <mesh position={[0, 0.45, 0]} castShadow geometry={assets.trunkGeom} material={assets.trunkMat} />
      {/* Lower canopy (wider) */}
      <mesh position={[0, 0.95, 0]} castShadow geometry={assets.canopy1Geom} material={assets.canopy1Mat} />
      {/* Upper canopy (narrower, taller) */}
      <mesh position={[0, 1.4, 0]} castShadow geometry={assets.canopy2Geom} material={assets.canopy2Mat} />
      {/* Tree top */}
      <mesh position={[0, 1.75, 0]} geometry={assets.canopy3Geom} material={assets.canopy3Mat} />
    </group>
  );
}
