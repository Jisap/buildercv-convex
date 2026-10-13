import { expect, test } from "vitest";
import { ConvexError } from "convex/values";
import { createDefaultContent } from "../lib/resume";
import type { ResumeContent } from "../types/resume";
import { assertContentLimits } from "./contentLimits";

function expectRejects(content: ResumeContent, fragment: string) {
  try {
    assertContentLimits(content);
  } catch (e) {
    expect(e).toBeInstanceOf(ConvexError);
    expect((e as Error).message).toContain(fragment);
    return;
  }
  throw new Error(`Se esperaba rechazo con «${fragment}»`);
}

test("contenido válido por defecto pasa", () => {
  expect(() => assertContentLimits(createDefaultContent())).not.toThrow();
});

test("demasiadas secciones e items", () => {
  const base = createDefaultContent();
  const many = {
    sections: Array.from({ length: 31 }, (_, i) => ({
      ...base.sections[2],
      id: `s${i}`,
    })),
  } as unknown as ResumeContent;
  expectRejects(many, "Máximo 30");

  const one = createDefaultContent();
  const exp = one.sections.find((s) => s.type === "experience")!;
  const bloated = {
    sections: [
      { ...exp, items: Array.from({ length: 51 }, (_, i) => ({ id: `i${i}` })) },
    ],
  } as unknown as ResumeContent;
  expectRejects(bloated, "Demasiados elementos");
});

test("IDs duplicados y títulos vacíos", () => {
  const base = createDefaultContent();
  const [a, b] = base.sections;
  expectRejects(
    { sections: [{ ...a }, { ...b, id: a.id }] } as unknown as ResumeContent,
    "duplicados",
  );
  expectRejects(
    { sections: [{ ...a, title: "  " }] } as unknown as ResumeContent,
    "Título",
  );
});

test("URLs con esquema peligroso rechazadas", () => {
  const base = createDefaultContent();
  const personal = base.sections.find((s) => s.type === "personal")!;
  const withJsLink = {
    sections: [
      {
        ...personal,
        items: [
          {
            ...personal.items[0],
            links: [{ id: "l1", label: "X", url: "javascript:alert(1)" }],
          },
        ],
      },
    ],
  } as unknown as ResumeContent;
  expectRejects(withJsLink, "URL de enlace");

  const projects = {
    sections: [
      {
        id: "s-proj",
        type: "projects",
        title: "Proyectos",
        order: 0,
        visible: true,
        items: [{ id: "p1", url: "data:text/html,<h1>x</h1>" }],
      },
    ],
  } as unknown as ResumeContent;
  expectRejects(projects, "URL");

  const withHttps = {
    sections: [
      {
        ...personal,
        items: [
          {
            ...personal.items[0],
            links: [{ id: "l1", label: "Web", url: "https://example.es" }],
          },
        ],
      },
    ],
  } as unknown as ResumeContent;
  expect(() => assertContentLimits(withHttps)).not.toThrow();
});

test("fechas, niveles y tamaños", () => {
  const base = createDefaultContent();
  const exp = base.sections.find((s) => s.type === "experience")!;
  const withBadDate = {
    sections: [{ ...exp, items: [{ id: "x", startDate: "2024-13" }] }],
  } as unknown as ResumeContent;
  expectRejects(withBadDate, "Fecha");

  const skills = base.sections.find((s) => s.type === "skills")!;
  const withBadLevel = {
    sections: [{ ...skills, items: [{ id: "x", level: 9 }] }],
  } as unknown as ResumeContent;
  expectRejects(withBadLevel, "rango");

  const profile = base.sections.find((s) => s.type === "profile")!;
  const withHugeText = {
    sections: [{ ...profile, items: [{ id: "x", text: "a".repeat(6000) }] }],
  } as unknown as ResumeContent;
  expectRejects(withHugeText, "no válido");
});
