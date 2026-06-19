import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function BuildersHut({ position, rotation = 0, assets }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Foundation / floor */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow geometry={assets.floorGeom} material={assets.floorMat} />
      {/* Wooden walls */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow geometry={assets.wallGeom} material={assets.wallMat} />
      {/* Door */}
      <mesh position={[0, 0.22, 0.37]} geometry={assets.doorGeom} material={assets.doorMat} />
      {/* Small side window */}
      <mesh position={[0.37, 0.35, 0]} rotation={[0, Math.PI / 2, 0]} geometry={assets.windowGeom} material={assets.windowMat} />
      {/* Straw roof */}
      <mesh position={[0, 0.76, 0]} rotation={[0, Math.PI / 4, 0]} castShadow geometry={assets.roofGeom} material={assets.roofMat} />
      {/* Workbench outside */}
      <group position={[-0.5, 0.1, 0.1]} rotation={[0, Math.PI / 6, 0]}>
        {/* Tabletop */}
        <mesh position={[0, 0.08, 0]} castShadow geometry={assets.tableGeom} material={assets.tableMat} />
        {/* Table legs */}
        <mesh position={[-0.08, 0.02, -0.16]} geometry={assets.legGeom} material={assets.legMat} />
        <mesh position={[0.08, 0.02, -0.16]} geometry={assets.legGeom} material={assets.legMat} />
        <mesh position={[-0.08, 0.02, 0.16]} geometry={assets.legGeom} material={assets.legMat} />
        <mesh position={[0.08, 0.02, 0.16]} geometry={assets.legGeom} material={assets.legMat} />
      </group>
    </group>
  );
}

export function GoldMine({ position, rotation = 0, assets }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Foundation / Stone frame */}
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow geometry={assets.foundationGeom} material={assets.foundationMat} />
      {/* Mine entrance structure */}
      <group position={[0, 0.4, -0.2]}>
        {/* Left post */}
        <mesh position={[-0.36, 0, 0]} castShadow geometry={assets.postGeom} material={assets.postMat} />
        {/* Right post */}
        <mesh position={[0.36, 0, 0]} castShadow geometry={assets.postGeom} material={assets.postMat} />
        {/* Crossbeam */}
        <mesh position={[0, 0.35, 0]} castShadow geometry={assets.beamGeom} material={assets.beamMat} />
        {/* Dark mine shaft opening */}
        <mesh position={[0, -0.05, -0.05]} geometry={assets.shaftGeom} material={assets.shaftMat} />
      </group>
      {/* Golden ore cart / piles outside */}
      <group position={[0.26, 0.1, 0.26]}>
        {/* Wooden cart box */}
        <mesh position={[0, 0.1, 0]} castShadow geometry={assets.cartGeom} material={assets.cartMat} />
        {/* Gold crystals in cart */}
        <mesh position={[0, 0.2, 0]} geometry={assets.goldLargeGeom} material={assets.goldMat} />
        <mesh position={[-0.05, 0.21, 0.06]} geometry={assets.goldSmallGeom} material={assets.goldMat} />
      </group>
      {/* Small pile of raw gold beside the cart */}
      <mesh position={[-0.26, 0.12, 0.26]} geometry={assets.goldPileGeom} material={assets.goldPileMat} />
    </group>
  );
}

export function ElixirCollector({ position, rotation = 0, assets }) {
  const liquidRef = useRef();

  useFrame((state) => {
    // Subtle pulsing/bubbling effect in the elixir tank
    if (liquidRef.current) {
      const scale = 1.0 + Math.sin(state.clock.elapsedTime * 2.5) * 0.02;
      liquidRef.current.scale.set(scale, 1.0, scale);
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Circular bronze base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow geometry={assets.baseGeom} material={assets.baseMat} />
      {/* Central Glass Elixir tank */}
      <mesh position={[0, 0.45, 0]} castShadow geometry={assets.glassGeom} material={assets.glassMat} />
      {/* Inner pink elixir liquid */}
      <mesh ref={liquidRef} position={[0, 0.42, 0]} geometry={assets.liquidGeom} material={assets.liquidMat} />
      {/* Bronze support structure & capping */}
      <group position={[0, 0.8, 0]}>
        <mesh castShadow geometry={assets.capGeom} material={assets.capMat} />
        <mesh position={[0, 0.08, 0]} geometry={assets.sphereGeom} material={assets.sphereMat} />
      </group>
      {/* Copper tubes connecting to base */}
      <mesh position={[0.22, 0.42, 0.12]} rotation={[0.2, 0, -0.3]} geometry={assets.tubeGeom} material={assets.tubeMat} />
      <mesh position={[-0.22, 0.42, -0.12]} rotation={[-0.2, 0, 0.3]} geometry={assets.tubeGeom} material={assets.tubeMat} />
    </group>
  );
}
