import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore.js';
import { clamp } from '../../utils/gameLogic.js';

const SMOG_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  seed: i,
  position: [Math.sin(i * 12.9) * 7, 1.5 + (i % 5) * 0.7, Math.cos(i * 7.3) * 7],
}));

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

export function SmogField() {
  const meshRef = useRef();
  const pollutionFactor = useGameStore((state) => state.pollutionFactor);

  const particles = useMemo(() => SMOG_PARTICLES.map((p) => ({
    x: p.position[0],
    y: p.position[1],
    z: p.position[2],
    seed: p.seed,
  })), []);

  const { geometry, material } = useMemo(() => {
    return {
      geometry: new THREE.SphereGeometry(0.6, 8, 8),
      material: new THREE.MeshBasicMaterial({
        color: new THREE.Color('#7a7a68'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const targetOpacity = clamp(pollutionFactor, 0, 100) / 100;

    // Fade the global material opacity
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      targetOpacity * 0.35,
      2,
      delta
    );

    meshRef.current.visible = material.opacity > 0.001;

    if (meshRef.current.visible) {
      particles.forEach((p, i) => {
        // Slow vertical rise
        p.y += delta * 0.06;
        if (p.y > 4.5) p.y = 1.0;
        // Slow horizontal drift
        p.x += Math.sin(p.seed * 0.7) * delta * 0.02;

        tempObject.position.set(p.x, p.y, p.z);
        // Vary the scale based on the seed & height to simulate opacity variance
        const seedScale = 0.8 + 0.1 * (p.seed % 3);
        const heightFade = p.y > 4.0 ? (4.5 - p.y) / 0.5 : 1.0;
        tempObject.scale.setScalar(seedScale * heightFade);
        
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, particles.length]}
    />
  );
}

export function FireflyField() {
  const meshRef = useRef();
  const townHallHealth = useGameStore((state) => state.townHallHealth);

  const particles = useMemo(() => FIREFLIES.map((f) => ({ ...f })), []);

  const { geometry, material } = useMemo(() => {
    return {
      geometry: new THREE.SphereGeometry(0.04, 6, 6),
      material: new THREE.MeshBasicMaterial({
        color: new THREE.Color('#fde68a'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const healthFraction = clamp(townHallHealth, 0, 100) / 100;
    const targetVisibility = healthFraction > 0.6 ? (healthFraction - 0.6) * 2.5 : 0;

    // Smoothly update global material opacity
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      targetVisibility * 0.8,
      2,
      delta
    );

    meshRef.current.visible = material.opacity > 0.001;

    if (meshRef.current.visible) {
      particles.forEach((fly, i) => {
        // Gentle floating path
        const x = fly.position[0] + Math.sin(t * fly.speed + fly.phase) * 0.8;
        const y = fly.position[1] + Math.sin(t * fly.speed * 1.3 + fly.phase) * 0.4;
        const z = fly.position[2] + Math.cos(t * fly.speed * 0.8 + fly.phase) * 0.6;

        tempObject.position.set(x, y, z);
        // Pulsing glow simulated via scaling
        const pulse = (Math.sin(t * 3 + fly.phase) + 1) * 0.5;
        tempObject.scale.setScalar(pulse);
        
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, particles.length]}
    />
  );
}
