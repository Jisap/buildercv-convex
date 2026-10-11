import { expect, test } from "vitest";
import {
  cloneContentWithNewIds,
  createDefaultContent,
  createDefaultDesign,
  createSection,
  moveItemToIndex,
  withDesignDefaults,
} from "./resume";
import { resumeContentSchema, resumeDesignSchema } from "./validation/resume";

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

test("moveItemToIndex reordena sin perder datos", () => {
  const section = createSection("experience", 0, "sec");
  const withItems = {
    ...section,
    items: [{ id: "a" }, { id: "b" }, { id: "c" }],
  } as unknown as typeof section;
  const moved = moveItemToIndex(withItems, "c", 0);
  expect(moved.items.map((i) => i.id)).toEqual(["c", "a", "b"]);
  // Sin cambios si ya está ahí, el ID no existe o el índice se recorta.
  expect(moveItemToIndex(withItems, "a", 0)).toBe(withItems);
  expect(moveItemToIndex(withItems, "z", 0)).toBe(withItems);
  const clamped = moveItemToIndex(withItems, "a", 99);
  expect(clamped.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
  const parsed = resumeContentSchema.safeParse({ sections: [moved] });
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

test("withDesignDefaults migra diseños antiguos a los campos nuevos", () => {
  const migrated = withDesignDefaults({
    templateId: "modern",
    templateVersion: 1,
  });
  expect(migrated.lineHeight).toBe(1.5);
  expect(migrated.headingSize).toBe("regular");
  expect(migrated.sidebarWidth).toBe(33);
  // Fuera de rango se recorta al límite (igual que el resto de campos),
  // desconocidos o ausentes → defecto, nunca excepción.
  expect(
    withDesignDefaults({ lineHeight: 9, headingSize: "gigante", sidebarWidth: 1 }),
  ).toMatchObject({
    lineHeight: 1.7,
    headingSize: "regular",
    sidebarWidth: 25,
  });
  const parsed = resumeDesignSchema.safeParse(createDefaultDesign());
  expect(parsed.success).toBe(true);
  // Las tipografías nuevas se conservan; las desconocidas caen a inter.
  expect(withDesignDefaults({ fontFamily: "calibri" }).fontFamily).toBe(
    "calibri",
  );
  expect(withDesignDefaults({ fontFamily: "comic" }).fontFamily).toBe("inter");
});

test("photoStorageId se valida como referencia opaca", () => {
  const content = createDefaultContent();
  const personal = content.sections.find((s) => s.type === "personal");
  expect(personal).toBeDefined();
  const withPhoto = {
    sections: content.sections.map((s) =>
      s.type === "personal"
        ? {
            ...s,
            items: s.items.map((item) => ({
              ...item,
              photoStorageId: "kg123abc",
            })),
          }
        : s,
    ),
  };
  expect(resumeContentSchema.safeParse(withPhoto).success).toBe(true);
  const tooLong = {
    sections: content.sections.map((s) =>
      s.type === "personal"
        ? {
            ...s,
            items: s.items.map((item) => ({
              ...item,
              photoStorageId: "x".repeat(201),
            })),
          }
        : s,
    ),
  };
  expect(resumeContentSchema.safeParse(tooLong).success).toBe(false);
});
