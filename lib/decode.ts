/* Decode text engine (SPEC §5.5, ATEN7-P5): per-char scramble with a
   designed glyph subset, randomized per-letter resolve order, signal-green
   only mid-decode, settles bone. Pure — the component maps phases to DOM.
   Motion discipline: only opacity + glyph identity + color ever change. */

export const SCRAMBLE_GLYPHS = '▓▒░#%@$&*+=/<>_ABCDEFGHKMNPQRSTUVXYZ0123456789'

export interface DecodeCfg {
  /** per-letter stagger, seconds-equivalent units of total progress */
  stagger: number
  /** per-letter resolve window length */
  duration: number
  /** randomization range for resolve order (ATEN7 letterRandomness) */
  randMin: number
  randMax: number
}

export const DECODE_DEFAULTS: DecodeCfg = {
  stagger: 0.02,
  duration: 0.3,
  randMin: 0.3,
  randMax: 1,
}

export interface CharWindow {
  start: number
  end: number
}

/* Fisher-Yates over scaled letter slots: letters resolve in random order.
   Total span is normalized to [0,1] so callers drive it with one progress. */
export function buildWindows(
  len: number,
  cfg: DecodeCfg,
  rand: () => number
): CharWindow[] {
  const order = Array.from({ length: len }, (_, i) => i)
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = order[i]!
    order[i] = order[j]!
    order[j] = tmp
  }
  const span = len * cfg.stagger + cfg.duration
  return order.map((slot) => {
    const s = (slot * cfg.stagger) / span
    const d = cfg.duration / span
    const start = s * (cfg.randMin + (cfg.randMax - cfg.randMin) * 0.5)
    return { start, end: Math.min(1, start + d) }
  })
}

/* Total settle time for a heading of `len` chars, clamped so no heading
   ever takes longer than 1.2s to resolve (SPEC §8 readability gate). */
export function decodeDuration(len: number): number {
  return Math.min(1.2, len * 0.02 + 0.3)
}

export type CharPhase = 'hidden' | 'scramble' | 'flash' | 'settled'

/* The flash is the last 15% of the window: the resolving glyph flashes
   #A4EB53 once, then settles bone (ATEN7-P5 hysteresis). */
export function charPhaseAt(t: number, win: CharWindow): CharPhase {
  if (t < win.start) return 'hidden'
  if (t >= win.end) return 'settled'
  const local = (t - win.start) / (win.end - win.start)
  return local > 0.85 ? 'flash' : 'scramble'
}

/* Deterministic scramble glyph — alternates by frame parity so the char
   shimmers without re-randomizing every render. */
export function scrambleGlyph(seedIndex: number, tick: number): string {
  const i = (seedIndex * 31 + tick * 17) % SCRAMBLE_GLYPHS.length
  return SCRAMBLE_GLYPHS[i]!
}
