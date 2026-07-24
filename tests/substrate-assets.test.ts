import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

/* Asset budgets from SPEC §3/§7: single substrate.glb with meshopt + KTX2,
   ≤6MB total, authored node contract for the runtime (IHS, socket anchor,
   die blocks), tri ceiling covering board 82k + die 98k + set dressing. */
describe('substrate.glb budgets', () => {
  it('passes the pipeline validator', () => {
    const out = execFileSync(
      'node',
      [
        'v2/tools/blender-substrate/validate.mjs',
        'public/assets/substrate.glb',
      ],
      { encoding: 'utf8' }
    )
    const report = JSON.parse(out)
    expect(report.ok).toBe(true)
    expect(report.bytes).toBeLessThanOrEqual(6 * 1024 * 1024)
    // director change 2026-07-24: strix hero swap, 300-400k board decimation budget
    expect(report.tris).toBeLessThanOrEqual(520000)
    expect(report.meshopt).toBe(true)
    expect(report.ktx2).toBe(true)
    expect(report.nonKtx2Images).toEqual([])
    expect(report.missing).toEqual([])
  })
})
