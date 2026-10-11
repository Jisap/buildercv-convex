import type {
  ResumeContent,
  ResumeLayout,
  ResumeSection,
} from "../types/resume";

// Tipos que, al derivar un layout (CV antiguos o secciones nuevas), van a
// la columna lateral. El resto va a la principal. `personal` se renderiza
// siempre como cabecera a ancho completo, viva en la columna que viva.
export const SIDEBAR_TYPES: ReadonlySet<ResumeSection["type"]> = new Set([
  "skills",
  "digitalSkills",
  "languages",
]);

function sortedByOrder(sections: ResumeSection[]): ResumeSection[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

/**
 * Deriva un layout desde el contenido (sin layout persistido): reparte
 * todas las secciones —visibles u ocultas— por tipo, conservando `order`.
 * Es la migración implícita de CV guardados antes de F1.
 */
export function layoutFromContent(content: ResumeContent): ResumeLayout {
  const sorted = sortedByOrder(content.sections);
  return {
    main: sorted
      .filter((s) => !SIDEBAR_TYPES.has(s.type))
      .map((s) => s.id),
    sidebar: sorted.filter((s) => SIDEBAR_TYPES.has(s.type)).map((s) => s.id),
  };
}

/**
 * Sanea un layout frente al contenido actual: elimina duplicados e IDs
 * desconocidos y añade al final de la principal las secciones que falten.
 * Nunca pierde secciones; el resultado es total y sin duplicados.
 */
export function healLayout(
  sections: ResumeSection[],
  layout: ResumeLayout | null | undefined,
): ResumeLayout {
  const known = new Set(sections.map((s) => s.id));
  const seen = new Set<string>();
  const clean = (ids: string[]): string[] => {
    const out: string[] = [];
    for (const id of ids) {
      if (known.has(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  };
  const main = clean(layout?.main ?? []);
  const sidebar = clean(layout?.sidebar ?? []);
  const derived = layoutFromContent({ sections });
  // Las ausentes vuelven a su columna por tipo, conservando su posición.
  const missingMain = derived.main.filter((id) => !seen.has(id));
  for (const id of missingMain) {
    seen.add(id);
  }
  const missingSidebar = derived.sidebar.filter((id) => !seen.has(id));
  return {
    main: [...main, ...missingMain],
    sidebar: [...sidebar, ...missingSidebar],
  };
}

/** Orden de lectura en una columna: el propio array. */
export function columnOf(
  layout: ResumeLayout,
  sectionId: string,
): "main" | "sidebar" | null {
  if (layout.main.includes(sectionId)) {
    return "main";
  }
  if (layout.sidebar.includes(sectionId)) {
    return "sidebar";
  }
  return null;
}

/** Mueve una sección dentro de su columna (dir -1 sube, +1 baja). */
export function moveSectionInLayout(
  layout: ResumeLayout,
  sectionId: string,
  dir: -1 | 1,
): ResumeLayout {
  const column = columnOf(layout, sectionId);
  if (column === null) {
    return layout;
  }
  const ids = [...layout[column]];
  const index = ids.indexOf(sectionId);
  const target = index + dir;
  if (target < 0 || target >= ids.length) {
    return layout;
  }
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return { ...layout, [column]: ids };
}

/** Traslada una sección a otra columna (al final de la destino). */
export function moveSectionToColumn(
  layout: ResumeLayout,
  sectionId: string,
  column: "main" | "sidebar",
): ResumeLayout {
  const from = columnOf(layout, sectionId);
  if (from === null || from === column) {
    return layout;
  }
  return {
    main:
      column === "main"
        ? [...layout.main, sectionId]
        : layout.main.filter((id) => id !== sectionId),
    sidebar:
      column === "sidebar"
        ? [...layout.sidebar, sectionId]
        : layout.sidebar.filter((id) => id !== sectionId),
  };
}

/** Quita una sección del layout (al eliminarla del contenido). */
export function removeSectionFromLayout(
  layout: ResumeLayout,
  sectionId: string,
): ResumeLayout {
  return {
    main: layout.main.filter((id) => id !== sectionId),
    sidebar: layout.sidebar.filter((id) => id !== sectionId),
  };
}

/** Añade una sección nueva (al final de su columna por tipo). */
export function addSectionToLayout(
  layout: ResumeLayout,
  section: Pick<ResumeSection, "id" | "type">,
): ResumeLayout {
  const healed = removeSectionFromLayout(layout, section.id);
  return SIDEBAR_TYPES.has(section.type)
    ? { ...healed, sidebar: [...healed.sidebar, section.id] }
    : { ...healed, main: [...healed.main, section.id] };
}

/** Reasigna los IDs del layout al duplicar un CV (mapa antiguo→nuevo). */
export function remapLayout(
  layout: ResumeLayout,
  idMap: ReadonlyMap<string, string>,
): ResumeLayout {
  const map = (ids: string[]): string[] =>
    ids.map((id) => idMap.get(id) ?? id);
  return { main: map(layout.main), sidebar: map(layout.sidebar) };
}

/**
 * Sincroniza el campo `order` con el layout (índice en main++sidebar).
 * Higiene para lectores antiguos; el render usa los arrays.
 */
export function syncOrders(
  content: ResumeContent,
  layout: ResumeLayout,
): ResumeContent {
  const healed = healLayout(content.sections, layout);
  const index = new Map<string, number>();
  [...healed.main, ...healed.sidebar].forEach((id, i) => index.set(id, i));
  return {
    sections: content.sections.map((s) => ({
      ...s,
      order: index.get(s.id) ?? s.order,
    })),
  };
}
