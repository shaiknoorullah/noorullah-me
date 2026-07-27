// Home — `/`
//
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md
//   F12 — Smoke route: `/` renders <Logo variant=wordmark/> + 30w bio
//          + status footer; lint+types+unit+build pass.
//   §3.3 — primitives inventory (<Logo>, <StatusLine>).
//   §4   — a11y gate (axe-core 0 critical, 0 serious).
//
// Notes:
//   - `<SceneIsland>` mounts the R3F canvas island (SceneRoot: Lenis/tempus
//     scroll, Director, post-processing skeleton) `position: fixed`,
//     `zIndex: -1`, behind this div. The `<body>` (app/layout.tsx) already
//     paints `var(--ink-0)`, so this div's own background is `transparent` —
//     the canvas would otherwise be hidden behind it. The set (glTF scene)
//     lands in a later task.
//   - The wordmark svg is decorative (`aria-hidden`); the accessible name is
//     supplied by a visually-hidden `<h1>` so the route still has a single
//     top-level heading per WCAG / axe `heading-order`.
//   - Status footer is a static placeholder for `<StatusLine>` (Phase 1, T2)
//     and uses semantic `<footer role="contentinfo">` so axe `region` passes.

import type { JSX } from 'react'
import { Logo } from '../components/primitives/Logo'
import { SceneIsland } from '../components/scene/SceneIsland'
import { BIO_30W, STATUS_BUILDING, STATUS_LOCATION } from '../lib/bio'

export default function HomePage(): JSX.Element {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--s-7) var(--s-6)',
        gap: 'var(--s-7)',
        fontFamily: 'var(--mono)',
        color: 'var(--bone-0)',
        background: 'transparent',
      }}
    >
      <SceneIsland />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 'var(--s-6)',
          maxWidth: '72ch',
        }}
      >
        <h1
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
        >
          noorullah.me — Shaik Noorullah, platform engineer
        </h1>

        <Logo
          variant="wordmark"
          style={{
            width: 'min(72vw, 720px)',
            height: 'auto',
            color: 'var(--bone-0)',
          }}
        />

        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-body)',
            lineHeight: 1.55,
            color: 'var(--bone-0)',
            margin: 0,
            maxWidth: '60ch',
          }}
        >
          {BIO_30W}
        </p>
      </main>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--s-5)',
          paddingTop: 'var(--s-4)',
          borderTop: '1px solid var(--line)',
          fontFamily: 'var(--mono)',
          fontSize: 'var(--t-xs)',
          color: 'var(--bone-1)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <span>{STATUS_LOCATION}</span>
        <span>
          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>
            ●
          </span>{' '}
          currently building · {STATUS_BUILDING}
        </span>
      </footer>
    </div>
  )
}
