import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { SOCKET_POS } from '../lib/scene/anchors.generated'
import {
  buildShots,
  clamp01,
  Director,
  easeIO,
  resolveAnchorProgress,
  sampleKeys,
} from '../lib/scene/director'

type ResolvedShot = ReturnType<typeof buildShots>[number] & { p: number }

function keys(): ResolvedShot[] {
  const P = new Map([
    ['hero', 0],
    ['statement', 0.15],
    ['work', 0.3],
    ['evidence', 0.45],
    ['about', 0.6],
    ['principles', 0.75],
    ['writing', 0.85],
    ['contact', 0.95],
  ])
  const scrollable = 8000
  const pinDist = () => 0
  return buildShots()
    .map((s) => ({
      ...s,
      p: resolveAnchorProgress(s.at, P, pinDist, scrollable),
    }))
    .sort((a, b) => a.p - b.p)
}

describe('anchors', () => {
  it('resolves section/mid/end anchors to scroll progress', () => {
    const P = new Map([
      ['hero', 0],
      ['work', 0.4],
    ])
    const pinDist = () => 0
    expect(resolveAnchorProgress(['sec', 'work'], P, pinDist, 8000)).toBe(0.4)
    expect(resolveAnchorProgress(['mid', 'hero', 0.5], P, pinDist, 8000)).toBe(
      0.2
    )
    expect(resolveAnchorProgress(['end'], P, pinDist, 8000)).toBe(1)
  })

  it('pinEnd adds the pin distance', () => {
    const P = new Map([['statement', 0.15]])
    const pinDist = (id: string) => (id === 'statement' ? 1600 : 0)
    const p = resolveAnchorProgress(['pinEnd', 'statement'], P, pinDist, 8000)
    expect(p).toBeCloseTo(0.35, 5)
  })
})

describe('shot table (SPEC §4)', () => {
  it('has one dive-start and one dive-end tag, in order', () => {
    const shots = buildShots()
    const starts = shots.filter((s) => s.tag === 'dive-start')
    const ends = shots.filter((s) => s.tag === 'dive-end')
    expect(starts).toHaveLength(1)
    expect(ends).toHaveLength(1)
    expect(shots.indexOf(starts[0]!)).toBeLessThan(shots.indexOf(ends[0]!))
  })

  it('dive segment: camera is above the relief until it is over the socket', () => {
    const k = keys()
    const start = k.findIndex((s) => s.tag === 'dive-start')
    const end = k.findIndex((s) => s.tag === 'dive-end')
    const p0 = k[start]!.p
    const p1 = k[end]!.p
    // ordering property: at every sample, either the camera is still above
    // the board's max relief (~2.55) or it has converged onto the socket
    // column (so what it passes through is the open socket, not the plinth)
    for (const raw of [0.15, 0.3, 0.5, 0.7, 0.85]) {
      const s = sampleKeys(k, p0 + (p1 - p0) * raw)
      const dist = Math.hypot(
        s.pos[0] - SOCKET_POS[0],
        s.pos[2] - SOCKET_POS[2]
      )
      const safe = s.pos[1] > 2.5 || dist < 1.2
      expect(
        safe,
        `dive clip at raw=${raw}: y=${s.pos[1].toFixed(2)} dist=${dist.toFixed(2)}`
      ).toBe(true)
    }
  })

  it('every act keeps pulse brightness within the ≤4 restraint gate', () => {
    for (const s of buildShots()) {
      expect(s.pulse ?? 1).toBeLessThanOrEqual(2)
    }
  })
})

describe('springs', () => {
  it('reduced motion snaps to the sampled shot in one update', () => {
    const d = new Director(true)
    d.keys = keys()
    const cam = new THREE.PerspectiveCamera(24, 16 / 9, 0.1, 140)
    d.update(cam, 0.3, 0, 1 / 60, 1, true)
    const s = sampleKeys(d.keys, 0.3)
    expect(d.pos.x).toBeCloseTo(s.pos[0], 3)
    expect(d.pos.y).toBeCloseTo(s.pos[1], 3)
    expect(d.ramp).toBe(0)
  })

  it('diveT is 0 before the dive and 1 after it', () => {
    const d = new Director(false)
    d.keys = keys()
    const cam = new THREE.PerspectiveCamera(24, 16 / 9, 0.1, 140)
    const k = d.keys
    const pStart = k.find((s) => s.tag === 'dive-start')!.p
    const pEnd = k.find((s) => s.tag === 'dive-end')!.p
    d.update(cam, pStart - 0.01, 0, 1 / 60, 1, false)
    expect(d.diveT).toBe(0)
    d.update(cam, pEnd + 0.01, 0, 1 / 60, 1, false)
    expect(d.diveT).toBe(1)
  })
})

describe('easing helpers', () => {
  it('easeIO endpoints and clamp01', () => {
    expect(easeIO(0)).toBe(0)
    expect(easeIO(1)).toBe(1)
    expect(clamp01(1.4)).toBe(1)
    expect(clamp01(-0.2)).toBe(0)
  })
})
