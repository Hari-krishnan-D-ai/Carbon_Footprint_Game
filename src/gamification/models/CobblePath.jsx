import * as THREE from 'three';

export function CobblePath({ assets }) {
  return (
    <group>
      {/* Main path from entrance southward */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 3.5]} geometry={assets.pathGeom} material={assets.pathMat} />
      {/* Path border stones */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <mesh position={[-0.65, 0.03, 1.8 + i * 0.5]} rotation={[-Math.PI / 2, 0, 0]} geometry={assets.borderGeom} material={assets.borderMat} />
          <mesh position={[0.65, 0.03, 1.8 + i * 0.5]} rotation={[-Math.PI / 2, 0, 0]} geometry={assets.borderGeom} material={assets.borderMat} />
        </group>
      ))}
    </group>
  );
}
