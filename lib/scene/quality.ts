// GPU quality tier detection for scene performance.
//
// Exports a pure tier resolver (testable) + browser-integrated detectTier.
// Ported from v2/site/src/components/scene/Stage.tsx:32-51.

export type QualityTier = 'high' | 'mid' | 'low'

/** Snapshot of the signals tier detection reads — injectable for tests. */
export interface TierEnvironment {
  /** value of the ?tier= query param, if any */
  forcedTier?: string | null
  /** matchMedia('(pointer: coarse)').matches */
  coarsePointer: boolean
  /** navigator.deviceMemory (GB) — undefined when the browser hides it */
  deviceMemory?: number
  /** navigator.hardwareConcurrency */
  hardwareConcurrency?: number
  /** UNMASKED_RENDERER_WEBGL string; '' when webgl2/debug ext unavailable */
  webglRenderer: string
}

/**
 * Pure tier detection from a snapshot of browser signals.
 * Decision table (order matters):
 *
 * 1. forcedTier is exactly 'low'|'mid'|'high' → return it
 * 2. coarsePointer OR (deviceMemory ?? 8) <= 4 OR (hardwareConcurrency ?? 8) <= 4 → 'low'
 * 3. webglRenderer matches /swiftshader|llvmpipe|software/i → 'low'
 * 4. webglRenderer matches /intel(?!.*arc)|uhd|iris/i → 'mid'
 * 5. Otherwise → 'high'
 */
export function resolveTier(env: TierEnvironment): QualityTier {
  // Step 1: Check forced tier override.
  if (
    env.forcedTier === 'low' ||
    env.forcedTier === 'mid' ||
    env.forcedTier === 'high'
  ) {
    return env.forcedTier
  }

  // Step 2: Low-tier detection from hardware signals.
  const coarsePointer = env.coarsePointer
  const deviceMemory = env.deviceMemory ?? 8
  const hardwareConcurrency = env.hardwareConcurrency ?? 8

  if (coarsePointer || deviceMemory <= 4 || hardwareConcurrency <= 4) {
    return 'low'
  }

  // Step 3: Software renderer → low (slow/emulated GPU).
  if (/swiftshader|llvmpipe|software/i.test(env.webglRenderer)) {
    return 'low'
  }

  // Step 4: Intel integrated or UHD/Iris → mid (adequate for base scene).
  if (/intel(?!.*arc)|uhd|iris/i.test(env.webglRenderer)) {
    return 'mid'
  }

  // Step 5: High-end GPU (dedicated, modern mobile, or unknown).
  return 'high'
}

/**
 * Detect quality tier from the live browser environment.
 * Returns 'mid' in SSR (no navigator) or pure node environments.
 */
export function detectTier(): QualityTier {
  // SSR safety: return sensible default when navigator or window is unavailable.
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return 'mid'
  }

  // Extract forced tier override from ?tier= query param.
  const searchParams = new URLSearchParams(
    typeof location !== 'undefined' ? location.search : ''
  )
  const forcedTier = searchParams.get('tier')

  // Detect coarse pointer (touch or stylus).
  const coarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches

  // Hardware signals with fallback defaults.
  const nav = navigator as Navigator & { deviceMemory?: number }
  const deviceMemory = nav.deviceMemory
  const hardwareConcurrency = navigator.hardwareConcurrency

  // Probe for WebGL2 renderer (wrapped in try/catch for safety).
  let webglRenderer = ''
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (gl) {
      const debugExt = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugExt) {
        webglRenderer = String(
          gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)
        )
      }
    }
  } catch {
    // Silently fall back to empty string on any error (security contexts, etc.).
  }

  const env: TierEnvironment = {
    forcedTier,
    coarsePointer,
    webglRenderer,
  }
  if (deviceMemory !== undefined) {
    env.deviceMemory = deviceMemory
  }
  if (hardwareConcurrency !== undefined) {
    env.hardwareConcurrency = hardwareConcurrency
  }

  return resolveTier(env)
}
