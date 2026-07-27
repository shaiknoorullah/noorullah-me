/* Hardened P4 act sweep: same frames as qa_act_shots.ts plus crash
   telemetry. Each act runs in a try/catch; on page crash or browser
   death the browser is relaunched and the sweep continues, so one crash
   costs one act's session, not the whole evidence set. Untracked debug
   tool — qa_act_shots.ts stays the canonical gate script. */
import { type Browser, chromium, type Page } from '@playwright/test'
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
  ['act3to4-transition', '__dive__'],
  ['act4-about', 'about'],
  ['act5-contact', 'contact'],
]

const ts = () => new Date().toISOString().slice(11, 19)

async function newSession(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch()
  browser.on('disconnected', () => console.log(`${ts()} !! BROWSER DISCONNECTED`))
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.5,
  })
  page.on('crash', () => console.log(`${ts()} !! PAGE CRASHED`))
  page.on('pageerror', (e) => console.log(`${ts()} !! PAGEERROR: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') console.log(`${ts()} console.error: ${m.text()}`)
  })
  await page.goto('http://localhost:3000/?tier=high', {
    waitUntil: 'networkidle',
    timeout: 60000,
  })
  await page.waitForTimeout(6000)
  await page.evaluate((sections) => {
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
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await page.waitForTimeout(500)
  // scene-ready: poll until the canvas carries lit pixels
  let ready = false
  for (let i = 0; i < 30 && !ready; i++) {
    const d = await grab(page)
    ready = Buffer.from(d.split(',')[1] ?? '', 'base64').length > 30000
    if (!ready) await page.waitForTimeout(1000)
  }
  console.log(`${ts()} SCENE READY: ${ready}`)
  // click through the loader (P5 director ruling: the intro dolly is
  // entry-gated — QA must enter before shooting)
  try {
    await page.waitForFunction(
      () => {
        const b = document.querySelector('button')
        return b && !b.disabled
      },
      { timeout: 30000 }
    )
    await page.locator('button:not([disabled])').first().click()
    await page.waitForTimeout(7500) // veil drop (1s) + intro dolly (6s)
    console.log(`${ts()} ENTERED (veil dropped, intro dolly played)`)
  } catch {
    console.log(`${ts()} !! loader enter not available — shooting anyway`)
  }
  return { browser, page }
}

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

async function shoot(page: Page, name: string, section: string) {
  if (section === '__dive__') {
    await page.evaluate(() => {
      const dir = (
        window as unknown as { __dir?: { keys: { tag?: string; p: number }[] } }
      ).__dir
      if (!dir) return
      const a = dir.keys.find((k) => k.tag === 'dive-start')
      const b = dir.keys.find((k) => k.tag === 'dive-end')
      if (!a || !b || b.p <= a.p) return
      const p = a.p + (b.p - a.p) * 0.45
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
      window.scrollTo({ top: p * max, behavior: 'instant' })
    })
    await page.waitForTimeout(3200)
    const diveT = await page.evaluate(
      () =>
        (window as unknown as { __dir?: { diveT: number } }).__dir?.diveT ?? -1
    )
    console.log(`${ts()} TRANSITION diveT=${diveT.toFixed(3)}`)
  } else {
    await page.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    }, section)
    await page.waitForTimeout(3200)
  }
  const dataUrl = await grab(page)
  writeFileSync(
    `${OUT}/${name}.png`,
    Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
  )
  console.log(`${ts()} ACT rendered ${name}`)
}

let session = await newSession()
const renderer = await session.page.evaluate(() => {
  const c = document.createElement('canvas')
  const gl = c.getContext('webgl2')
  const dbg = gl?.getExtension('WEBGL_debug_renderer_info')
  return dbg && gl
    ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
    : 'unknown'
})
console.log(`${ts()} RENDERER: ${renderer}`)

for (const [name, section] of ACT_SHOTS) {
  try {
    await Promise.race([
      shoot(session.page, name, section),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error('act timeout 90s')), 90000)
      ),
    ])
  } catch (e) {
    console.log(`${ts()} !! ${name} FAILED: ${(e as Error).message} — relaunching`)
    try {
      await session.browser.close()
    } catch {}
    session = await newSession()
    try {
      await Promise.race([
        shoot(session.page, name, section),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error('act retry timeout 90s')), 90000)
        ),
      ])
    } catch (e2) {
      console.log(`${ts()} !! ${name} RETRY FAILED: ${(e2 as Error).message}`)
    }
  }
}
await session.browser.close()
console.log(`${ts()} DONE act-shots-hardened`)
