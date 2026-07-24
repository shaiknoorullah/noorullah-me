'use client'

// Stage — the R3F canvas island mounted behind the page DOM.
//
// Phase 0 proof-of-pipeline: black background + a wireframe cube, nothing
// else. No postprocessing, no drei helpers — plain R3F only. Only ever
// rendered client-side via StageLoader's `dynamic(..., { ssr: false })`, so
// tier detection can run synchronously as initial state (no SSR mismatch).

import { Canvas, useFrame } from '@react-three/fiber'
import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Mesh } from 'three'
import { detectTier } from '../../lib/scene/quality'
import { quality, REDUCED } from '../../lib/scene/store'

function SpinningCube(): JSX.Element {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    // Reduced motion ⇒ static cube (DESIGN.md §3 contract, honored from day one).
    if (REDUCED || !meshRef.current) return
    meshRef.current.rotation.x += delta * 0.5
    meshRef.current.rotation.y += delta * 0.8
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.6, 1.6, 1.6]} />
      <meshBasicMaterial wireframe color="#A4EB53" />
    </mesh>
  )
}

export default function Stage(): JSX.Element {
  // Resolve once on mount — this component only ever runs client-side.
  const [tier] = useState(() => detectTier())

  useEffect(() => {
    quality.tier = tier
  }, [tier])

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      <Canvas
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        dpr={tier === 'low' ? [1, 1.5] : [1, 1.75]}
        camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0, 5] }}
      >
        <color attach="background" args={['#000000']} />
        <SpinningCube />
      </Canvas>
    </div>
  )
}
