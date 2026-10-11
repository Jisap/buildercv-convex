import { expect, test } from "vitest";
import type { ResumeContent, ResumeLayout } from "../types/resume";
import { snapshotsEqual } from "./compare";
import { createDefaultContent, createSection } from "./resume";
import { resumeContentSchema, resumeLayoutSchema } from "./validation/resume";
import {
  addSectionToLayout,
  healLayout,
  layoutFromContent,
  moveSectionInLayout,
  moveSectionToColumn,
  remapLayout,
  removeSectionFromLayout,
  syncOrders,
} from "./resume-layout";

function content(): ResumeContent {
  return createDefaultContent();
}

test("layoutFromContent reparte por tipo conservando el orden", () => {
  const c = content();
  const layout = layoutFromContent(c);
  // Contenido por defecto: personal, profile, experience, education,
  // skills, languages (órdenes 0–5).
  const byType = new Map(c.sections.map((s) => [s.type, s.id]));
  expect(layout.main).toEqual([
    byType.get("personal"),
    byType.get("profile"),
    byType.get("experience"),
    byType.get("education"),
  ]);
  expect(layout.sidebar).toEqual([
    byType.get("skills"),
    byType.get("languages"),
  ]);
});

test("healLayout sanea duplicados, desconocidos y ausentes", () => {
  const c = content();
  const ids = c.sections.map((s) => s.id);
  const healed = healLayout(c.sections, {
    main: [ids[0], ids[0], "fantasma"],
    sidebar: [],
  });
  const all = [...healed.main, ...healed.sidebar];
  expect(new Set(all).size).toBe(all.length);
  expect(all).not.toContain("fantasma");
  expect(new Set(all)).toEqual(new Set(ids));
});

test("healLayout con nulo equivale a derivar", () => {
  const c = content();
  expect(healLayout(c.sections, null)).toEqual(layoutFromContent(c));
  expect(healLayout(c.sections, undefined)).toEqual(layoutFromContent(c));
});

test("mover dentro de la columna y entre columnas", () => {
  const c = content();
  let layout = layoutFromContent(c);
  const [first, second] = layout.main;
  layout = moveSectionInLayout(layout, second, -1);
  expect(layout.main[0]).toBe(second);
  expect(layout.main[1]).toBe(first);
  // Fuera de rango no cambia nada.
  expect(moveSectionInLayout(layout, second, -1)).toEqual(layout);

  layout = moveSectionToColumn(layout, second, "sidebar");
  expect(layout.main).not.toContain(second);
  expect(layout.sidebar.at(-1)).toBe(second);
  // A la misma columna no cambia nada.
  expect(moveSectionToColumn(layout, second, "sidebar")).toEqual(layout);
});

test("añadir y quitar actualizan el layout", () => {
  const c = content();
  let layout = layoutFromContent(c);
  layout = addSectionToLayout(layout, { id: "nueva", type: "languages" });
  expect(layout.sidebar.at(-1)).toBe("nueva");
  layout = addSectionToLayout(layout, { id: "otra", type: "experience" });
  expect(layout.main.at(-1)).toBe("otra");
  layout = removeSectionFromLayout(layout, "nueva");
  expect([...layout.main, ...layout.sidebar]).not.toContain("nueva");
});

test("remapLayout reasigna IDs al duplicar", () => {
  const layout: ResumeLayout = { main: ["a", "b"], sidebar: ["c"] };
  const remapped = remapLayout(
    layout,
    new Map([
      ["a", "a2"],
      ["b", "b2"],
      ["c", "c2"],
    ]),
  );
  expect(remapped).toEqual({ main: ["a2", "b2"], sidebar: ["c2"] });
});

test("syncOrders refleja main++sidebar", () => {
  const c = content();
  const layout = layoutFromContent(c);
  const synced = syncOrders(c, layout);
  const order = new Map(synced.sections.map((s) => [s.id, s.order]));
  [...layout.main, ...layout.sidebar].forEach((id, i) => {
    expect(order.get(id)).toBe(i);
  });
});

test("añadir sección + eco con claves reordenadas converge (regresión del guardado infinito)", () => {
  // Simula addSection + onSave + eco del servidor que devuelve los mismos
  // datos con otro orden de claves (como hace el almacenamiento Convex):
  // con JSON.stringify plano entraría en bucle; con snapshotsEqual no.
  const c = content();
  const layout = layoutFromContent(c);
  const section = createSection("experience", c.sections.length, "nueva");
  const nextContent = { sections: [...c.sections, section] };
  const nextLayout = healLayout(
    nextContent.sections,
    addSectionToLayout(layout, section),
  );
  const local = {
    content: syncOrders(nextContent, nextLayout),
    layout: nextLayout,
  };
  // El payload debe seguir siendo válido.
  expect(resumeContentSchema.safeParse(local.content).success).toBe(true);
  expect(resumeLayoutSchema.safeParse(local.layout).success).toBe(true);
  const echoed = reverseKeys(local);
  expect(JSON.stringify(local) === JSON.stringify(echoed)).toBe(false);
  expect(snapshotsEqual(local, echoed)).toBe(true);
});

/** Reordena recursivamente las claves (simula el eco del servidor). */
function reverseKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reverseKeys);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .reverse()
        .map(([k, v]) => [k, reverseKeys(v)]),
    );
  }
  return value;
}
