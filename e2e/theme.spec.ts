import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Tema oscuro en rutas públicas: next-themes lee `localStorage.theme`
// antes de pintar, así se evita el destello del tema claro.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem("theme", "dark");
  });
});

test("landing en oscuro aplica la clase y pasa axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html.dark")).toHaveCount(1);
  const results = await new AxeBuilder({ page }).analyze();
  const graves = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact ?? ""),
  );
  expect(
    graves.map((v) => `${v.id}: ${v.description}`),
    "violaciones en / (oscuro)",
  ).toEqual([]);
});

test("conmutador de tema visible y operativo en la landing", async ({
  page,
}) => {
  await page.goto("/");
  const group = page.getByRole("group", { name: "Tema de la aplicación" });
  await expect(group).toBeVisible();
  await group.getByRole("button", { name: "Tema claro" }).click();
  await expect(page.locator("html.light")).toHaveCount(1);
  await group.getByRole("button", { name: "Tema oscuro" }).click();
  await expect(page.locator("html.dark")).toHaveCount(1);
});
