'use client'

/* Dust (SPEC §5.4, CORN §5 optical model — replaces the old additive
   ParticleField look). Point sprites with a hexagon polygon-DF shape;
   in-shader DOF: out-of-focus = bigger + softer + dimmer; 3D simplex
   advection; twinkle period 30–200s; NORMAL alpha blending (additive is
   vetoed); brightness boost only inside the key shaft (hyperfocus motif).
   Strata: 4000 far / 1800 mid / 60 near; half on low, near dropped.

   Adaptations from the task-12 brief (documented per task instructions):
   1. The brief's `low` check was `quality.tier === 'low' || quality.tier
      === 'failsafe'`. This app's QualityTier (lib/scene/quality.ts) is
      only 'high' | 'mid' | 'low' — there is no 'failsafe' tier here, so
      that branch is a strict-TS literal-overlap error (TS2367). Dropped
      the 'failsafe' arm; 'low' alone is the correct low-tier gate for
      this codebase.
   2. The brief keyed each stratum's <points> on its array index
      (`key={i}`), which biome's lint/suspicious/noArrayIndexKey flags as
      an error under this repo's lint config. Keyed on `s.geo.uuid`
      instead (stable per built BufferGeometry instance; `strata` is
      memoized on `low` so identity doesn't change across re-renders). */

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { BONE, KEY_POS, KEY_TGT, SIGNAL } from '../../lib/scene/rig'
import { quality, REDUCED } from '../../lib/scene/store'

export interface StratumCfg {
  count: number
  box: [number, number, number]
  center: [number, number, number]
  sizeMin: number
  sizeMax: number
  opacity: number
  speedMax: number
}

export function dustStrata(low: boolean): StratumCfg[] {
  const far: StratumCfg = {
    count: low ? 2000 : 4000,
    box: [30, 12, 30],
    center: [0, 4, -6],
    sizeMin: 0.012,
    sizeMax: 0.03,
    opacity: 0.22,
    speedMax: 0.35,
  }
  const mid: StratumCfg = {
    count: low ? 900 : 1800,
    box: [16, 8, 16],
    center: [0, 2.5, -1],
    sizeMin: 0.02,
    sizeMax: 0.05,
    opacity: 0.38,
    speedMax: 0.55,
  }
  if (low) return [far, mid]
  return [
    far,
    mid,
    {
      count: 60,
      box: [8, 4, 8],
      center: [4, 2.4, 3.4],
      sizeMin: 0.3,
      sizeMax: 0.8,
      opacity: 0.075,
      speedMax: 0.25,
    },
  ]
}

const VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
attribute float aTint;
uniform float uTime;
uniform float uSizeScale;
uniform vec3 uDofFocus;
uniform vec2 uDofAmount;
varying float vTint;
varying float vTwinkle;
varying vec3 vWorld;
varying float vDist;
varying float vDefocus;

// ashima 3D simplex noise (compact)
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec3 p = position;
  // 3D simplex advection (CORN §5: transformed += (snoise(...)-.5))
  p += (snoise((p + uTime / 40.0) / 15.0) - 0.5) * 1.6 * (0.3 + aSpeed);
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  // twinkle 30–200s period (slower motes drift longest)
  float period = mix(200.0, 30.0, aSpeed);
  vTwinkle = 0.75 + 0.25 * sin(uTime / period * 6.2831 + aPhase * 6.2831);
  // optical DOF: out-of-focus = BIGGER + softer + dimmer
  vDefocus = smoothstep(uDofAmount.x, uDofAmount.y, distance(world.xyz, uDofFocus));
  vec4 mv = viewMatrix * world;
  vDist = -mv.z;
  float size = mix(aSize, aSize * 3.0, vDefocus);
  gl_PointSize = size * uSizeScale / max(-mv.z, 0.001);
  vTint = aTint;
  gl_Position = projectionMatrix * mv;
}
`

const FRAG = /* glsl */ `
uniform vec3 uBone;
uniform vec3 uSignal;
uniform float uOpacity;
uniform vec3 uConeOrigin;
uniform vec3 uConeAxis;
uniform float uConeCos;
uniform float uConeLen;
varying float vTint;
varying float vTwinkle;
varying vec3 vWorld;
varying float vDist;
varying float vDefocus;

// hexagon polygon distance (CORN §5 polygonDf, shapeSides = 6)
float polygonDf(vec2 uv) {
  float a = atan(uv.x, uv.y) + 3.14159265;
  float r = 6.2831853 / 6.0;
  return cos(floor(0.5 + a / r) * r - a) * length(uv);
}

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float df = polygonDf(c) * 2.0;
  // edge softness scales with defocus: in-focus crisp, out-of-focus soft
  float disc = smoothstep(0.5, 0.5 - mix(0.05, 0.3, vDefocus), df);
  // brightness boost only inside the key shaft (hyperfocus motif)
  vec3 rel = vWorld - uConeOrigin;
  float d = length(rel);
  float cone = smoothstep(uConeCos, min(uConeCos + 0.06, 1.0), dot(rel / max(d, 1e-4), uConeAxis))
             * (1.0 - smoothstep(uConeLen * 0.6, uConeLen, d));
  float fade = smoothstep(0.25, 1.1, vDist) * (1.0 - smoothstep(22.0, 32.0, vDist));
  vec3 col = mix(uBone, uSignal, vTint);
  // out-of-focus = dimmer
  float a = disc * uOpacity * vTwinkle * fade * mix(1.0, 0.4, vDefocus) * (1.0 + cone * 1.6);
  gl_FragColor = vec4(col, a);
}
`

function buildStratum(cfg: StratumCfg) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(cfg.count * 3)
  const size = new Float32Array(cfg.count)
  const phase = new Float32Array(cfg.count)
  const speed = new Float32Array(cfg.count)
  const tint = new Float32Array(cfg.count)
  for (let i = 0; i < cfg.count; i++) {
    pos[i * 3] = cfg.center[0] + (Math.random() - 0.5) * cfg.box[0]
    pos[i * 3 + 1] = cfg.center[1] + (Math.random() - 0.5) * cfg.box[1]
    pos[i * 3 + 2] = cfg.center[2] + (Math.random() - 0.5) * cfg.box[2]
    size[i] = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin)
    phase[i] = Math.random() * Math.PI * 2
    speed[i] = 0.15 + Math.random() * cfg.speedMax
    tint[i] = Math.random() < 0.05 ? 1 : 0
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
  geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1))

  const coneAxis = KEY_TGT.clone().sub(KEY_POS).normalize()
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.NormalBlending, // additive is vetoed (SPEC §5.4)
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSizeScale: { value: 600 },
      uOpacity: { value: cfg.opacity },
      uBone: { value: new THREE.Color(BONE) },
      uSignal: { value: new THREE.Color(SIGNAL) },
      uDofFocus: { value: KEY_TGT.clone() },
      uDofAmount: { value: new THREE.Vector2(1.5, 9.0) },
      uConeOrigin: { value: KEY_POS.clone() },
      uConeAxis: { value: coneAxis },
      uConeCos: { value: Math.cos(0.55) },
      uConeLen: { value: KEY_POS.distanceTo(KEY_TGT) },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  })
  return { geo, mat }
}

export function DustField() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const low = quality.tier === 'low'

  const strata = useMemo(() => dustStrata(low).map(buildStratum), [low])

  useFrame((st) => {
    const scale =
      (gl.getDrawingBufferSize(new THREE.Vector2()).y / 2) *
      camera.projectionMatrix.elements[5]!
    for (const s of strata) {
      s.mat.uniforms.uTime!.value = REDUCED ? 0 : st.clock.elapsedTime
      s.mat.uniforms.uSizeScale!.value = scale
    }
  })

  return (
    <group>
      {strata.map((s) => (
        <points
          key={s.geo.uuid}
          geometry={s.geo}
          material={s.mat}
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
