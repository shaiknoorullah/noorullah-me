---
type: spec
status: approved-concept
date: 2026-07-23
concept: The Substrate (merged G121+A1)
process: superpowers brainstorming → writing-plans
---

# The Substrate — Scene Replacement Spec (v2, Part IV)

> Supersedes DESIGN.md §10.2 ("Strata" set) and any part of §4 that conflicts. Everything not mentioned here (palette, type, grid, motion language, landing anatomy, blog, technical architecture) stays as DESIGN.md v1.2 states.

## 1. Concept (locked)

One motherboard slab floats in true-black space, fog pooling beneath. Black solder mask as bedrock, component districts as structures, CPU socket as monument. Green signal pulses (#A4EB53) ride the board's **actual copper traces** via a trace-derived emissive mask — never overlaid lines. Acts 1–4 live at board scale; Act 5 lifts the CPU heatspreader and dives into the exposed die (second nested scale); Act 6 pulls back as one pulse crosses the board edge-to-edge and every district answers.

**Thesis:** "I build the substrate everyone else rents" — literal, at two scales. **Cohesion:** single subject, single set, single light story; the pulse is the only continuous performer and hands off every act boundary.

**Name of the set:** *Substrate*. Replaces "Strata" everywhere (StillLife.tsx, strata.glb, docs).

## 2. Provenance & references (locked decisions)

- User picked The Substrate over The Plenum (2026-07-23). Plenum-derived elements that port: loader polish (`SUBSTRAT▓` decode mock — best loader frame), the audio *restraint discipline* (not the voices/footsteps — those were Plenum-fiction).
- Techniques are adopted per verified evidence, never copied: corn teardown (`tools/reference-capture/REPORT.md`), aten7 teardown (`tools/aten7-capture/PART1..6`), photoreal research matrix (bake-first hybrid), storyboard `tools/storyboards/the-substrate/`.

## 3. The set (Blender-authored assembly)

| Element | Source | Notes |
|---|---|---|
| Hero board | "MotherBoard + Components" — Daniel Cardona, CC-BY 4.0, uid `3bc94057328243d4b341a55f59160f8a`, 82k tris | Arrives components-down → rotate −90°X. Real relief 0→2.0u. Materials rebuilt: near-black solder mask, restrained component PBR; consolidate ~20 paint mats → 2–3; textures → 1–2K KTX2 |
| Die (Act 5) | "Microchip - Prototype" — re1monsen, CC-BY 4.0, uid `7d00abe914664a17b4bf18c6e851e7eb`, 98k tris | Imported emissive forced to #A4EB53 ≤0.04 strength; albedo darkened |
| Backup board | "MAXIMUS VI Formula" — Vivien Deroche, CC-BY 4.0 | Only if hero board fails QA |
| Plinth/floor/fog | Blender-authored | Honed black granite (existing granite material), fog = gradient sprite + scene fog (no true volumetrics) |
| Trace-pulse system | Blender trace-mask bake + runtime shader | §5 |

Export: single `substrate.glb` (board+die+plinth) with `EXT_meshopt_compression` (meshopt, not Draco — decode speed), target ≤ 6 MB total download; plus `studio.hdr` (existing) and trace-mask textures.

## 4. Six acts (Director shot table re-authored)

| Act | Section | Move | Focus | Grade |
|---|---|---|---|---|
| 0 Hero | `#hero` | Grazing 70mm dolly across the slab (night-flyover), 6s then breathing drift | Front edge of component relief | Neutral, temp +0.1 |
| 1 Statement | `#statement` | Dolly halts, rack to infinity — board dissolves to bokeh, pulses persist as soft threads | Infinity (type owns act) | Cooler, sat 0.9 |
| 2 Work | `#work` | 50mm truck at capacitor-tower height through VRM/DIMM districts; 3 staggered pulse lanes | Mid-plane, ap 1.6 | Neutral |
| 3 Evidence | `#evidence` | Crane to dead top-down; board resolves to transit/network map, socket as interchange | Top-down | Slightly warm, sat 1.05 |
| 4 About | `#about` | Macro approach → IHS lifts (one slow mechanical move) → descent into die; logic blocks wake green in sequence | Die surface, shallowest DOF | Neutral, vig +10% |
| 5 Contact | `#contact` | Pull-back through socket frame; one pulse crosses edge-to-edge, every district answers | Full frame, deep focus | Warmest, bloom lift |

Board→die scale continuity: the die macro set is geographically matched to the socket region of the hero board (same corner orientation), so the dive reads as one space.

## 5. Signature systems

### 5.1 Trace pulses (the instant-reject-clause system)
- **Mask:** baked in Blender from board UVs — emissive-mask texture where real copper trace corridors carry a 0→1 gradient along their length (Resn gradient-map mechanism applied to copper, evidence: corn `gradient-map.png`).
- **Runtime:** emissive shader `fract(uTime*speed + lane.offset)` window sampled over the mask; 3–6 lanes max, staggered; pulse brightness ≤4 (AgX rolls to yellow-white above ~5); a dim point light rides the primary pulse for spill (proven in storyboard renders).
- **Restraint gate:** if pulses read as gamer-RGB or "lines on an image," lanes get culled, not brightened.

### 5.2 Board→die transition (Act 3→4 handoff)
GPGPU particle re-formation (aten7 `GPUComputationRenderer` pattern): position+velocity float textures; board-trace target positions and die-block target positions as two baked attributes; spring-to-target + curl noise; brightness keyed to velocity; normal alpha blending; points count ≤ 65k mid-tier. This is the site's one "spectacle" moment — everything else is restraint.

### 5.3 Loader (aten7 grammar, Plenum-polished)
True black + 2–4% lift. Kicker mono: `SUBSTRATE // BOARD LEVEL ACCESS`. Title `SUBSTRATE` mid-decode — per-char 3-layer glyph stack (final / scramble subset / resolving-flash), progress = `loadingManager.onProgress × 1.05` on a paused GSAP timeline; resolving char flashes #A4EB53 once, settles bone. Status line re-scrambles: `ESTABLISHING LINK ▮▮ PLEASE WAIT`. Board scene at ~3.5% luminance behind dark glass. **Forced dwell: CLICK TO ENTER arms at `isLoaded + 5s`.** First click unlocks audio + fires first SFX in the same gesture. Loader ≤ 1.8s on broadband after cache; dwell is the pacing, not the load.

### 5.4 Dust (corn optical model, replaces ParticleField look)
Point sprites, hexagon polygon-DF shape, **in-shader DOF: out-of-focus = bigger + softer + dimmer** (`vSize = smoothstep(...)`), 3D simplex advection, twinkle 30–200s, **normal alpha blending (not additive)**, brightness boost only inside the key shaft (`smoothstep` to shaft axis — hyperfocus motif). Counts: 4000 far / 1800 mid / 60 near; half on low tier.

### 5.5 Text
- DOM body/chrome text stays DOM (readability). Section headings get the **decode component**: per-char scramble (designed subset glyphs), random per-letter order, green only mid-decode, settle bone. Triggered on section entry, once.
- Statement section keeps troika SDF in-canvas text (existing StatementText), upgraded with the along-path gradient-dash emphasis for evidence words (existing mechanism, keep).
- MSDF (not troika) only if in-scene labels are needed for the transit-map act — deferred, YAGNI unless Act 3 review demands it.

### 5.6 Audio (aten7 restraint, budget <4 MB)
Unlock on enter-click. One 90s ambient bed (dark room-tone), crossfaded at act boundaries via GSAP gain tweens. **Muffle:** any overlay/menu open sweeps lowpass 22kHz→200Hz, 6s expo.out, volume 0.8→0.3. UI micro-SFX near-subliminal (−30dB under bed): 125ms leave / 359ms enter grammar on links/buttons, menu-open staggered tick cascade synced to link decrypts. Silent loader until enter-click. No scroll sounds. `visibilitychange` pauses all. Reduced-motion ⇒ audio off by default.

### 5.7 Post stack (order locked)
SMAA → (GodRays high tier, sun = pulse light) → DOF (disk-bokeh 8-tap hash-rotated, corn model, director-driven focus) → Bloom (mipmap, selective, threshold .72) → ChromaticAberration (velocity-scaled) → Grade (parametric temp/sat per act + **blue-channel curve LUT**, aten7 `uBlueCurve` pattern) → Grain (velocity-scaled) → Vignette → AgX. Reduced motion: AgX only.

## 6. Lighting & materials
- Rig unchanged in concept: 5600K key (camera-left, soft), cool #3552E8 fill ~15%, ember #FF6B1A rim, green practical at the pulse. Never aim saturated blue + orange at the same glossy curve (storyboard lesson).
- Board materials: near-black solder mask (albedo ~0.02–0.04, roughness .5), components matte black/metal with restrained roughness; gold contacts roughness .3; die silicon with subtle iridescence (iridescence 0.15, IOR 1.3).
- Baked AO everywhere (Cycles bake in the texture pipeline); realtime PMREM env (existing studio.hdr) for specular life; **no runtime SSAO needed**; frozen shadow map (static set).
- Photoreal ceiling: bake-first hybrid per research matrix. `three-gpu-pathtracer` converge-when-still hero mode is a **post-MVP spike with hard cutoff**, never the base path.

## 7. Performance & degradation (budgets unchanged from DESIGN.md §7.5)
60fps mid-GPU (M1/1660), 30 locked low. GLB ≤ 6MB, textures ≤ 2K KTX2, initial JS < 250KB gz (manualChunks stays). Ladder: high (2K maps, GodRays, full dust, DPR ≤1.75) → mid (1K, no GodRays, half dust, DPR 1.5) → low (lightmap/AO only, no post but grain, DPR 1) → failsafe (baked unlit MeshBasicMaterial). Adaptive DPR on sustained <50fps.

## 8. Accessibility & SEO
Canvas `aria-hidden` + visually-hidden scene description (rewritten for the board). DOM h1 proxies for the decode title (aten7 pattern). Statement DOM paragraph stays visually-hidden but present. Reduced-motion contract per DESIGN.md §3 + audio off. Contrast ≥ 4.5:1; decode animation never blocks readability (settles ≤1.2s).

## 9. Credits (CC-BY obligations)
New footer block on landing + a `/credits` section in footer legal line:
- "MotherBoard + Components" by Daniel Cardona (sketchfab.com), CC-BY 4.0
- "Microchip - Prototype" by re1monsen (sketchfab.com), CC-BY 4.0
- (if used) "MAXIMUS VI Formula" by Vivien Deroche, CC-BY 4.0
Format: `Model "<name>" by <author> [link], licensed CC-BY 4.0, modified (re-materialed, re-lit, optimized)`.

## 10. Technique adoption ledger (adopt / adapt / skip)
| Technique | Source | Verdict | Why |
|---|---|---|---|
| Gradient-dash pulses | corn gradient-map | ADOPT | proven mechanism, fits traces |
| GPGPU particle re-formation | aten7 | ADOPT (1 moment) | board→die transition |
| Decode text (3-layer, green-transitional) | aten7 | ADOPT | headings + loader |
| Loader-as-boot + forced dwell | aten7 | ADOPT | pacing, audio unlock gesture |
| Audio muffle (lowpass sweep) | aten7 | ADOPT | overlay polish |
| Optical-DOF dust, hexagon sprites, slow twinkle, alpha blending | corn | ADOPT | fixes bokeh-look |
| LUT grade (blue curve) | aten7/corn | ADOPT | one grade system |
| Baked AO + realtime PMREM specular | research matrix | ADOPT | photoreal hybrid |
| Camera flights baked as glTF | aten7 | ADAPT | keep Director springs; bake only the Act-5 dive path |
| Matcap hero shader | corn | ADAPT | realtime PBR fits metals; matcap only inside die if PBR falls flat |
| MSDF text | corn/aten7 | ADAPT (deferred) | troika already covers statement; MSDF only if Act 3 needs labels |
| Bake-everything-into-albedo | corn | SKIP | kills view-dependent metal/glass life |
| Hard section-snap scroll | corn | SKIP | Lenis butter-scroll stays; adopt one-beat-per-gesture pacing only |
| True volumetrics | — | SKIP | shader cards + depth fog |
| DOF as lens sim | — | SKIP (runtime) | disk-bokeh post per corn/aten7 restraint |

## 11. Files touched (map for the plan)
- Replace: `public/assets/strata.glb` → `substrate.glb`; `src/components/scene/StillLife.tsx` → `SubstrateSet.tsx` (new loader+materials+pulses); `ParticleField.tsx` (optical-DOF rewrite); `lib/director.ts` (shot table re-author, §4); `lib/three/rig.ts` (new anchors); `lib/three/materials.ts` (board/die/pulse materials); `LightShaft.tsx` (shaft cards retune).
- New: `src/components/scene/DieDive.tsx` (Act 5 set + GPGPU transition), `src/components/ui/DecodeText.tsx`, `src/components/ui/Loader.tsx` rewrite, `src/lib/audio.ts`, `tools/blender-substrate/` (assembly + trace-mask bake + texture pipeline).
- Modify: `Effects.tsx` (post stack §5.7), `layouts/Base.astro` (loader markup, credits line), `pages/index.astro` (credits block, sr scene description), `choreography.ts` (heading decode triggers).
- Untouched: content collections, writing pages, Keystatic, CI.

## 12. Risks (top 5)
1. Trace-mask fidelity (user's instant-reject clause) → gate: pulses read as signal-in-copper at 2s glance, else cull lanes.
2. Board→die scale continuity break → geographic matching + particle re-formation carries the eye.
3. Near-black exposure discipline (aten7/Plenum lesson: whites blow fast) → exposure gates per act in Director, AgX shoulder.
4. Asset orientation/material quirks (components-down import, baked emissive floods) → normalization pass in the Blender pipeline, forced emissive caps.
5. Audio autoplay policies → first-gesture unlock, all mixing post-unlock, total silence before.

## 13. Out of scope
The Plenum scene (archived in storyboards/), path-traced hero mode (post-MVP spike), case-study deep pages, deploy/cutover (existing CI handles rsync when site/ is copied to the noorullah-me repo v2 branch).
