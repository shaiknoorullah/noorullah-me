import { describe, expect, it } from 'vitest'
import { detectTier, resolveTier } from './quality'

// Base env helper for all test cases.
const baseEnv = {
  coarsePointer: false,
  webglRenderer: 'NVIDIA GeForce RTX 3080',
}

describe('resolveTier', () => {
  it('forced "low" wins over everything else', () => {
    expect(resolveTier({ ...baseEnv, forcedTier: 'low' })).toBe('low')
  })

  it('forced "mid" wins over everything else', () => {
    expect(resolveTier({ ...baseEnv, forcedTier: 'mid' })).toBe('mid')
  })

  it('forced "high" wins over everything else', () => {
    expect(resolveTier({ ...baseEnv, forcedTier: 'high' })).toBe('high')
  })

  it('forced garbage ("ultra") is ignored, falls through to "high"', () => {
    expect(resolveTier({ ...baseEnv, forcedTier: 'ultra' })).toBe('high')
  })

  it('coarsePointer: true returns "low"', () => {
    expect(resolveTier({ ...baseEnv, coarsePointer: true })).toBe('low')
  })

  it('deviceMemory: 4 returns "low"', () => {
    expect(resolveTier({ ...baseEnv, deviceMemory: 4 })).toBe('low')
  })

  it('deviceMemory: 8 stays "high"', () => {
    expect(resolveTier({ ...baseEnv, deviceMemory: 8 })).toBe('high')
  })

  it('hardwareConcurrency: 4 returns "low"', () => {
    expect(resolveTier({ ...baseEnv, hardwareConcurrency: 4 })).toBe('low')
  })

  it('hardwareConcurrency: 8 stays "high"', () => {
    expect(resolveTier({ ...baseEnv, hardwareConcurrency: 8 })).toBe('high')
  })

  it('omitted deviceMemory/hardwareConcurrency default to 8, result is "high"', () => {
    expect(resolveTier(baseEnv)).toBe('high')
  })

  it('renderer "Google SwiftShader" returns "low"', () => {
    expect(
      resolveTier({ ...baseEnv, webglRenderer: 'Google SwiftShader' })
    ).toBe('low')
  })

  it('renderer "llvmpipe (LLVM 15.0.7)" returns "low"', () => {
    expect(
      resolveTier({ ...baseEnv, webglRenderer: 'llvmpipe (LLVM 15.0.7)' })
    ).toBe('low')
  })

  it('renderer "Software Rasterizer" returns "low"', () => {
    expect(
      resolveTier({ ...baseEnv, webglRenderer: 'Software Rasterizer' })
    ).toBe('low')
  })

  it('renderer "Intel(R) UHD Graphics 630" returns "mid"', () => {
    expect(
      resolveTier({ ...baseEnv, webglRenderer: 'Intel(R) UHD Graphics 630' })
    ).toBe('mid')
  })

  it('renderer "Mesa Intel(R) Iris(R) Xe" returns "mid"', () => {
    expect(
      resolveTier({ ...baseEnv, webglRenderer: 'Mesa Intel(R) Iris(R) Xe' })
    ).toBe('mid')
  })

  it('renderer "Intel(R) Arc(TM) A770" returns "high" (carve-out for Arc)', () => {
    expect(
      resolveTier({ ...baseEnv, webglRenderer: 'Intel(R) Arc(TM) A770' })
    ).toBe('high')
  })

  it('empty renderer string returns "high"', () => {
    expect(resolveTier({ ...baseEnv, webglRenderer: '' })).toBe('high')
  })

  it('forced tier beats a present low signal: forced "high" + coarsePointer stays "high"', () => {
    expect(
      resolveTier({ ...baseEnv, forcedTier: 'high', coarsePointer: true })
    ).toBe('high')
  })

  it('low-tier signal beats renderer: coarsePointer: true + NVIDIA renderer returns "low"', () => {
    expect(
      resolveTier({
        ...baseEnv,
        coarsePointer: true,
        webglRenderer: 'NVIDIA GeForce',
      })
    ).toBe('low')
  })

  it('forced "failsafe" wins over everything else', () => {
    expect(resolveTier({ ...baseEnv, forcedTier: 'failsafe' })).toBe('failsafe')
  })

  it('webglAvailable: false returns "failsafe" regardless of other signals', () => {
    expect(
      resolveTier({ ...baseEnv, webglAvailable: false, deviceMemory: 8 })
    ).toBe('failsafe')
  })

  it('omitted webglAvailable defaults to true (unaffected callers stay as before)', () => {
    expect(resolveTier(baseEnv)).toBe('high')
  })

  it('catastrophic maxTextureSize (< 2048) returns "failsafe"', () => {
    expect(
      resolveTier({ ...baseEnv, webglAvailable: true, maxTextureSize: 1024 })
    ).toBe('failsafe')
  })

  it('maxTextureSize at or above 2048 does not trigger failsafe', () => {
    expect(
      resolveTier({ ...baseEnv, webglAvailable: true, maxTextureSize: 2048 })
    ).toBe('high')
  })

  it('failsafe gate beats the low-tier hardware heuristics', () => {
    expect(
      resolveTier({
        ...baseEnv,
        webglAvailable: false,
        coarsePointer: false,
        deviceMemory: 16,
        hardwareConcurrency: 16,
      })
    ).toBe('failsafe')
  })
})

describe('detectTier', () => {
  it('returns "mid" in a node environment (no navigator)', () => {
    expect(detectTier()).toBe('mid')
  })
})
