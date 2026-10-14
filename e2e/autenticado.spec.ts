import { expect, test, type Page } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Flujos con sesión (T2): crear → editar → persistencia, plantilla,
// reorden, foto, duplicar, archivar, borrar y PDF. Requiere las
// credenciales del proyecto `setup`; sin ellas estos specs se saltan.
// Limpieza: todo lo creado lleva el prefijo del run y se borra al final.

// PNG mínimo válido para la subida de foto.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe.serial("panel y editor con sesión", () => {
  const marca = `E2E ${Date.now()}`;
  const titulo = `${marca} base`;
  const tituloEditado = `${marca} editado`;
  let idEditor = "";

  /** El panel cargó (ni esqueletos ni vacío sin resolver). */
  async function esperarPanel(page: Page) {
    await Promise.race([
      page
        .getByRole("button", { name: /Nuevo CV|Crear mi primer CV/ })
        .first()
        .waitFor({ timeout: 30_000 }),
      page
        .getByRole("link", { name: /^Editar / })
        .first()
        .waitFor({ timeout: 30_000 }),
      page
        .getByText(/Nada archivado|Aún no tienes currículums/)
        .first()
        .waitFor({ timeout: 30_000 }),
    ]);
  }

  /** Borra restos de runs anteriores (títulos con prefijo E2E). */
  async function limpiarE2E(page: Page, archivados: boolean) {
    await page.goto(archivados ? "/dashboard/archivados" : "/dashboard");
    // Espera a que el panel cargue (si no, los esqueletos dan conteo 0).
    await esperarPanel(page);
    for (let i = 0; i < 30; i += 1) {
      const enlace = page.getByRole("link", { name: /^Editar E2E / }).first();
      if ((await enlace.count()) === 0) {
        return;
      }
      const nombre =
        (await enlace.evaluate((el) =>
          el.getAttribute("aria-label")?.replace(/^Editar /, ""),
        )) ?? "";
      if (!nombre) {
        return;
      }
      await page
        .getByRole("button", { name: `Acciones para ${nombre}` })
        .click();
      await page
        .getByRole("menuitem", { name: `Eliminar ${nombre}` })
        .click();
      await page.getByRole("button", { name: "Eliminar", exact: true }).click();
      await expect(
        page.getByRole("link", { name: `Editar ${nombre}` }),
      ).toHaveCount(0);
    }
  }

  test.beforeEach(async ({ page }) => {
    // Por si el setup se saltó (sin credenciales), no fallar en rojo.
    test.skip(
      !process.env.E2E_CLERK_EMAIL,
      "sin credenciales E2E_CLERK_EMAIL/E2E_CLERK_PASSWORD",
    );
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Mis currículums" }),
    ).toBeVisible({ timeout: 30_000 });
    await esperarPanel(page);
  });

  async function esperarGuardado(page: Page) {
    await expect(page.getByText("Guardado").first()).toBeVisible({
      timeout: 15_000,
    });
  }

  test("crear CV aparece en el panel", async ({ page }) => {
    await limpiarE2E(page, false);
    await limpiarE2E(page, true);
    await page.goto("/dashboard");
    await esperarPanel(page);
    // Panel vacío: «Crear mi primer CV»; si no, tarjeta «Nuevo CV».
    const nuevo = page.getByRole("button", { name: "Nuevo CV" });
    if ((await nuevo.count()) > 0) {
      await nuevo.click();
    } else {
      await page.getByRole("button", { name: "Crear mi primer CV" }).click();
    }
    await page.locator("#nuevo-cv-titulo").fill(titulo);
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    await expect(
      page.getByRole("link", { name: `Editar ${titulo}` }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("editar el título persiste tras recargar", async ({ page }) => {
    await page.getByRole("link", { name: `Editar ${titulo}` }).click();
    await page.waitForURL("**/editor/**");
    idEditor = page.url().split("/editor/")[1].split(/[?#]/)[0];
    await page.locator("#resume-title").fill(tituloEditado);
    await esperarGuardado(page);
    await page.reload();
    await expect(page.locator("#resume-title")).toHaveValue(tituloEditado);
  });

  test("cambiar de plantilla persiste tras recargar", async ({ page }) => {
    await page.getByRole("link", { name: `Editar ${tituloEditado}` }).click();
    await page.waitForURL("**/editor/**");
    await page.getByRole("tab", { name: "Diseño" }).click();
    await page.getByRole("radio", { name: "Moderno" }).click();
    await esperarGuardado(page);
    await page.reload();
    await page.getByRole("tab", { name: "Diseño" }).click();
    await expect(page.getByRole("radio", { name: "Moderno" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("compatibilidad muestra nivel y el fix de columna persiste", async ({
    page,
  }) => {
    await page.getByRole("link", { name: `Editar ${tituloEditado}` }).click();
    await page.waitForURL("**/editor/**");
    await page.getByRole("tab", { name: "Diseño" }).click();
    await page.getByRole("radio", { name: "Dos columnas" }).click();
    await esperarGuardado(page);
    await page.getByRole("tab", { name: "Compatibilidad" }).click();
    await expect(
      page.getByText(/Compatibilidad: (Alta|Media|Baja)/),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("El CV usa dos columnas.")).toBeVisible();
    await page.getByRole("button", { name: "Pasar a una columna" }).click();
    await esperarGuardado(page);
    await expect(page.getByText("El CV usa dos columnas.")).toHaveCount(0);
  });

  test("bajar una sección reordena y persiste", async ({ page }) => {
    await page.getByRole("link", { name: `Editar ${tituloEditado}` }).click();
    await page.waitForURL("**/editor/**");
    await expect(
      page.getByRole("button", { name: /^Arrastrar / }).first(),
    ).toBeVisible({ timeout: 15_000 });
    const orden = () =>
      page.evaluate(() =>
        Array.from(
          document.querySelectorAll('[aria-label^="Arrastrar "]'),
        ).map((el) => el.getAttribute("aria-label")),
      );
    const antes = (await orden()) as (string | null)[];
    expect(antes.length).toBeGreaterThan(1);
    const primera = antes[0]!.replace(/^Arrastrar /, "");
    await page.getByRole("button", { name: `Más acciones para ${primera}` }).click();
    await page.getByRole("menuitem", { name: `Bajar ${primera}` }).click();
    await esperarGuardado(page);
    const despues = (await orden()) as (string | null)[];
    expect(despues[1]).toBe(antes[0]);
    await page.reload();
    await expect(
      page.getByRole("button", { name: /^Arrastrar / }).first(),
    ).toBeVisible({ timeout: 15_000 });
    const trasRecarga = (await orden()) as (string | null)[];
    expect(trasRecarga[1]).toBe(antes[0]);
  });

  test("subir foto se muestra y persiste", async ({ page }) => {
    await page.getByRole("link", { name: `Editar ${tituloEditado}` }).click();
    await page.waitForURL("**/editor/**");
    const foto = join(mkdtempSync(join(tmpdir(), "e2e-foto-")), "foto.png");
    writeFileSync(foto, PNG_1PX);
    await page.getByLabel("Elegir foto").setInputFiles(foto);
    await expect(
      page.getByRole("img", { name: "Foto del candidato" }),
    ).toBeVisible({ timeout: 15_000 });
    await esperarGuardado(page);
    await page.reload();
    await expect(
      page.getByRole("img", { name: "Foto del candidato" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("exportar PDF devuelve un PDF válido", async ({ page, request }) => {
    await page.getByRole("link", { name: `Editar ${tituloEditado}` }).click();
    await page.waitForURL("**/editor/**");
    const id = page.url().split("/editor/")[1].split(/[?#]/)[0];
    const respuesta = await request.get(`/api/resumes/${id}/pdf`);
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("application/pdf");
    const cuerpo = await respuesta.body();
    expect(cuerpo.subarray(0, 4).toString("latin1")).toBe("%PDF");
    expect(cuerpo.length).toBeGreaterThan(1000);
  });

  test("duplicar, archivar y borrar", async ({ page }) => {
    await page
      .getByRole("button", { name: `Acciones para ${tituloEditado}` })
      .click();
    await page.getByRole("menuitem", { name: `Duplicar ${tituloEditado}` }).click();
    await expect(
      page.getByRole("link", { name: `Editar Copia de ${tituloEditado}` }),
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByRole("button", { name: `Acciones para ${tituloEditado}` })
      .click();
    await page.getByRole("menuitem", { name: `Archivar ${tituloEditado}` }).click();
    await expect(
      page.getByRole("link", { name: `Editar ${tituloEditado}` }),
    ).toHaveCount(0);
    await page.goto("/dashboard/archivados");
    await expect(
      page.getByRole("link", { name: `Editar ${tituloEditado}` }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Acciones para ${tituloEditado}` })
      .click();
    await page
      .getByRole("menuitem", { name: `Desarchivar ${tituloEditado}` })
      .click();
    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: `Editar ${tituloEditado}` }),
    ).toBeVisible();

    // Limpieza: borra la copia y el original del run.
    for (const nombre of [`Copia de ${tituloEditado}`, tituloEditado]) {
      await page
        .getByRole("button", { name: `Acciones para ${nombre}` })
        .click();
      await page.getByRole("menuitem", { name: `Eliminar ${nombre}` }).click();
      await page.getByRole("button", { name: "Eliminar", exact: true }).click();
      await expect(
        page.getByRole("link", { name: `Editar ${nombre}` }),
      ).toHaveCount(0);
    }
    expect(idEditor).not.toBe("");
  });
});
