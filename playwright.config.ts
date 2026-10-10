import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Reutiliza el `npm run dev` del desarrollador si existe; si no,
  // arranca uno propio en el mismo puerto.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/",
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      ...process.env,
    } as Record<string, string>,
  },
});
