import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

import { resolveBrowserLaunchOptions } from './src/config/playwright';

const browserLaunchOptions = resolveBrowserLaunchOptions(
  process.env.PLAYWRIGHT_EXECUTABLE_PATH,
);

if (!browserLaunchOptions.ok) {
  throw new Error(browserLaunchOptions.error);
}

const customBrowser = browserLaunchOptions.value
  ? { launchOptions: browserLaunchOptions.value }
  : {};

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    ...customBrowser,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'just dev',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
