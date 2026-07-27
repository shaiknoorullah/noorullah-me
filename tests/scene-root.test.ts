import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createBlueCurveTexture } from '../lib/scene/effects'

describe('blue-curve LUT (ATEN7-P3 uBlueCurve pattern)', () => {
  it('is a 256x1 single-channel curve with lifted blacks', () => {
    const tex = createBlueCurveTexture()
    expect(tex.image.width).toBe(256)
    expect(tex.image.height).toBe(1)
    const data = tex.image.data as Uint8Array
    expect(data[0]).toBeGreaterThan(0) // film floor lift, not 0%
    expect(data[255]).toBe(255) // white point untouched
    // monotonic
    for (let i = 1; i < 256; i++) {
      expect(data[i]!).toBeGreaterThanOrEqual(data[i - 1]!)
    }
  })
})

describe('SceneRoot wiring', () => {
  const root = readFileSync('components/scene/SceneRoot.tsx', 'utf8')

  it('drives lenis through tempus, not gsap.ticker', () => {
    expect(root).toContain("from 'tempus'")
    expect(root).toContain('lenis.raf')
  })

  it('mounts the Rig and the post skeleton', () => {
    expect(root).toContain('<Rig director={director} />')
    expect(root).toContain('<Effects director={director}')
  })
})
