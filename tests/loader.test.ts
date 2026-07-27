import { describe, expect, it } from 'vitest'
import { isArmed, loadProgress } from '../lib/loader'

describe('loadProgress (ATEN7-P1 ×1.05)', () => {
  it('scales by 1.05 and clamps to 1', () => {
    expect(loadProgress(0, 100)).toBe(0)
    expect(loadProgress(50, 100)).toBeCloseTo(0.525, 3)
    expect(loadProgress(96, 100)).toBe(1)
  })

  it('never divides by zero', () => {
    expect(loadProgress(0, 0)).toBe(1)
  })
})

describe('isArmed — the forced dwell (SPEC §5.3)', () => {
  it('arms exactly at doneAt + 5000ms', () => {
    const doneAt = 10_000
    expect(isArmed(doneAt, 14_999)).toBe(false)
    expect(isArmed(doneAt, 15_000)).toBe(true)
    expect(isArmed(doneAt, 20_000)).toBe(true)
  })

  it('never arms before load completes', () => {
    expect(isArmed(null, 60_000)).toBe(false)
  })
})
