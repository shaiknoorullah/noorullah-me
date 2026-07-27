/* P6 evidence: audio-event log from a scripted session (SPEC §5.6).
   Instruments Web Audio BEFORE page load (constructor, resume, buffer
   starts, biquad frequency automation), then: cold load → CLICK TO
   ENTER (unlock + bed + first SFX) → muffle(on) sweep sampled over 6s
   → muffle(off) → hover-tick grammar via playSfx — driven through the
   window.__audio debug handle (Task 20 wires the real consumers). */
import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  // real (non-headless-shell) audio graph timing; still headless
  args: ['--autoplay-policy=user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => console.log(`!! PAGEERROR: ${e.message}`))

await page.addInitScript(() => {
  const log: { t: number; ev: string }[] = []
  ;(window as unknown as { __audioLog: typeof log }).__audioLog = log
  const t0 = performance.now()
  const push = (ev: string) => log.push({ t: performance.now() - t0, ev })

  const OrigCtx = window.AudioContext
  window.AudioContext = class extends OrigCtx {
    constructor(...args: ConstructorParameters<typeof AudioContext>) {
      super(...args)
      push(`AudioContext constructed (state=${this.state})`)
      this.addEventListener('statechange', () =>
        push(`context state -> ${this.state}`)
      )
    }
  }

  const origStart = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (...a) {
    const dur = this.buffer ? this.buffer.duration.toFixed(3) : '?'
    push(`source.start (loop=${this.loop} dur=${dur}s)`)
    return origStart.apply(this, a as Parameters<typeof origStart>)
  }
})

await page.goto('http://localhost:3000/', {
  waitUntil: 'networkidle',
  timeout: 60000,
})

// wait for CLICK TO ENTER to arm, then enter (the unlock gesture)
await page.waitForFunction(
  () => {
    const b = document.querySelector('button')
    return b && !b.disabled
  },
  { timeout: 40000 }
)
await page.evaluate(() => {
  const w = window as unknown as { __audioLog: { t: number; ev: string }[] }
  w.__audioLog.push({ t: performance.now(), ev: '== CLICKING ENTER now ==' })
})
await page.locator('button:not([disabled])').first().click()
await page.waitForTimeout(2500) // unlock + bed start + enter click SFX

type Handle = {
  muffle(on: boolean): void
  playSfx(n: 'leave' | 'enter' | 'arm' | 'click' | 'decode'): void
  setAct(a: number): void
  unlocked: boolean
}
const unlocked = await page.evaluate(
  () => (window as unknown as { __audio?: Handle }).__audio?.unlocked ?? false
)
console.log(`ENGINE UNLOCKED: ${unlocked}`)

// muffle ON — sample the lowpass + master gain over the 6s sweep
await page.evaluate(() => {
  ;(window as unknown as { __audio: Handle }).__audio.muffle(true)
})
const samples: string[] = []
for (let i = 0; i <= 6; i++) {
  const s = await page.evaluate(() => {
    // muffle drives the lowpass + the BED gain (TS-private, runtime-open)
    const a = (window as unknown as { __audio: unknown }).__audio as {
      lowpass: BiquadFilterNode
      bedGain: GainNode
    }
    return `freq=${a.lowpass?.frequency.value.toFixed(0)}Hz bedGain=${a.bedGain?.gain.value.toFixed(3)}`
  })
  samples.push(`  muffle t+${i}s: ${s}`)
  if (i < 6) await page.waitForTimeout(1000)
}
console.log('MUFFLE SWEEP (on):')
for (const s of samples) console.log(s)

await page.evaluate(() => {
  ;(window as unknown as { __audio: Handle }).__audio.muffle(false)
})
await page.waitForTimeout(1500)

// hover-tick grammar + act dip through the engine API
await page.evaluate(async () => {
  const a = (window as unknown as { __audio: Handle }).__audio
  a.playSfx('leave')
  await new Promise((r) => setTimeout(r, 400))
  a.playSfx('enter')
  await new Promise((r) => setTimeout(r, 600))
  a.playSfx('arm')
  await new Promise((r) => setTimeout(r, 700))
  a.playSfx('decode')
  await new Promise((r) => setTimeout(r, 1000))
  a.setAct(1)
})
await page.waitForTimeout(1500)

const log = await page.evaluate(
  () => (window as unknown as { __audioLog: { t: number; ev: string }[] }).__audioLog
)
console.log('AUDIO EVENT LOG:')
for (const { t, ev } of log) console.log(`  ${(t / 1000).toFixed(3)}s  ${ev}`)

await browser.close()
console.log('DONE audio-log')
