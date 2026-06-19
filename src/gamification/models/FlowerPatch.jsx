import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore.js';

export function FlowerPatch({ position, color, assets }) {
  const groupRef = useRef();
  const townHallHealth = useGameStore((state) => state.townHallHealth);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const target = townHallHealth >= 40 ? 1 : 0.1;
    const current = groupRef.current.scale.x;
    const next = THREE.MathUtils.damp(current, target, 3, delta);
    groupRef.current.scale.setScalar(Math.max(next, 0.05));
  });

  const petalMat = assets.mats[color] || assets.mats['#f472b6']; // fallback

  return (
    <group ref={groupRef} position={position} scale={0.05}>
      {/* Cluster of small flower dots */}
      {[-0.15, 0, 0.15].map((dx) =>
        [-0.1, 0.1].map((dz) => (
          <mesh key={`${dx}-${dz}`} position={[dx, 0.08, dz]} geometry={assets.petalGeom} material={petalMat} />
        ))
      )}
      {/* Stems */}
      {[-0.15, 0, 0.15].map((dx) => (
        <mesh key={`stem-${dx}`} position={[dx, 0.03, 0]} geometry={assets.stemGeom} material={assets.stemMat} />
      ))}
    </group>
  );
}
