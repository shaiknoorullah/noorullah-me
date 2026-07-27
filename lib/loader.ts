/* Loader logic (SPEC §5.3, ATEN7-P1): progress = loadingManager ×1.05 on a
   paused timeline (finishes at ~95%); CLICK TO ENTER arms at isLoaded + 5s
   — the dwell is the pacing, not the load. Pure for the node gate. */

export const DWELL_MS = 5000

/* Fix 3 (P5 review — stall hang): a tracked load that starts then stalls
   never sets doneAt, so CLICK TO ENTER never arms. This hard ceiling forces
   arm-eligibility 20s after mount regardless of progress/fonts state. */
export const STALL_CEILING_MS = 20_000

export function loadProgress(loaded: number, total: number): number {
  if (total <= 0) return 1
  return Math.min(1, (loaded / total) * 1.05)
}

export function isArmed(
  doneAtMs: number | null,
  nowMs: number,
  dwellMs = DWELL_MS
): boolean {
  if (doneAtMs === null) return false
  return nowMs - doneAtMs >= dwellMs
}

/* Pure stall-ceiling resolver: returns an already-set doneAt unchanged,
   otherwise forces it to `mountAtMs + ceilingMs` once that ceiling has
   elapsed, else stays null. Kept separate from the mount-time tick loop so
   the stall path is unit-testable without a real stalled network. */
export function resolveDoneAt(
  doneAtMs: number | null,
  mountAtMs: number,
  nowMs: number,
  ceilingMs = STALL_CEILING_MS
): number | null {
  if (doneAtMs !== null) return doneAtMs
  return nowMs - mountAtMs >= ceilingMs ? mountAtMs + ceilingMs : null
}

export const LOADER_COPY = {
  kicker: 'SUBSTRATE // BOARD LEVEL ACCESS',
  title: 'SUBSTRATE',
  status: 'ESTABLISHING LINK ▮▮ PLEASE WAIT',
  enter: 'CLICK TO ENTER',
} as const
