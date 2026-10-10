import { expect, test } from "@playwright/test";

// Flujos sin sesión. Los flujos autenticados (crear/editar/exportar) se
// verifican manualmente (ver docs/implementation-plan.md Fase 6): Clerk
// exige su propio entorno de testing para sesiones en E2E.

test("la landing carga con navegación", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /currículums/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /mi panel/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test("/dashboard sin sesión redirige al login", async ({ request }) => {
  // Con header de navegador: Clerk redirige (sin él devuelve 404, ver plan).
  const response = await request.get("/dashboard", {
    maxRedirects: 0,
    headers: { Accept: "text/html" },
  });
  expect([307, 308]).toContain(response.status());
});

test("/editor sin sesión redirige al login", async ({ request }) => {
  const response = await request.get("/editor/abc123", {
    maxRedirects: 0,
    headers: { Accept: "text/html" },
  });
  expect([307, 308]).toContain(response.status());
});

test("la API PDF sin sesión devuelve 401", async ({ request }) => {
  const response = await request.get("/api/resumes/abc123/pdf");
  expect(response.status()).toBe(401);
});

test("/signin muestra el formulario en español", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByText(/entrar/i).first()).toBeVisible();
});

test("/signup muestra el registro en español", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByText(/crea tu cuenta/i).first()).toBeVisible();
});
