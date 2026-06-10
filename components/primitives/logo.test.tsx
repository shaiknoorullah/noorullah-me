// Unit test for <Logo>.
//
// Asserts each variant ('wordmark' | 'monogram' | 'favicon') renders an
// <svg> root with the spec-frozen viewBox and the matching data attribute,
// plus the right child geometry (path + dot rect for wordmark/monogram,
// hand-built glyph for favicon).
//
// Spec ref:
//   - projects/personal/noorullah-me/04-v1-implementation-spec.md §3.5 (viewBoxes)
//   - projects/personal/noorullah-me/04-v1-implementation-spec.md §5.2 (unit gate)

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Logo, type LogoVariant } from './logo'

/** Spec-frozen viewBoxes from §3.5 — duplicated here so the test catches drift. */
const EXPECTED_VIEWBOX: Record<LogoVariant, string> = {
  wordmark: '-15 -65 627 383',
  monogram: '345 -85 280 420',
  favicon: '-8 -10 116 110',
}

function render(variant: LogoVariant): string {
  return renderToStaticMarkup(<Logo variant={variant} />)
}

describe('<Logo>', () => {
  it('renders an <svg> root for the default (wordmark) variant', () => {
    const html = renderToStaticMarkup(<Logo />)
    expect(html.startsWith('<svg')).toBe(true)
    expect(html).toContain(`viewBox="${EXPECTED_VIEWBOX.wordmark}"`)
    expect(html).toContain('data-logo-variant="wordmark"')
  })

  it.each<LogoVariant>([
    'wordmark',
    'monogram',
    'favicon',
  ])('renders the %s variant with the correct viewBox and data attribute', (variant) => {
    const html = render(variant)
    expect(html.startsWith('<svg')).toBe(true)
    expect(html).toContain(`viewBox="${EXPECTED_VIEWBOX[variant]}"`)
    expect(html).toContain(`data-logo-variant="${variant}"`)
  })

  it('includes the nūn diacritical dot rect for wordmark + monogram', () => {
    const wordmark = render('wordmark')
    const monogram = render('monogram')
    // Spec §3.5: white nūn dot rect at (520, -50), 32×32.
    const dot = '<rect x="520" y="-50" width="32" height="32"'
    expect(wordmark).toContain(dot)
    expect(monogram).toContain(dot)
  })

  it('renders the hand-built simplified glyph for the favicon variant', () => {
    const html = render('favicon')
    // Spec §3.5: separate glyph with fill-rule="evenodd" + 14×14 dot at (58,-4).
    expect(html).toContain('fill-rule="evenodd"')
    expect(html).toContain('<rect x="58" y="-4" width="14" height="14"')
    // Favicon does NOT use the wordmark's 32×32 dot at (520,-50).
    expect(html).not.toContain('x="520"')
  })

  it('marks the SVG decorative (aria-hidden) when no title is passed', () => {
    const html = render('wordmark')
    expect(html).toContain('aria-hidden')
    expect(html).not.toContain('<title>')
  })

  it('renders an accessible <title> when a title prop is provided', () => {
    const html = renderToStaticMarkup(
      <Logo variant="monogram" title="noorullah" />
    )
    expect(html).toContain('role="img"')
    expect(html).toContain('<title>noorullah</title>')
    expect(html).not.toContain('aria-hidden')
  })
})
