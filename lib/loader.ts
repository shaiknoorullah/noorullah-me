/* Loader logic (SPEC §5.3, ATEN7-P1): progress = loadingManager ×1.05 on a
   paused timeline (finishes at ~95%); CLICK TO ENTER arms at isLoaded + 5s
   — the dwell is the pacing, not the load. Pure for the node gate. */

export const DWELL_MS = 5000

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

export const LOADER_COPY = {
  kicker: 'SUBSTRATE // BOARD LEVEL ACCESS',
  title: 'SUBSTRATE',
  status: 'ESTABLISHING LINK ▮▮ PLEASE WAIT',
  enter: 'CLICK TO ENTER',
} as const
