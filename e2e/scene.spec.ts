import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'

// Scene smoke: proves the R3F canvas actually mounts and renders, not just
// that the route loads. Complements e2e/smoke.spec.ts (harness + axe
// fixture wiring only) — this is the first spec that navigates, exercising
// the scene island end-to-end through a real (headless, SwiftShader-backed)
// WebGL context.
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
  test('canvas mounts', async ({ page }) => {
    await page.goto('/')

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15_000 })
  })

  // P0 proof-cube superseded by Task 9 scene skeleton; scene geometry landed
  // in master Task 10 (GLB + light rig + fog cards), which restores this
  // pixel-content assertion. Re-enabled by dropping `.fixme` and renaming.
  test('canvas renders the substrate set', async ({ page }) => {
    // force the full pipeline: the CI browser is SwiftShader, which the
    // tier ladder now routes to failsafe (unlit basics, no trace pulse) —
    // this spec asserts the HIGH-tier pipeline (pulse green, non-uniform
    // lighting), so pin the tier like the acts spec and QA scripts do
    await page.goto('/?tier=high')

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15_000 })

    // Let a few frames render (camera intro + pulse head are animating)
    // before sampling pixels.
    await page.waitForTimeout(1500)

    const grab = () =>
      canvas.evaluate<string, HTMLCanvasElement>(
        (el) =>
          new Promise<string>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve(el.toDataURL('image/png')))
            })
          })
      )

    const dataUrl = await grab()
    // second capture ~2.5s later: the pulse heads commute 10-15% of a lane
    // in that window, so the green signal must MOVE (animation proof, and
    // robust to whichever phase the first capture caught)
    await page.waitForTimeout(2500)
    const dataUrl2 = await grab()

    const base64 = dataUrl.split(',')[1] ?? ''
    const buf = Buffer.from(base64, 'base64')
    const png = PNG.sync.read(buf)
    const png2 = PNG.sync.read(
      Buffer.from(dataUrl2.split(',')[1] ?? '', 'base64')
    )

    let lit = 0
    const luminances: number[] = []

    for (let i = 0; i < png.data.length; i += 4) {
      const r = png.data[i] ?? 0
      const g = png.data[i + 1] ?? 0
      const b = png.data[i + 2] ?? 0

      if (Math.max(r, g, b) > 32) lit++
      luminances.push(0.2126 * r + 0.7152 * g + 0.0722 * b)
    }

    luminances.sort((a, b) => a - b)
    const at = (p: number) =>
      luminances[
        Math.min(luminances.length - 1, Math.floor(p * luminances.length))
      ] ?? 0
    const median = at(0.5)
    const p95 = at(0.95)

    expect(lit, 'canvas is not black').toBeGreaterThan(200)
    // Task 10 ships the lit rig + GLB (key/fill/rim spots, HDRI, board
    // materials) but the trace-pulse lanes (Task 11) are the only
    // *saturated green* signal on the set pre-pulse, so a strict green-pixel
    // count isn't a meaningful assertion yet. Instead, prove the frame is a
    // genuinely lit, non-uniform set (bright highlights well above the
    // median, not flat noise or a uniform fog card) via a p95/median
    // luminance ratio. Task 11 restores a strict green-pixel threshold once
    // the pulse lanes render every frame.
    expect(
      p95 > Math.max(median * 3, 1),
      `set is lit and non-uniform, not flat noise (p95=${p95.toFixed(1)}, median=${median.toFixed(1)})`
    ).toBe(true)
    // Task 11 (restored per the Task 10 note): the trace pulses + spill base
    // + pulse head put saturated signal-green on screen, and it MOVES.
    const greenMask = (d: Buffer | Uint8Array) => {
      const set = new Set<number>()
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] ?? 0
        const g = d[i + 1] ?? 0
        const b = d[i + 2] ?? 0
        if (g > 60 && g > r * 1.25 && g > b * 1.25) set.add(i / 4)
      }
      return set
    }
    const g1 = greenMask(png.data)
    const g2 = greenMask(png2.data)
    const maxGreen = Math.max(g1.size, g2.size)
    let moved = 0
    for (const px of g2) if (!g1.has(px)) moved++
    for (const px of g1) if (!g2.has(px)) moved++
    expect(maxGreen, 'trace-pulse green signal present').toBeGreaterThan(20)
    expect(
      moved,
      `green signal animates (g1=${g1.size}, g2=${g2.size}, moved=${moved})`
    ).toBeGreaterThan(Math.max(5, maxGreen * 0.1))
  })
})
