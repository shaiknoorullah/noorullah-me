// GPU quality tier detection for scene performance.
//
// Exports a pure tier resolver (testable) + browser-integrated detectTier.
// Ported from v2/site/src/components/scene/Stage.tsx:32-51.

export type QualityTier = 'high' | 'mid' | 'low' | 'failsafe'

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
  /** a WebGL context (webgl2 or webgl) could be created at all — undefined/omitted
      defaults to `true` (existing callers that don't probe this stay unaffected) */
  webglAvailable?: boolean
  /** gl.getParameter(MAX_TEXTURE_SIZE) from the probe context, when one exists */
  maxTextureSize?: number
}

/** Below this, even the 'low' tier's textures (SPEC §7: 1K on low) can't be
    trusted — the driver/GPU combination is reporting catastrophic caps. */
const CATASTROPHIC_MAX_TEXTURE_SIZE = 2048

/**
 * Pure tier detection from a snapshot of browser signals.
 * Decision table (order matters):
 *
 * 1. forcedTier is exactly 'low'|'mid'|'high'|'failsafe' → return it
 * 2. webglAvailable === false, OR maxTextureSize < 2048, OR the renderer is
 *    SOFTWARE-EMULATED (/swiftshader|llvmpipe|software/i) → 'failsafe'
 *    (WebGL context creation failed outright, catastrophic caps, or no real
 *    GPU behind the context — the bottom of the degradation ladder, DESIGN
 *    §11.3/SPEC §7. Software GL compiles the full PBR/post pipeline on the
 *    CPU: measured 35s+ of main-thread block, and Lighthouse's runner
 *    declared PAGE_HUNG — deploy run 30380367947. 'low' still runs that
 *    pipeline; only failsafe's unlit path is honest on these clients.)
 * 3. coarsePointer OR (deviceMemory ?? 8) <= 4 OR (hardwareConcurrency ?? 8) <= 4 → 'low'
 * 4. webglRenderer matches /intel(?!.*arc)|uhd|iris/i → 'mid'
 * 5. Otherwise → 'high'
 */
export function resolveTier(env: TierEnvironment): QualityTier {
  // Step 1: Check forced tier override.
  if (
    env.forcedTier === 'low' ||
    env.forcedTier === 'mid' ||
    env.forcedTier === 'high' ||
    env.forcedTier === 'failsafe'
  ) {
    return env.forcedTier
  }

  // Step 2: failsafe hard gate — WebGL unavailable, catastrophically small
  // texture caps, or a software-emulated renderer. Software GL (SwiftShader,
  // llvmpipe) compiles this scene's full shader stack on the CPU — measured
  // 35s+ main-thread block; Lighthouse's runner declared PAGE_HUNG. Only the
  // unlit failsafe path is honest on these clients.
  const webglAvailable = env.webglAvailable ?? true
  if (
    !webglAvailable ||
    (env.maxTextureSize !== undefined &&
      env.maxTextureSize < CATASTROPHIC_MAX_TEXTURE_SIZE) ||
    /swiftshader|llvmpipe|software/i.test(env.webglRenderer)
  ) {
    return 'failsafe'
  }

  // Step 3: Low-tier detection from hardware signals.
  const coarsePointer = env.coarsePointer
  const deviceMemory = env.deviceMemory ?? 8
  const hardwareConcurrency = env.hardwareConcurrency ?? 8

  if (coarsePointer || deviceMemory <= 4 || hardwareConcurrency <= 4) {
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

  // Probe for WebGL2 (falling back to WebGL1) renderer info + caps, wrapped
  // in try/catch for safety. webgl2/webgl both failing to create a context
  // at all is the failsafe hard gate (Step 2 above) — a much stronger
  // signal than an empty renderer string, which also happens innocuously
  // whenever a browser hides WEBGL_debug_renderer_info for privacy.
  let webglRenderer = ''
  let webglAvailable = false
  let maxTextureSize: number | undefined
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (gl) {
      webglAvailable = true
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
      const debugExt = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugExt) {
        webglRenderer = String(
          gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)
        )
      }
    }
  } catch {
    // webglAvailable stays false: context creation genuinely failed.
  }

  const env: TierEnvironment = {
    forcedTier,
    coarsePointer,
    webglRenderer,
    webglAvailable,
  }
  if (deviceMemory !== undefined) {
    env.deviceMemory = deviceMemory
  }
  if (hardwareConcurrency !== undefined) {
    env.hardwareConcurrency = hardwareConcurrency
  }
  if (maxTextureSize !== undefined) {
    env.maxTextureSize = maxTextureSize
  }

  return resolveTier(env)
}
