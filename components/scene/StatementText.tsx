'use client'

/* SDF statement text (SPEC §5.5, DESIGN §10.3) — the pinned statement
   rendered in-canvas as per-word troika SDF text (Newsreader italic),
   parented to the camera at z = -3 (HUD-style). The statement pin's
   ScrollTrigger writes statementState; this consumes it per frame:
   per-word reveal, depth-graded fill, signal emphasis band on the evidence
   words (the gradient-dash mechanism — kept), velocity dissolve. The DOM
   paragraph stays visually-hidden as the a11y/SEO/reduced-motion source.
   Under reduced motion this mounts nothing. Ported verbatim from
   v2/site/src/components/scene/StatementText.tsx. */

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { createDerivedMaterial } from 'troika-three-utils'
import { REDUCED, statementState } from '../../lib/scene/store'

/* The 45-word career case — copy is owned by the DOM paragraph in
   components/landing/sections.tsx; keep these in lockstep (the test
   asserts it). */
const STATEMENT =
  'Twenty-eight months ago I joined as a backend engineer. The team contracted from eleven to five. I absorbed the platform — and shipped a 99.999%-target multi-cloud Kubernetes PaaS, a 16-RFC platform specification, and a multi-agent engineering platform that lets one engineer run ten tickets in parallel.'
const WORDS = STATEMENT.split(' ')
const EMPHASIS = new Set(['99.999%-target', '16-RFC', 'multi-agent'])

const FONT = '/fonts/newsreader-italic.ttf'
const FONT_SIZE = 0.19
const LINE_HEIGHT = FONT_SIZE * 1.42
const SPACE_W = FONT_SIZE * 0.3
const CAM_DEPTH = 3.0

const BONE_0 = new THREE.Color(0xf2f2f5)
const BONE_1 = new THREE.Color(0xa0a0a8)

const sharedDissolve = { value: 0 }
const sharedOpacity = { value: 0 }

class StatementWord extends Text {
  override createDerivedMaterial(baseMaterial: THREE.Material): THREE.Material {
    const textMat = super.createDerivedMaterial(baseMaterial)
    return createDerivedMaterial(textMat, {
      chained: true,
      uniforms: {
        uReveal: { value: 0 },
        uEmphasis: { value: 0 },
        uPhase: { value: 0 },
        uTime: { value: 0 },
        uDissolve: sharedDissolve,
        uGroupOpacity: sharedOpacity,
      },
      vertexDefs: /* glsl */ `
        uniform float uReveal;
      `,
      vertexTransform: /* glsl */ `
        position.y += (uReveal - 1.0) * 0.06;
      `,
      fragmentDefs: /* glsl */ `
        uniform float uReveal;
        uniform float uEmphasis;
        uniform float uPhase;
        uniform float uTime;
        uniform float uDissolve;
        uniform float uGroupOpacity;
        float stHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
        float stNoise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(stHash(i), stHash(i + vec2(1.0, 0.0)), f.x),
                     mix(stHash(i + vec2(0.0, 1.0)), stHash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
      `,
      fragmentColorTransform: /* glsl */ `
        float stDist = troikaGetFragDistValue();
        float stAA = max(troikaGetAADist(), 1e-5);

        // (a) reveal: alpha ramp + SDF edge softening
        float stSoft = (1.0 - uReveal) * 0.012;
        float stEdge = smoothstep(uTroikaEdgeOffset + stAA + stSoft, uTroikaEdgeOffset - stAA - stSoft, stDist);
        gl_FragColor.a *= uReveal * stEdge;

        // (b) emphasis: animated signal band on the glyph SDF border
        float stBand = 1.0 - smoothstep(0.0, 0.010, abs(stDist - uTroikaEdgeOffset));
        float stShimmer = 0.6 + 0.4 * sin(uTime * 2.4 + uPhase + vTroikaGlyphUV.x * 18.0 + vTroikaGlyphUV.y * 9.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.643, 0.922, 0.325) * 1.6, stBand * stShimmer * uEmphasis);

        // (c) dissolve: fine 2D noise erodes alpha with scroll velocity
        float stN = stNoise(vTroikaGlyphUV * 30.0 + uPhase);
        gl_FragColor.a *= smoothstep(-0.12, 0.12, (1.0 - uDissolve) - stN * uDissolve * 1.15);

        // window envelope (statement pin edges)
        gl_FragColor.a *= uGroupOpacity;

        if (gl_FragColor.a < 0.08) discard;
      `,
    })
  }
}

interface WordRec {
  mesh: StatementWord
  uniforms: Record<string, { value: number }>
  width: number
  emphasis: boolean
}

export function StatementText() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)

  const group = useMemo(() => new THREE.Group(), [])
  const words = useMemo<WordRec[]>(() => {
    if (REDUCED) return []
    return WORDS.map((w, i) => {
      const mesh = new StatementWord()
      mesh.text = w
      mesh.font = FONT
      mesh.fontSize = FONT_SIZE
      mesh.anchorX = 'left'
      mesh.anchorY = 'middle'
      mesh.color = 0xf2f2f5
      mesh.renderOrder = 20
      const mat = mesh.material as THREE.Material & {
        uniforms: Record<string, { value: number }>
      }
      mat.uniforms.uEmphasis!.value = EMPHASIS.has(w) ? 1 : 0
      mat.uniforms.uPhase!.value = i * 1.618
      return {
        mesh,
        uniforms: mat.uniforms,
        width: 0,
        emphasis: EMPHASIS.has(w),
      }
    })
  }, [])

  useEffect(() => {
    if (REDUCED || !words.length) return
    scene.add(camera)
    for (const w of words) group.add(w.mesh)
    group.position.set(0, 0, -CAM_DEPTH)
    camera.add(group)
    return () => {
      camera.remove(group)
      scene.remove(camera)
    }
  }, [camera, scene, group, words])

  const veil = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
    mesh.renderOrder = 19
    return mesh
  }, [])
  useEffect(() => {
    if (REDUCED || !words.length) return
    veil.position.set(0, 0, -CAM_DEPTH - 0.5)
    camera.add(veil)
    return () => {
      camera.remove(veil)
    }
  }, [camera, veil, words])

  const syncedRef = useRef(0)
  const layout = () => {
    if (!words.length) return
    if (words.some((w) => !w.mesh.textRenderInfo)) return
    for (const w of words) {
      const b = w.mesh.textRenderInfo!.blockBounds
      w.width = b[2]! - b[0]!
    }
    const portrait = camera.aspect < 1
    const fovBase = THREE.MathUtils.degToRad(26 + (portrait ? 4 : 0))
    const visH = 2 * CAM_DEPTH * Math.tan(fovBase / 2)
    const visW = visH * camera.aspect
    const maxW = visW * (portrait ? 0.94 : 0.86)
    const maxH = visH * (portrait ? 0.52 : 0.6)

    const totalW =
      words.reduce((a, w) => a + w.width, 0) + SPACE_W * (words.length - 1)
    const targetW = totalW / (portrait ? 7.5 : 5.5)
    const maxLines = portrait ? 8 : 6
    const lines: WordRec[][] = [[]]
    let lineW = 0
    for (const w of words) {
      const need = lineW === 0 ? w.width : lineW + SPACE_W + w.width
      if (lineW > 0 && need > targetW && lines.length < maxLines) {
        lines.push([w])
        lineW = w.width
      } else {
        lines[lines.length - 1]!.push(w)
        lineW = need
      }
    }
    const lineWidths = lines.map(
      (l) => l.reduce((a, w) => a + w.width, 0) + SPACE_W * (l.length - 1)
    )
    const widest = Math.max(...lineWidths, 1e-4)
    const totalH = lines.length * LINE_HEIGHT
    const scale = Math.min(1, maxW / widest, maxH / totalH)

    const tmp = new THREE.Color()
    lines.forEach((line, li) => {
      tmp.lerpColors(BONE_0, BONE_1, Math.min(1, li * 0.16))
      let x = -lineWidths[li]! / 2
      const y = ((lines.length - 1) / 2) * LINE_HEIGHT - li * LINE_HEIGHT
      for (const w of line) {
        w.mesh.position.set(x, y, 0)
        w.mesh.color = tmp.getHex()
        x += w.width + SPACE_W
      }
    })
    group.scale.setScalar(scale)
    group.position.set(
      portrait ? -visW * 0.02 : 0,
      portrait ? visH * 0.05 : 0,
      -CAM_DEPTH
    )
    const veilH = 2 * (CAM_DEPTH + 0.5) * Math.tan(fovBase / 2)
    veil.scale.set(veilH * camera.aspect * 1.4, veilH * 1.4, 1)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: layout is a stable closure over refs/camera; sync fires once per mesh
  useEffect(() => {
    if (REDUCED || !words.length) return
    syncedRef.current = 0
    for (const w of words) {
      w.mesh.sync(() => {
        syncedRef.current += 1
        if (syncedRef.current === words.length) layout()
      })
    }
    return () => {
      for (const w of words) w.mesh.dispose()
    }
  }, [words])

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-layout on viewport resize only
  useEffect(() => {
    layout()
  }, [size.width, size.height])

  const lastP = useRef(0)
  useFrame((st, rawDt) => {
    if (REDUCED || !words.length) return
    const dt = Math.min(rawDt, 0.05)
    const p = statementState.progress

    const raw = Math.abs(p - lastP.current) / Math.max(dt, 1e-4)
    lastP.current = p
    statementState.velocity +=
      (raw - statementState.velocity) * (1 - Math.exp(-dt * 6))
    sharedDissolve.value = Math.min(1, statementState.velocity * 0.55)
    sharedOpacity.value = statementState.vis

    const vis = statementState.vis
    group.visible = vis > 0.002
    veil.visible = group.visible
    ;(veil.material as THREE.MeshBasicMaterial).opacity = vis * 0.52
    if (!group.visible) return

    const n = words.length
    for (let i = 0; i < n; i++) {
      const u = words[i]!.uniforms
      u.uReveal!.value = Math.min(1, Math.max(0, (p - (i / n) * 0.85) / 0.15))
      u.uTime!.value = st.clock.elapsedTime
    }
  })

  if (REDUCED) return null
  return null
}
