import { describe, expect, it } from 'vitest'
import { dustStrata } from '../components/scene/DustField'

describe('dust strata (SPEC §5.4)', () => {
  it('full tier: 4000 far / 1800 mid / 60 near', () => {
    const [far, mid, near] = dustStrata(false)
    expect(far!.count).toBe(4000)
    expect(mid!.count).toBe(1800)
    expect(near!.count).toBe(60)
  })

  it('low tier: halved, near stratum dropped', () => {
    const s = dustStrata(true)
    expect(s).toHaveLength(2)
    expect(s[0]!.count).toBe(2000)
    expect(s[1]!.count).toBe(900)
  })

  it('opacities stay subliminal (bone 0.1–0.4 base alpha, CORN §5)', () => {
    for (const s of dustStrata(false)) {
      expect(s.opacity).toBeLessThanOrEqual(0.4)
    }
  })
})
