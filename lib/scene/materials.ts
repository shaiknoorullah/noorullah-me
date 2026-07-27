/* Material factories for The Substrate (SPEC §6). The GLB's own materials
   are couriers/placeholders — every mesh gets an authored override at load
   (the reference pattern from v2/site/src/lib/three/materials.ts). */

import * as THREE from 'three'

/* Near-black solder mask: albedo ~0.03, roughness .5 (SPEC §6). */
export function createSolderMaskMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x080809,
    roughness: 0.5,
    metalness: 0.1,
    envMapIntensity: 0.6,
  })
}

/* Components: matte black / restrained metal. */
export function createComponentMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x0d0d0f,
    roughness: 0.42,
    metalness: 0.6,
    envMapIntensity: 0.7,
  })
}

/* Gold contacts: roughness .3 — the one bright metal on the board. */
export function createGoldMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8c6b28,
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 0.9,
  })
}

/* Die silicon: subtle iridescence 0.15, IOR 1.3 (SPEC §6). */
export function createDieSiliconMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0a0a10,
    roughness: 0.28,
    metalness: 0.4,
    iridescence: 0.15,
    iridescenceIOR: 1.3,
    envMapIntensity: 0.8,
  })
}

/* The lifted IHS: cool brushed metal, dim — a mirror here blows to a white
   slab under the key (exposure discipline, SPEC §12.3). */
export function createIhsMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x595b63,
    metalness: 1.0,
    roughness: 0.26,
    anisotropy: 0.8,
    anisotropyRotation: Math.PI / 2,
    envMapIntensity: 0.55,
  })
}

/* Plinth: honed near-black granite with a clearcoat sheen. */
export function createGraniteMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0c0c0e,
    roughness: 0.32,
    metalness: 0.0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.55,
  })
}

/* Floor: near-black polished — holds the fog cards and a whisper of
   reflection, nothing more. */
export function createFloorMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x060607,
    roughness: 0.34,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.5,
  })
}

/* Fog card texture: radial gradient sprite, soft pool — the fog is shader
   cards + scene fog, never true volumetrics (SPEC §3/§10). */
export function createFogCardTexture(): THREE.CanvasTexture {
  const s = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const g = cv.getContext('2d')!
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(16,18,22,0.55)')
  grad.addColorStop(0.55, 'rgba(10,12,16,0.28)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.NoColorSpace
  return t
}

/* ——— trace pulses (SPEC §5.1) ———
   Emissive window over the baked trace mask. r = 0→1 gradient along each
   corridor, g = (lane id+1)/6, b = the baked spill base (P1 addendum:
   the pulse practical's resting glow — runtime pulses ADD on top of this
   base, never below it). One fract-time window per lane sweeps the
   corridor: bright head, dim tail. Corn gradient-dash mechanism (REPORT
   §4.3) applied to real copper — never overlaid lines. */

export interface LaneCfg {
  /** phase offset 0..1 — staggered, never synchronized */
  offset: number
  /** laps per second (0.05 = 20s commute) */
  speed: number
  /** emissive gain, ≤ 4 (AgX rolls to yellow-white above ~5) */
  gain: number
}

export const MAX_LANES = 6
export const PULSE_GAIN_CAP = 4
/* Resting corridor glow from the mask's b channel — the floor pulses ride
   on. Deliberately dim: the spill says "powered", the pulse says "signal". */
export const SPILL_GAIN = 0.3

/* Six lanes commuting between districts (STORY act 3: VRM↔socket, DIMM
   rail, I/O spur; lane 5 is the edge-to-edge finale). Deliberately
   irrational speed ratios so lanes never phase-lock into a chase. */
export const DEFAULT_LANES: LaneCfg[] = [
  { offset: 0.0, speed: 0.05, gain: 3.2 }, // primary — the spill light rides this
  { offset: 0.37, speed: 0.041, gain: 2.4 },
  { offset: 0.62, speed: 0.058, gain: 2.0 },
  { offset: 0.21, speed: 0.036, gain: 1.6 },
  { offset: 0.83, speed: 0.047, gain: 1.4 },
  { offset: 0.5, speed: 0.029, gain: 1.2 }, // the finale lane: slow, dim
]

export function laneUniforms(lanes: LaneCfg[]): {
  offsets: number[]
  speeds: number[]
  gains: number[]
  count: number
} {
  const active = lanes.slice(0, MAX_LANES)
  const pad = (arr: number[]): number[] =>
    arr.concat(Array.from({ length: MAX_LANES - arr.length }, () => 0))
  return {
    offsets: pad(active.map((l) => l.offset)),
    speeds: pad(active.map((l) => l.speed)),
    gains: pad(active.map((l) => Math.min(PULSE_GAIN_CAP, l.gain))),
    count: active.length,
  }
}

export interface TracePulseHandle {
  setTime: (t: number) => void
  setBoost: (b: number) => void
  dispose: () => void
}

/* Inject the pulse window into a solder material's emissive term via
   onBeforeCompile. `mask` is the courier texture captured from the GLB.

   Colorspace note (execution-caught in P1/P3): the courier ships as a glTF
   emissiveTexture, which the loader tags sRGB — the sampler then returns
   DECODED values, corrupting the data channels (lane id 0.5 would read as
   0.214 and select the wrong lane). uMaskEncoded re-applies the sRGB OETF
   in-shader when (and only when) the texture is sRGB-tagged, restoring the
   exact baked values either way. */
export function applyTracePulse(
  mat: THREE.MeshStandardMaterial,
  mask: THREE.Texture,
  lanes: LaneCfg[] = DEFAULT_LANES
): TracePulseHandle {
  const u = laneUniforms(lanes)
  const uPulseTime: THREE.IUniform = { value: 0 }
  const uPulseBoost: THREE.IUniform = { value: 1 }
  const uniforms: Record<string, THREE.IUniform> = {
    uTraceMask: { value: mask },
    uMaskEncoded: { value: mask.colorSpace === THREE.SRGBColorSpace ? 1 : 0 },
    uPulseTime,
    uPulseBoost,
    uPulseColor: { value: new THREE.Color(0xa4eb53) },
    uLaneOffset: { value: u.offsets },
    uLaneSpeed: { value: u.speeds },
    uLaneGain: { value: u.gains },
    uLaneCount: { value: u.count },
  }
  const prev = mat.onBeforeCompile
  const apply = (
    shader: THREE.WebGLProgramParametersWithUniforms,
    renderer: THREE.WebGLRenderer
  ) => {
    prev?.(shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.defines = { ...(shader.defines ?? {}), USE_UV: '' }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform sampler2D uTraceMask;
        uniform float uMaskEncoded;
        uniform float uPulseTime;
        uniform float uPulseBoost;
        uniform vec3 uPulseColor;
        uniform float uLaneOffset[${MAX_LANES}];
        uniform float uLaneSpeed[${MAX_LANES}];
        uniform float uLaneGain[${MAX_LANES}];
        uniform int uLaneCount;
        float traceOETF(float c) {
          return c <= 0.0031308 ? 12.92 * c : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
        }
        `
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `
        #include <emissivemap_fragment>
        {
          vec3 tm = texture2D(uTraceMask, vUv).rgb;
          if (uMaskEncoded > 0.5) {
            tm = vec3(traceOETF(tm.r), traceOETF(tm.g), traceOETF(tm.b));
          }
          // resting spill base (mask b): the floor, never scaled below
          totalEmissiveRadiance += uPulseColor * tm.b * ${SPILL_GAIN.toFixed(2)};
          if (tm.r > 0.001) {
            float laneF = tm.g * ${MAX_LANES}.0;
            for (int i = 0; i < ${MAX_LANES}; i++) {
              if (i >= uLaneCount) break;
              if (abs(laneF - float(i + 1)) < 0.5) {
                float head = fract(uPulseTime * uLaneSpeed[i] + uLaneOffset[i]);
                float d = abs(fract(tm.r - head + 0.5) - 0.5);
                float w = smoothstep(0.07, 0.0, d);
                float tail = smoothstep(0.3, 0.0, fract(head - tm.r)) * 0.18;
                totalEmissiveRadiance +=
                  uPulseColor * (w + tail) * uLaneGain[i] * uPulseBoost;
              }
            }
          }
        }
        `
      )
  }
  mat.onBeforeCompile = apply
  mat.customProgramCacheKey = () => 'trace-pulse'
  mat.needsUpdate = true
  return {
    setTime: (t: number) => {
      uPulseTime.value = t
    },
    setBoost: (b: number) => {
      uPulseBoost.value = b
    },
    dispose: () => {
      mat.onBeforeCompile = prev
      mat.needsUpdate = true
    },
  }
}
