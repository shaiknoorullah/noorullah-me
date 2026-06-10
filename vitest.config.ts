import { defineConfig } from 'vitest/config'

// Vitest config for noorullah-me
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md §5.2 (unit gate)
export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.{ts,tsx}',
      'components/**/*.test.{ts,tsx}',
      'lib/**/*.test.{ts,tsx}',
    ],
    environment: 'node',
    globals: false,
    reporters: ['default'],
  },
  esbuild: {
    jsx: 'automatic',
  },
})
