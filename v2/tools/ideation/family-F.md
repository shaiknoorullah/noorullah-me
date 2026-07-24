# Family F — Type, Evidence & The Record (20 concepts)

All Sketchfab anchors verified via `tools/sketchfab/search.py`, which pre-filters to
CC0/CC-BY + downloadable (the `?` in its license column is a display quirk; the API
query itself constrains `licenses=cc0,by`).

---

### 1. The Changelog Rack ★
- **Scene:** A single server rack, infinitely tall, standing in a black void — every unit's asset tag, LED bank and etched faceplate is one entry of the changelog, oldest at the floor, HEAD at the top vanishing into dark.
- **Scroll story:** Acts crane upward along the rack (dolly → truck past blinking units → macro on one etched PR plate → crane through the "incident years" section → top-down looking down the infinite shaft → pullback to see the whole column glowing green at HEAD).
- **Pillar(s):** Evidence over assertion (the record IS the machine) + Substrate over rent (it's literally a rack, his layer).
- **Asset anchors:** "Server rack" — Osho (29.7k tris); "Server Rack" — Spellkaze (744 tris); faceplates/etching Blender-authored.
- **Cohesion mechanism:** One subject, one material system (black powder-coated steel + bone-white silkscreen + green LED), one vertical axis the whole film travels.
- **Polish hook:** The top-down act: camera looks straight down the rack shaft, hundreds of units receding to a dot, LEDs rippling upward like a single slow pulse — nothing hurries.
- **Risk:** Rack repetition reading monotonous in the long middle acts; needs per-era wear/patina variation to keep the truck shots alive.

### 2. The Black Box ★
- **Scene:** A building-scale flight data recorder resting in a dark recovery bay, its crash-proof casing scarred, serial plate etched with a commit hash — the platform's incident record, recovered and monumental.
- **Scroll story:** Acts circle the casing (wide dolly → truck along scratch scars → macro on the etched serial/hash → crane as one panel hinges open revealing tape-reel internals → top-down onto the spooling log tape → pullback to the whole bay, quiet, one green status LED).
- **Pillar(s):** Evidence over assertion (the recorder is the audit trail that survives everything) + Composed under load (a black box exists because the system stayed calm enough to record).
- **Asset anchors:** "FDR (Flight Data Recorder)" — Juliko Banditto (76.7k tris); "IBM 729 magnetic tape unit" — maxdragonn (2.4k tris) for the interior mechanism.
- **Cohesion mechanism:** Single object, single bay, one raking ember rim light on battered paint — everything else is darkness.
- **Polish hook:** The macro: raking light across the casing where every scratch catches, and engraved hairline text reads `LAST WRITE OK — 99.999%`.
- **Risk:** Aviation metaphor could drift to "aerospace engineer"; the tape/hash/postmortem language must carry it back to SRE incident forensics.

### 3. The Solari Board ★
- **Scene:** One monumental split-flap departure board mounted on a black wall in an empty concourse, calmly flipping through the deploy history — service, version, status — each flip a soft mechanical clack.
- **Scroll story:** Acts approach the wall (wide concourse dolly → truck along rows mid-flip → macro on a single flap caught half-rotated between `v2.4.1` and `v2.4.2` → crane up the full grid → top-down… n/a, wall-mounted: replaced by straight-on frontal as the whole board cascades → pullback as it settles on `ALL SYSTEMS OPERATIONAL`).
- **Pillar(s):** Composed under load (split-flap never hurries; it settles) + Evidence (every deploy, on the board, in public).
- **Asset anchors:** "Split Flap Counter" — jvvince (41.9k tris); the wall/housing is a Blender-authored grid of instanced flap modules.
- **Cohesion mechanism:** One wall, one grid, one mechanism, one sound design language; the room exists only to give the board scale.
- **Polish hook:** The cascade: a wave of flips rolls across the whole wall in one choreographed sweep and resolves into `99.999` — the corn-level still is mid-cascade, half the wall blurred in motion, half settled bone-white on black.
- **Risk:** Animation cost — thousands of flapping modules need instancing + shader-driven flap rotation, not per-module rigs, or the 60fps budget dies.

### 4. The Print Room
- **Scene:** A dark industrial press hall where a single letterpress endlessly prints the 16-RFC platform spec, the printed sheets stacking into the floor, walls and columns of the room itself.
- **Scroll story:** Acts move through the hall (dolly down the paper-stack colonnade → truck past the running press → macro of type slugs impressing `RFC-016` into cotton paper → crane over the delivery tray as a fresh sheet lands → top-down of the sheet's grid layout → pullback revealing the entire architecture is built of printed pages).
- **Pillar(s):** Evidence over assertion (documentation as monument; the spec is load-bearing).
- **Asset anchors:** "Printing Press" — Amethyst Costello (16.3k tris); "[CC0] Newspaper Stack" — karlwirbelwind (2.1k tris); "Paper Stack" — Vivify Productions (18.8k tris).
- **Cohesion mechanism:** One room, one machine, one paper/ink material family everywhere — architecture and artifact share the same stock.
- **Polish hook:** The macro: inked type slugs kiss the paper in slow motion, a bead of ink at a serif's edge, and the impression left behind is razor-sharp monospace.
- **Risk:** Print-media drift — could read "newspaper/publishing"; the sheets must be unmistakably RFCs (headers, ABNF, YAML blocks) at macro distance.

### 5. The RFC Colonnade
- **Scene:** Sixteen black granite steles standing in a fog-dimmed colonnade, each engraved with one RFC's title and abstract, a single green LED line marking the one currently ratified.
- **Scroll story:** Acts walk the colonnade (dolly down the row → truck across engraved faces → macro on chisel-cut monospace glyphs catching raking light → crane up one stele's full height → top-down of the 4×4 grid → pullback: the colonnade is the foundation of an invisible building).
- **Pillar(s):** Evidence over assertion (16 RFCs, carved, load-bearing) + Substrate (the record is the foundation).
- **Asset anchors:** "Funerary stele" — Global Digital Heritage (120k tris); "monolith" — barbodoji (126k tris); engraving via Blender displacement.
- **Cohesion mechanism:** One grid, one stone, one engraving language, one fog/light state.
- **Risk:** Memorial/graveyard read — the steles must feel like a spec, not a cemetery; green "ratified" line and title typography are what save it.

### 6. The Mainframe Reading Room
- **Scene:** A 1960s machine room restored as a reading room — IBM 1401, tape units and terminals arranged like library furniture, reel-to-reel tapes catalogued on shelves where books would be.
- **Scroll story:** Acts tour the room (dolly past the 1401 → truck along the tape-shelf stacks → macro on a spinning 729 reel labeled `etcd-snapshot` → crane over the terminal row, one screen green → top-down of the room's grid → pullback through the glass partition).
- **Pillar(s):** Substrate over rent (he works the iron layer everyone else abstracted away) + Evidence (the tapes are the archive).
- **Asset anchors:** "IBM 1401 Central Processing Unit", "IBM 729 magnetic tape unit", "IBM 3278 terminal" — all maxdragonn (2.4–3.4k tris each).
- **Cohesion mechanism:** One room, one era, one beige-and-black machine palette against the dark set, green phosphor as the single signal color.
- **Polish hook:** The macro on the tape reel: hub spinning, leader tape glinting, and the handwritten reel label in bone-white grease pencil — `prod / do not erase`.
- **Risk:** Retro-computing nostalgia could read "computer museum nerd" rather than modern multi-cloud SRE; the reel labels and terminal text must reference Kubernetes/etcd/GitOps, not COBOL.

### 7. The Diff Cathedral
- **Scene:** A vast dark nave whose only windows are diff hunks rendered as stained glass — added lines in signal green, context in bone — pooling colored light across a black stone floor.
- **Scroll story:** Acts move up the nave (dolly toward the altar → truck through the pools of green light → macro of leading between glass panes forming a `+` line → crane up the great window, a full PR diff → top-down of light pooled on the floor like a heatmap → pullback to the facade, one window glowing).
- **Pillar(s):** Evidence over assertion (the diff as the sacred text of the platform).
- **Asset anchors:** "St Stephen Walbrook Interior" — artfletch (200k tris, decimate); "Stained Glass Window, Southwark Cathedral" — Thomas Flynn (29k tris) as reference; windows replaced with Blender-authored diff glass.
- **Cohesion mechanism:** One nave, one window system, one light story — every photon enters through a diff.
- **Polish hook:** The crane up the great window: each pane a hunk, and at the tracery the commit message in bone-white lead came — the light it throws on the floor is literally the shape of the change.
- **Risk:** Religious drift and over-ornateness against the restrained palette; must be handled austere — black nave, minimal glass, no iconography beyond type.

### 8. Terminal One
- **Scene:** A single brutalist tower standing alone on a black plain, its facade a terminal bezel, its grid of windows a glyph matrix, the ground-floor entrance a blinking cursor you walk through.
- **Scroll story:** Acts approach and enter (aerial dolly toward the tower → truck along the window grid where glyphs change → macro on one window-glyph's mullions → crane up the facade to the title bar → top-down of the roof's status lights → pullback: the whole building resolves as `> _` on a black screen).
- **Pillar(s):** Substrate over rent (the terminal — his layer — as architecture) + Composed under load (a building does not hurry).
- **Asset anchors:** "IBM 3278 terminal" — maxdragonn (3.4k tris) for detail language; the tower is Blender-authored only (stronger as pure authored architecture).
- **Cohesion mechanism:** One building, one typographic system (every aperture is a glyph), one material (black concrete + phosphor glass).
- **Polish hook:** The final pullback: camera rises and the tower, plain and all, reads as a single terminal window at desktop scale — the site visitor realizes they were inside a prompt.
- **Risk:** The reveal could read as a gimmick; every earlier act must honestly behave like architecture so the pullback lands as recontextualization, not a trick.

### 9. The Evidence Wall
- **Scene:** One wall of a dark incident room covered floor-to-ceiling in the forensic record of a single outage — logs, flame graphs, annotated timelines — pinned, connected, and quietly complete.
- **Scroll story:** Acts interrogate the wall (dolly across the full timeline → truck along the log printouts → macro on a circled line: `03:14:07 — leader lost` → crane up the cascade of consequences → top-down of the incident table below → pullback: the resolution note, green thread, `RCA COMPLETE`).
- **Pillar(s):** Evidence over assertion (incident forensics is his pitch) + Composed under load (the wall is post-storm calm).
- **Asset anchors:** "Crime Board" — Brian Trepanier (176k tris) as base dressing; documents Blender-authored with real log text.
- **Cohesion mechanism:** One wall, one incident, one pin-and-thread system, one lamp.
- **Polish hook:** The macro: a push-pinned log line under raking light, paper fiber visible, one green thread crossing the frame toward the root cause.
- **Risk:** Conspiracy-board cliché (red string, madman energy) — the restraint (one incident, orderly grid, green thread only, engineering annotations) is what keeps it forensic rather than unhinged.

### 10. Rosetta
- **Scene:** A single monumental slab in a black gallery, the platform's core contract carved in three registers — YAML/HCL at the top, SQL in the middle, plain English at the base — lit by one raking spotlight.
- **Scroll story:** Acts read the stone (dolly across the base register → truck upward through SQL → macro on carved backticks and colons → crane the full height → top-down… wall-mounted: replaced by an oblique raking-light pass across the whole face → pullback to the gallery, slab alone in the dark).
- **Pillar(s):** Evidence over assertion (the spec carved in stone = the contract doesn't change on a whim).
- **Asset anchors:** "Rosetta Stone" — light_heists (180k tris) as scan base to re-carve; inscription via Blender displacement/bump.
- **Cohesion mechanism:** One object, one stone, one light — the gallery is just darkness and floor.
- **Polish hook:** The raking macro: light crawls across carved monospace glyphs, each groove throwing a long shadow — code with the gravity of a decree.
- **Risk:** Museum-artifact drift (reads "history exhibit"); the three registers must be visibly modern infra languages, and the gallery must read gallery-of-record, not archaeology.

### 11. The Cursor
- **Scene:** A lone cursor block — a black monolith the size of the 2001 slab, edged in emissive bone-white — standing in an empty black plane, blinking once every few seconds, its surfaces micro-etched with the entire commit log.
- **Scroll story:** Acts close in on the monolith (aerial dolly across the void → truck around its edges → macro revealing the surface is not smooth but engraved with thousands of log lines → crane as it blinks green once → top-down: its shadow is a caret on the plane → pullback to lone slab in darkness).
- **Pillar(s):** Composed under load (the blink is the calmest possible heartbeat) + Evidence (the log is etched into the prompt itself).
- **Asset anchors:** Blender-authored only (a slab + etched displacement; a scanned model adds nothing).
- **Cohesion mechanism:** One object, one plane, one blink cycle — the most minimal scene in the family.
- **Polish hook:** The macro-to-blink cut: camera buried in etched log lines on the surface when the whole edge flares green for one frame — the still of that flare is the hero shot.
- **Risk:** Too minimal/abstract — without the micro-etching discovery moment it's just a black rectangle; and 2001-monolith comparison is unavoidable (mitigate via the cursor proportions and blink).

### 12. The Ledger Spool
- **Scene:** A single machine in a black void extruding an endless audit receipt that coils and stacks into a towering spiral of paper beside it — the record accumulating into architecture.
- **Scroll story:** Acts follow the paper (macro at the print head stamping `ok — deploy #4,812` → truck along the fresh strip → dolly around the coil tower → crane up its spiral → top-down into the coil's center → pullback: machine and tower, still growing, unhurried).
- **Pillar(s):** Composed under load (the spool never stops, never hurries) + Evidence (every line accounted for, physically).
- **Asset anchors:** "Cash register" — Dester (4.7k tris) for the print-head mechanism; coil and strip Blender-authored.
- **Cohesion mechanism:** One machine, one continuous strip of paper — the tower is literally the same object, just older.
- **Polish hook:** The top-down into the coil: years of receipt spiraling down like a cross-section of time, the freshest turn still bright bone-white at the rim.
- **Risk:** Paper simulation/render cost and a "cute" register-tape read; must be heavy industrial stock, monospace, perforated — audit-grade, not shopping-grade.

### 13. The Punch-Card Loom
- **Scene:** A dark weaving shed where a single Jacquard-style loom runs on punch cards stamped with the platform's runbooks, weaving the record into a growing bolt of black fabric shot through with one green thread.
- **Scroll story:** Acts track the process (dolly along the card chain feeding in → macro on punched holes reading as binary → truck across the shuttle → crane over the woven runbook pattern → top-down of the fabric's weave resolving into legible text → pullback to the whole shed, one loom, one bolt).
- **Pillar(s):** Leverage, not heroics (punched cards were the first automation — write the runbook once, the machine repeats it forever; the ancestor of his agent platform).
- **Asset anchors:** "Plugboard - 'Ancient' Coding" — museudocomputador (4.2k tris) for card/plug detail language; loom Blender-authored.
- **Cohesion mechanism:** One machine, one card chain, one bolt of cloth — input, mechanism, output in a single unbroken material flow.
- **Polish hook:** The macro: punched card holes passing over the reader, light stabbing through each hole in sequence — the earliest form of code, physically glowing.
- **Risk:** Mechanical drift (adjacent to the rejected robot arm: reads textile/industrial); only the punched runbook text and the "automation's ancestor" framing keep it in his world.

### 14. Microfiche Vault
- **Scene:** A cold records vault of drawer cabinets where one microfiche reader glows in the dark, projecting the platform's postmortems frame by frame onto nothing but haze.
- **Scroll story:** Acts move from document to archive (macro through the reader's optics onto a single fiche frame → truck across the fiche grid, each frame an incident → dolly back from the reader → crane over the drawer cabinets → top-down of one open drawer's labeled envelopes → pullback to the vault, one machine lit).
- **Pillar(s):** Evidence over assertion (every incident, kept, retrievable, indexed).
- **Asset anchors:** "microfiche reader" — maxdragonn (366 tris); "Filing Cabinets" — TooManyDemons (7.4k tris).
- **Cohesion mechanism:** One vault, one cabinet system, one reader, one beam of light.
- **Polish hook:** The macro through the optics: dust motes in the projection beam, then focus racks onto a fiche frame where a postmortem timeline is legible at hairline scale.
- **Risk:** Obscurity — younger visitors may not know microfiche; and the "records clerk" vibe could undersell the ambition unless the fiche content is unmistakably incident forensics.

### 15. The Deposition Table
- **Scene:** One vast drafting table in a black room, the 16-RFC platform spec pinned out as architectural blueprints under a single raking lamp — vellum sheets, annotated margins, seal-stamped approvals.
- **Scroll story:** Acts survey the table (aerial top-down of the full sheet grid → dolly across vellum → macro on a stamped `RATIFIED` seal in green → truck along the margin annotations → crane as a hand-shadow… no hands: crane across a curled sheet corner revealing the next revision beneath → pullback to the lone lit table in the void).
- **Pillar(s):** Evidence over assertion (the spec as signed, sealed engineering record).
- **Asset anchors:** "Art Drafting Desk" — Raphael Escamilla (52k tris); "1800s Book Stands" — Mad_Lobster_Workshop (21k tris); sheets/seals Blender-authored.
- **Cohesion mechanism:** One table, one lamp, one paper system — the room is darkness.
- **Polish hook:** The macro: translucent vellum under raking light, fiber and drafting-grid ghosts showing through, the green wax seal mid-frame with wax texture at crayon-detail level.
- **Risk:** Architectural-firm drift; the sheets must read as RFCs (headers, state machines, YAML) at every macro distance or it becomes a generic blueprint scene.

### 16. The Conveyor of Record
- **Scene:** A single industrial conveyor line in a dark hall carrying blackened steel plates under a stamping press, each plate emerging etched with one commit — hash, message, timestamp — and stacking at the line's end.
- **Scroll story:** Acts ride the line (dolly alongside incoming blank plates → truck to the stamping station → macro of the die hitting steel, `a1f9c2e` blooming in the metal → crane over the outfeed stack → top-down of the plate grid → pullback along the whole line, stamping on, steady as a cron).
- **Pillar(s):** Leverage, not heroics (the record stamps itself; the machine works while he sleeps) + Evidence.
- **Asset anchors:** "Conveyor Belt" — Cianon (2.9k tris); "CNC Control Panel" — Vinny Passmore (2.8k tris); "Corded Milling Machine FREE" — Lady Lion Studios (123k tris) for the stamping-station detail language.
- **Cohesion mechanism:** One line, one plate format, one die — input to output in one unbroken motion.
- **Polish hook:** The macro of the strike: the die lands, a bloom of ember light at the impact edge, and the hash stands in the steel with machining-oil sheen.
- **Risk:** Factory/robot-arm adjacency (the #1 reject family) — must be staged as a quiet, human-less record-press, not a manufacturing showcase; the plates are the subject, the line is the pedestal.

### 17. The Ticker Room
- **Scene:** A dark trading-floor-quiet room where a line of ticker machines hangs from the ceiling, each extruding a slow stream of tape — logs from one service — the tapes pooling into soft drifts on the black floor.
- **Scroll story:** Acts move through the tapes (dolly between hanging streams → truck along one tape reading `level=info` lines → macro on ink dots forming characters → crane up to the machine row → top-down of the tape drifts, each drift a service → pullback to the whole room, ticking gently).
- **Pillar(s):** Composed under load (a ticker never panics; it reports) + Evidence (every service, on the record, in real time).
- **Asset anchors:** Blender-authored only (no viable ticker-tape model found in search; machines are simple authored geometry + shader-driven tape).
- **Cohesion mechanism:** One mechanism repeated, one paper material, one slow tempo — the room is a single instrument.
- **Polish hook:** The macro: the ticker's type-wheel stamps a character, ink still wet, and the tape sags under its own weight as the next line arrives.
- **Risk:** Paper-physics perf and a stock-exchange read; the tape content must be structured logs (`ts= level= msg=`), and drift piles need to be baked, not simulated.

### 18. The Memorial Wall
- **Scene:** A single polished black granite wall receding to a vanishing point in a misted plaza, its mirror surface etched with thousands of commit hashes in chronological order — the public record as monument.
- **Scroll story:** Acts trace the chronology (dolly along the wall's length, hashes streaming → truck across reflected etching → macro on one hash's carved characters, self-reflection of the camera ghosted in the polish → crane as the hashes grow sparser… then denser at the present → top-down of the wall's single seam line in the plaza → pullback: one wall, one green etched line at HEAD).
- **Pillar(s):** Evidence over assertion (the log, in stone, in public, with his name in the author column).
- **Asset anchors:** "monolith" — barbodoji (126k tris) for polish/scale reference; wall and etching Blender-authored.
- **Cohesion mechanism:** One wall, one seam, one engraving grid, one mist state.
- **Polish hook:** The macro: the camera's own reflection slides across the polished granite while carved hashes catch raking light — viewer and record sharing one surface.
- **Risk:** War-memorial gravity (names of the dead) — must read as a ledger, not a loss; hash format + author column + the green HEAD line are the difference.

### 19. Concrete Commits
- **Scene:** A brutalist plaza where the floor itself is the record — strata of set concrete slabs, each inscribed with one release's hash and date, the newest slab still wet with a finishing edge, older strata visible at a cutaway trench.
- **Scroll story:** Acts descend through time (top-down of the plaza grid → dolly to the wet slab → macro of the inscribing tool's last stroke in fresh concrete → truck into the cutaway trench → crane down the exposed strata, years stacked → pullback to the plaza: a floor you stand on, made of shipped work).
- **Pillar(s):** Substrate over rent (the record is literally the foundation everyone walks on) + Evidence.
- **Asset anchors:** Blender-authored only (slabs, trench, inscriptions — scanned concrete packs found were barriers/fences, wrong language).
- **Cohesion mechanism:** One plaza, one slab system, one inscription format, one material at different ages.
- **Polish hook:** The macro of the wet stroke: the tool lifts, concrete sheen settling, the final character of `v3.0.0` holding its edge — permanence captured mid-setting.
- **Risk:** Construction-site read and terrain adjacency (rejected family); the cutaway must read as deliberate section drawing, not excavation, and the inscriptions must be the subject, not the ground.

### 20. The Reading Room of Record
- **Scene:** A single circular reading room, shelf-lined to a dark oculus, where every volume on the shelves is one repository and one book lies open on the central lectern, its page a diff.
- **Scroll story:** Acts spiral inward (crane down from the oculus → dolly along the shelf ring, spines reading `infra/`, `agents/`, `rfc/` → truck to the lectern → macro on the open page's diff, green line glowing faintly → top-down of the circular room, lectern at the center → pullback: the room is a single eye looking up).
- **Pillar(s):** Evidence over assertion (the body of work, shelved, open to inspection).
- **Asset anchors:** "Medieval Book Stack" — GetDeadEntertainment (3k tris); "Book Stack" — Paubr (1.6k tris); "1800s Book Stands" — Mad_Lobster_Workshop (21k tris) for the lectern; room Blender-authored.
- **Cohesion mechanism:** One room, one shelf ring, one lectern, one open page — a single point of focus.
- **Polish hook:** The crane from the oculus: descending through the dark shaft, shelf rings catching ember rim one by one, until the open diff on the lectern is the only lit thing in the world.
- **Risk:** Fantasy-library cliché (Babel/Hogwarts drift) — spines must be repo paths, pages must be diffs, and the shelving must be industrial steel, not carved wood.

---

## Self-rating & top 3

Strongest: **1 (Changelog Rack)**, **2 (Black Box)**, **3 (Solari Board)** — all three are
single-subject scenes with natural 6-act vertical/lateral choreography, direct SRE
relevance (rack / incident forensics / deploy history), modest asset budgets, and one
clean corn-level moment each. Runners-up: 4 (Print Room), 18 (Memorial Wall), 8 (Terminal One).
Weakest (kept for divergence): 13 (loom — mechanical adjacency), 17 (ticker — sim cost),
14 (microfiche — obscurity).
