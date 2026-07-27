// Home — `/` — The Substrate (SPEC §4). Server component: the canvas island
// and the loader are client leaves; all content is DOM.
//
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md
//   §4   — a11y gate (axe-core 0 critical, 0 serious).
//   DESIGN §5 — landing anatomy (<LandingSections>, Task 19).
//
// Notes:
//   - `<SceneIsland>` mounts the R3F canvas island `position: fixed`,
//     `zIndex: -1`, behind this div. `<body>` (app/layout.tsx) already
//     paints `var(--ink-0)`, so this div's own background stays
//     `transparent` — an opaque section background would hide the canvas.
//   - `<LandingSections>` owns the single top-level `<h1>` (in #hero) plus
//     every other section; there is no separate visually-hidden h1 here.
//   - `<LoaderMount>` renders the boot-sequence veil (Task 17, SPEC §5.3)
//     over everything else until the forced dwell arms CLICK TO ENTER and
//     the visitor clicks; it self-unmounts after that.

import type { JSX } from 'react'
import { LandingSections } from '../components/landing/sections'
import { SceneIsland } from '../components/scene/SceneIsland'
import { LoaderMount } from '../components/ui/LoaderMount'

export default function HomePage(): JSX.Element {
  return (
    <div style={{ background: 'var(--ink-0)', color: 'var(--bone-0)' }}>
      <LoaderMount />
      <SceneIsland />
      <LandingSections />
    </div>
  )
}
