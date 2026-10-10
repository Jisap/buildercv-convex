import { z } from "zod";
import {
  FONT_FAMILIES,
  RESUME_STATUSES,
  SECTION_TYPES,
} from "@/types/resume";

const idSchema = z.string().min(1, "ID requerido.");
const dateSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM.")
  .optional();

const linkSchema = z.object({
  id: idSchema,
  label: z.string().max(100).optional(),
  url: z.string().max(500).optional(),
});

const personalItemSchema = z.object({
  id: idSchema,
  fullName: z.string().max(200).optional(),
  email: z.string().email("Correo no válido.").max(320).optional(),
  phone: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  links: z.array(linkSchema).max(20).optional(),
});

const profileItemSchema = z.object({
  id: idSchema,
  text: z.string().max(5000).optional(),
});

const experienceItemSchema = z.object({
  id: idSchema,
  position: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  current: z.boolean().optional(),
  description: z.string().max(5000).optional(),
});

const educationItemSchema = z.object({
  id: idSchema,
  school: z.string().max(200).optional(),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  description: z.string().max(5000).optional(),
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
  name: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  url: z.string().max(500).optional(),
  technologies: z.array(z.string().max(100)).max(30).optional(),
});

const customItemSchema = z.object({
  id: idSchema,
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
});

const baseSection = {
  id: idSchema,
  title: z.string().min(1, "Título requerido.").max(200),
  order: z.number().int().min(0),
  visible: z.boolean(),
};

export const resumeSectionSchema = z.discriminatedUnion("type", [
  z.object({ ...baseSection, type: z.literal("personal"), items: z.array(personalItemSchema).max(5) }),
  z.object({ ...baseSection, type: z.literal("profile"), items: z.array(profileItemSchema).max(5) }),
  z.object({ ...baseSection, type: z.literal("experience"), items: z.array(experienceItemSchema).max(50) }),
  z.object({ ...baseSection, type: z.literal("education"), items: z.array(educationItemSchema).max(30) }),
  z.object({ ...baseSection, type: z.literal("skills"), items: z.array(skillItemSchema).max(50) }),
  z.object({ ...baseSection, type: z.literal("digitalSkills"), items: z.array(skillItemSchema).max(50) }),
  z.object({ ...baseSection, type: z.literal("languages"), items: z.array(languageItemSchema).max(30) }),
  z.object({ ...baseSection, type: z.literal("projects"), items: z.array(projectItemSchema).max(30) }),
  z.object({ ...baseSection, type: z.literal("custom"), items: z.array(customItemSchema).max(50) }),
]);

export const resumeContentSchema = z.object({
  sections: z.array(resumeSectionSchema).max(30),
});

export const resumeDesignSchema = z.object({
  templateId: z.string().min(1).max(100),
  templateVersion: z.number().int().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex #rrggbb."),
  fontFamily: z.enum(FONT_FAMILIES),
});

export const resumeTitleSchema = z
  .string()
  .trim()
  .min(1, "El título es obligatorio.")
  .max(200);

export const resumeStatusSchema = z.enum(RESUME_STATUSES);

export const updateResumeSchema = z.object({
  title: resumeTitleSchema.optional(),
  status: resumeStatusSchema.optional(),
  content: resumeContentSchema.optional(),
  design: resumeDesignSchema.optional(),
});

export const sectionTypeSchema = z.enum(SECTION_TYPES);

export type ResumeSectionInput = z.infer<typeof resumeSectionSchema>;
