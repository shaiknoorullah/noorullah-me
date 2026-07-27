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
   events carrying { loaded, total }.

   Title decode (SPEC §5.3, P5 review Fix 1): driven by load progress, not
   time — "progress = loadingManager.onProgress × 1.05" scrubs a paused
   GSAP timeline via tl.progress(). Built from the pure decode-engine
   primitives in lib/decode.ts; DecodeText itself stays untouched (it's the
   time-based, ScrollTrigger-fired section-heading component).

   Status re-scramble (SPEC §5.3, P5 review Fix 2): a short periodic wave
   re-scrambles a few characters of the status line, same 3-layer glyph
   discipline (only opacity/glyph/color ever change). */

import gsap from 'gsap'
import {
  type CSSProperties,
  type JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  buildWindows,
  charPhaseAt,
  DECODE_DEFAULTS,
  scrambleGlyph,
} from '../../lib/decode'
import {
  DWELL_MS,
  isArmed,
  LOADER_COPY,
  loadProgress,
  resolveDoneAt,
} from '../../lib/loader'
import { REDUCED, sessionState } from '../../lib/scene/store'

const E2E =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('e2e') === '1'

// Real gsap.timeline() return type, derived rather than reached for via the
// ambient `gsap.core` type namespace — safe under an ES default import.
type GsapTimeline = ReturnType<typeof gsap.timeline>

// A plain `<div>` has no ARIA role of its own — it computes to role
// `generic`, and `aria-label`/`aria-labelledby` are prohibited on that role
// (WAI-ARIA §5.2.7; axe-core: `aria-prohibited-attr`). The per-char spans
// below must stay individually `aria-hidden` (each one mutates its glyph
// every frame, which is unreadable to a screen reader), so the accessible
// name has to live on a real, static, visually-hidden text node inside the
// container instead of an `aria-label` on the container itself.
const Div = 'div'

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

/* Progress-scrubbed title decode: per-char spans for LOADER_COPY.title on a
   paused gsap.timeline whose onUpdate applies charPhaseAt per char — the
   same 3-layer discipline as DecodeText (hidden / scramble / flash
   #A4EB53 / settled bone; only opacity, glyph identity, and color ever
   change). The timeline is exposed via `tlRef` so the progress effect below
   can call tl.progress(Math.min(1, p)) on every 'substrate:progress' event.
   Reduced motion (?e2e=1 or REDUCED): settles immediately, no timeline. */
function LoaderTitle({
  text,
  tlRef,
}: {
  text: string
  tlRef: { current: GsapTimeline | null }
}): JSX.Element {
  const root = useRef<HTMLDivElement | null>(null)
  const chars = useMemo(() => text.split(''), [text])
  const windows = useMemo(
    () => buildWindows(chars.length, DECODE_DEFAULTS, Math.random),
    [chars.length]
  )

  useEffect(() => {
    const el = root.current
    if (!el) return undefined
    const spans = Array.from(el.querySelectorAll<HTMLElement>('[data-ch]'))

    if (E2E || REDUCED) {
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i]!
        span.style.opacity = '1'
        span.style.color = ''
        span.textContent = chars[i]!
      }
      return undefined
    }

    let tick = 0
    const apply = (t: number) => {
      tick += 1
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i]!
        if (chars[i] === ' ') {
          span.textContent = ' '
          span.style.opacity = '1'
          continue
        }
        const phase = charPhaseAt(t, windows[i]!)
        if (phase === 'hidden') {
          span.style.opacity = '0'
        } else if (phase === 'scramble') {
          span.style.opacity = '1'
          span.style.color = 'var(--bone-1)'
          span.textContent = scrambleGlyph(i, tick)
        } else if (phase === 'flash') {
          span.style.opacity = '1'
          span.style.color = '#A4EB53'
          span.textContent = chars[i]!
        } else {
          span.style.opacity = '1'
          span.style.color = ''
          span.textContent = chars[i]!
        }
      }
    }

    const state = { t: 0 }
    const tl = gsap.timeline({ paused: true })
    tl.to(state, {
      t: 1,
      duration: 1,
      ease: 'none',
      onUpdate: () => apply(state.t),
    })
    tlRef.current = tl
    return () => {
      tl.kill()
      tlRef.current = null
    }
  }, [chars, windows, tlRef])

  return (
    <Div ref={root} className="loader-title">
      {/* real, static accessible name — the per-char spans below mutate
          every frame and stay aria-hidden (M2 review: aria-label is
          prohibited on this container's role=generic) */}
      <span style={srOnly}>{text}</span>
      {chars.map((c, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: chars are static, non-unique, and never reorder — position is a stable identity here (DecodeText precedent)
          key={i}
          data-ch
          aria-hidden="true"
          // REDUCED/E2E are client-only signals — SSR renders opacity 0,
          // a reduced-motion client renders 1 (P5 review: benign, silence
          // the recoverable hydration mismatch; the effect owns the DOM)
          suppressHydrationWarning
          style={{ opacity: E2E || REDUCED ? 1 : 0 }}
        >
          {c}
        </span>
      ))}
    </Div>
  )
}

/* Status re-scramble (SPEC §5.3, Fix 2): every ~2.4s a short ~0.4s wave
   flips a few characters through scrambleGlyph before settling back to the
   true text — one gsap-driven loop (repeat + repeatDelay), cleaned up on
   unmount and stopped once the user enters (`active` flips false). Reduced
   motion: static text, no scramble. Only glyph identity/color ever change
   — no movement. */
function LoaderStatus({
  text,
  active,
}: {
  text: string
  active: boolean
}): JSX.Element {
  const root = useRef<HTMLDivElement | null>(null)
  const chars = useMemo(() => text.split(''), [text])

  useEffect(() => {
    const el = root.current
    if (!el || REDUCED || !active) return undefined
    const spans = Array.from(el.querySelectorAll<HTMLElement>('[data-ch]'))
    const eligible = chars.map((_, i) => i).filter((i) => chars[i] !== ' ')
    let wave: number[] = []

    const pickWave = () => {
      const pool = eligible.slice()
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = pool[i]!
        pool[i] = pool[j]!
        pool[j] = tmp
      }
      const count = Math.min(pool.length, 3 + Math.floor(Math.random() * 3))
      wave = pool.slice(0, count)
    }

    let tick = 0
    const state = { t: 0 }
    const apply = () => {
      tick += 1
      const phase = charPhaseAt(state.t, { start: 0, end: 1 })
      for (const i of wave) {
        const span = spans[i]
        if (!span) continue
        if (phase === 'scramble') {
          span.style.color = 'var(--bone-1)'
          span.textContent = scrambleGlyph(i, tick)
        } else if (phase === 'flash') {
          span.style.color = '#A4EB53'
          span.textContent = chars[i]!
        } else {
          span.style.color = ''
          span.textContent = chars[i]!
        }
      }
    }

    const tween = gsap.to(state, {
      t: 1,
      duration: 0.4,
      ease: 'none',
      repeat: -1,
      repeatDelay: 2,
      onStart: pickWave,
      onRepeat: pickWave,
      onUpdate: apply,
    })

    return () => {
      tween.kill()
      // revert any glyph frozen mid-wave so a stopped/unmounting status
      // line never shows scramble glyphs
      for (const i of wave) {
        const span = spans[i]
        if (span) {
          span.style.color = ''
          span.textContent = chars[i]!
        }
      }
    }
  }, [chars, active])

  return (
    <Div
      ref={root}
      style={{
        marginTop: 'var(--s-4)',
        fontSize: 'var(--t-xs)',
        letterSpacing: '0.12em',
        color: 'var(--bone-2)',
        textTransform: 'uppercase',
      }}
    >
      {/* real, static accessible name carries aria-live: the per-char
          spans below rewrite their glyph every ~2.4s wave and stay
          aria-hidden, so a live region on the mutating container would
          both violate role=generic aria-label and announce garbage
          mid-scramble (M2 review) */}
      <span aria-live="polite" style={srOnly}>
        {text}
      </span>
      {chars.map((c, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: chars are static, non-unique, and never reorder — position is a stable identity here (DecodeText precedent)
        <span key={i} data-ch aria-hidden="true">
          {c}
        </span>
      ))}
    </Div>
  )
}

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
  const titleTlRef = useRef<GsapTimeline | null>(null)

  /* track loading progress (bridged from the island) + fonts; the dwell
     starts when both complete */
  useEffect(() => {
    if (E2E || REDUCED) {
      setProgress(1)
      setArmed(true)
      return undefined
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
      const p = loadProgress(loaded, total)
      setProgress(p)
      // Fix 1 (P5 review): scrub the paused title timeline directly off
      // load progress, on every 'substrate:progress' event.
      titleTlRef.current?.progress(Math.min(1, p))
    }
    window.addEventListener('substrate:progress', onProg)
    if (document.fonts) {
      document.fonts.ready.then(() => {
        fontsDone = true
      })
    } else {
      // Fix 4 (P5 review): a missing document.fonts must never block
      // arm-eligibility — treat it as fonts-done.
      fontsDone = true
    }

    const tick = () => {
      const now = performance.now()
      const p = loadProgress(lastLoaded, lastTotal)
      // fully-cached revisit: no progress events ever fire — treat 1.2s of
      // silence after mount as load-complete (dwell is the pacing anyway)
      const silent = lastLoaded === 0 && now - mountAt > 1200
      if ((p >= 1 || silent) && fontsDone && doneAt === null) {
        doneAt = now
        // an instant/cached load should show the title resolved — the
        // progress-scrub never ran, so settle the timeline (re-review
        // residual: blank SUBSTRATE through the silent dwell)
        titleTlRef.current?.progress(1)
      }
      // Fix 3 (P5 review): a stalled load still forces arm-eligibility 20s
      // after mount, regardless of progress/fonts state.
      doneAt = resolveDoneAt(doneAt, mountAt, now)
      if (isArmed(doneAt, now, DWELL_MS)) {
        // arming always shows the title resolved — covers the stall-ceiling
        // path where the progress scrub froze mid-decode (P5 review)
        titleTlRef.current?.progress(1)
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
      // the fading veil must not swallow clicks on the revealed page
      // (P5 integration review: 1s pointer dead-zone)
      veil.style.pointerEvents = 'none'
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
        <LoaderTitle text={LOADER_COPY.title} tlRef={titleTlRef} />
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
        <LoaderStatus text={LOADER_COPY.status} active={!leaving} />
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
