import type { ResumeContent, ResumeDesign } from "../../types/resume";

// Contrato único de plantilla (Fase 4). Todo renderizador recibe los mismos
// datos y la misma configuración; las diferencias son solo visuales.
// `mode: "print"` lo usará la exportación PDF (Fase 5).
export interface ResumeTemplateProps {
  content: ResumeContent;
  design: ResumeDesign;
  mode: "preview" | "print";
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
};
