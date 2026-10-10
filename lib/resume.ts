import type {
  ResumeContent,
  ResumeDesign,
  ResumeSection,
  SectionType,
} from "../types/resume";

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

function emptySection(type: SectionType, order: number): ResumeSection {
  const base = { id: newId(), title: SECTION_TITLES[type], order, visible: true };
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

/** Copia profunda del contenido con IDs nuevos (para duplicar CV). */
export function cloneContentWithNewIds(content: ResumeContent): ResumeContent {
  return {
    sections: content.sections.map((section) => ({
      ...section,
      id: newId(),
      items: regenerateItemIds(section.items),
    })) as ResumeContent["sections"],
  };
}
