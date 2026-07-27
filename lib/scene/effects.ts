/* Parametric film grade — the per-act grade (SPEC §5.7). Temperature and
   saturation crossfaded by the Director; blue channel shaped by a 1D curve
   LUT (ATEN7-P3 uBlueCurve pattern: texture2D(uBlueCurve, vec2(b, 0))) that
   lifts the film floor off pure 0% black. Runs pre-tonemap so AgX's
   shoulder shapes the graded image. Ported from v2/site/src/lib/three/
   effects.ts and extended with the curve. */

import { Effect } from 'postprocessing'
import { DataTexture, RedFormat, Uniform, UnsignedByteType } from 'three'

/* 256x1 blue-channel curve: identity with a gentle toe lift (~2%) and a
   mild shoulder — near-black scenes crush to mud on commodity displays
   without the floor (SPEC §12.3, storyboard risk 3). */
export function createBlueCurveTexture(): DataTexture {
  const n = 256
  const data = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1)
    const lifted = x + 0.02 * (1 - x) * (1 - x) // toe lift, white point fixed
    data[i] = Math.round(Math.min(1, lifted) * 255)
  }
  const tex = new DataTexture(data, n, 1, RedFormat, UnsignedByteType)
  tex.needsUpdate = true
  return tex
}

const frag = /* glsl */ `
  uniform float uTemp;
  uniform float uSat;
  uniform sampler2D uBlueCurve;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;

    // white-balance shift along the warm-cool axis
    c.r *= 1.0 + uTemp * 0.11;
    c.g *= 1.0 + uTemp * 0.02;
    c.b *= 1.0 - uTemp * 0.12;

    // filmic milk: a whisper of cool lift in only the deepest blacks
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float shadow = 1.0 - smoothstep(0.0, 0.10, luma);
    c += shadow * vec3(0.0022, 0.0026, 0.0038);

    // blue-channel curve LUT (ATEN7-P3)
    c.b = texture2D(uBlueCurve, vec2(clamp(c.b, 0.0, 1.0), 0.5)).r;

    // saturation around luma
    luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(luma), c, uSat);

    // dither the near-black gradients so they never band (ATEN7-P3)
    c += (hash12(uv * 913.7) - 0.5) * (0.05 / 255.0 * 12.0);

    outputColor = vec4(c, inputColor.a);
  }
`

export class GradeEffect extends Effect {
  constructor() {
    super('GradeEffect', frag, {
      uniforms: new Map<string, Uniform>([
        ['uTemp', new Uniform(0.1)],
        ['uSat', new Uniform(1.0)],
        ['uBlueCurve', new Uniform(createBlueCurveTexture())],
      ]),
    })
  }

  set temp(v: number) {
    this.uniforms.get('uTemp')!.value = v
  }

  set sat(v: number) {
    this.uniforms.get('uSat')!.value = v
  }
}
