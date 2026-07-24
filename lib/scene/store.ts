// Scene module state — mutable, read per-frame by the Director.
//
// Plain objects for 60Hz frame-driver access (not React state).
// Ported minimally from v2/site/src/lib/store.ts (statementState excluded per YAGNI).

import type { QualityTier } from './quality'

/** normalized page progress 0..1 + smoothed velocity, written by the scroll driver, read per-frame by the Director */
export const scrollState = { p: 0, v: 0 }

export const quality: { tier: QualityTier } = { tier: 'high' }

export const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Read normalized scroll progress.
 * Clamps (window.scrollY || 0) / max(1, document.body.scrollHeight - innerHeight) to [0, 1].
 */
export function readScroll(): number {
  const scrolled = typeof window !== 'undefined' ? window.scrollY || 0 : 0
  const doc = typeof document !== 'undefined' ? document.body : null
  const maxScroll = doc
    ? Math.max(1, doc.scrollHeight - (window.innerHeight || 0))
    : 1
  return Math.min(1, Math.max(0, scrolled / maxScroll))
}
