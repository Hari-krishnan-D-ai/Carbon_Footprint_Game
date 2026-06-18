import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { clamp } from '../utils/gameLogic.js';

const CLEAR_SKY = new THREE.Color('#87ceeb');
const FOULED_SKY = new THREE.Color('#4a4a3d');

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

// Flower patches that bloom/wilt based on health
const FLOWER_PATCHES = [
  { position: [1.8, 0.02, 2.8], color: '#f472b6' },
  { position: [-1.6, 0.02, 3.2], color: '#facc15' },
  { position: [2.8, 0.02, -2.5], color: '#c084fc' },
  { position: [-2.6, 0.02, -2.8], color: '#fb923c' },
  { position: [0.8, 0.02, 4.2], color: '#f87171' },
  { position: [-0.5, 0.02, -3.8], color: '#34d399' },
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

// Fixed smog particle field
const SMOG_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  seed: i,
  position: [Math.sin(i * 12.9) * 7, 1.5 + (i % 5) * 0.7, Math.cos(i * 7.3) * 7],
}));

// Firefly particles (visible at high health)
const FIREFLY_COUNT = 16;
const FIREFLIES = Array.from({ length: FIREFLY_COUNT }, (_, i) => ({
  seed: i,
  position: [
    (Math.random() - 0.5) * 10,
    0.5 + Math.random() * 2.5,
    (Math.random() - 0.5) * 10,
  ],
  speed: 0.3 + Math.random() * 0.5,
  phase: Math.random() * Math.PI * 2,
}));

/* ---------- Tree (improved with double canopy and forceSpawn) ---------- */

function Tree({ position, threshold, forceSpawn }) {
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
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.9, 6]} />
        <meshStandardMaterial color="#6b5638" roughness={0.9} />
      </mesh>
      {/* Lower canopy (wider) */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <coneGeometry args={[0.5, 0.7, 7]} />
        <meshStandardMaterial color="#2d6a2d" roughness={0.8} />
      </mesh>
      {/* Upper canopy (narrower, taller) */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.35, 0.6, 7]} />
        <meshStandardMaterial color="#3f7a3a" roughness={0.75} />
      </mesh>
      {/* Tree top */}
      <mesh position={[0, 1.75, 0]}>
        <coneGeometry args={[0.2, 0.35, 7]} />
        <meshStandardMaterial color="#4a8a44" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ---------- Builder Component (Swings Hammer) ---------- */

function Builder({ position, rotation = 0 }) {
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
      {/* Body / Torso (brown leather vest style) */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.24, 0.3, 0.16]} />
        <meshStandardMaterial color="#5c3f25" roughness={0.8} />
      </mesh>
      {/* Pants (blue/denim) */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.22, 0.15, 0.14]} />
        <meshStandardMaterial color="#2d4a6e" roughness={0.9} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.07, 0.05, 0]}>
        <boxGeometry args={[0.07, 0.1, 0.08]} />
        <meshStandardMaterial color="#1a2b40" />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.07, 0.05, 0]}>
        <boxGeometry args={[0.07, 0.1, 0.08]} />
        <meshStandardMaterial color="#1a2b40" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#ffcc99" roughness={0.6} />
      </mesh>
      {/* Builder Helmet (yellow, like Clash of Clans Builder) */}
      <group position={[0, 0.68, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.11, 0.08, 6]} />
          <meshStandardMaterial color="#e5a93b" metalness={0.2} roughness={0.3} />
        </mesh>
        {/* Helmet brim */}
        <mesh position={[0, -0.02, 0.02]}>
          <boxGeometry args={[0.22, 0.02, 0.22]} />
          <meshStandardMaterial color="#e5a93b" />
        </mesh>
      </group>
      {/* Left Arm */}
      <mesh position={[-0.15, 0.35, 0]}>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color="#ffcc99" />
      </mesh>
      {/* Right Arm (swinging hammer) */}
      <group ref={armRef} position={[0.15, 0.4, 0]}>
        {/* Arm */}
        <mesh position={[0, -0.1, 0.04]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.06, 0.2, 0.06]} />
          <meshStandardMaterial color="#ffcc99" />
        </mesh>
        {/* Hammer Handle */}
        <mesh position={[0, -0.2, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.24, 6]} />
          <meshStandardMaterial color="#7a5b3a" />
        </mesh>
        {/* Hammer Head */}
        <mesh position={[0, -0.2, 0.22]}>
          <boxGeometry args={[0.08, 0.08, 0.12]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      {/* Wooden construction block they are hammering */}
      <mesh position={[0.18, 0.08, 0.24]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.3]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ---------- Gardener Component (Digs Ground) ---------- */

function Gardener({ position, rotation = 0 }) {
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
        {/* Body (green tunic style) */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.22, 0.3, 0.16]} />
          <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
        {/* Pants (brown) */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.2, 0.15, 0.14]} />
          <meshStandardMaterial color="#4e3b2b" roughness={0.9} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.06, 0.05, 0]}>
          <boxGeometry args={[0.07, 0.1, 0.08]} />
          <meshStandardMaterial color="#302015" />
        </mesh>
        <mesh position={[0.06, 0.05, 0]}>
          <boxGeometry args={[0.07, 0.1, 0.08]} />
          <meshStandardMaterial color="#302015" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.58, 0]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#ffcc99" roughness={0.6} />
        </mesh>
        {/* Hood/Cap (brown) */}
        <mesh position={[0, 0.65, -0.02]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color="#4e3b2b" roughness={0.7} />
        </mesh>
        {/* Arm holding a shovel */}
        <mesh position={[-0.14, 0.3, 0.05]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.06, 0.2, 0.06]} />
          <meshStandardMaterial color="#ffcc99" />
        </mesh>
        <group position={[0.14, 0.3, 0.05]} rotation={[-0.4, 0, 0.2]}>
          <mesh>
            <boxGeometry args={[0.06, 0.2, 0.06]} />
            <meshStandardMaterial color="#ffcc99" />
          </mesh>
          {/* Shovel handle */}
          <mesh position={[0.05, -0.1, 0.1]} rotation={[1, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
            <meshStandardMaterial color="#6b513d" />
          </mesh>
          {/* Shovel blade */}
          <mesh position={[0.05, -0.28, 0.18]} rotation={[1, 0, 0]}>
            <boxGeometry args={[0.08, 0.1, 0.015]} />
            <meshStandardMaterial color="#a0a0a0" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>
      {/* Dirt mound they are digging */}
      <mesh position={[0.2, 0.01, 0.1]} receiveShadow>
        <sphereGeometry args={[0.15, 6, 4]} />
        <meshStandardMaterial color="#402a15" roughness={1} />
      </mesh>
    </group>
  );
}

/* ---------- Builder's Hut Component ---------- */

function BuildersHut({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Foundation / floor */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </mesh>
      {/* Wooden walls */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.54, 0.72]} />
        <meshStandardMaterial color="#8e6239" roughness={0.8} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.22, 0.37]}>
        <boxGeometry args={[0.22, 0.38, 0.04]} />
        <meshStandardMaterial color="#2d1a0e" />
      </mesh>
      {/* Small side window */}
      <mesh position={[0.37, 0.35, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
        <meshStandardMaterial color="#ffd200" roughness={0.1} />
      </mesh>
      {/* Straw roof */}
      <mesh position={[0, 0.76, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.62, 0.44, 4]} />
        <meshStandardMaterial color="#cca43b" roughness={0.9} />
      </mesh>
      {/* Workbench outside */}
      <group position={[-0.5, 0.1, 0.1]} rotation={[0, Math.PI / 6, 0]}>
        {/* Tabletop */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.26, 0.04, 0.45]} />
          <meshStandardMaterial color="#6b4423" />
        </mesh>
        {/* Table legs */}
        <mesh position={[-0.08, 0.02, -0.16]}>
          <boxGeometry args={[0.03, 0.08, 0.03]} />
          <meshStandardMaterial color="#4a2e16" />
        </mesh>
        <mesh position={[0.08, 0.02, -0.16]}>
          <boxGeometry args={[0.03, 0.08, 0.03]} />
          <meshStandardMaterial color="#4a2e16" />
        </mesh>
        <mesh position={[-0.08, 0.02, 0.16]}>
          <boxGeometry args={[0.03, 0.08, 0.03]} />
          <meshStandardMaterial color="#4a2e16" />
        </mesh>
        <mesh position={[0.08, 0.02, 0.16]}>
          <boxGeometry args={[0.03, 0.08, 0.03]} />
          <meshStandardMaterial color="#4a2e16" />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Gold Mine Component ---------- */

function GoldMine({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Foundation / Stone frame */}
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.0, 0.1, 1.0]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.8} />
      </mesh>
      {/* Mine entrance structure */}
      <group position={[0, 0.4, -0.2]}>
        {/* Left post */}
        <mesh position={[-0.36, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial color="#5c3f25" />
        </mesh>
        {/* Right post */}
        <mesh position={[0.36, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial color="#5c3f25" />
        </mesh>
        {/* Crossbeam */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.8, 0.08, 0.08]} />
          <meshStandardMaterial color="#5c3f25" />
        </mesh>
        {/* Dark mine shaft opening */}
        <mesh position={[0, -0.05, -0.05]}>
          <boxGeometry args={[0.64, 0.6, 0.02]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>
      {/* Golden ore cart / piles outside */}
      <group position={[0.26, 0.1, 0.26]}>
        {/* Wooden cart box */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.32, 0.2, 0.4]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        {/* Gold crystals in cart */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.14, 5, 4]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.05, 0.21, 0.06]}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
      {/* Small pile of raw gold beside the cart */}
      <mesh position={[-0.26, 0.12, 0.26]}>
        <sphereGeometry args={[0.13, 5, 4]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ---------- Elixir Collector Component ---------- */

function ElixirCollector({ position, rotation = 0 }) {
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
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.46, 0.12, 12]} />
        <meshStandardMaterial color="#b57a3d" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Central Glass Elixir tank */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.65, 10, 1, true]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.1} />
      </mesh>
      {/* Inner pink elixir liquid */}
      <mesh ref={liquidRef} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.58, 10]} />
        <meshStandardMaterial color="#d800a6" metalness={0.1} roughness={0.2} emissive="#680053" emissiveIntensity={0.2} />
      </mesh>
      {/* Bronze support structure & capping */}
      <group position={[0, 0.8, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 10]} />
          <meshStandardMaterial color="#b57a3d" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#dfab29" metalness={0.6} roughness={0.2} />
        </mesh>
      </group>
      {/* Copper tubes connecting to base */}
      <mesh position={[0.22, 0.42, 0.12]} rotation={[0.2, 0, -0.3]}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
        <meshStandardMaterial color="#c0392b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.22, 0.42, -0.12]} rotation={[-0.2, 0, 0.3]}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
        <meshStandardMaterial color="#c0392b" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ---------- Flower Patch ---------- */

function FlowerPatch({ position, color }) {
  const groupRef = useRef();
  const townHallHealth = useGameStore((state) => state.townHallHealth);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const target = townHallHealth >= 40 ? 1 : 0.1;
    const current = groupRef.current.scale.x;
    const next = THREE.MathUtils.damp(current, target, 3, delta);
    groupRef.current.scale.setScalar(Math.max(next, 0.05));
  });

  return (
    <group ref={groupRef} position={position} scale={0.05}>
      {/* Cluster of small flower dots */}
      {[-0.15, 0, 0.15].map((dx) =>
        [-0.1, 0.1].map((dz) => (
          <mesh key={`${dx}-${dz}`} position={[dx, 0.08, dz]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        ))
      )}
      {/* Stems */}
      {[-0.15, 0, 0.15].map((dx) => (
        <mesh key={`stem-${dx}`} position={[dx, 0.03, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.06, 4]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Fence Post ---------- */

function FencePost({ position, rotation }) {
  return (
    <group position={position}>
      {/* Vertical post */}
      <mesh castShadow>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#7a6b55" roughness={0.9} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 0.27, 0]}>
        <coneGeometry args={[0.06, 0.08, 4]} />
        <meshStandardMaterial color="#6b5d4e" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ---------- Cobblestone Path ---------- */

function CobblePath() {
  return (
    <group>
      {/* Main path from entrance southward */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 3.5]}>
        <planeGeometry args={[1.2, 4]} />
        <meshStandardMaterial color="#8a7d6b" roughness={1} />
      </mesh>
      {/* Path border stones */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <mesh position={[-0.65, 0.03, 1.8 + i * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.06, 6]} />
            <meshStandardMaterial color="#6b6152" roughness={1} />
          </mesh>
          <mesh position={[0.65, 0.03, 1.8 + i * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.06, 6]} />
            <meshStandardMaterial color="#6b6152" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- SmogField ---------- */

function SmogField() {
  const groupRef = useRef();
  const pollutionFactor = useGameStore((state) => state.pollutionFactor);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetOpacity = clamp(pollutionFactor, 0, 100) / 100;
    groupRef.current.children.forEach((mesh, i) => {
      mesh.position.y += delta * 0.06;
      if (mesh.position.y > 4.5) mesh.position.y = 1.0;
      // Slow horizontal drift
      mesh.position.x += Math.sin(i * 0.7) * delta * 0.02;
      mesh.material.opacity = THREE.MathUtils.damp(
        mesh.material.opacity,
        targetOpacity * (0.3 + 0.05 * (i % 6)),
        2,
        delta
      );
    });
  });

  return (
    <group ref={groupRef}>
      {SMOG_PARTICLES.map((p) => (
        <mesh key={p.seed} position={p.position}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshBasicMaterial color="#7a7a68" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Fireflies ---------- */

function FireflyField() {
  const groupRef = useRef();
  const townHallHealth = useGameStore((state) => state.townHallHealth);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const healthFraction = clamp(townHallHealth, 0, 100) / 100;
    const targetVisibility = healthFraction > 0.6 ? (healthFraction - 0.6) * 2.5 : 0;

    groupRef.current.children.forEach((mesh, i) => {
      const fly = FIREFLIES[i];
      if (!fly) return;
      // Gentle floating path
      mesh.position.x = fly.position[0] + Math.sin(t * fly.speed + fly.phase) * 0.8;
      mesh.position.y = fly.position[1] + Math.sin(t * fly.speed * 1.3 + fly.phase) * 0.4;
      mesh.position.z = fly.position[2] + Math.cos(t * fly.speed * 0.8 + fly.phase) * 0.6;
      // Pulsing glow
      const pulse = (Math.sin(t * 3 + fly.phase) + 1) * 0.5;
      mesh.material.opacity = targetVisibility * pulse * 0.8;
    });
  });

  return (
    <group ref={groupRef}>
      {FIREFLIES.map((f) => (
        <mesh key={f.seed} position={f.position}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ========== Main Environment ========== */

export default function Environment() {
  const { scene } = useThree();
  const pollutionFactor = useGameStore((state) => state.pollutionFactor);
  const plantedTreesCount = useGameStore((state) => state.plantedTreesCount);
  const isEvilFlashing = useGameStore((state) => state.isEvilFlashing);
  const fogRef = useRef();
  const lightRef = useRef();

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

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[10, 48]} />
        <meshStandardMaterial color="#5a7a42" roughness={1} />
      </mesh>

      {/* Cobblestone path */}
      <CobblePath />

      {/* Fence posts */}
      {FENCE_POSTS.map((fp, i) => (
        <FencePost key={i} position={fp.position} rotation={fp.rotation} />
      ))}
      {/* Fence rails connecting posts */}
      {FENCE_POSTS.map((fp, i) => {
        const next = FENCE_POSTS[(i + 1) % FENCE_POSTS.length];
        const midX = (fp.position[0] + next.position[0]) / 2;
        const midZ = (fp.position[2] + next.position[2]) / 2;
        const dx = next.position[0] - fp.position[0];
        const dz = next.position[2] - fp.position[2];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh key={`rail-${i}`} position={[midX, 0.2, midZ]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.03, 0.03, length]} />
            <meshStandardMaterial color="#7a6b55" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Base Trees */}
      {TREE_SLOTS.map((slot) => (
        <Tree key={slot.threshold} position={slot.position} threshold={slot.threshold} />
      ))}

      {/* Dynamically Planted Trees */}
      {PLANTED_TREE_SLOTS.map((pos, i) => (
        <Tree key={`planted-${i}`} position={pos} forceSpawn={i < plantedTreesCount} />
      ))}

      {/* Men Working (Low-Poly Animated Builder & Gardener) */}
      <Builder position={[-1.1, 0, 1.3]} rotation={Math.PI / 5} />
      <Gardener position={[1.4, 0, 1.4]} rotation={-Math.PI / 4} />

      {/* Clash of Clans Scenery Buildings */}
      <BuildersHut position={[-2.4, 0, -1.8]} rotation={Math.PI / 4} />
      <GoldMine position={[2.4, 0, -1.2]} rotation={-Math.PI / 3} />
      <ElixirCollector position={[2.0, 0, 2.6]} rotation={Math.PI / 6} />

      {/* Flower patches */}
      {FLOWER_PATCHES.map((fp, i) => (
        <FlowerPatch key={i} position={fp.position} color={fp.color} />
      ))}

      <SmogField />
      <FireflyField />
    </>
  );
}
