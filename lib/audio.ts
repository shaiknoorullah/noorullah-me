/* Audio (SPEC §5.6, ATEN7-P4 restraint discipline): total silence until
   the enter-click unlocks the context; one 90s ambient bed; act changes
   ride a dip-and-return gain grammar (never a hard switch); any overlay
   open sweeps a lowpass 22kHz→200Hz over 6s expo.out with volume 0.8→0.3;
   micro-SFX near-subliminal; no loader sound, no scroll sounds;
   visibilitychange pauses everything; reduced-motion ⇒ never unlocks. */

import { REDUCED } from './scene/store'

export interface SfxDef {
  url: string
  ms: number
  peakDb: number
}

/* the duration grammar: short = leave, mid = enter, long = armed */
export const SFX: Record<
  'leave' | 'enter' | 'arm' | 'click' | 'decode',
  SfxDef
> = {
  leave: { url: '/audio/sfx-leave.ogg', ms: 125, peakDb: -38.6 },
  enter: { url: '/audio/sfx-enter.ogg', ms: 359, peakDb: -38.6 },
  arm: { url: '/audio/sfx-arm.ogg', ms: 458, peakDb: -35.4 },
  click: { url: '/audio/sfx-click.ogg', ms: 623, peakDb: -34.4 },
  decode: { url: '/audio/sfx-decode.ogg', ms: 870, peakDb: -34.1 },
}

export const BED_URL = '/audio/bed-90s.ogg'
export const BED_GAIN = 0.8
export const MUFFLE_GAIN = 0.3
export const MUFFLE_FREQ_HI = 22050
export const MUFFLE_FREQ_LO = 200
export const MUFFLE_SECONDS = 6

export function dbToGain(db: number): number {
  return 10 ** (db / 20)
}

/* expo.out on t∈[0,1] over the muffle window */
export function muffleCurve(t: number): { freq: number; gain: number } {
  const k = t >= 1 ? 1 : 1 - 2 ** (-10 * Math.max(0, t))
  return {
    freq: MUFFLE_FREQ_HI + (MUFFLE_FREQ_LO - MUFFLE_FREQ_HI) * k,
    gain: BED_GAIN + (MUFFLE_GAIN - BED_GAIN) * k,
  }
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bedGain: GainNode | null = null
  /* Director hard requirement (P6 verdict): muffle owns a separate gain
     node in series with setAct's scheduled ramps — no shared .value
     writes. Chain: bed source -> bedGain (setAct's scheduled ramps) ->
     muffleGain (muffle's rAF-driven multiplier) -> lowpass -> master.
     muffleCurve() still reports the net 0.8 -> 0.3 overall-volume
     semantics its unit tests pin; since bedGain rests at BED_GAIN (0.8),
     muffleGain sweeps curve.gain / BED_GAIN (1.0 -> 0.375) to reproduce
     that exact net curve without ever touching bedGain.gain. */
  private muffleGain: GainNode | null = null
  private lowpass: BiquadFilterNode | null = null
  private buffers = new Map<string, AudioBuffer>()
  private muffleStart: number | null = null
  private muffleDir: 'in' | 'out' = 'out'
  private raf = 0

  get unlocked(): boolean {
    return this.ctx !== null
  }

  /** First-gesture unlock. Called from the loader's CLICK TO ENTER only.
      Reduced motion ⇒ audio off by default (SPEC §5.6/§8). */
  async unlock(): Promise<void> {
    if (REDUCED || this.ctx) return
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return
    let ctx: AudioContext
    try {
      ctx = new Ctor()
    } catch {
      // construction can throw in exotic embeds — the site stays silent
      return
    }
    this.ctx = ctx
    this.master = ctx.createGain()
    this.lowpass = ctx.createBiquadFilter()
    this.lowpass.type = 'lowpass'
    this.lowpass.frequency.value = MUFFLE_FREQ_HI
    this.muffleGain = ctx.createGain()
    this.muffleGain.gain.value = 1
    this.bedGain = ctx.createGain()
    this.bedGain.gain.value = 0
    this.bedGain.connect(this.muffleGain)
    this.muffleGain.connect(this.lowpass)
    this.lowpass.connect(this.master)
    this.master.connect(ctx.destination)
    if (ctx.state === 'suspended')
      await ctx.resume().catch(() => {
        /* defensive only — Chrome auto-resumes contexts created in a gesture (aten7) */
      })

    // the first sound you hear is the enter click — fired BEFORE the bed
    // decode await so it lands with the gesture (a ~6KB tick decodes in
    // ms; the 90s bed takes over a second on slower CPUs)
    this.playSfx('click')

    // bed fades in over ~3s; SFX load lazily, failures stay silent
    const bed = await this.load(BED_URL).catch(() => null)
    if (bed && this.ctx === ctx) {
      const src = ctx.createBufferSource()
      src.buffer = bed
      src.loop = true
      src.connect(this.bedGain)
      src.start()
      this.bedGain.gain.setTargetAtTime(BED_GAIN, ctx.currentTime, 1.0)
    }

    document.addEventListener('visibilitychange', this.onVisibility)
  }

  private async load(url: string): Promise<AudioBuffer> {
    const hit = this.buffers.get(url)
    if (hit) return hit
    const res = await fetch(url)
    const raw = await res.arrayBuffer()
    const buf = await this.ctx?.decodeAudioData(raw)
    if (!buf) throw new Error(`audio: decode failed for ${url}`)
    this.buffers.set(url, buf)
    return buf
  }

  /** Act boundary grammar: dip the bed to 45% and return over ~2.5s —
      never a restart, never a hard switch (ATEN7-P4 crossfade discipline). */
  setAct(_act: number): void {
    if (!(this.ctx && this.bedGain)) return
    const t = this.ctx.currentTime
    this.bedGain.gain.cancelScheduledValues(t)
    this.bedGain.gain.setTargetAtTime(BED_GAIN * 0.45, t, 0.4)
    // ALWAYS return to BED_GAIN: muffle attenuation lives entirely on the
    // series muffleGain node now (P6 separation) — conditioning this on
    // muffleDir double-attenuated the bed and stranded it at 0.3 after
    // muffle-off (Task 20 review C1)
    this.bedGain.gain.setTargetAtTime(BED_GAIN, t + 1.2, 0.8)
  }

  /** Overlay open: sweep lowpass 22kHz→200Hz + volume 0.8→0.3, 6s expo.out.
      Drives muffleGain (not bedGain) so this never races setAct's scheduled
      ramps on the same param (director hard requirement, P6 verdict). */
  muffle(on: boolean): void {
    if (!this.ctx) return
    this.muffleDir = on ? 'in' : 'out'
    this.muffleStart = this.ctx.currentTime
    cancelAnimationFrame(this.raf)
    const step = () => {
      if (
        !(this.ctx && this.lowpass && this.muffleGain) ||
        this.muffleStart === null
      )
        return
      const t = Math.min(
        1,
        (this.ctx.currentTime - this.muffleStart) / MUFFLE_SECONDS
      )
      const from = this.muffleDir === 'in' ? muffleCurve(0) : muffleCurve(1)
      const to = this.muffleDir === 'in' ? muffleCurve(1) : muffleCurve(0)
      const k = t >= 1 ? 1 : 1 - 2 ** (-10 * t)
      this.lowpass.frequency.value = from.freq + (to.freq - from.freq) * k
      const gain = from.gain + (to.gain - from.gain) * k
      this.muffleGain.gain.value = gain / BED_GAIN
      if (t < 1) this.raf = requestAnimationFrame(step)
    }
    step()
  }

  /** Near-subliminal UI ticks — always paired with a visual decode, never
      sound alone (ATEN7-P4). */
  playSfx(name: keyof typeof SFX): void {
    if (!(this.ctx && this.master)) return
    const def = SFX[name]
    this.load(def.url)
      .then((buf) => {
        if (!(this.ctx && this.master)) return
        const src = this.ctx.createBufferSource()
        src.buffer = buf
        const g = this.ctx.createGain()
        g.gain.value = dbToGain(def.peakDb)
        src.connect(g)
        g.connect(this.master)
        src.start()
      })
      .catch(() => {
        /* silent: a missing/undecodable SFX must never surface (SPEC §5.6) */
      })
  }

  pause(): void {
    this.ctx?.suspend().catch(() => {
      /* silent: suspend rejection is not user-actionable */
    })
  }

  resume(): void {
    if (!document.hidden)
      this.ctx?.resume().catch(() => {
        /* silent: resume rejection is not user-actionable */
      })
  }

  private onVisibility = () => {
    if (document.hidden) this.pause()
    else this.resume()
  }
}

export const audio = new AudioEngine()
