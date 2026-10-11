import type {
  LayoutId,
  ResumeContent,
  ResumeDesign,
  ResumeSection,
  SectionType,
} from "../types/resume";
import { DESIGN_LIMITS } from "../types/resume";

/** IDs estables (UUID v4). Compartido por cliente y servidor. */
export function newId(): string {
  return crypto.randomUUID();
}

const SECTION_TITLES: Record<SectionType, string> = {
  personal: "Datos personales",
  profile: "Perfil profesional",
  experience: "Experiencia",
  education: "Formación",
  skills: "Competencias",
  digitalSkills: "Competencias digitales",
  languages: "Idiomas",
  projects: "Proyectos",
  custom: "Sección personalizada",
};

function emptySection(type: SectionType, order: number): ResumeSection {  const base = { id: newId(), title: SECTION_TITLES[type], order, visible: true };
  switch (type) {
    case "personal":
      return { ...base, type, items: [{ id: newId() }] };
    case "profile":
      return { ...base, type, items: [{ id: newId() }] };
    case "experience":
      return { ...base, type, items: [] };
    case "education":
      return { ...base, type, items: [] };
    case "skills":
      return { ...base, type, items: [] };
    case "digitalSkills":
      return { ...base, type, items: [] };
    case "languages":
      return { ...base, type, items: [] };
    case "projects":
      return { ...base, type, items: [] };
    case "custom":
      return { ...base, type, items: [] };
  }
}

/** Crea una sección vacía del tipo dado (pura y testeable). */
export function createSection(
  type: SectionType,
  order: number,
  id: string = newId(),
): ResumeSection {
  return { ...emptySection(type, order), id };
}

/** CV válido con datos vacíos (crear “desde cero”). */
export function createDefaultContent(): ResumeContent {
  const order: SectionType[] = [
    "personal",
    "profile",
    "experience",
    "education",
    "skills",
    "languages",
  ];
  return { sections: order.map((type, i) => emptySection(type, i)) };
}

export function createDefaultDesign(
  templateId = "classic",
  templateVersion = 1,
): ResumeDesign {
  return {
    templateId,
    templateVersion,
    accentColor: "#1d4ed8",
    fontFamily: "inter",
    fontSize: DESIGN_LIMITS.defaultFontSize,
    pageMargin: DESIGN_LIMITS.defaultPageMargin,
    sectionSpacing: DESIGN_LIMITS.defaultSectionSpacing,
    layoutId: "single",
  };
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  return typeof n === "number" && Number.isFinite(n)
    ? Math.min(max, Math.max(min, n))
    : fallback;
}

/**
 * Normaliza un diseño que pueda venir incompleto (CV guardados antes de la
 * fase de personalización visual): rellena los campos nuevos con sus valores
 * por defecto en lugar de romper la hidratación o el autoguardado.
 */
export function withDesignDefaults(input: unknown): ResumeDesign {
  const d = (input ?? {}) as Partial<ResumeDesign>;
  return {
    templateId:
      typeof d.templateId === "string" && d.templateId.length > 0
        ? d.templateId
        : "classic",
    templateVersion:
      typeof d.templateVersion === "number" && d.templateVersion >= 1
        ? Math.floor(d.templateVersion)
        : 1,
    accentColor:
      typeof d.accentColor === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(d.accentColor)
        ? d.accentColor
        : "#1d4ed8",
    fontFamily:
      d.fontFamily === "georgia" || d.fontFamily === "system"
        ? d.fontFamily
        : "inter",
    fontSize: clamp(
      d.fontSize,
      DESIGN_LIMITS.minFontSize,
      DESIGN_LIMITS.maxFontSize,
      DESIGN_LIMITS.defaultFontSize,
    ),
    pageMargin: clamp(
      d.pageMargin,
      DESIGN_LIMITS.minPageMargin,
      DESIGN_LIMITS.maxPageMargin,
      DESIGN_LIMITS.defaultPageMargin,
    ),
    sectionSpacing: clamp(
      d.sectionSpacing,
      DESIGN_LIMITS.minSectionSpacing,
      DESIGN_LIMITS.maxSectionSpacing,
      DESIGN_LIMITS.defaultSectionSpacing,
    ),
    layoutId: (["single", "two-col"] as LayoutId[]).includes(
      d.layoutId as LayoutId,
    )
      ? (d.layoutId as LayoutId)
      : "single",
  };
}

function regenerateItemIds(items: { id: string }[]): { id: string }[] {
  return items.map((item) => {
    const copy: Record<string, unknown> = { ...item, id: newId() };
    if (Array.isArray(copy.links)) {
      copy.links = (copy.links as { id: string }[]).map((link) => ({
        ...link,
        id: newId(),
      }));
    }
    return copy as { id: string };
  });
}

/**
 * Copia profunda del contenido con IDs nuevos (para duplicar CV).
 * Devuelve también el mapa antiguo→nuevo para remapear el layout.
 */
export function cloneContentWithNewIds(content: ResumeContent): {
  content: ResumeContent;
  idMap: Map<string, string>;
} {
  const idMap = new Map<string, string>();
  const sections = content.sections.map((section) => {
    const newSectionId = newId();
    idMap.set(section.id, newSectionId);
    return {
      ...section,
      id: newSectionId,
      items: regenerateItemIds(section.items),
    };
  }) as ResumeContent["sections"];
  return { content: { sections }, idMap };
}
