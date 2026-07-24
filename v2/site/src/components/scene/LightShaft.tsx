/* Volumetric cones (DESIGN.md §10.5). The key cone hangs on the key spot's
   axis — apex at the light, base toward the stack/floor — with radial soft
   edge, axial (1-y)^1.5 falloff, animated fbm density, a jali cookie mask
   projected point-light-style through the cone (the same 4×4 lattice the
   physical screen casts as shadow), and a world-Y floor fade. A second
   thin, cool counter-cone carries the ionic fill from the right. Both
   additive, depthWrite off, subtle — they never occlude the set. */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createJaliCookieTextures } from '../../lib/three/materials';
import { FILL_POS, KEY_POS, KEY_TGT } from '../../lib/three/rig';
import { REDUCED } from '../../lib/store';

const VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vLocal;
varying float vWorldY;
varying float vSoft;
void main() {
  vUv = uv;
  vLocal = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldY = world.y;
  vec3 n = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 v = normalize(-mv.xyz);
  // fresnel: soft at the silhouette, brightest through the body
  vSoft = pow(abs(dot(n, v)), 1.4);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
uniform float uPeak;
uniform float uApexY;
uniform float uLen;
uniform float uRadius;
uniform sampler2D uCookieSharp;
uniform sampler2D uCookieSoft;
uniform float uScreenY;
uniform vec2 uScreenXZ;
uniform float uScreenSize;
uniform float uUseCookie;
varying vec2 vUv;
varying vec3 vLocal;
varying float vWorldY;
varying float vSoft;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  // axial: 0 at the apex -> 1 at the base
  float axial = clamp((uApexY - vLocal.y) / uLen, 0.0, 1.0);
  // radial soft edge (cone widens linearly from the apex)
  float radial = length(vLocal.xz) / max(uRadius * axial, 1e-4);
  float edge = smoothstep(1.0, 0.55, radial);
  // axial falloff: dense at the light, dissolving toward the floor
  float fall = pow(1.0 - axial, 1.5);
  // animated fbm density
  float fbm = noise(vec2(vUv.x * 5.0, vUv.y * 2.4 - uTime * 0.06))
            * noise(vec2(vUv.x * 11.0 + 3.7, vUv.y * 5.0 - uTime * 0.11));
  fbm = 0.35 + 0.65 * fbm;

  // jali cookie: project the fragment from the apex through the screen
  // plane; the volumetric carries the lattice the geometry casts
  float cookie = 1.0;
  if (uUseCookie > 0.5) {
    float t = (uApexY - uScreenY) / max(uApexY - vLocal.y, 1e-4);
    vec3 proj = vec3(0.0, uApexY, 0.0) + (vLocal - vec3(0.0, uApexY, 0.0)) * t;
    vec2 cuv = (proj.xz - uScreenXZ) / uScreenSize + 0.5;
    float inFrame = step(0.0, cuv.x) * step(cuv.x, 1.0) * step(0.0, cuv.y) * step(cuv.y, 1.0);
    float sharp = texture2D(uCookieSharp, cuv).r;
    float soft = texture2D(uCookieSoft, cuv).r;
    cookie = mix(sharp, soft, clamp(axial * 1.4, 0.0, 1.0)) * inFrame;
    cookie = mix(0.55, 1.0, cookie); // holes dim, never go fully black
  }

  // fade out as the shaft reaches the floor
  float floorFade = smoothstep(-0.05, 0.45, vWorldY);

  float a = vSoft * edge * fall * fbm * cookie * floorFade * uPeak;
  gl_FragColor = vec4(uColor, a);
}
`;

interface ConeSpec {
  from: THREE.Vector3;
  to: THREE.Vector3;
  radius: number;
  color: number;
  peak: number;
  cookie: boolean;
}

function buildCone(spec: ConeSpec, cookies: { sharp: THREE.Texture; soft: THREE.Texture }, jaliLocal: THREE.Vector3) {
  const dir = spec.from.clone().sub(spec.to);
  const len = dir.length();
  const mid = spec.from.clone().add(spec.to).multiplyScalar(0.5);
  // cone apex is local +y: point +y from the set toward the light
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(spec.color) },
      uPeak: { value: spec.peak },
      uApexY: { value: len / 2 },
      uLen: { value: len },
      uRadius: { value: spec.radius },
      uCookieSharp: { value: cookies.sharp },
      uCookieSoft: { value: cookies.soft },
      uScreenY: { value: jaliLocal.y },
      uScreenXZ: { value: new THREE.Vector2(jaliLocal.x, jaliLocal.z) },
      uScreenSize: { value: 1.8 },
      uUseCookie: { value: spec.cookie ? 1 : 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
  const geo = new THREE.ConeGeometry(spec.radius, len, 48, 1, true);
  return { geo, mat, mid, quat };
}

export function LightShaft() {
  const cookies = useMemo(() => createJaliCookieTextures(), []);

  const { keyCone, fillCone } = useMemo(() => {
    /* the jali screen's position in key-cone-local space, so the cookie
       projects from the cone's own frame */
    const base = new THREE.Vector3(-0.25, 0.1, -0.12);
    const dir = KEY_POS.clone().sub(base);
    const mid = KEY_POS.clone().add(base).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const coneMatrix = new THREE.Matrix4().compose(mid, quat, new THREE.Vector3(1, 1, 1));
    const jaliLocal = new THREE.Vector3(-2.4, 1.25, -1.9).applyMatrix4(coneMatrix.clone().invert());

    const keyCone = buildCone(
      { from: KEY_POS, to: base, radius: 1.7, color: 0xfff3e4, peak: 0.1, cookie: true },
      cookies,
      jaliLocal,
    );
    const fillCone = buildCone(
      { from: FILL_POS, to: KEY_TGT, radius: 0.55, color: 0x2a4bff, peak: 0.07, cookie: false },
      cookies,
      jaliLocal,
    );
    return { keyCone, fillCone };
  }, [cookies]);

  useFrame((st) => {
    const t = REDUCED ? 0 : st.clock.elapsedTime;
    keyCone.mat.uniforms.uTime.value = t;
    fillCone.mat.uniforms.uTime.value = t;
  });

  return (
    <group>
      <mesh
        geometry={keyCone.geo}
        material={keyCone.mat}
        position={keyCone.mid}
        quaternion={keyCone.quat}
        renderOrder={5}
      />
      <mesh
        geometry={fillCone.geo}
        material={fillCone.mat}
        position={fillCone.mid}
        quaternion={fillCone.quat}
        renderOrder={5}
      />
    </group>
  );
}
