import type { ResumeContent, ResumeDesign, ResumeLayout } from "../../types/resume";

// Contrato único de plantilla (Fase 4, ampliado en F1). Todo renderizador
// recibe los mismos datos, la misma configuración y la misma distribución;
// las diferencias son solo visuales.
// `mode: "print"` lo usa la exportación PDF. `layout` puede venir sanado
// (healLayout) o derivarse del contenido cuando es nulo (CV antiguos).
export interface ResumeTemplateProps {
  content: ResumeContent;
  design: ResumeDesign;
  layout: ResumeLayout | null | undefined;
  mode: "preview" | "print";
  /** URL firmada de la foto (null/sin definir = sin foto). */
  photoUrl?: string | null;
}

export interface TemplateMeta {
  id: string;
  version: number;
  name: string;
  description: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    version: 1,
    name: "Clásico / ATS",
    description:
      "Una columna, tipografía legible y jerarquía clara. Prioriza texto seleccionable y estructura lógica.",
  },
  {
    id: "modern",
    version: 1,
    name: "Moderno",
    description:
      "Color de acento y jerarquía contemporánea con cabecera destacada, sin perder legibilidad.",
  },
  {
    id: "compact",
    version: 1,
    name: "Compacto profesional",
    description:
      "Densidad alta y separación cuidada para currículums con mucho contenido.",
  },
  {
    id: "sidebar",
    version: 1,
    name: "Lateral",
    description:
      "Banda lateral de color con competencias e idiomas; experiencia y formación en la principal.",
  },
  {
    id: "elegant",
    version: 1,
    name: "Elegante",
    description:
      "Cabecera centrada y títulos sobrios. Para perfiles senior o clásicos.",
  },
  {
    id: "minimal",
    version: 1,
    name: "Mínima / ATS",
    description:
      "Ultralimpia, sin adornos. Máxima compatibilidad con lectura automática (usa una columna).",
  },
];

export function getTemplateMeta(templateId: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

/** Pilas tipográficas reales (sin descargas externas en el MVP). */
export const FONT_STACKS: Record<ResumeDesign["fontFamily"], string> = {
  inter: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  system: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  arial: "Arial, Helvetica, sans-serif",
  calibri: "Calibri, Carlito, 'Segoe UI', sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
};
