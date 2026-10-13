import { z } from "zod";
import { isAllowedUrlScheme } from "../links";
import {
  DESIGN_LIMITS,
  FONT_FAMILIES,
  HEADING_SIZES,
  LAYOUT_IDS,
  RESUME_STATUSES,
  SECTION_TYPES,
  type SectionType,
} from "../../types/resume";

// Límites centralizados: fuente única para Zod (cliente) y Convex
// (servidor, vía import relativo). Cambiar aquí, no en cada esquema.
export const LIMITS = {
  maxSections: 30,
  maxTitle: 200,
  maxText: 5000,
  maxTotalChars: 200_000,
} as const;

export const ITEM_LIMITS: Record<SectionType, number> = {
  personal: 5,
  profile: 5,
  experience: 50,
  education: 30,
  skills: 50,
  digitalSkills: 50,
  languages: 30,
  projects: 30,
  custom: 50,
};

const idSchema = z.string().min(1, "ID requerido.");
const dateSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM.")
  .optional();

const safeUrlSchema = z
  .string()
  .max(500)
  .refine((v) => isAllowedUrlScheme(v), {
    message: "URL no válida (usa https://, http:// o mailto:).",
  })
  .optional();

const linkSchema = z.object({
  id: idSchema,
  label: z.string().max(100).optional(),
  url: safeUrlSchema,
});

const personalItemSchema = z.object({
  id: idSchema,
  fullName: z.string().max(LIMITS.maxTitle).optional(),
  email: z.string().email("Correo no válido.").max(320).optional(),
  phone: z.string().max(50).optional(),
  location: z.string().max(LIMITS.maxTitle).optional(),
  links: z.array(linkSchema).max(20).optional(),
  photoStorageId: z.string().min(1).max(200).optional(),
});

const profileItemSchema = z.object({
  id: idSchema,
  text: z.string().max(LIMITS.maxText).optional(),
});

const experienceItemSchema = z.object({
  id: idSchema,
  position: z.string().max(LIMITS.maxTitle).optional(),
  company: z.string().max(LIMITS.maxTitle).optional(),
  location: z.string().max(LIMITS.maxTitle).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  current: z.boolean().optional(),
  description: z.string().max(LIMITS.maxText).optional(),
});

const educationItemSchema = z.object({
  id: idSchema,
  school: z.string().max(LIMITS.maxTitle).optional(),
  degree: z.string().max(LIMITS.maxTitle).optional(),
  field: z.string().max(LIMITS.maxTitle).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  description: z.string().max(LIMITS.maxText).optional(),
});

const skillItemSchema = z.object({
  id: idSchema,
  name: z.string().max(100).optional(),
  level: z.number().int().min(1).max(5).optional(),
});

const languageItemSchema = z.object({
  id: idSchema,
  name: z.string().max(100).optional(),
  level: z.string().max(50).optional(),
});

const projectItemSchema = z.object({
  id: idSchema,
  name: z.string().max(LIMITS.maxTitle).optional(),
  description: z.string().max(LIMITS.maxText).optional(),
  url: safeUrlSchema,
  technologies: z.array(z.string().max(100)).max(30).optional(),
});

const customItemSchema = z.object({
  id: idSchema,
  title: z.string().max(LIMITS.maxTitle).optional(),
  description: z.string().max(LIMITS.maxText).optional(),
});

const baseSection = {
  id: idSchema,
  title: z.string().min(1, "Título requerido.").max(LIMITS.maxTitle),
  order: z.number().int().min(0),
  visible: z.boolean(),
};

export const resumeSectionSchema = z.discriminatedUnion("type", [
  z.object({ ...baseSection, type: z.literal("personal"), items: z.array(personalItemSchema).max(ITEM_LIMITS.personal) }),
  z.object({ ...baseSection, type: z.literal("profile"), items: z.array(profileItemSchema).max(ITEM_LIMITS.profile) }),
  z.object({ ...baseSection, type: z.literal("experience"), items: z.array(experienceItemSchema).max(ITEM_LIMITS.experience) }),
  z.object({ ...baseSection, type: z.literal("education"), items: z.array(educationItemSchema).max(ITEM_LIMITS.education) }),
  z.object({ ...baseSection, type: z.literal("skills"), items: z.array(skillItemSchema).max(ITEM_LIMITS.skills) }),
  z.object({ ...baseSection, type: z.literal("digitalSkills"), items: z.array(skillItemSchema).max(ITEM_LIMITS.digitalSkills) }),
  z.object({ ...baseSection, type: z.literal("languages"), items: z.array(languageItemSchema).max(ITEM_LIMITS.languages) }),
  z.object({ ...baseSection, type: z.literal("projects"), items: z.array(projectItemSchema).max(ITEM_LIMITS.projects) }),
  z.object({ ...baseSection, type: z.literal("custom"), items: z.array(customItemSchema).max(ITEM_LIMITS.custom) }),
]);

export const resumeContentSchema = z.object({
  sections: z.array(resumeSectionSchema).max(LIMITS.maxSections),
});

const layoutColumnSchema = z.array(idSchema).max(LIMITS.maxSections);

export const resumeLayoutSchema = z.object({
  main: layoutColumnSchema,
  sidebar: layoutColumnSchema,
});

export const resumeDesignSchema = z.object({
  templateId: z.string().min(1).max(100),
  templateVersion: z.number().int().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex #rrggbb."),
  fontFamily: z.enum(FONT_FAMILIES),
  // `.default()` para migrar CV antiguos guardados sin estos campos: al
  // hidratar, el diseño incompleto se normaliza en lugar de bloquear el
  // autoguardado.
  fontSize: z
    .number()
    .min(DESIGN_LIMITS.minFontSize)
    .max(DESIGN_LIMITS.maxFontSize)
    .default(DESIGN_LIMITS.defaultFontSize),
  pageMargin: z
    .number()
    .min(DESIGN_LIMITS.minPageMargin)
    .max(DESIGN_LIMITS.maxPageMargin)
    .default(DESIGN_LIMITS.defaultPageMargin),
  sectionSpacing: z
    .number()
    .min(DESIGN_LIMITS.minSectionSpacing)
    .max(DESIGN_LIMITS.maxSectionSpacing)
    .default(DESIGN_LIMITS.defaultSectionSpacing),
  lineHeight: z
    .number()
    .min(DESIGN_LIMITS.minLineHeight)
    .max(DESIGN_LIMITS.maxLineHeight)
    .default(DESIGN_LIMITS.defaultLineHeight),
  headingSize: z.enum(HEADING_SIZES).default("regular"),
  sidebarWidth: z
    .number()
    .min(DESIGN_LIMITS.minSidebarWidth)
    .max(DESIGN_LIMITS.maxSidebarWidth)
    .default(DESIGN_LIMITS.defaultSidebarWidth),
  layoutId: z.enum(LAYOUT_IDS).default("single"),
});

export const resumeTitleSchema = z
  .string()
  .trim()
  .min(1, "El título es obligatorio.")
  .max(LIMITS.maxTitle);

export const resumeStatusSchema = z.enum(RESUME_STATUSES);

export const updateResumeSchema = z.object({
  title: resumeTitleSchema.optional(),
  status: resumeStatusSchema.optional(),
  content: resumeContentSchema.optional(),
  design: resumeDesignSchema.optional(),
  layout: resumeLayoutSchema.optional(),
});

export const sectionTypeSchema = z.enum(SECTION_TYPES);

export type ResumeSectionInput = z.infer<typeof resumeSectionSchema>;
