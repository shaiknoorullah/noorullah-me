import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

/**
 * next.config.ts — ported from darkroom.engineering/satus (F2 strip-skeleton).
 * Source of truth for satus mappings: project spec §3.1.
 *
 * Trimmed:
 * - Storybook proxy block (not in v1 scope, see spec §1)
 * - Sanity image remotePatterns (added back in F-Sanity later)
 *
 * Kept:
 * - turbopack SVGR rule (used by lib/styles + future components)
 * - security headers
 * - bundle analyzer wrapping
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps:
    process.env.SOURCE_MAPS === 'true' && typeof Bun === 'undefined',
  typedRoutes: true,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              memo: true,
              dimensions: false,
              svgoConfig: {
                multipass: true,
                plugins: [
                  'removeDimensions',
                  'removeOffCanvasPaths',
                  'reusePaths',
                  'removeElementsByAttr',
                  'removeStyleElement',
                  'removeScriptElement',
                  'prefixIds',
                  'cleanupIds',
                  {
                    name: 'cleanupNumericValues',
                    params: { floatPrecision: 1 },
                  },
                  {
                    name: 'convertPathData',
                    params: { floatPrecision: 1 },
                  },
                  {
                    name: 'convertTransform',
                    params: { floatPrecision: 1 },
                  },
                  {
                    name: 'cleanupListOfValues',
                    params: { floatPrecision: 1 },
                  },
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  compress: true,
  experimental: {
    optimizePackageImports: [
      '@react-three/drei',
      '@react-three/fiber',
      'gsap',
      'three',
      'lenis',
      'zustand',
    ],
  },
  devIndicators: false,
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [90],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
}

const bundleAnalyzerPlugin = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default bundleAnalyzerPlugin(nextConfig)
