/* The Director: cinematography as data (SPEC §4 shot table, re-authored for
   The Substrate from the Strata table in v2/site/src/lib/director.ts).

   Six acts on one set: grazing 70mm hero dolly → rack-to-infinity statement
   → 50mm district truck → top-down transit-map crane → 85mm macro die dive
   (IHS lift) → 35mm pull-back. The pulse is the only continuous performer:
   `pulseBoost` scales the trace-pulse gain per act, never above the ≤4
   restraint gate. World anchors come from anchors.generated.ts (the Blender
   pipeline), so a re-export never strands the choreography.

   Framework-agnostic by design: scene components read fields, never DOM. */

import * as THREE from 'three'
import {
  DIE_CENTER,
  SOCKET_POS,
  SOCKET_POS_DIE,
  SURFACE_Y,
} from './anchors.generated'

export type ShotAnchor =
  | ['sec', string]
  | ['mid', string, number]
  | ['pinEnd', string]
  | ['end']

export interface Shot {
  at: ShotAnchor
  /** per-act exposure offset in stops (director gate 2026-07-27: runtime
      per-act exposure is the Director's knob, recorded here as data) */
  exp?: number
  pos: [number, number, number]
  tgt: [number, number, number]
  bloom: number
  /** aperture scale — 1 = act default, >1 = shallower focus */
  ap: number
  /** base vertical fov for the act (lens language: 70mm ≈ 20°, 35mm ≈ 38°) */
  fov: number
  /** color temperature -1 (cool) .. +1 (warm) */
  temp?: number
  /** saturation multiplier */
  sat?: number
  /** fog density for the act */
  fog?: number
  /** dutch tilt, degrees */
  roll?: number
  /** focus distance to the act's subject, world meters */
  focus?: number
  /** trace-pulse gain multiplier (restraint gate: keep ≤ 2; lanes ≤ 4 total) */
  pulse?: number
  /** vignette darkness for the act */
  vig?: number
  /** dive segment markers — exactly one of each, dive-start before dive-end */
  tag?: 'dive-start' | 'dive-end'
  p?: number
}

/* Sections the director anchors to, in document order. */
export const SECTION_IDS = [
  'hero',
  'statement',
  'work',
  'evidence',
  'about',
  'principles',
  'writing',
  'contact',
]

/* The Substrate shot table (SPEC §4). Board slab ~12×9.6 at y≈0.55–2.55;
   die set at y≈−40 under the socket (nested scale, geographically matched).
   One move per act, never two. */
export function buildShots(): Shot[] {
  const S = SOCKET_POS
  const SD = SOCKET_POS_DIE
  const DC = DIE_CENTER
  return [
    // ACT 0 — hero: grazing 70mm dolly across the slab (night flyover),
    // front edge of the component relief in focus, neutral temp +0.1
    {
      at: ['sec', 'hero'],
      pos: [8.2, 2.0, 5.4],
      tgt: [-1.2, 1.0, 0.4],
      bloom: 0.45,
      ap: 1.0,
      fov: 20,
      temp: 0.1,
      sat: 1.0,
      fog: 0.028,
      focus: 7.2,
      pulse: 1.0,
      vig: 0.72,
    },
    {
      at: ['mid', 'hero', 0.55],
      pos: [6.2, 1.7, 4.2],
      tgt: [-1.0, 0.95, 0.3],
      bloom: 0.44,
      ap: 1.0,
      fov: 20,
      temp: 0.1,
      sat: 1.0,
      fog: 0.028,
      focus: 5.8,
      pulse: 1.0,
      vig: 0.72,
    },
    // ACT 1 — statement: dolly halts, rack to infinity — the board dissolves
    // to bokeh, pulses persist as soft threads (type owns the act)
    {
      at: ['sec', 'statement'],
      pos: [6.2, 1.7, 4.2],
      tgt: [-1.0, 0.9, 0.3],
      bloom: 0.5,
      ap: 2.4,
      fov: 24,
      temp: -0.1,
      sat: 0.9,
      fog: 0.03,
      focus: 60,
      pulse: 0.8,
      vig: 0.72,
    },
    {
      at: ['pinEnd', 'statement'],
      pos: [6.2, 1.7, 4.2],
      tgt: [-1.0, 0.9, 0.3],
      bloom: 0.5,
      ap: 2.4,
      fov: 24,
      temp: -0.1,
      sat: 0.9,
      fog: 0.03,
      focus: 60,
      pulse: 0.8,
      vig: 0.72,
    },
    // ACT 2 — work: 50mm truck at capacitor-tower height through the
    // VRM/DIMM districts; three staggered pulse lanes
    {
      at: ['sec', 'work'],
      pos: [-5.4, 1.5, 4.8],
      tgt: [-0.5, 1.2, 0.0],
      bloom: 0.5,
      ap: 1.6,
      fov: 28,
      temp: 0.0,
      sat: 1.0,
      fog: 0.03,
      focus: 5.2,
      pulse: 1.3,
      vig: 0.72,
    },
    {
      at: ['mid', 'work', 0.6],
      pos: [4.6, 1.5, 4.8],
      tgt: [0.5, 1.2, 0.0],
      bloom: 0.5,
      ap: 1.6,
      fov: 28,
      temp: 0.0,
      sat: 1.0,
      fog: 0.03,
      focus: 5.2,
      pulse: 1.3,
      vig: 0.72,
    },
    // ACT 3 — evidence: crane to dead top-down; the board resolves to a
    // transit map, the socket as the central interchange
    {
      at: ['sec', 'evidence'],
      exp: 0.5,
      pos: [S[0] + 0.4, 13.5, S[2] + 0.6],
      tgt: [S[0], SURFACE_Y, S[2]],
      bloom: 0.55,
      ap: 0.9,
      fov: 26,
      temp: 0.08,
      sat: 1.05,
      fog: 0.012,
      focus: 13.0,
      pulse: 1.2,
      vig: 0.72,
    },
    // ACT 4 — about: macro approach on the socket → IHS lifts → descent
    // into the die; logic blocks wake green in sequence. Shallowest DOF,
    // vignette +10%
    {
      at: ['sec', 'about'],
      pos: [S[0] + 2.2, 2.6, S[2] + 2.4],
      tgt: [S[0], SURFACE_Y + 0.2, S[2]],
      bloom: 0.5,
      ap: 2.6,
      fov: 16,
      temp: 0.0,
      sat: 1.0,
      fog: 0.02,
      focus: 3.4,
      pulse: 0.9,
      vig: 0.79,
      tag: 'dive-start',
    },
    {
      at: ['mid', 'about', 0.7],
      pos: [S[0] + 0.15, -37.0, S[2] + 0.3],
      tgt: [DC[0], DC[1], DC[2]],
      bloom: 0.55,
      ap: 2.2,
      fov: 20,
      temp: 0.0,
      sat: 1.0,
      fog: 0.004,
      focus: 2.4,
      pulse: 0.6,
      vig: 0.79,
      tag: 'dive-end',
    },
    // ACT 4.5 — principles: rise out of the package, lateral drift bound
    // to the horizontal pin (hProgress truck in update())
    {
      at: ['sec', 'principles'],
      pos: [SD[0] + 1.5, -18, SD[2] + 5],
      tgt: [SD[0], -30, SD[2]],
      bloom: 0.5,
      ap: 1.4,
      fov: 26,
      temp: 0.0,
      sat: 1.0,
      fog: 0.01,
      focus: 12,
      pulse: 0.7,
      vig: 0.72,
    },
    {
      at: ['pinEnd', 'principles'],
      pos: [SD[0] + 1.5, -18, SD[2] + 5],
      tgt: [SD[0], -30, SD[2]],
      bloom: 0.5,
      ap: 1.4,
      fov: 26,
      temp: 0.0,
      sat: 1.0,
      fog: 0.01,
      focus: 12,
      pulse: 0.7,
      vig: 0.72,
    },
    // ACT 5 — writing: back at board scale, gentle pull-back drift
    {
      at: ['sec', 'writing'],
      pos: [3.5, 2.2, 7.0],
      tgt: [0.0, 1.0, 0.0],
      bloom: 0.5,
      ap: 1.4,
      fov: 28,
      temp: 0.05,
      sat: 1.0,
      fog: 0.024,
      focus: 7.8,
      pulse: 1.0,
      vig: 0.72,
    },
    // ACT 6 — contact: pull-back settles on the hero angle's mirror; one
    // pulse crosses edge-to-edge and every district answers (bloom lift)
    {
      at: ['sec', 'contact'],
      pos: [7.8, 4.6, 8.2],
      tgt: [0.0, 0.9, 0.0],
      bloom: 0.72,
      ap: 0.6,
      fov: 33,
      temp: 0.2,
      sat: 1.04,
      fog: 0.02,
      focus: 11.0,
      pulse: 1.6,
      vig: 0.72,
    },
    {
      at: ['end'],
      pos: [8.4, 5.0, 8.8],
      tgt: [0.0, 0.85, 0.0],
      bloom: 0.7,
      ap: 0.6,
      fov: 33,
      temp: 0.2,
      sat: 1.04,
      fog: 0.02,
      focus: 12.0,
      pulse: 1.6,
      vig: 0.72,
    },
  ]
}

export const easeIO = (x: number) => x * x * (3 - 2 * x)
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export function resolveAnchorProgress(
  at: ShotAnchor,
  P: Map<string, number>,
  pinDist: (id: string) => number,
  scrollable: number
): number {
  if (at[0] === 'end') return 1
  if (at[0] === 'sec') return P.get(at[1]) ?? 1
  if (at[0] === 'pinEnd') {
    return clamp01((P.get(at[1]) ?? 1) + pinDist(at[1]) / scrollable)
  }
  const a = P.get(at[1]) ?? 0
  const ids = Array.from(P.keys())
  const i = ids.indexOf(at[1])
  const next = i >= 0 && i + 1 < ids.length ? (P.get(ids[i + 1]!) ?? 1) : 1
  return a + (next - a) * at[2]
}

export interface SampleResult {
  pos: [number, number, number]
  tgt: [number, number, number]
  bloom: number
  ap: number
  fov: number
  temp: number
  exp: number
  sat: number
  fog: number
  roll: number
  focus: number
  pulse: number
  vig: number
  i: number
}

/* Sample the key table at scroll progress p. Between dive-start and
   dive-end the xz channels ease fast (converge on the socket column) while
   y eases late (drop through the open socket) — the camera never clips the
   plinth. Everywhere else, uniform easeIO. */
export function sampleKeys(
  keys: (Shot & { p: number })[],
  p: number
): SampleResult {
  const K = keys
  let i = 0
  while (i < K.length - 2 && p > K[i + 1]!.p) i++
  const a = K[i]!
  const b = K[i + 1]!
  const raw = clamp01((p - a.p) / Math.max(1e-5, b.p - a.p))
  const dive = b.tag === 'dive-end'
  const t = easeIO(raw)
  const txz = dive ? easeIO(raw ** 0.5) : t
  const ty = dive ? easeIO(raw ** 4.0) : t
  const L = THREE.MathUtils.lerp
  return {
    pos: [
      L(a.pos[0], b.pos[0], txz),
      L(a.pos[1], b.pos[1], ty),
      L(a.pos[2], b.pos[2], txz),
    ],
    tgt: [
      L(a.tgt[0], b.tgt[0], txz),
      L(a.tgt[1], b.tgt[1], ty),
      L(a.tgt[2], b.tgt[2], txz),
    ],
    bloom: L(a.bloom, b.bloom, t),
    ap: L(a.ap, b.ap, t),
    fov: L(a.fov, b.fov, t),
    temp: L(a.temp ?? 0, b.temp ?? 0, t),
    exp: L(a.exp ?? 0, b.exp ?? 0, t),
    sat: L(a.sat ?? 1, b.sat ?? 1, t),
    fog: L(a.fog ?? 0.03, b.fog ?? 0.03, t),
    roll: L(a.roll ?? 0, b.roll ?? 0, t),
    focus: L(a.focus ?? 10, b.focus ?? 10, t),
    pulse: L(a.pulse ?? 1, b.pulse ?? 1, t),
    vig: L(a.vig ?? 0.72, b.vig ?? 0.72, t),
    i,
  }
}

const _up = new THREE.Vector3(0, 1, 0)
const _off = new THREE.Vector3()
const _right = new THREE.Vector3()
const _poff = new THREE.Vector3()

export class Director {
  keys: (Shot & { p: number })[] = []

  /** principles horizontal pin progress 0..1 — written by choreography.ts */
  hProgress = 0
  /** 0..1 through the Act-5 dive — DieDive + TransitionParticles read this */
  diveT = 0

  private prinWin: [number, number] = [-1, -1]
  private focusPull = 0
  private actIdx = -1

  readonly shot: SampleResult = {
    pos: [8.2, 2.0, 5.4],
    tgt: [-1.2, 1.0, 0.4],
    bloom: 0.45,
    exp: 0,
    ap: 1,
    fov: 20,
    temp: 0.1,
    sat: 1,
    fog: 0.028,
    roll: 0,
    focus: 7.2,
    pulse: 1,
    vig: 0.72,
    i: 0,
  }

  /* spring-smoothed camera state */
  readonly pos = new THREE.Vector3(8.2, 2.4, 7.4)
  readonly tgt = new THREE.Vector3(-1.2, 1.0, 0.4)
  readonly look = new THREE.Vector3()

  bloom = 0.45
  aperture = 1
  /** 0..1 speed-ramp intensity, from smoothed scroll velocity */
  ramp = 0
  focusDist = 7.2
  temp = 0.1
  /** per-act exposure offset (stops), lerped from the shot table */
  exp = 0
  sat = 1.0
  fogDensity = 0.028
  roll = 0
  pulseBoost = 1
  vignette = 0.72
  fov = 20

  private introT = 0
  private ptr = { x: 0, y: 0, sx: 0, sy: 0 }

  constructor(reduced: boolean) {
    if (reduced) this.introT = 1
  }

  /** Resolve section ids to scroll progress. Call on mount, resize,
      ScrollTrigger refresh, and fonts.ready. */
  buildKeys() {
    const scrollable = Math.max(1, document.body.scrollHeight - innerHeight)
    const P = new Map<string, number>()
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id)
      if (!el) return // not the landing page — keep previous keys
      const top = el.getBoundingClientRect().top + (window.scrollY || 0)
      P.set(id, clamp01(top / scrollable))
    }
    const pinDist = (id: string): number => {
      if (id === 'statement') return 1.3 * innerHeight
      if (id === 'principles') {
        const track = document.querySelector<HTMLElement>('[data-track]')
        return track ? Math.max(0, track.scrollWidth - innerWidth) : 0
      }
      return 0
    }
    this.keys = buildShots().map((s) => ({
      ...s,
      p: resolveAnchorProgress(s.at, P, pinDist, scrollable),
    }))
    this.keys.sort((x, y) => x.p - y.p)
    const p0 = P.get('principles')
    if (p0 !== undefined) {
      this.prinWin = [p0, clamp01(p0 + pinDist('principles') / scrollable)]
    }
  }

  setPointer(x: number, y: number) {
    this.ptr.x = x
    this.ptr.y = y
  }

  /** Advance springs; apply to camera. Read fields after calling. */
  update(
    camera: THREE.PerspectiveCamera,
    p: number,
    v: number,
    dt: number,
    t: number,
    reduced: boolean
  ) {
    if (!this.keys.length) return
    const s = sampleKeys(this.keys, p)
    this.shot.pos = s.pos
    this.shot.tgt = s.tgt
    this.shot.bloom = s.bloom
    this.shot.ap = s.ap
    this.shot.fov = s.fov
    this.shot.temp = s.temp
    this.shot.exp = s.exp
    this.shot.sat = s.sat
    this.shot.fog = s.fog
    this.shot.roll = s.roll
    this.shot.focus = s.focus
    this.shot.pulse = s.pulse
    this.shot.vig = s.vig

    if (s.i !== this.actIdx) {
      this.actIdx = s.i
      this.focusPull = 1
    }
    this.focusPull = Math.max(0, this.focusPull - dt / 0.8)

    const diveStart = this.keys.find((k) => k.tag === 'dive-start')
    const diveEnd = this.keys.find((k) => k.tag === 'dive-end')
    this.diveT =
      diveStart && diveEnd && diveEnd.p > diveStart.p
        ? clamp01((p - diveStart.p) / (diveEnd.p - diveStart.p))
        : 0

    // ACT 0 intro: slow 6s dolly-in (SPEC §4: 6s then breathing drift)
    const shotPos = new THREE.Vector3(...s.pos)
    if (this.introT < 1) {
      this.introT = Math.min(1, this.introT + dt / 6)
      const k = 1 - easeIO(this.introT)
      shotPos.z += k * 1.6
      shotPos.y += k * 0.3
    }

    // principles truck (bound to the horizontal pin progress)
    const [w0, w1] = this.prinWin
    if (w1 > w0 && p >= w0 - 1e-4 && typeof document !== 'undefined') {
      const scrollable = Math.max(1, document.body.scrollHeight - innerHeight)
      const out =
        p <= w1
          ? 1
          : 1 -
            clamp01((p - w1) / Math.max(1e-5, (0.6 * innerHeight) / scrollable))
      if (out > 0) {
        shotPos.x += this.hProgress * 2.2 * out
        shotPos.y += Math.sin(this.hProgress * Math.PI) * 0.18 * out
      }
    }

    // portrait re-frame: distance ×1.6
    const portrait = camera.aspect < 1
    if (portrait) {
      const tg = new THREE.Vector3(...s.tgt)
      _poff.copy(shotPos).sub(tg)
      shotPos.copy(tg).addScaledVector(_poff, 1.6)
    }

    // critically-damped chase (stiffness ~4.5): always arrives, never oscillates
    const kPos = reduced ? 1 : 1 - Math.exp(-dt * 4.5)
    const kTgt = reduced ? 1 : 1 - Math.exp(-dt * 5.4)
    this.pos.lerp(shotPos, kPos)
    this.tgt.lerp(new THREE.Vector3(...s.tgt), kTgt)

    // pointer parallax with inertia
    const kPtr = 1 - Math.exp(-dt * 2.6)
    this.ptr.sx += (this.ptr.x - this.ptr.sx) * kPtr
    this.ptr.sy += (this.ptr.y - this.ptr.sy) * kPtr

    // speed ramp: smoothed |velocity| -> 0..1
    const target = reduced ? 0 : clamp01(Math.abs(v) / 55)
    this.ramp += (target - this.ramp) * (1 - Math.exp(-dt * 5))

    // breathing micro-drift so held shots never freeze (±~3cm)
    const dx = reduced
      ? 0
      : Math.sin(t * 0.31) * 0.024 + Math.sin(t * 0.83) * 0.01
    const dy = reduced
      ? 0
      : Math.cos(t * 0.27) * 0.016 + Math.sin(t * 0.63) * 0.008

    // orbit the target by pointer — ±0.15 rad yaw, tight pitch
    this.look.copy(this.tgt)
    _off.copy(this.pos).sub(this.look)
    _off.applyAxisAngle(_up, -this.ptr.sx * 0.15)
    _right.crossVectors(_off, _up).normalize()
    if (_right.lengthSq() > 1e-6)
      _off.applyAxisAngle(_right, this.ptr.sy * 0.06)
    camera.position.copy(this.look).add(_off)
    camera.position.x += dx
    camera.position.y += dy
    camera.lookAt(this.look)

    // dutch tilt — slow spring so it reads as intention, not wobble
    this.roll += (s.roll - this.roll) * (1 - Math.exp(-dt * 2.2))
    camera.rotateZ(THREE.MathUtils.degToRad(this.roll))

    // grade springs
    const kG = 1 - Math.exp(-dt * 2.8)
    this.temp += (s.temp - this.temp) * kG
    this.exp += (s.exp - this.exp) * kG
    this.sat += (s.sat - this.sat) * kG
    this.fogDensity += (s.fog - this.fogDensity) * kG
    this.vignette += (s.vig - this.vignette) * kG
    this.fov += (s.fov - this.fov) * kG

    // FOV: shot base + speed-ramp kick ±2° + portrait +4°
    const fovNow = this.fov + this.ramp * 2 + (portrait ? 4 : 0)
    if (Math.abs(camera.fov - fovNow) > 0.01) {
      camera.fov = fovNow
      camera.updateProjectionMatrix()
    }

    this.bloom += (s.bloom - this.bloom) * (1 - Math.exp(-dt * 3))
    this.pulseBoost += (s.pulse - this.pulseBoost) * kG
    this.aperture = s.ap * (1 + this.ramp * 0.6)
    this.focusDist +=
      (s.focus - this.focusDist) *
      (1 - Math.exp(-dt * (2.2 + this.focusPull * 5.8)))
  }
}
