import { expect, test } from './fixtures/axe'

// Smoke spec: verifies the Playwright runner + axe fixture wiring.
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md §F7
//
// Kept intentionally trivial: it must pass before the Next.js dev server is
// migrated in. Real navigation specs (hero, manifesto, lab) come in later
// phases and will exercise the axe fixture against `await page.goto("/")`.
test.describe('smoke', () => {
  test('playwright harness runs', () => {
    expect(1 + 1).toBe(2)
  })

  test('axe fixture is exposed and constructs an AxeBuilder', ({
    makeAxeBuilder,
  }) => {
    const builder = makeAxeBuilder()
    expect(builder).toBeDefined()
    expect(typeof builder.analyze).toBe('function')
  })
})
