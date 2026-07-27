/* Parametric film grade — the per-act grade (SPEC §5.7, GRADE.md §1/§8).
   Steps 1–7 of the grade pipeline run here as shader math on the linear
   pre-tonemap frame (the baked display-referred LUTs are for stills — see
   GRADE.md §7 domain note): exposure → temperature → saturation →
   pivot-shifted S-curve → split tone → per-act blue-channel curve →
   black floor. Halation/grain/vignette stay live effects in the stack.
   Per-act numbers come from lib/scene/grade.generated.ts (acts.json is
   the single source of truth); act transitions crossfade scalar uniforms
   CPU-side and mix two rows of the blue-curve atlas GPU-side. */

import { Effect } from 'postprocessing'
import { DataTexture, RedFormat, Uniform, UnsignedByteType } from 'three'
import { GRADE_ACTS, type GradeAct } from './grade.generated'

/* ——— monotone Hermite (GRADE.md §4): finite-difference tangents ——— */
export function evalMonotoneHermite(
  points: readonly (readonly [number, number])[],
  x: number
): number {
  const n = points.length
  if (n === 0) return x
  const first = points[0]
  const last = points[n - 1]
  if (first === undefined || last === undefined) return x
  if (x <= first[0]) return first[1]
  if (x >= last[0]) return last[1]

  const tangent = (i: number): number => {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[Math.min(n - 1, i + 1)]
    if (p0 === undefined || p1 === undefined) return 0
    const dx = p1[0] - p0[0]
    if (dx === 0) return 0
    return (p1[1] - p0[1]) / dx
  }

  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (p1 === undefined || p2 === undefined) continue
    if (x > p2[0]) continue
    const h = p2[0] - p1[0]
    const t = (x - p1[0]) / h
    const m1 = tangent(i)
    const m2 = tangent(i + 1)
    const t2 = t * t
    const t3 = t2 * t
    const y =
      (2 * t3 - 3 * t2 + 1) * p1[1] +
      (t3 - 2 * t2 + t) * h * m1 +
      (-2 * t3 + 3 * t2) * p2[1] +
      (t3 - t2) * h * m2
    return Math.min(1, Math.max(0, y))
  }
  return last[1]
}

/* 256×N atlas: one baked blue curve row per act; the shader mixes the two
   act rows of the current transition (ATEN7-P3 uBlueCurve pattern). */
export function buildBlueCurveAtlas(
  acts: readonly GradeAct[] = GRADE_ACTS
): DataTexture {
  const w = 256
  const h = Math.max(1, acts.length)
  const data = new Uint8Array(w * h)
  acts.forEach((act, row) => {
    for (let i = 0; i < w; i++) {
      const x = i / (w - 1)
      data[row * w + i] = Math.round(
        Math.min(1, Math.max(0, evalMonotoneHermite(act.blueCurve, x))) * 255
      )
    }
  })
  const tex = new DataTexture(data, w, h, RedFormat, UnsignedByteType)
  tex.needsUpdate = true
  return tex
}

/* Back-compat for the Task 9 wiring test: a single-curve texture (act 0). */
export function createBlueCurveTexture(): DataTexture {
  const act = GRADE_ACTS[0]
  const n = 256
  const data = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1)
    const y = act ? evalMonotoneHermite(act.blueCurve, x) : x
    // toe lift preserved, white point pinned at 255 for the LUT gate
    data[i] =
      i === n - 1 ? 255 : Math.round(Math.min(1, Math.max(y, x * 0.98)) * 255)
  }
  const tex = new DataTexture(data, n, 1, RedFormat, UnsignedByteType)
  tex.needsUpdate = true
  return tex
}

/* ——— act blending: Effects drives the grade through the Director's keys.
   DESIGN §5 has 8 sections; the grade has 6 acts — principles/writing ride
   the about→contact drift (GRADE.md §2 note). ——— */
const SECTION_ACT: Record<string, number> = {
  hero: 0,
  statement: 1,
  work: 2,
  evidence: 3,
  about: 4,
  principles: 4,
  writing: 5,
  contact: 5,
}

export interface ActBlend {
  a: number
  b: number
  t: number
}

export function resolveActBlend(
  keys: readonly { p: number; section: string }[],
  p: number
): ActBlend {
  if (keys.length === 0) return { a: 0, b: 0, t: 0 }
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (first === undefined || last === undefined) return { a: 0, b: 0, t: 0 }
  const act = (s: string): number => SECTION_ACT[s] ?? 0
  if (p <= first.p)
    return { a: act(first.section), b: act(first.section), t: 0 }
  if (p >= last.p) return { a: act(last.section), b: act(last.section), t: 0 }
  for (let i = 0; i < keys.length - 1; i++) {
    const k1 = keys[i]
    const k2 = keys[i + 1]
    if (k1 === undefined || k2 === undefined) continue
    if (p > k2.p) continue
    const t = k2.p === k1.p ? 0 : (p - k1.p) / (k2.p - k1.p)
    return { a: act(k1.section), b: act(k2.section), t }
  }
  return { a: act(last.section), b: act(last.section), t: 0 }
}

const frag = /* glsl */ `
  uniform float uExp;
  uniform float uTemp;
  uniform float uSat;
  uniform float uContrast;
  uniform float uPivot;
  uniform float uFloor;
  uniform sampler2D uBlueCurve;
  uniform float uActA;
  uniform float uActB;
  uniform float uActMix;
  uniform float uActRows;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float blueCurve(float b) {
    float x = clamp(b, 0.0, 1.0);
    float ya = texture2D(uBlueCurve, vec2(x, (uActA + 0.5) / uActRows)).r;
    float yb = texture2D(uBlueCurve, vec2(x, (uActB + 0.5) / uActRows)).r;
    return mix(ya, yb, uActMix);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 x = inputColor.rgb;

    // 1 exposure (stops)
    x *= exp2(uExp);
    // 2 temperature
    x.r *= 1.0 + 0.08 * uTemp;
    x.b *= 1.0 - 0.10 * uTemp;
    x = clamp(x, 0.0, 1.0);
    // 3 saturation (luma-anchored)
    float L = dot(x, vec3(0.2126, 0.7152, 0.0722));
    x = clamp(vec3(L) + (x - vec3(L)) * uSat, 0.0, 1.0);
    // GRADE.md's pivot/floor/split-mask numbers are display-referred (the
    // swarm graded AgX proofs); this slot is pre-AgX linear (SPEC §5.7
    // locked order). Run steps 4-7 in a gamma-encoded working domain so
    // the authored numbers keep their meaning, then decode for AgX —
    // a linear-domain 0.06 floor would read ~0.28 on screen (caught by
    // the e2e uniformity gate).
    x = pow(max(x, vec3(0.0)), vec3(1.0 / 2.2));
    // 4 pivot-shifted S-curve (GRADE.md §3)
    float k = log(0.5) / log(uPivot);
    vec3 w = pow(max(x, vec3(1e-6)), vec3(k));
    vec3 s = w * w * (3.0 - 2.0 * w);
    vec3 sp = pow(max(s, vec3(1e-9)), vec3(1.0 / k));
    x = x + uContrast * (sp - x);
    // 5 split tone (luma-preserving; mids untouched)
    L = dot(x, vec3(0.2126, 0.7152, 0.0722));
    float shM = smoothstep(0.45, 0.0, L);
    float hiM = smoothstep(0.55, 1.0, L);
    vec3 TS = vec3(0.20784, 0.32157, 0.90980);
    vec3 TH = vec3(1.0, 0.41961, 0.10196);
    x = mix(x, TS * (L / 0.33996), 0.08 * shM);
    x = mix(x, TH * (L / 0.51997), 0.05 * hiM);
    // 6 per-act blue-channel curve (ATEN7-P3 uBlueCurve)
    x.b = blueCurve(x.b);
    // 7 black floor (~5-8 IRE — never crush to 0)
    x = uFloor + (1.0 - uFloor) * x;
    // back to linear for the AgX pass
    x = pow(max(x, vec3(0.0)), vec3(2.2));
    // dither the near-black gradients so they never band (ATEN7-P3)
    x += (hash12(uv * 913.7) - 0.5) * (0.05 / 255.0 * 12.0);

    outputColor = vec4(clamp(x, 0.0, 1.0), inputColor.a);
  }
`

export class GradeEffect extends Effect {
  constructor() {
    super('GradeEffect', frag, {
      uniforms: new Map<string, Uniform>([
        ['uExp', new Uniform(0)],
        ['uTemp', new Uniform(0.1)],
        ['uSat', new Uniform(1.0)],
        ['uContrast', new Uniform(0.36)],
        ['uPivot', new Uniform(0.36)],
        ['uFloor', new Uniform(0.06)],
        ['uBlueCurve', new Uniform(buildBlueCurveAtlas())],
        ['uActA', new Uniform(0)],
        ['uActB', new Uniform(0)],
        ['uActMix', new Uniform(0)],
        ['uActRows', new Uniform(Math.max(1, GRADE_ACTS.length))],
      ]),
    })
  }

  private setU(name: string, v: number): void {
    const u = this.uniforms.get(name)
    if (u) u.value = v
  }

  set temp(v: number) {
    this.setU('uTemp', v)
  }

  set sat(v: number) {
    this.setU('uSat', v)
  }

  /* Drive every act-parametric uniform from the blend (lerped CPU-side;
     the blue curve mixes its two atlas rows GPU-side). The Director's own
     continuous temp/sat (shot-table authored) take precedence over the act
     table when the caller sets them after this. */
  applyActBlend(blend: ActBlend, expOffset = 0): void {
    const a = GRADE_ACTS[blend.a]
    const b = GRADE_ACTS[blend.b]
    if (!(a && b)) return
    const mix = (x: number, y: number): number => x + (y - x) * blend.t
    this.setU('uExp', mix(a.exp, b.exp) + expOffset)
    this.setU('uContrast', mix(a.contrast, b.contrast))
    this.setU('uPivot', mix(a.pivot, b.pivot))
    this.setU('uFloor', mix(a.floor, b.floor))
    this.setU('uActA', blend.a)
    this.setU('uActB', blend.b)
    this.setU('uActMix', blend.t)
  }

  /* Halation gain for the current blend — consumed by the Bloom drive
     (GRADE.md §6: halation = the bloom lift; threshold stays at the
     SPEC-locked .72, gain rides the act). */
  halationGain(blend: ActBlend): number {
    const a = GRADE_ACTS[blend.a]
    const b = GRADE_ACTS[blend.b]
    if (!(a && b)) return 0.3
    return a.halation + (b.halation - a.halation) * blend.t
  }
}
