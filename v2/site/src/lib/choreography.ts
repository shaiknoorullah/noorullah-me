/* DOM choreography (DESIGN.md §3): word-mask reveals, the pinned statement
   scrub, counters, section-header reveals, the horizontal principles pin,
   magnetic buttons, custom cursor, lenis-wired anchors.

   Three speeds, never blended: instant (120–200ms hovers), breath
   (600–1200ms reveals), cinema (2–4s pins/scrubs). Everything is gated on
   !REDUCED with instant fallbacks — reduced motion keeps 100% of content
   reachable. Returns a teardown function. */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import type { Director } from './director';
import { REDUCED, statementState } from './store';

gsap.registerPlugin(ScrollTrigger);

/* Split an element's text nodes into word-mask spans:
   .w (overflow hidden) > i (the translated inner). Returns the inners. */
function splitEl(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split) return Array.from(el.querySelectorAll<HTMLElement>('.w > i'));
  el.dataset.split = '1';
  const inners: HTMLElement[] = [];
  const walk = (node: Node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (child.textContent ?? '').split(/(\s+)/).forEach((piece) => {
          if (!piece) return;
          if (/^\s+$/.test(piece)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('i');
          inner.textContent = piece;
          w.appendChild(inner);
          inners.push(inner);
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && (child as Element).tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  return inners;
}

function renderCount(el: HTMLElement, v: number) {
  const decimals = parseInt(el.dataset.decimals ?? '0', 10);
  const prefix = el.dataset.prefix ?? '';
  const suffix = el.dataset.suffix ?? '';
  const arrow = el.dataset.arrow;
  const comma = el.dataset.format === 'comma';
  let s = v.toFixed(decimals);
  if (comma) s = Number(s).toLocaleString('en-US');
  el.textContent = arrow ? `${arrow}→${s}` : `${prefix}${s}${suffix}`;
}

function animateCount(el: HTMLElement) {
  const end = parseFloat(el.dataset.count ?? '0');
  const from = parseFloat(el.dataset.from ?? '0');
  const proxy = { v: from };
  gsap.to(proxy, {
    v: end,
    duration: 1.8,
    ease: 'power3.out',
    onUpdate: () => renderCount(el, proxy.v),
  });
}

export function initDomChoreography(lenis: Lenis | null, director: Director): () => void {
  /* Reduced motion: instant fallbacks, no GSAP at all. Content is fully
     reachable; counters land on final values. */
  if (REDUCED) {
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) =>
      renderCount(el, parseFloat(el.dataset.count ?? '0')),
    );
    return () => {};
  }

  const cleanups: Array<() => void> = [];

  const ctx = gsap.context(() => {
    /* — word-mask reveals: [data-reveal="words"] — breath speed */
    document.querySelectorAll<HTMLElement>('[data-reveal="words"]').forEach((el) => {
      const inners = splitEl(el);
      gsap.set(inners, { yPercent: 115 });
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
            delay: (el.closest('#hero') ? 1.0 : 0) + parseFloat(el.dataset.delay ?? '0'),
          }),
      });
    });

    /* — generic fade-up reveals: [data-reveal] — */
    document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="words"])').forEach((el) => {
      gsap.set(el, { opacity: 0, y: 28 });
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
            delay: (el.closest('#hero') ? 1.2 : 0) + parseFloat(el.dataset.delay ?? '0'),
          }),
      });
    });

    /* — section headers: index + label rise, hairline draws across — */
    document.querySelectorAll<HTMLElement>('.sec-head').forEach((head) => {
      const rule = head.querySelector('.rule');
      const bits = head.querySelectorAll('.idx, .lbl');
      gsap.set(bits, { opacity: 0, y: 12 });
      if (rule) gsap.set(rule, { scaleX: 0 });
      ScrollTrigger.create({
        trigger: head,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(bits, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 });
          if (rule) gsap.to(rule, { scaleX: 1, duration: 1.3, ease: 'expo.out', delay: 0.15 });
        },
      });
    });

    /* — the statement: pinned viewport. The pin's scrub progress is written
       to statementState and drives the in-canvas SDF text (§10.3); the DOM
       paragraph stays visually-hidden as the a11y/SEO/reduced-motion
       source. No DOM word choreography here anymore. — */
    if (document.getElementById('statement')) {
      ScrollTrigger.create({
        trigger: '#statement',
        start: 'top top',
        end: '+=130%',
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          statementState.progress = p;
          // visibility envelope: fade in over the first 3%, out over the
          // last 7% so the text never pops at the pin edges
          statementState.vis = Math.min(1, p / 0.03) * Math.min(1, Math.max(0, (1 - p) / 0.07));
        },
        onToggle: (self) => {
          if (!self.isActive) statementState.vis = 0;
        },
      });
    }

    /* — counters: count up on entry — */
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => animateCount(el),
      });
    });

    /* — principles: the horizontal accent. Pin the section, truck the
       track sideways on vertical scroll (DESIGN.md §5 §6). snap: 1/3 so
       panels land crisply (§10.6); progress feeds the camera's
       principles truck (R5) via director.hProgress — */
    const track = document.querySelector<HTMLElement>('[data-track]');
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
            director.hProgress = self.progress;
          },
        },
      });
    }
  });

  /* — magnetic buttons: quickTo pull 0.35, spring-back on leave (400ms) — */
  const magnetics = [...document.querySelectorAll<HTMLElement>('[data-magnetic]')];
  const onMagMove = (e: Event) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const pe = e as PointerEvent;
    gsap.to(el, {
      x: (pe.clientX - r.left - r.width / 2) * 0.35,
      y: (pe.clientY - r.top - r.height / 2) * 0.35,
      duration: 0.4,
      ease: 'power3.out',
    });
  };
  const onMagLeave = (e: Event) => {
    gsap.to(e.currentTarget as HTMLElement, {
      x: 0,
      y: 0,
      duration: 0.4,
      ease: 'back.out(1.2)', // mechanical overshoot — the instant-speed snap back
    });
  };
  magnetics.forEach((el) => {
    el.addEventListener('pointermove', onMagMove);
    el.addEventListener('pointerleave', onMagLeave);
  });
  cleanups.push(() =>
    magnetics.forEach((el) => {
      el.removeEventListener('pointermove', onMagMove);
      el.removeEventListener('pointerleave', onMagLeave);
    }),
  );

  /* — custom cursor: dot + trailing ring (lerp .18), expands over
       interactive elements, hidden on touch — */
  const fine = matchMedia('(pointer: fine)').matches;
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let cursorTick: ((time: number, delta: number) => void) | null = null;
  let onCurMove: ((e: PointerEvent) => void) | null = null;
  let onCurOver: ((e: Event) => void) | null = null;
  if (fine && dot && ring) {
    document.documentElement.classList.add('has-cursor');
    let mx = innerWidth / 2;
    let my = innerHeight / 2;
    let rx = mx;
    let ry = my;
    onCurMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
    };
    addEventListener('pointermove', onCurMove, { passive: true });
    cursorTick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - ring.offsetWidth / 2}px, ${ry - ring.offsetHeight / 2}px, 0)`;
    };
    gsap.ticker.add(cursorTick);
    onCurOver = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.('a, button, [data-magnetic]')) ring.classList.add('on');
      else ring.classList.remove('on');
    };
    addEventListener('pointerover', onCurOver, { passive: true });
    cleanups.push(() => {
      document.documentElement.classList.remove('has-cursor');
      if (onCurMove) removeEventListener('pointermove', onCurMove);
      if (onCurOver) removeEventListener('pointerover', onCurOver);
      if (cursorTick) gsap.ticker.remove(cursorTick);
    });
  }

  /* — smooth anchors through lenis — */
  const anchors = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]')];
  const onAnchor = (e: Event) => {
    const a = e.currentTarget as HTMLAnchorElement;
    const href = a.getAttribute('href') ?? '';
    const hash = href.startsWith('/#') ? href.slice(1) : href;
    if (href.startsWith('/#') && location.pathname !== '/') return; // cross-page: let it navigate
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.8 });
    else (target as HTMLElement).scrollIntoView();
  };
  anchors.forEach((a) => a.addEventListener('click', onAnchor));
  cleanups.push(() => anchors.forEach((a) => a.removeEventListener('click', onAnchor)));

  return () => {
    ctx.revert(); // kills tweens + ScrollTriggers, restores inline styles
    cleanups.forEach((fn) => fn());
  };
}
