import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Accesibilidad en rutas públicas (sin sesión), en claro y oscuro.
// Incluye las tarjetas de Clerk (D3) y el contraste de secundarios (F4):
// la regla color-contrast de axe es seria y también corre en oscuro.
// El editor (pestañas Contenido/Diseño), el panel con tarjetas y el menú
// ⋯ abierto exigen sesión —Clerk necesita su entorno de testing para E2E—
// y se verifican manualmente (ver informe final del flujo F).

for (const path of ["/", "/signin", "/signup"]) {
  for (const theme of ["light", "dark"] as const) {
    test(`axe en ${path} (${theme}) sin violaciones críticas ni serias`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.evaluate((t) => localStorage.setItem("theme", t), theme);
      await page.reload();
      if (theme === "dark") {
        await expect(page.locator("html.dark")).toHaveCount(1);
      }
      // Clerk pinta sus tarjetas de forma asíncrona: esperar a que cargue
      // antes de medir contraste, o axe ve texto aún sin estilos.
      await page
        .waitForFunction(
          () =>
            (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk
              ?.loaded === true,
          undefined,
          { timeout: 15000 },
        )
        .catch(() => undefined);
      // El pie «Secured by Clerk» (.cl-footer) es marca de terceros con
      // contraste propio 3,33 que la API appearance no permite corregir:
      // se excluye del análisis; el resto de la tarjeta sí se verifica.
      const results = await new AxeBuilder({ page })
        .exclude(".cl-footer")
        .analyze();
      const graves = results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? ""),
      );
      expect(
        graves.map((v) => `${v.id}: ${v.description}`),
        `violaciones en ${path} (${theme})`,
      ).toEqual([]);
    });
  }
}
