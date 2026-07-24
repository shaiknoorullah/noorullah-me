# Judge A — Round 2 evaluation (final top 5 selection)

Pool: 20 consensus entries from round2-pool.md. Round-2 criteria applied on top of round-1 rubric: merge/dedup, 6-act viability, asset re-verification (via tools/sketchfab/search.py, 2026-07-23), storyboardability (distinct act-by-act visual variety), user-seed weight for G121.

## Asset re-verification results

- ✓ "MotherBoard + Components" — Daniel Cardona, 82,090 tris, CC-BY, downloadable.
- ✓ "MAXIMUS VI Formula" — Vivien Deroche, 61,092 tris, CC-BY.
- ✓ "Microchip - Prototype" — re1monsen, 97,981 tris, CC-BY.
- ✓ "AMD Ryzen Threadripper" — VivernaNeva, 672 tris, CC-BY.
- ✓ "Submarine fiber optic cable network" — Advanced Visualization Lab, 20,052 tris.
- ✓ "Devil's Slide Bunker - Pacifica, CA" — Azad Balabanian, 90,833 tris (photogrammetry shell) + fallback "Old Concrete Bunker PBR Scan" — Pers Scans, 59,723 tris.
- ✓ "Server rack" — Osho, 29,711 tris; "Data Center Server Rack" — EntropyNine, 27,853 tris.
- ⚠ "Server Rack" — Shalmon (74,823 tris) did NOT surface in API search; a "Rack" at 74,821 tris by hiroshima1 did (likely re-upload — verify manually before use). Non-blocking: EntropyNine/Osho cover the same role at lower tri counts.
- ✓ "Split Flap Counter" — jvvince, 41,932 tris.
- ✓ "FDR (Flight Data Recorder)" — Juliko Banditto, 76,720 tris.
- ✓ "Funerary stele" — Global Digital Heritage, 120,439 tris (re-carve base).
- ✓ "Type 30 Console" — themighty808, 164,572 tris (needs hard decimate); "Large Wall-Mounted Computer Console" — Inditrion Dradnon, 1,092 tris.
- ✓ "EPSON SG-3030CM CRYSTAL OSCILLATOR" — Caddalog, 4,778 tris.
- ⚠ "monolith" — barbodoji did not surface (Cursor is authored-only anyway; no dependency).
- ⚠ "Wires" — Bulat.Shakirov did not surface for the Plenum's looms; "CABLE TRAY" — eventdesignws (132 tris, tiling module) and "Cable Tray Models" — m.usamahsafdar (163k) did. Looms were always authored splines; non-blocking.

## Merge/dedup rulings

- **A1 + G121 → merged "The Substrate"** (see finalist #1). A1 is the same idea one scale down; G121's board-level acts 1–4 hand off to A1's package→die dive for acts 5–6. One continuous set, one light story (green signal rising from real copper), two nested scales — this FIXES G121's weakest acts (macro act was thin) and A1's weakest point (no establishing context).
- **F5/F18/F10 stone-record cluster → F5 "The RFC Colonnade" as representative**, absorbing F18's raking-light polish and hash detail (each stele's base course carries the commit hashes that ratified it). F5 wins over F18 on storyboardability (a colonnade you walk THROUGH vs a single wall you walk ALONG), on the 16-RFC/16-stele numerical rhyme, and on granite being his stated material. F10 (Rosetta) stays out — museum-artifact drift.

## Pool triage (non-finalists, one line each)

- Ten Cores, One Conductor — strong but third silicon concept in the pool; acts are five flavors of top-down; needs copy to land. → ALTERNATE 1.
- The Plenum — most novel subject left; 2-second readability risk and loom-anchor flag hold it back. → ALTERNATE 2.
- The Solari Board — lovable mechanism, but one wall = one composition six times; flap-instancing shader is unproven spend.
- Terminal One — the reveal is a gimmick unless five acts play it straight; fully authored = highest cost in pool.
- The Breathing Aisle — best of the aisle cluster, but still aisle-shaped; loses distinctiveness to Landing Station and novelty to Plenum.
- The Console of One — leverage story overlaps Ten Cores; ten screen tiles = screen-content crutch (same disease that got Night Desk vetoed).
- The Tower of Nines — good vertical acts; miniature-toy DOF risk is real and the infinite-skyline pullback echoes Changelog Rack's shaft shot, which is stronger.
- The Incident Table — paper-heavy; detective-corkboard gravity; weaker storyboard variety than the stone record.
- Boot Sequence — acts 1–2 are near-black frames; storyboard-thin at the top where a portfolio needs density.
- Thermal Forensics — one phenomenon, one false-color grade; palette discipline risk (rainbow creep) is unpriced.
- The Black Box — aviation metaphor needs constant correction back to SRE; the FDR asset is verified but the record-story is better told by Colonnade/Changelog Rack.
- The Cursor — thesis-perfect ("cursor is the substrate") but six acts of one slab is the weakest act variety in the pool; 2001 shadow; keep as a motif INSIDE another scene, not the scene.
- The Memorial Wall — absorbed into the Colonnade merge (see ruling above).

---

## FINAL: Judge A ranked top 5

### 1. The Substrate (merged G121 + A1) — USER SEED
**Refined concept:** A single motherboard slab floating in true black, fog pooling beneath. Acts 1–4 stay at board scale: pulses ride the REAL traces (trace-derived emissive mask, Resn gradient-dash mechanism) through component districts toward the CPU socket. Act 5 the camera arrives at the socket, the IHS lifts, and the dive continues into the exposed die. Act 6 pulls back as one pulse crosses the whole board edge-to-edge — every district answers. One set, one material story, two nested scales; "I build the substrate everyone else rents" as a camera move.
**Six acts:**
1. Grazing dolly over the black board like a night flyover, ember rim on capacitor towers.
2. Defocus-for-statement beat, then truck across component districts as green pulses commute the real traces.
3. Top-down crane: the board resolves into a transit/network map — the evidence act.
4. Macro approach to the CPU socket; the heatspreader lifts away in one mechanical move.
5. Inside the package: top-down die floorplan, logic blocks waking green in sequence (A1's cascade).
6. Pullback through the socket to the whole board as a final pulse crosses edge-to-edge and the die glows from within.
**Biggest build risk:** trace-mask authoring quality — pulses must follow actual copper or the user's own reject criterion fires; secondarily scale-continuity at the board→die handoff.

### 2. Stackup Sediment (A3)
**Refined concept:** One PCB's 16-layer stackup opened like a geological core sample — copper, prepreg, ground planes as dark strata, green signal vias threading all sixteen. Sixteen layers rhyming with the 16-RFC spec; his exploded-strata motif made literal. Fully authored (parametric planes + extruded traces + instanced vias) = the lowest-risk build in the pool and the tightest possible cohesion: every act moves along one vertical axis.
**Six acts:**
1. Hero shot of the intact black board, edge-lit, layers unreadable.
2. Mechanical separation: sixteen strata lift apart a few millimeters, almost reluctant.
3. Dolly down through plane after plane — copper floods, ground planes, trace layers.
4. Macro of a single via column: one green pulse descends all sixteen strata in an unbroken fall, ember rim on the barrel.
5. Top-down of the full alignment — sixteen registered layers as one luminous laminate.
6. Pullback as the stackup fuses back into a single board, seams vanishing.
**Biggest build risk:** mid-act monotony — acts 3–4 are "plane after plane"; needs per-layer material variation (copper/prepreg/solder-mask) and one unmistakable hero (the via fall) to carry the middle.

### 3. The Changelog Rack (F1)
**Refined concept:** A single 42U rack, infinitely tall in a black void — every unit's etched faceplate is one changelog entry, oldest at the floor, HEAD vanishing into dark above. The record IS the machine: evidence pillar and substrate pillar fused in one vertical axis. Verified rack assets (Osho/EntropyNine) + authored faceplates; instanced units keep it at 60fps. The top-down shaft shot is the pool's best single still after the via fall.
**Six acts:**
1. Floor-level dolly toward the rack base — oldest units, worn faceplates, earliest versions.
2. Crane upward past blinking units, version numbers climbing.
3. Truck along the "incident years" — faceplates scarred, hotfix etchings, one amber unit.
4. Macro of a single etched PR plate: hash, message, `99.999%` uptime stamp.
5. Top-down straight down the shaft: hundreds of units receding to a dot, LEDs rippling upward like one slow pulse.
6. Pullback as the crane reaches HEAD — the top units glowing green, still being written.
**Biggest build risk:** middle-act repetition — needs per-era patina/lighting variation or acts 2–3 blur into one long truck.

### 4. The Landing Station (B2)
**Refined concept:** A subsea fiber cable rises out of a black ocean at night, crosses a dark beach through a concrete manhole, and enters a brutalist cable landing station whose only light is the green pulse train riding inland. One cable is the subject, the set, and the dolly track — the camera never leaves it. The physical internet nobody thinks about = "substrate over rent" made geographic. Best act-by-act environmental variety in the pool. Verified: AVL cable, Devil's Slide Bunker photogrammetry shell.
**Six acts:**
1. Underwater: tracking a green pulse along the armored cable through black water and marine snow.
2. Breach at the surf line — the cable running wet across dark sand.
3. Dolly across the beach to the concrete manhole; through the wall into the station.
4. Macro cross-section: armor, copper, gel, steel peeled back to the hair of glass carrying the pulse.
5. Interior: the cable rising into the distribution frame, pulse train splitting into the rack.
6. Pullback to top-down coastline: the cable as the single lit line between two dark continents.
**Biggest build risk:** the ocean — water must be faked with dark shaders and fog (no sim), and the beach must read industrial-infrastructure, never landscape/terrain.

### 5. The RFC Colonnade (F5, absorbing F18)
**Refined concept:** Sixteen honed-black-granite steles in a fog-dimmed 4×4 colonnade, each engraved with one RFC's title and abstract in chisel-cut monospace; the base course of every stele carries the commit hashes that ratified it (F18's hash wall absorbed). One green line marks the currently ratified stele. "The evidence is the credential" — the dropout arc answered in stone. His stated material (honed black granite), his stated reverence (the written record), his stated aesthetic (brutalism that shows its structure).
**Six acts:**
1. Dolly down the colonnade row — steles as dark slabs in fog, one green line far away.
2. Truck across engraved faces, raking light crawling over chisel-cut glyphs.
3. Macro of a single stele face: `RFC-007` title and abstract at hairline depth, stone grain visible.
4. Drop to the base course: F18's macro — commit hashes in polished granite, camera reflection sliding across them.
5. Crane up one stele's full height to the green ratified line at its crown.
6. Top-down of the 4×4 grid — sixteen steles as the foundation plan of an invisible building.
**Biggest build risk:** graveyard/memorial read — the green line, version typography, and fog grade must say "living spec," not "cemetery"; engraving displacement quality at macro distance.

---

## Alternates

### 6. Ten Cores, One Conductor (A2)
Ten compute cores on a dark die floorplan pulse green in sequence under one central scheduler block — the 35-agent platform drawn in silicon, "leverage, not heroics" at clock speed. Instanced cores make it the cheapest build after Stackup; the phase-locked traveling wave is a genuine one-system-one-beat moment. Held at alternate: third silicon subject in a five-deep list, and five of six acts are top-down-adjacent — weakest storyboard variety among the leaders.

### 7. The Plenum (D1)
The void UNDER the datacenter raised floor — cable trays, busbar and pedestal grid receding into black, green status-light spill filtering through perforated tiles from the rented layer above. The most novel subject in the pool and a pure "substrate over rent" literalization; the tile-breach act (cool air, upward dust motes) uses his exact motif. Held at alternate: 2-second readability risk (abstract pipes if the establishing beat misses) and the loom anchor failed re-verification (authored splines cover it, at cost).

---

## Note on the user seed
G121 keeps preference weight and earns it: merged with A1 it is the only concept that literalizes the hero line at TWO scales with verified assets and a proven pulse mechanism. It ranks #1 on merit + seed weight combined; Stackup Sediment remains the higher pure-merit score and the safer build — if the trace-mask prototype fails the user's pulse-quality bar, Stackup Sediment is the automatic #1.
