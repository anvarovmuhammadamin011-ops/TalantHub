import { defineConfig, devices } from "@playwright/test";

// Real E2E tests (as opposed to the throwaway browser-automation scripts used during
// development) — run against the local dev stack. Start both servers first:
//   npm run server   (backend, :4000)
//   npm run dev       (frontend, :5173)
// then: npx playwright test
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
