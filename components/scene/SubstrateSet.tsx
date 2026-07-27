'use client'

/* The Substrate set (SPEC §3/§6) — the Blender-authored assembly loaded
   from substrate.glb and re-materialed in code. The solder courier material
   carries the trace mask (emission slot) and AO (occlusion slot); both are
   captured before the override. Fog = gradient sprite cards pooled under
   the slab + scene fog (no true volumetrics). The pulse-head mesh rides
   lane 0 and is the GodRays sun (SPEC §5.7) and the spill light's mount
   (SPEC §5.1).

   Deviations from the task-10 brief (documented per task instructions):

   1. Loader wiring: the brief imports MeshoptDecoder/KTX2Loader from
      'three-stdlib'. This app pins three@0.185.1 directly; three-stdlib's
      bundled copies can lag that version. Per the task's environment facts,
      both are imported from three's own examples/jsm instead
      (three/examples/jsm/libs/meshopt_decoder.module.js,
      three/examples/jsm/loaders/KTX2Loader.js) for guaranteed compatibility.
      Consequently useGLTF is called with useDraco=false, useMeshopt=false:
      drei's useGLTF applies its own (three-stdlib) draco/meshopt wiring
      *after* running extendLoader, which would silently clobber the
      loaders set below with the wrong versions. Draco isn't used by this
      asset at all (meshopt + KTX2 only, per the GLB's extensionsUsed).

   2. Per-mesh override keys: the brief matches on `mesh.name` (e.g.
      name === 'floor', name.startsWith('board_solder_')). Empirically
      verified against the actual GLB (via a real GLTFLoader.parse trace,
      not just its node-name list): GLTFLoader assigns the authored node
      names ('floor', 'plinth', 'ihs', 'board_solder_pcb', ...) to the
      *wrapping* Object3D/Group for each node, while the actual THREE.Mesh
      instance underneath gets an auto-generated name ('mesh_0', 'mesh_2',
      ...) because this GLB's json.meshes[] entries carry no `name` field
      (GLTFLoader.js: `mesh.name = meshDef.name || ('mesh_' + meshIndex)`).
      So a `mesh.name === 'floor'` check never matches here. The GLB's
      *materials*, however, keep their authored names correctly on every
      mesh instance (mt_solder_traced, mt_gold, mt_component, mt_darkmetal,
      mt_die, mt_ihs, mt_granite, mt_floor — confirmed 1:1 with the
      environment brief's material list) and, in this asset, each override
      target maps 1:1 (or 1:22 for the die material) to exactly the
      material the brief intended for that named mesh. The traverse below
      keys on `mesh.material.name` instead — robust to the node-name
      mismatch, and additionally covers `board_metal_joined` (mt_darkmetal),
      an extra mesh the brief's name-based branches missed entirely (mapped
      to the same restrained component material as board_comp_joined).

   3. The override traverse is a `useEffect` rather than the brief's
      `useMemo` (a memo with a discarded return value used purely for a
      mutation is a side effect in a memo's clothing). This also gives the
      director's shadow hard-gate below a well-defined point to run: once,
      immediately after every mesh's material + cast/receive flags are set. */

import { ContactShadows, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { LANES } from '../../lib/scene/anchors.generated'
import type { Director } from '../../lib/scene/director'
import { loadStudioEnvironment } from '../../lib/scene/environment'
import {
  applyTracePulse,
  createComponentMaterial,
  createDieSiliconMaterial,
  createFloorMaterial,
  createFogCardTexture,
  createGoldMaterial,
  createGraniteMaterial,
  createIhsMaterial,
  createSolderMaskMaterial,
  type TracePulseHandle,
} from '../../lib/scene/materials'
import {
  BASIS_PATH,
  FILL_COLOR,
  FILL_POS,
  KEY_COLOR,
  KEY_POS,
  KEY_TGT,
  PULSE_LIGHT_COLOR,
  PULSE_LIGHT_DISTANCE,
  PULSE_LIGHT_INTENSITY,
  RIM_COLOR,
  RIM_POS,
  STUDIO_HDR_URL,
  SUBSTRATE_GLB_URL,
} from '../../lib/scene/rig'
import { REDUCED } from '../../lib/scene/store'

/* point on a polyline at parameter t 0..1 (arc-length-ish by segment) */
function lanePoint(
  lane: readonly (readonly [number, number, number])[],
  t: number
): THREE.Vector3 {
  const seg = Math.min(lane.length - 2, Math.floor(t * (lane.length - 1)))
  const local = t * (lane.length - 1) - seg
  const a = lane[seg]!
  const b = lane[seg + 1]!
  return new THREE.Vector3(
    a[0] + (b[0] - a[0]) * local,
    a[1] + (b[1] - a[1]) * local + 0.05,
    a[2] + (b[2] - a[2]) * local
  )
}

export function SubstrateSet({
  director,
  onSun,
}: {
  director: Director
  onSun?: (m: THREE.Mesh) => void
}) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const gltf = useGLTF(SUBSTRATE_GLB_URL, false, false, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder)
    const ktx2 = new KTX2Loader()
      .setTranscoderPath(BASIS_PATH)
      .detectSupport(gl)
    // strict-TS fix: drei's ExtendLoader types `loader` against three-stdlib's
    // GLTFLoader, whose setKTX2Loader() expects three-stdlib's own KTX2Loader
    // (whose .d.ts types dispose() as returning `this`). We deliberately
    // construct three's own KTX2Loader (deviation #1 above; three's .d.ts
    // types dispose() as `void`) — same runtime shape, incompatible .d.ts
    // authored independently by the two packages. One-line cast at the
    // boundary; no behavior change.
    loader.setKTX2Loader(
      ktx2 as unknown as Parameters<typeof loader.setKTX2Loader>[0]
    )
  })

  const mats = useMemo(
    () => ({
      solder: createSolderMaskMaterial(),
      component: createComponentMaterial(),
      gold: createGoldMaterial(),
      die: createDieSiliconMaterial(),
      ihs: createIhsMaterial(),
      granite: createGraniteMaterial(),
      floor: createFloorMaterial(),
    }),
    []
  )

  const pulseHead = useRef<THREE.Mesh | null>(null)
  const pulseHandles = useRef<TracePulseHandle[]>([])
  const fadeMats = useRef<THREE.Material[]>([])
  const boardObjs = useRef<THREE.Object3D[]>([])

  /* Override materials + shadow flags by the GLB's material contract (see
     deviation #2 above). The trace-mask courier (emission slot) is stashed
     on userData for Task 11; AO (occlusion slot) is carried onto the
     override. */
  useEffect(() => {
    gltf.scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const src = o.material as THREE.MeshStandardMaterial
      switch (src.name) {
        case 'mt_floor':
          o.material = mats.floor
          o.receiveShadow = true
          fadeMats.current.push(o.material)
          boardObjs.current.push(o)
          break
        case 'mt_granite':
          o.material = mats.granite
          o.castShadow = true
          o.receiveShadow = true
          fadeMats.current.push(o.material)
          boardObjs.current.push(o)
          break
        case 'mt_ihs':
          o.material = mats.ihs
          o.castShadow = true
          break
        case 'mt_solder_traced': {
          const m = mats.solder.clone()
          if (src.aoMap) m.aoMap = src.aoMap
          if (src.emissiveMap) {
            o.userData.traceMask = src.emissiveMap
            // SPEC §5.1: the pulse system keys strictly on the per-mesh
            // courier (plan self-review note 10)
            pulseHandles.current.push(applyTracePulse(m, src.emissiveMap))
          }
          o.material = m
          o.castShadow = true
          o.receiveShadow = true
          fadeMats.current.push(m)
          boardObjs.current.push(o)
          break
        }
        case 'mt_gold':
          o.material = mats.gold
          o.castShadow = true
          fadeMats.current.push(o.material)
          boardObjs.current.push(o)
          break
        case 'mt_component':
        case 'mt_darkmetal': {
          const m = src.aoMap ? mats.component.clone() : mats.component
          if (src.aoMap) m.aoMap = src.aoMap
          o.material = m
          o.castShadow = true
          fadeMats.current.push(m)
          boardObjs.current.push(o)
          break
        }
        case 'mt_die':
          o.material = mats.die
          break
        default:
          break
      }
    })

    // Hard gate (director): SceneRoot freezes gl.shadowMap.autoUpdate = false
    // ("the set is static", components/scene/SceneRoot.tsx) and nothing else
    // in this set ever flips autoUpdate back on. Without one explicit
    // request here, the shadow map would bake from whatever happened to be
    // in the scene before this traverse ran (courier placeholders, no
    // cast/receive flags) and stay frozen that way forever. Requesting one
    // update now — after every mesh's material and shadow flags are final —
    // bakes the correct, final shadow map exactly once; WebGLShadowMap
    // resets needsUpdate to false immediately after that single render.
    gl.shadowMap.needsUpdate = true

    const handles = pulseHandles.current
    return () => {
      for (const h of handles) h.dispose()
      handles.length = 0
    }
  }, [gltf, mats, gl])

  /* The pulse-head: a small emissive sphere riding lane 0 — the GodRays sun
     and the spill light's mount. */
  const headMesh = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x0a0f04,
        emissive: 0xa4eb53,
        emissiveIntensity: 3.0,
        roughness: 0.4,
      })
    )
    m.visible = !REDUCED
    return m
  }, [])

  useEffect(() => {
    scene.add(headMesh)
    pulseHead.current = headMesh
    onSun?.(headMesh)
    const l = new THREE.PointLight(
      PULSE_LIGHT_COLOR,
      PULSE_LIGHT_INTENSITY,
      PULSE_LIGHT_DISTANCE,
      2
    )
    headMesh.add(l)
    return () => {
      headMesh.remove(l)
      scene.remove(headMesh)
      l.dispose()
    }
  }, [scene, headMesh, onSun])

  /* Cycles studio HDRI -> PMREM -> environment (never the background). */
  useEffect(() => {
    let dead = false
    let env: THREE.Texture | null = null
    loadStudioEnvironment(gl, STUDIO_HDR_URL)
      .then((t) => {
        if (dead) {
          t.dispose()
          return
        }
        env = t
        scene.environment = t
      })
      .catch(() => {
        /* HDR missing: the rig alone lights the set */
      })
    return () => {
      dead = true
      scene.environment = null
      env?.dispose()
    }
  }, [gl, scene])

  /* Fog cards: three gradient sprites pooled under the slab. */
  const fogCards = useMemo(() => {
    const tex = createFogCardTexture()
    return [-2.2, 0, 2.4].map((x, i) => {
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0.5 - i * 0.12,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), mat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(x, 0.06 + i * 0.05, -0.5 + i * 0.8)
      mesh.renderOrder = 2
      return mesh
    })
  }, [])

  /* Light targets must live in the scene graph. */
  const key = useRef<THREE.SpotLight>(null!)
  const fill = useRef<THREE.SpotLight>(null!)
  const rim = useRef<THREE.SpotLight>(null!)
  useEffect(() => {
    const k = key.current
    const f = fill.current
    const r = rim.current
    k.target.position.copy(KEY_TGT)
    f.target.position.copy(KEY_TGT)
    r.target.position.set(0.2, 1.0, 0.2)
    scene.add(k.target, f.target, r.target)
    return () => {
      scene.remove(k.target, f.target, r.target)
    }
  }, [scene])

  useFrame((st) => {
    const t = REDUCED ? 0 : st.clock.elapsedTime
    for (const h of pulseHandles.current) {
      h.setTime(t)
      h.setBoost(director.pulseBoost)
    }
    // board dissolve: the set hands off to the re-formation (SPEC §5.2);
    // the particles carry the eye through diveT 0.35..0.55
    let fade = 1
    if (director.diveT > 0.35) fade = 1 - (director.diveT - 0.35) / 0.2
    if (director.diveT >= 0.55) fade = 0
    fade = Math.max(0, fade)
    for (const m of fadeMats.current) {
      m.transparent = fade < 1
      m.opacity = fade
    }
    for (const o of boardObjs.current) {
      o.visible = fade > 0
    }
    // the head commutes lane 0 at the primary lane's speed (0.05/s = 20s lap)
    if (headMesh.visible) {
      const head = (t * 0.05) % 1
      headMesh.position.copy(lanePoint(LANES[0]!, head))
      const mat = headMesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 3.0 * director.pulseBoost
      const light = headMesh.children[0] as THREE.PointLight | undefined
      if (light) light.intensity = PULSE_LIGHT_INTENSITY * director.pulseBoost
    }
  })

  return (
    <group>
      {/* key: 5600K softbox, camera-left, low — long component shadows */}
      <spotLight
        ref={key}
        position={KEY_POS.toArray()}
        color={KEY_COLOR}
        intensity={180}
        angle={0.55}
        penumbra={0.6}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
      />
      {/* fill: ionic-tinted cool ~15%, lifts floors, never to gray */}
      <spotLight
        ref={fill}
        position={FILL_POS.toArray()}
        color={FILL_COLOR}
        intensity={30}
        angle={0.7}
        penumbra={0.9}
        decay={2}
      />
      {/* rim: ember from behind the skyline — separates the relief */}
      <spotLight
        ref={rim}
        position={RIM_POS.toArray()}
        color={RIM_COLOR}
        intensity={50}
        angle={0.38}
        penumbra={1}
        decay={2}
      />
      <hemisphereLight args={[0x0a0a0c, 0x000000, 0.2]} />

      <primitive object={gltf.scene} />
      {fogCards.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}

      <ContactShadows
        position={[0, -0.6, 0]}
        opacity={0.6}
        scale={14}
        blur={2.6}
        far={4}
        resolution={512}
        color="#000000"
      />
    </group>
  )
}

/* Deviation #4 (documented; found empirically, not in the brief): the brief
   ends with a bare `useGLTF.preload(SUBSTRATE_GLB_URL)`. r3f's useLoader
   caches by [LoaderClass, url] (events-*.esm.js: `suspend(fn, [loader,
   ...keys])`) and only ever invokes the *first* caller's extension
   callback for a given key — a bare preload call (no extendLoader arg)
   registers a no-op extension closure first, permanently starving the real
   in-component `useGLTF(url, false, false, extendLoader)` call below of its
   KTX2Loader/MeshoptDecoder wiring. Confirmed live: this GLB failed to load
   with "THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2
   textures" until the bare preload was removed. Since this asset needs a
   `gl`-dependent extendLoader (KTX2Loader.detectSupport(gl)) unavailable at
   module scope, preloading it correctly isn't practical here — dropped
   rather than shipped broken. */
