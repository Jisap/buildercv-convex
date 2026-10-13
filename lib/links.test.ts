import { expect, test } from "vitest";
import { resumeContentSchema } from "./validation/resume";
import { isAllowedUrlScheme, normalizeLinkUrl } from "./links";

test("esquemas permitidos: http, https, mailto y sin esquema", () => {
  expect(isAllowedUrlScheme("https://example.es")).toBe(true);
  expect(isAllowedUrlScheme("http://example.es")).toBe(true);
  expect(isAllowedUrlScheme("mailto:a@example.es")).toBe(true);
  expect(isAllowedUrlScheme("linkedin.com/in/x")).toBe(true);
  expect(isAllowedUrlScheme("  ")).toBe(true);
});

test("esquemas peligrosos rechazados", () => {
  for (const raw of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<h1>x</h1>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ]) {
    expect(isAllowedUrlScheme(raw), raw).toBe(false);
    expect(normalizeLinkUrl(raw), raw).toBeNull();
  }
});

test("normaliza sin esquema y correos", () => {
  expect(normalizeLinkUrl("linkedin.com/in/x")).toBe(
    "https://linkedin.com/in/x",
  );
  expect(normalizeLinkUrl("  ejemplo.es/cv  ")).toBe("https://ejemplo.es/cv");
  expect(normalizeLinkUrl("nombre@example.es")).toBe(
    "mailto:nombre@example.es",
  );
  expect(normalizeLinkUrl("https://example.es")).toBe("https://example.es");
});

test("no enlazable: vacío, espacios o texto suelto", () => {  expect(normalizeLinkUrl(undefined)).toBeNull();
  expect(normalizeLinkUrl("   ")).toBeNull();
  expect(normalizeLinkUrl("mi portfolio 2024")).toBeNull();
  expect(normalizeLinkUrl("https://exa mple.es")).toBeNull();
});

test("Zod rechaza esquema peligroso en el formulario", () => {
  const base = {
    sections: [
      {
        id: "s1",
        type: "personal",
        title: "Datos",
        order: 0,
        visible: true,
        items: [
          { id: "p1", links: [{ id: "l1", url: "javascript:alert(1)" }] },
        ],
      },
    ],
  };
  expect(resumeContentSchema.safeParse(base).success).toBe(false);
  const ok = {
    sections: [
      {
        id: "s1",
        type: "personal",
        title: "Datos",
        order: 0,
        visible: true,
        items: [
          { id: "p1", links: [{ id: "l1", url: "linkedin.com/in/x" }] },
        ],
      },
    ],
  };
  expect(resumeContentSchema.safeParse(ok).success).toBe(true);
});
