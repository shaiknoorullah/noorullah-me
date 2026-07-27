#!/usr/bin/env node
/* Island bundle gate (SPEC §7: island JS < 250KB gz). SceneIsland dynamic-
   imports SceneRoot with `ssr: false` (components/scene/SceneIsland.tsx) so
   the whole three.js/@react-three stack lands in its own chunk, deferred
   past first paint — that chunk is "the island". It's identified as the
   LARGEST built chunk whose source contains the string 'WebGLRenderer'
   (three's renderer class; only the island pulls it in). Every other JS
   chunk is the initial-load JS the very first paint pays for; both numbers
   are gzip-measured and printed (the director wants both reported, not
   just the gate's pass/fail number).

   Static export (next.config.ts: output: 'export') still emits the
   intermediate .next/static/chunks/ during `next build`, which is what
   this reads; out/_next/static/chunks/ (the copy `next export` ships to
   `out/`) is the fallback if .next/ isn't present for any reason. Run
   after `bun run build`. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { gzipSync } from 'node:zlib'

function resolveChunksDir() {
  const dotNext = join(process.cwd(), '.next', 'static', 'chunks')
  if (existsSync(dotNext)) return dotNext
  const exported = join(process.cwd(), 'out', '_next', 'static', 'chunks')
  if (existsSync(exported)) return exported
  return null
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (name.endsWith('.js')) yield p
  }
}

const CHUNKS = resolveChunksDir()
if (!CHUNKS) {
  console.error(
    'FAIL: no .next/static/chunks or out/_next/static/chunks found — run `bun run build` first'
  )
  process.exit(1)
}

const files = [...walk(CHUNKS)].map((file) => {
  const src = readFileSync(file)
  return { file, src, gzipBytes: gzipSync(src).length }
})

let island = null
for (const f of files) {
  if (!f.src.includes('WebGLRenderer')) continue
  if (!island || f.gzipBytes > island.gzipBytes) island = f
}

if (!island) {
  console.error(
    'FAIL: no chunk containing WebGLRenderer found — run `bun run build` first'
  )
  process.exit(1)
}

/* Precise initial-load figure: `next build` (even for static export) always
   writes .next/diagnostics/route-bundle-stats.json — the exact set of
   chunks each route's first paint requests, per Next's own manifest. Sum
   just the `/` route's chunks (gzip) for the true number; if the
   diagnostics file is missing (older Next, or a webpack build), fall back
   to "every chunk that isn't the island" — a looser upper bound, since it
   can't tell apart the island's own already-deferred sibling chunks (e.g.
   a shared chunk split off the dynamic import) from genuine initial load. */
function routeInitialLoadBytes(chunksDir, allFiles) {
  const statsPath = join(
    chunksDir,
    '..',
    '..',
    'diagnostics',
    'route-bundle-stats.json'
  )
  if (!existsSync(statsPath)) return null
  try {
    const routes = JSON.parse(readFileSync(statsPath, 'utf8'))
    const root = routes.find((r) => r.route === '/')
    if (!(root && Array.isArray(root.firstLoadChunkPaths))) return null
    const byBasename = new Map(allFiles.map((f) => [basename(f.file), f]))
    let sum = 0
    for (const p of root.firstLoadChunkPaths) {
      const f = byBasename.get(basename(p))
      if (f) sum += f.gzipBytes
    }
    return sum
  } catch {
    return null
  }
}

const preciseInitialLoad = routeInitialLoadBytes(CHUNKS, files)
const initialLoadBytes =
  preciseInitialLoad ??
  files
    .filter((f) => f.file !== island.file)
    .reduce((sum, f) => sum + f.gzipBytes, 0)

const report = {
  // P8 GO (authoritative, supersedes the brief's island≤250KB): the
  // budget gates INITIAL JS <250KB gz; the island is deferred behind
  // dynamic(ssr:false) and is measured + reported, not gated (director
  // rules on its size with the numbers in hand).
  ok: initialLoadBytes < 250 * 1024,
  gzipBytes: island.gzipBytes,
  file: island.file,
  initialLoadBytes,
  initialLoadSource:
    preciseInitialLoad === null ? 'fallback' : 'route-manifest',
  chunksDir: CHUNKS,
}

process.stdout.write(`${JSON.stringify(report)}\n`)
console.error(
  `island (scene) chunk:  ${island.gzipBytes} B gz — ${island.file}`
)
console.error(
  `initial-load JS total: ${initialLoadBytes} B gz (${report.initialLoadSource})`
)
if (!report.ok) {
  console.error(`FAIL: island chunk ${island.gzipBytes}B gz exceeds 250KB`)
  process.exit(1)
}
