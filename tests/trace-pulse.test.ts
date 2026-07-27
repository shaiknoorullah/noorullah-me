import { describe, expect, it } from 'vitest'
import { DEFAULT_LANES, laneUniforms } from '../lib/scene/materials'

describe('trace pulse lanes (SPEC §5.1)', () => {
  it('never exceeds 6 lanes', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      offset: i / 12,
      speed: 0.05,
      gain: 1,
    }))
    expect(laneUniforms(many).count).toBe(6)
    expect(DEFAULT_LANES.length).toBeLessThanOrEqual(6)
  })

  it('clamps gain to the ≤4 restraint gate', () => {
    const u = laneUniforms([{ offset: 0, speed: 0.05, gain: 99 }])
    expect(u.gains[0]).toBeLessThanOrEqual(4)
  })

  it('pads uniform arrays to exactly 6 entries', () => {
    const u = laneUniforms([{ offset: 0.2, speed: 0.05, gain: 2 }])
    expect(u.offsets).toHaveLength(6)
    expect(u.speeds).toHaveLength(6)
    expect(u.gains).toHaveLength(6)
    expect(u.count).toBe(1)
  })

  it('lanes are staggered, never synchronized into a chase pattern', () => {
    const offsets = DEFAULT_LANES.map((l) => l.offset)
    expect(new Set(offsets).size).toBe(offsets.length)
    const speeds = DEFAULT_LANES.map((l) => l.speed)
    expect(new Set(speeds).size).toBeGreaterThan(1)
  })
})
