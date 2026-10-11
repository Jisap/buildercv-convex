import { expect, test } from "vitest";
import type { ResumeLayout, ResumeSection } from "@/types/resume";
import { layoutFromContent } from "@/lib/resume-layout";
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

const DERIVED: ResumeLayout = layoutFromContent({ sections: SECTIONS });

test("single: todo va a la principal en orden de los arrays", () => {
  const p = partitionForLayout(SECTIONS, "single", DERIVED);
  expect(p.personal?.id).toBe("personal");
  expect(p.main.map((s) => s.id)).toEqual(["exp", "custom", "skills", "lang"]);
  expect(p.sidebar).toEqual([]);
});

test("two-col: respeta los arrays persistidos, no el tipo", () => {
  const custom: ResumeLayout = { main: ["skills", "exp"], sidebar: ["custom", "lang"] };
  const p = partitionForLayout(SECTIONS, "two-col", custom);
  expect(p.personal?.id).toBe("personal");
  expect(p.main.map((s) => s.id)).toEqual(["skills", "exp"]);
  expect(p.sidebar.map((s) => s.id)).toEqual(["custom", "lang"]);
});

test("sin layout se deriva por tipo (CV antiguos)", () => {
  const p = partitionForLayout(SECTIONS, "two-col", null);
  expect(p.main.map((s) => s.id)).toEqual(["exp", "custom"]);
  expect(p.sidebar.map((s) => s.id)).toEqual(["skills", "lang"]);
});

test("las ocultas nunca se reparten", () => {
  const withHidden = [
    ...SECTIONS,
    section("hidden", "skills", 5, false),
  ];
  const p = partitionForLayout(withHidden, "two-col", null);
  expect(p.sidebar.map((s) => s.id)).toEqual(["skills", "lang"]);
  expect(p.main.map((s) => s.id)).toEqual(["exp", "custom"]);
});

test("two-col sin secciones en el lateral deja el lateral vacío", () => {
  const p = partitionForLayout(
    [section("personal", "personal", 0), section("exp", "experience", 1)],
    "two-col",
    { main: ["personal", "exp"], sidebar: [] },
  );
  expect(p.sidebar).toEqual([]);
  expect(p.main.map((s) => s.id)).toEqual(["exp"]);
});
