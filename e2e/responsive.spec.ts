import { expect, test } from "@playwright/test";

// Sin scroll horizontal en rutas públicas (escritorio y móvil según
// proyecto). El panel y el editor exigen sesión y se revisan manualmente.

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

test.describe("a 360 px (F3)", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const path of ["/", "/signin", "/signup"]) {
    for (const theme of ["light", "dark"] as const) {
      test(`sin desborde en ${path} (${theme})`, async ({ page }) => {
        await page.goto(path);
        await page.evaluate((t) => localStorage.setItem("theme", t), theme);
        await page.reload();
        const overflow = await page.evaluate(() => {
          const el = document.scrollingElement ?? document.documentElement;
          return el.scrollWidth - window.innerWidth;
        });
        expect(overflow, `desborde en ${path} (${theme})`).toBeLessThanOrEqual(
          1,
        );
      });
    }
  }
});
