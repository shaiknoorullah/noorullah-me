'use client'

/* Loader mount: keeps app/page.tsx a server component. The audio unlock
   callback is wired in Task 18; until then the enter gesture only reveals
   the scene (the veil drop exposes the island at full luminance). */

import { type JSX, useCallback } from 'react'
import { Loader } from './Loader'

export function LoaderMount(): JSX.Element {
  const enter = useCallback(() => {
    // Task 18: audio.unlock() + first SFX fire here (same gesture)
  }, [])
  return <Loader onEnter={enter} />
}
