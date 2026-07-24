'use client'

// StageLoader — client-only wrapper around Stage.
//
// app/page.tsx is a Server Component, and Next 16 forbids
// `dynamic(..., { ssr: false })` inside one, so the ssr:false dynamic
// import (and its 'use client' boundary) lives here instead.

import dynamic from 'next/dynamic'
import type { JSX } from 'react'

const Stage = dynamic(() => import('./Stage'), { ssr: false })

export function StageLoader(): JSX.Element {
  return <Stage />
}
