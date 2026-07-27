import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('StatementText (SPEC §5.5)', () => {
  const src = readFileSync('components/scene/StatementText.tsx', 'utf8')

  it('copy matches the DOM statement paragraph word-for-word', () => {
    const dom = readFileSync('components/landing/sections.tsx', 'utf8')
    const words = (s: string) =>
      s
        .replace(/[^a-z0-9%.\- ]/gi, ' ')
        .split(/\s+/)
        .filter(Boolean)
    const canvasCopy = src.match(/const STATEMENT =\s*'([^']+)'/)![1]!
    const domCopy = dom.match(/data-sr-statement[^>]*>([\s\S]*?)<\/p>/)![1]!
    expect(words(canvasCopy)).toEqual(words(domCopy))
  })

  it('keeps the evidence-word emphasis set', () => {
    expect(src).toContain("'99.999%-target'")
    expect(src).toContain("'16-RFC'")
    expect(src).toContain("'multi-agent'")
  })

  it('mounts nothing under reduced motion', () => {
    expect(src).toContain('if (REDUCED) return null')
  })
})
