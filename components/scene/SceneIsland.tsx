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
  return <SceneRoot />
}
