import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Las credenciales E2E viven en `.env.local` (gitignorado, nunca en el
// repo); `dotenv/config` a secas solo leería `.env`.
dotenv.config({ path: ".env.local" });

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
    // Sesión una vez para los specs con usuario (T2); sin credenciales
    // E2E_* se salta en silencio y esos specs también.
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "desktop",
      testIgnore: [/autenticado/, /.*\.setup\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: [/autenticado/, /.*\.setup\.ts/],
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "autenticado",
      testMatch: /autenticado/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
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
