'use client'

/* Loader mount: keeps app/page.tsx a server component. The enter gesture
   unlocks audio and fires the first SFX in the same click (SPEC §5.6). */

import { type JSX, useCallback } from 'react'
import { audio } from '../../lib/audio'
import { Loader } from './Loader'

export function LoaderMount(): JSX.Element {
  const enter = useCallback(() => {
    audio.unlock()
  }, [])
  return <Loader onEnter={enter} />
}
