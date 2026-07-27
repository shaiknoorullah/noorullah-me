'use client'

// SceneIsland — client-only wrapper around SceneRoot.
//
// app/page.tsx is a Server Component, and Next 16 forbids
// `dynamic(..., { ssr: false })` inside one, so the ssr:false dynamic
// import (and its 'use client' boundary) lives here instead.

import dynamic from 'next/dynamic'
import type { JSX } from 'react'

const SceneRoot = dynamic(() => import('./SceneRoot'), { ssr: false })

export function SceneIsland(): JSX.Element {
  // P0 layering contract, lost in the Task 9 rewrite and execution-caught
  // at the P3 act shots (the bare Canvas collapsed to a ~150px strip in
  // normal flow): fixed inset-0 behind the DOM (negative z paints above
  // the body background, below page content), aria-hidden — the
  // visually-hidden scene description owns a11y (SPEC §8).
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      <SceneRoot />
    </div>
  )
}
