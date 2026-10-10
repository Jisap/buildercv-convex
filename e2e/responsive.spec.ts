import { expect, test } from "@playwright/test";

// Sin scroll horizontal en rutas públicas (escritorio y móvil según proyecto).

for (const path of ["/", "/signin", "/signup"]) {
  test(`sin desborde horizontal en ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollWidth - window.innerWidth;
    });
    expect(overflow, `desborde en ${path}`).toBeLessThanOrEqual(1);
  });
}
