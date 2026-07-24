---
type: project
subtype: index
status: active
date-created: 22-07-2026
tags: [portfolio, v2, redesign, astro, three-js, cinematic]
work-category: personal
project: noorullah-me
priority: high
related:
  - "projects/personal/noorullah-me/v2/DESIGN.md"
---

# v2 — NOOR: cinematic redesign

The v2 redesign of noorullah.me. Where v1 is the loud brutalist terminal, v2 is the quiet cinematic studio — minimalistic, geometric, photoreal WebGL, scroll-driven cinematography.

| Path | Purpose |
|---|---|
| `DESIGN.md` | **Read first.** Complete design system (v1.1): brand, tone, v1-palette, type, grid, motion, six-act cinematography, Strata scene, SDF statement text, landing anatomy, technical architecture, budgets, v1.1 inconsistency register §10.7 |
| `site/` | The implementation — Astro 5 + React 19 + Three.js/R3F + GSAP + Lenis + Keystatic CMS + troika SDF text. See `site/README.md` for dev/build commands |
| `tools/blender-strata/` | `build_strata.py` — headless Blender pipeline that authors the Strata hero asset (`site/public/assets/strata.glb`) + studio HDRI (`studio.hdr`) + preview renders. Re-run with `blender -b --factory-startup -P build_strata.py` |
| `tools/blender-4.2.3-linux-x64/` | Portable Blender 4.2.3 LTS used by the pipeline (gitignored, re-downloadable) |
| `reference/opsbench/` | 13 files mirrored from `github.com/shaiknoorullah/opsbench/site/` — the proven stack + patterns (Director, Stage, Effects, Keystatic wiring) this build extends |

Supersedes nothing: v1 docs (`../02-creative-direction.md`, `../04-v1-implementation-spec.md`) remain the terminal-aesthetic branch's truth. v2 is a parallel direction per the 22-07-2026 request; the two converge (or one wins) at deploy time.
