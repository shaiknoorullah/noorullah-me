'use client'

/* Board→die re-formation (SPEC §5.2 — the site's one spectacle moment):
   the dissolving board's trace signal becomes a green particle field that
   streams and re-forms as the die's logic blocks. GPUComputationRenderer
   position+velocity float textures (ATEN7-P3), spring-to-target + curl
   noise, brightness keyed to velocity, NORMAL blending. ≤65,536 points
   mid/high (256²), 16,384 low (128²), hidden on failsafe.

   Adaptation from the task-15 brief (same as DustField's task-12 note):
   the brief gates the sim on `tier === 'failsafe'`, but this app's
   QualityTier is only 'high' | 'mid' | 'low' (TS2367 literal-overlap
   error) — failsafe means the canvas never mounts (SceneIsland), so
   REDUCED alone is the correct skip gate here. */

import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import {
  BOARD_MAX,
  BOARD_MIN,
  SURFACE_Y,
} from '../../lib/scene/anchors.generated'
import type { Director } from '../../lib/scene/director'
import {
  mulberry32,
  POSITION_FRAG,
  RENDER_FRAG,
  RENDER_VERT,
  sampleMaskPoints,
  sampleMeshSurfacePoints,
  VELOCITY_FRAG,
} from '../../lib/scene/gpgpu'
import { SIGNAL, SUBSTRATE_GLB_URL } from '../../lib/scene/rig'
import { quality, REDUCED } from '../../lib/scene/store'

/* read the courier mask's pixels CPU-side (the KTX2 GPU texture can't be
   read back, but its source PNG is on the image bitmap) */
async function maskPixels(url: string): Promise<{
  data: Uint8ClampedArray
  width: number
  height: number
} | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const bmp = await createImageBitmap(blob)
    const cv = document.createElement('canvas')
    cv.width = bmp.width
    cv.height = bmp.height
    const g = cv.getContext('2d')
    if (!g) return null
    g.drawImage(bmp, 0, 0)
    return {
      data: g.getImageData(0, 0, bmp.width, bmp.height).data,
      width: bmp.width,
      height: bmp.height,
    }
  } catch {
    return null
  }
}

export function TransitionParticles({ director }: { director: Director }) {
  const gl = useThree((s) => s.gl)
  const gltf = useGLTF(SUBSTRATE_GLB_URL)
  const tier = quality.tier
  const SIZE = tier === 'low' ? 128 : 256
  const COUNT = SIZE * SIZE

  const sim = useMemo(() => {
    if (REDUCED) return null
    const gpu = new GPUComputationRenderer(SIZE, SIZE, gl)
    const posTex = gpu.createTexture()
    const velTex = gpu.createTexture()
    const posVar = gpu.addVariable('texturePosition', POSITION_FRAG, posTex)
    const velVar = gpu.addVariable('textureVelocity', VELOCITY_FRAG, velTex)
    gpu.setVariableDependencies(posVar, [posVar, velVar])
    gpu.setVariableDependencies(velVar, [posVar, velVar])
    velVar.material.uniforms.uDelta = { value: 0 }
    velVar.material.uniforms.uTime = { value: 0 }
    velVar.material.uniforms.uProgress = { value: 0 }
    velVar.material.uniforms.uTargetA = { value: gpu.createTexture() }
    velVar.material.uniforms.uTargetB = { value: gpu.createTexture() }
    posVar.material.uniforms.uDelta = { value: 0 }
    return { gpu, posVar, velVar, posTex, velTex }
  }, [gl, SIZE, tier])

  const points = useMemo(() => {
    if (!sim) return null
    const geo = new THREE.BufferGeometry()
    // positions come from the compute texture; only uv (reference) matters
    const pos = new Float32Array(COUNT * 3)
    const uv = new Float32Array(COUNT * 2)
    for (let i = 0; i < COUNT; i++) {
      uv[i * 2] = ((i % SIZE) + 0.5) / SIZE
      uv[i * 2 + 1] = (Math.floor(i / SIZE) + 0.5) / SIZE
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.NormalBlending, // additive is vetoed
      depthWrite: false,
      uniforms: {
        uPositions: { value: null },
        uVelocities: { value: null },
        uSizeScale: { value: 600 },
        uColor: { value: new THREE.Color(SIGNAL) },
        uOpacity: { value: 0.85 },
      },
      vertexShader: RENDER_VERT,
      fragmentShader: RENDER_FRAG,
    })
    const pts = new THREE.Points(geo, mat)
    pts.frustumCulled = false
    pts.visible = false
    return pts
  }, [sim, COUNT, SIZE])

  const readyRef = useRef(false)

  /* bake both target sets once: board corridors from the mask, die blocks
     from geometry. Deterministic seed -> reproducible re-formation. */
  useEffect(() => {
    if (!sim || readyRef.current) return
    let dead = false
    const go = async () => {
      const dieMeshes: THREE.Mesh[] = []
      gltf.scene.traverse((o) => {
        if (o.name.startsWith('dieblock_') && o instanceof THREE.Mesh)
          dieMeshes.push(o)
      })
      const rand = mulberry32(1337)
      const diePts = sampleMeshSurfacePoints(dieMeshes, COUNT, rand)
      const px = await maskPixels('/assets/tracemap-src.png')
      if (dead) return
      let boardPts: Float32Array
      if (px) {
        boardPts = sampleMaskPoints(
          px,
          COUNT,
          (u, v) => [
            BOARD_MIN[0] + u * (BOARD_MAX[0] - BOARD_MIN[0]),
            SURFACE_Y + 0.08,
            BOARD_MIN[2] + v * (BOARD_MAX[2] - BOARD_MIN[2]),
          ],
          rand
        )
      } else {
        // mask unreadable: fall back to a uniform scatter over the board
        // plane so the transition still runs (log for QA)
        console.warn('[substrate] tracemap-src.png missing; surface fallback')
        boardPts = new Float32Array(COUNT * 3)
        for (let i = 0; i < COUNT; i++) {
          boardPts[i * 3] =
            BOARD_MIN[0] + rand() * (BOARD_MAX[0] - BOARD_MIN[0])
          boardPts[i * 3 + 1] = SURFACE_Y + 0.08
          boardPts[i * 3 + 2] =
            BOARD_MIN[2] + rand() * (BOARD_MAX[2] - BOARD_MIN[2])
        }
      }
      const fill = (tex: THREE.DataTexture, arr: Float32Array) => {
        const d = tex.image.data as Float32Array
        for (let i = 0; i < COUNT; i++) {
          d[i * 4] = arr[i * 3]!
          d[i * 4 + 1] = arr[i * 3 + 1]!
          d[i * 4 + 2] = arr[i * 3 + 2]!
          d[i * 4 + 3] = 1
        }
      }
      fill(sim.posTex, boardPts)
      fill(sim.velTex, new Float32Array(COUNT * 3))
      fill(
        sim.velVar.material.uniforms.uTargetA!.value as THREE.DataTexture,
        boardPts
      )
      fill(
        sim.velVar.material.uniforms.uTargetB!.value as THREE.DataTexture,
        diePts
      )
      const err = sim.gpu.init()
      if (err) console.error('[substrate] gpgpu init:', err)
      readyRef.current = true
    }
    go()
    return () => {
      dead = true
    }
  }, [sim, gltf, COUNT])

  useEffect(() => {
    if (!points) return
    const parent = gltf.scene.parent
    parent?.add(points)
    return () => {
      parent?.remove(points)
    }
  }, [points, gltf])

  useFrame((st, rawDt) => {
    if (!(sim && points && readyRef.current)) return
    const dt = Math.min(rawDt, 0.05)
    const dive = director.diveT
    const active = dive > 0.02 && dive < 0.98
    points.visible = active
    if (!active) return
    sim.velVar.material.uniforms.uDelta!.value = dt
    sim.velVar.material.uniforms.uTime!.value = st.clock.elapsedTime
    sim.velVar.material.uniforms.uProgress!.value = dive
    sim.posVar.material.uniforms.uDelta!.value = dt
    sim.gpu.compute()
    const mat = points.material as THREE.ShaderMaterial
    mat.uniforms.uPositions!.value = sim.gpu.getCurrentRenderTarget(
      sim.posVar
    ).texture
    mat.uniforms.uVelocities!.value = sim.gpu.getCurrentRenderTarget(
      sim.velVar
    ).texture
    const scale =
      (gl.getDrawingBufferSize(new THREE.Vector2()).y / 2) *
      (st.camera as THREE.PerspectiveCamera).projectionMatrix.elements[5]!
    mat.uniforms.uSizeScale!.value = scale * 0.004
  })

  return null
}
