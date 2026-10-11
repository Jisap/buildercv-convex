import { expect, test } from "vitest";
import type { ResumeSection } from "@/types/resume";
import { partitionForLayout } from "./layout";

function section(
  id: string,
  type: ResumeSection["type"],
  order: number,
  visible = true,
): ResumeSection {
  return { id, type, title: id, order, visible, items: [] } as ResumeSection;
}

const SECTIONS: ResumeSection[] = [
  section("personal", "personal", 0),
  section("exp", "experience", 1),
  section("skills", "skills", 2),
  section("lang", "languages", 3),
  section("custom", "custom", 4),
];

test("single: todo va a la principal en orden", () => {
  const p = partitionForLayout(SECTIONS, "single");
  expect(p.personal?.id).toBe("personal");
  expect(p.main.map((s) => s.id)).toEqual(["exp", "skills", "lang", "custom"]);
  expect(p.sidebar).toEqual([]);
});

test("two-col: compactas al lateral, resto a la principal", () => {
  const p = partitionForLayout(SECTIONS, "two-col");
  expect(p.personal?.id).toBe("personal");
  expect(p.main.map((s) => s.id)).toEqual(["exp", "custom"]);
  expect(p.sidebar.map((s) => s.id)).toEqual(["skills", "lang"]);
});

test("las ocultas nunca se reparten", () => {
  const withHidden = [
    ...SECTIONS,
    section("hidden", "skills", 5, false),
  ];
  const p = partitionForLayout(withHidden, "two-col");
  expect(p.sidebar.map((s) => s.id)).toEqual(["skills", "lang"]);
  expect(p.main.map((s) => s.id)).toEqual(["exp", "custom"]);
});

test("two-col sin secciones compactas deja el lateral vacío", () => {
  const p = partitionForLayout(
    [section("personal", "personal", 0), section("exp", "experience", 1)],
    "two-col",
  );
  expect(p.sidebar).toEqual([]);
  expect(p.main.map((s) => s.id)).toEqual(["exp"]);
});
