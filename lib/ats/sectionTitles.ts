import type { ResumeSection } from "../../types/resume";

type SectionKind = Exclude<ResumeSection["type"], "personal" | "custom">;

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function normalizeTitle(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const TITLES: Record<SectionKind, string[]> = {
  profile: [
    "perfil profesional",
    "perfil",
    "resumen",
    "resumen profesional",
    "sobre mi",
    "summary",
    "professional summary",
    "profile",
    "about me",
  ],
  experience: [
    "experiencia",
    "experiencia profesional",
    "experiencia laboral",
    "trayectoria profesional",
    "experience",
    "work experience",
    "professional experience",
    "employment history",
  ],
  education: [
    "formacion",
    "formacion academica",
    "educacion",
    "estudios",
    "education",
    "academic background",
  ],
  skills: [
    "competencias",
    "habilidades",
    "aptitudes",
    "conocimientos",
    "competencias tecnicas",
    "skills",
    "technical skills",
  ],
  digitalSkills: [
    "competencias digitales",
    "habilidades digitales",
    "herramientas",
    "digital skills",
    "tools",
  ],
  languages: ["idiomas", "lenguas", "languages"],
  projects: ["proyectos", "proyectos personales", "projects"],
};

export function isStandardTitle(
  type: ResumeSection["type"],
  title: string,
): boolean {
  if (type === "personal" || type === "custom") {
    return true;
  }
  return TITLES[type].includes(normalizeTitle(title));
}

export const CANONICAL_TITLES: Record<SectionKind, string> = {
  profile: "Perfil profesional",
  experience: "Experiencia",
  education: "Formación",
  skills: "Competencias",
  digitalSkills: "Competencias digitales",
  languages: "Idiomas",
  projects: "Proyectos",
};
