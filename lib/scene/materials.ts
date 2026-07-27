/* Material factories for The Substrate (SPEC §6). The GLB's own materials
   are couriers/placeholders — every mesh gets an authored override at load
   (the reference pattern from v2/site/src/lib/three/materials.ts). */

import * as THREE from 'three'

/* Near-black solder mask: albedo ~0.03, roughness .5 (SPEC §6). */
export function createSolderMaskMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x080809,
    roughness: 0.5,
    metalness: 0.1,
    envMapIntensity: 0.6,
  })
}

/* Components: matte black / restrained metal. */
export function createComponentMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x0d0d0f,
    roughness: 0.42,
    metalness: 0.6,
    envMapIntensity: 0.7,
  })
}

/* Gold contacts: roughness .3 — the one bright metal on the board. */
export function createGoldMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8c6b28,
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 0.9,
  })
}

/* Die silicon: subtle iridescence 0.15, IOR 1.3 (SPEC §6). */
export function createDieSiliconMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0a0a10,
    roughness: 0.28,
    metalness: 0.4,
    iridescence: 0.15,
    iridescenceIOR: 1.3,
    envMapIntensity: 0.8,
  })
}

/* The lifted IHS: cool brushed metal, dim — a mirror here blows to a white
   slab under the key (exposure discipline, SPEC §12.3). */
export function createIhsMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x595b63,
    metalness: 1.0,
    roughness: 0.26,
    anisotropy: 0.8,
    anisotropyRotation: Math.PI / 2,
    envMapIntensity: 0.55,
  })
}

/* Plinth: honed near-black granite with a clearcoat sheen. */
export function createGraniteMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0c0c0e,
    roughness: 0.32,
    metalness: 0.0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.55,
  })
}

/* Floor: near-black polished — holds the fog cards and a whisper of
   reflection, nothing more. */
export function createFloorMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x060607,
    roughness: 0.34,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.5,
  })
}

/* Fog card texture: radial gradient sprite, soft pool — the fog is shader
   cards + scene fog, never true volumetrics (SPEC §3/§10). */
export function createFogCardTexture(): THREE.CanvasTexture {
  const s = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const g = cv.getContext('2d')!
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(16,18,22,0.55)')
  grad.addColorStop(0.55, 'rgba(10,12,16,0.28)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.NoColorSpace
  return t
}
