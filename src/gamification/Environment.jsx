import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { clamp } from '../utils/gameLogic.js';

// Custom hook and modular components
import { useEnvironmentAssets } from './hooks/useEnvironmentAssets.js';
import { Tree } from './models/Tree.jsx';
import { Builder } from './models/Builder.jsx';
import { Gardener } from './models/Gardener.jsx';
import { BuildersHut, GoldMine, ElixirCollector } from './models/Buildings.jsx';
import { Fence } from './models/Fence.jsx';
import { FlowerPatch } from './models/FlowerPatch.jsx';
import { CobblePath } from './models/CobblePath.jsx';
import { SmogField, FireflyField } from './models/Particles.jsx';

const CLEAR_SKY = new THREE.Color('#87ceeb');
const FOULED_SKY = new THREE.Color('#4a4a3d');

// Lush/Wilting colors for grass & hills to react to pollution
const LUSH_GROUND = new THREE.Color('#5a7a42');
const WILTING_GROUND = new THREE.Color('#5c5340');
const LUSH_HILL = new THREE.Color('#486b36');
const WILTING_HILL = new THREE.Color('#524a38');

// Trees "spawn" by popping in once Town Hall health crosses their threshold.
const TREE_SLOTS = [
  { position: [3.2, 0, 1.8], threshold: 25 },
  { position: [-3.4, 0, 2.0], threshold: 30 },
  { position: [3.8, 0, -1.8], threshold: 40 },
  { position: [-3.8, 0, -1.4], threshold: 45 },
  { position: [2.0, 0, 3.8], threshold: 55 },
  { position: [-2.2, 0, 3.6], threshold: 60 },
  { position: [4.2, 0, 0.4], threshold: 70 },
  { position: [-4.2, 0, 0.8], threshold: 80 },
];

// Slots where dynamic trees will grow when the user types "I planted a tree"
const PLANTED_TREE_SLOTS = [
  [-4.8, 0, -3.2],
  [4.8, 0, -3.2],
  [-5.2, 0, 2.8],
  [5.2, 0, 2.8],
  [0, 0, -5.2],
  [-2.5, 0, -4.5],
  [2.5, 0, -4.5],
  [-5.5, 0, -0.5],
  [5.5, 0, -0.5],
];

// Background forest trees outside the village fence to populate the expanded landscape
const FOREST_TREE_SLOTS = [
  [-8.0, 0, -8.0],
  [8.0, 0, -8.0],
  [-9.5, 0, 7.0],
  [9.5, 0, 7.0],
  [-12.0, 0, -2.0],
  [12.0, 0, -2.0],
  [-3.0, 0, -11.0],
  [3.0, 0, 11.0],
  [-11.0, 0, -9.0],
  [11.0, 0, 9.0],
  [10.0, 0, -10.0],
  [-10.0, 0, 10.0],
  [-14.0, 0, 4.0],
  [14.0, 0, -4.0],
];

// Flower patches that bloom/wilt based on health
const FLOWER_PATCHES = [
  { position: [1.8, 0.02, 2.8], color: '#f472b6' },
  { position: [-1.6, 0.02, 3.2], color: '#facc15' },
  { position: [2.8, 0.02, -2.5], color: '#c084fc' },
  { position: [-2.6, 0.02, -2.8], color: '#fb923c' },
  { position: [0.8, 0.02, 4.2], color: '#f87171' },
  { position: [-0.5, 0.02, -3.8], color: '#34d399' },
];

// Periphery low-poly hills (faceted cones) to add landscape detail and horizon depth
const HILLS = [
  { position: [-16, -0.4, -14], scale: [12, 6, 12], rotation: [0.2, 0.5, 0.1] },
  { position: [18, -0.4, -16], scale: [15, 8, 15], rotation: [0.1, 1.2, -0.2] },
  { position: [-22, -0.4, 12], scale: [14, 7, 14], rotation: [-0.1, 2.1, 0.1] },
  { position: [17, -0.4, 20], scale: [16, 9, 16], rotation: [0.2, -0.8, -0.1] },
  { position: [0, -0.5, -28], scale: [22, 11, 22], rotation: [-0.2, 0.1, 0] },
  { position: [-30, -0.4, -6], scale: [18, 9, 18], rotation: [0.1, 0.7, 0.2] },
  { position: [26, -0.4, 3], scale: [17, 8, 17], rotation: [-0.1, -1.5, -0.1] },
  { position: [-8, -0.4, 26], scale: [13, 6, 13], rotation: [0.2, 0.3, 0.1] },
];

// Fence posts around the village
const FENCE_POSTS = [];
for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
  const r = 6.5;
  FENCE_POSTS.push({
    position: [Math.cos(angle) * r, 0.25, Math.sin(angle) * r],
    rotation: angle,
  });
}

export default function Environment() {
  const { scene } = useThree();
  const pollutionFactor = useGameStore((state) => state.pollutionFactor);
  const plantedTreesCount = useGameStore((state) => state.plantedTreesCount);
  const isEvilFlashing = useGameStore((state) => state.isEvilFlashing);
  const fogRef = useRef();
  const lightRef = useRef();

  // Refs to allow materials to lerp colors smoothly under pollution
  const groundMatRef = useRef();
  const hillMatRef = useRef();

  const assets = useEnvironmentAssets();

  const fog = useMemo(() => new THREE.Fog('#87ceeb', 10, 30), []);
  scene.fog = fog;
  fogRef.current = fog;

  useFrame((_, delta) => {
    const pollutionFraction = clamp(pollutionFactor, 0, 100) / 100;
    let targetSkyColor = CLEAR_SKY.clone().lerp(FOULED_SKY, pollutionFraction);

    if (isEvilFlashing) {
      targetSkyColor = new THREE.Color('#3a0505'); // Evil dark red sky
    }

    if (fogRef.current) {
      fogRef.current.color.lerp(targetSkyColor, isEvilFlashing ? 0.2 : 0.05);
      
      const targetNear = isEvilFlashing ? 3.0 : (10 - pollutionFraction * 5);
      const targetFar = isEvilFlashing ? 8.0 : (30 - pollutionFraction * 14);

      fogRef.current.near = THREE.MathUtils.damp(fogRef.current.near, targetNear, isEvilFlashing ? 10 : 2, delta);
      fogRef.current.far = THREE.MathUtils.damp(fogRef.current.far, targetFar, isEvilFlashing ? 10 : 2, delta);
    }

    // Sync background (sky) color to the fog color at all times to eliminate horizon seam line
    if (scene.background && scene.background.isColor && fogRef.current) {
      scene.background.copy(fogRef.current.color);
    }

    // Lerp terrain colors according to pollutionFraction
    const currentGroundColor = LUSH_GROUND.clone().lerp(WILTING_GROUND, pollutionFraction);
    const currentHillColor = LUSH_HILL.clone().lerp(WILTING_HILL, pollutionFraction);

    if (groundMatRef.current) {
      groundMatRef.current.color.lerp(currentGroundColor, 0.05);
    }
    if (hillMatRef.current) {
      hillMatRef.current.color.lerp(currentHillColor, 0.05);
    }

    if (lightRef.current) {
      const targetIntensity = isEvilFlashing ? 2.5 : (1.2 - pollutionFraction * 0.5);
      lightRef.current.intensity = THREE.MathUtils.damp(
        lightRef.current.intensity,
        targetIntensity,
        isEvilFlashing ? 10 : 2,
        delta
      );

      const targetLightColor = isEvilFlashing ? new THREE.Color('#ff0000') : new THREE.Color('#ffffff');
      lightRef.current.color.lerp(targetLightColor, isEvilFlashing ? 0.35 : 0.1);
    }
  });

  return (
    <>
      <color attach="background" args={[isEvilFlashing ? '#3a0505' : '#87ceeb']} />
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={lightRef}
        position={[8, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Subtle warm fill light from opposite side */}
      <directionalLight position={[-5, 6, -3]} intensity={0.3} color="#fde68a" />

      {/* Expanded circular ground geometry (radius 200 to cover horizon and prevent floating island look) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[200, 64]} />
        <meshStandardMaterial ref={groundMatRef} color="#5a7a42" roughness={1} />
      </mesh>

      {/* Periphery low-poly hills */}
      {HILLS.map((hill, i) => (
        <mesh
          key={`hill-${i}`}
          position={hill.position}
          scale={hill.scale}
          rotation={hill.rotation}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[1, 1, 5]} />
          <meshStandardMaterial ref={hillMatRef} color="#486b36" roughness={0.9} flatShading />
        </mesh>
      ))}

      {/* Cobblestone path */}
      <CobblePath assets={assets.path} />

      {/* Fence posts & rails */}
      <Fence fencePosts={FENCE_POSTS} assets={assets.fence} />

      {/* Base Trees */}
      {TREE_SLOTS.map((slot) => (
        <Tree key={slot.threshold} position={slot.position} threshold={slot.threshold} assets={assets.tree} />
      ))}

      {/* Dynamically Planted Trees */}
      {PLANTED_TREE_SLOTS.map((pos, i) => (
        <Tree key={`planted-${i}`} position={pos} forceSpawn={i < plantedTreesCount} assets={assets.tree} />
      ))}

      {/* Background Forest Trees */}
      {FOREST_TREE_SLOTS.map((pos, i) => (
        <Tree key={`forest-${i}`} position={pos} forceSpawn={true} assets={assets.tree} />
      ))}

      {/* Men Working (Low-Poly Animated Builder & Gardener) */}
      <Builder position={[-1.1, 0, 1.3]} rotation={Math.PI / 5} assets={assets.builder} />
      <Gardener position={[1.4, 0, 1.4]} rotation={-Math.PI / 4} assets={assets.gardener} />

      {/* Scenery Buildings */}
      <BuildersHut position={[-2.4, 0, -1.8]} rotation={Math.PI / 4} assets={assets.hut} />
      <GoldMine position={[2.4, 0, -1.2]} rotation={-Math.PI / 3} assets={assets.mine} />
      <ElixirCollector position={[2.0, 0, 2.6]} rotation={Math.PI / 6} assets={assets.elixir} />

      {/* Flower patches */}
      {FLOWER_PATCHES.map((fp, i) => (
        <FlowerPatch key={i} position={fp.position} color={fp.color} assets={assets.flower} />
      ))}

      <SmogField />
      <FireflyField />
    </>
  );
}
