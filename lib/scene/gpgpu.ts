/* GPGPU re-formation (SPEC §5.2, ATEN7-P3): position+velocity float
   textures, spring-to-target + curl noise, brightness keyed to speed,
   normal alpha blending. Target A = board trace corridors (sampled from
   the baked mask), target B = die block surfaces (sampled from geometry).
   This module holds the pure samplers + GLSL; the component drives it. */

import * as THREE from 'three'

/* deterministic PRNG so transitions are reproducible in tests and QA */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface PixelSource {
  data: Uint8ClampedArray
  width: number
  height: number
}

/* Sample of lit mask pixels (r > 31/255), mapped to world by the caller.
   Used for the board-trace targets. */
export function sampleMaskPoints(
  img: PixelSource,
  count: number,
  toWorld: (u: number, v: number) => [number, number, number],
  rand: () => number
): Float32Array {
  const lit: number[] = []
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const r = img.data[(y * img.width + x) * 4]!
      if (r > 31) lit.push(x, y)
    }
  }
  const out = new Float32Array(count * 3)
  const n = Math.max(1, lit.length / 2)
  for (let i = 0; i < count; i++) {
    const j = Math.floor(rand() * n) * 2
    const u = (lit[j]! + 0.5) / img.width
    const v = (lit[j + 1]! + 0.5) / img.height
    const [wx, wy, wz] = toWorld(u, v)
    out[i * 3] = wx
    out[i * 3 + 1] = wy
    out[i * 3 + 2] = wz
  }
  return out
}

/* Uniform-by-area surface sampling across meshes, world space. Used for
   the die-block targets. */
export function sampleMeshSurfacePoints(
  meshes: THREE.Mesh[],
  count: number,
  rand: () => number
): Float32Array {
  interface Tri {
    a: THREE.Vector3
    b: THREE.Vector3
    c: THREE.Vector3
    area: number
  }
  const tris: Tri[] = []
  const va = new THREE.Vector3()
  const vb = new THREE.Vector3()
  const vc = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  for (const mesh of meshes) {
    mesh.updateMatrixWorld(true)
    const geo = mesh.geometry as THREE.BufferGeometry
    const pos = geo.getAttribute('position')
    const idx = geo.getIndex()
    const triCount = idx ? idx.count / 3 : pos.count / 3
    for (let t = 0; t < triCount; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3
      const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
      const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
      va.fromBufferAttribute(pos, i0).applyMatrix4(mesh.matrixWorld)
      vb.fromBufferAttribute(pos, i1).applyMatrix4(mesh.matrixWorld)
      vc.fromBufferAttribute(pos, i2).applyMatrix4(mesh.matrixWorld)
      ab.subVectors(vb, va)
      ac.subVectors(vc, va)
      const area = ab.cross(ac).length() / 2
      if (area > 1e-10)
        tris.push({ a: va.clone(), b: vb.clone(), c: vc.clone(), area })
    }
  }
  const total = tris.reduce((s, t) => s + t.area, 0)
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    let pick = rand() * total
    let tri = tris[0]!
    for (const t of tris) {
      pick -= t.area
      if (pick <= 0) {
        tri = t
        break
      }
    }
    // barycentric-uniform point on the triangle
    const r1 = Math.sqrt(rand())
    const r2 = rand()
    const x = 1 - r1
    const y = r1 * (1 - r2)
    const z = r1 * r2
    out[i * 3] = tri.a.x * x + tri.b.x * y + tri.c.x * z
    out[i * 3 + 1] = tri.a.y * x + tri.b.y * y + tri.c.y * z
    out[i * 3 + 2] = tri.a.z * x + tri.b.z * y + tri.c.z * z
  }
  return out
}

/* ——— GLSL (shared by the compute + render passes) ——— */

export const SNOISE_GLSL = /* glsl */ `
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
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  float n1 = snoise(p + vec3(0.0, e, 0.0));
  float n2 = snoise(p - vec3(0.0, e, 0.0));
  float n3 = snoise(p + vec3(0.0, 0.0, e));
  float n4 = snoise(p - vec3(0.0, 0.0, e));
  float n5 = snoise(p + vec3(e, 0.0, 0.0));
  float n6 = snoise(p - vec3(e, 0.0, 0.0));
  float x = (n1 - n2) - (n3 - n4);
  float y = (n3 - n4) - (n5 - n6);
  float z = (n5 - n6) - (n1 - n2);
  return normalize(vec3(x, y, z) + 1e-5);
}
`

export const POSITION_FRAG = /* glsl */ `
uniform float uDelta;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec4 vel = texture2D(textureVelocity, uv);
  pos.xyz += vel.xyz * uDelta;
  gl_FragColor = pos;
}
`

export const VELOCITY_FRAG = /* glsl */ `
uniform float uDelta;
uniform float uTime;
uniform float uProgress;
uniform sampler2D uTargetA;
uniform sampler2D uTargetB;
${SNOISE_GLSL}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec4 vel = texture2D(textureVelocity, uv);
  vec3 target = mix(texture2D(uTargetA, uv).xyz, texture2D(uTargetB, uv).xyz, uProgress);
  // spring-to-target (k scaled by progress so the wavefront locks in)
  vec3 spring = (target - pos.xyz) * (1.2 + uProgress * 3.0);
  // curl noise stream, strongest mid-transition (the streak trails)
  float stream = sin(uProgress * 3.14159265);
  vec3 curl = curlNoise(pos.xyz * 0.35 + uTime * 0.05) * stream * 1.6;
  vel.xyz = vel.xyz * 0.96 + (spring + curl) * uDelta;
  gl_FragColor = vel;
}
`

export const RENDER_VERT = /* glsl */ `
uniform sampler2D uPositions;
uniform sampler2D uVelocities;
uniform float uSizeScale;
varying float vSpeed;
void main() {
  vec4 pos = texture2D(uPositions, uv);
  vec4 vel = texture2D(uVelocities, uv);
  vSpeed = length(vel.xyz);
  vec4 mv = modelViewMatrix * vec4(pos.xyz, 1.0);
  gl_PointSize = (1.2 + vSpeed * 2.2) * uSizeScale / max(-mv.z, 0.001);
  gl_Position = projectionMatrix * mv;
}
`

export const RENDER_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vSpeed;
float polygonDf(vec2 uv) {
  float a = atan(uv.x, uv.y) + 3.14159265;
  float r = 6.2831853 / 6.0;
  return cos(floor(0.5 + a / r) * r - a) * length(uv);
}
void main() {
  float df = polygonDf(gl_PointCoord - 0.5) * 2.0;
  float disc = smoothstep(0.5, 0.32, df);
  // brightness keyed to velocity (SPEC §5.2)
  float glow = 0.6 + min(vSpeed * 0.9, 2.2);
  gl_FragColor = vec4(uColor * glow, disc * uOpacity);
}
`
