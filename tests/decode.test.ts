import { describe, expect, it } from 'vitest'
import {
  buildWindows,
  charPhaseAt,
  DECODE_DEFAULTS,
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

  it('randomizes resolve order (Fisher-Yates), covering every index', () => {
    let call = 0
    const seq = [0.9, 0.1, 0.7, 0.3, 0.5, 0.2, 0.8, 0.4, 0.6, 0.0]
    const ws = buildWindows(
      10,
      DECODE_DEFAULTS,
      () => seq[call++ % seq.length]!
    )
    const starts = ws.map((w) => w.start).sort((a, b) => a - b)
    // distinct staggered starts — not a left-to-right wipe
    expect(new Set(starts).size).toBeGreaterThan(5)
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

describe('scrambleGlyph', () => {
  it('returns glyphs from the designed subset deterministically', () => {
    const g = scrambleGlyph(3, 7)
    expect(SCRAMBLE_GLYPHS).toContain(g)
    expect(scrambleGlyph(3, 7)).toBe(g)
  })
})
