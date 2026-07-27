import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  mulberry32,
  sampleMaskPoints,
  sampleMeshSurfacePoints,
} from '../lib/scene/gpgpu'

describe('sampleMaskPoints', () => {
  const img = (() => {
    // 4x4 mask: bright corridor down column 1 (r channel), black elsewhere
    const data = new Uint8ClampedArray(4 * 4 * 4)
    for (let y = 0; y < 4; y++) {
      data[(y * 4 + 1) * 4] = 255
    }
    return { data, width: 4, height: 4 }
  })()

  it('samples only lit pixels, mapped through toWorld', () => {
    const pts = sampleMaskPoints(
      img,
      8,
      (u, v) => [u * 12, 0.6, v * 9.6],
      mulberry32(7)
    )
    expect(pts).toHaveLength(8 * 3)
    for (let i = 0; i < 8; i++) {
      const x = pts[i * 3]!
      // corridor lives at u ∈ [0.25, 0.5) of a 12-unit board
      expect(x).toBeGreaterThanOrEqual(3)
      expect(x).toBeLessThan(6.1)
      // float32 round-trip: 0.6 is not exactly representable
      expect(pts[i * 3 + 1]).toBeCloseTo(0.6, 6)
    }
  })

  it('is deterministic for a fixed seed', () => {
    const a = sampleMaskPoints(img, 8, (u, v) => [u, 0, v], mulberry32(42))
    const b = sampleMaskPoints(img, 8, (u, v) => [u, 0, v], mulberry32(42))
    expect(Array.from(a)).toEqual(Array.from(b))
  })

  it('returns a finite zero field for an all-dark mask (no NaN)', () => {
    const dark = { data: new Uint8ClampedArray(4 * 4 * 4), width: 4, height: 4 }
    const pts = sampleMaskPoints(dark, 8, (u, v) => [u, 1, v], mulberry32(3))
    expect(pts).toHaveLength(8 * 3)
    for (const v of pts) expect(v).toBe(0)
  })
})

describe('sampleMeshSurfacePoints', () => {
  it('returns a zero field when no meshes carry usable triangles', () => {
    const pts = sampleMeshSurfacePoints([], 8, mulberry32(5))
    expect(pts).toHaveLength(8 * 3)
    for (const v of pts) expect(v).toBe(0)
  })

  it('samples points on the mesh surface in world space', () => {
    // PlaneGeometry lies in the XY plane: after translation, points sit at
    // x∈[9,11], y∈[-41,-39], z=3
    const geo = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial())
    mesh.position.set(10, -40, 3)
    mesh.updateMatrixWorld(true)
    const pts = sampleMeshSurfacePoints([mesh], 16, mulberry32(1))
    expect(pts).toHaveLength(16 * 3)
    for (let i = 0; i < 16; i++) {
      expect(Math.abs(pts[i * 3]! - 10)).toBeLessThanOrEqual(1.001)
      expect(Math.abs(pts[i * 3 + 1]! - -40)).toBeLessThanOrEqual(1.001)
      expect(pts[i * 3 + 2]).toBeCloseTo(3, 3)
    }
  })
})
