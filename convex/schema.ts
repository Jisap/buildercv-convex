import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  resumeContentValidator,
  resumeDesignValidator,
  resumeLayoutValidator,
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
    // Opcional para no invalidar CV guardados antes de F1; el cliente
    // deriva el layout del contenido cuando falta.
    layout: v.optional(resumeLayoutValidator),
    updatedAt: v.number(),
  }).index("by_user", ["userId", "updatedAt"]),
  // Intentos de subida de foto (una fila por `generateUploadUrl`): acotan
  // cuántas subidas puede generar un usuario por día (ver `files.ts`).
  // No guardan el `storageId` (Convex solo lo revela tras subir); la
  // limpieza elimina las filas viejas, no ficheros.
  uploads: defineTable({
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),
});

export default schema;
