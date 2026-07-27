import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
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

describe('bundle budget (P8 GO: initial JS < 250KB gz, island reported)', () => {
  it('passes the bundle gate after a build', (ctx) => {
    // hermetic on a fresh checkout: the gate measures build output — skip
    // (with a message) when none exists rather than failing a logic-free
    // test (final review, Surface 4). CI must build before testing.
    if (!(existsSync('.next/static/chunks') || existsSync('out/_next'))) {
      ctx.skip()
      return
    }
    const out = execFileSync('node', ['scripts/check-bundle.mjs'], {
      encoding: 'utf8',
    })
    const report = JSON.parse(out)
    expect(report.ok).toBe(true)
    // the GATED metric (director's P8 GO): initial-load JS
    expect(report.initialLoadBytes).toBeLessThan(250 * 1024)
    // the island is deferred (dynamic ssr:false) — measured + reported
    // for the director's ruling, not gated
    expect(report.gzipBytes).toBeGreaterThan(0)
  })
})
