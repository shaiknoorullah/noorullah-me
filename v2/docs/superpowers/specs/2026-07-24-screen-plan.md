---
type: spec
status: approved-concept
date: 2026-07-24
concept: The Substrate — screen plan (canvas × DOM choreography)
process: cinematic-look pass, agent 3 of 3 (SCREEN-PLAN)
supersedes: nothing; binds DESIGN.md v1.2 + 2026-07-23-substrate-scene-design.md into per-screen rules
---

# SCREEN-PLAN — The Substrate: every on-screen element, zoned so canvas and content never fight

> Sources: `v2/DESIGN.md` (tokens, §3 motion, §5 section anatomy, §10.7 R1–R13), `2026-07-23-substrate-scene-design.md` (six acts, loader, audio, post stack), `tools/aten7-capture/PART5-TEXT.md` + `PART6-UI.md` (decode grammar, cursor state machine, chrome discipline), `tools/reference-capture/REPORT.md` §3–4 (scroll pacing, in-canvas vs DOM text split).
>
> **The one rule above all rules (Resn/aten7 discipline): in every viewport there is exactly ONE signal-green element, exactly ONE element in motion, and every glyph sits at ≥4.5:1 contrast over whatever the canvas is doing behind it.** Everything below is that rule made concrete, per section.

Coordinate conventions used throughout: viewport divided into vertical thirds `L | C | R` and horizontal bands `T (0–25%) | M (25–70%) | B (70–100%)`. "Content-safe" = the region where DOM text may live; the Director must keep the board's visual mass (socket, emissive pulse lanes, specular clusters) out of it.

---

## 1. LAYOUT ZONES — per act

The board is the hero; text is the narrative. They alternate custody of the frame's weight. The pattern across the page is a slow visual pendulum: **hero leans right, statement surrenders everything to type, work leans left-content/right-canvas, evidence goes full-band, about returns left-content, principles slides panels over a quieted scene, writing goes near-dark, contact opens to the wide master.** The camera never centers the board's socket under body copy.

### Master zone map (1440×900 reference)

```
┌────────────────────────────────────────────────────────────┐
│ T  wordmark (fixed)              mono index   MENU (fixed) │  ← chrome band, always quiet
│    ┌──────────┬──────────┬──────────┐                      │
│    │    L     │    C     │    R     │                      │
│ M  │          │          │          │   ← act-dependent:   │
│    │          │          │          │     one third holds  │
│    │          │          │          │     text, canvas     │
│    │          │          │          │     mass goes to the │
│    │          │          │          │     other two        │
│ B  │ meta row / scroll cue / counters / CTA                │  ← bottom band, scrim-backed
│    └──────────┴──────────┴──────────┘                      │
└────────────────────────────────────────────────────────────┘
```

### Per-act zoning table

| Act / Section | Content-safe zone | Canvas weight zone | How the camera honors it |
|---|---|---|---|
| **0 — Hero** `#hero` | L third, full height (eyebrow + d1 display) + B band (meta row) | C+R: board slab rakes from lower-C to upper-R | Look-at offset +8% viewport-x right of board centroid (NDC `target.x += 0.16` on desktop); the grazing 70mm dolly travels along the board's long axis so the socket's highlight cluster never drifts into L. Portrait (<1 aspect): reframe per R1 — dolly ×1.6 out, board mass sinks to B half, text owns T half. |
| **1 — Statement** `#statement` | **Entire M band, all three thirds** — pinned viewport, SDF words centered | None. Board racked to infinity; pulses persist only as defocused threads ≤ 12% luminance | Rack focus to infinity over the pin's first 15% of scrub; aperture opens fully; grade cools (`temp −0.1, sat 0.9`). The scene is *bokeh wallpaper* — no readable geometry allowed behind words. |
| **2 — Work** `#work` | L+C thirds (broken-grid index: cards span cols 1–8 with the §2.4 offsets) | R third: capacitor/VRM towers in profile | The 50mm truck travels left→right at tower height; Director biases framing so the district skyline peaks sit in R's M band. Pulse lanes (max 3, staggered) run R-ward, away from text. On mobile the index goes single-column over a 35% dim (R2) and the truck slows to 40% travel. |
| **3 — Evidence** `#evidence` | Full-width B-half band (six counters in two rows desktop / stacked mobile) | T half: dead top-down board as transit map | The crane ends with the board's long axis horizontal in T; the socket-interchange sits at `(50%, 22%)` — above the counter band's hairline. This is the one act where canvas and content *share* the frame vertically: the hairline at 50vh is the border, canvas never crosses it (crane target clamps board bbox to `y < 0.5` in NDC). |
| **4 — About** `#about` | L+C: editorial two-column (identity block L, serif + capabilities C) | R: macro approach to socket/IHS | Camera pushes toward the socket from R-side angle; IHS lift reads in R's M band. The die descent begins only after the section's text reveal completes (Director gate: `textRevealed === true` before `dieDive.t > 0`). |
| **4.5 — Principles** `#principles` | Pinned horizontal: active panel occupies L half, mono index pinned top-left | R half holds the board in a slow lateral truck (R5) | Truck progress = horizontal panel progress; board mass stays R, panels enter from R and exit L — a panel is fully inside L before the truck brings any bright district across center. `ScrollTrigger.snap: 1/3` lands each panel crisply. |
| **§7 — Writing** `#writing` | Full width, all bands (three rows + ALL WRITING link) | Suppressed. Hold Act 4's final die frame, exposure pulled to ~35%, saturation 0.85 | No camera move — this is the page's rest beat (corn lesson: not every section gets a transition). Only dust drift + one dim pulse lane remain alive so the canvas doesn't read as frozen. |
| **5 — Contact** `#contact` | L+C: d1 line, serif sentence, magnetic CTA | Full frame behind, but deep-focused and dark; the edge-to-edge pulse finale crosses T→B at R | Pull-back crane widens to the master; the answering-district bloom ripple radiates from R so the CTA (L, M-band) never sits on a brightening region. Cube/pulse brighten +40% only in R third (selective bloom mask or emissive falloff by world-x). |

**Camera-honors-zone contract (runtime):** the Director stores per-act `contentSafe: {x0,y0,x1,y1}` in NDC. A QA helper (dev-only overlay, `?zones=1`) draws the safe rect + the board's projected bbox; assert `intersectionArea(boardBrightClusters, contentSafe) < 2% of contentSafe area` at 9 sampled scroll stops per act, desktop and portrait. `boardBrightClusters` = socket, pulse light position, top-3 specular peaks — projected each frame from stored world positions.

---

## 2. SCRIM / READABILITY RULES

Layer order (bottom→top): `canvas (z:0, aria-hidden)` → `scrim (z:1)` → `content (z:2)` → `chrome (z:30)` → `cursor (z:40)` → `loader (z:50)`. Scrims are **pure-CSS overlays**, never rendered into the WebGL frame — they must survive canvas failure and respect reduced motion.

### 2.1 The luminance contract (canvas side)

- Behind any content-safe zone, effective canvas luminance ≤ **85% of the frame's peak** (DESIGN §4.2 exposure discipline), and — the binding constraint — bone-0 `#F2F2F5` text must hold **≥4.5:1 contrast against the worst pixel in its bounding box + 8px padding at every scroll position**.
- Concrete per-act exposure gates (Director fields, enforced like risk #3 in the scene spec):

| Act | Max avg luminance in content-safe zone (sRGB rel.) | Mechanism |
|---|---|---|
| 0 Hero | 0.30 | Composition (board mass in C+R) + bottom scrim |
| 1 Statement | 0.12 | Full defocus + cool grade + scrim .45 |
| 2 Work | 0.25 | Composition + left-anchored scrim |
| 3 Evidence | 0.35 above the 50vh hairline only; **0.10 below it** | Crane clamp + full-width band scrim |
| 4 About | 0.25 | Composition + scrim; die greens stay R |
| 4.5 Principles | 0.20 | Panel scrim per slide + truck restraint |
| §7 Writing | 0.08 | Exposure pull to 35% |
| 5 Contact | 0.25 around CTA bbox; 0.55 allowed R third | Selective bloom mask by world-x |

### 2.2 Scrim recipes (CSS, per section)

All scrims: `background: linear-gradient(...)` or `radial-gradient(...)` on an absolutely-positioned `::before` in the section, `pointer-events:none`, color stops in `rgb(0 0 0 / α)` — true black, never gray (gray scrims read as haze over AgX blacks).

| Section | Desktop scrim | Mobile ≤768px (R2 rule) |
|---|---|---|
| Hero | `linear-gradient(90deg, rgb(0 0 0/.55) 0%, rgb(0 0 0/.28) 30%, transparent 55%)` behind L third; plus bottom-band `linear-gradient(0deg, rgb(0 0 0/.5), transparent 18vh)` for the meta row | Full-width `rgb(0 0 0/.35)` flat layer behind the whole hero text stack; bottom band scrim kept |
| Statement | `rgb(0 0 0/.45)` full-viewport flat, fading to `.25` at edges (`radial-gradient(ellipse 80% 70% at 50% 45%, rgb(0 0 0/.45), rgb(0 0 0/.25))`) | Same recipe; defocus does most of the work |
| Work | `linear-gradient(90deg, rgb(0 0 0/.5) 0%, rgb(0 0 0/.22) 45%, transparent 70%)` | Flat `.35` behind the entire index (R2) |
| Evidence | `linear-gradient(0deg, rgb(0 0 0/.6) 0%, rgb(0 0 0/.45) 30%, transparent 55%)` — the band | Flat `.35` full band |
| About | `linear-gradient(90deg, rgb(0 0 0/.5) 0%, rgb(0 0 0/.25) 55%, transparent 75%)` | Flat `.35` |
| Principles | Per-panel: `rgb(0 0 0/.5)` behind active panel L half | Flat `.35` behind panel |
| Writing | `rgb(0 0 0/.55)` full-section flat (canvas is already pulled to 35%) | Same |
| Contact | `linear-gradient(90deg, rgb(0 0 0/.5) 0%, rgb(0 0 0/.3) 50%, rgb(0 0 0/.15) 100%)` — deliberately weakest at R where the finale plays | Flat `.35` |

### 2.3 Defocus acts (DOF as a readability tool)

- **Statement = full defocus, no exceptions** (scene spec Act 1): rack to infinity during pin entry; bokeh scale at max; the only surviving structure is 2–3 pulse threads, kept ≤0.12 luminance by the grade.
- **Writing = pseudo-defocus**: exposure pull instead of a focus change (cheaper, and the die macro is already at shallowest DOF).
- **Contact = reverse move**: deep focus (`ap 0.6`) so the wide master reads — scrim strength compensates what defocus gave back.
- DOF focus distance transitions: fast pull on act entry, 0.8s settle (DESIGN §10.5). Focus never animates *while* the user is reading within a pinned section — only at act boundaries.

---

## 3. UI CHROME — inventory + behavior

Fixed chrome is **three elements maximum**: wordmark (top-left), MENU button (top-right), and the cursor. Everything else scrolls with content. Chrome hides during the statement pin and the principles horizontal pin (scale 1.05, opacity 0, `.75s power1.in`; return `1.5s power1.out` after 1.25s delay — aten7 "presence is earned back" timing).

### 3.1 Header

| Element | Spec |
|---|---|
| Wordmark `noorullah` | Space Grotesk 500, lowercase, tracking −0.02em, bone-0. Fixed top-left, `padding: 2.4rem` desktop / `1.6rem` mobile. **Static** — no decode, no hover effect except opacity .7→1 (120ms). It is the page's anchor of stillness. |
| Mono act index | `01 — SELECTED WORK` style mono label, IBM Plex Mono 11px +0.12em, bone-1, top-center. Updates on act change with a 200ms crossfade — the *only* chrome text that changes. Hidden ≤768px. |
| MENU button | Fixed top-right, mono label `MENU`/`CLOSE` + 5-bar icon (aten7 §2 anatomy): skeleton bars `#FFF3`, active bars bone-0. Hover morphs bars toward open form (`.3s cubic-bezier(.4,0,.1,1)` — hover = rehearsal). Label decodes on toggle, once, ≤600ms. Click debounced 800ms on landing (menu choreo is shorter than aten7's 3D one). |
| Menu overlay | Full-viewport true black `.97` over a dimmed canvas (exposure → 20%, audio muffles per §5). Links right-aligned column: WORK · EVIDENCE · ABOUT · PRINCIPLES · WRITING · CONTACT — mono 300, staggered decrypt `.7s + i·.1s` with a tick per link (aten7 grammar). Hover = **spotlight**: hovered link bone-0, all others fall to 10% ghost — never brighten, dim the rest. Close = `.3s linear` fade; open = `1.2s cubic-bezier(.5,1,.89,1)`. Menu links are anchor-scrolls to sections, not routes. |

### 3.2 Footer (end of `#contact`)

1. Marquee `SUBSTRATE OVER RENT — COMPOSED UNDER LOAD —` (mono, bone-2, infinite, 40s loop; static under reduced motion).
2. Credits block (§6 below).
3. Legal line: `© 2026 SHAIK NOORULLAH · HYDERABAD, IN · BUILT WITH ASTRO + THREE.JS` — mono 11px bone-2. The `.me` appears here only (DESIGN §2.1).
4. Jali watermark, bone-2 at 6% opacity, bottom-right corner. Static.

### 3.3 Cursor state machine

Custom cursor, `mix-blend-mode: difference` (DESIGN §3 wins over aten7's no-blend — our true-black scene makes difference-mode safe), hidden on touch and ≤500px. Two followers with frame-rate-corrected exponential damping `a = 1 − exp(−k·dt)`: ring k=7, dot k=12.

| State | Trigger | Visual | Tween |
|---|---|---|---|
| `idle` | no interactive target, velocity < 0.5 for 400ms | dot + ring scale 1.5 | .5s house ease |
| `moving` | velocity > 0.5 | dot only, ring collapses | immediate |
| `link` | over any `<a>`, work row, writing row | ring scale 2, label none | .3s |
| `cta` | over magnetic CTAs (contact button, menu links) | ring snaps to element center (velocity-mapped duration `.7→.3s`), label `OPEN`/`SEND` appears below in mono 10px | snap + .3s label decode |
| `scroll` | over canvas during non-pinned acts, idle > 2s in hero only | label `SCROLL` | decode in once; never re-triggers within a session |
| `hidden` | touch, loader active, menu overlay open | opacity 0 | .3s |

Labels decode on entry (`letterRandomness {min:.8,max:1}`), never repeat while the state holds.

### 3.4 Magnetic CTAs

Exactly **two** magnetic elements on the page: the contact button `HELLO@SHAIKNOORULLAH.EMAIL` and the `ALL WRITING →` footer link. GSAP `quickTo`, pull factor 0.35, release spring-back 400ms (DESIGN §3). The contact button is the page's **one static signal-green element**: 1px signal border + signal text on ink, fill sweeps in on hover (Instant speed). No other element may be signal-green at rest anywhere — the trace pulses and the decode flash are the only other green in the product, and both are transient.

### 3.5 Decode-text headings — where decode is allowed

One `DecodeText` component (aten7 Effect A: sizing text-node + stacked symbol1/symbol2/letter spans, designed-glyph subset, random per-letter order, green flash inside the window only, settle bone ≤1.2s).

| Surface | Treatment | Why |
|---|---|---|
| Section labels (`01 — SELECTED WORK` etc.) | **Decode on section entry, once** (`durationIn .02`, window `.3s`, settle ≤1.2s) | Mono captions are machinery; decode suits them |
| Loader `SUBSTRATE` + status lines | Decode (scene spec §5.3) | The boot sequence |
| MENU/CLOSE, cursor labels | Decode on state change | Chrome grammar |
| Hero d1 display lines | **Never decode** — staggered mask reveal (Breath, expo.out) | Display type carries statements; scramble on a positioning statement reads as gimmick |
| Statement SDF words | Existing per-word scrub reveal (scene spec §5.5) | In-canvas, its own system |
| Evidence counters | **Count-up, not decode** (numeric roll on entry, 1.2s expo.out) | Numbers must read as facts |
| Body serif, capabilities, work rows, writing rows | Plain DOM, opacity/translate reveals only | Readability beats spectacle |
| Footer, credits, legal | Static | Rest |

**Concurrency cap: one animated text element per viewport, ever.** Decode triggers are queued: if a section label is mid-decode when a cursor label wants to fire, the cursor label waits. Decode never blocks readability — the final string is in the DOM from frame one (sizing text-node), so a failed animation leaves correct text (and screen readers always see the settled string via the DOM h1 proxy pattern).

### 3.6 Loader

Scene spec §5.3, restated as screen rules: true black + 2–4% lift. Kicker `SUBSTRATE // BOARD LEVEL ACCESS` (mono). Title `SUBSTRATE` decodes mid-load; progress = `loadingManager.onProgress × 1.05` on a paused timeline; each resolving char flashes #A4EB53 once, settles bone. Status line re-scrambles on loop (`ESTABLISHING LINK ▮▮ PLEASE WAIT`, encrypted keepVisible). Board scene visible at ~3.5% luminance behind the scrim — a promise, not a preview. **`CLICK TO ENTER` arms at `isLoaded + 5s`** (decode-in on arm); the click unlocks audio and fires the first SFX in the same gesture. Curtain part = Cinema speed (2s, power2.inOut). Loader hard cap: content reachable without WebGL — no-WebGL/reduced-motion users get the settled title and an immediate `ENTER` link, no dwell.

---

## 4. TYPE + MOTION OVERLAY RULES

### 4.1 The two type registers (never confuse — DESIGN §1.3)

| Register | Faces | Content | Motion budget |
|---|---|---|---|
| **Facts** (museum placards) | IBM Plex Mono 11–12px, uppercase, +0.12em, bone-1/bone-2 | Section indices, labels, tags, meta rows, counters' labels, footer, credits, chrome | May decode (once) or crossfade. Never translates except menu/link hovers. |
| **Statements** | Space Grotesk d1–d3, bone-0; Newsreader italic for the pull-quote register | Hero lines, section statements, contact d1, serif sentences | Mask reveals, word scrubs (statement only), nothing else. Never decodes, never has signal color. |

A viewport that mixes a decode animation with a mask reveal is a bug (one moving element rule). Sequencing: display mask reveal fires first at 20% section entry; the mono label decode fires at 45% — they never overlap.

### 4.2 What animates on scroll vs what never moves

**Animates on scroll (scrubbed):** camera (Director), statement word reveal (scrub), principles horizontal truck (scrub + snap 1/3), canvas grade/focus/exposure per act.

**Animates on entry (triggered once):** section label decode, display mask reveal (stagger 120ms/line), evidence counters (count-up 1.2s, mono numerals tabular), work-row hairline draws (600ms), capabilities list fade-stagger (40ms/item), contact CTA reveal.

**Animates on hover only:** link underline draw (180ms), work-row title +12px translate + index brighten, writing-row `READ →` reveal, magnetic pulls, menu spotlight.

**Never moves, ever:** wordmark, mono meta rows at rest, body serif after reveal, footer legal, credits, jali watermark, hairlines at rest (R3: hairlines only at true section boundaries — none may cross body text), ghost numerals (R4: z −1, bone-2 at 40%, offset from text blocks, static).

**Reduced motion:** all of the above jump to end states; decode renders settled strings; counters render final values; marquee static; canvas audio off.

---

## 5. AUDIO–UI MAP (aten7 restraint grammar)

Unlock on the loader enter-click; total silence before. One 90s ambient bed, crossfaded at act boundaries (GSAP gain tweens, 2s). All micro-SFX at −30dB under the bed. Grammar: **125ms leave / 359ms enter**. `visibilitychange` pauses everything. Reduced motion ⇒ audio off by default (toggle in footer: `SOUND — OFF`, mono, spotlight-hover).

| Element | Enter | Leave | Click | Notes |
|---|---|---|---|---|
| Work rows / writing rows | hover-mid (359ms) | hover-short (125ms) | — | Tick layered under row hairline draw |
| Menu button | hover-mid | hover-short | click-1 + label decode tick | Tick cascade `.7+i·.1s` synced to link decrypts on open |
| Menu links | hover-mid | hover-short | click-1 | Spotlight dim lands with the tick |
| Magnetic CTAs (contact, all-writing) | hover-long | hover-mid | click-1 | Long = the heaviest sound on the site, reserved for conversion |
| Cursor labels appearing | — | — | — | Silent. Cursor is visual only |
| Section label decode | single mechanical tick at trigger | — | — | One tick per section visit, first visit only |
| Evidence counters | — | — | — | Silent. Numbers don't beep |
| Scroll / camera | — | — | — | **No scroll sounds, ever** |
| Menu/overlay open-close | bed muffles: lowpass 22kHz→200Hz, 6s expo.out, volume 0.8→0.3; restore on close | | | The muffle IS the overlay sound |
| Act transitions | bed crossfade only | | | No stingers |

---

## 6. CREDITS PLACEMENT (CC-BY obligations)

Two surfaces, per scene spec §9:

1. **Footer credits block** (landing, between marquee and legal line): mono 11px bone-2, hairline above, format exactly:
   ```
   MODEL "MOTHERBOARD + COMPONENTS" BY DANIEL CARDONA (SKETCHFAB.COM), CC-BY 4.0, MODIFIED (RE-MATERIALED, RE-LIT, OPTIMIZED)
   MODEL "MICROCHIP - PROTOTYPE" BY RE1MONSEN (SKETCHFAB.COM), CC-BY 4.0, MODIFIED (RE-MATERIALED, RE-LIT, OPTIMIZED)
   ```
   (+ the MAXIMUS VI Formula line only if the backup board ships). Names link to the Sketchfab model pages. Static text, no hover effect beyond underline draw.
2. **`/credits` reference in the legal line**: `… · BUILT WITH ASTRO + THREE.JS · CREDITS` — the word CREDITS anchor-links to the footer block (not a separate page; the block IS the credits surface).

Credits are bone-2, small, static — present and honest, visually subordinate to everything.

---

## 7. THE "NOTHING FIGHTS" TEST — per-section checklist

Run at 9 scroll stops per section × {1440×900, 390×844} × {high tier, low tier}. Every box must pass before a frame ships to the user for QA.

| Check | Hero | Statement | Work | Evidence | About | Principles | Writing | Contact |
|---|---|---|---|---|---|---|---|---|
| One signal-green element at rest (CTA border/text, or a settling decode char, or one pulse lane — never two in-frame) | ✓ pulse only | ✓ decode flash transient only | ✓ ≤3 pulse lanes R | ✓ none (counters bone) | ✓ die greens R only | ✓ none | ✓ none | ✓ CTA + finale pulse (different thirds) |
| One element in motion (camera OR reveal OR counter OR marquee — never two simultaneously) | ✓ camera only | ✓ word scrub only | ✓ camera only (reveals done at 45% entry) | ✓ counters only | ✓ camera after reveals | ✓ truck only | ✓ none (rest beat) | ✓ camera only |
| Text contrast ≥4.5:1 over worst canvas pixel behind bbox+8px, all stops | scrim §2.2 | defocus + .45 scrim | scrim + R2 mobile .35 | band scrim | scrim + R gate | panel scrim | .55 flat + 35% exposure | scrim + bloom mask |
| Canvas luminance in content-safe zone ≤ gate (§2.1 table) | 0.30 | 0.12 | 0.25 | 0.10 below hairline | 0.25 | 0.20 | 0.08 | 0.25 at CTA |
| Camera honors content-safe zone (§1 contract, `?zones=1` assert <2% overlap) | R-biased | n/a (defocused) | R-biased | T-clamped | R-biased | R-biased | n/a (suppressed) | CTA-region gated |
| Hairlines at true boundaries only (R3) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ghost numerals behind and clear of interactive rows (R4) | n/a | n/a | z −1, 40% | n/a | n/a | n/a | n/a | n/a |
| Decode settled ≤1.2s, final string always in DOM | label once | SDF only | label once | label once | label once | label once | label once | label once |
| No text animates while user is mid-pin except the pin's own scrub | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | ✓ |
| Reduced-motion end states render identical content | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Audio map respected (no unlisted SFX, silence pre-unlock) | ✓ | ✓ | ✓ | silent counters | ✓ | ✓ | ✓ | ✓ |

**Instant-fail conditions (any one = the frame is rejected):** signal green on two elements at rest; text over a readable (in-focus) board feature; a decode and a mask reveal running in the same viewport; hairline crossing glyphs; canvas peak in the content-safe zone exceeding its gate; menu chrome visible during a pin; any sound before the enter-click.

---

## 8. What the runtime (three.js / Director) must replicate or expose

1. **Per-act `contentSafe` NDC rects** in the shot table + look-at/exposure fields to honor them (§1 contract). Camera composition offsets are data, not code.
2. **Exposure gates per act** (§2.1) enforced in the Director — the grade effect takes a `maxLuminanceInZone` uniform pair (zone rect + cap) or an equivalent exposure clamp; QA samples it.
3. **Selective bloom for the contact finale** — the +40% cube/pulse brighten must be masked by world-x so the CTA third never blooms (bloom threshold is global at .72; implement via emissive falloff on the geometry, not a second pass, unless profiling says otherwise).
4. **Scrim stays DOM.** The canvas must remain legible-without-scrim at low tier only in zones with no text; never bake darkening into the render to "help" text — that breaks the grade's per-act identity.
5. **Defocus as readability** (§2.3): statement rack-to-infinity and its 0.8s settle are Director-driven; DOF `worldFocusDistance` lerp must complete before the word scrub passes 30%.
6. **Pulse lane culling respects zones**: in Work, lanes that would cross the L third at peak brightness are phase-shifted or culled (restraint gate from the scene spec applies to screen position, not just look).
7. **The evidence crane's NDC clamp** (`board bbox y < 0.5`) — top-down framing is a hard constraint, not a taste choice.
8. **`?zones=1` dev overlay**: content-safe rects + projected bright-cluster markers + live contrast probe (sample canvas pixels under the largest text bbox each frame, report min contrast). This is the enforcement tool for §7.
9. **Dust near-field respects text**: near bokeh motes (60 large discs) fade to 0 alpha when their screen projection enters the active content-safe zone — a large soft disc drifting over body copy is exactly the "fighting" this plan exists to kill.
10. **Menu/pin chrome-hide is DOM-side**, but the canvas responds: exposure →20% under menu (pairs with the audio muffle), grade holds, no camera move (aten7: menus are scene changes achieved by *subtraction*).
