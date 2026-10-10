/**
 * @vitest-environment jsdom
 */
import { expect, test } from "vitest";
import { LONG_CONTENT, SHORT_CONTENT, SHORT_DESIGN } from "./fixtures";
import { buildPrintHtml } from "./printDocument";
import { PRINT_CSS } from "./printCss";

test("el HTML de impresión contiene todo el contenido", async () => {
  const html = await buildPrintHtml("Mi CV", SHORT_CONTENT, SHORT_DESIGN);
  for (const text of ["Ana Ruiz", "ana@example.es", "Técnica", "Acme"]) {
    expect(html).toContain(text);
  }
  expect(html).toContain("<html");
  expect(html).toContain("Mi CV");
});

test("el CSS fija A4, márgenes y reglas de salto", () => {
  expect(PRINT_CSS).toContain("@page");
  expect(PRINT_CSS).toContain("size: A4");
  expect(PRINT_CSS).toContain("margin:");
  expect(PRINT_CSS).toContain("break-inside: avoid");
  expect(PRINT_CSS).toContain("break-after: avoid");
  expect(PRINT_CSS).toContain("print-color-adjust: exact");
});

test("el fixture largo incluye casos límite", async () => {
  const html = await buildPrintHtml("CV largo", LONG_CONTENT, {
    ...SHORT_DESIGN,
    templateId: "compact",
  });
  for (const text of [
    "Ñíguez",
    "A Coruña",
    "actualidad",
    "Empresa Alfa S.L.",
    "Competencia número 15",
    "Charla: diseño para todos",
    "Publicaciones y charlas",
  ]) {
    expect(html, `debe contener «${text}»`).toContain(text);
  }
});

test("el título se escapa en el <title>", async () => {
  const html = await buildPrintHtml('CV <script> & "x"', SHORT_CONTENT, SHORT_DESIGN);
  expect(html).toContain("CV &lt;script&gt; &amp; &quot;x&quot;");
  expect(html).not.toContain("<script> &");
});
