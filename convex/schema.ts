import { defineSchema } from "convex/server";

// Esquema mínimo. Fase 2 añade `resumes`, `templates` y tablas de producto.
// Nota: aquí vivieron las tablas de Convex Auth (auth*); se eliminaron al
// migrar a Clerk. Solo contenían sesiones de desarrollo, ya desechadas.
const schema = defineSchema({});

export default schema;
