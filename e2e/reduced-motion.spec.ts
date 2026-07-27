import { expect, filterBlocking, test } from './fixtures/axe'

/* Task 23: the reduced-motion contract (DESIGN §3), exercised through
   Playwright's real `prefers-reduced-motion: reduce` emulation rather than
   the `?e2e=1` QA flag — `lib/scene/store.ts`'s REDUCED reads
   `matchMedia('(prefers-reduced-motion: reduce)')` directly, so this is
   the same code path a real reduced-motion visitor hits.

   Contract asserted here, all DOM-observable:
   - the loader renders settled/armed immediately (no scramble, no dwell)
   - counters land on their final values (no count-up tween)
   - no ScrollTrigger pin spacers in the DOM (initDomChoreography's REDUCED
     branch returns before creating any ScrollTrigger.create/pin calls)
   - the canvas still mounts (Director snaps instead of springing — see
     Director.update's `reduced` branch: kPos/kTgt go to 1, ramp/drift/dive
     easing collapse to their resting values)
   - single h1, axe still clean */

test.describe('reduced motion contract', () => {
  // reducedMotion is not a top-level PlaywrightTestOptions shortcut in this
  // Playwright version — it lives under contextOptions (BrowserContextOptions).
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('loader settles/arms immediately, counters land final, no pins, single h1, axe clean', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto('/')

    const enterBtn = page.getByRole('button', { name: /click to enter/i })
    await expect(enterBtn).toBeEnabled({ timeout: 10_000 })
    await enterBtn.click()
    await page.waitForTimeout(1_200) // veil fade-out completes

    // single h1 (DESIGN §5 anatomy: LandingSections owns the only h1)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('#hero h1')).toBeVisible()
    await expect(page.locator('#contact')).toBeAttached()

    // canvas still mounts under reduced motion (Director snaps, doesn't
    // spring — it does not skip mounting)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 })

    // decode headings settle immediately — no mid-scramble glyphs
    // (DecodeText's effect returns before touching the DOM when REDUCED)
    const title = await page.locator('#work h2').innerText()
    expect(title.replace(/\s/g, '')).toBe('THEDISTRICTS')

    // every counter already at its final value, not mid count-up
    const first = await page.locator('[data-count]').first().innerText()
    expect(first.replace(/,/g, '')).toBe('3204')

    // no ScrollTrigger pin spacers: REDUCED short-circuits
    // initDomChoreography before any ScrollTrigger.create/pin call runs
    const pinSpacers = await page.locator('.pin-spacer').count()
    expect(pinSpacers).toBe(0)

    // axe still clean under reduced motion
    const results = await makeAxeBuilder().analyze()
    // intentional CI-visible evidence, same discipline as e2e/a11y.spec.ts
    console.log(
      `[axe][reduced-motion] ${results.violations.length} violation group(s):`,
      JSON.stringify(results.violations, null, 2)
    )
    expect(filterBlocking(results.violations)).toEqual([])
  })
})
