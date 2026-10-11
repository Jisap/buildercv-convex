import { expect, test } from "vitest";
import {
  cloneContentWithNewIds,
  createDefaultContent,
  createSection,
} from "./resume";
import { resumeContentSchema } from "./validation/resume";

test("createSection es pura y válida", () => {
  const a = createSection("experience", 2, "fijo");
  const b = createSection("experience", 2, "fijo");
  expect(a).toEqual(b);
  expect(a.id).toBe("fijo");
  expect(a.title).toBe("Experiencia");
  const content = createDefaultContent();
  const parsed = resumeContentSchema.safeParse({
    sections: [...content.sections, a],
  });
  expect(parsed.success).toBe(true);
});

test("cloneContentWithNewIds no reutiliza IDs y mapea el layout", () => {
  const content = createDefaultContent();
  const { content: clone, idMap } = cloneContentWithNewIds(content);
  const before = new Set(
    content.sections.flatMap((s) => [s.id, ...s.items.map((i) => i.id)]),
  );
  for (const s of clone.sections) {
    expect(before.has(s.id)).toBe(false);
    for (const item of s.items) {
      expect(before.has(item.id)).toBe(false);
    }
  }
  expect(clone.sections.length).toBe(content.sections.length);
  for (const s of content.sections) {
    const mapped = idMap.get(s.id);
    expect(mapped).toBeTypeOf("string");
    expect(clone.sections.some((c) => c.id === mapped)).toBe(true);
  }
});
