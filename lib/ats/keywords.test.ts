import { describe, expect, it } from "vitest";
import type { ResumeContent, ResumeSection } from "../../types/resume";
import { analyzeAts } from "./analyze";
import type { AtsInput } from "./types";
import {
  JOB_TEXT_MAX_CHARS,
  analyzeKeywords,
  cvToPlainText,
  extractKeywords,
  normalizeText,
  termMatches,
  wordVariants,
} from "./keywords";
import { SHORT_CONTENT, SHORT_DESIGN } from "../../features/exports/fixtures";

function section(
  id: string,
  type: ResumeSection["type"],
  title: string,
  items: Record<string, unknown>[],
  visible = true,
): ResumeSection {
  return {
    id,
    type,
    title,
    order: 0,
    visible,
    items: items.map((item, i) => ({ id: `${id}-${i}`, ...item })),
  } as ResumeSection;
}

const CONTENT: ResumeContent = {
  sections: [
    section("personal", "personal", "Datos personales", [
      { fullName: "Ana Ruiz", email: "ana@example.es" },
    ]),
    section("profile", "profile", "Perfil profesional", [
      { text: "Desarrolladora frontend con React y TypeScript." },
    ]),
    section("exp", "experience", "Experiencia", [
      {
        position: "Desarrolladora frontend",
        company: "Acme",
        description: "Interfaces con React, pruebas con Playwright.",
      },
    ]),
    section("skills", "skills", "Competencias", [
      { name: "React", level: 5 },
      { name: "TypeScript", level: 4 },
    ]),
    section("oculta", "custom", "TextoOcultoQueNoDebeSalir", [
      { title: "Secreto", description: "palabraclaveoculta" },
    ], false),
  ],
};

describe("normalizeText", () => {
  it("minúsculas, sin acentos ni ruido", () => {
    expect(normalizeText("  José María Ñíguez, ¡frontend!  ")).toBe(
      "jose maria niguez frontend",
    );
  });
});

describe("wordVariants", () => {
  it("singular y plural en castellano", () => {
    expect(wordVariants("clases")).toContain("clase");
    expect(wordVariants("desarrolladores")).toContain("desarrollador");
    expect(wordVariants("test")).toContain("tests");
  });

  it("no rompe tecnicismos", () => {
    expect(wordVariants("css")).toEqual(["css"]);
    expect(wordVariants("class")).toEqual(["class"]);
  });
});

describe("extractKeywords", () => {
  it("ordena por frecuencia y quita palabras vacías", () => {
    const { terms, truncated } = extractKeywords(
      "Buscamos desarrolladora frontend con React. React y TypeScript con experiencia en frontend.",
    );
    expect(truncated).toBe(false);
    const map = new Map(terms.map((t) => [t.term, t.count]));
    expect(map.get("react")).toBe(2);
    expect(map.get("frontend")).toBe(2);
    expect(map.has("con")).toBe(false);
    expect(map.has("y")).toBe(false);
    // Más frecuentes primero.
    expect(terms[0].count).toBeGreaterThanOrEqual(terms[1].count);
  });

  it("bigrama solo entre palabras adyacentes", () => {
    const { terms } = extractKeywords("experiencia con React nativo");
    const map = new Map(terms.map((t) => [t.term, t.count]));
    // «con» es vacía: no hay bigrama artificial «experiencia react».
    expect(map.has("experiencia react")).toBe(false);
    expect(map.get("react nativo")).toBe(1);
  });

  it("no cruza frases ni lista verbos de oferta", () => {
    const { terms } = extractKeywords(
      "Dominio de React. Buscamos experiencia con inglés.",
    );
    const map = new Map(terms.map((t) => [t.term, t.count]));
    expect(map.has("react buscamos")).toBe(false);
    expect(map.has("buscamos")).toBe(false);
    expect(map.has("experiencia")).toBe(false);
    expect(map.get("ingles")).toBe(1);
  });

  it("es determinista y respeta el límite de entrada", () => {
    const texto = "React ".repeat(5000);
    const a = extractKeywords(texto);
    const b = extractKeywords(texto);
    expect(a).toEqual(b);
    expect(a.truncated).toBe(true);
    expect(texto.length).toBeGreaterThan(JOB_TEXT_MAX_CHARS);
  });
});

describe("termMatches", () => {
  const cv = normalizeText("Desarrolladora frontend con React y tests.");

  it("tolera singular/plural", () => {
    expect(termMatches(cv, "desarrolladores")).toBe(true);
    expect(termMatches(cv, "test")).toBe(true);
  });

  it("exige palabra completa", () => {
    expect(termMatches(normalizeText("javascript"), "java")).toBe(false);
    expect(termMatches(cv, "react")).toBe(true);
    expect(termMatches(cv, "angular")).toBe(false);
  });

  it("bigrama con espacios flexibles", () => {
    expect(termMatches(cv, "desarrolladora frontend")).toBe(true);
    expect(termMatches(cv, "frontend react")).toBe(false);
  });
});

describe("cvToPlainText", () => {
  it("incluye visibles y cabecera; excluye ocultas", () => {
    const texto = cvToPlainText(CONTENT);
    expect(texto).toContain("ana ruiz");
    expect(texto).toContain("playwright");
    expect(texto).not.toContain("palabraclaveoculta");
  });
});

describe("analyzeKeywords", () => {
  it("null sin puesto ni oferta", () => {
    expect(analyzeKeywords({ content: CONTENT })).toBeNull();
    expect(
      analyzeKeywords({ content: CONTENT, targetRole: "  " }),
    ).toBeNull();
  });

  it("cubre y echa en falta lo esperado", () => {
    const informe = analyzeKeywords({
      content: CONTENT,
      targetRole: "Desarrolladora frontend React",
      jobPosting: "Se requiere React, TypeScript y Angular con inglés.",
    });
    expect(informe).not.toBeNull();
    const map = new Map(informe!.terms.map((t) => [t.term, t.found]));
    expect(map.get("react")).toBe(true);
    expect(map.get("angular")).toBe(false);
    expect(map.get("ingles")).toBe(false);
    expect(informe!.covered).toBeLessThan(informe!.total);
  });

  it("el puesto solo también aporta términos", () => {
    const informe = analyzeKeywords({
      content: CONTENT,
      targetRole: "Diseñadora UX",
    });
    expect(informe!.total).toBeGreaterThan(0);
  });
});

describe("analyzeAts con Capa 3", () => {
  function input(extra: Partial<AtsInput> = {}): AtsInput {
    return {
      content: SHORT_CONTENT,
      design: SHORT_DESIGN,
      layout: null,
      title: "CV",
      ...extra,
    };
  }

  it("sin puesto ni oferta no hay informe de claves", () => {
    expect(analyzeAts(input()).keywords).toBeNull();
  });

  it("la oferta no altera la puntuación (informativa)", () => {
    const base = analyzeAts(input());
    const conOferta = analyzeAts(
      input({ jobPosting: "React TypeScript liderazgo inglés" }),
    );
    expect(conOferta.score).toBe(base.score);
    expect(conOferta.level).toBe(base.level);
    expect(conOferta.keywords).not.toBeNull();
  });
});
