import type { CSSProperties, ReactNode } from "react";
import type { ResumeDesign, ResumeSection } from "@/types/resume";
import { FONT_STACKS } from "./types";
import { HEADING_SCALES } from "@/types/resume";

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

/**
 * Estilo raíz del documento: tipografía, relleno e interlineado del
 * diseño, más las variables `--cv-leading` (interlineado del cuerpo) y
 * `--cv-heading` (escala de titulares) que consumen el CSS de pantalla
 * (`app/globals.css`) y el de impresión (`features/exports/printCss.ts`).
 * Centralizado para que las seis plantillas respondan igual.
 */
export function docRootStyle(design: ResumeDesign): CSSProperties {
  return {
    fontFamily: FONT_STACKS[design.fontFamily],
    padding: `${design.pageMargin}mm`,
    lineHeight: design.lineHeight,
    "--cv-leading": String(design.lineHeight),
    "--cv-heading": String(HEADING_SCALES[design.headingSize]),
  } as CSSProperties;
}

/**
 * Columnas de la distribución en dos (`fr` proporcionales: el `gap` lo
 * gestiona el grid). `side` indica en qué lado va la columna lateral.
 */
export function twoColColumns(
  side: "left" | "right",
  sidebarWidth: number,
): string {
  const main = 100 - sidebarWidth;
  return side === "left"
    ? `${sidebarWidth}fr ${main}fr`
    : `${main}fr ${sidebarWidth}fr`;
}
