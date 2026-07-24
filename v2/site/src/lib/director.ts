/* The Director: cinematography as data (DESIGN.md §10.2 shot table).
   Shot keyframes are anchored to real DOM section ids at runtime — in the
   PINNED layout, so acts land where the sections actually arrive — resolved
   to scroll progress, sampled with smoothstep, then chased by critically-
   damped springs. Scroll velocity drives the speed ramp (FOV kick, CA/grain
   scale, aperture). Pointer parallax orbits the target. Portrait aspects
   (aspect < 1) get an aspect-aware re-frame: distance ×1.6, FOV +4, and a
   composition shift that keeps the stack right-of-center (R1/R8) — one
   transform in the director, not separate shot tables.

   This module is deliberately framework-agnostic: it is the adapter seam
   where a Theatre.js sequence could replace the shot table without touching
   the scene components. */

import * as THREE from 'three';

type ShotAnchor = ['sec', string] | ['mid', string, number] | ['pinEnd', string] | ['end'];

interface Shot {
  at: ShotAnchor;
  pos: [number, number, number];
  tgt: [number, number, number];
  bloom: number;
  /** aperture scale — 1 = act default, >1 = shallower focus */
  ap: number;
  /** color temperature -1 (cool) .. +1 (warm) */
  temp?: number;
  /** saturation multiplier */
  sat?: number;
  /** fog density for the act */
  fog?: number;
  /** dutch tilt, degrees */
  roll?: number;
  /** focus distance to the act's subject, world meters */
  focus?: number;
  /** emissive cube brightness multiplier (the contact act keeps the light on) */
  cube?: number;
  /** vignette darkness for the act */
  vig?: number;
  p?: number;
}

/* Sections the director anchors to, in document order. `mid` anchors
   interpolate between a section and the next one in this list. `pinEnd`
   anchors resolve to where a section's pin releases (statement, principles)
   — used to hold a shot steady through a pin so pins own their scrub. */
const SECTION_IDS = ['hero', 'statement', 'work', 'evidence', 'about', 'principles', 'writing', 'contact'];

/* The Strata set (Y-up GLB space): stack centre (-0.25, 1.26, -0.12),
   plinth top y=0.35, chrome sphere (0.85, 0.54, 0.42), jali screen
   (-2.4, 1.25, -1.9). Composition anchors are the §10.2 preview cameras:
   front34 = pos(4.6, 2.4, 5.2)->tgt(-0.2, 1.25, -0.1), high = pos(1.2,
   5.6, 1.2)->tgt(-0.25, 1.1, -0.1). One move per act, never two. */
const SHOTS: Shot[] = [
  // ACT 0 — hero: the front34 framing, slow dolly toward (3.4, 2.0, 4.0)
  { at: ['sec', 'hero'], pos: [4.6, 2.4, 5.2], tgt: [-0.2, 1.25, -0.1], bloom: 0.5, ap: 1.0, temp: 0.05, sat: 1.0, fog: 0.024, roll: 0, focus: 7.2, cube: 1.0, vig: 0.72 },
  { at: ['mid', 'hero', 0.55], pos: [3.4, 2.0, 4.0], tgt: [-0.2, 1.2, -0.1], bloom: 0.48, ap: 1.0, temp: 0.03, sat: 1.0, fog: 0.026, roll: 0, focus: 5.9, cube: 1.0, vig: 0.72 },
  // ACT 1 — statement: rise 0.8m, rack focus to the SDF text plane at 3.0m
  { at: ['sec', 'statement'], pos: [3.4, 2.8, 4.0], tgt: [-0.25, 1.0, -0.12], bloom: 0.42, ap: 1.0, temp: -0.1, sat: 0.9, fog: 0.03, roll: 0.3, focus: 3.0, cube: 1.0, vig: 0.72 },
  { at: ['pinEnd', 'statement'], pos: [3.4, 2.8, 4.0], tgt: [-0.25, 1.0, -0.12], bloom: 0.42, ap: 1.0, temp: -0.1, sat: 0.9, fog: 0.03, roll: 0.3, focus: 3.0, cube: 1.0, vig: 0.72 },
  // ACT 2 — work: lateral truck x -2.5 -> +2.5 at y 1.5, tracking the stack
  { at: ['sec', 'work'], pos: [-2.75, 1.55, 5.8], tgt: [-0.25, 1.26, -0.12], bloom: 0.52, ap: 1.6, temp: 0.0, sat: 1.0, fog: 0.026, roll: 0, focus: 6.6, cube: 1.0, vig: 0.72 },
  { at: ['mid', 'work', 0.6], pos: [2.25, 1.55, 5.8], tgt: [-0.25, 1.26, -0.12], bloom: 0.52, ap: 1.6, temp: 0.0, sat: 1.0, fog: 0.026, roll: 0, focus: 6.6, cube: 1.0, vig: 0.72 },
  // ACT 3 — evidence: crane to the top-down lattice payoff (high framing)
  { at: ['sec', 'evidence'], pos: [1.2, 5.6, 1.2], tgt: [-0.25, 1.1, -0.1], bloom: 0.58, ap: 0.9, temp: 0.08, sat: 1.05, fog: 0.022, roll: 0, focus: 4.9, cube: 1.05, vig: 0.72 },
  // ACT 4 — about: macro toward the chrome sphere, shallowest DOF (R6: wide of v1.0's too-tight block)
  { at: ['sec', 'about'], pos: [2.5, 1.1, 2.3], tgt: [0.85, 0.54, 0.42], bloom: 0.5, ap: 2.0, temp: 0.0, sat: 1.0, fog: 0.03, roll: 0, focus: 2.4, cube: 1.0, vig: 0.79 },
  // ACT 4.5 — principles: lateral truck + y-drift bound to hProgress (R5).
  // The shot itself holds through the pin; the truck is applied in update().
  { at: ['sec', 'principles'], pos: [1.4, 1.7, 5.2], tgt: [-0.25, 1.15, -0.1], bloom: 0.5, ap: 1.2, temp: 0.0, sat: 1.0, fog: 0.026, roll: 0, focus: 5.4, cube: 1.0, vig: 0.72 },
  { at: ['pinEnd', 'principles'], pos: [1.4, 1.7, 5.2], tgt: [-0.25, 1.15, -0.1], bloom: 0.5, ap: 1.2, temp: 0.0, sat: 1.0, fog: 0.026, roll: 0, focus: 5.4, cube: 1.0, vig: 0.72 },
  // ACT 5 — writing: gentle pull-back drift
  { at: ['sec', 'writing'], pos: [0.6, 1.5, 6.2], tgt: [-0.2, 1.15, -0.1], bloom: 0.5, ap: 1.4, temp: 0.0, sat: 1.0, fog: 0.024, roll: 0, focus: 6.3, cube: 1.0, vig: 0.72 },
  // ACT 6 — contact: wide master pull-back; the light stays on (+40% cube)
  { at: ['sec', 'contact'], pos: [5.4, 3.2, 6.4], tgt: [-0.2, 1.1, -0.1], bloom: 0.72, ap: 0.6, temp: 0.2, sat: 1.04, fog: 0.02, roll: 0, focus: 8.8, cube: 1.4, vig: 0.72 },
  { at: ['end'], pos: [5.8, 3.5, 6.9], tgt: [-0.2, 1.05, -0.1], bloom: 0.7, ap: 0.6, temp: 0.2, sat: 1.04, fog: 0.02, roll: 0, focus: 9.4, cube: 1.4, vig: 0.72 },
];

const easeIO = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const _up = new THREE.Vector3(0, 1, 0);
const _off = new THREE.Vector3();
const _right = new THREE.Vector3();
const _poff = new THREE.Vector3();

export class Director {
  private keys: Required<Shot>[] = [];

  /** principles horizontal pin progress 0..1 — written by choreography.ts */
  hProgress = 0;
  /** scroll window of the principles pin (progress units), for the truck */
  private prinWin: [number, number] = [-1, -1];
  /** 0..1 boost on act entry — the focus puller snaps, then settles (§10.5) */
  private focusPull = 0;
  private actIdx = -1;

  readonly shot = {
    pos: new THREE.Vector3(4.6, 2.4, 5.2),
    tgt: new THREE.Vector3(-0.2, 1.25, -0.1),
    bloom: 0.5,
    ap: 1,
    temp: 0.05,
    sat: 1,
    fog: 0.024,
    roll: 0,
    focus: 7.2,
    cube: 1,
    vig: 0.72,
  };

  /* spring-smoothed camera state */
  readonly pos = new THREE.Vector3(4.6, 2.75, 7.2);
  readonly tgt = new THREE.Vector3(-0.2, 1.2, -0.1);
  readonly look = new THREE.Vector3();

  bloom = 0.5;
  aperture = 1;
  /** 0..1 speed-ramp intensity, from smoothed scroll velocity */
  ramp = 0;
  focusDist = 7.2;
  /* per-act grade, spring-smoothed */
  temp = 0.05;
  sat = 1.0;
  fogDensity = 0.024;
  roll = 0;
  cubeBoost = 1;
  vignette = 0.72;

  private introT = 0;
  private ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  private drift = 0;

  constructor(reduced: boolean) {
    if (reduced) this.introT = 1;
  }

  /** Resolve section ids to scroll progress in the PINNED layout (call from
      ScrollTrigger's `refresh` event, after spacers are applied), on mount,
      on resize, and on fonts.ready. */
  buildKeys() {
    const scrollable = Math.max(1, document.body.scrollHeight - innerHeight);
    const P = new Map<string, number>();
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (!el) return; // not the landing page — keep previous keys
      const top = el.getBoundingClientRect().top + (window.scrollY || 0);
      P.set(id, clamp01(top / scrollable));
    }
    const nextOf = (id: string) => {
      const i = SECTION_IDS.indexOf(id);
      return i >= 0 && i + 1 < SECTION_IDS.length ? P.get(SECTION_IDS[i + 1])! : 1;
    };
    /* pin distances: statement scrubs +=130%; principles trucks its track */
    const pinDist = (id: string): number => {
      if (id === 'statement') return 1.3 * innerHeight;
      if (id === 'principles') {
        const track = document.querySelector<HTMLElement>('[data-track]');
        return track ? Math.max(0, track.scrollWidth - innerWidth) : 0;
      }
      return 0;
    };
    const resolve = (at: ShotAnchor): number => {
      if (at[0] === 'end') return 1;
      if (at[0] === 'sec') return P.get(at[1]) ?? 1;
      if (at[0] === 'pinEnd') return clamp01((P.get(at[1]) ?? 1) + pinDist(at[1]) / scrollable);
      const a = P.get(at[1]) ?? 0;
      return a + (nextOf(at[1]) - a) * at[2];
    };
    this.keys = SHOTS.map((s) => ({ ...s, p: resolve(s.at) })) as Required<Shot>[];
    this.keys.sort((a, b) => a.p - b.p);
    const p0 = P.get('principles');
    if (p0 !== undefined) this.prinWin = [p0, clamp01(p0 + pinDist('principles') / scrollable)];
  }

  setPointer(x: number, y: number) {
    this.ptr.x = x;
    this.ptr.y = y;
  }

  private sample(p: number): number {
    const K = this.keys;
    if (!K.length) return -1;
    let i = 0;
    while (i < K.length - 2 && p > K[i + 1].p) i++;
    const a = K[i];
    const b = K[i + 1];
    const t = easeIO(clamp01((p - a.p) / Math.max(1e-5, b.p - a.p)));
    this.shot.pos.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], t),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], t),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], t),
    );
    this.shot.tgt.set(
      THREE.MathUtils.lerp(a.tgt[0], b.tgt[0], t),
      THREE.MathUtils.lerp(a.tgt[1], b.tgt[1], t),
      THREE.MathUtils.lerp(a.tgt[2], b.tgt[2], t),
    );
    this.shot.bloom = THREE.MathUtils.lerp(a.bloom, b.bloom, t);
    this.shot.ap = THREE.MathUtils.lerp(a.ap, b.ap, t);
    this.shot.temp = THREE.MathUtils.lerp(a.temp ?? 0, b.temp ?? 0, t);
    this.shot.sat = THREE.MathUtils.lerp(a.sat ?? 1, b.sat ?? 1, t);
    this.shot.fog = THREE.MathUtils.lerp(a.fog ?? 0.03, b.fog ?? 0.03, t);
    this.shot.roll = THREE.MathUtils.lerp(a.roll ?? 0, b.roll ?? 0, t);
    this.shot.focus = THREE.MathUtils.lerp(a.focus ?? 10, b.focus ?? 10, t);
    this.shot.cube = THREE.MathUtils.lerp(a.cube ?? 1, b.cube ?? 1, t);
    this.shot.vig = THREE.MathUtils.lerp(a.vig ?? 0.72, b.vig ?? 0.72, t);
    return i;
  }

  /** Advance springs; apply to camera. Returns nothing — read fields. */
  update(camera: THREE.PerspectiveCamera, p: number, v: number, dt: number, t: number, reduced: boolean) {
    const idx = this.sample(p);
    // act changed: the focus puller snaps toward the new subject (§10.5)
    if (idx >= 0 && idx !== this.actIdx) {
      this.actIdx = idx;
      this.focusPull = 1;
    }
    this.focusPull = Math.max(0, this.focusPull - dt / 0.8);

    // ACT 0 intro: slow 6s dolly-in from 2m out
    if (this.introT < 1) {
      this.introT = Math.min(1, this.introT + dt / 6);
      const k = 1 - easeIO(this.introT);
      this.shot.pos.z += k * 2.0;
      this.shot.pos.y += k * 0.35;
    }

    // principles act (R5): lateral truck + y-drift bound to the horizontal
    // pin progress. Monotonic 0 -> +2.2m across the pin, faded out just
    // after release so the writing drift takes over without a pop.
    const [w0, w1] = this.prinWin;
    if (w1 > w0 && p >= w0 - 1e-4) {
      const out = p <= w1 ? 1 : 1 - clamp01((p - w1) / Math.max(1e-5, (0.6 * innerHeight) / Math.max(1, document.body.scrollHeight - innerHeight)));
      if (out > 0) {
        const hp = this.hProgress;
        this.shot.pos.x += hp * 2.2 * out;
        this.shot.pos.y += Math.sin(hp * Math.PI) * 0.18 * out;
        this.shot.tgt.x += hp * 1.1 * out;
      }
    }

    // portrait re-frame (R1/R8): distance ×1.6 so the stack stops swallowing
    // the frame; composition shifts the stack right-of-center below.
    const portrait = camera.aspect < 1;
    if (portrait) {
      _poff.copy(this.shot.pos).sub(this.shot.tgt);
      this.shot.pos.copy(this.shot.tgt).addScaledVector(_poff, 1.6);
    }

    // critically-damped chase (stiffness ~4.5): always arrives, never oscillates
    const kPos = reduced ? 1 : 1 - Math.exp(-dt * 4.5);
    const kTgt = reduced ? 1 : 1 - Math.exp(-dt * 5.4);
    this.pos.lerp(this.shot.pos, kPos);
    this.tgt.lerp(this.shot.tgt, kTgt);

    // pointer parallax with inertia
    const kPtr = 1 - Math.exp(-dt * 2.6);
    this.ptr.sx += (this.ptr.x - this.ptr.sx) * kPtr;
    this.ptr.sy += (this.ptr.y - this.ptr.sy) * kPtr;

    // speed ramp: smoothed |velocity| -> 0..1
    const target = reduced ? 0 : clamp01(Math.abs(v) / 55);
    this.ramp += (target - this.ramp) * (1 - Math.exp(-dt * 5));

    // breathing micro-drift so held shots never freeze (±~3cm)
    this.drift = t;
    const dx = reduced ? 0 : Math.sin(t * 0.31) * 0.024 + Math.sin(t * 0.83) * 0.01;
    const dy = reduced ? 0 : Math.cos(t * 0.27) * 0.016 + Math.sin(t * 0.63) * 0.008;

    // orbit the target by pointer — ±0.15 rad max yaw, tight pitch
    this.look.copy(this.tgt);
    _off.copy(this.pos).sub(this.look);
    _off.applyAxisAngle(_up, -this.ptr.sx * 0.15);
    _right.crossVectors(_off, _up).normalize();
    if (_right.lengthSq() > 1e-6) _off.applyAxisAngle(_right, this.ptr.sy * 0.06);
    camera.position.copy(this.look).add(_off);
    camera.position.x += dx;
    camera.position.y += dy;
    camera.lookAt(this.look);

    // portrait: yaw the frame left so the stack sits right-of-center — the
    // text column owns the left/top of the frame (R1/R8)
    if (portrait) {
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const halfW = halfH * camera.aspect;
      camera.rotateY(Math.atan(0.55 * halfW));
    }

    // dutch tilt — slow spring so it reads as intention, not wobble
    this.roll += (this.shot.roll - this.roll) * (1 - Math.exp(-dt * 2.2));
    camera.rotateZ(THREE.MathUtils.degToRad(this.roll));

    // grade springs
    const kG = 1 - Math.exp(-dt * 2.8);
    this.temp += (this.shot.temp - this.temp) * kG;
    this.sat += (this.shot.sat - this.sat) * kG;
    this.fogDensity += (this.shot.fog - this.fogDensity) * kG;
    this.vignette += (this.shot.vig - this.vignette) * kG;

    // FOV kick on speed ramps — ±2°; portrait adds +4° (R1)
    const fov = 26 + this.ramp * 2 + (portrait ? 4 : 0);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    this.bloom += (this.shot.bloom - this.bloom) * (1 - Math.exp(-dt * 3));
    this.cubeBoost += (this.shot.cube - this.cubeBoost) * kG;
    this.aperture = this.shot.ap * (1 + this.ramp * 0.6);
    // authored focus pull — snaps on act entry, settles over 0.8s
    this.focusDist += (this.shot.focus - this.focusDist) * (1 - Math.exp(-dt * (2.2 + this.focusPull * 5.8)));
  }
}
