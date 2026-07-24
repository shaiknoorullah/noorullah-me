#!/usr/bin/env node
/* substrate.glb budget + structure validator (SPEC §3/§7).
   Parses the GLB container directly (12-byte header, JSON chunk, BIN chunk)
   — no three.js needed, runs anywhere node ≥ 20 does.
   Usage: node validate.mjs <path.glb>  →  JSON report on stdout.
   Exit 0 = ok, exit 1 = any check failed (details on stderr). */
import { readFileSync, existsSync } from 'node:fs'

const path = process.argv[2]
if (!path || !existsSync(path)) {
  console.error(`GLB not found: ${path ?? '(no path given)'}`)
  process.exit(1)
}

const buf = readFileSync(path)
const fail = (msg) => {
  console.error(`FAIL: ${msg}`)
  process.exit(1)
}

if (buf.readUInt32LE(0) !== 0x46546c67) fail('bad magic (not a GLB)')
const jsonLen = buf.readUInt32LE(12)
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'))

/* triangles: sum indices/3 (or POSITION count/3) across primitives */
const accessors = json.accessors ?? []
let tris = 0
for (const mesh of json.meshes ?? []) {
  for (const prim of mesh.primitives ?? []) {
    const mode = prim.mode ?? 4
    if (mode !== 4) continue
    if (prim.indices !== undefined) {
      tris += Math.floor((accessors[prim.indices]?.count ?? 0) / 3)
    } else {
      const pos = prim.attributes?.POSITION
      tris += Math.floor((accessors[pos]?.count ?? 0) / 3)
    }
  }
}

const nodeNames = new Set((json.nodes ?? []).map((n) => n.name ?? ''))
const required = ['ihs', 'socket_anchor', 'socket_anchor_die', 'plinth', 'floor']
const missing = required.filter((n) => !nodeNames.has(n))
const dieBlocks = [...nodeNames].filter((n) => n.startsWith('dieblock_'))
if (dieBlocks.length < 3) missing.push('dieblock_* (need >= 3)')

/* the trace-mask courier (SPEC 5.1): a mt_solder_traced material MUST
   carry an emissiveTexture — export.py works around the exporter dropping
   it at strength 0, and this gate catches any regression of that hack */
const courierOk = (json.materials ?? []).some(
  (m) => (m.name ?? '').startsWith('mt_solder_traced') && m.emissiveTexture,
)

const exts = json.extensionsUsed ?? []
const meshopt = exts.includes('EXT_meshopt_compression')
const ktx2 = exts.includes('KHR_texture_basisu')

/* in-GLB KTX2 dims must be <= 2048 (SPEC §7) — parse each KTX2 header
   (pixelWidth/Height at byte 20/24 past the bufferView start). Added after
   an 8K source texture shipped verbatim past the sidecar-only check. */
const binStart = 20 + jsonLen + 8
const oversizedGlbImages = (json.images ?? [])
  .filter((img) => img.bufferView !== undefined)
  .filter((img) => {
    const bv = json.bufferViews[img.bufferView]
    const o = binStart + (bv.byteOffset ?? 0)
    return buf.readUInt32LE(o + 20) > 2048 || buf.readUInt32LE(o + 24) > 2048
  })
  .map((img) => img.name ?? 'unnamed')
const nonKtx2Images = (json.images ?? [])
  .filter((img) => img.mimeType !== 'image/ktx2')
  .map((img) => img.name ?? img.mimeType ?? 'unnamed')

/* director addendum 2026-07-24: light-story bakes + matcap trio + spill.
   Sidecars ship next to the GLB (no glTF slot for lightmaps); PNG this
   phase (no basisu binary for standalone KTX2 — see run_all.sh note). */
import { dirname, join } from 'node:path'
const assetsDir = dirname(path)
const sidecars = [
  'tracemap-src.png',
  'lightstory/lightmap_solder.png',
  'lightstory/lightmap_component.png',
  'lightstory/lightmap_darkmetal.png',
  'lightstory/lightmap_granite.png',
  'lightstory/curvature_component.png',
  'lightstory/curvature_darkmetal.png',
  'lightstory/bentnorm_solder.png',
  'lightstory/bentnorm_component.png',
  'imperfect/scratch_normal.png',
  'imperfect/smudge_mask.png',
  'matcaps/matcap-die-base.png',
  'matcaps/matcap-die-ao.png',
  'matcaps/matcap-die-spec.png',
]
const missingSidecars = sidecars.filter((f) => !existsSync(join(assetsDir, f)))
/* PNG dims from IHDR (bytes 16-23) — every sidecar must be <= 2048 */
const oversized = sidecars
  .filter((f) => existsSync(join(assetsDir, f)))
  .filter((f) => {
    const b = readFileSync(join(assetsDir, f))
    return b.readUInt32BE(16) > 2048 || b.readUInt32BE(20) > 2048
  })

const report = {
  ok:
    buf.length <= 6 * 1024 * 1024 &&
    tris <= 520000 && /* director change 2026-07-24: strix hero, 300-400k board budget */
    meshopt &&
    ktx2 &&
    nonKtx2Images.length === 0 &&
    missing.length === 0 &&
    missingSidecars.length === 0 &&
    oversized.length === 0 &&
    oversizedGlbImages.length === 0 &&
    courierOk,
  bytes: buf.length,
  tris,
  meshopt,
  ktx2,
  images: (json.images ?? []).length,
  nonKtx2Images,
  missing,
  missingSidecars,
  oversized,
  oversizedGlbImages,
  courierOk,
}

process.stdout.write(`${JSON.stringify(report)}\n`)
if (!report.ok) {
  console.error(`budget/structure check failed: ${JSON.stringify(report)}`)
  process.exit(1)
}
