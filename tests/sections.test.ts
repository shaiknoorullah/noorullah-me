import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const src = () => readFileSync('components/landing/sections.tsx', 'utf8')
const pageSrc = () => readFileSync('app/page.tsx', 'utf8')

describe('landing anatomy (DESIGN §5 + SPEC §4/§8/§9)', () => {
  it('renders the director’s section ids in document order', () => {
    const s = src()
    const ids = [
      'hero',
      'statement',
      'work',
      'evidence',
      'about',
      'principles',
      'writing',
      'contact',
    ]
    let last = -1
    for (const id of ids) {
      const idx = s.indexOf(`id="${id}"`)
      expect(idx, `#${id} missing`).toBeGreaterThan(-1)
      expect(idx, `#${id} out of order`).toBeGreaterThan(last)
      last = idx
    }
  })

  it('carries the CC-BY credits in the SPEC §9 format', () => {
    const s = src()
    expect(s).toContain('MotherBoard + Components')
    expect(s).toContain('Daniel Cardona')
    expect(s).toContain('Microchip - Prototype')
    expect(s).toContain('re1monsen')
    expect(s).toContain(
      'licensed CC-BY 4.0, modified (re-materialed, re-lit, optimized)'
    )
  })

  it('keeps the visually-hidden scene description + statement paragraph', () => {
    const s = src()
    expect(s).toContain('data-sr-scene')
    expect(s).toContain('data-sr-statement')
  })

  it('hero line is the locked thesis', () => {
    expect(src()).toContain('I build the substrate everyone else rents.')
  })

  it('has exactly one top-level <h1> across the route (sections + page)', () => {
    // Strip `//` line comments and `/* */` block comments first — both
    // files' header comments reference `<h1>` in prose, and a naive scan
    // of raw source would double-count that mention as a real element.
    const stripComments = (text: string) =>
      text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const combined = `${stripComments(src())}\n${stripComments(pageSrc())}`
    const matches = combined.match(/<h1[\s>]/g) ?? []
    expect(matches).toHaveLength(1)
  })

  it('carries every Task-20-consumed choreography attribute', () => {
    const s = src()
    expect(s).toContain('data-reveal="words"')
    expect(s).toContain('data-reveal')
    expect(s).toContain('data-count')
    expect(s).toContain('data-track')
    expect(s).toContain('data-magnetic')
    expect(s).toContain('className="sec-head"')
  })

  it('carries the synthesized-audio provenance line in the credits block', () => {
    expect(src()).toContain(
      'Audio: original, synthesized in-repo from oscillators and noise sources'
    )
  })
})
