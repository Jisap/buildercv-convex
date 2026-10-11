import type { LayoutId, ResumeSection } from "../../types/resume";

// Tipos que en distribución de dos columnas van a la columna lateral.
// Son secciones compactas por naturaleza; el resto va a la principal.
// `personal` siempre se renderiza como cabecera a ancho completo.
const SIDEBAR_TYPES = new Set(["skills", "digitalSkills", "languages"]);

export interface LayoutPartition {
  personal: ResumeSection | null;
  main: ResumeSection[];
  sidebar: ResumeSection[];
}

/**
 * Reparte las secciones visibles y ordenadas entre cabecera, columna
 * principal y lateral. En `single` todo va a `main` (comportamiento
 * actual). En `two-col` las compactas van al lateral; el orden relativo
 * por `order` se conserva dentro de cada columna.
 *
 * No introduce arrays de IDs persistidos: la única fuente de orden sigue
 * siendo `section.order`. La fase F1 del roadmap podrá sustituir esta
 * derivación por `columns: { main, sidebar }` persistidos.
 */
export function partitionForLayout(
  sections: ResumeSection[],
  layoutId: LayoutId,
): LayoutPartition {
  const sorted = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
  const personal = sorted.find((s) => s.type === "personal") ?? null;
  const rest = sorted.filter((s) => s !== personal);
  if (layoutId !== "two-col") {
    return { personal, main: rest, sidebar: [] };
  }
  return {
    personal,
    main: rest.filter((s) => !SIDEBAR_TYPES.has(s.type)),
    sidebar: rest.filter((s) => SIDEBAR_TYPES.has(s.type)),
  };
}
