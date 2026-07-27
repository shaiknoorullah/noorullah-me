/* P7 evidence: the real landing DOM — full-page scroll sequence (12 steps
   top→bottom), per-section stills, credits closeup. Clicks through the
   loader first (P5 ruling). page.screenshot composites the DOM; the WebGL
   canvas renders BLACK in this sandbox (P0-documented) — the scene behind
   is proven separately by the act QA + e2e pixel gate. */
import { chromium, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = 'v2/tools/blender-substrate/qa/landing'
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

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1.5,
})
page.on('pageerror', (e) => console.log(`!! PAGEERROR: ${e.message}`))

await page.goto('http://localhost:3000/', {
  waitUntil: 'load',
  timeout: 90000,
})
await page.waitForTimeout(8000)

// through the loader (P5 ruling: enter before shooting)
await page.waitForFunction(
  () => {
    const b = document.querySelector('button')
    return b && !b.disabled
  },
  { timeout: 40000 }
)
await page.locator('button:not([disabled])').first().click()
await page.waitForTimeout(8000) // veil + intro dolly
console.log('ENTERED')

const shot = async (name: string) => {
  writeFileSync(`${OUT}/${name}.png`, await page.screenshot())
  console.log(`SHOT ${name}`)
}

// full-page scroll sequence: 12 evenly-spaced stops
const maxScroll = await page.evaluate(
  () => document.body.scrollHeight - window.innerHeight
)
console.log(`scrollHeight: ${maxScroll}`)
for (let i = 0; i <= 11; i++) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }),
    Math.round((maxScroll * i) / 11)
  )
  await page.waitForTimeout(1800)
  await shot(`scroll-${String(i).padStart(2, '0')}`)
}

// per-section stills
for (const id of SECTIONS) {
  await page.evaluate((s) => {
    document.getElementById(s)?.scrollIntoView({ behavior: 'instant' })
  }, id)
  await page.waitForTimeout(2500) // reveals + decode settle
  await shot(`section-${id}`)
}

// credits closeup
await page.evaluate(() => {
  document.querySelector('[data-credits]')?.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(1500)
const credits = page.locator('[data-credits]')
if ((await credits.count()) > 0) {
  writeFileSync(`${OUT}/credits-closeup.png`, await credits.screenshot())
  console.log('SHOT credits-closeup')
} else {
  // fall back to the footer region if no data-credits hook exists
  const footer = page.locator('footer')
  writeFileSync(`${OUT}/credits-closeup.png`, await footer.screenshot())
  console.log('SHOT credits-closeup (footer fallback)')
}

await browser.close()
console.log('DONE landing-shots')
