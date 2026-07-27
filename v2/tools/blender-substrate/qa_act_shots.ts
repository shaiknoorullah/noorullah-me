/* Per-act QA screenshots through the real Director pipeline (P3 gate).
   Injects synthetic section anchors (Task 19's landing DOM lands later),
   rebuilds the Director keys, scrolls to each act and lets the springs
   settle. GPU launch attempted first; falls back to SwiftShader. */
import { chromium, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = 'v2/tools/blender-substrate/qa/acts'
mkdirSync(OUT, { recursive: true })

const SECTIONS = [
  'hero',
  'statement',
  'work',
  'evidence',
  'about',
  'principles',
  'writing',
  'contact',
]
const ACT_SHOTS: [string, string][] = [
  ['act0-hero', 'hero'],
  ['act1-statement', 'statement'],
  ['act2-work', 'work'],
  ['act3-evidence', 'evidence'],
  ['act4-about', 'about'],
  ['act5-contact', 'contact'],
]

async function launch(gpu: boolean) {
  return chromium.launch({
    args: gpu
      ? [
          '--use-angle=vulkan',
          '--enable-features=Vulkan',
          '--enable-unsafe-webgpu',
          '--ignore-gpu-blocklist',
          '--enable-gpu-rasterization',
        ]
      : [],
  })
}

async function run(gpu: boolean): Promise<boolean> {
  const browser = await launch(gpu)
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.5,
  })
  await page.goto('http://localhost:3000/?tier=high', {
    waitUntil: 'networkidle',
    timeout: 60000,
  })
  await page.waitForTimeout(6000)

  const renderer = await page.evaluate(() => {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info')
    return dbg && gl
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : 'unknown'
  })
  console.log(`RENDERER(gpu=${gpu}): ${renderer}`)
  if (gpu && /swiftshader|software|llvmpipe/i.test(renderer)) {
    await browser.close()
    return false
  }

  await page.evaluate((sections) => {
    // synthetic act anchors: 8 sections, one viewport apart
    const spacer = document.createElement('div')
    spacer.style.cssText = 'position:relative;width:100%;pointer-events:none'
    sections.forEach((id) => {
      const el = document.createElement('section')
      el.id = id
      el.style.cssText = 'height:100vh;width:100%'
      spacer.appendChild(el)
    })
    document.body.appendChild(spacer)
    const dir = (window as unknown as { __dir?: { buildKeys(): void } }).__dir
    dir?.buildKeys()
  }, SECTIONS)
  await page.waitForTimeout(800)
  // R3F's resize observer can catch a mid-injection rect and collapse the
  // drawing buffer to a strip — force a re-measure after layout settles
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await page.waitForTimeout(500)

  // capture via in-page rAF-synced toDataURL — page.screenshot() captures
  // the WebGL canvas BLACK in this sandbox (P0-documented compositor race;
  // the e2e suite uses the same in-page method for the same reason)
  const grab = (p: Page) =>
    p.evaluate(
      () =>
        new Promise<string>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const el = document.querySelector('canvas')
              resolve(el ? el.toDataURL('image/png') : '')
            })
          })
        })
    )

  // scene-ready: poll until the canvas actually carries lit pixels (GLB +
  // KTX2/meshopt decode + first shadow bake complete) — not a fixed sleep
  let ready = false
  for (let i = 0; i < 30 && !ready; i++) {
    const d = await grab(page)
    const buf = Buffer.from(d.split(',')[1] ?? '', 'base64')
    ready = buf.length > 30000 // an all-black PNG compresses to ~8KB
    if (!ready) await page.waitForTimeout(1000)
  }
  console.log(`SCENE READY: ${ready}`)

  for (const [name, section] of ACT_SHOTS) {
    await page.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    }, section)
    await page.waitForTimeout(3200) // springs settle + grade crossfade
    const dataUrl = await grab(page)
    writeFileSync(
      `${OUT}/${name}.png`,
      Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
    )
    console.log(`ACT rendered ${name}`)
  }
  await browser.close()
  return true
}

const ok = process.env.TRY_GPU === '1' ? await run(true) : false
if (!ok) {
  console.log('GPU path unavailable — falling back to SwiftShader')
  await run(false)
}
console.log('DONE act-shots')
