---
type: project
subtype: design-system
status: active
version: "1.2.0"
date-created: 22-07-2026
tags: [portfolio, design-system, v2, astro, three-js, gsap, lenis, cinematic, awwwards]
work-category: personal
project: noorullah-me
priority: high
related:
  - "projects/personal/noorullah-me/01-bio.md"
  - "projects/personal/noorullah-me/02-creative-direction.md"
  - "projects/personal/noorullah-me/03-logo-explorations.md"
  - "projects/personal/noorullah-me/v2/reference/opsbench/"
---

# noorullah.me v2 — NOOR: a study of light on structure

> Cinematic minimalism. A dark studio, a few perfectly lit geometric forms, enormous type, and a camera that moves like it has mass. v1 was the loud terminal — brutalist, vibrant, keystroke-driven. v2 is the quiet studio — the same engineer, the same brand pillars, expressed through light, glass, stone, and restraint. The name is the brief: *noor* (نور) means light. The site is a study of how light falls on structure — photorealistic lighting, real depth of field, volumetrics — because the engineer's name literally means *light of God*, and because light is the only decoration a minimal composition can afford.

**Aesthetic targets:** minimalistic, geometric, modern, sleek, smooth, professional — at Awwwards craft level. **Technical targets:** persistent WebGL cinema driven by scroll (Lenis + GSAP ScrollTrigger), photoreal PBR materials, real camera physics, full film post-processing, buttery 60fps with honest degradation.

---

## 1. Brand position

### 1.1. Carry-over from v1 (frozen, unchanged)

The four pillars from `02-creative-direction.md` §2 remain the brand:

| Pillar | v1 expression | v2 expression |
|---|---|---|
| **Substrate over rent** | Terminal cursor, ASCII, showing structural members | Photoreal materials rendered from first principles — custom shaders, procedural environment, no stock assets |
| **Composed under load** | Energy without anxiety | The entire motion language: nothing hurries, nothing snaps, the camera has mass and never shakes |
| **Leverage, not heroics** | Fleet Commander story | One persistent canvas conducting the whole page — one system, many surfaces |
| **Evidence over assertion** | Commit hashes, PR numbers | The numbers strip, the work index, copy that cites PRs and RFCs instead of adjectives |

### 1.2. What changes in v2

| Axis | v1 | v2 |
|---|---|---|
| Register | Loud brutalist terminal | Quiet cinematic studio |
| Metaphor | The site is a TUI | The site is a film about a studio |
| Color | Multi-accent (green/orange/blue) | Monochrome + one tungsten signal |
| Type | Monospace everywhere | Geometric grotesk display + editorial serif + mono meta |
| 3D | Scene-per-section portals | One persistent scene, six camera acts |
| Interaction | Keyboard commands, easter eggs | Scroll cinematography, magnetic tactility |

### 1.3. Tone of voice

Voice rules from `01-bio.md` §Voice rules apply verbatim — specifics beat adjectives, no filler verbs, no exclamation marks, no emoji, mid-IC framing (no Senior/Staff/Principal/Lead titles anywhere). v2 adds one register rule: **captions, not headlines.** Section labels read like museum placards or film slates — `01 — SELECTED WORK`, `FIELD NOTES, 2026` — small, factual, set in mono. The giant display type carries statements; the mono layer carries facts. Never confuse the two.

---

## 2. Identity system

### 2.1. The mark

The **jali lattice** from `03-logo-explorations.md` (Compositions A–D) is the geometric signature of v2. A 4×4 lattice, ~8 cells filled — the fill pattern is deterministic (truncated hash of `noorullah`), giving a structured-but-not-symmetric texture that recurs as: favicon, loader glyph, section-number backing grid, the key-light gobo in the 3D scene (the lattice is literally cast in light on the studio floor), and the footer watermark.

- **Favicon:** 4×4 lattice, bone on ink, 1-bit.
- **Wordmark:** `noorullah` lowercase Space Grotesk 500, tracking −0.02em. The `.me` is dropped in v2 surfaces except the footer and legal.
- **Motion:** one lattice cell flips state every 8 seconds (deterministic sequence). Reduced motion: static.

### 2.2. Color

Monochrome warm-neutral base + a single tungsten signal. The accent is the color of the key light — UI and cinematography share one light source conceptually.

| Token | Value | Role |
|---|---|---|
| `--ink-0` | `#0A0A0B` | Page base |
| `--ink-1` | `#101013` | Raised surface |
| `--ink-2` | `#17171B` | Card / chip |
| `--bone-0` | `#EDEDE8` | Primary text |
| `--bone-1` | `#9C9C97` | Secondary text, captions |
| `--bone-2` | `#55554F` | Muted, rules, indices |
| `--signal` | `#E2B15C` | Tungsten amber — interactive, key-light, one element per viewport max |
| `--line` | `rgba(237,237,232,.09)` | Hairlines |
| `--line-2` | `rgba(237,237,232,.18)` | Emphasized rules |

Rules: never two signal-colored elements in one viewport; cool light (`#6E7BFF` family) exists **only** inside the 3D lighting rig as fill/rim, never in UI; selection color is `--signal` at 30% on ink.

### 2.3. Typography

| Layer | Family | Usage |
|---|---|---|
| Display | **Space Grotesk** (variable 300–700) | Hero lines, section statements, numerals. Tracking −0.03em, uppercase for display lines, line-height 0.95–1.05 |
| Editorial | **Newsreader** (400/400i) | Article body, pull quotes, the about paragraph. Line-height 1.6, measure 62ch |
| Meta | **IBM Plex Mono** (400/500) | Labels, indices, tags, captions, buttons. Uppercase, tracking +0.12em, 11–12px |

Scale (fluid, `clamp`): `d1: clamp(3rem, 9vw, 8rem)` hero · `d2: clamp(2.4rem, 6vw, 5rem)` section statements · `d3: clamp(1.6rem, 3.5vw, 2.75rem)` card titles · `body: clamp(15px, .9rem + .2vw, 17px)` · `meta: 11–12px mono`.

### 2.4. Grid & layout

- 12-column grid, `min(1440px, 92vw)` container, 24px gutters desktop / 16px mobile.
- **Section anatomy** (every section, no exceptions): mono index (`01`) + mono uppercase label + hairline rule across → content → generous air (section padding `18vh` vertical).
- **Broken-grid work index:** cards alternate column spans (`7/5`, `5/7`, `8/4`) with vertical offsets (second column starts `+12vh` down) — editorial asymmetry, never a uniform card wall.
- **Oversized index numerals** (d2-size, `--bone-2`) sit behind cards as depth cues.
- Hairlines (`1px`, `--line`) are the only borders. No cards with backgrounds on the landing; separation is rhythm and rules, not boxes.
- Horizontal section (Principles) breaks the vertical rhythm once — the deliberate accent.

---

## 3. Motion language

Three speeds, never blended. Everything else is forbidden.

| Speed | Duration | Used for | Easing |
|---|---|---|---|
| **Instant** | 120–200ms | Hovers, focus, button press, menu open | `cubic-bezier(.34,1.3,.4,1)` (slight overshoot, mechanical) |
| **Breath** | 600–1200ms | Text reveals, section entrances, image fades | `expo.out` (`cubic-bezier(.16,1,.3,1)`) |
| **Cinema** | 2–4s | Camera moves, act transitions, loader curtain | `power2.inOut` / smoothstep, always spring-smoothed after |

**Scroll:** Lenis `duration: 1.15`, `smoothWheel: true`, wired to GSAP ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`; `gsap.ticker` drives `lenis.raf`; `lagSmoothing(0)`). ScrollTrigger scrubs use `scrub: 0.6–1` so DOM choreography catches up to scroll with the same butter as the camera.

**Camera physics:** critically-damped springs (stiffness ≈ 4.5, damping ≈ 2×√k) chase the scroll-sampled shot — the camera always arrives, never oscillates. Scroll velocity feeds a **speed ramp**: FOV kick ±2°, chromatic aberration ×4, grain ×2, aperture widens — the film "races" when the user flings the page and settles when they stop. This is the single most cinematic trick in the system; keep it subtle.

**Micro-interactions:** magnetic buttons (GSAP `quickTo`, pull factor 0.35, release spring-back 400ms), link underline draw (transform-origin sweep, 180ms), work-row hover (title translates 12px, index brightens, thumbnail clip-path opens), cursor dot + trailing ring (lerp 0.18) that expands over interactive elements. Custom cursor is `mix-blend-mode: difference`, hidden on touch.

**Reduced motion contract:** `prefers-reduced-motion` → Lenis off, GSAP timelines jump to end states, camera springs → instant, speed ramp off, dust/shaft static, marquee static. Content remains 100% reachable.

---

## 4. Cinematography & 3D art direction

### 4.1. The set — "Nature Morte № 1: Substrate"

One persistent scene. A studio cyclorama (seamless curve, warm near-black). On a low stone plinth, three objects — the brand rendered as still life:

| Object | Material | Meaning |
|---|---|---|
| **Monolith** (tall slab, 0.6×2.4×0.6m) | Optical glass — `MeshPhysicalMaterial`, transmission 1.0, roughness 0.04, thickness 0.6, subtle per-channel IOR dispersion via custom shader chunk | The substrate: transparent, load-bearing, bends light without distorting truth |
| **Sphere** (Ø 0.5m, resting on the plinth's edge) | Polished chrome — metalness 1.0, roughness 0.03, sharp env reflections | Precision; the mirror that shows the studio honestly |
| **Cube** (0.18m, floating at 1.4m, slow levitation) | Warm emissive (`#E2B15C`, intensity 3.2) inside frosted glass | *Noor* — the light source, the only self-lit object; it is the key light's visible surrogate |

Plus: a **jali gobo** between key light and set (the lattice cast as long shadows across the floor), **dust motes** (~400 instanced quads, additive, drifting on curl noise, brightened inside the key shaft), and a **volumetric shaft** (cone mesh, fresnel + radial falloff shader — fake but convincing).

### 4.2. Lighting rig (the photorealism contract)

- **Key:** warm tungsten 3200K, large area light, camera-left 45°, elevated 35° — passes through the jali gobo. Shadows: PCF soft, 2048 map.
- **Fill:** cool 5600K, 0.18× intensity, camera-right, broad — lifts shadow floors to `#0A0A0B`, never to gray.
- **Rim:** neutral white, behind-right, tight — separates glass and chrome from the cyclorama.
- **Environment:** procedural studio HDRI (gradient dome + 3 softbox cards) rendered once into a PMREM — no downloaded HDRIs; the studio is built, not rented (pillar 1 made literal).
- **Tone:** `NoToneMapping` on the renderer; **AgX** in the composer (filmic highlights, no clipping on the emissive cube).
- **Exposure discipline:** the emissive cube is the brightest thing in frame; bone text on the page must beat the canvas for attention — canvas sits at ~85% effective luminance behind content.

### 4.3. The six acts (shot list)

The Director (see §7.3) anchors shots to DOM sections; scroll progress samples; springs chase. Lens discipline: 35mm full-frame equivalent — FOV 24–27° — telephoto compression, no wide-angle distortion. One move per act; never two.

| Act | Section | Move | Focus | Grade |
|---|---|---|---|---|
| 0 — Hero | `#hero` | Slow 6s dolly-in from 2m out, then breathing drift (±3cm) | Glass monolith front edge | Neutral-warm, `temp +0.14` |
| 1 — Statement | `#statement` | Camera rises 0.8m, tilts down 4°; objects recede | Rack to infinity (scene defocuses — type owns the act) | Cooler, `temp −0.1`, sat 0.9 |
| 2 — Work | `#work` | Lateral truck left→right, 3m travel, objects parallax | Mid-plane, aperture opens (`ap 1.6`) | Neutral |
| 3 — Evidence | `#evidence` | Crane up + tilt to 45° down — the jali shadow pattern reveals as the composition | Top-down on the lattice | Slightly warm, sat 1.05 |
| 4 — About / Writing | `#about`, `#writing` | Macro push toward the chrome sphere — distorted studio reflections crawl across it | Sphere surface, shallowest DOF of the film (`ap 2.0`) | Neutral, vignette +10% |
| 5 — Contact | `#contact` | Pull-back crane finale to the wide master; the cube brightens (+40%) — the light stays on | Full frame, deep focus (`ap 0.6`) | Warmest, `temp +0.2`, bloom lift |

### 4.4. Post-processing stack (order matters)

`SMAA → DepthOfField (bokehScale ~1.7, worldFocusDistance driven by Director) → Bloom (mipmap, threshold .72) → ChromaticAberration (radial, velocity-scaled) → Grade (parametric temp/sat per act) → Grain (premultiplied, .55 opacity, velocity-scaled) → Vignette (.28/.72) → AgX ToneMapping`. God rays on the key shaft at high tier only. Reduced motion: tone map only.

---

## 5. The landing page (conversion anatomy)

One page, six sections, one conversion goal: **a hiring manager or founder emails `hello@shaiknoorullah.email`.** Every section answers one question and hands off to the next. The CTA appears three times (hero meta, contact block, footer) — never more, always the same action.

### §0 Loader
Black. The jali lattice assembles cell-by-cell (deterministic order), percentage counter in mono. At 100% (fonts + first frame ready), two panels part like a curtain (Cinema speed). Never longer than 1.8s on broadband.

### §1 Hero — *who is this, and why should I keep scrolling?*
- Canvas: Act 0 still life.
- Eyebrow (mono): `SHAIK NOORULLAH — PLATFORM ENGINEER · HYDERABAD, IN → REMOTE`.
- Display (d1, two lines, staggered mask reveal): **"I build the substrate everyone else rents."**
- Meta row (mono, bottom): `OPEN TO PRODUCT-BASED REMOTE TEAMS` · `SCROLL` (animated cue) · `EST. 28 MONTHS IN THE TRADE`.
- Conversion role: positioning in <5 seconds. No adjectives.

### §2 Statement — *what did you actually do?*
Pinned viewport; the paragraph scrubs in word-by-word (opacity + blur out, GSAP ScrollTrigger scrub), one breath per phrase:

> *"Twenty-eight months ago I joined as a backend engineer. The team contracted from eleven to five. I absorbed the platform — and shipped a 99.999%-target multi-cloud Kubernetes PaaS, a 16-RFC platform specification, and a multi-agent engineering platform that lets one engineer run ten tickets in parallel."*

Canvas: Act 1 (scene defocuses; type owns the frame). Conversion role: the entire career case in 45 words, no scrolling away.

### §3 Selected Work — *show me the evidence*
Broken-grid index (§2.4). Four entries, each: oversized ghost index numeral, title (d3), one-line outcome with the number, mono tag row, arrow. Hover: title shifts 12px, a hairline draws, the canvas act trucks sideways with the cursor's row.

1. **Internal Cloud Platform** — ProficientNow · 16-RFC spec, zero-WAN consensus, 99.999% target · `kubernetes gitops ha-postgres`
2. **Fleet Commander** — 35+ agents, HMAC-signed contract gates, $70/month LLM ceiling · `llm-orchestration ci-gates`
3. **AgentHive** — Encrypted P2P mesh for AI coding agents, written in Go · `go p2p crdt`
4. **BLOP / mation-engine** — Terraform for business rules: a universal IR for conditional logic · `typescript rules-engine`

Conversion role: receipts, not claims. Each links to its case entry (Keystatic `works` collection).

### §4 Evidence — *is that real?*
Full-bleed band, hairlines above and below. Six animated counters (mono labels, d2 numerals, count-up on entry): `3,204 commits` · `562 PRs` · `49 RFCs` · `~594k lines shipped` · `99.999% availability target` · `11→5 team absorbed`. Canvas: Act 3 crane reveals the jali shadow lattice — the film's "wide shot" payoff. Conversion role: quantified credibility in one glance.

### §5 About — *who is the human?*
Editorial two-column: left, mono label + portrait-free identity block (name, base, practice anchors — five prayers, Sunday off); right, serif about paragraph trimmed from the 300-word bio, plus a two-column capabilities list (mono, hairline-separated): `kubernetes platform engineering` · `gitops / argocd / helm` · `ha postgres / patroni / wal-g` · `multi-cloud networking / wireguard / cilium` · `observability / otel / prometheus` · `nestjs / typescript / go` · `terraform / ansible / proxmox` · `llm orchestration / agent platforms` · `incident response / forensic rcas` · `technical writing / rfcs`. Canvas: Act 4 macro on the chrome sphere. Conversion role: the person, without inflation.

### §6 Principles — *how do you think?*
The horizontal accent: GSAP-pinned section, four panels truck sideways on vertical scroll. **Substrate over rent** — own the layer below the one everyone stops at. · **Composed under load** — the system absorbs entropy so the work doesn't. · **Leverage, not heroics** — one engineer plus a multi-agent platform beats five without one. · **Evidence over assertion** — the public record is the pitch. Conversion role: culture-fit signal for hiring managers.

### §7 Writing — *does he think in writing?*
Three latest entries from the `posts` collection: date + title + one-line description, full-width rows, hover slides the title and reveals `READ →`. Footer link: `ALL WRITING →` to `/writing`. Conversion role: depth for the careful reader.

### §8 Contact — *how do I reach you?*
The conversion surface. d1 line: **"Build the substrate with me."** One serif sentence: *"I'm looking for a remote, product-based team where engineering quality is a stated and defended value."* Then the single magnetic button: `HELLO@SHAIKNOORULLAH.EMAIL` (mailto). Channels row (mono): `GITHUB` · `LINKEDIN` · `CALENDAR`. Canvas: Act 5 finale — the light stays on. Footer: infinite marquee `SUBSTRATE OVER RENT — COMPOSED UNDER LOAD —`, then the legal line: `© 2026 SHAIK NOORULLAH · HYDERABAD, IN · BUILT WITH ASTRO + THREE.JS`.

---

## 6. Blog (Keystatic CMS)

- **CMS:** Keystatic, git-backed, **dev-mode only** (`npm run cms` → `/keystatic`; production build is fully static — the opsbench pattern). Content lives in-repo at `src/content/`; every edit is a commit.
- **Collections:** `posts` (title, description, date, tags, draft, mdx content) and `works` (same + `order`, `role`, `stack[]`, `outcome`).
- **Index `/writing`:** same section anatomy as the landing; rows sorted by date desc; drafts excluded from production.
- **Article `/writing/[slug]`:** editorial template — mono meta header (date, tags, reading time), Newsreader body at 62ch, hairline-separated, drop cap off, generous margins. The persistent canvas is *not* mounted on articles (reading surface; the film stays home). MDX supports code blocks with mono styling.
- **Feeds:** RSS at `/rss.xml`, sitemap via `@astrojs/sitemap`.
- Seed content: 2 posts + 4 works (the four landing entries).

---

## 7. Technical architecture

### 7.1. Stack (mirrors opsbench `site/` + GSAP per the v2 brief)

| Layer | Choice | Note |
|---|---|---|
| Framework | **Astro 5** (`output: 'static'`) | Islands; static deploy via existing rsync CI |
| Islands | **React 19** + `@astrojs/react` | One island (`Stage.tsx`) owns canvas + all client motion |
| CMS | **Keystatic** (`@keystatic/astro` + `@keystatic/core`) | Env-gated (`KEYSTATIC=1`), dev-only admin |
| Content | Astro Content Layer (`glob` loader, zod) | `posts`, `works` |
| Smooth scroll | **Lenis** | Drives ScrollTrigger |
| Animation | **GSAP 3 + ScrollTrigger** | Scrubs, pins, magnetic, timelines |
| 3D | **three 0.175 + @react-three/fiber 9 + drei 10** | Persistent canvas, `client:only` |
| Post | **@react-three/postprocessing 3 + postprocessing 6.37** | §4.4 stack |
| Shaders | Raw GLSL strings + `ShaderMaterial`; grade as custom `Effect` | §4 |
| Styling | **Tailwind 4** (`@tailwindcss/vite`) + `global.css` tokens | §2 tokens are the single source |
| Fonts | Fontsource: Space Grotesk var, Newsreader, IBM Plex Mono | Self-hosted via npm, no CDN |
| Feeds/SEO | `@astrojs/rss`, `@astrojs/sitemap`, JSON-LD `Person` | Static OG image |

Version pins: copy `reference/opsbench/package.json` exactly, add `gsap@^3.13.0`.

### 7.2. File map

```
v2/site/
  package.json  astro.config.mjs  tsconfig.json  keystatic.config.ts
  README.md     (dev / cms / build / deploy commands)
  src/
    styles/global.css          tokens + type + section anatomy + utilities
    content.config.ts          posts + works (zod)
    content/posts/*.mdx        2 seeds
    content/works/*.mdx        4 seeds
    layouts/Base.astro         head/meta/fonts/loader/nav/footer slots
    lib/store.ts               mutable scroll+quality state (never React state)
    lib/director.ts            shot table, DOM anchoring, springs, speed ramp
    lib/choreography.ts        DOM reveals, counters, magnetic, marquee, cursor
    lib/three/environment.ts   procedural studio env -> PMREM
    lib/three/materials.ts     glass / chrome / stone / emissive
    lib/three/effects.ts       GradeEffect (parametric temp/sat GLSL)
    components/scene/
      Stage.tsx                the island: Canvas + Lenis + GSAP + Director
      Rig.tsx                  per-frame director binding
      StillLife.tsx            monolith + sphere + cube + plinth + gobo
      Dust.tsx  LightShaft.tsx
      Effects.tsx              composer stack (primitive-object pattern!)
    pages/
      index.astro              the landing (all 8 sections)
      writing/index.astro  writing/[...slug].astro  rss.xml.ts
```

### 7.3. The Director pattern (from opsbench, adopted verbatim in spirit)

Shots are **data** (pos/tgt/bloom/aperture/temp/sat/fog/roll/focus per act), anchored to real DOM section offsets at runtime, resolved to scroll progress `p`, sampled with smoothstep, chased by critically-damped springs. `store.ts` holds mutable `scrollState` (60Hz — never React state). The adapter seam means a Theatre.js sequence could replace the shot table later without touching scene components.

### 7.4. Hard-won pitfalls (from opsbench — respect these)

1. **Never pass refs through `@react-three/postprocessing` wrapper props** — it memoizes with `JSON.stringify(props)` and crashes on the scene graph's circular references under React 19. Instantiate effects directly, drive them imperatively in `useFrame`, mount via `<primitive object={fx} dispose={null} />`.
2. `gl={{ toneMapping: THREE.NoToneMapping }}` — grade lives in the composer (AgX), or colors double-map.
3. Canvas is `client:only="react"` — no SSR of WebGL.
4. Quality tiers (`high/mid/low` via deviceMemory/cores/renderer-string): low tier drops DOF + god rays, caps DPR 1.5, halves dust count.
5. Rebuild director anchors on `resize` and after `document.fonts.ready` (type metrics move section offsets).
6. Fonts via Fontsource imports — layout must not shift on font load (preload + `font-display: swap` metrics-safe).

### 7.5. Budgets

60fps on mid-tier GPU (M1/1660 class), 30 locked on low; initial JS < 250KB gz (canvas island is the bulk — everything else is near-zero); LCP < 2.5s; CLS < 0.05; Lighthouse ≥ 95 all axes; contrast ≥ 4.5:1; full keyboard reachability; canvas `aria-hidden` with a visually-hidden textual scene description.

---

## 8. Build status & next

- **This doc + `reference/opsbench/`** are the complete brief. The implementation lives in `v2/site/` (Astro project, buildable with `npm install && npm run build`).
- Deploy path (out of scope here): copy `v2/site/` into `github.com/shaiknoorullah/noorullah-me` on a `v2` branch; existing GH Action rsyncs `dist/` to the Contabo box behind Caddy. Preview first, cut over after review.
- Future: Theatre.js replacement of the shot table; case-study deep pages per work; the v1 easter-egg catalogue deliberately does **not** carry over (v2's restraint is the point); OG image generator; `now.noorullah.me` stays with v1 planning.

## 9. References

- Opsbench site (stack + patterns): `v2/reference/opsbench/` (13 files, mirrored from `github.com/shaiknoorullah/opsbench/site/`)
- Voice + bio: `../01-bio.md` · Brand pillars: `../02-creative-direction.md` · Mark: `../03-logo-explorations.md` (Compositions A–D)
- v1 spec (what v2 deliberately is not): `../04-v1-implementation-spec.md`

---

# PART II — v1.1 art-direction revision (22-07-2026, SemVerDoc MINOR)

> Triggered by the first visual QA pass (headless-Chrome screenshot sweeps, desktop 1440×900 + mobile 390×844). This part **supersedes** §2.2 (palette), §4.1 (the set), §4.2 (environment), and extends §3 (motion) and §5 §2 (statement). Where Part I and Part II conflict, Part II wins.

## 10.1 — Palette: back to v1, high-contrast

The warm tungsten/bone palette is retired. v2 adopts the v1 palette (§4.1 of `02-creative-direction.md`), applied with cinematic restraint: pure black, near-white type, one electric signal. "Contrasty" is the brief.

| Token | Value | Role |
|---|---|---|
| `--ink-0` | `#000000` | Page base, true black |
| `--ink-1` | `#0A0A0C` | Raised surface |
| `--ink-2` | `#16161A` | Card / chip |
| `--bone-0` | `#F2F2F5` | Primary text |
| `--bone-1` | `#A0A0A8` | Secondary text |
| `--bone-2` | `#5C5C66` | Muted, indices, rules |
| `--signal` | `#A4EB53` | Cursor green — interactive, the emissive light source in-scene |
| `--ember` | `#FF6B1A` | Secondary accent — rim-light warmth, selection, rare hover |
| `--ionic` | `#003FFF` | 3D fill-light tint only, never UI |
| `--line` / `--line-2` | `rgba(242,242,245,.10)` / `.18` | Hairlines |

Selection: signal at 30%. Rule unchanged: one signal element per viewport max. In the 3D rig the palette maps to light: key = neutral 5600K white softbox, accent practical = the green emissive cube ("the cursor is the light"), rim = ember-warm, fill = ionic-tinted cool.

## 10.2 — The set: "Strata" (Blender-authored, supersedes §4.1)

The primitive still life (box + sphere + cube) read as low-poly placeholder art. The new hero asset is **authored in Blender 4.2 (headless bpy), exported to GLB** — the opsbench `assets/blender → baked` pipeline. Concept: a monolith deconstructed into its substrate layers.

- **The stack:** five horizontal glass slabs (1.1 × 0.55 × 0.9 m each), floating with 12 mm gaps, each rotated a progressive 1.5–3° — an exploded monolith. Materials alternate clear optical glass / frosted / smoked. **The green emissive cube (0.18 m) is suspended in the center gap**, refracting through its neighbors.
- **The base:** honed black granite plinth (2.6 × 0.35 × 1.4 m), 20 mm edge bevels, procedural stone bump; a spherical seat boolean-carved for the **chrome sphere (Ø0.5 m)** so the contact reads physically.
- **The jali screen:** a real geometric lattice (4×4 grid, 25 mm frames, 1.6 × 2.4 m, dark bronze) standing 2 m behind-left — the key spot passes through it, so the lattice shadow is *geometry-cast*, not a texture trick.
- **Counterweight:** a low brushed-metal bar (0.9 × 0.12 × 0.12 m, anisotropic) across the plinth front.
- Every edge beveled (4–20 mm), weighted normals, ≤ ~150k tris total.
- **Environment:** a real studio HDRI rendered in Cycles (equirect 2k: large 5600K key card, cool strip right, warm low card, dark room) → `scene.environment`. Replaces the procedural PMREM.

## 10.3 — SDF statement text (supersedes the DOM serif in §5 §2)

The pinned statement becomes **in-canvas SDF text** (`troika-three-text`, Newsreader italic static TTF bundled in `public/fonts/`). ~45 words as individual text objects, each with its own shader uniforms, driven by the statement's ScrollTrigger progress:

1. **Per-word reveal** — opacity + y-drift + slight rotateX per word along the scrub (choreographed, not a fade block).
2. **Depth-graded fill** — bone-0 foreground words → bone-1 as the line recedes.
3. **Signal emphasis** — the evidence words ("99.999%-target", "16-RFC", "multi-agent") get a green edge-glow shimmer (fresnel-ish SDF-border band, phase-animated).
4. **Velocity dissolve** — scroll speed feeds a fine noise-erode on glyph edges; text "resists" fast scrolling, settles crisp.

Accessibility: the DOM paragraph remains, visually-hidden (screen readers, SEO, no-WebGL, reduced motion). About/contact serif stay DOM — readability beats spectacle there.

## 10.4 — Particle atmosphere (supersedes §4.1 dust)

~6,000 particles in three depth strata, custom `Points` shader (soft discs, per-particle size/phase/speed/tint attributes): **far field** (4,000, dim, slow, deep), **mid field** (1,800), **near bokeh motes** (~60 large soft discs, strong parallax, half-defocused feel). Drift = layered sine fields (cheap curl), twinkle = phase sin, brightness boosted inside the key cone, depth-fade both ends. 95% bone-white, 5% signal green. Low tier: halve counts, drop near layer.

## 10.5 — Volumetrics & fog upgrade

- **Key volumetric:** spot-cone mesh with radial soft edge + axial falloff + animated fbm density + **jali cookie mask** (canvas lattice texture matching the physical screen) + world-Y floor fade. The geometry-cast lattice shadow and the volumetric cookie agree — light is one system.
- **Fill cone:** thin, cool, low-density counter-cone from the right.
- **Fog:** `FogExp2` per act (director-driven density), color matched to true black; god rays stay high-tier.
- **DOF:** rack focus animated between acts (director already lerps `worldFocusDistance` — make the transition *audible*: faster pull on act entry, settle 0.8s).

## 10.6 — Magnetic scroll

Lenis 1.3's official `Snap` module: `lerp 0.085` (heavier glide), proximity snap (`debounce 120ms`, `duration 1.1s`, expo easing) anchored to act boundaries — **excluding** the statement pin range and the principles horizontal range (pins own their scrub). Principles gets `ScrollTrigger.snap: 1/3` so panels land crisply. Disabled under reduced motion. Buttons keep their magnetic hover (distinct mechanism).

## 10.7 — Inconsistency register (found in the v1.0 QA sweep; all must close)

- **R1** Mobile hero: monolith swallows the frame and hides the eyebrow — portrait re-framing (dolly ×1.6, composition shifted, FOV +4 on aspect < 1).
- **R2** Text over bright 3D without scrim (hero meta row, work body/tags, statement tail) — stronger scrim coverage; on ≤768px a 35% dim layer behind content sections.
- **R3** Stray hairlines crossing body text (visible through the statement paragraph) — hairlines only at true section boundaries; audit every `.sec-head` / `.hairline-*`.
- **R4** Ghost numerals colliding with interactive rows in work — numerals fully behind (z −1), dimmer, offset from text blocks.
- **R5** Principles has no camera act — new Act 4.5: lateral truck bound to horizontal progress.
- **R6** About/principles framing too close (plinth fills frame, blown sphere speculars) — re-block Acts 4–5 wider/higher; exposure rebalance.
- **R7** Mobile nav: CONTACT kisses the viewport edge — tighter tracking under 480px.
- **R8** Sphere cropped at mobile hero right edge — same portrait re-frame as R1.
- **R9** Palette amber → v1 green/ember/ionic (§10.1).
- **R10** Loader lattice: add the deterministic 8s cell-flip from §2.1.
- **R11** "CALENDAR" is a mailto — dishonest label; drop it, keep GITHUB / LINKEDIN.
- **R12** Island bundle 369KB gz — vendor `manualChunks` (three / postprocessing / gsap) + defer island mount past LCP.
- **R13** Monolith overexposed to white on some GPUs — exposure discipline pass; AgX shoulder keeps highlights rolled off.

## 10.8 — Agency reference (basement.studio / Immersive Garden / Lusion)

What their work shares, and what we adopt: **one authored hero asset, never primitives** (§10.2); **macro cinematography** — long lens, shallow DOF, camera moves with mass (director springs, §4.3); **light as the only decoration** — real gobos, volumetrics, motivated sources (§10.5); **atmosphere everywhere** — deep particle fields with bokeh strata (§10.4); **type as renderable geometry** when it's the protagonist (§10.3); **grade, don't filter** — AgX + parametric temp/sat + grain + halation-adjacent bloom (§4.4). What we deliberately don't copy: full-screen video backgrounds, scrolljacking beyond gentle snap, novelty cursors that fight usability.

---

# PART III — v1.2 materials & optimization revision (22-07-2026, SemVerDoc MINOR)

> Supersedes §4.4's material simplicity and §7.5's budget table where they conflict. The set moves from flat PBR constants to a full Substance-style texture pipeline; the renderer gains advanced material features and a static-scene optimization pass.

## 11.1 — Advanced texturing (the Substance-style pipeline)

`tools/blender-strata/build_textures.py` (headless Blender 4.2): imports `strata.glb`, smart-UV-unwraps the set, **bakes AO + curvature (Pointiness) in Cycles**, then synthesizes final maps in numpy (fbm/ridged/blob/streak fields, Sobel→normal). Outputs per-material sets (`albedo.webp` / `roughness.webp` / `normal.png` / `ao.webp`) at `site/public/assets/textures/<material>/`:

| Material | Maps | Signature detail |
|---|---|---|
| `granite` (plinth, 2k) | albedo, roughness, normal, AO | Ridged veins, mottled base, **edge-polished bevels from the curvature bake**, AO in the sphere dish |
| `floor` (2k) | albedo, roughness, normal, AO | Large-scale concrete mottling, directional streaks, contact AO grounding the set |
| `chrome` (sphere, 1k) | albedo, roughness, normal, AO | Handling-smudge blobs, micro swirl scratches |
| `glass_clear` (1k) | albedo, roughness, normal, AO, `smudge` mask | Smudge patches + micro scratches (drives the clearcoat layer, not the base glass) |
| `glass_frosted` (1k) | albedo, roughness, normal | Fine frost grain normal |
| `brushed` (bar, 1k) | albedo, roughness, normal, AO | U-directional brush streaks, worn polished edges |
| `bronze` (jali, 1k) | albedo, roughness, normal, AO | **Patina in the recesses** (inverted curvature), polished worn edges, pitting |
| `lens-dirt.webp` (1k) | FX overlay | Radial edge-weighted dust/specks for the post stack |

`strata_1..4` share `strata_0`'s UV layout and AO (identical topology). GLB re-exported **with UVs + Draco compression** (`export_draco_mesh_compression_level=6`).

## 11.2 — Material/shader upgrades (three.js side)

- Glass: base `MeshPhysicalMaterial` (transmission/dispersion as v1.1) + **clearcoat smudge layer** (`clearcoatMap`/`clearcoatRoughnessMap` from the smudge mask) + micro-scratch `normalMap`; smoked slab adds subtle **thin-film iridescence** (`iridescence 0.15`, IOR 1.3).
- Brushed bar: `anisotropy 1.0` with computed tangents (UV-aligned brush direction) + anisotropic highlight response.
- Chrome/granite/bronze/floor: full map sets; `aoMap` via `texture.channel = 0`; anisotropic texture filtering (8×) on floor/granite for glancing angles.
- Grade (custom `GradeEffect` extended): parametric temp/sat + **S-curve contrast**, **split-toning** (cool shadows / warm highlights), highlight rolloff into AgX.
- Halation: second wide-radius low-intensity bloom pass (red-leaning tint) — film-emulation highlight bleed.
- Lens dirt: screen-blend overlay (`lens-dirt.webp`, opacity ≤ .08), highlights only via the baked radial mask.

## 11.3 — Static-scene optimization

- **Draco** for the GLB (decoder at `public/draco/`, `GLTFLoader.setDRACOLoader`).
- **Frozen shadows**: `renderer.shadowMap.autoUpdate = false`, updated once on load — the set is static; the levitating cube doesn't cast (its light does the work).
- **Baked AO everywhere** — no runtime SSAO.
- **Adaptive DPR**: fps monitor drops DPR 1.75 → 1.5 → 1.25 under sustained <50fps; restores on recovery.
- **Shader warmup**: `renderer.compileAsync` before the loader lifts.
- **Tab-hide pause**: raf loop suspends on `visibilitychange`.
- Texture budget: ≤ 2k, WebP q90 color maps, PNG normals; `texture.anisotropy = 8` only where glancing angles matter.
