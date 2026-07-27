/* P5 evidence: loader boot sequence (cold load → mid-decode → armed →
   handoff) + DecodeText mid-flight still (via the /decode-probe dev page).
   NOTE: /decode-probe is TRANSIENT scaffolding — create app/decode-probe/
   page.tsx mounting one <DecodeText> below the fold before the run, delete
   it after (it is never committed: an untracked app/ page also flips
   unrelated biome rule application — see the P5 ledger).
   Captures land in v2/tools/blender-substrate/qa/loader/. */
import { chromium, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = 'v2/tools/blender-substrate/qa/loader'
mkdirSync(OUT, { recursive: true })

const shot = async (page: Page, name: string) => {
  const buf = await page.screenshot() // DOM overlay: plain screenshot works
  writeFileSync(`${OUT}/${name}.png`, buf)
  console.log(`SHOT ${name}`)
}

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1.5,
})
page.on('pageerror', (e) => console.log(`!! PAGEERROR: ${e.message}`))

// cold load — no cache reuse in a fresh context
await page.goto('http://localhost:3000/', {
  waitUntil: 'commit',
  timeout: 60000,
})
await page.waitForTimeout(700)
await shot(page, '01-boot')
await page.waitForTimeout(1200)
await shot(page, '02-mid-decode')

// armed: CLICK TO ENTER requires isLoaded + 5s dwell
await page
  .getByRole('button', { name: /click to enter/i })
  .waitFor({ state: 'visible', timeout: 40000 })
await page.waitForFunction(
  () => {
    const b = document.querySelector('button')
    return b && !b.disabled
  },
  { timeout: 40000 }
)
await shot(page, '03-armed')

// handoff: click, veil drops, scene revealed
await page.locator('button:not([disabled])').first().click()
await page.waitForTimeout(400)
await shot(page, '04-handoff-mid')
await page.waitForTimeout(1600)
await shot(page, '05-scene-revealed')

// DecodeText mid-flight (probe page mounts one below the fold)
await page.goto('http://localhost:3000/decode-probe/', {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(800)
await page.evaluate(() => {
  document.getElementById('probe-target')?.scrollIntoView({ behavior: 'instant' })
})
await page.waitForTimeout(350) // decode ≤1.2s — catch it mid-flight
await shot(page, '06-decode-midflight')
await page.waitForTimeout(1500)
await shot(page, '07-decode-settled')

await browser.close()
console.log('DONE loader-shots')
