# LIGHTING BIBLE — The Substrate (dark hero-product scene in Cycles)

Scene facts (from `out/anchors.json` + `qa_lighting_study.py`):
- Board spans x: −9.0..8.5, z: −9.6..9.2, top surface y ≈ 2.76 (socket at `(1.22, 1.08, −3.91)`).
- Board footprint ≈ 17.5 × 19 scene units; plinth slab ≈ 9.6 × 12. Treat **1 board-width ≈ 18 units** as the unit of measure for light sizing/distances below.
- Camera: grazing, low angle ("01-hero-grazing"), 100 mm macro variant exists.
- One green emissive accent: `(0.643, 0.922, 0.325)` linear-ish; ember `(1.0, 0.42, 0.10)`, cool `(0.21, 0.32, 0.91)` already defined in tooling.
- Locked render config (director directive): Cycles, AgX, world = true black (0,0,0 @ strength 0), 1024 spp floor + OIDN, OptiX/CUDA GPU, caustics off, clamp indirect 10.

This bible turns that into a repeatable craft. Every ratio is stated in **stops** (×2 / ÷2 energy) so energies can shift globally without breaking the rig.

---

## 1. The one principle that fixes 90% of "not properly lit" dark product scenes

**A reflective object is not lit by lights. It is lit by what it reflects.**

A brushed-aluminium heatsink at grazing angle is a mirror aimed at your set. If the set around the board is empty black, the metal renders black — no amount of wattage on a point/spot light fixes that, because a near-mirror surface has almost no diffuse component to receive it. This is why studio photographers shooting watches, cars, and electronics talk about *"lighting the cards, not the product"*: they surround the object with white foam-core cards and diffusion frames, then light the cards. **[unverified-fetch — technique pages 403'd, but this is canonical studio practice, see also Blender Manual: glossy rays]**

Consequences for our scene:
- The rig's job #1 is to place **large, bright, shaped things where the heatsink fins can see them** (reflection cards), and **dark things where we want depth** (black flags / negative fill).
- Diffuse parts of the board (solder mask, PCB silk, plastic shrouds) respond to area lights normally. Metal responds to the *environment*. You light them with separate instruments.
- Never add light to "brighten the metal." Instead move/resize/brighten the card it reflects.

Diagnostic: render the scene with only the reflection cards enabled (lights off, black world). If the heatsinks don't read in that render, no light placement will save them.

---

## 2. Studio softbox technique translated to Cycles

### 2.1 Softness rule (area-to-distance ratio)
Softness of wrap = **apparent angular size of the source as seen from the subject**.
- Source width ≈ subject width at distance ≈ 1× width → soft, wrapping, gentle terminator (classic portrait softbox).
- Source width ≈ 2–3× subject at 2–3× distance → still soft but flatter (the "giant card far away" ambient, see §4).
- Small source near → hard shadows, snappy highlights, dramatic grazing texture.

Rule of thumb: to make a light 1 stop softer-looking without changing ratio, double its size and push it to ~1.4× the distance (keeps apparent size constant, changes wrap). Verified physics; exact numeric framing is practice convention, not manual text. **[practice convention]**

### 2.2 Area lights vs emissive mesh cards

| | Area light (Blender `AREA`) | Emissive mesh card |
|---|---|---|
| Direct illumination | Clean, cheap, well-sampled (light tree) | Noisier as a *light source*; relies on MIS |
| Visible in reflections | **Yes** (Cycles area lights appear in reflections as their shape) | Yes, full control of shape/gradient via nodes |
| Gradient / texture across the surface | No (uniform) | **Yes** — put a gradient/texture into Emission Strength for feathered metal streaks |
| GI contribution | Indirect via bounces | Direct + indirect; MIS samples it (see §6) |
| Camera visibility control | `visible_camera` ray visibility per object | Same, plus per-ray-type shaping with Light Path node |
| Cost | Low | Higher if large & bright (fireflies without MIS) |

**Decision for our rig:** area lights for key/fill/rim *illumination*; emissive cards for everything the metal must *see*. Both already exist in `qa_lighting_study.py` (`area()` and `refl_card()`).

### 2.3 Feathering / gradient cards for metal
A uniform white card reflects as a uniform white slab — looks CG. Real softboxes have falloff at the fabric edge. Emulate:
- Emission card + **Gradient Texture (Linear)** → ColorRamp (white → mid-grey, never pure black) → Emission Strength. Orient the gradient so the bright edge is nearest the product: the metal gets a bright streak that *rolls off* into grey — the signature "car brochure" highlight.
- Alternative without nodes: two overlapping cards at different strengths.
- On a grazing camera the reflection is heavily foreshortened; make cards **longer than you think** along the board axis (2–3× board length) or the streak will clip at the ends of the heatsink fins.

---

## 3. Three-point and beyond — ratios in stops

Classic product ratios (photography convention; treat as starting points, not law) **[practice convention]**:

| Role | Ratio to key | Job in our scene |
|---|---|---|
| Key | 1× (0 stops) | Big soft source, camera-left, 30–60° elevation, defines the board |
| Fill | ¼× (−2 stops) to ⅛× (−3 stops) | Lifts shadow floor just enough to read near-black surfaces |
| Rim/edge | 1–2× (0 to +1 stop) | Narrow strip from behind/above; separates product from black background |
| Practical (green emissive) | self-lit | The one saturated accent; keep everything else neutral so it owns the frame |

For dark cinematic: **fill at −2.5 to −3 stops**, not the 1:2 of high-key. The blacks must stay black — the fill's job is only to keep the shadow *floor* off the floor.

### Negative fill — the tool flat scenes are missing
If the scene "looks flat," the cause is usually **bounce light from the set filling everything from everywhere**. Cycles is a path tracer: your plinth, your cards, even the key light's spill bounce back into the shadows. Photographers kill this with black flags; we do the same:

- Place **black diffuse planes** (Principled, base color ≈ 0.01–0.02, roughness 1.0) on the fill side of the board, just out of frame, close to the product.
- They do two things: (a) absorb bounce, deepening shadows on that side; (b) appear as **dark reflections** in the metal — the dark stripes between bright stripes that give polished metal its "contrast banding" and shape.
- Black flag in a reflection is not wasted surface; on metal it *is* a lighting instrument.

This is almost certainly why the current scene reads flat/washed: full-surround soft light with no negative fill = no dark side = no shape.

### Bounce cards
The inverse: a white/grey diffuse card (not emissive) catching key spill and returning a soft, dim, directionless fill. Use when you want fill that clearly comes *from the set* rather than from a second fixture. Cheaper-looking (in a good way) than a second area light, and it's how the "giant card" ambient in §4 is powered.

---

## 4. Ambient/fill approaches, ranked for "dark room, one hero product"

1. **Giant emissive card far away (ceiling card)** — a huge (10–20× board width), dim emissive plane 4–6 board-widths overhead, `visible_camera=False`. Produces a soft, directionless base exposure that dies off naturally with distance; reflects as a faint sheen on all upward-facing metal. **This is the pro choice for dark product work** because it behaves like a real studio's ambient spill and keeps shadows graded, not crushed. Drive it −3 to −4 stops under key.
2. **Black world + bounce cards only** — most filmic, hardest to control; shadows go genuinely black. Use with §3 negative fill for the "ink" look. Our current setup (world 0.0) is this, but without the cards.
3. **World HDRI (studio HDRI, e.g. Polyhaven `studio_small`)** — fast and gives instant metal reflections, but for a *dark* hero scene it fights you: HDRIs light from all directions, lifting every shadow and flatting the product. If used, set strength ≤ 0.05–0.1 and/or grade it dark in a Mapping/Curve node. Ranked low for this exact look.
4. **Light portals** — interior-window noise reducers. **Irrelevant here** (no enclosed interior lit through openings); do not use. Verified: portals guide sampling of world light through openings ([Blender Manual — Light Paths](https://docs.blender.org/manual/en/latest/render/cycles/render_settings/light_paths.html)).

---

## 5. Lighting metal & near-black materials without gray wash

- **Heatsinks / metal:** reflection-card discipline (§1). Strip boxes — tall, narrow area lights or cards (aspect 1:6 to 1:10) placed perpendicular to the fins — give the long edge highlights that make extruded heatsinks read. One strip per side max; two bright + one dark stripe (negative fill) is the classic three-band metal read.
- **Near-black diffuse (solder mask, plinth):** keep it readable by *zone placement*, not by adding light. Under AgX, aim: shadow floor of the product ≈ 1.5–2 stops below mid-grey, deepest background black untouched at 0. Control the floor with fill energy, not exposure — raising global exposure to see blacks lifts the background too (gray wash).
- **Grazing camera specifics:** at grazing angles, diffuse surfaces reflect almost nothing to camera (Fresnel sends the energy to the horizon). That's why grazing shots look dark even when lit. Compensate by biasing the key **more frontal** (closer to camera axis) than intuition says, and let the *rim* lights do the drama.
- Watch-photography translation **[practice convention]**: dark watch dials are shot with a single big soft source overhead, black cards left and right for case-band contrast, and one hard kicker for bezel sparkle — exactly the rig in §7.

---

## 6. Cycles specifics (all verified against Blender 5.2 manual)

- **Light Falloff node** ([manual](https://docs.blender.org/manual/en/latest/render/shader_nodes/color/light_falloff.html)): real lights fall off **quadratically** — keep Quadratic for believability. Linear/Constant are cheats that *add energy per GI bounce* and can blow out multi-bounce scenes. Use `Smooth` (0.05–0.5) on hot small sources to kill harsh near-source highlights and reduce GI noise. Apply to area lights via node trees; our `area()` helper doesn't, so add when needed.
- **Area light shape/spread:** Rectangle shape matching the heatsink aspect for strip lights ([manual — Light Objects](https://docs.blender.org/manual/en/latest/render/lights/light_object.html)). With `Normalize` on (default), power stays constant when resizing — **resizing changes softness, not exposure**. Remember this when tuning: change size for wrap, change energy for stops.
- **Emissive meshes & MIS:** emission shaders on meshes are W/m² ([manual — Emission](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/emission.html)). Cycles samples emissive surfaces via Multiple Importance Sampling (per-material, on by default in recent versions; in ≤3.x it was a per-material "Multiple Importance" toggle — on 4.x it's automatic). Big bright emissive cards without MIS = severe noise/fireflies. Keep cards modest in strength and large in area rather than small and nuclear.
- **Samples + OIDN for clean darks** ([manual — Sampling](https://docs.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html)): dark regions converge slowly because relative noise is high. Our floor (1024 spp, adaptive 0.008, OIDN High) is right. For finals of the dark hero shot consider: adaptive threshold 0.005, OIDN `Quality: High`, `Prefilter: Accurate`, passes = **Albedo + Normal** (manual: "at least Albedo... None can blur out details").
- **Color noise in shadows:** the green emissive bleeding into dark shadows is the main offender — colored fireflies survive denoising as blotches. Mitigate: clamp indirect (already 10; can go 4–6 for finals, watching that the green accent's bloom isn't dimmed — clamp dims bright lights too, per manual), caustics off (already), and keep the green emission area small/strong rather than large/weak.
- **Filter Glossy 0.5–1.0** blurs glossy-after-bounce paths — cheap firefly killer for metal scenes with emissive cards (manual — Light Paths).
- **Light Tree: ON** (default) — with a rig of 6–10 lights it cuts shadow noise meaningfully; caveat from manual: it does not account for custom falloff/ray-visibility tricks, so if you add Light Falloff nodes and noise appears, test with it off.
- **AgX vs Filmic for product blacks:** AgX. Filmic's shoulder desaturated and lifted blacks toward charcoal under heavy exposure compensation; AgX keeps saturated highlights (our green) from clipping to mud and holds blacks under exposure moves. Already locked in tooling (`view_transform = "AgX"`, look `AgX - Medium High Contrast`). **[practice-wide consensus; Blender default since 4.0 — Manual color management page fetch returned an empty stub, marked partially unverified]** Use scene exposure to place mid-grey, then a slight negative Look contrast or compositor curve only if the floor needs one last nudge.

---

## 7. THE RIG — concrete recipe for our scene

Coordinates in scene units; board center ≈ `(0, 1.6, 0)`, board top y ≈ 2.8. Grazing camera assumed at low y, looking along −z/+x diagonal (match "01-hero-grazing" camera). All lights `look_at` the socket `(1.22, 1.08, −3.91)`. Stops relative to KEY = 1.0×.

| # | Name | Type | Size | Position | Target | Energy (rel) | Color / Temp | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | KEY | AREA Rectangle | 14 × 10 (≈0.8× board width) | camera-left 45°, y ≈ +14, ~1.5 board-widths out | socket | **1.0×** | 5600 K `(1.0, 0.976, 0.945)` | Slightly frontal (§5 grazing bias). Soft wrap: size≈distance. |
| 2 | FILL | AREA Disk | 10 | camera-right 30°, y ≈ +8, ~2 board-widths out | board center | **0.20× (−2.3 stops)** | desat cool `(0.21, 0.32, 0.91)` mixed 70% toward white | Shadow floor control only. If shadows read blue-gray, desaturate more, don't dim. |
| 3 | RIM STRIP L | AREA Rectangle | 2 × 22 (1:10) | behind board, left, y ≈ +7 | far heatsink edge | **1.5× (+0.6 stop)** | neutral 6500 K | Long edge highlight on left heatsink fins. |
| 4 | RIM STRIP R | AREA Rectangle | 2 × 22 | behind board, right, y ≈ +6 | right heatsink edge | **1.0×** | ember `(1.0, 0.42, 0.10)` at 25% sat, else neutral | Warm-cool edge split is optional; default neutral. |
| 5 | CEILING CARD | emissive plane | 60 × 60 (≈3.5× board) | y ≈ +35, horizontal | down | strength ~2–5 W/m² (≈ −3.5 stops under key at surface) | white | The ambient (§4 #1). `visible_camera=False`, MIS on. Tune by render, not math. |
| 6 | REFL CARD A | emissive plane + gradient | 8 × 30, portrait | camera-left of board, vertical, y ≈ +4, tilted ~20° toward board | — (reflection only) | strength 3–8, gradient white→40% grey | white | The streak the left heatsink reflects. Position by watching the *reflection*, not the board. |
| 7 | REFL CARD B | emissive plane + gradient | 6 × 24 | camera-right, mirrored | — | strength 2–5 | white, dimmer than A (−1 stop) | Second band. |
| 8 | BLACK FLAG L | plane, Principled black 0.015, rough 1.0 | 10 × 20 | between FILL and board, just out of frame left | — | — | — | Negative fill: deepens left-side shadow + dark band in left metal (§3). |
| 9 | BLACK FLAG R | same | 10 × 20 | right side, closer to board than card B | — | — | — | Dark stripe between cards A/B in the metal = the "three-band" read. |
| 10 | GREEN PRACTICAL | existing emissive geometry | as modeled | on board | — | as authored | `(0.643, 0.922, 0.325)` | The accent. Everything else stays neutral so it owns the frame. Optionally a small green AREA under it at 0.1× to sell spill on the plinth. |
| 11 | PLINTH KICK (opt.) | SPOT, radius 0.5, blend 0.3 | — | low, behind, grazing across plinth surface | plinth front edge | 0.5× | neutral | Gives the plinth a lit front edge so the board doesn't float in void. |

World: **black, strength 0** (as already in both scripts). Ambient comes from #5.

### Build order (important)
1. Black world, KEY only → expose so solder mask highlights sit just under clip (view exposure ~+1.3 as current).
2. Add CEILING CARD → shadows lift from void to "dark but graded." Stop when you can just read the unlit side.
3. Add REFL CARDS A/B → tune **position and gradient** until each heatsink shows one bright streak rolling to grey. Only then touch energy.
4. Add BLACK FLAGS → watch the dark bands appear in the metal and the fill-side shadow deepen. This is the "flat → shaped" step.
5. Add RIM STRIPS → edge separation from the black background. If the board edge vanishes into black, this is the fix — not more key.
6. FILL last, at the minimum that keeps the shadow floor off pure 0. If unsure, it's 1 stop too bright.
7. GREEN PRACTICAL → verify it's the only saturated thing in frame.

### Cycles settings for finals (verified vs our tooling + manual)
- samples 1024+ (floor), adaptive ON, threshold **0.005** for finals (0.008 for iteration)
- bounces: total 8, diffuse 4, glossy 4, transmission 4 — keep
- caustics off — keep; clamp indirect 10 → try **6** if colored shadow blotches persist
- Filter Glossy 0.5
- Light Tree ON
- OIDN, Quality High, Prefilter Accurate, passes Albedo+Normal; denoise final in compositor if pushing shadows in grade
- AgX, `Medium High Contrast` look, exposure set once in step 1 and **never touched again during light tuning** (tune lights, not exposure — exposure is composition, lights are ratios)

---

## 8. Failure modes → cause → fix

| Symptom | Cause | Fix |
|---|---|---|
| Metal is black/dead | Nothing bright for it to reflect | §1: reflection cards, positioned by watching reflections |
| Scene flat, no shape | Bounce from set filling shadows | §3: black flags on fill side, kill ceiling card 1 stop |
| Blacks washed gray | Fill/exposure too high | Fill to −3 stops; never fix darkness with exposure |
| Colored blotches in shadows | Green emissive fireflies | Clamp indirect 6, Filter Glossy 0.5, smaller/brighter emissive |
| Board edges vanish into background | No rim | Rim strips 1–1.5× key from behind |
| Heatsink streak clips at fin ends | Card too short for grazing foreshortening | Lengthen card along board axis (2–3× board length) |
| Softbox reflection looks CG-flat | Uniform card | Gradient emission (§2.3) |
| HDRI version looks milky | World lighting from all directions | Drop HDRI; use ceiling card (§4) |

## 9. Reference looks
- Lusion / IG-style dark product work: consistent signature = single large soft key, visible reflection cards in every metal surface, deep negative fill, one saturated practical. Could not fetch a primary breakdown from this network **[unverified-fetch]** — treat as observed convention, not cited fact.
- Watch photography (three-band metal, black cards flanking, hard kicker) — canonical still-life technique **[practice convention]**; direct sources 403'd, see caveat in §1.
- Blender Studio / BlenderGuru / CG Cookie: not fetched this session **[unverified-fetch]**; the manual-verified Cycles mechanics above cover everything this rig needs. Their studio-lighting tutorials align with §2 (area lights + emissive cards + black world).

## Sources (fetched & verified 2026-07-24)
- [Blender Manual — Light Objects](https://docs.blender.org/manual/en/latest/render/lights/light_object.html) (area shapes, Normalize, power units, real-world power table)
- [Blender Manual — Cycles Light Paths](https://docs.blender.org/manual/en/latest/render/cycles/render_settings/light_paths.html) (bounces, clamping, Filter Glossy, caustics, fast GI)
- [Blender Manual — Sampling & Denoising](https://docs.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html) (adaptive sampling, OIDN options, light tree, blue-noise)
- [Blender Manual — Light Falloff node](https://docs.blender.org/manual/en/latest/render/shader_nodes/color/light_falloff.html) (quadratic vs linear, smooth)
- [Blender Manual — Emission shader](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/emission.html) (W/m² for mesh emission)
- Project files: `qa_lighting_study.py`, `bake_lightstory.py`, `out/anchors.json` (scene scale, locked render config, existing card helpers)
- Unverified-fetch items are individually tagged; do not treat them as cited.
