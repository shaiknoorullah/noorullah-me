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
import Snap from 'lenis/snap'
import { type JSX, Suspense, useEffect, useMemo, useState } from 'react'
import Tempus from 'tempus'
import * as THREE from 'three'
import { initDomChoreography } from '../../lib/choreography'
import { Director } from '../../lib/scene/director'
import { detectTier } from '../../lib/scene/quality'
import { quality, REDUCED } from '../../lib/scene/store'
import { DieDive } from './DieDive'
import { DustField } from './DustField'
import { Effects } from './Effects'
import { Rig } from './Rig'
import { StatementText } from './StatementText'
import { SubstrateSet } from './SubstrateSet'
import { TransitionParticles } from './TransitionParticles'

gsap.registerPlugin(ScrollTrigger)

export default function SceneRoot(): JSX.Element {
  const director = useMemo(() => new Director(REDUCED), [])
  const [ready, setReady] = useState(false)
  const [sun, setSun] = useState<THREE.Mesh | null>(null)
  const [paused, setPaused] = useState(false)

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
    let snap: Snap | null = null
    if (!REDUCED) {
      // heavier lerp 0.085 per DESIGN §10.6; tempus drives the RAF
      const lenis = new Lenis({ lerp: 0.085, smoothWheel: true })
      lenisInstance = lenis
      lenis.on('scroll', ScrollTrigger.update)
      offTempus = Tempus.add((time: number) => lenis.raf(time * 1000)) ?? null
      // magnetic proximity snap at act boundaries (DESIGN §10.6) — the
      // statement + principles pinned ranges own their own scrub and are
      // deliberately excluded from the anchor list below
      snap = new Snap(lenis, {
        type: 'proximity',
        debounce: 120,
        duration: 1.1,
        easing: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
      })
    }

    // choreography first (pins change layout), then refresh so triggers
    // settle against final layout, then buildKeys() resolves shot anchors
    // against that settled layout (Task 20; ordering per the reference
    // Stage.tsx and this task's brief)
    const teardownDom = initDomChoreography(lenisInstance, director)
    ScrollTrigger.refresh()
    director.buildKeys()

    // 'refresh' fires with pin spacers applied — buildKeys() re-resolves the
    // shot anchors against post-refresh layout, and (Task 20) the snap
    // anchors land where sections actually arrive. It must NOT call
    // ScrollTrigger.refresh() itself: rebuild is also registered as a
    // 'refresh' listener below, and refresh() dispatches its own 'refresh'
    // event at its tail (gsap/ScrollTrigger.js), so calling it from inside
    // the listener recurses unconditionally (confirmed: RangeError, maximum
    // call stack). Reference (v2/site/src/components/scene/Stage.tsx
    // ~85-105) keeps refresh() calls outside rebuild — only the initial call
    // above and the fonts.ready call below trigger it.
    let snapOffs: Array<() => void> = []
    const rebuild = () => {
      director.buildKeys()
      if (snap) {
        for (const off of snapOffs) off()
        snapOffs = [snap.add(0)]
        for (const id of ['work', 'evidence', 'about', 'writing', 'contact']) {
          const el = document.getElementById(id)
          if (!el) continue
          snapOffs.push(
            snap.add(el.getBoundingClientRect().top + (window.scrollY || 0))
          )
        }
      }
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

    /* tab-hide: freeze the frame loop (audio pauses itself, Task 18) */
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)

    // QA/debug handle (harmless in production)
    ;(window as unknown as { __dir?: Director }).__dir = director

    setReady(true)

    return () => {
      removeEventListener('resize', rebuild)
      ScrollTrigger.removeEventListener('refresh', rebuild)
      removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVis)
      THREE.DefaultLoadingManager.onProgress = () => {
        /* released: island unmounted */
      }
      for (const off of snapOffs) off()
      snap?.destroy()
      teardownDom()
      offTempus?.()
      lenisInstance?.destroy()
    }
  }, [director])

  // 'failsafe' folds into the same lowest-DPR/no-post floor as 'low' (Task
  // 22: the degradation ladder's bottom rung, DESIGN §11.3/SPEC §7).
  const low = quality.tier === 'low' || quality.tier === 'failsafe'

  return (
    <Canvas
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
      }}
      dpr={low ? [1, 1] : [1, 1.75]}
      frameloop={paused ? 'never' : 'always'}
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
        <DieDive director={director} />
        <TransitionParticles director={director} />
        <DustField />
        <StatementText />
        {ready && <Rig director={director} />}
        <Effects director={director} sun={sun} />
      </Suspense>
    </Canvas>
  )
}
