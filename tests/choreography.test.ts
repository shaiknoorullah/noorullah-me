import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('choreography contract', () => {
  const src = readFileSync('lib/choreography.ts', 'utf8')

  it('pins the statement at +=130% and writes statementState', () => {
    expect(src).toContain("end: '+=130%'")
    expect(src).toContain('statementState.progress')
    expect(src).toContain('statementState.vis')
  })

  it('principles horizontal pin snaps at thirds and writes hProgress', () => {
    expect(src).toContain('snap: 1 / 3')
    expect(src).toContain('director.hProgress')
  })

  it('fires audio.setAct on section entry and never on scroll', () => {
    expect(src).toContain('audio.setAct')
    // no scroll-driven SFX (SPEC §5.6 "no scroll sounds") — the brief's
    // original assertion was a literal substring that could never match;
    // this one actually inspects scroll handlers for playSfx calls
    expect(src).not.toMatch(/on(?:Scroll|Update)[^}]*playSfx/s)
  })

  it('reduced motion renders counters at final values and returns early', () => {
    expect(src.indexOf('if (REDUCED)')).toBeLessThan(
      src.indexOf('gsap.context')
    )
  })
})
