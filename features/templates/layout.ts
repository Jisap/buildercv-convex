import type {
  LayoutId,
  ResumeLayout,
  ResumeSection,
} from "../../types/resume";
import { healLayout } from "../../lib/resume-layout";

export interface LayoutPartition {
  personal: ResumeSection | null;
  main: ResumeSection[];
  sidebar: ResumeSection[];
}

/**
 * Reparte las secciones visibles entre cabecera, columna principal y
 * lateral según el layout persistido (sanado frente al contenido).
 * Sin layout (CV antiguos), se deriva por tipo de sección.
 * En `single` todo va a `main`. El orden dentro de cada columna lo dan
 * los arrays; el campo `order` no se lee aquí.
 */
export function partitionForLayout(
  sections: ResumeSection[],
  layoutId: LayoutId,
  layout: ResumeLayout | null | undefined,
): LayoutPartition {
  const healed = healLayout(sections, layout);
  const byId = new Map(sections.map((s) => [s.id, s]));
  const ordered = (ids: string[]): ResumeSection[] =>
    ids
      .map((id) => byId.get(id))
      .filter((s): s is ResumeSection => s !== undefined && s.visible);
  const personal =
    [...healed.main, ...healed.sidebar]
      .map((id) => byId.get(id))
      .find((s) => s?.type === "personal") ?? null;
  const rest = (ids: string[]): ResumeSection[] =>
    ordered(ids).filter((s) => s !== personal);
  if (layoutId !== "two-col") {
    return { personal, main: [...rest(healed.main), ...rest(healed.sidebar)], sidebar: [] };
  }
  return {
    personal,
    main: rest(healed.main),
    sidebar: rest(healed.sidebar),
  };
}
