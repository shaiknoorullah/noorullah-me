import { describe, expect, it } from 'vitest'

// Smoke test: verifies the test harness itself is wired correctly.
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md §5.2 (unit gate)
describe('smoke', () => {
  it('runs the vitest harness', () => {
    expect(1 + 1).toBe(2)
  })

  it('has access to a working ES module environment', () => {
    const sample = { name: 'noorullah-me', ok: true } as const
    expect(sample.ok).toBe(true)
    expect(sample.name).toBe('noorullah-me')
  })
})
