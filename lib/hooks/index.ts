/**
 * Custom React Hooks
 *
 * Ported from darkroom.engineering/satus (F2 strip-skeleton).
 * `use-device-detection` is deferred until lib/styles/config + lib/webgl land
 * in a later task — it needs the breakpoints token + GPU detection utility.
 */

export { useMediaQuery } from 'hamo'
export { usePrefetch } from './use-prefetch'
export { useReveal } from './use-reveal'
export {
  useDocumentVisibility,
  useOnlineStatus,
  usePreferredColorScheme,
  usePreferredReducedMotion,
} from './use-sync-external'
