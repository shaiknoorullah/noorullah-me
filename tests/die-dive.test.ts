import { describe, expect, it } from 'vitest'
import { ihsLift, wakeAt } from '../components/scene/DieDive'

describe('die dive choreography (SPEC §4 act 4, §5.2)', () => {
  it('IHS lift is one slow monotonic move, ~1.35m, no explode', () => {
    expect(ihsLift(0)).toBe(0)
    expect(ihsLift(1)).toBeCloseTo(1.35, 2)
    expect(ihsLift(0.5)).toBeLessThan(1.35)
    expect(ihsLift(0.6)).toBeGreaterThanOrEqual(ihsLift(0.5))
  })

  it('blocks wake green in sequence, not all at once', () => {
    const total = 12
    const early = wakeAt(0.55, 0, total)
    const late = wakeAt(0.55, total - 1, total)
    expect(early).toBeGreaterThan(late)
  })

  it('all blocks fully awake by the end of the dive', () => {
    for (let i = 0; i < 12; i++) {
      expect(wakeAt(1, i, 12)).toBe(1)
    }
  })

  it('nothing wakes before the dive begins', () => {
    expect(wakeAt(0, 0, 12)).toBe(0)
  })
})
