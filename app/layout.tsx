// Root layout — wraps every route.
//
// Tokens must load BEFORE any tailwind / component CSS so the cascade-layer
// order is correct. Spec: projects/personal/noorullah-me/04-v1-implementation-spec.md
// §3.4 (tokens), §3.1 (TS strict, no any), F5 (fonts), F12 (smoke route).
import '../lib/tokens.css'

import type { Metadata, Viewport } from 'next'
import type { JSX, ReactNode } from 'react'
import { fontsVariable } from './fonts'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.noorullah.me'),
  title: {
    default: 'noorullah.me',
    template: '%s · noorullah.me',
  },
  description:
    'Shaik Noorullah — platform / infrastructure engineer. Multi-cloud Kubernetes, multi-agent leverage, FOSS-first. Hyderabad → US-remote.',
  applicationName: 'noorullah.me',
  authors: [{ name: 'Shaik Noorullah' }],
  creator: 'Shaik Noorullah',
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  // `fontsVariable` exposes --font-mono, --font-pixel, --font-serif on <html>.
  // next/font injects @font-face + size-adjust metrics at build time, so the
  // first paint already has the right family/metrics → no FOUT, no CLS.
  // Spec: projects/personal/noorullah-me/04-v1-implementation-spec.md §3.4 + F5
  return (
    <html lang="en" className={fontsVariable}>
      <body
        style={{
          margin: 0,
          background: 'var(--ink-0)',
          color: 'var(--bone-0)',
          fontFamily: 'var(--mono)',
        }}
      >
        {children}
      </body>
    </html>
  )
}
