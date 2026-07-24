import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'

// Scene smoke: proves the R3F canvas actually renders pixels, not just that
// it mounts. Complements e2e/smoke.spec.ts (harness + axe fixture wiring
// only) — this is the first spec that navigates, exercising Stage.tsx's
// black background + rotating #A4EB53 wireframe cube end-to-end through a
// real (headless, SwiftShader-backed) WebGL context.
//
// Pixels are sampled via an in-page, rAF-synced `canvas.toDataURL()` rather
// than Playwright's CDP-level `locator.screenshot()`. Diagnosed in this
// sandbox: the WebGL context renders correctly (confirmed via
// WEBGL_debug_renderer_info + an in-page readback showing the expected
// green pixel count every time), but `preserveDrawingBuffer` defaults to
// `false`, and a CDP screenshot request — taken from outside the page's own
// render loop — reliably races the browser's implicit post-composite buffer
// clear, observing a blank frame 100% of the time even with generous waits
// and rAF-aligned retries. Reading `toDataURL()` from inside a chained
// `requestAnimationFrame` callback samples the buffer at the moment it's
// freshly drawn, sidestepping that race entirely.

test.describe('scene', () => {
  test('canvas renders the green wireframe cube', async ({ page }) => {
    await page.goto('/')

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15_000 })

    // Let a few frames render (rotation is running) before sampling pixels.
    await page.waitForTimeout(1500)

    const dataUrl = await canvas.evaluate<string, HTMLCanvasElement>(
      (el) =>
        new Promise<string>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve(el.toDataURL('image/png')))
          })
        })
    )

    const base64 = dataUrl.split(',')[1] ?? ''
    const buf = Buffer.from(base64, 'base64')
    const png = PNG.sync.read(buf)

    let lit = 0
    let green = 0

    for (let i = 0; i < png.data.length; i += 4) {
      const r = png.data[i] ?? 0
      const g = png.data[i + 1] ?? 0
      const b = png.data[i + 2] ?? 0

      if (Math.max(r, g, b) > 32) lit++
      if (g > 100 && g > r && g > b + 50) green++
    }

    expect(lit, 'canvas is not black').toBeGreaterThan(200)
    expect(
      green,
      'the green wireframe cube specifically is visible'
    ).toBeGreaterThan(50)
  })
})
