/* DOM choreography (DESIGN §3): word-mask reveals, the pinned statement
   scrub, counters, section-header reveals, the horizontal principles pin,
   magnetic buttons, lenis-wired anchors, and act-boundary audio grammar.
   Three speeds, never blended: instant (120–200ms), breath (600–1200ms),
   cinema (2–4s). Everything gated on !REDUCED with instant fallbacks —
   reduced motion keeps 100% of content reachable. Returns a teardown.
   Ported from v2/site/src/lib/choreography.ts with audio hooks added
   (Task 20): act-boundary ScrollTriggers call audio.setAct, magnetic
   buttons play near-subliminal enter/leave SFX. */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'
import { audio } from './audio'
import type { Director } from './scene/director'
import { REDUCED, statementState } from './scene/store'

gsap.registerPlugin(ScrollTrigger)

/* Split an element's text nodes into word-mask spans:
   .w (overflow hidden) > i (the translated inner). Returns the inners. */
function splitEl(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split)
    return Array.from(el.querySelectorAll<HTMLElement>('.w > i'))
  el.dataset.split = '1'
  const inners: HTMLElement[] = []
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment()
        for (const piece of (child.textContent ?? '').split(/(\s+)/)) {
          if (!piece) continue
          if (/^\s+$/.test(piece)) {
            frag.appendChild(document.createTextNode(' '))
            continue
          }
          const w = document.createElement('span')
          w.className = 'w'
          w.style.display = 'inline-block'
          w.style.overflow = 'hidden'
          w.style.verticalAlign = 'bottom'
          const inner = document.createElement('i')
          inner.style.display = 'inline-block'
          inner.style.fontStyle = 'normal'
          inner.textContent = piece
          w.appendChild(inner)
          inners.push(inner)
          frag.appendChild(w)
        }
        node.replaceChild(frag, child)
      } else if (child.nodeType === 1 && (child as Element).tagName !== 'BR') {
        walk(child)
      }
    }
  }
  walk(el)
  return inners
}

function renderCount(el: HTMLElement, v: number) {
  const decimals = Number.parseInt(el.dataset.decimals ?? '0', 10)
  const suffix = el.dataset.suffix ?? ''
  const comma = el.dataset.format === 'comma'
  let s = v.toFixed(decimals)
  if (comma) s = Number(s).toLocaleString('en-US')
  el.textContent = `${s}${suffix}`
}

function animateCount(el: HTMLElement) {
  const end = Number.parseFloat(el.dataset.count ?? '0')
  const proxy = { v: 0 }
  gsap.to(proxy, {
    v: end,
    duration: 1.8,
    ease: 'power3.out',
    onUpdate: () => renderCount(el, proxy.v),
  })
}

/* Act boundaries: the bed dips and returns (never a hard switch). The
   index passed to audio.setAct is a section ORDINAL, not the grade-act
   number — SECTION_ACT in lib/scene/effects.ts collapses several sections
   into shared acts (principles→4, writing/contact→5) and the two must NOT
   be conflated if setAct ever consumes its argument (today it ignores it:
   every boundary is the same dip-and-return). */
const ACT_SECTIONS = [
  'statement',
  'work',
  'evidence',
  'about',
  'principles',
  'writing',
  'contact',
]

export function initDomChoreography(
  lenis: Lenis | null,
  director: Director
): () => void {
  /* Reduced motion: instant fallbacks, no GSAP. Content fully reachable. */
  if (REDUCED) {
    for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) {
      renderCount(el, Number.parseFloat(el.dataset.count ?? '0'))
    }
    return () => {
      /* no teardown: only synchronous DOM writes ran, nothing to revert */
    }
  }

  const cleanups: Array<() => void> = []

  const ctx = gsap.context(() => {
    /* — word-mask reveals: [data-reveal="words"] — breath speed — */
    for (const el of document.querySelectorAll<HTMLElement>(
      '[data-reveal="words"]'
    )) {
      const inners = splitEl(el)
      gsap.set(inners, { yPercent: 115 })
      ScrollTrigger.create({
        trigger: el,
        start: 'top 86%',
        once: true,
        onEnter: () =>
          gsap.to(inners, {
            yPercent: 0,
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.045,
            delay:
              (el.closest('#hero') ? 1.0 : 0) +
              Number.parseFloat(el.dataset.delay ?? '0'),
          }),
      })
    }

    /* — generic fade-up reveals: [data-reveal] — */
    for (const el of document.querySelectorAll<HTMLElement>(
      '[data-reveal]:not([data-reveal="words"])'
    )) {
      gsap.set(el, { opacity: 0, y: 28 })
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () =>
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: 'expo.out',
            delay:
              (el.closest('#hero') ? 1.2 : 0) +
              Number.parseFloat(el.dataset.delay ?? '0'),
          }),
      })
    }

    /* — section headers: index + label rise, hairline draws across — */
    for (const head of document.querySelectorAll<HTMLElement>('.sec-head')) {
      const rule = head.querySelector('.rule')
      const bits = head.querySelectorAll('.idx, .lbl')
      gsap.set(bits, { opacity: 0, y: 12 })
      if (rule) gsap.set(rule, { scaleX: 0, transformOrigin: 'left' })
      ScrollTrigger.create({
        trigger: head,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(bits, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.08,
          })
          if (rule)
            gsap.to(rule, {
              scaleX: 1,
              duration: 1.3,
              ease: 'expo.out',
              delay: 0.15,
            })
        },
      })
    }

    /* — the statement: pinned viewport; the scrub drives the in-canvas SDF
         text via statementState. The DOM paragraph stays visually-hidden. — */
    if (document.getElementById('statement')) {
      ScrollTrigger.create({
        trigger: '#statement',
        start: 'top top',
        end: '+=130%',
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress
          statementState.progress = p
          statementState.vis =
            Math.min(1, p / 0.03) * Math.min(1, Math.max(0, (1 - p) / 0.07))
        },
        onToggle: (self) => {
          if (!self.isActive) statementState.vis = 0
        },
      })
    }

    /* — counters: count up on entry — */
    for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => animateCount(el),
      })
    }

    /* — principles: horizontal pin; snap 1/3 (DESIGN §10.6); progress feeds
         the camera truck via director.hProgress — */
    const track = document.querySelector<HTMLElement>('[data-track]')
    if (track) {
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: '#principles',
          start: 'top top',
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 1,
          snap: 1 / 3,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            director.hProgress = self.progress
          },
        },
      })
    }

    /* — act boundaries: the bed dips and returns (never a hard switch) — */
    ACT_SECTIONS.forEach((id, i) => {
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 60%',
        onEnter: () => audio.setAct(i + 1),
        onEnterBack: () => audio.setAct(i),
      })
    })
  })

  /* — magnetic buttons: quickTo pull 0.35, spring-back 400ms — */
  const magnetics = [
    ...document.querySelectorAll<HTMLElement>('[data-magnetic]'),
  ]
  const onMagMove = (e: Event) => {
    const el = e.currentTarget as HTMLElement
    const r = el.getBoundingClientRect()
    const pe = e as PointerEvent
    gsap.to(el, {
      x: (pe.clientX - r.left - r.width / 2) * 0.35,
      y: (pe.clientY - r.top - r.height / 2) * 0.35,
      duration: 0.4,
      ease: 'power3.out',
    })
    audio.playSfx('enter')
  }
  const onMagLeave = (e: Event) => {
    gsap.to(e.currentTarget as HTMLElement, {
      x: 0,
      y: 0,
      duration: 0.4,
      ease: 'back.out(1.2)',
    })
    audio.playSfx('leave')
  }
  for (const el of magnetics) {
    el.addEventListener('pointermove', onMagMove)
    el.addEventListener('pointerleave', onMagLeave)
  }
  cleanups.push(() => {
    for (const el of magnetics) {
      el.removeEventListener('pointermove', onMagMove)
      el.removeEventListener('pointerleave', onMagLeave)
    }
  })

  /* — smooth anchors through lenis — */
  const anchors = [
    ...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
  ]
  const onAnchor = (e: Event) => {
    const a = e.currentTarget as HTMLAnchorElement
    const hash = a.getAttribute('href') ?? ''
    const target = document.querySelector(hash)
    if (!target) return
    e.preventDefault()
    if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.8 })
    else (target as HTMLElement).scrollIntoView()
  }
  for (const a of anchors) a.addEventListener('click', onAnchor)
  cleanups.push(() => {
    for (const a of anchors) a.removeEventListener('click', onAnchor)
  })

  return () => {
    ctx.revert()
    for (const fn of cleanups) fn()
  }
}
