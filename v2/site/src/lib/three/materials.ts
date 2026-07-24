/* Material factories for the Strata set (DESIGN.md §10.2). The GLB's own
   node materials are placeholders — every mesh gets an authored override. */

import * as THREE from 'three';
import { SIGNAL } from './rig';

/* The deterministic jali fill pattern — 4×4 lattice, 8 cells filled. */
export const JALI_CELLS = [0, 2, 5, 6, 9, 11, 12, 15];

/* Glass strata: optical glass with native per-channel IOR dispersion
   (r167+, no shader chunk needed). Variants per DESIGN.md §10.2:
   clear (strata_0/4), frosted (strata_1/3), smoked (strata_2). */
export function createStrataGlassMaterial(variant: 'clear' | 'frosted' | 'smoked'): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    transmission: 1.0,
    roughness: 0.05,
    thickness: 0.5,
    ior: 1.52,
    dispersion: 0.006,
    color: 0xffffff,
    envMapIntensity: 1.0,
    specularIntensity: 0.8,
    clearcoat: 0.06,
    clearcoatRoughness: 0.18,
  });
  if (variant === 'frosted') {
    mat.roughness = 0.3;
    mat.clearcoat = 0.05;
  } else if (variant === 'smoked') {
    mat.color.set(0x2a2c33);
    mat.envMapIntensity = 1.0;
  }
  return mat;
}

/* Chrome sphere: the mirror that shows the studio honestly. */
export function createChromeMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    metalness: 1.0,
    roughness: 0.045,
    envMapIntensity: 1.4,
    color: 0xffffff,
  });
}

function graniteBumpTexture(): THREE.CanvasTexture {
  const s = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, s, s);
  // broad tonal blotches
  for (let i = 0; i < 34; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = 14 + Math.random() * 40;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const v = 112 + Math.floor(Math.random() * 34);
    grad.addColorStop(0, `rgba(${v},${v},${v},0.45)`);
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  }
  // fine grain
  const img = g.getImageData(0, 0, s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  return t;
}

/* Plinth: honed near-black granite, clearcoat sheen, procedural bump. */
export function createGraniteMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0c0c0e,
    roughness: 0.32,
    metalness: 0.0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.22,
    bumpMap: graniteBumpTexture(),
    bumpScale: 0.4,
    envMapIntensity: 0.55,
  });
}

/* Floor: near-black polished — holds reflections of the set, nothing more. */
export function createFloorMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x060607,
    roughness: 0.34,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.5,
  });
}

/* Jali screen: dark bronze metal lattice. */
export function createBronzeMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x4a3826,
    metalness: 0.9,
    roughness: 0.42,
    envMapIntensity: 0.8,
  });
}

/* Counterweight bar: brushed metal with anisotropic highlights. Kept dim —
   a mirror here blows to a white bar under the key (R13). */
export function createBrushedMetalMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x8a8d92,
    metalness: 1.0,
    roughness: 0.26,
    anisotropy: 0.8,
    anisotropyRotation: Math.PI / 2,
    envMapIntensity: 0.55,
  });
}

/* The cursor cube: noor — the only self-lit object. "The cursor is the
   light": signal-green emissive, bright enough to bloom and to drive the
   paired point light that actually lights its neighbours. */
export function createCursorCubeMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x101508,
    emissive: SIGNAL,
    emissiveIntensity: 3.5,
    roughness: 0.35,
    metalness: 0.0,
  });
}

/* Jali lattice textures for the volumetric cookie (DESIGN.md §10.5): the
   same 4×4 pattern the physical screen casts, bright where light passes,
   dark where cells and frames block. Returns a sharp and a blurred map so
   the cone can soften the mask as it spreads toward the floor. */
export function createJaliCookieTextures(): { sharp: THREE.CanvasTexture; soft: THREE.CanvasTexture } {
  const s = 512;
  const cell = s / 4;
  const frame = s * 0.045; // ~25mm frames on a 1.6m screen

  const draw = (blur: boolean) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const g = cv.getContext('2d')!;
    if (blur) g.filter = 'blur(10px)';
    g.fillStyle = '#000000';
    g.fillRect(0, 0, s, s);
    // open cells pass light
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 16; i++) {
      if (JALI_CELLS.includes(i)) continue;
      const x = (i % 4) * cell + frame / 2;
      const y = Math.floor(i / 4) * cell + frame / 2;
      g.fillRect(x, y, cell - frame, cell - frame);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  };

  return { sharp: draw(false), soft: draw(true) };
}
