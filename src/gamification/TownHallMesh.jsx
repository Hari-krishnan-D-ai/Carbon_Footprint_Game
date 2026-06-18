import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { clamp } from '../utils/gameLogic.js';

const HEALTHY_COLOR = new THREE.Color('#5b8c5a');
const CRITICAL_COLOR = new THREE.Color('#8b3a2a');
const WINDOW_GLOW_HEALTHY = new THREE.Color('#fbbf24');
const WINDOW_GLOW_DIM = new THREE.Color('#2a1d0e');
const FLAG_HEALTHY = new THREE.Color('#22c55e');
const FLAG_CRITICAL = new THREE.Color('#dc2626');

/* ---- Small reusable sub-meshes ---- */

function Pillar({ position }) {
  return (
    <group position={position}>
      {/* Pillar shaft */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 1.2, 8]} />
        <meshStandardMaterial color="#a0937d" roughness={0.8} />
      </mesh>
      {/* Capital */}
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.22]} />
        <meshStandardMaterial color="#b5a78e" roughness={0.7} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.2]} />
        <meshStandardMaterial color="#8a7d6b" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Window({ position, rotation = [0, 0, 0], glowRef }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Window recess */}
      <mesh>
        <boxGeometry args={[0.35, 0.5, 0.06]} />
        <meshStandardMaterial color="#1a1510" roughness={1} />
      </mesh>
      {/* Window frame */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.4, 0.55, 0.02]} />
        <meshStandardMaterial color="#6b5d4e" roughness={0.8} />
      </mesh>
      {/* Window glow pane */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.3, 0.44]} />
        <meshBasicMaterial ref={glowRef} color="#fbbf24" transparent opacity={0.6} />
      </mesh>
      {/* Window arch */}
      <mesh position={[0, 0.28, 0.03]}>
        <cylinderGeometry args={[0.175, 0.175, 0.02, 12, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#6b5d4e" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Door({ position }) {
  return (
    <group position={position}>
      {/* Door frame */}
      <mesh>
        <boxGeometry args={[0.65, 0.9, 0.08]} />
        <meshStandardMaterial color="#5b4a3a" roughness={0.85} />
      </mesh>
      {/* Door panels */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.55, 0.8, 0.04]} />
        <meshStandardMaterial color="#3a2d22" roughness={0.9} />
      </mesh>
      {/* Door arch top */}
      <mesh position={[0, 0.45, 0.03]}>
        <cylinderGeometry args={[0.275, 0.275, 0.04, 12, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#5b4a3a" roughness={0.85} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.15, 0, 0.06]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function BellTower() {
  return (
    <group position={[0, 3.8, 0]}>
      {/* Tower body */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.8, 0.7]} />
        <meshStandardMaterial color="#8a7d6b" roughness={0.8} />
      </mesh>
      {/* Open arches (dark recesses on each side) */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rot, i) => (
        <mesh key={i} position={[
          Math.sin(rot) * 0.36,
          0,
          Math.cos(rot) * 0.36
        ]} rotation={[0, rot, 0]}>
          <planeGeometry args={[0.35, 0.5]} />
          <meshBasicMaterial color="#0d0b08" />
        </mesh>
      ))}
      {/* Bell */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.12, 0.08, 0.2, 8, 1, true]} />
        <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Tower roof */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <coneGeometry args={[0.55, 0.7, 4]} />
        <meshStandardMaterial color="#6b3d2e" roughness={0.7} />
      </mesh>
      {/* Finial */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Flag({ flagMeshRef, flagMaterialRef }) {
  return (
    <group position={[0.8, 3.4, 0.8]}>
      {/* Flag pole */}
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshStandardMaterial color="#5b4a3a" roughness={0.8} />
      </mesh>
      {/* Flag banner */}
      <mesh ref={flagMeshRef} position={[0.2, 0.45, 0]}>
        <planeGeometry args={[0.4, 0.25]} />
        <meshStandardMaterial ref={flagMaterialRef} color="#22c55e" side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ---- Main Town Hall ---- */

export default function TownHallMesh() {
  const townHallHealth = useGameStore((state) => state.townHallHealth);
  const lastImpact = useGameStore((state) => state.lastImpact);

  const groupRef = useRef();
  const bodyMaterialRef = useRef();
  const flagMeshRef = useRef();
  const flagMaterialRef = useRef();
  const windowGlowRefs = useRef([]);
  const crackRefs = useRef([]);
  const shakeUntilRef = useRef(0);
  const prevHealthRef = useRef(townHallHealth);

  // Store refs for window glows
  const makeWindowGlowRef = (index) => (el) => {
    if (el) windowGlowRefs.current[index] = el;
  };

  // Store refs for cracks
  const makeCrackRef = (index) => (el) => {
    if (el) crackRefs.current[index] = el;
  };

  // Trigger a brief shake whenever health drops (a "damage" hit landed).
  useEffect(() => {
    if (townHallHealth < prevHealthRef.current) {
      shakeUntilRef.current = performance.now() + 400;
    }
    prevHealthRef.current = townHallHealth;
  }, [townHallHealth]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const healthFraction = clamp(townHallHealth, 0, 100) / 100;

    // Gentle idle bob so the structure feels alive.
    let y = Math.sin(t * 0.5) * 0.02;

    // Shake on recent damage — more intense.
    const now = performance.now();
    if (now < shakeUntilRef.current) {
      const intensity = (shakeUntilRef.current - now) / 400;
      y += Math.sin(now * 0.09) * 0.1 * intensity;
      if (groupRef.current) {
        groupRef.current.position.x = Math.sin(now * 0.13) * 0.06 * intensity;
        groupRef.current.rotation.z = Math.sin(now * 0.11) * 0.01 * intensity;
      }
    } else if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, 0, 8, 0.016);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 8, 0.016);
    }

    if (groupRef.current) {
      groupRef.current.position.y = y;
      const scale = 0.9 + healthFraction * 0.1;
      groupRef.current.scale.setScalar(scale);
    }

    // Body color lerp
    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.color.copy(HEALTHY_COLOR).lerp(CRITICAL_COLOR, 1 - healthFraction);
    }

    // Flag color lerp
    if (flagMaterialRef.current) {
      flagMaterialRef.current.color.copy(FLAG_HEALTHY).lerp(FLAG_CRITICAL, 1 - healthFraction);
    }
    // Gentle flag wave
    if (flagMeshRef.current) {
      flagMeshRef.current.rotation.z = Math.sin(t * 2) * 0.15;
    }

    // Window glow intensity tracks health
    const glowIntensity = 0.1 + healthFraction * 0.7;
    const glowColor = WINDOW_GLOW_HEALTHY.clone().lerp(WINDOW_GLOW_DIM, 1 - healthFraction);
    windowGlowRefs.current.forEach((mat) => {
      if (mat) {
        mat.opacity = glowIntensity;
        mat.color.copy(glowColor);
      }
    });

    // Cracks grow as health falls
    crackRefs.current.forEach((mesh) => {
      if (mesh) {
        const crackVisibility = clamp(1 - healthFraction, 0, 1);
        mesh.scale.set(1, 0.3 + crackVisibility * 2.0, 1);
        mesh.material.opacity = crackVisibility * 0.9;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ===== FOUNDATION ===== */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.2, 3.2]} />
        <meshStandardMaterial color="#5b5444" roughness={0.95} />
      </mesh>
      {/* Foundation step */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[3.5, 0.06, 2.9]} />
        <meshStandardMaterial color="#6b6152" roughness={0.9} />
      </mesh>

      {/* ===== MAIN HALL BODY ===== */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 2.0, 2.4]} />
        <meshStandardMaterial ref={bodyMaterialRef} color="#5b8c5a" roughness={0.75} />
      </mesh>

      {/* Stone block lines (decorative horizontal bands) */}
      {[0.6, 1.2, 1.8].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[3.02, 0.02, 2.42]} />
          <meshStandardMaterial color="#4a5a49" roughness={0.9} />
        </mesh>
      ))}

      {/* ===== WINDOWS - Front face ===== */}
      <Window position={[-0.8, 1.5, 1.22]} glowRef={makeWindowGlowRef(0)} />
      <Window position={[0.8, 1.5, 1.22]} glowRef={makeWindowGlowRef(1)} />

      {/* ===== WINDOWS - Back face ===== */}
      <Window position={[-0.8, 1.5, -1.22]} rotation={[0, Math.PI, 0]} glowRef={makeWindowGlowRef(2)} />
      <Window position={[0.8, 1.5, -1.22]} rotation={[0, Math.PI, 0]} glowRef={makeWindowGlowRef(3)} />

      {/* ===== WINDOWS - Side faces ===== */}
      <Window position={[1.52, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} glowRef={makeWindowGlowRef(4)} />
      <Window position={[-1.52, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} glowRef={makeWindowGlowRef(5)} />

      {/* ===== FRONT DOOR ===== */}
      <Door position={[0, 0.75, 1.23]} />

      {/* ===== PILLARS flanking entrance ===== */}
      <Pillar position={[-0.45, 0.3, 1.35]} />
      <Pillar position={[0.45, 0.3, 1.35]} />
      {/* Rear pillars */}
      <Pillar position={[-0.45, 0.3, -1.35]} />
      <Pillar position={[0.45, 0.3, -1.35]} />

      {/* ===== MAIN ROOF (gable) ===== */}
      <mesh position={[0, 2.85, 0]} castShadow rotation={[0, Math.PI / 2, 0]}>
        <coneGeometry args={[1.85, 1.3, 4]} />
        <meshStandardMaterial color="#8b4726" roughness={0.65} />
      </mesh>
      {/* Roof ridge beam */}
      <mesh position={[0, 3.1, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[3.1, 0.06, 0.06]} />
        <meshStandardMaterial color="#6b3d2e" roughness={0.7} />
      </mesh>

      {/* ===== BELL TOWER ===== */}
      <BellTower />

      {/* ===== FLAG ===== */}
      <Flag flagMeshRef={flagMeshRef} flagMaterialRef={flagMaterialRef} />

      {/* ===== CRACKS (multiple faces) ===== */}
      {/* Front crack */}
      <mesh ref={makeCrackRef(0)} position={[0.3, 1.3, 1.21]}>
        <planeGeometry args={[0.08, 1.0]} />
        <meshBasicMaterial color="#1b1a17" transparent opacity={0} />
      </mesh>
      {/* Side crack */}
      <mesh ref={makeCrackRef(1)} position={[1.51, 1.1, 0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.06, 0.8]} />
        <meshBasicMaterial color="#1b1a17" transparent opacity={0} />
      </mesh>
      {/* Diagonal crack on front */}
      <mesh ref={makeCrackRef(2)} position={[-0.4, 1.6, 1.21]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[0.05, 0.7]} />
        <meshBasicMaterial color="#1b1a17" transparent opacity={0} />
      </mesh>

      {/* ===== Entrance overhang ===== */}
      <mesh position={[0, 1.35, 1.45]} castShadow>
        <boxGeometry args={[1.2, 0.06, 0.4]} />
        <meshStandardMaterial color="#6b3d2e" roughness={0.7} />
      </mesh>
      {/* Overhang supports */}
      <mesh position={[-0.5, 1.15, 1.4]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
        <meshStandardMaterial color="#5b4a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 1.15, 1.4]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
        <meshStandardMaterial color="#5b4a3a" roughness={0.8} />
      </mesh>
    </group>
  );
}
