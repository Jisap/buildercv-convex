import type { CSSProperties, ReactNode } from "react";
import type { ResumeDesign, ResumeSection } from "@/types/resume";
import { normalizeLinkUrl } from "@/lib/links";
import { FONT_STACKS } from "./types";
import { HEADING_SCALES } from "@/types/resume";

// Piezas compartidas por los renderizadores: la lógica de contenido
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
 * Foto del candidato en la cabecera. Estilos en línea para que viajen
 * intactos al PDF (Tailwind no existe allí); `cv-photo` es el gancho del
 * CSS de impresión. Decorativa: el nombre va siempre al lado.
 */
export function TemplatePhoto({
  url,
  sizeMm = 28,
}: {
  url: string;
  sizeMm?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      aria-hidden="true"
      className="cv-photo shrink-0"
      style={{
        width: `${sizeMm}mm`,
        height: `${sizeMm}mm`,
        objectFit: "cover",
        borderRadius: "50%",
      }}
    />
  );
}

/**
 * Estilo raíz del documento: tipografía, relleno e interlineado del
 * diseño, más las variables `--cv-leading` (interlineado del cuerpo) y
 * `--cv-heading` (escala de titulares) que consumen el CSS de pantalla
 * (`app/globals.css`) y el de impresión (`features/exports/printCss.ts`).
 * Centralizado para que todas las plantillas respondan igual.
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
 * Enlace único del CV (F1). Texto visible: etiqueta si la hay, si no la URL.
 * La URL viaja siempre en el `href` (también en el PDF: Chromium la conserva
 * como anotación). Sin esquema permitido se pinta como texto plano.
 * En vista previa abre en pestaña nueva; en impresión, enlace normal.
 */
export function CvLink({
  label,
  url,
  mode,
  className = "",
  style,
}: {
  label?: string;
  url?: string;
  mode: "preview" | "print";
  className?: string;
  style?: CSSProperties;
}) {
  const text = (label ?? "").trim() || (url ?? "").trim();
  if (!text) {
    return null;
  }
  const href = normalizeLinkUrl(url);
  if (!href) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }
  if (mode === "print") {
    return (
      <a href={href} className={`cv-link ${className}`.trim()} style={style}>
        {text}
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`cv-link ${className}`.trim()}
      style={style}
    >
      {text}
    </a>
  );
}

/** Lista de enlaces con separador propio de cada plantilla. */
export function CvLinkList({
  links,
  mode,
  separator = " · ",
  className = "",
}: {
  links: { id: string; label?: string; url?: string }[];
  mode: "preview" | "print";
  separator?: string;
  className?: string;
}) {
  const items = (links ?? []).filter(
    (l) => (l.label ?? "").trim() || (l.url ?? "").trim(),
  );
  if (items.length === 0) {
    return null;
  }
  return (
    <span className={className}>
      {items.map((l, i) => (
        <span key={l.id}>
          {i > 0 ? separator : null}
          <CvLink label={l.label} url={l.url} mode={mode} />
        </span>
      ))}
    </span>
  );
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
