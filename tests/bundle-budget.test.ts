import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { adaptiveDprStep } from '../components/scene/Rig'

describe('adaptive DPR ladder (DESIGN §11.3)', () => {
  it('steps down 1.75 -> 1.5 -> 1.25 under sustained low fps', () => {
    expect(adaptiveDprStep(1.75, true, false)).toBe(1.5)
    expect(adaptiveDprStep(1.5, true, false)).toBe(1.25)
    expect(adaptiveDprStep(1.25, true, false)).toBe(1.25)
  })

  it('steps back up when headroom returns, never above 1.75', () => {
    expect(adaptiveDprStep(1.25, false, true)).toBe(1.5)
    expect(adaptiveDprStep(1.75, false, true)).toBe(1.75)
  })

  it('holds steady between signals', () => {
    expect(adaptiveDprStep(1.5, false, false)).toBe(1.5)
  })
})

describe('island bundle budget (SPEC §7: < 250KB gz)', () => {
  it('passes the bundle gate after a build', () => {
    const out = execFileSync('node', ['scripts/check-bundle.mjs'], {
      encoding: 'utf8',
    })
    const report = JSON.parse(out)
    expect(report.ok).toBe(true)
    expect(report.gzipBytes).toBeLessThan(250 * 1024)
  })
})
