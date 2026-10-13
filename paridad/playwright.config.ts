import { defineConfig } from "@playwright/test";

// Paridad preview/PDF (T1): no necesita el servidor de Next (usa
// `buildPrintHtml` + Chromium directamente), así que no hay `webServer`.
// Se ejecuta con `npm run test:pdf`. Las capturas de referencia viven en
// `paridad/pdf-parity.spec.ts-snapshots/` y se regeneran a conciencia con
// `npm run test:pdf -- --update-snapshots`.
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  timeout: 90_000,
  projects: [{ name: "paridad" }],
});
