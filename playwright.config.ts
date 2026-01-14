import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker to avoid conflicts
  timeout: 60000, // 60 seconds per test
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://ftwebinars.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: process.env.PLAYWRIGHT_LAUNCH_ARGS ? JSON.parse(process.env.PLAYWRIGHT_LAUNCH_ARGS) : undefined,
    } : undefined,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.spec\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: [],
      testIgnore: [
        '**/setup-google-auth.spec.ts', // Run manually only
        '**/purchase.spec.ts', // Old test file
      ],
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.spec\.ts/,
    },
  ],
});
