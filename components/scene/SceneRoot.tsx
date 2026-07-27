'use client'

/* Scene root — the island. Owns the Canvas, quality tiering, Lenis smooth
   scroll (driven by tempus, the satus-idiomatic RAF), the Director, and the
   environment. Everything behind the content; the page conducts the film.
   Ported from v2/site/src/components/scene/Stage.tsx with the satus/tempus
   wiring swapped in for gsap.ticker. */

import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { type JSX, Suspense, useEffect, useMemo, useState } from 'react'
import Tempus from 'tempus'
import * as THREE from 'three'
import { Director } from '../../lib/scene/director'
import { detectTier } from '../../lib/scene/quality'
import { quality, REDUCED } from '../../lib/scene/store'
import { Effects } from './Effects'
import { Rig } from './Rig'
import { SubstrateSet } from './SubstrateSet'

gsap.registerPlugin(ScrollTrigger)

export default function SceneRoot(): JSX.Element {
  const director = useMemo(() => new Director(REDUCED), [])
  const [ready, setReady] = useState(false)
  const [sun, setSun] = useState<THREE.Mesh | null>(null)

  useEffect(() => {
    quality.tier = detectTier()

    /* bridge loading progress to the DOM Loader (Task 17) without pulling
       three into the main chunk */
    THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => {
      window.dispatchEvent(
        new CustomEvent('substrate:progress', { detail: { loaded, total } })
      )
    }

    let lenisInstance: Lenis | null = null
    let offTempus: (() => void) | null = null
    if (!REDUCED) {
      // heavier lerp 0.085 per DESIGN §10.6; tempus drives the RAF
      const lenis = new Lenis({ lerp: 0.085, smoothWheel: true })
      lenisInstance = lenis
      lenis.on('scroll', ScrollTrigger.update)
      offTempus = Tempus.add((time: number) => lenis.raf(time * 1000)) ?? null
    }

    director.buildKeys()
    ScrollTrigger.refresh()

    // 'refresh' fires with pin spacers applied — buildKeys() re-resolves the
    // shot anchors against post-refresh layout. It must NOT call
    // ScrollTrigger.refresh() itself: rebuild is also registered as a
    // 'refresh' listener below, and refresh() dispatches its own 'refresh'
    // event at its tail (gsap/ScrollTrigger.js), so calling it from inside
    // the listener recurses unconditionally (confirmed: RangeError, maximum
    // call stack). Reference (v2/site/src/components/scene/Stage.tsx
    // ~85-105) keeps refresh() calls outside rebuild — only the initial call
    // above and the fonts.ready call below trigger it.
    const rebuild = () => {
      director.buildKeys()
    }
    addEventListener('resize', rebuild)
    ScrollTrigger.addEventListener('refresh', rebuild)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    const onPointer = (e: PointerEvent) => {
      director.setPointer(
        (e.clientX / innerWidth) * 2 - 1,
        -(e.clientY / innerHeight) * 2 + 1
      )
    }
    addEventListener('pointermove', onPointer)

    // QA/debug handle (harmless in production)
    ;(window as unknown as { __dir?: Director }).__dir = director

    setReady(true)

    return () => {
      removeEventListener('resize', rebuild)
      ScrollTrigger.removeEventListener('refresh', rebuild)
      removeEventListener('pointermove', onPointer)
      THREE.DefaultLoadingManager.onProgress = () => {}
      offTempus?.()
      lenisInstance?.destroy()
    }
  }, [director])

  const low = quality.tier === 'low'

  return (
    <Canvas
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
      }}
      dpr={low ? [1, 1] : [1, 1.75]}
      camera={{ fov: 20, near: 0.1, far: 140, position: [8.2, 2.4, 7.4] }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        gl.shadowMap.autoUpdate = false // frozen: the set is static (SPEC §6)
      }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={[0x000000]} />
        <fogExp2 attach="fog" args={[0x000000, 0.028]} />
        <SubstrateSet director={director} onSun={setSun} />
        {ready && <Rig director={director} />}
        <Effects director={director} sun={sun} />
      </Suspense>
    </Canvas>
  )
}
