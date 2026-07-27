import { describe, expect, it } from 'vitest'
import {
  buildWindows,
  charPhaseAt,
  DECODE_DEFAULTS,
  decodeDuration,
  SCRAMBLE_GLYPHS,
  scrambleGlyph,
} from '../lib/decode'

const rand = () => 0.5

describe('buildWindows', () => {
  it('produces one window per char, all within [0,1]', () => {
    const ws = buildWindows(10, DECODE_DEFAULTS, rand)
    expect(ws).toHaveLength(10)
    for (const w of ws) {
      expect(w.start).toBeGreaterThanOrEqual(0)
      expect(w.end).toBeLessThanOrEqual(1)
      expect(w.end).toBeGreaterThan(w.start)
    }
  })

  it('randomizes resolve order (Fisher-Yates), covering every index once, not the identity wipe', () => {
    const ws = buildWindows(10, DECODE_DEFAULTS, rand)
    const starts = ws.map((w) => w.start)

    // (a) every slot index 0..9 is used exactly once: sorted starts must
    // equal the 10 expected per-slot start times, none skipped or repeated.
    const span = 10 * DECODE_DEFAULTS.stagger + DECODE_DEFAULTS.duration
    const factor =
      DECODE_DEFAULTS.randMin +
      (DECODE_DEFAULTS.randMax - DECODE_DEFAULTS.randMin) * 0.5
    const expectedSorted = Array.from(
      { length: 10 },
      (_, slot) => ((slot * DECODE_DEFAULTS.stagger) / span) * factor
    )
    const sortedStarts = [...starts].sort((a, b) => a - b)
    expect(sortedStarts).toEqual(expectedSorted)

    // (b) the resolve order (as returned, char-index order) is NOT the
    // identity left-to-right wipe — starts must not be monotonically
    // increasing.
    const isMonotonicIncreasing = starts.every(
      (s, i) => i === 0 || s >= starts[i - 1]!
    )
    expect(isMonotonicIncreasing).toBe(false)
  })
})

describe('charPhaseAt', () => {
  const win = { start: 0.2, end: 0.6 }

  it('walks hidden -> scramble -> flash -> settled', () => {
    expect(charPhaseAt(0.1, win)).toBe('hidden')
    expect(charPhaseAt(0.3, win)).toBe('scramble')
    expect(charPhaseAt(0.55, win)).toBe('flash')
    expect(charPhaseAt(0.7, win)).toBe('settled')
  })
})

describe('decodeDuration', () => {
  it('pins the ≤1.2s settle clamp (SPEC §8)', () => {
    expect(decodeDuration(10)).toBe(0.5)
    expect(decodeDuration(45)).toBe(1.2)
    expect(decodeDuration(200)).toBe(1.2)
  })
})

describe('scrambleGlyph', () => {
  it('returns glyphs from the designed subset deterministically', () => {
    const g = scrambleGlyph(3, 7)
    expect(SCRAMBLE_GLYPHS).toContain(g)
    expect(scrambleGlyph(3, 7)).toBe(g)
  })
})
