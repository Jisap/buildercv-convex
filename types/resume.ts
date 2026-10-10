// Tipos canónicos del contenido de un CV (Fase 2).
// El contenido es independiente de la plantilla: cambiar de plantilla nunca
// altera estos datos. Los validadores normativos para almacenamiento están en
// `convex/resumeModel.ts`; el espejo Zod para formularios, en
// `lib/validation/resume.ts`. Mantener los tres sincronizados.

export const SECTION_TYPES = [
  "personal",
  "profile",
  "experience",
  "education",
  "skills",
  "digitalSkills",
  "languages",
  "projects",
  "custom",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface BaseItem {
  id: string;
}

export interface PersonalItem extends BaseItem {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: { id: string; label?: string; url?: string }[];
}

export interface ProfileItem extends BaseItem {
  text?: string;
}

export interface ExperienceItem extends BaseItem {
  position?: string;
  company?: string;
  location?: string;
  /** Formato interno YYYY-MM. Vacío = sin fecha. */
  startDate?: string;
  /** Formato interno YYYY-MM. Vacío + current = "actualidad". */
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface EducationItem extends BaseItem {
  school?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface SkillItem extends BaseItem {
  name?: string;
  /** 1–5. Vacío = sin nivel. */
  level?: number;
}

export interface LanguageItem extends BaseItem {
  name?: string;
  /** Nivel libre (A1–C2, "nativo"…). Se normaliza en Fase 3. */
  level?: string;
}

export interface ProjectItem extends BaseItem {
  name?: string;
  description?: string;
  url?: string;
  technologies?: string[];
}

export interface CustomItem extends BaseItem {
  title?: string;
  description?: string;
}

interface BaseSection {
  /** ID estable: editar/borrar/reordenar nunca depende del índice. */
  id: string;
  title: string;
  order: number;
  visible: boolean;
}

export type ResumeSection =
  | (BaseSection & { type: "personal"; items: PersonalItem[] })
  | (BaseSection & { type: "profile"; items: ProfileItem[] })
  | (BaseSection & { type: "experience"; items: ExperienceItem[] })
  | (BaseSection & { type: "education"; items: EducationItem[] })
  | (BaseSection & { type: "skills"; items: SkillItem[] })
  | (BaseSection & { type: "digitalSkills"; items: SkillItem[] })
  | (BaseSection & { type: "languages"; items: LanguageItem[] })
  | (BaseSection & { type: "projects"; items: ProjectItem[] })
  | (BaseSection & { type: "custom"; items: CustomItem[] });

export interface ResumeContent {
  sections: ResumeSection[];
}

export const FONT_FAMILIES = ["inter", "georgia", "system"] as const;

export type FontFamily = (typeof FONT_FAMILIES)[number];

export interface ResumeDesign {
  templateId: string;
  templateVersion: number;
  /** Hex `#rrggbb`. */
  accentColor: string;
  fontFamily: FontFamily;
}

export const RESUME_STATUSES = ["draft", "archived"] as const;

export type ResumeStatus = (typeof RESUME_STATUSES)[number];

/** Forma del documento `resumes` tal como lo consume el cliente. */
export interface ResumeDoc {
  _id: string;
  userId: string;
  title: string;
  status: ResumeStatus;
  content: ResumeContent;
  design: ResumeDesign;
  updatedAt: number;
}
