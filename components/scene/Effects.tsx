'use client'

/* The film grade stack (SPEC §5.7, order locked):
   SMAA → GodRays (high tier, sun = pulse light) → DOF → Bloom → CA →
   Grade (temp/sat + blue-curve LUT) → Grain → Vignette → AgX.
   This task ships the skeleton (Grade + grain + vignette + AgX); Task 13
   inserts SMAA/DOF/Bloom/CA/GodRays at the marked positions. Reduced
   motion: AgX only (SPEC §5.7).

   Effects are instantiated directly and driven imperatively in useFrame —
   NOT the wrapper components' ref props (React 19 refs are plain props and
   @react-three/postprocessing memoizes with JSON.stringify(props): a ref to
   a live effect crashes on circular refs). */

import { useFrame } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import {
  NoiseEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing'
import { useMemo } from 'react'
import type * as THREE from 'three'
import type { Director } from '../../lib/scene/director'
import { GradeEffect } from '../../lib/scene/effects'
import { REDUCED } from '../../lib/scene/store'

export function Effects({
  director,
}: {
  director: Director
  sun: THREE.Mesh | null
}) {
  const fx = useMemo(() => {
    const grade = new GradeEffect()
    const noise = new NoiseEffect({ premultiply: true })
    noise.blendMode.opacity.value = 0.55
    const vignette = new VignetteEffect({
      eskil: false,
      offset: 0.28,
      darkness: 0.72,
    })
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.AGX })
    return { grade, noise, vignette, tone }
  }, [])

  useFrame(() => {
    fx.grade.temp = director.temp
    fx.grade.sat = director.sat
    // grain ×2 on the speed ramp (SPEC §5.7: velocity-scaled)
    fx.noise.blendMode.opacity.value = Math.min(1, 0.55 * (1 + director.ramp))
    const vig = fx.vignette.uniforms.get('darkness')
    if (vig) vig.value = director.vignette
  })

  if (REDUCED) {
    return (
      <EffectComposer multisampling={0}>
        <primitive object={fx.tone} dispose={null} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <primitive object={fx.grade} dispose={null} />
      <primitive object={fx.noise} dispose={null} />
      <primitive object={fx.vignette} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
    </EffectComposer>
  )
}
