'use client'

/* DecodeText (SPEC §5.5): section headings decode on entry — per-char
   scramble from the designed subset, random resolve order, #A4EB53 flash
   mid-decode, settles bone. Triggered once via ScrollTrigger. Settles in
   ≤1.2s for a heading of ≤32 chars (SPEC §8 readability gate). Reduced
   motion: settled immediately, no animation. */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { type JSX, useEffect, useMemo, useRef } from 'react'
import {
  buildWindows,
  charPhaseAt,
  DECODE_DEFAULTS,
  scrambleGlyph,
} from '../../lib/decode'
import { REDUCED } from '../../lib/scene/store'

gsap.registerPlugin(ScrollTrigger)

/* Text-flow host tags only — every member extends HTMLElement so `root`
   below can stay a single, simple ref type instead of a generic per-tag
   one (a full `ElementType` collapses JSX prop resolution to `never`). */
export type DecodeTextTag =
  | 'span'
  | 'div'
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'strong'
  | 'em'
  | 'label'

export interface DecodeTextProps {
  text: string
  as?: DecodeTextTag
  className?: string
  delay?: number
}

export function DecodeText({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
}: DecodeTextProps): JSX.Element {
  const root = useRef<HTMLElement | null>(null)
  const chars = useMemo(() => text.split(''), [text])

  useEffect(() => {
    const el = root.current
    if (!el || REDUCED) return
    const spans = Array.from(el.querySelectorAll<HTMLElement>('[data-ch]'))
    const windows = buildWindows(chars.length, DECODE_DEFAULTS, Math.random)
    const state = { t: 0 }
    let tick = 0

    const apply = () => {
      tick += 1
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i]!
        const phase = charPhaseAt(state.t, windows[i]!)
        if (chars[i] === ' ') {
          span.textContent = ' '
          span.style.opacity = '1'
          continue
        }
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

    const tween = gsap.to(state, {
      t: 1,
      duration: Math.min(1.2, chars.length * 0.02 + 0.3),
      ease: 'none',
      delay,
      paused: true,
      onUpdate: apply,
    })
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => tween.play(),
    })
    apply()
    return () => {
      st.kill()
      tween.kill()
    }
  }, [chars, delay])

  return (
    // biome a11y: the settled text is the accessible name throughout
    // ref: DecodeTextTag is a union of host tags, each wanting its own
    // element ref type — TS can't reconcile that against one plain
    // HTMLElement ref, so the intersection is forced here deliberately.
    <Tag ref={root as never} className={className} aria-label={text}>
      {chars.map((c, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: chars are static, non-unique, and never reorder — position is a stable identity here
          key={i}
          data-ch
          aria-hidden="true"
          style={{ opacity: REDUCED ? 1 : 0 }}
        >
          {c}
        </span>
      ))}
    </Tag>
  )
}
