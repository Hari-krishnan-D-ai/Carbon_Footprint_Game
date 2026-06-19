export function Fence({ fencePosts, assets }) {
  return (
    <group>
      {/* Fence Posts */}
      {fencePosts.map((fp, i) => (
        <group key={`post-${i}`} position={fp.position}>
          {/* Vertical post */}
          <mesh castShadow geometry={assets.postGeom} material={assets.postMat} />
          {/* Post cap */}
          <mesh position={[0, 0.27, 0]} geometry={assets.capGeom} material={assets.capMat} />
        </group>
      ))}

      {/* Fence rails connecting posts */}
      {fencePosts.map((fp, i) => {
        const next = fencePosts[(i + 1) % fencePosts.length];
        const midX = (fp.position[0] + next.position[0]) / 2;
        const midZ = (fp.position[2] + next.position[2]) / 2;
        const dx = next.position[0] - fp.position[0];
        const dz = next.position[2] - fp.position[2];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh
            key={`rail-${i}`}
            position={[midX, 0.2, midZ]}
            rotation={[0, angle, 0]}
            scale={[0.03, 0.03, length]} // Scale unit geometry
            geometry={assets.railGeom}
            material={assets.railMat}
          />
        );
      })}
    </group>
  );
}
