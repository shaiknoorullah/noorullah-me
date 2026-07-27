import type { Page } from '@playwright/test'
import { LOADER_COPY } from '../lib/loader'
import { expect, filterBlocking, test } from './fixtures/axe'

/* Task 23: axe a11y gate across BOTH loader states (P5 director ruling —
   the loader veil is a real `role="dialog"` the visitor sees first, so it
   needs its own scan; the landing DOM behind it is the second).

   Gate: ZERO critical AND serious violations (filterBlocking, same
   contract as e2e/fixtures/axe.ts's smoke usage). The P7 review noted one
   pre-existing MODERATE 'region' finding — moderate is below the gate and
   must not fail the build, but the full violation list (all severities)
   is always logged so that finding stays visible in test output rather
   than silently swallowed. */

function logViolations(label: string, results: { violations: unknown[] }) {
  // intentional CI-visible evidence (brief requirement: print the full
  // violation list, all severities, even when the blocking-severity gate
  // below passes)
  console.log(
    `[axe][${label}] ${results.violations.length} violation group(s):`,
    JSON.stringify(results.violations, null, 2)
  )
}

async function waitForEnterArmed(page: Page) {
  const enterBtn = page.getByRole('button', {
    name: LOADER_COPY.enter,
    exact: true,
  })
  await enterBtn.waitFor({ state: 'visible', timeout: 15_000 })
  await expect(enterBtn).toBeEnabled({ timeout: 15_000 })
  return enterBtn
}

test.describe('a11y (axe)', () => {
  test('veil-up: loader dialog has zero critical/serious violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto('/?e2e=1')
    // ?e2e=1 arms instantly but the veil itself is still up until clicked —
    // this is exactly the state we want to scan here.
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 })

    const results = await makeAxeBuilder().analyze()
    logViolations('veil-up', results)
    expect(filterBlocking(results.violations)).toEqual([])
  })

  test('post-enter: landing DOM has zero critical/serious violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto('/?e2e=1')
    const enterBtn = await waitForEnterArmed(page)
    await enterBtn.click()
    await page.waitForTimeout(1_200) // veil fade-out completes
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const results = await makeAxeBuilder().analyze()
    logViolations('post-enter', results)
    expect(filterBlocking(results.violations)).toEqual([])
  })
})
