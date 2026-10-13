import { chromium, expect, test, type Browser } from "@playwright/test";
import { PDFParse } from "pdf-parse";
import { buildPrintHtml } from "../features/exports/printDocument";
import {
  LONG_CONTENT,
  SHORT_CONTENT,
  SHORT_DESIGN,
} from "../features/exports/fixtures";
import { TEMPLATES } from "../features/templates/types";
import { layoutFromContent } from "../lib/resume-layout";
import { withDesignDefaults } from "../lib/resume";
import type {
  ResumeContent,
  ResumeDesign,
  ResumeLayout,
} from "../types/resume";

// Matriz de paridad preview/PDF (T1): 9 plantillas × {corto, largo} ×
// {1 columna, 2 columnas} × {con foto, sin foto} = 72 celdas. Cada celda
// genera el PDF con el mismo `buildPrintHtml` que la ruta y comprueba:
// (a) PDF generado, (b) texto íntegro extraído (sin secciones ocultas),
// (c) páginas razonables, (d) enlaces como anotaciones (tras F1).
// Sin sesión ni Convex: no toca la red salvo recursos `data:`.
// Comando: `npm run test:pdf`.

const FOTO_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const TEXTO_CORTO = [
  "Ana Ruiz",
  "ana@example.es",
  "Técnica",
  "Acme",
  "Soporte y mantenimiento",
];

const TEXTO_LARGO = [
  "José María",
  "Ñíguez",
  "A Coruña",
  "actualidad",
  "Empresa Alfa S.L.",
  "Empresa Épsilon S.A.",
  "Competencia número 15",
  "Charla: diseño para todos",
  "Gallego",
];

const TEXTO_OCULTO = "TextoOcultoQueNoDebeSalir";

let navegador: Browser;

test.beforeAll(async () => {
  navegador = await chromium.launch();
});

test.afterAll(async () => {
  await navegador.close();
});

async function pdfDe(
  titulo: string,
  contenido: ResumeContent,
  diseño: ResumeDesign,
  layout: ResumeLayout | null,
  foto: string | null,
): Promise<Buffer> {
  const html = await buildPrintHtml(
    titulo,
    contenido,
    withDesignDefaults(diseño),
    layout,
    foto,
  );
  const pagina = await navegador.newPage();
  try {
    await pagina.setContent(html, { waitUntil: "domcontentloaded" });
    await pagina.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? undefined
            : new Promise((resolver) => {
                img.addEventListener("load", resolver, { once: true });
                img.addEventListener("error", resolver, { once: true });
              }),
        ),
      ),
    );
    const pdf = await pagina.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await pagina.close();
  }
}

async function textoDe(pdf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const resultado = await parser.getText();
    return resultado.text.replace(/\s+/g, " ");
  } finally {
    await parser.destroy();
  }
}

/** URLs de las anotaciones de enlace del PDF (las que Chromium conserva). */
async function enlacesDe(pdf: Buffer): Promise<string[]> {
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const info = await parser.getInfo({ parsePageInfo: true });
    const paginas = (info.pages ?? []) as {
      links?: { url?: string }[];
    }[];
    return paginas.flatMap((p) => (p.links ?? []).map((l) => l.url ?? ""));
  } finally {
    await parser.destroy();
  }
}

function layoutDosColumnas(contenido: ResumeContent): ResumeLayout {
  const ids = contenido.sections.map((s) => s.id);
  const mitad = Math.ceil(ids.length / 2);
  return { main: ids.slice(0, mitad), sidebar: ids.slice(mitad) };
}

for (const meta of TEMPLATES) {
  for (const variante of ["corto", "largo"] as const) {
    for (const columnas of ["1col", "2col"] as const) {
      for (const foto of ["confoto", "sinfoto"] as const) {
        const nombre =
          `${meta.id} · ${variante} · ${columnas} · ${foto === "confoto" ? "con foto" : "sin foto"}`;
        test(nombre, async () => {
          const contenido = variante === "corto" ? SHORT_CONTENT : LONG_CONTENT;
          const diseño: ResumeDesign = {
            ...SHORT_DESIGN,
            templateId: meta.id,
            layoutId: columnas === "2col" ? "two-col" : "single",
          };
          const layout =
            columnas === "2col"
              ? layoutDosColumnas(contenido)
              : layoutFromContent(contenido);
          const pdf = await pdfDe(
            "CV de prueba",
            contenido,
            diseño,
            layout,
            foto === "confoto" ? FOTO_1PX : null,
          );
          expect(pdf.subarray(0, 4).toString("latin1"), "cabecera PDF").toBe(
            "%PDF",
          );
          const conEnlaces = variante === "largo";
          const texto = await textoDe(pdf);
          const esperados =
            variante === "corto" ? TEXTO_CORTO : TEXTO_LARGO;
          for (const fragmento of esperados) {
            expect(texto, `«${fragmento}» en ${nombre}`).toContain(fragmento);
          }
          // Las ocultas no salen ni dejan rastro.
          expect(texto, `oculta ausente en ${nombre}`).not.toContain(
            TEXTO_OCULTO,
          );
          // Enlaces del fixture largo como anotaciones clicables (F1).
          if (conEnlaces) {
            const urls = await enlacesDe(pdf);
            expect(urls, `enlace en ${nombre}`).toContain(
              "https://linkedin.example/jose",
            );
          }
          // Paginación razonable: el corto cabe en una; el largo fluye en
          // varias sin desmadrarse (compacto/modern largos daban 3).
          const lector = new PDFParse({ data: new Uint8Array(pdf) });
          let paginas = 0;
          try {
            paginas = (await lector.getText()).pages.length;
          } finally {
            await lector.destroy();
          }
          if (variante === "corto") {
            expect(paginas, `páginas en ${nombre}`).toBe(1);
          } else {
            expect(paginas, `páginas en ${nombre}`).toBeGreaterThanOrEqual(2);
            expect(paginas, `páginas en ${nombre}`).toBeLessThanOrEqual(8);
          }
        });
      }
    }
  }

  test(`${meta.id} · captura de referencia (corto, 1 col)`, async () => {
    const diseño: ResumeDesign = {
      ...SHORT_DESIGN,
      templateId: meta.id,
      layoutId: "single",
    };
    const html = await buildPrintHtml(
      "CV de prueba",
      SHORT_CONTENT,
      withDesignDefaults(diseño),
      layoutFromContent(SHORT_CONTENT),
      null,
    );
    const pagina = await navegador.newPage();
    try {
      await pagina.setContent(html, { waitUntil: "domcontentloaded" });
      const captura = await pagina.screenshot({ fullPage: true });
      expect(captura).toMatchSnapshot(`${meta.id}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    } finally {
      await pagina.close();
    }
  });
}
