import { v, type GenericValidator } from "convex/values";

// Validadores normativos para almacenamiento (Convex). Espejan
// `types/resume.ts` y `lib/validation/resume.ts`: ante cualquier cambio,
// actualizar los tres. Las funciones de `resumes.ts` nunca aceptan contenido
// sin pasar por estos validadores.

const idValidator = v.string();

const linkValidator = v.object({
  id: idValidator,
  label: v.optional(v.string()),
  url: v.optional(v.string()),
});

const dateValidator = v.optional(v.string());

function baseSectionFields(itemValidator: GenericValidator) {
  return {
    id: idValidator,
    title: v.string(),
    order: v.number(),
    visible: v.boolean(),
    items: v.array(itemValidator),
  };
}

// Nota: los límites de longitud se validan en cliente (Zod); en servidor se
// validan forma y tipos, más reglas de negocio (propiedad, estados).
export const resumeSectionValidator = v.union(
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        fullName: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        location: v.optional(v.string()),
        links: v.optional(v.array(linkValidator)),
      }),
    ),
    type: v.literal("personal"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({ id: idValidator, text: v.optional(v.string()) }),
    ),
    type: v.literal("profile"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        position: v.optional(v.string()),
        company: v.optional(v.string()),
        location: v.optional(v.string()),
        startDate: dateValidator,
        endDate: dateValidator,
        current: v.optional(v.boolean()),
        description: v.optional(v.string()),
      }),
    ),
    type: v.literal("experience"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        school: v.optional(v.string()),
        degree: v.optional(v.string()),
        field: v.optional(v.string()),
        startDate: dateValidator,
        endDate: dateValidator,
        description: v.optional(v.string()),
      }),
    ),
    type: v.literal("education"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        name: v.optional(v.string()),
        level: v.optional(v.number()),
      }),
    ),
    type: v.literal("skills"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        name: v.optional(v.string()),
        level: v.optional(v.number()),
      }),
    ),
    type: v.literal("digitalSkills"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        name: v.optional(v.string()),
        level: v.optional(v.string()),
      }),
    ),
    type: v.literal("languages"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        url: v.optional(v.string()),
        technologies: v.optional(v.array(v.string())),
      }),
    ),
    type: v.literal("projects"),
  }),
  v.object({
    ...baseSectionFields(
      v.object({
        id: idValidator,
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
    type: v.literal("custom"),
  }),
);

export const resumeLayoutValidator = v.object({
  main: v.array(v.string()),
  sidebar: v.array(v.string()),
});

export const resumeContentValidator = v.object({
  sections: v.array(resumeSectionValidator),
});

export const resumeDesignValidator = v.object({
  templateId: v.string(),
  templateVersion: v.number(),
  accentColor: v.string(),
  fontFamily: v.union(
    v.literal("inter"),
    v.literal("georgia"),
    v.literal("system"),
  ),
  /** Tamaño base del cuerpo en pt (9–13). Rango validado en servidor. */
  fontSize: v.optional(v.number()),
  /** Margen de página uniforme en mm (8–20). */
  pageMargin: v.optional(v.number()),
  /** Separación entre secciones en mm (2–10). */
  sectionSpacing: v.optional(v.number()),
  /** Interlineado del cuerpo (1.2–1.7). Rango validado en servidor. */
  lineHeight: v.optional(v.number()),
  /** Tamaño de titulares. */
  headingSize: v.optional(
    v.union(
      v.literal("compact"),
      v.literal("regular"),
      v.literal("large"),
    ),
  ),
  /** Ancho de la columna lateral en % (25–40). */
  sidebarWidth: v.optional(v.number()),
  /** Distribución predefinida (sin drag en esta fase). */
  layoutId: v.optional(v.union(v.literal("single"), v.literal("two-col"))),
});

export const resumeStatusValidator = v.union(
  v.literal("draft"),
  v.literal("archived"),
);
