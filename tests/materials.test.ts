import { describe, expect, it } from 'vitest'
import {
  createComponentMaterial,
  createDieSiliconMaterial,
  createFloorMaterial,
  createGoldMaterial,
  createGraniteMaterial,
  createSolderMaskMaterial,
} from '../lib/scene/materials'

describe('board materials (SPEC §6)', () => {
  it('solder mask is near-black with mid roughness', () => {
    const m = createSolderMaskMaterial()
    expect(m.color.r).toBeLessThanOrEqual(0.04)
    expect(m.roughness).toBeCloseTo(0.5, 2)
  })

  it('gold contacts: full metal, roughness .3', () => {
    const m = createGoldMaterial()
    expect(m.metalness).toBe(1)
    expect(m.roughness).toBeCloseTo(0.3, 2)
  })

  it('die silicon carries the subtle iridescence', () => {
    const m = createDieSiliconMaterial()
    expect(m.iridescence).toBeCloseTo(0.15, 2)
    expect(m.iridescenceIOR).toBeCloseTo(1.3, 2)
  })

  it('components are restrained (no glossy plastic)', () => {
    const m = createComponentMaterial()
    expect(m.roughness).toBeGreaterThanOrEqual(0.4)
  })

  it('granite and floor stay near-black', () => {
    expect(createGraniteMaterial().color.r).toBeLessThan(0.06)
    expect(createFloorMaterial().color.r).toBeLessThan(0.04)
  })
})
