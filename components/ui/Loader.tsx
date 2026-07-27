'use client'

/* The loader (SPEC §5.3 — aten7 grammar, Plenum-polished): true black +
   2–4% lift, mono kicker, the title mid-decode on a progress-driven
   timeline, status line re-scrambling, the board scene at ~3.5% luminance
   behind dark glass. Forced dwell: CLICK TO ENTER arms at isLoaded + 5s.
   The first click unlocks audio and fires the first SFX in the same
   gesture (SPEC §5.6) — onEnter is that gesture.

   Bundle isolation: this component lives in the MAIN chunk, so it must not
   import three. SceneRoot (inside the island chunk) forwards
   THREE.DefaultLoadingManager progress as `substrate:progress` window
   events carrying { loaded, total }. */

import { type JSX, useCallback, useEffect, useRef, useState } from 'react'
import { DWELL_MS, isArmed, LOADER_COPY, loadProgress } from '../../lib/loader'
import { REDUCED, sessionState } from '../../lib/scene/store'
import { DecodeText } from './DecodeText'

const E2E =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('e2e') === '1'

export function Loader({
  onEnter,
}: {
  onEnter: () => void
}): JSX.Element | null {
  const [progress, setProgress] = useState(0)
  const [armed, setArmed] = useState(false)
  const [gone, setGone] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const veilRef = useRef<HTMLDivElement | null>(null)

  /* track loading progress (bridged from the island) + fonts; the dwell
     starts when both complete */
  useEffect(() => {
    if (E2E || REDUCED) {
      setProgress(1)
      setArmed(true)
      return
    }
    let doneAt: number | null = null
    let fontsDone = false
    let lastLoaded = 0
    let lastTotal = 1
    let raf = 0
    const mountAt = performance.now()

    const onProg = (e: Event) => {
      const { loaded, total } = (
        e as CustomEvent<{ loaded: number; total: number }>
      ).detail
      lastLoaded = loaded
      lastTotal = total
      setProgress(loadProgress(loaded, total))
    }
    window.addEventListener('substrate:progress', onProg)
    document.fonts?.ready.then(() => {
      fontsDone = true
    })

    const tick = () => {
      const p = loadProgress(lastLoaded, lastTotal)
      // fully-cached revisit: no progress events ever fire — treat 1.2s of
      // silence after mount as load-complete (dwell is the pacing anyway)
      const silent = lastLoaded === 0 && performance.now() - mountAt > 1200
      if ((p >= 1 || silent) && fontsDone && doneAt === null) {
        doneAt = performance.now()
      }
      if (isArmed(doneAt, performance.now(), DWELL_MS)) {
        setArmed(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('substrate:progress', onProg)
    }
  }, [])

  const enter = useCallback(() => {
    if (!armed || leaving) return
    setLeaving(true)
    sessionState.entered = true
    onEnter() // audio unlock + first SFX — same gesture (SPEC §5.6)
    const veil = veilRef.current
    if (veil) {
      veil.style.transition = 'opacity 1s linear'
      veil.style.opacity = '0'
    }
    setTimeout(() => setGone(true), 1050)
  }, [armed, leaving, onEnter])

  if (gone) return null

  return (
    <div
      ref={veilRef}
      role="dialog"
      aria-label="Loading — substrate"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--s-7) var(--s-6)',
        // 2–4% lift, never pure #000 (OLED reads it as a hole — ATEN7-P1)
        background:
          'radial-gradient(120% 90% at 50% 40%, rgba(10,10,12,0.965) 0%, rgba(3,3,4,0.985) 100%)',
        color: 'var(--bone-0)',
        fontFamily: 'var(--mono)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--t-xs)',
          letterSpacing: '0.12em',
          color: 'var(--bone-1)',
          textTransform: 'uppercase',
        }}
      >
        {LOADER_COPY.kicker}
      </div>

      <div style={{ textAlign: 'center' }}>
        <DecodeText
          text={LOADER_COPY.title}
          className="loader-title"
          delay={0.2}
        />
        <div
          style={{
            margin: 'var(--s-5) auto 0',
            height: 1,
            width: 180,
            background: 'var(--line)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scaleX(${progress})`,
              transformOrigin: 'left',
              background: 'var(--bone-2)',
              transition: 'transform 200ms linear',
            }}
          />
        </div>
        <div
          aria-live="polite"
          style={{
            marginTop: 'var(--s-4)',
            fontSize: 'var(--t-xs)',
            letterSpacing: '0.12em',
            color: 'var(--bone-2)',
            textTransform: 'uppercase',
          }}
        >
          {LOADER_COPY.status}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={enter}
          disabled={!armed}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 'var(--t-xs)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: armed ? 'var(--cursor)' : 'var(--bone-2)',
            background: 'none',
            border: 'none',
            borderBottom: `1px solid ${armed ? 'var(--cursor)' : 'var(--line)'}`,
            padding: 'var(--s-2) var(--s-1)',
            cursor: armed ? 'pointer' : 'default',
            opacity: armed ? 1 : 0.5,
            transition: 'opacity 620ms var(--ease-entrance), color 620ms',
          }}
        >
          {LOADER_COPY.enter}
        </button>
      </div>
    </div>
  )
}
