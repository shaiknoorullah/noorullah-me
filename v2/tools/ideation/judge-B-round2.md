# Judge B (SKEPTIC) — Round 2 evaluation, consensus pool of 20

Round-2 criteria applied on top of round-1 rubric: merge/dedup resolution, 6-act viability
(one line per act — if I can't sketch it, it dies), asset re-verification via
`tools/sketchfab/search.py` (run 2026-07-23), and storyboardability — DISTINCT act-by-act
visual variety. Anything whose six acts collapse into "same shot, different zoom" dies here.

## Asset re-verification results

| Concept | Anchor | Status |
|---|---|---|
| G121 Substrate | MotherBoard + Components — Daniel Cardona (82k) | ✓ live |
| G121 / A14 | MAXIMUS VI Formula — Vivien Deroche (61k) | ✓ live |
| G121 / A1 | Microchip - Prototype — re1monsen (98k) | ✓ live |
| A2 Ten Cores | CHIPSET 001 — AGW Entertainment (166k) | ✓ live (reference only; cores authored) |
| A1 | AMD Ryzen Threadripper — VivernaNeva (672) | ✓ live |
| F1 Changelog Rack | Server rack — Osho (29.7k); Server Rack — Spellkaze (744) | ✓ both live |
| B2 Landing Station | Submarine fiber optic cable network — AVL (20k); Devil's Slide Bunker — Azad Balabanian (91k) | ✓ both live |
| F5 RFC Colonnade | Funerary stele — Global Digital Heritage | ✗ NOT found (closest: "Funerary stela pediment", Virtual Museums of Małopolska, 58k). Steles are authored boxes + displacement anyway — treat as authored-only |
| F18 Memorial Wall | monolith — barbodoji | ✗ NOT found. Wall is a plane + displacement — authored-only |
| F3 Solari Board | Split Flap Counter — jvvince (42k) | ✓ live (note: dup upload by "jvin") |
| F8 Terminal One | IBM 3278 terminal — maxdragonn (3.4k) | ✓ live (detail language only; tower authored) |
| E2 Breathing Aisle | Server Rack — Shalmon (74.8k); SCP Server Room — Maxime66410 (19k) | ✓ both live |
| C3 Console of One | Type 30 Console — themighty808 (165k) | ✓ live (needs hard decimate) |
| D3 Tower of Nines | Server rack — Osho; Server Rack — Shalmon | ✓ both live |
| C12 Incident Table | Notebook — gaetano.manzulli | ✗ NOT found in top results. Paper props are authored regardless — no real dependency |
| A13 Boot Sequence | MotherBoard + Components — Daniel Cardona; PSU — Groovex (12.5k) | ✓ both live |
| F2 Black Box | FDR (Flight Data Recorder) — Juliko Banditto (77k); IBM 729 — maxdragonn (2.4k) | ✓ both live |
| D1 Plenum | Wires — Bulat.Shakirov (72k); Rooftop Ventilation Modular Kit — D3D (20k) | ✓ both live |
| A3 Stackup Sediment | none needed | authored-only by design ✓ |
| F11 The Cursor | none needed | authored-only by design ✓ |

Net: no top-tier concept loses its asset base. Stone-record cluster effectively becomes
authored-only (fine — boxes + displacement are trivial). C12's notebook miss is cosmetic.

## Merge resolutions

**A1 + G121 → one concept: "The Substrate".** Keep G121's motherboard slab as the set and
the user's validated composition grammar; absorb A1's dive as the act-5 macro — the camera
enters the CPU socket, the IHS lifts, and a logic block cascades green across the exposed
die (A1's polish hook). This fixes G121's real round-2 problem — acts 1 and 3 were the same
grazing board-level shot — by giving act 5 a genuine scale transition (board → die interior)
instead of a second board-level dolly. One board, one set, one nested descent, one name.

**Stone-record cluster (F5/F18/F10) → survivor: F5 RFC Colonnade, with F18 folded in.**
F18 is one long wall = one camera track repeated six times (worst same-shot-different-zoom
profile of the three). F5 has two distinct architectural reveals (the 4×4 top-down grid, the
"colonnade is a foundation" pullback) and 16 steles = 16 RFCs exactly, in his chosen granite.
Fold F18's best surface idea into the stele faces: each stele carries title + abstract +
the etched hashes of the commits that implemented it. Rosetta stays dropped.

## 6-act viability & storyboardability — all 20

| # | Concept | Six acts (one line each) | Verdict |
|---|---|---|---|
| 1 | Stackup Sediment | intact-board hero → layers separate, tight and mechanical → dolly down through strata → via-column macro, one pulse falls through all 16 layers → top-down alignment grid → layers fuse back to one board | PASS — each act has distinct geometry (solid / exploded / between-planes / macro / plan / fused). Zero asset risk. |
| 2 | Substrate ★ (merged) | grazing night-city dolly over the slab → defocus for the statement → truck across component districts → top-down crane, board reads as transit map → dive into socket: IHS lifts, logic cascade on the die → pullback as one pulse crosses edge-to-edge | PASS (post-merge) — act 5 now a scale event, not a repeat of act 1. Pulse-quality risk unchanged. |
| 3 | Ten Cores, One Conductor | wide top-down of die → truck along core row → dolly into scheduler → macro one core saturating → crane up, all ten at load → pullback breathing die | DIE — every act is a flat top-down floorplan; behavior varies but the shot never does. Textbook "same shot, different zoom." My R1 #3 doesn't survive the round-2 criterion. |
| 4 | Substrate/CPU dive (A1) | — merged into #2 — | MERGED |
| 5 | Changelog Rack | dolly at the base, oldest units → truck past blinking faceplates → macro one etched PR plate → crane through the incident years → top-down straight down the infinite shaft → pullback, HEAD glowing at top | WEAK PASS — acts 2 and 4 are the same rack-face truck; lives on per-era patina variation. Middle monotony risk from R1 confirmed. Falls out. |
| 6 | The Landing Station | underwater, tracking a pulse along the cable → breach at the surf line → dolly across dark beach → through the manhole wall into the station → cross-section macro, armor peeling to glass core → top-down coastline, one lit line joining two dark continents | PASS — best act-by-act variety in the pool: six genuinely different frames stitched by one cable. |
| 7 | RFC Colonnade (stone survivor) | dolly down the row → truck across engraved faces → macro chisel-cut monospace in raking light → crane up one stele → top-down of the 4×4 grid → pullback: the colonnade is the foundation of an invisible building | PASS but event-less — the subject never DOES anything; only the green ratified line moves. Alternate tier at best. |
| 8 | Memorial Wall | — folded into #7 — | MERGED (was the weakest cluster member on act variety) |
| 9 | The Cursor | aerial across the void toward the slab → truck its rim-lit edges → macro: the surface is etched commit log → the blink — one green flare → top-down: its shadow is a caret → pullback, lone slab in darkness | WEAK PASS — etched-discovery and caret-shadow are two real beats, but four of six acts are one static slab. Restraint gamble: could land as empty. Alternate. |
| 11 | The Plenum | dolly along the slab under the trays → macro of one velcro'd fiber loom → THE BREACH: camera rises through an open tile into the lit aisle, dust motes drifting upward → top-down of the pedestal grid → pullback through the tile field → settle on the one open tile glowing green from below | PASS — the breach is the single best act transition in the pool; distinct frame per act. Readability risk (must read "under-floor" in 2s) is the only knock. |
| 12 | The Solari Board | concourse dolly toward the wall → truck rows mid-flip → macro: one flap caught between `v2.4.1` and `v2.4.2` → crane up the full grid → frontal cascade sweeps the wall → pullback as it settles on `ALL SYSTEMS OPERATIONAL` | PASS — wall-bound, but flap-macro / crane / cascade / settle are four distinct beats and the cascade is a poster frame. Alternate tier on variety, not quality. |
| 13 | Terminal One | aerial dolly toward the tower → truck the window grid as glyphs change → macro one window-glyph's mullions → crane the facade to the title bar → top-down roof status lights → pullback: the whole frame resolves as `> _` | WEAK PASS — the reveal is one payoff in act 6; acts 2-4 are facade shots. All-authored cost + gimmick risk. Falls out. |
| 14 | The Breathing Aisle | enter at floor level between the racks → dolly down the aisle as the breath cycle peaks → crane over rack tops into the cable-tray arteries → THE EVENT: one rack gutters out, green re-routes around it down the aisle → top-down of the aisle heartbeat → pullback, the whole hall breathing at 99.999% calm | PASS — the only concept with a mid-scroll narrative event; the self-heal beat is the site's thesis in one shot. Cliché exposure is real but the organism behavior is the differentiator. |
| 15 | The Console of One | open on the empty chair → push past it to the console → macro one ticket tile resolving → truck ten tiles working in parallel → crane up to the wall dashboard → pullback to the single silhouette | DIE (skeptic consistency) — ten tiles + wall dashboard = eleven screens of authored fake UI. This is the same screen-content crutch I killed The Night Desk for. The chair story survives in E2/D3 without the UI dependency. |
| 16 | The Tower of Nines | street-level, looking up the 42U monolith → macro one U's latch like a building entrance → crane up the facade, floor by floor → dolly into one open chassis → top-down straight down the cable spine → extreme pullback: one tower in an infinite dark skyline | WEAK PASS — two poster shots (street-level, final pullback) but act 3 is repetition by design and acts 1/3/5 share one axis. Falls just short. |
| 17 | The Incident Table | glide over the paper spread → macro the handwritten timeline → drop to the annotated log line → top-down of the whole table as evidence mosaic → crane to the frozen terminal cursor → pullback to the island of light | DIE on storyboardability — six tabletop flat-lays. The voice is his, the frame never changes. Best material is absorbable into F5's stele faces (etched log lines). |
| 18 | Boot Sequence | black frame, one standby LED → the 24-pin energizes → power stages strike in order → macro the first POST LED → fans spool, DRAM training ripple → fully booted steady state | WEAK PASS — acts are temporal stages of one event from near-identical angles, and acts 1-2 are near-empty frames. A pacing miracle or a broken first impression. Falls out. |
| 19 | Thermal Forensics | thermal overview of the board → dolly toward the hot bloom → truck the gradient through the planes → macro the incandescent component → top-down the plume → pullback, culprit isolated | DIE — "zoom into the hot spot" six times. The false-color grade is one look; the round-2 criterion is unforgiving. |
| 20 | The Black Box | circle the scarred casing → truck the scratch scars in raking light → macro the etched commit-hash serial → crane as a panel hinges open revealing tape internals → top-down the spooling log tape → pullback to the quiet bay | PASS on acts, but aviation drift is constant work and nothing here beats the survivors on relevance. Falls out on ranking, not viability. |

## Round-2 ranking — top 5 + 2 alternates

### 1. The Substrate ★ (merged G121 + A1) — user seed
One motherboard slab in true black, fog pooling beneath; signals ride the board's own
trace-derived emissive mask (no overlaid lines — the user's explicit fix). The scroll tours
the board as a night city, reads it as a transit map from above, then dives into the CPU
socket where the IHS lifts and a logic cascade fires across the exposed die (A1's best
material, now act 5). One board, one set, one nested descent: the hero line made literal.
- Acts: grazing night-city dolly → defocus for the statement → truck across component districts → top-down transit-map crane → socket dive: IHS lift + die cascade → pullback, one pulse edge-to-edge.
- Biggest build risk: trace-mask authoring quality — if the pulses read as painted-on lines or the lighting slips toward gamer-RGB, the user's own veto condition triggers. This is the only top-5 concept carrying a user-defined instant-reject clause.

### 2. Stackup Sediment (A3)
A 16-layer PCB stackup opened like a core sample — sixteen strata for the sixteen RFCs —
with green pulses falling through via columns that stitch the layers into one object.
All-authored parametric geometry: zero asset risk, zero license risk, cheapest build in the
pool, and every act has distinct geometry.
- Acts: intact-board hero → mechanical layer separation → dolly down through the strata → via-column macro, one pulse falls through all 16 → top-down alignment grid → layers fuse back into one board.
- Biggest build risk: separation distance discipline — drift too far and it becomes the banned "stitched objects" look; the parting must stay tight, mechanical, almost reluctant.

### 3. The Landing Station (B2)
One subsea cable, camera never leaves it: black ocean, surf line, dark beach, manhole,
brutalist station — the physical internet as a single journey. The cross-section macro
(armor peeling back to a hair of glass carrying one green pulse) is the corn-level material
moment. Both anchors re-verified live; strongest act-by-act variety in the pool.
- Acts: underwater pulse-tracking → breach at the surf line → beach dolly → through the manhole wall → cable cross-section macro → top-down coastline, one lit line between two dark continents.
- Biggest build risk: water — the ocean must be faked with dark shaders, never simulated; and the beach must read industrial photogrammetry, not landscape, or it re-triggers the terrain rejection.

### 4. The Breathing Aisle (E2)
A cold aisle as a calm organism: fan walls inhale, LEDs beat in one shared rhythm — and in
act 4 one rack gutters out while green re-routes around it down the aisle. The only concept
with a mid-scroll narrative event, and the self-heal beat is "composed under load" as
cinema. Both rack assets re-verified.
- Acts: floor-level entry → dolly as the breath peaks → crane into the cable-tray arteries → the failure/self-heal event → top-down heartbeat → pullback, hall breathing at 99.999%.
- Biggest build risk: legibility of the organism — if breath/heal reads as decorative LED noise, it collapses into the most-rendered scene on Dribbble. The behavior IS the concept; it cannot be subtle.

### 5. The Plenum (D1)
The void under the raised floor: cable trays, busbar, and pedestal grid receding into black,
lit only by status-light spill through perforated tiles — the layer below the one everyone
stops at, literally. Act 3's breach (camera rises through an open tile into the lit aisle,
dust drifting upward) is the best single act transition in the pool. Instancing-friendly,
both anchors re-verified.
- Acts: under-slab dolly → velcro'd loom macro → the breach up through the tile → top-down pedestal grid → pullback through the tile field → settle on the one glowing open tile.
- Biggest build risk: first-two-seconds readability — if the opening frame reads as abstract pipes instead of "datacenter under-floor," the premise never lands; needs the pedestal-grid silhouette established immediately.

### Alternate 1. The Solari Board (F3)
A monumental split-flap wall calmly flipping through deploy history; the cascade that
resolves to `99.999` is the most poster-able frame in Family F, and the mechanism is real —
mechanical, unhurried, honest. Anchor re-verified. Held to alternate only because every act
is the same wall.
- Biggest build risk: thousands of flap modules must be shader-driven instances, not rigs — otherwise the 60fps budget dies before the typography does.

### Alternate 2. The Cursor (F11)
His own thesis as monument: a cursor-block monolith micro-etched with the entire commit log,
blinking once every few seconds; its top-down shadow is a caret. Authored-only, trivial
geometry, the cheapest concept in the pool. Held to alternate because four of six acts are
one static slab — restraint or emptiness, and the difference is pacing.
- Biggest build risk: the etched-log discovery moment is the whole scene; if the macro doesn't reveal the surface as text at exactly the right beat, it's a black rectangle in a void.

## Round-2 kills (with cause)
- **Ten Cores, One Conductor** (my R1 #3): flat top-down floorplan in all six acts — same shot, different zoom.
- **Thermal Forensics**: zoom-into-the-hot-spot six times; one false-color look.
- **The Incident Table**: six tabletop flat-lays; absorb its handwriting/log material into F5's stele faces.
- **The Console of One**: eleven screens of authored fake UI — the Night Desk crutch in a costume.
- **Changelog Rack / Tower of Nines / Terminal One / Boot Sequence / Black Box**: viable but each has a repetition or drift tax the survivors don't pay.
- **Memorial Wall / CPU dive / Rosetta**: merged as resolved above.
