import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { PNG } from 'pngjs'
import { LOADER_COPY } from '../lib/loader'

/* Task 23: per-act canvas screenshots on GPU-flagged Chromium (the
   `chromium-gpu` project) as well as the default `chromium` project.

   HOST GPU REALITY (documented across P3-P4, restated here so a future
   reader doesn't "fix" this into a hard failure): on this sandbox host,
   `--use-angle=vulkan` resolves to llvmpipe and renders a pure-black
   canvas — a known-bad software fallback, not a real GPU path. This spec
   reads UNMASKED_RENDERER_WEBGL and, under the `chromium-gpu` project
   only, skips the content assertions with an explanatory message rather
   than asserting non-black content against a black frame. The default
   `chromium` project (SwiftShader, no GPU flags) is the honest software
   path and is where these assertions actually prove real WebGL output on
   this host. A real-GPU CI host will report a hardware renderer string
   under `chromium-gpu` and the assertions will run for real there too.

   Six acts, matching the Director's canvas acts (SPEC §4 — `principles`
   and `writing` have no canvas act of their own, DESIGN §5 anatomy keeps
   them as DOM-only sections). Scrolls to the REAL sections landed in
   Task 19 via `document.getElementById(id).scrollIntoView()` — the
   Director's old synthetic-anchor injection isn't needed anymore.

   Pixel capture reuses the exact pattern from e2e/scene.spec.ts: an
   in-page, double-rAF `canvas.toDataURL()` read, because a CDP-level
   `page.screenshot()` reliably races the browser's post-composite buffer
   clear on this host and observes a black frame (P0-documented). */

const ACTS = [
  'hero',
  'statement',
  'work',
  'evidence',
  'about',
  'contact',
] as const

async function detectRenderer(page: Page): Promise<string> {
  return page.evaluate(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = (canvas.getContext('webgl2') ??
        canvas.getContext('webgl')) as WebGLRenderingContext | null
      if (!gl) return 'no-webgl-context'
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      const param = dbg
        ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER)
      return String(param)
    } catch {
      return 'renderer-detection-failed'
    }
  })
}

async function enterSite(page: Page): Promise<void> {
  await page.goto('/?e2e=1&tier=high')
  const enterBtn = page.getByRole('button', {
    name: LOADER_COPY.enter,
    exact: true,
  })
  await enterBtn.waitFor({ state: 'visible', timeout: 15_000 })
  // ?e2e=1 arms instantly (Task 17), but the film is entry-gated (P5
  // director ruling): the veil must still be dismissed with a real click
  // before the intro dolly and act framing begin.
  await expect(enterBtn).toBeEnabled({ timeout: 15_000 })
  await enterBtn.click()
  await page.waitForTimeout(1_200) // 1s veil fade + buffer
  await page.waitForSelector('canvas', { timeout: 15_000 })
}

interface CapturedFrame {
  buf: Buffer
  png: InstanceType<typeof PNG>
}

async function grabCanvasPng(page: Page): Promise<CapturedFrame> {
  const canvas = page.locator('canvas')
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
  return { buf, png: PNG.sync.read(buf) }
}

function countLit(png: InstanceType<typeof PNG>): number {
  let lit = 0
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i] ?? 0
    const g = png.data[i + 1] ?? 0
    const b = png.data[i + 2] ?? 0
    if (Math.max(r, g, b) > 24) lit++
  }
  return lit
}

test.describe('substrate acts: per-act canvas screenshots', () => {
  test('canvas renders non-black content at every act', async ({
    page,
  }, testInfo) => {
    // 6 acts x ~3s settle + loader/enter overhead + software-render capture
    // comfortably exceeds the 30s default; this is the slow, thorough spec.
    test.setTimeout(150_000)
    const isGpuProject = testInfo.project.name === 'chromium-gpu'

    await page.goto('/?e2e=1')
    const renderer = await detectRenderer(page)

    if (isGpuProject && /llvmpipe|swiftshader|software/i.test(renderer)) {
      test.skip(
        true,
        `chromium-gpu resolved to a software renderer on this host (UNMASKED_RENDERER_WEBGL="${renderer}") — the GPU flags fall back to a known-bad black-canvas path here (P3-P4 documented). Skipping content assertions rather than asserting against a black frame; a real-GPU CI host will report a hardware renderer and this test will run for real there.`
      )
    }

    await enterSite(page)

    const shots: Record<string, number> = {}

    for (const id of ACTS) {
      await page.evaluate((sectionId) => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
      }, id)
      await page.waitForTimeout(3_000) // let springs/pins settle on the act

      const { buf, png } = await grabCanvasPng(page)
      mkdirSync('e2e/screenshots', { recursive: true })
      writeFileSync(`e2e/screenshots/act-${id}.png`, buf)

      const lit = countLit(png)
      shots[id] = lit
      expect(
        lit,
        `act "${id}" canvas rendered black (project=${testInfo.project.name}, renderer="${renderer}", lit=${lit})`
      ).toBeGreaterThan(200)
    }

    await testInfo.attach('act-lit-pixel-counts', {
      body: JSON.stringify(shots, null, 2),
      contentType: 'application/json',
    })
  })
})
