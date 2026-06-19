import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

const FLOWER_COLORS = ['#f472b6', '#facc15', '#c084fc', '#fb923c', '#f87171', '#34d399'];

export function useEnvironmentAssets() {
  const assets = useMemo(() => {
    // Tree assets
    const tree = {
      trunkGeom: new THREE.CylinderGeometry(0.06, 0.1, 0.9, 6),
      trunkMat: new THREE.MeshStandardMaterial({ color: '#6b5638', roughness: 0.9 }),
      canopy1Geom: new THREE.ConeGeometry(0.5, 0.7, 7),
      canopy1Mat: new THREE.MeshStandardMaterial({ color: '#2d6a2d', roughness: 0.8 }),
      canopy2Geom: new THREE.ConeGeometry(0.35, 0.6, 7),
      canopy2Mat: new THREE.MeshStandardMaterial({ color: '#3f7a3a', roughness: 0.75 }),
      canopy3Geom: new THREE.ConeGeometry(0.2, 0.35, 7),
      canopy3Mat: new THREE.MeshStandardMaterial({ color: '#4a8a44', roughness: 0.7 }),
    };

    // Fence assets
    const fence = {
      postGeom: new THREE.BoxGeometry(0.08, 0.5, 0.08),
      postMat: new THREE.MeshStandardMaterial({ color: '#7a6b55', roughness: 0.9 }),
      capGeom: new THREE.ConeGeometry(0.06, 0.08, 4),
      capMat: new THREE.MeshStandardMaterial({ color: '#6b5d4e', roughness: 0.8 }),
      railGeom: new THREE.BoxGeometry(1, 1, 1), // Unit geometry scaled dynamically
      railMat: new THREE.MeshStandardMaterial({ color: '#7a6b55', roughness: 0.9 }),
    };

    // Flower assets
    const flowerMats = {};
    FLOWER_COLORS.forEach((color) => {
      flowerMats[color] = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    });

    const flower = {
      stemGeom: new THREE.CylinderGeometry(0.01, 0.01, 0.06, 4),
      stemMat: new THREE.MeshStandardMaterial({ color: '#4a7a3a', roughness: 0.9 }),
      petalGeom: new THREE.SphereGeometry(0.06, 6, 6),
      mats: flowerMats,
    };

    // Cobble path assets
    const path = {
      pathGeom: new THREE.PlaneGeometry(1.2, 4),
      pathMat: new THREE.MeshStandardMaterial({ color: '#8a7d6b', roughness: 1 }),
      borderGeom: new THREE.CircleGeometry(0.06, 6),
      borderMat: new THREE.MeshStandardMaterial({ color: '#6b6152', roughness: 1 }),
    };

    // Builder assets
    const builder = {
      vestGeom: new THREE.BoxGeometry(0.24, 0.3, 0.16),
      vestMat: new THREE.MeshStandardMaterial({ color: '#5c3f25', roughness: 0.8 }),
      pantsGeom: new THREE.BoxGeometry(0.22, 0.15, 0.14),
      pantsMat: new THREE.MeshStandardMaterial({ color: '#2d4a6e', roughness: 0.9 }),
      legGeom: new THREE.BoxGeometry(0.07, 0.1, 0.08),
      legMat: new THREE.MeshStandardMaterial({ color: '#1a2b40' }),
      headGeom: new THREE.BoxGeometry(0.18, 0.18, 0.18),
      headMat: new THREE.MeshStandardMaterial({ color: '#ffcc99', roughness: 0.6 }),
      helmetGeom: new THREE.CylinderGeometry(0.1, 0.11, 0.08, 6),
      helmetMat: new THREE.MeshStandardMaterial({ color: '#e5a93b', metalness: 0.2, roughness: 0.3 }),
      brimGeom: new THREE.BoxGeometry(0.22, 0.02, 0.22),
      brimMat: new THREE.MeshStandardMaterial({ color: '#e5a93b' }),
      leftArmGeom: new THREE.BoxGeometry(0.06, 0.22, 0.06),
      leftArmMat: new THREE.MeshStandardMaterial({ color: '#ffcc99' }),
      rightArmGeom: new THREE.BoxGeometry(0.06, 0.2, 0.06),
      rightArmMat: new THREE.MeshStandardMaterial({ color: '#ffcc99' }),
      handleGeom: new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6),
      handleMat: new THREE.MeshStandardMaterial({ color: '#7a5b3a' }),
      hammerHeadGeom: new THREE.BoxGeometry(0.08, 0.08, 0.12),
      hammerHeadMat: new THREE.MeshStandardMaterial({ color: '#4a4a4a', metalness: 0.5, roughness: 0.4 }),
      blockGeom: new THREE.BoxGeometry(0.3, 0.16, 0.3),
      blockMat: new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 0.9 }),
    };

    // Gardener assets
    const gardener = {
      tunicGeom: new THREE.BoxGeometry(0.22, 0.3, 0.16),
      tunicMat: new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8 }),
      pantsGeom: new THREE.BoxGeometry(0.2, 0.15, 0.14),
      pantsMat: new THREE.MeshStandardMaterial({ color: '#4e3b2b', roughness: 0.9 }),
      legGeom: new THREE.BoxGeometry(0.07, 0.1, 0.08),
      legMat: new THREE.MeshStandardMaterial({ color: '#302015' }),
      headGeom: new THREE.BoxGeometry(0.18, 0.18, 0.18),
      headMat: new THREE.MeshStandardMaterial({ color: '#ffcc99', roughness: 0.6 }),
      hoodGeom: new THREE.BoxGeometry(0.2, 0.1, 0.22),
      hoodMat: new THREE.MeshStandardMaterial({ color: '#4e3b2b', roughness: 0.7 }),
      leftArmGeom: new THREE.BoxGeometry(0.06, 0.2, 0.06),
      leftArmMat: new THREE.MeshStandardMaterial({ color: '#ffcc99' }),
      handleGeom: new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6),
      handleMat: new THREE.MeshStandardMaterial({ color: '#6b513d' }),
      bladeGeom: new THREE.BoxGeometry(0.08, 0.1, 0.015),
      bladeMat: new THREE.MeshStandardMaterial({ color: '#a0a0a0', metalness: 0.6, roughness: 0.3 }),
      dirtGeom: new THREE.SphereGeometry(0.15, 6, 4),
      dirtMat: new THREE.MeshStandardMaterial({ color: '#402a15', roughness: 1 }),
    };

    // BuildersHut assets
    const hut = {
      floorGeom: new THREE.BoxGeometry(0.9, 0.08, 0.9),
      floorMat: new THREE.MeshStandardMaterial({ color: '#5c3a21', roughness: 0.9 }),
      wallGeom: new THREE.BoxGeometry(0.72, 0.54, 0.72),
      wallMat: new THREE.MeshStandardMaterial({ color: '#8e6239', roughness: 0.8 }),
      doorGeom: new THREE.BoxGeometry(0.22, 0.38, 0.04),
      doorMat: new THREE.MeshStandardMaterial({ color: '#2d1a0e' }),
      windowGeom: new THREE.BoxGeometry(0.18, 0.18, 0.04),
      windowMat: new THREE.MeshStandardMaterial({ color: '#ffd200', roughness: 0.1 }),
      roofGeom: new THREE.ConeGeometry(0.62, 0.44, 4),
      roofMat: new THREE.MeshStandardMaterial({ color: '#cca43b', roughness: 0.9 }),
      tableGeom: new THREE.BoxGeometry(0.26, 0.04, 0.45),
      tableMat: new THREE.MeshStandardMaterial({ color: '#6b4423' }),
      legGeom: new THREE.BoxGeometry(0.03, 0.08, 0.03),
      legMat: new THREE.MeshStandardMaterial({ color: '#4a2e16' }),
    };

    // GoldMine assets
    const mine = {
      foundationGeom: new THREE.BoxGeometry(1.0, 0.1, 1.0),
      foundationMat: new THREE.MeshStandardMaterial({ color: '#7a7a7a', roughness: 0.8 }),
      postGeom: new THREE.BoxGeometry(0.08, 0.7, 0.08),
      postMat: new THREE.MeshStandardMaterial({ color: '#5c3f25' }),
      beamGeom: new THREE.BoxGeometry(0.8, 0.08, 0.08),
      beamMat: new THREE.MeshStandardMaterial({ color: '#5c3f25' }),
      shaftGeom: new THREE.BoxGeometry(0.64, 0.6, 0.02),
      shaftMat: new THREE.MeshBasicMaterial({ color: '#000000' }),
      cartGeom: new THREE.BoxGeometry(0.32, 0.2, 0.4),
      cartMat: new THREE.MeshStandardMaterial({ color: '#8b5a2b' }),
      goldLargeGeom: new THREE.SphereGeometry(0.14, 5, 4),
      goldMat: new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.9, roughness: 0.1 }),
      goldSmallGeom: new THREE.SphereGeometry(0.09, 5, 4),
      goldPileGeom: new THREE.SphereGeometry(0.13, 5, 4),
      goldPileMat: new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.9, roughness: 0.2 }),
    };

    // ElixirCollector assets
    const elixir = {
      baseGeom: new THREE.CylinderGeometry(0.42, 0.46, 0.12, 12),
      baseMat: new THREE.MeshStandardMaterial({ color: '#b57a3d', metalness: 0.4, roughness: 0.4 }),
      glassGeom: new THREE.CylinderGeometry(0.22, 0.22, 0.65, 10, 1, true),
      glassMat: new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, roughness: 0.1 }),
      liquidGeom: new THREE.CylinderGeometry(0.18, 0.18, 0.58, 10),
      liquidMat: new THREE.MeshStandardMaterial({
        color: '#d800a6',
        metalness: 0.1,
        roughness: 0.2,
        emissive: '#680053',
        emissiveIntensity: 0.2,
      }),
      capGeom: new THREE.CylinderGeometry(0.24, 0.24, 0.08, 10),
      capMat: new THREE.MeshStandardMaterial({ color: '#b57a3d', metalness: 0.4, roughness: 0.4 }),
      sphereGeom: new THREE.SphereGeometry(0.07, 8, 8),
      sphereMat: new THREE.MeshStandardMaterial({ color: '#dfab29', metalness: 0.6, roughness: 0.2 }),
      tubeGeom: new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6),
      tubeMat: new THREE.MeshStandardMaterial({ color: '#c0392b', metalness: 0.7, roughness: 0.3 }),
    };

    return {
      tree,
      fence,
      flower,
      path,
      builder,
      gardener,
      hut,
      mine,
      elixir,
    };
  }, []);

  useEffect(() => {
    return () => {
      // Recursively dispose of geometries and materials to avoid WebGL memory leaks
      const disposeAll = (obj) => {
        for (const key in obj) {
          if (obj[key] instanceof THREE.BufferGeometry || obj[key] instanceof THREE.Material) {
            obj[key].dispose();
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            disposeAll(obj[key]);
          }
        }
      };
      disposeAll(assets);
    };
  }, [assets]);

  return assets;
}
