'use client'

/* Loader mount: keeps app/page.tsx a server component. The enter gesture
   unlocks audio and fires the first SFX in the same click (SPEC §5.6). */

import { type JSX, useCallback, useEffect } from 'react'
import { audio } from '../../lib/audio'
import { Loader } from './Loader'

export function LoaderMount(): JSX.Element {
  useEffect(() => {
    // QA/debug handle, same pattern as SceneRoot's window.__dir — the
    // audio-evidence script drives muffle/playSfx through it until the
    // Task 20 choreography wires the real consumers
    ;(window as unknown as { __audio?: typeof audio }).__audio = audio
  }, [])
  const enter = useCallback(() => {
    audio.unlock()
  }, [])
  return <Loader onEnter={enter} />
}
