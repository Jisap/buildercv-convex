import type { SectionType } from "@/types/resume";

export type FieldInputType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "textarea"
  | "month"
  | "number"
  | "checkbox";

export interface ItemFieldSpec {
  key: string;
  label: string;
  type: FieldInputType;
  placeholder?: string;
  min?: number;
  max?: number;
}

function text(key: string, label: string, placeholder = ""): ItemFieldSpec {
  return { key, label, type: "text", placeholder };
}

/** Campos editables por tipo de sección (Fase 3). */
export const ITEM_FIELDS: Record<SectionType, ItemFieldSpec[]> = {
  personal: [
    text("fullName", "Nombre completo", "Nombre Apellidos"),
    { key: "email", label: "Correo", type: "email", placeholder: "nombre@ejemplo.es" },
    { key: "phone", label: "Teléfono", type: "tel", placeholder: "+34 600 123 456" },
    text("location", "Ubicación", "Madrid, España"),
  ],
  profile: [
    {
      key: "text",
      label: "Resumen profesional",
      type: "textarea",
      placeholder: "2–4 líneas sobre tu perfil…",
    },
  ],
  experience: [
    text("position", "Puesto", "Desarrolladora frontend"),
    text("company", "Empresa", "Acme S.L."),
    text("location", "Ubicación", "Madrid"),
    { key: "startDate", label: "Inicio", type: "month" },
    { key: "endDate", label: "Fin", type: "month" },
    { key: "current", label: "Trabajo aquí actualmente", type: "checkbox" },
    {
      key: "description",
      label: "Descripción y logros",
      type: "textarea",
      placeholder: "Qué hiciste y qué conseguiste…",
    },
  ],
  education: [
    text("school", "Centro", "Universidad…"),
    text("degree", "Titulación", "Grado en…"),
    text("field", "Especialidad", ""),
    { key: "startDate", label: "Inicio", type: "month" },
    { key: "endDate", label: "Fin", type: "month" },
    { key: "description", label: "Descripción", type: "textarea" },
  ],
  skills: [
    text("name", "Competencia", "Trabajo en equipo"),
    { key: "level", label: "Nivel (1–5)", type: "number", min: 1, max: 5 },
  ],
  digitalSkills: [
    text("name", "Competencia", "Hojas de cálculo"),
    { key: "level", label: "Nivel (1–5)", type: "number", min: 1, max: 5 },
  ],
  languages: [
    text("name", "Idioma", "Inglés"),
    text("level", "Nivel", "B2"),
  ],
  projects: [
    text("name", "Nombre", "Mi proyecto"),
    { key: "description", label: "Descripción", type: "textarea" },
    { key: "url", label: "Enlace", type: "url", placeholder: "https://" },
    text("technologies", "Tecnologías (separadas por comas)", "React, TypeScript"),
  ],
  custom: [
    text("title", "Título", ""),
    { key: "description", label: "Descripción", type: "textarea" },
  ],
};

export const ADD_ITEM_LABEL: Record<SectionType, string> = {
  personal: "Añadir perfil",
  profile: "Añadir resumen",
  experience: "Añadir experiencia",
  education: "Añadir formación",
  skills: "Añadir competencia",
  digitalSkills: "Añadir competencia",
  languages: "Añadir idioma",
  projects: "Añadir proyecto",
  custom: "Añadir elemento",
};

export const ADD_SECTION_LABEL: { type: SectionType; label: string }[] = [  { type: "experience", label: "Experiencia" },
  { type: "education", label: "Formación" },
  { type: "skills", label: "Competencias" },
  { type: "digitalSkills", label: "Competencias digitales" },
  { type: "languages", label: "Idiomas" },
  { type: "projects", label: "Proyectos" },
  { type: "custom", label: "Personalizada" },
];

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function joinParts(parts: string[]): string {
  return parts.filter(Boolean).join(" · ");
}

function truncate(value: string, max = 60): string {
  const clean = value.trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/**
 * Resumen de una línea para la fila compacta del editor
 * (p. ej. "Puesto · Empresa"). Vacío si el elemento aún no tiene
 * contenido: el llamador muestra entonces "Elemento N · sin contenido".
 */
export function summarizeItem(
  type: SectionType,
  item: Record<string, unknown>,
): string {
  switch (type) {
    case "personal":
      return str(item.fullName);
    case "profile":
      return truncate(str(item.text));
    case "experience":
      return joinParts([str(item.position), str(item.company)]);
    case "education":
      return joinParts([str(item.degree), str(item.school)]);
    case "skills":
    case "digitalSkills": {
      const level =
        typeof item.level === "number" ? `Nivel ${item.level}` : "";
      return joinParts([str(item.name), level]);
    }
    case "languages":
      return joinParts([str(item.name), str(item.level)]);
    case "projects":
      return str(item.name);
    case "custom":
      return str(item.title) || truncate(str(item.description));
  }
}
