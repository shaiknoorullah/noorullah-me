/**
 * postcss.config.mjs — derived from satus seed, slimmed for F2 boot.
 *
 * Satus uses a heavier pipeline with postcss-global-data + postcss-functions
 * + postcss-preset-env feeding generated lib/styles/css/root.css. v1 keeps
 * tokens hand-authored in lib/tokens.css (frozen design system §3.4) so we
 * only need Tailwind v4's PostCSS plugin here. The richer pipeline can be
 * layered back in if we wire up lib/styles/scripts/ later.
 */
const postcssConfig = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default postcssConfig
