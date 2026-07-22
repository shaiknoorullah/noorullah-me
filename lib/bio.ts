// Bio strings — sourced from the vault.
//
// Source of truth: projects/personal/noorullah-me/01-bio.md (FROZEN voice).
// Updates: when the vault drifts, mirror the relevant version here.
//
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md F12
//   "/ renders <Logo variant=wordmark/> + 30w bio + status footer"
//
// Word count is asserted at build time by the unit gate.

/**
 * 30-word one-liner. Surfaces: GitHub bio, Twitter bio, email signature,
 * `/` hero subtitle.
 */
export const BIO_30W =
  'Platform engineer. Built a 99.999% multi-cloud Kubernetes PaaS solo when the team contracted 11→5. Self-taught, multi-agent leverage believer, FOSS-first. Hyderabad → US-remote. Substrate over rent.'

/**
 * Status footer string. Surfaces: `<StatusLine>` in `/`, fallback before the
 * full Phase 1 terminal primitive lands. Spec ref §3.3 (`<StatusLine>`).
 *
 * Format mirrors the lazygit / vim statusline vocabulary: location · currently
 * building. Prayer time slot is intentionally omitted until the
 * `<PrayerWidget>` ships in Phase 4 (M2).
 */
export const STATUS_LOCATION = 'Hyderabad, IN'
export const STATUS_BUILDING = 'Fleet Commander · noorullah.me v1'
