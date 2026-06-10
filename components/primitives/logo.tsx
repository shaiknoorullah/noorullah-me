// Logo primitive — three variants tied to the wordmark system.
//
// Source SVG paths (FROZEN):
//   - projects/personal/noorullah-me/preview-wordmark-system.html §1b (wordmark + nūn dot)
//   - projects/personal/noorullah-me/preview-wordmark-system.html §2  (monogram, viewBox crop)
//   - projects/personal/noorullah-me/preview-wordmark-system.html §3  (purpose-built favicon glyph)
//
// Spec ref:
//   - projects/personal/noorullah-me/04-v1-implementation-spec.md §3.3 (primitives inventory)
//   - projects/personal/noorullah-me/04-v1-implementation-spec.md §3.5 (logo assets table)
//   - projects/personal/noorullah-me/04-v1-implementation-spec.md F11 (logo assets + primitive)
//
// Notes:
//   - Fill is inherited from `currentColor` so the component is theme-aware
//     (light mode could land in v2 without touching this file).
//   - The wordmark is the cleaned compound path from variant 1b — identical
//     geometry feeds the hero extrusion path in `<HeroScene>` (Phase 2, H2).
//   - The nūn diacritical dot is a sharp 32×32 square at (520, -50), kept as a
//     sibling `<rect>` so the 3D scene can render it as a separate sphere.
//   - When no title is passed the svg is decorative (`aria-hidden="true"`).
//     Passing `title` opts into an inline accessible name via `<title>` +
//     `role="img"` (per WAI-ARIA SVG accessibility).

import type { JSX, SVGProps } from 'react'

export type LogoVariant = 'wordmark' | 'monogram' | 'favicon'

export type LogoProps = Omit<
  SVGProps<SVGSVGElement>,
  'viewBox' | 'children'
> & {
  /** Which logo tier to render. Default: `wordmark`. */
  variant?: LogoVariant
  /**
   * Optional accessible title. When provided, renders a `<title>` element and
   * sets `role="img"`. When omitted, the svg is decorative and gets
   * `aria-hidden="true"`.
   */
  title?: string
}

// ---------------------------------------------------------------------------
// Geometry constants — DO NOT edit by hand.
// Lifted verbatim from preview-wordmark-system.html.
// ---------------------------------------------------------------------------

/** Wordmark — variant 1b (with nūn diacritical dot). */
const WORDMARK_VIEWBOX = '-15 -65 627 383'
const WORDMARK_PATH =
  'M596.407 7.62793L516.3 227.72V228L514.316 233.5L513.316 236H513.286L513.284 236.006L513.269 236H450.269L426.11 302.375L407.316 295.534L428.985 236H366.816L368.2 232.662L452.316 1.55273V1H514.316L514.359 1.43555L514.519 1L533.312 7.84082L457.548 216H499.282L577.613 0.787109L596.407 7.62793ZM223.505 6.84082L123.354 282H164.242L266.711 0.470703L285.505 7.31055L178.316 301.808V302H178.246L178.11 302.374L177.083 302H39.3164V282H40.0713L56.8135 236H6.31641V227.312L0 225.015L81.333 1.55371V1H81.5352L81.7275 0.470703L83.1816 1H142.333V1.03613L142.369 0.9375L161.163 7.77832L79.3164 232.65V236H78.0977L61.3545 282H102.071L204.711 0L223.505 6.84082ZM347.505 7.31055L240.11 302.374L221.316 295.534L328.711 0.470703L347.505 7.31055ZM409.505 7.31055L302.11 302.374L283.316 295.534L390.711 0.470703L409.505 7.31055ZM95.5391 21L24.5645 216H64.0928L135.067 21H95.5391ZM395.548 216H436.265L507.239 21H466.521L395.548 216Z'

/** Monogram — same geometry, viewBox cropped to the rightmost letterform. */
const MONOGRAM_VIEWBOX = '345 -85 280 420'
const MONOGRAM_PATH =
  'M596.407 7.62793L516.3 227.72V228L514.316 233.5L513.316 236H513.286L513.284 236.006L513.269 236H450.269L426.11 302.375L407.316 295.534L428.985 236H366.816L368.2 232.662L452.316 1.55273V1H514.316L514.359 1.43555L514.519 1L533.312 7.84082L457.548 216H499.282L577.613 0.787109L596.407 7.62793ZM395.548 216H436.265L507.239 21H466.521L395.548 216Z'

/** Nūn diacritical dot — shared by wordmark + monogram. */
const DOT = { x: 520, y: -50, width: 32, height: 32 } as const

/**
 * Favicon — separate, hand-built glyph (not a cropped monogram). Same italic
 * angle as the strokes; sharp corners; brand DNA via shared angle + dot.
 */
const FAVICON_VIEWBOX = '-8 -10 116 110'
const FAVICON_PATH =
  'M 28 88 L 60 88 L 82 12 L 50 12 Z M 40 78 L 56 78 L 70 22 L 54 22 Z'
const FAVICON_DOT = { x: 58, y: -4, width: 14, height: 14 } as const

// ---------------------------------------------------------------------------

function WordmarkBody(): JSX.Element {
  return (
    <>
      <path d={WORDMARK_PATH} />
      <rect x={DOT.x} y={DOT.y} width={DOT.width} height={DOT.height} />
    </>
  )
}

function MonogramBody(): JSX.Element {
  return (
    <>
      <path d={MONOGRAM_PATH} />
      <rect x={DOT.x} y={DOT.y} width={DOT.width} height={DOT.height} />
    </>
  )
}

function FaviconBody(): JSX.Element {
  return (
    <>
      <path d={FAVICON_PATH} fillRule="evenodd" />
      <rect
        x={FAVICON_DOT.x}
        y={FAVICON_DOT.y}
        width={FAVICON_DOT.width}
        height={FAVICON_DOT.height}
      />
    </>
  )
}

function variantViewBox(variant: LogoVariant): string {
  if (variant === 'favicon') return FAVICON_VIEWBOX
  if (variant === 'monogram') return MONOGRAM_VIEWBOX
  return WORDMARK_VIEWBOX
}

function variantBody(variant: LogoVariant): JSX.Element {
  if (variant === 'favicon') return <FaviconBody />
  if (variant === 'monogram') return <MonogramBody />
  return <WordmarkBody />
}

export function Logo({
  variant = 'wordmark',
  title,
  ...rest
}: LogoProps): JSX.Element {
  const viewBox = variantViewBox(variant)
  const body = variantBody(variant)

  if (title === undefined) {
    return (
      <svg
        aria-hidden="true"
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        data-logo-variant={variant}
        {...rest}
      >
        {body}
      </svg>
    )
  }

  return (
    <svg
      role="img"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      data-logo-variant={variant}
      {...rest}
    >
      <title>{title}</title>
      {body}
    </svg>
  )
}

export default Logo
