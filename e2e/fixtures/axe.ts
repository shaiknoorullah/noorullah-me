import AxeBuilder from '@axe-core/playwright'
import { test as base, expect } from '@playwright/test'
import type { AxeResults, Result as AxeViolation } from 'axe-core'

// Axe fixture for noorullah-me
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md §4 (gates)
//   "axe-core critical | = 0 | playwright `@axe-core/playwright` injection per route"
//   "axe-core serious  | = 0 | same"
//
// Usage in a spec:
//   import { test, expect } from "../fixtures/axe";
//
//   test("home page has no critical or serious a11y violations", async ({
//     page,
//     makeAxeBuilder,
//   }) => {
//     await page.goto("/");
//     const { violations } = await makeAxeBuilder().analyze();
//     expect(filterBlocking(violations)).toEqual([]);
//   });

export type AxeFixtures = {
  /**
   * Returns a pre-configured AxeBuilder bound to the current page.
   * Defaults to WCAG 2.1 A + AA and the best-practice tagset, matching
   * the spec's a11y gate. Callers can chain `.disableRules(...)` or
   * `.include(...)` / `.exclude(...)` as needed.
   */
  makeAxeBuilder: () => AxeBuilder
}

/**
 * Severity levels the spec treats as blocking (≥ serious must be zero).
 */
export const BLOCKING_IMPACTS = ['critical', 'serious'] as const
export type BlockingImpact = (typeof BLOCKING_IMPACTS)[number]

/**
 * Filter an axe violation list down to the spec's blocking severities.
 * Use in assertions: `expect(filterBlocking(violations)).toEqual([])`.
 */
export function filterBlocking(violations: AxeViolation[]): AxeViolation[] {
  return violations.filter((v) => {
    if (v.impact === undefined || v.impact === null) return false
    return (BLOCKING_IMPACTS as readonly string[]).includes(v.impact)
  })
}

export const test = base.extend<AxeFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    const builder = () =>
      new AxeBuilder({ page }).withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'best-practice',
      ])
    await use(builder)
  },
})

export type { AxeResults, AxeViolation }
export { expect }
