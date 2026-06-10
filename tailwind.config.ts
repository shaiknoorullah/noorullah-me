/**
 * tailwind.config.ts
 *
 * Tailwind v4 is configured via CSS `@theme` directives in `lib/styles/css/`
 * (see spec §3.1) — this config exists for IDE/editor tooling and to declare
 * the content globs explicitly. Theme tokens themselves are sourced from
 * `lib/tokens.css` (frozen, §3.4).
 */
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
    './lib/**/*.{ts,tsx,js,jsx,mdx,css}',
  ],
}

export default config
