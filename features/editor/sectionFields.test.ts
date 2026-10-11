import { expect, test } from "vitest";
import { matchesFilter, normalizeText, summarizeItem } from "./sectionFields";

test("summarizeItem resume cada tipo y vacía sin contenido", () => {
  expect(
    summarizeItem("experience", { position: "Diseñadora", company: "Acme" }),
  ).toBe("Diseñadora · Acme");
  expect(summarizeItem("experience", { position: "Solo puesto" })).toBe(
    "Solo puesto",
  );
  expect(
    summarizeItem("education", { degree: "Grado", school: "UMA" }),
  ).toBe("Grado · UMA");
  expect(summarizeItem("languages", { name: "Inglés", level: "B2" })).toBe(
    "Inglés · B2",
  );
  expect(summarizeItem("skills", { name: "Equipo", level: 4 })).toBe(
    "Equipo · Nivel 4",
  );
  expect(summarizeItem("personal", { fullName: "Ana Pérez" })).toBe(
    "Ana Pérez",
  );
  expect(summarizeItem("projects", { name: "Mi web" })).toBe("Mi web");
  expect(summarizeItem("custom", { title: "Premio" })).toBe("Premio");
  expect(summarizeItem("custom", { description: "Algo" })).toBe("Algo");
  expect(summarizeItem("profile", { text: `  ${"x".repeat(100)}  ` })).toBe(
    `${"x".repeat(59)}…`,
  );
  expect(summarizeItem("experience", {})).toBe("");
  expect(summarizeItem("experience", { position: "  " })).toBe("");
});

test("matchesFilter ignora mayúsculas, tildes y espacios", () => {
  expect(normalizeText("José María Ñíguez")).toBe("jose maria niguez");
  expect(matchesFilter("Diseñadora · Acme", "")).toBe(true);
  expect(matchesFilter("Diseñadora · Acme", "  ")).toBe(true);
  expect(matchesFilter("Diseñadora · Acme", "dise")).toBe(true);
  expect(matchesFilter("Diseñadora · Acme", "DISENADORA")).toBe(true);
  expect(matchesFilter("Diseñadora · Acme", "acme")).toBe(true);
  expect(matchesFilter("Diseñadora · Acme", "beta")).toBe(false);
  expect(matchesFilter("", "algo")).toBe(false);
});
