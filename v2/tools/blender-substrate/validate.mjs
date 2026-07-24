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
const required = ['ihs', 'socket_anchor']
const missing = required.filter((n) => !nodeNames.has(n))
const dieBlocks = [...nodeNames].filter((n) => n.startsWith('dieblock_'))
if (dieBlocks.length < 3) missing.push('dieblock_* (need >= 3)')

const exts = json.extensionsUsed ?? []
const meshopt = exts.includes('EXT_meshopt_compression')
const ktx2 = exts.includes('KHR_texture_basisu')
const nonKtx2Images = (json.images ?? [])
  .filter((img) => img.mimeType !== 'image/ktx2')
  .map((img) => img.name ?? img.mimeType ?? 'unnamed')

const report = {
  ok:
    buf.length <= 6 * 1024 * 1024 &&
    tris <= 210000 &&
    meshopt &&
    ktx2 &&
    nonKtx2Images.length === 0 &&
    missing.length === 0,
  bytes: buf.length,
  tris,
  meshopt,
  ktx2,
  images: (json.images ?? []).length,
  nonKtx2Images,
  missing,
}

process.stdout.write(`${JSON.stringify(report)}\n`)
if (!report.ok) {
  console.error(`budget/structure check failed: ${JSON.stringify(report)}`)
  process.exit(1)
}
