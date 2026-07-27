import { describe, expect, it } from 'vitest'
import { dbToGain, muffleCurve, SFX } from '../lib/audio'

describe('SFX grammar (ATEN7-P4)', () => {
  it('short = leave, mid = enter, long = something big is armed', () => {
    expect(SFX.leave.ms).toBe(125)
    expect(SFX.enter.ms).toBe(359)
    expect(SFX.arm.ms).toBe(458)
    expect(SFX.click.ms).toBe(623)
    expect(SFX.decode.ms).toBe(870)
  })

  it('micro-SFX sit ~30dB under the bed (near-subliminal, SPEC §5.6)', () => {
    for (const def of Object.values(SFX)) {
      expect(def.peakDb).toBeLessThanOrEqual(-33)
    }
  })
})

describe('dbToGain', () => {
  it('maps dB to linear gain', () => {
    expect(dbToGain(0)).toBe(1)
    expect(dbToGain(-6)).toBeCloseTo(0.501, 2)
    expect(dbToGain(-38)).toBeCloseTo(0.0126, 3)
  })
})

describe('muffleCurve (SPEC §5.6)', () => {
  it('sweeps lowpass 22050 -> 200Hz and gain 0.8 -> 0.3 over 6s expo.out', () => {
    const start = muffleCurve(0)
    const end = muffleCurve(1)
    expect(start.freq).toBeCloseTo(22050, 0)
    expect(start.gain).toBeCloseTo(0.8, 3)
    expect(end.freq).toBeCloseTo(200, 0)
    expect(end.gain).toBeCloseTo(0.3, 3)
  })

  it('is monotonic (expo.out: fast start, long tail)', () => {
    let prev = muffleCurve(0)
    for (let i = 1; i <= 20; i++) {
      const cur = muffleCurve(i / 20)
      expect(cur.freq).toBeLessThanOrEqual(prev.freq)
      expect(cur.gain).toBeLessThanOrEqual(prev.gain)
      prev = cur
    }
  })
})
