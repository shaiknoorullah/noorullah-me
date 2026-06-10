import { defineConfig, devices } from '@playwright/test'

// Playwright config for noorullah-me
// Spec ref: projects/personal/noorullah-me/04-v1-implementation-spec.md §F7
//   baseURL: http://localhost:3000 (Next.js dev server, per spec §3.1)
//   gate: @axe-core/playwright fixture wired for per-route a11y assertions
//
// Notes:
//   - Suite lives at e2e/ (kept separate from vitest unit tests at tests/).
//   - webServer is auto-started for navigation specs. The current smoke spec
//     intentionally does not navigate, so it passes without a running server.
//   - Browsers: chromium-only by default; firefox/webkit projects are commented
//     in so they can be enabled once the build is hardened.
//   - With `exactOptionalPropertyTypes: true`, optional config fields (workers,
//     webServer) are conditionally spread rather than set to `undefined`.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const isCI = !!process.env.CI

const workersOpt = isCI ? { workers: 1 } : {}

const webServerOpt = process.env.PLAYWRIGHT_WITH_WEB_SERVER
  ? {
      webServer: {
        command: 'bun run dev',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: 'ignore' as const,
        stderr: 'pipe' as const,
      },
    }
  : {}

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],
  ...workersOpt,
  ...webServerOpt,
})
