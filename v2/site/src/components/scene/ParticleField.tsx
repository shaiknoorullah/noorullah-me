/* Particle atmosphere (DESIGN.md §10.4): ~6,000 points in three depth
   strata, one custom ShaderMaterial each (shared GLSL). Far field (4000,
   dim, slow, deep), mid field (1800), and ~60 near bokeh motes hugging the
   camera path. Drift is layered sines, twinkle is phase sin, brightness is
   boosted inside the key-light cone, depth fades both ends. 95% bone-white,
   5% signal green. Low tier: halved counts, near stratum dropped. */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { KEY_POS, KEY_TGT, SIGNAL } from '../../lib/three/rig';
import { quality, REDUCED } from '../../lib/store';

const VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
attribute float aTint;
uniform float uTime;
uniform float uSizeScale;
varying float vTint;
varying float vTwinkle;
varying vec3 vWorld;
varying float vDist;
void main() {
  vec3 p = position;
  float t = uTime * aSpeed;
  // layered-sine drift: three decorrelated waves, cheap curl
  p.x += sin(t * 0.31 + aPhase) * 0.35 + sin(t * 0.83 + aPhase * 1.7) * 0.12;
  p.y += sin(t * 0.23 + aPhase * 2.1) * 0.22 + sin(t * 0.11 + aPhase) * 0.08;
  p.z += cos(t * 0.27 + aPhase * 1.3) * 0.35;
  vTwinkle = 0.7 + 0.3 * sin(uTime * (0.6 + aSpeed) + aPhase * 3.0);
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vec4 mv = viewMatrix * world;
  vDist = -mv.z;
  gl_PointSize = aSize * uSizeScale / max(-mv.z, 0.001);
  vTint = aTint;
  gl_Position = projectionMatrix * mv;
}
`;

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
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  float disc = smoothstep(1.0, 0.15, r);
  // brightness boost inside the key cone
  vec3 rel = vWorld - uConeOrigin;
  float d = length(rel);
  float cone = smoothstep(uConeCos, min(uConeCos + 0.06, 1.0), dot(rel / max(d, 1e-4), uConeAxis))
             * (1.0 - smoothstep(uConeLen * 0.6, uConeLen, d));
  // depth fade both ends
  float fade = smoothstep(0.25, 1.1, vDist) * (1.0 - smoothstep(22.0, 32.0, vDist));
  vec3 col = mix(uBone, uSignal, vTint);
  float a = disc * uOpacity * vTwinkle * fade * (1.0 + cone * 1.6);
  gl_FragColor = vec4(col, a);
}
`;

interface StratumCfg {
  count: number;
  box: [number, number, number];
  center: [number, number, number];
  sizeMin: number;
  sizeMax: number;
  opacity: number;
  speedMax: number;
}

function buildStratum(cfg: StratumCfg) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(cfg.count * 3);
  const size = new Float32Array(cfg.count);
  const phase = new Float32Array(cfg.count);
  const speed = new Float32Array(cfg.count);
  const tint = new Float32Array(cfg.count);
  for (let i = 0; i < cfg.count; i++) {
    pos[i * 3] = cfg.center[0] + (Math.random() - 0.5) * cfg.box[0];
    pos[i * 3 + 1] = cfg.center[1] + (Math.random() - 0.5) * cfg.box[1];
    pos[i * 3 + 2] = cfg.center[2] + (Math.random() - 0.5) * cfg.box[2];
    size[i] = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
    phase[i] = Math.random() * Math.PI * 2;
    speed[i] = 0.15 + Math.random() * cfg.speedMax;
    tint[i] = Math.random() < 0.05 ? 1 : 0; // 95% bone, 5% signal
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));

  const coneAxis = KEY_TGT.clone().sub(KEY_POS).normalize();
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSizeScale: { value: 600 },
      uOpacity: { value: cfg.opacity },
      uBone: { value: new THREE.Color(0xf2f2f5) },
      uSignal: { value: new THREE.Color(SIGNAL) },
      uConeOrigin: { value: KEY_POS.clone() },
      uConeAxis: { value: coneAxis },
      uConeCos: { value: Math.cos(0.6) },
      uConeLen: { value: KEY_POS.distanceTo(KEY_TGT) },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
  return { geo, mat };
}

export function ParticleField() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const low = quality.tier === 'low';

  const strata = useMemo(() => {
    const far = buildStratum({
      count: low ? 2000 : 4000,
      box: [30, 12, 30],
      center: [0, 4, -6],
      sizeMin: 0.012,
      sizeMax: 0.03,
      opacity: 0.22,
      speedMax: 0.35,
    });
    const mid = buildStratum({
      count: low ? 900 : 1800,
      box: [16, 8, 16],
      center: [0, 2.5, -1],
      sizeMin: 0.02,
      sizeMax: 0.05,
      opacity: 0.38,
      speedMax: 0.55,
    });
    const near = low
      ? null
      : buildStratum({
          count: 60,
          box: [8, 4, 8],
          center: [1.2, 2.8, 4.2],
          sizeMin: 0.3,
          sizeMax: 0.8,
          opacity: 0.075,
          speedMax: 0.25,
        });
    return [far, mid, near].filter((s): s is NonNullable<typeof s> => s !== null);
  }, [low]);

  useFrame((st) => {
    // world size -> device px: scale = (bufferHeight / 2) * proj[1][1]
    const scale =
      (gl.getDrawingBufferSize(new THREE.Vector2()).y / 2) * camera.projectionMatrix.elements[5];
    for (const s of strata) {
      s.mat.uniforms.uTime.value = REDUCED ? 0 : st.clock.elapsedTime;
      s.mat.uniforms.uSizeScale.value = scale;
    }
  });

  return (
    <group>
      {strata.map((s, i) => (
        <points key={i} geometry={s.geo} material={s.mat} frustumCulled={false} />
      ))}
    </group>
  );
}
