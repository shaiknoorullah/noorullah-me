'use client'

/* The film grade stack (SPEC §5.7, order locked):
   SMAA → GodRays (high tier, sun = pulse light) → DOF (disk-bokeh look via
   postprocessing CoC; director-driven focus) → Bloom (mipmap, selective by
   luminance, threshold .72) → ChromaticAberration (velocity-scaled) →
   Grade (per-act GRADE.md pipeline + blue-curve LUT atlas) → Grain
   (velocity-scaled) → Vignette → AgX. Reduced motion: AgX only.
   Direct instantiation + imperative drive (see Task 9 note on refs).

   Grade acts (GRADE.md / acts.json) blend through the Director's keys:
   resolveActBlend maps the bracketing sections to the 6 grade acts and
   GradeEffect crossfades exposure/contrast/pivot/floor + the two
   blue-curve atlas rows. Halation = the act's gain riding Bloom's
   INTENSITY (threshold stays at the SPEC-locked .72; GRADE.md's .80
   halation variant is noted for director review at the act frames). */

import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import {
  BlendFunction,
  BloomEffect,
  ChromaticAberrationEffect,
  DepthOfFieldEffect,
  GodRaysEffect,
  KernelSize,
  NoiseEffect,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { Director } from '../../lib/scene/director'
import { GradeEffect, resolveActBlend } from '../../lib/scene/effects'
import { quality, REDUCED, scrollState } from '../../lib/scene/store'

export function Effects({
  director,
  sun,
}: {
  director: Director
  sun: THREE.Mesh | null
}) {
  const camera = useThree((s) => s.camera)
  const high = quality.tier === 'high'
  const lean = quality.tier === 'low'

  const smaa = useMemo(() => new SMAAEffect(), [])

  const godRays = useMemo(() => {
    if (!(high && sun) || REDUCED) return null
    return new GodRaysEffect(camera, sun, {
      density: 0.9,
      decay: 0.93,
      weight: 0.25,
      exposure: 0.22,
      samples: 48,
      kernelSize: KernelSize.SMALL,
      blur: true,
    })
  }, [camera, sun, high])

  const dof = useMemo(() => {
    if (lean || REDUCED) return null
    return new DepthOfFieldEffect(camera as THREE.PerspectiveCamera, {
      worldFocusDistance: 7.2,
      worldFocusRange: 14,
      bokehScale: 1.7, // a fast prime wide open, not an anamorphic fantasy
      height: 480,
    })
  }, [camera, lean])

  const bloom = useMemo(
    () =>
      new BloomEffect({
        intensity: 0.45,
        luminanceThreshold: 0.72,
        luminanceSmoothing: 0.3,
        mipmapBlur: true,
      }),
    []
  )

  const ca = useMemo(
    () =>
      new ChromaticAberrationEffect({
        blendFunction: BlendFunction.NORMAL,
        offset: new THREE.Vector2(0.00045, 0.00027),
        radialModulation: true,
        modulationOffset: 0.55,
      }),
    []
  )

  const grade = useMemo(() => new GradeEffect(), [])
  const noise = useMemo(() => {
    const n = new NoiseEffect({ premultiply: true })
    n.blendMode.opacity.value = 0.55
    return n
  }, [])
  const vignette = useMemo(
    () => new VignetteEffect({ eskil: false, offset: 0.28, darkness: 0.72 }),
    []
  )
  const tone = useMemo(
    () => new ToneMappingEffect({ mode: ToneMappingMode.AGX }),
    []
  )

  useFrame(() => {
    // grade acts through the Director's keys (GRADE.md §2 table)
    const sections = director.keys.map((k) => ({
      p: k.p,
      section: typeof k.at[1] === 'string' ? k.at[1] : 'contact',
    }))
    const blend = resolveActBlend(sections, scrollState.p)
    grade.applyActBlend(blend)
    // the Director's continuous shot-table temp/sat own the final word
    grade.temp = director.temp
    grade.sat = director.sat

    // halation rides bloom intensity (GRADE.md §6; act 5's "bloom lift")
    bloom.intensity = director.bloom * (0.7 + grade.halationGain(blend))
    // speed ramp: CA ×4 at full fling (SPEC §5.7 velocity-scaled)
    const k = 0.00045 * (1 + director.ramp * 3)
    ca.offset.set(k, k * 0.6)
    // grain ×2 on the ramp
    noise.blendMode.opacity.value = Math.min(1, 0.55 * (1 + director.ramp))
    const vig = vignette.uniforms.get('darkness')
    if (vig) vig.value = director.vignette
    if (dof) {
      const coc = dof.cocMaterial
      coc.worldFocusDistance = director.focusDist
      coc.worldFocusRange = 14 / Math.max(0.35, director.aperture)
    }
  })

  if (REDUCED) {
    return (
      <EffectComposer multisampling={0}>
        <primitive object={tone} dispose={null} />
      </EffectComposer>
    )
  }

  if (lean) {
    // low tier: lightmap/AO carries the set; grain + grade + vignette + AgX
    return (
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <primitive object={grade} dispose={null} />
        <primitive object={noise} dispose={null} />
        <primitive object={vignette} dispose={null} />
        <primitive object={tone} dispose={null} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <primitive object={smaa} dispose={null} />
      {godRays ? <primitive object={godRays} dispose={null} /> : <></>}
      {dof ? <primitive object={dof} dispose={null} /> : <></>}
      <primitive object={bloom} dispose={null} />
      <primitive object={ca} dispose={null} />
      <primitive object={grade} dispose={null} />
      <primitive object={noise} dispose={null} />
      <primitive object={vignette} dispose={null} />
      <primitive object={tone} dispose={null} />
    </EffectComposer>
  )
}
