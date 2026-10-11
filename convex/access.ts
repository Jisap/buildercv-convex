import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// Propiedad y autorización compartidas por `resumes.ts` y `files.ts`.
// La identidad siempre viene de `ctx.auth` (JWT de Clerk verificado por
// la plataforma); jamás se acepta un userId del cliente.

export async function getIdentityUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new ConvexError("No autenticado.");
  }
  return identity.subject;
}

export async function requireOwnedResume(
  ctx: QueryCtx | MutationCtx,
  id: Id<"resumes">,
): Promise<Doc<"resumes">> {
  const userId = await getIdentityUserId(ctx);
  const resume = await ctx.db.get(id);
  if (resume === null || resume.userId !== userId) {
    // Mismo error exista o no: no filtrar qué IDs son válidos.
    throw new ConvexError("Currículum no encontrado.");
  }
  return resume;
}
