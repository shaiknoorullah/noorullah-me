'use client'

/* The dive (SPEC §4 act 4, STORY act 5 — the single hero moment): the IHS
   lifts in one slow mechanical move (no explode — a lift), the camera
   descends through the open socket into the exposed die, and the logic
   blocks wake green in sequence like a city grid coming online. The
   board set dissolves into the GPGPU re-formation above this layer
   (SubstrateSet fade), the particles carry the eye (Task 15). */

import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Director } from '../../lib/scene/director'
import { SIGNAL, SUBSTRATE_GLB_URL } from '../../lib/scene/rig'
import { REDUCED } from '../../lib/scene/store'

/* Resting emissive floor (P1 director ruling): the bare silicon must read
   before the wake — the cascade ADDS on top of this, never below it. */
export const DIE_EMISSIVE_FLOOR = 0.06

/* one slow mechanical lift — easeIO over the first 55% of the dive */
export function ihsLift(dive: number): number {
  const t = Math.min(1, Math.max(0, dive / 0.55))
  return t * t * (3 - 2 * t) * 1.35
}

/* per-block wake 0..1: block i wakes over window [i/total*0.35 + 0.4,
   +0.25] of the dive — sequenced, never simultaneous (the A1 cascade) */
export function wakeAt(dive: number, index: number, total: number): number {
  const start = 0.4 + (index / Math.max(1, total)) * 0.35
  return Math.min(1, Math.max(0, (dive - start) / 0.25))
}

export function DieDive({ director }: { director: Director }) {
  const gltf = useGLTF(SUBSTRATE_GLB_URL)
  const gl = useThree((s) => s.gl)

  /* gltfpack wraps each named node in an Object3D whose mesh child is
     anonymous (dieblock_00 -> mesh_4) — match the NODE by name and lift
     it; the mesh rides along. Never gate the name match on instanceof
     Mesh (that made this component silently inert against the real GLB) */
  const ihs = useMemo(() => {
    let found: THREE.Object3D | null = null
    gltf.scene.traverse((o) => {
      if (o.name === 'ihs') found = o
    })
    return found as THREE.Object3D | null
  }, [gltf])

  const blocks = useMemo(() => {
    const out: THREE.Object3D[] = []
    gltf.scene.traverse((o) => {
      if (
        o.name.startsWith('dieblock_') &&
        !o.parent?.name.startsWith('dieblock_')
      )
        out.push(o)
    })
    return out
  }, [gltf])

  const ihsHome = useRef<number | null>(null)
  const lastLift = useRef(0)
  const blockMats = useRef<THREE.MeshStandardMaterial[]>([])

  /* per-block emissive clones so the cascade addresses each block (the
     GLB shares one mt_die across all 22 — stitched Task 10 review note) */
  useEffect(() => {
    blockMats.current = blocks.map((b) => {
      // clone once per BLOCK and share it across the block's mesh
      // descendants, so the cascade addresses blocks, not primitives
      const meshes: THREE.Mesh[] = []
      b.traverse((c) => {
        if (c instanceof THREE.Mesh) meshes.push(c)
      })
      const src = meshes[0]?.material as THREE.MeshStandardMaterial | undefined
      const m = (src ?? new THREE.MeshStandardMaterial()).clone()
      m.emissive = new THREE.Color(SIGNAL)
      m.emissiveIntensity = DIE_EMISSIVE_FLOOR
      for (const mesh of meshes) mesh.material = m
      return m
    })
    if (ihs) ihsHome.current = ihs.position.y
    const mats = blockMats.current
    return () => {
      for (const m of mats) m.dispose()
      blockMats.current = []
    }
  }, [blocks, ihs])

  useFrame(() => {
    const dive = REDUCED ? 1 : director.diveT
    if (ihs && ihsHome.current !== null) {
      const lift = ihsLift(dive)
      ihs.position.y = ihsHome.current + lift
      // frozen shadow map (SceneRoot): the IHS is a shadow caster — flag
      // a re-bake only on frames where the lift actually moves it
      // (stitched P2 review hard-gate)
      if (Math.abs(lift - lastLift.current) > 1e-4) {
        gl.shadowMap.needsUpdate = true
        lastLift.current = lift
      }
    }
    const n = blocks.length
    for (let i = 0; i < n; i++) {
      const m = blockMats.current[i]
      // the wake ADDS on top of the resting floor, never below it
      if (m) m.emissiveIntensity = DIE_EMISSIVE_FLOOR + wakeAt(dive, i, n) * 1.8
    }
  })

  return null
}
