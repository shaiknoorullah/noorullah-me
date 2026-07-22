/**
 * Font loading for noorullah.me
 *
 * Source of truth: projects/personal/noorullah-me/04-v1-implementation-spec.md §3.4 + F5
 * Three families, three CSS variables exposed on <html>:
 *
 *   --font-mono   → Monaspace Argon (variable, self-hosted, workhorse mono)
 *   --font-pixel  → Departure Mono (self-hosted, pixel display)
 *   --font-serif  → Newsreader (Google, editorial serif)
 *
 * All families use `display: 'swap'` and supply fallbacks so the page
 * has zero flash-of-unstyled-text and zero layout shift on first paint —
 * next/font inlines the metrics into the build output for SSR.
 *
 * The CSS variables here are consumed by lib/tokens.css via the
 * `--mono` / `--pixel` / `--serif` token stack (which lists the same
 * family names plus system fallbacks). Adding the `--font-*` variables
 * lets us prefer the `next/font`-loaded instance when present.
 */

import { Newsreader } from 'next/font/google'
import localFont from 'next/font/local'

// Monaspace Argon — variable weight, self-hosted woff2.
// Single variable file covers the full 200–800 weight range.
const monaspaceArgon = localFont({
  src: [
    {
      path: '../public/fonts/MonaspaceArgon-Var.woff2',
      weight: '200 800',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
})

// Departure Mono — single static pixel display face, self-hosted woff2.
const departureMono = localFont({
  src: [
    {
      path: '../public/fonts/DepartureMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-pixel',
  display: 'swap',
  fallback: ['Monaspace Argon', 'ui-monospace', 'monospace'],
})

// Newsreader — editorial serif, loaded from Google.
// Optical-size axis stays implicit (next/font picks a sensible default).
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

/**
 * Space-separated `className` containing all three CSS-variable hooks.
 * Apply to `<html>` so descendants can resolve `var(--font-mono)` etc.
 */
export const fontsVariable: string = [
  monaspaceArgon.variable,
  departureMono.variable,
  newsreader.variable,
].join(' ')
