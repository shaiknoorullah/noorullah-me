import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/* SPEC §5.7: the order is locked. Structural gate so a refactor can't
   silently reorder the stack. */
describe('post stack order (SPEC §5.7)', () => {
  const src = readFileSync('components/scene/Effects.tsx', 'utf8')
  const order = [
    'smaa',
    'godRays',
    'dof',
    'bloom',
    'ca',
    'grade',
    'noise',
    'vignette',
    'tone',
  ]

  it('mounts effects in the locked order', () => {
    // the full-stack composer is the final return in the file (the REDUCED
    // and low-tier returns above it are deliberate subsets)
    const tail = src.slice(src.lastIndexOf('return ('))
    let last = -1
    for (const key of order) {
      const idx = tail.indexOf(`object={${key}}`)
      expect(idx, `${key} missing from the composer`).toBeGreaterThan(-1)
      expect(idx, `${key} out of order`).toBeGreaterThan(last)
      last = idx
    }
  })

  it('bloom threshold is .80 with mipmap blur (director ruling 2026-07-27)', () => {
    expect(src).toContain('luminanceThreshold: 0.8')
    expect(src).toContain('mipmapBlur: true')
  })

  it('god rays are high-tier only and use the pulse sun', () => {
    expect(src).toContain("quality.tier === 'high'")
    expect(src).toContain('GodRaysEffect')
  })

  it('reduced motion renders AgX only', () => {
    expect(src).toContain('if (REDUCED)')
  })
})
