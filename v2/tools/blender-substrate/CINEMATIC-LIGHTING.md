# CINEMATIC-LIGHTING.md

# Cinematic Lighting — Motherboard Hero in a Dark Void
*Research synthesis: film lighting craft (Deakins, chiaroscuro tradition) translated to Blender/Cycles. Scene context: motherboard as hero "character," chiaroscuro void set, one green emissive accent, grazing camera moves, dark materials, metal heatsinks.*

Unverifiable or interpretive claims are marked **[unverified]**. Observational analysis of reference frames is marked **[observation]**.

---

## 1. Motivated Lighting — every source has a story

**Core principle (Deakins):** light the scene the way it would *actually* be lit if the events were really happening. Stylization is fine, but it must have in-world logic, or the viewer's suspension of disbelief breaks. Deakins: the "stylized" image in *No Country for Old Men* is "really just an accurate representation of what this actual scene would look like if it actually happened" ([StudioBinder — Roger Deakins Cinematography Tips](https://www.studiobinder.com/blog/roger-deakins-cinematography/)).

**The emissive-practical-as-key precedent.** In *Blade Runner 2049*, Deakins lit the "Pink Joi" scene with a 40×30 ft LED screen playing the advert — the screen itself was the key light on the actor and the stage mist: *"The pink-and-blue advert was basically lighting the whole shot — the atmosphere and Ryan. The light changes as the advert changes"* ([StudioBinder — Blade Runner 2049 Cinematography Analysis](https://www.studiobinder.com/blog/blade-runner-2049-cinematography-analysis/)). This is the exact pattern for our scene: the motherboard's own green emissive elements are a legitimate key/accent source.

**Faking motivation in a void set** (no windows, no room). In a void, the motivation must be *implied off-screen* or *on the subject itself*:
- **On-subject practicals** (strongest): PCB status LEDs, trace glow, VRM indicator lights. These read as instantly believable — no world needed.
- **Implied off-screen sources**: an overhead "inspection/surgical lamp" (motivates the soft key), a "bay door light leak" (motivates the rim), a "bench probe light" (motivates the low grazer). The viewer never sees them, but the light's *direction, hardness, and color* must stay consistent so the implied source stays coherent.
- **Moving light must be justified**: BR2049's light is almost never static, but it works because the moving source is visible or implied (holograms, water reflections). For grazing camera moves, keep fixtures static and let the *camera* create the movement — the specular sweep across heatsinks is motivated by the light staying put.

**Blender translation of the LED-screen trick**: emissive mesh alone is noisy as a light source in Cycles; put a small, hidden Area Light just in front of the emissive panel to "sell" the glow ([Pixel Sanctuary — Cinematic Lighting in Blender](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender)). Same trick as a gaffer boosting a practical.

## 2. Chiaroscuro & Contrast Ratios

**Definition**: chiaroscuro = the juxtaposition of light and dark; in cinematography, low-key, high-contrast lighting. Lineage: Caravaggio/Rembrandt → German Expressionism (*Caligari*, *Nosferatu*) → film noir (*Maltese Falcon*, *The Third Man*) → Gordon Willis's half-lit faces in *The Godfather* → modern thriller/horror ([StudioBinder — What is Chiaroscuro](https://www.studiobinder.com/blog/what-is-chiaroscuro-definition/)).

**Ratios (ASC convention)**: ratio = (key + fill) : fill. Each stop is a doubling: 1 stop → 2:1, 2 stops → 4:1, 3 stops → 8:1 ([StudioBinder — Lighting Ratios Explained](https://www.studiobinder.com/blog/lighting-ratios/); [Wikipedia — Lighting ratio](https://en.wikipedia.org/wiki/Lighting_ratio)).

| Ratio | Stops (key vs fill) | Reads as |
|---|---|---|
| 2:1 | 1 | Soft, balanced, "realism with depth" — corporate/product-default |
| 4:1 | 2 | Strong shadows, expressive — drama, fashion |
| 8:1 | 3 | Highly dramatic, stylized — noir, horror; obscures detail |
| 16:1+ | 4+ | Near-silhouette; use selectively, with intent |

**Negative fill is the primary sculpting tool** — more than any fill light. Correction of a common myth: negative fill doesn't "suck light out"; it *blocks ambient bounce from reaching the shadow side* ([V-Flat World — The Truth About Negative Fill](https://vflatworld.com/blogs/behind-the-scenes/the-truth-about-negative-fill-busting-the-myth); [Indie Cinema Academy — Negative Fill](https://indiecinemaacademy.com/academy/negative-fill-the-best-kept-secret-cinematic-lighting-lesson-08/)). Practically: black flags/V-flats placed where fill would normally live. In a void set with near-zero world light, you get negative fill "for free" — but Cycles bounces light off *everything*, so you still need black planes to eat bounce from the key and the green emissive.

**"Light the space, not the subject" vs "light the character"**: Deakins' documented habit is lighting for the situation/space authentically and letting the subject move through it ([StudioBinder — Deakins Tips](https://www.studiobinder.com/blog/roger-deakins-cinematography/)); the common quote "I don't light the actor, I light the space" is a widely circulated paraphrase — **[unverified as exact quote]**. For a product hero, hybridize: light the *zone* (a pool of light the board sits in), then add one edge/rim discipline pass that belongs to the board specifically. John Alton's maxim, quoted by Deakins: **"It's not what you light, it's what you don't light"** ([StudioBinder — Deakins Tips](https://www.studiobinder.com/blog/roger-deakins-cinematography/)) — this is the void-set creed.

## 3. Depth Layering — readable blacks on dark grounds

- **Separation planes**: even in a void, build 3 planes: foreground (out-of-focus board edge or a connector crossing frame), midground (the hero zone/pool of light), background (the void — but not pure 0% black; a whisper of cool ambient or haze-lit gradient keeps it "dark space," not "missing render"). Chiaroscuro craft note: give the background as much attention as the subject; lighting the background separately creates the 3D read ([StudioBinder — Chiaroscuro](https://www.studiobinder.com/blog/what-is-chiaroscuro-definition/)).
- **Edge/rim discipline for dark-on-dark**: a dark subject on a dark ground separates *only* by edges. Rim light should be tight and hot (often 150–250% of key on the edge hits) — a narrow strip, not a wash; if it reads as a second key, it's too wide ([Pixel Sanctuary](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender)). On heatsinks, the rim catches fin tops only — that's the separation language.
- **Rich-but-readable blacks**: Deakins keeps blacks deep but with surviving detail; the philosophy traces to the stills maxim "expose for the shadows, print for the highlights" — correctly attributed to **Ansel Adams**, not Deakins **[attribution correction]**. The film-era craft analog Deakins cites: Conrad Hall overexposed negative ~2.5 stops (*Tell Them Willie Boy Is Here*, *Fat City*) for richer images ([StudioBinder — Deakins Tips](https://www.studiobinder.com/blog/roger-deakins-cinematography/)). Digital/Blender equivalent: expose the render hot, grade down (see §6).
- **Aerial perspective**: haze gives far surfaces a value lift and desaturation — in a void, even a faint gradient from key-side to shadow-side reads as "air," i.e., scale (see §5).

## 4. Color Temperature Storytelling

- **Warm key + cool fill is the classic cinematic split**; keep differences subtle or it becomes "RGB lighting" ([Pixel Sanctuary](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender)). Mixed color temperature reads cinematic because real spaces are mixed-temperature; a scene where every source matches reads as a render.
- **"One warm source in a cold world" pattern** (and its inverse): a single warm motivated source in a cool environment concentrates attention and reads as narrative, not decoration. BR2049 runs this at feature scale — the pink Joi screen against blue-grey rain; the orange Vegas against grey LA ([StudioBinder — BR2049](https://www.studiobinder.com/blog/blade-runner-2049-cinematography-analysis/)) **[observation]**.
- **Temperature as depth tool**: cool recedes, warm advances. Put the warmest value on the hero zone, coolest in the void background; the green accent sits *between* them in hue but wins on *brightness/saturation* instead.
- **Single-source palettes**: one dominant source + one accent is more cinematic than three balanced sources. For our scene: neutral-cool key (4000–5000K), faint cold ambient (6500–7500K), one green emissive accent (~520–530nm-equivalent saturated green). The green is the "one warm source" role inverted — the chromatic intruder in an achromatic world.

## 5. Atmosphere — haze discipline

- **BR2049's fog is deliberate, thematic, and load-bearing**: it sells a ruined habitat, creates dream-like depth, lets unimportant objects fall behind a "curtain of smoke," and — critically — **diffuses harsh diegetic light for free softness** while spreading color through the whole frame like watercolor ([StudioBinder — BR2049](https://www.studiobinder.com/blog/blade-runner-2049-cinematography-analysis/)).
- **When haze sells scale**: when it's lit unevenly (bright near sources, dark away from them), when objects fade into it with distance, when a beam/shaft has a motivated source. **When it reads as fog machine**: uniform density everywhere, visible volume boundaries, haze lit from nowhere, glow with no source.
- **Dust in shafts**: only inside motivated beams (e.g., the grazer's sheet of light across the board). In a dark void, shafts are the *only* place haze should be obviously visible.
- **Blender spec**: see recipe §8 — volume cube, low density, anisotropy forward-scattering, noise-modulated, lit only by motivated sources.

## 6. Translating to Blender/Cycles

- **Area light vs emissive card for soft cinematic keys**: use an **Area Light 80% of the time**; size controls softness, distance controls falloff/contrast (closer = faster falloff = moodier) ([Pixel Sanctuary](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender)). Use an **emissive card** when the source must be visible in-frame or reflected authentically in the heatsinks (a softbox *reflection* is often what sells metal), and pair it with a hidden Area booster because emissive lighting is noisy in Cycles ([Pixel Sanctuary](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender)).
- **Bounce/flags**: white card = fill; black plane = negative fill; opaque plane between light and subject = cutter/gobo (cutouts or procedural noise for shadow design; closer to light = sharper pattern) ([Pixel Sanctuary](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender)).
- **Light linking**: Cycles supports light/shadow linking since Blender 4.0 — use it to keep the green accent off surfaces it would double-light, and to bind the rim to the hero only (Blender 4.0 release notes / manual — documented feature).
- **Exposure strategy ("expose up, grade down")**: lock camera exposure first, then set light intensities relative to it — design contrast, don't chase brightness ([Pixel Sanctuary](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender)). For filmic blacks: render midtones ~+0.5–1 stop hot (the Conrad Hall analog, §3), then pull down in the grade so shadows land rich, not starved.
- **AgX vs Filmic**: AgX is the default view transform since Blender 4.0 and handles saturated highlights (our green emissive) with a film-like desaturating shoulder — preferable to Filmic for emissive-heavy frames (Blender manual, color management). Start: AgX + Medium-High Contrast look; adjust Exposure, then light.
- **Grain/halation as the final 5%**: halation = Compositor Glare node (Fog Glow), high threshold, small-medium size, low mix — it blooms only the hottest pixels (the green accent, rim glints) like film halation around highlights. Grain = subtle per-channel noise in compositor. This is standard community practice; one ready implementation is the "Film Look" addon (halation, grain, gate weave on the GPU compositor) **[community practice — technique, not a sourced citation]**.

## 7. Reference Frames to Emulate

1. **Blade Runner 2049 — "Pink Joi" ad scene** (Deakins). Setup: one giant emissive source (40×30 ft LED screen) as the *entire* key, stage filled with mist, source visibly in-frame, light shifts as the content shifts ([StudioBinder — BR2049](https://www.studiobinder.com/blog/blade-runner-2049-cinematography-analysis/), quoting Deakins). **Lesson for us**: the emissive-practical-as-key is Oscar-winning precedent; haze is what makes an emissive key feel volumetric instead of flat.
2. **Sicario / Prisoners night interiors** (Deakins) + **The Godfather** (Willis). Setup: single motivated key (window/practical), shadow side near-black, negative fill doing the sculpting, faces half-lit — the modern chiaroscuro lineage ([StudioBinder — Chiaroscuro](https://www.studiobinder.com/blog/what-is-chiaroscuro-definition/); [StudioBinder — Deakins Tips](https://www.studiobinder.com/blog/roger-deakins-cinematography/)). Specific fixture plots for these interiors: **[unverified — no primary-source plot fetched]**; the *look* (one soft key, ≥8:1, deep shadow side) is directly readable from the frames **[observation]**.
3. **Title-sequence macro tech** (*Mindhunter* opening; *Alien: Romulus* titles). Setup **[observation — no sourced breakdown found]**: extreme macro of synthetic surfaces, very hard grazing source raking across texture, tiny depth of field, single saturated accent light, black ground. **Lesson**: at macro scale, the grazer angle *is* the production design — it turns solder mask and heatsink fins into landscape.

---

## 8. THE RECIPE — Motherboard Hero in a Dark Void

### Rig list (stop values relative to key = 0)

| # | Source | Motivation (in-world story) | Level vs key | Placement |
|---|---|---|---|---|
| K | Large Area Light, 4000–5000K, big size | Overhead inspection/surgical lamp | 0 (reference) | Camera-left, ~45° up, ~45° side; large enough to wrap the socket area softly |
| G | Green emissive PCB features (LEDs/traces) + hidden small Area booster in front of them | The board is alive — its own status lights | +1 to +1.5 on its local hits; small coverage | On the board; booster just off-surface. Brightest thing in frame but tiny — it clips, everything else doesn't |
| R | Long thin strip Area, neutral-cool | Bay-door light leak behind the set | +0.5 to +1 on edge hits only | Behind hero, high, camera-right; tight — catches heatsink fin tops and board edge, nothing else |
| X | Small hard Spot/Area, low, near-parallel to board plane | Bench probe/inspection light | −1 | Low grazer raking across solder mask; static — camera moves create the specular sweep on heatsinks |
| A | World ambient, 6500–7500K, strength ~0.001–0.005 | Cold void "air" | −3.5 to −4 (whisper) | Global; exists only to keep shadow-side detail (silkscreen, solder mask) readable |

Effective on-face ratio: **8:1 to 16:1** (3–4 stops key vs shadow side) — noir/hero register, with detail surviving via source A.

### Negative fill map (black planes, matte black shader)
- **Camera-right of board** — kills key wrap; creates the shadow cheek of the "face."
- **Below/far side of board** — kills floor/bounce into the underside; keeps the underside silhouette heavy.
- **Behind camera, off-left** — eats green emissive bounce so the accent stays an accent, not a wash.
- **Flag between rim (R) and camera** — keeps the strip light out of the lens (flare control) and off the midground.

### Haze spec
- Volume cube around the set: density **0.001–0.005** (start 0.002), anisotropy **0.3–0.6**.
- Break uniformity: density modulated by low-scale Noise Texture (Volume Info → Noise → Multiply).
- Haze is *lit* only where motivated: visible as a faint shaft inside K's cone and X's grazing sheet, and as glow around G. If the volume edge or a uniform fog wall is visible → too much.
- Self-check: hide the board — if the haze alone still reads as "a place," it's working; if it reads as "an effect," cut density.

### Grade targets (AgX)
- **View transform**: AgX, Medium-High Contrast look to start.
- **Exposure**: render midtones +0.5–1 stop hot; pull −0.5–1 in grade (Composititor exposure or color balance lift/gamma/gain).
- **Black point**: floor at ~5–8 IRE equivalent — never crush to 0; silkscreen and solder-mask texture must survive in the shadow side. Key side ~65–75 IRE, shadow side ~10–20 IRE (check with false color).
- **Highlight rolloff**: let the green emissive ride into AgX's shoulder — it should desaturate slightly and bloom, not clip to flat RGB green.
- **Halation**: Glare (Fog Glow), threshold set so only G and the hottest rim glints bloom; small-medium size, mix ~0.05–0.15.
- **Grain**: subtle 35mm-scale grain, per-channel, last node before output.
- **Continuity rule** (from ratios discipline): once the rig is balanced, *lock it* — grazing camera moves should reveal the lighting, never require re-lighting per shot ([StudioBinder — Lighting Ratios](https://www.studiobinder.com/blog/lighting-ratios/) on ratios for continuity).

---

## Sources
- [StudioBinder — Roger Deakins Cinematography Tips & Techniques](https://www.studiobinder.com/blog/roger-deakins-cinematography/) — motivated/authentic lighting, Alton "what you don't light," Conrad Hall +2.5 stops, lighting plots.
- [StudioBinder — Blade Runner 2049 Cinematography Analysis](https://www.studiobinder.com/blog/blade-runner-2049-cinematography-analysis/) — LED-screen-as-key (Deakins quote), practical/moving light, fog as deliberate diffusion and depth tool.
- [StudioBinder — What is Chiaroscuro](https://www.studiobinder.com/blog/what-is-chiaroscuro-definition/) — definition, lineage (Caligari → noir → Godfather), background-lighting depth tip.
- [StudioBinder — Lighting Ratios Explained](https://www.studiobinder.com/blog/lighting-ratios/) — ASC ratio formula, stops→ratio table, what 2:1/4:1/8:1 read as, continuity.
- [Wikipedia — Lighting ratio](https://en.wikipedia.org/wiki/Lighting_ratio) — 2^stops math confirmation.
- [V-Flat World — The Truth About Negative Fill](https://vflatworld.com/blogs/behind-the-scenes/the-truth-about-negative-fill-busting-the-myth) — negative fill blocks bounce; doesn't "suck" light.
- [Indie Cinema Academy — Negative Fill: The Best Kept Secret](https://indiecinemaacademy.com/academy/negative-fill-the-best-kept-secret-cinematic-lighting-lesson-08/) — flag placement on fill side.
- [Pixel Sanctuary — Cinematic Lighting in Blender](https://www.pixelsanctuary.com/tutorials/cinematic-lighting-blender) — area-light-first workflow, size/distance/falloff/gobos, practicals + hidden boosters, rim 150–250%, warm-key/cool-fill, lock-exposure-then-light.
- Blender 4.0 release notes & manual — light/shadow linking in Cycles; AgX default view transform (documented features; specific page not fetched this session).
- Not retrieved this session (404/JS-walled): Indy Mogul and Parker Walbeck lighting videos, Neil Oseman's negative-fill article, rogerdeakins.com forum threads. Their typical content (DIY practicals, motivated-source exercises) is consistent with, but not cited for, claims above.

## Marked caveats
- "I light the space, not the actor" as an exact Deakins quote: **[unverified]** — paraphrase widely circulated; documented substance is "light scenes authentically."
- Specific fixture plots for Sicario/Prisoners interiors and title-sequence macro rigs: **[unverified / observation]**.
- Halation/grain compositor values: community practice and author calibration, not from a cited source — treat as starting points.

---

**Handoff note to main agent:** research completed via 5 fetched primary sources + search snippets; all claims cited or marked. Please save the markdown above to `/home/devsupreme/noorullah-me-v2/v2/tools/blender-substrate/CINEMATIC-LIGHTING.md` (the `blender-substrate` directory exists). One gap worth knowing: I could not access rogerdeakins.com forum threads or the Indy Mogul/Parker Walbeck videos (JS/login walls), so those channels are represented only through second-party summaries.