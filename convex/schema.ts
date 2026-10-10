import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  resumeContentValidator,
  resumeDesignValidator,
  resumeStatusValidator,
} from "./resumeModel";

// Esquema mínimo. Fase 2 añade `resumes`, `templates` y tablas de producto.
// Nota: aquí vivieron las tablas de Convex Auth (auth*); se eliminaron al
// migrar a Clerk. Solo contenían sesiones de desarrollo, ya desechadas.
const schema = defineSchema({
  resumes: defineTable({
    /** `subject` de Clerk (`ctx.auth.getUserIdentity()`). Nunca del cliente. */
    userId: v.string(),
    title: v.string(),
    status: resumeStatusValidator,
    content: resumeContentValidator,
    design: resumeDesignValidator,
    updatedAt: v.number(),
  }).index("by_user", ["userId", "updatedAt"]),
});

export default schema;
