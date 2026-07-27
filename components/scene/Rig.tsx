'use client'

/* Rig: the per-frame binding. Updates the mutable scroll state (p, smoothed
   v), hands the camera to the Director, drives scene fog density off the
   grade spring. Ported from v2/site/src/components/scene/Rig.tsx. */

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Director } from '../../lib/scene/director'
import { REDUCED, readScroll, scrollState } from '../../lib/scene/store'

export function Rig({ director }: { director: Director }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const lastY = useRef(0)

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
  })

  return null
}
