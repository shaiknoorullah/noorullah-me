# noorullah.me v2 — NOOR: a study of light on structure

Cinematic portfolio + writing. Dark studio, a few perfectly lit geometric
forms, enormous type, and a camera that moves like it has mass. The full
design system is specified in `../DESIGN.md`.

## Commands

```bash
npm install     # install dependencies
npm run dev     # dev server -> http://localhost:4321
npm run cms     # dev server + Keystatic admin -> http://localhost:4321/keystatic
npm run build   # static production build -> dist/
npm run preview # serve the production build locally
```

## Architecture

- **Astro 5, `output: 'static'`** — islands architecture, no adapter; the
  deploy artifact is plain static files.
- **One island** (`src/components/scene/Stage.tsx`, `client:only="react"`)
  owns the persistent WebGL canvas, Lenis smooth scroll (wired to GSAP
  ScrollTrigger), the Director, and all DOM choreography
  (`src/lib/choreography.ts`).
- **The Director** (`src/lib/director.ts`) — cinematography as data. Six
  acts (DESIGN.md §4.3) are a shot table anchored to real DOM section ids
  (`hero`, `statement`, `work`, `evidence`, `about`, `writing`, `contact`),
  resolved to scroll progress at runtime, sampled with smoothstep, and
  chased by critically-damped springs. Scroll velocity drives the speed
  ramp (FOV kick, CA/grain scale, aperture). Framework-agnostic by design —
  a Theatre.js sequence could replace the shot table without touching the
  scene components.
- **The set** (`src/components/scene/StillLife.tsx`) — "Nature Morte № 1:
  Substrate": cyclorama, stone plinth, glass monolith, chrome sphere, the
  floating emissive cube, jali gobo casting the lattice in light, plus dust
  and a volumetric shaft. The studio environment is procedural
  (`src/lib/three/environment.ts` → PMREM); no stock assets, no HDRIs.
- **Post stack** (`src/components/scene/Effects.tsx`) — SMAA → DOF → bloom →
  CA → parametric grade → grain → vignette → AgX, using the primitive-object
  pattern (never pass refs through `@react-three/postprocessing` wrapper
  props — see DESIGN.md §7.4).
- **Content collections** (`src/content.config.ts`) — `posts` and `works`,
  glob loaders + zod, mirrored exactly by the Keystatic schema
  (`keystatic.config.ts`). Keystatic is env-gated (`KEYSTATIC=1`) and
  dev-only; production builds are fully static. Drafts are excluded from
  production.
- **Styling** — Tailwind 4 + `src/styles/global.css` tokens (DESIGN.md §2
  is the single source). Fonts via Fontsource, self-hosted.

## Deploy

This directory is the build source. To ship: copy `v2/site/` into
`github.com/shaiknoorullah/noorullah-me` on a `v2` branch; the existing
GitHub Action rsyncs `dist/` to the Contabo box behind Caddy. Preview
first, cut over after review.
