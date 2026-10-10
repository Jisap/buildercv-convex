import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Accesibilidad básica en rutas públicas (sin sesión).

for (const path of ["/", "/signin", "/signup"]) {
  test(`axe en ${path} sin violaciones críticas ni serias`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const graves = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    );
    expect(
      graves.map((v) => `${v.id}: ${v.description}`),
      `violaciones en ${path}`,
    ).toEqual([]);
  });
}
