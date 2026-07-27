'use client'

/* Rig: the per-frame binding. Updates the mutable scroll state (p, smoothed
   v), hands the camera to the Director, drives scene fog density off the
   grade spring, and samples fps to adaptively step the render DPR (Task 22,
   DESIGN §11.3). Ported from v2/site/src/components/scene/Rig.tsx. */

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Director } from '../../lib/scene/director'
import type { QualityTier } from '../../lib/scene/quality'
import {
  quality,
  REDUCED,
  readScroll,
  scrollState,
} from '../../lib/scene/store'

/* DESIGN §11.3: adaptive DPR 1.75 → 1.5 → 1.25 under sustained <50fps. */
export function adaptiveDprStep(
  current: number,
  sustainedLowFps: boolean,
  sustainedHighFps: boolean
): number {
  if (sustainedLowFps) return current > 1.5 ? 1.5 : 1.25
  if (sustainedHighFps) return current < 1.5 ? 1.5 : 1.75
  return current
}

/* starting rung of the ladder per tier (repo law: noNestedTernary is an
   error, so the brief's nested-ternary one-liner is ported as if/else). */
function initialDpr(tier: QualityTier): number {
  if (tier === 'high') return 1.75
  if (tier === 'mid') return 1.5
  return 1
}

export function Rig({ director }: { director: Director }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const setDpr = useThree((s) => s.setDpr)
  const lastY = useRef(0)
  const fpsEma = useRef(60)
  const lowSince = useRef<number | null>(null)
  const highSince = useRef<number | null>(null)
  const dpr = useRef(initialDpr(quality.tier))

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const y = window.scrollY || 0
    scrollState.v = scrollState.v * 0.85 + (y - lastY.current) * 0.15
    lastY.current = y
    scrollState.p = readScroll()
    director.update(
      camera,
      scrollState.p,
      scrollState.v,
      dt,
      st.clock.elapsedTime,
      REDUCED
    )
    if (scene.fog instanceof THREE.FogExp2)
      scene.fog.density = director.fogDensity

    // adaptive DPR: EMA of fps, 2.5s sustained <50 steps down, >58 steps up
    if (rawDt > 0) {
      fpsEma.current = fpsEma.current * 0.95 + (1 / rawDt) * 0.05
      const now = st.clock.elapsedTime
      if (fpsEma.current < 50) {
        lowSince.current ??= now
        highSince.current = null
      } else if (fpsEma.current > 58) {
        highSince.current ??= now
        lowSince.current = null
      } else {
        lowSince.current = null
        highSince.current = null
      }
      const sustainedLow =
        lowSince.current !== null && now - lowSince.current > 2.5
      const sustainedHigh =
        highSince.current !== null && now - highSince.current > 5
      const next = adaptiveDprStep(dpr.current, sustainedLow, sustainedHigh)
      if (next !== dpr.current) {
        dpr.current = next
        setDpr(next)
        if (sustainedLow) lowSince.current = null
        if (sustainedHigh) highSince.current = null
      }
    }
  })

  return null
}
