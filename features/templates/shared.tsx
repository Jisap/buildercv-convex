import type { ReactNode } from "react";
import type { ResumeSection } from "@/types/resume";

// Piezas compartidas por los tres renderizadores: la lógica de contenido
// vive aquí una sola vez; las plantillas solo aportan estilo.

export function formatRange(
  start?: string,
  end?: string,
  current?: boolean,
): string | null {
  if (!start && !end && !current) {
    return null;
  }
  const fmt = (d: string) => {
    const [y, m] = d.split("-");
    return `${m}/${y}`;
  };
  const left = start ? fmt(start) : "";
  const right = current ? "actualidad" : end ? fmt(end) : "";
  return `${left} – ${right}`.trim();
}

/** Secciones visibles ordenadas (ocultas excluidas siempre). */
export function visibleSections(content: { sections: ResumeSection[] }) {
  return [...content.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h3 className={className}>{children}</h3>;
}
