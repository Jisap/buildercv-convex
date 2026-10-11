import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import type { ResumeContent } from "../types/resume";
import { getIdentityUserId, requireOwnedResume } from "./access";

// Fotos de candidato en Convex Storage. El documento solo guarda
// `photoStorageId` (referencia); los binarios nunca entran en `resumes`.
// Las URLs firmadas son impredecibles y solo se entregan tras verificar
// la propiedad del CV. Duplicar comparte el fichero; al borrar se elimina
// únicamente si ningún otro CV del usuario lo referencia.

/** IDs de foto referenciados por el contenido (sección personal). */
export function photoStorageIdsOf(content: ResumeContent): string[] {
  const ids: string[] = [];
  for (const section of content.sections) {
    if (section.type !== "personal") {
      continue;
    }
    for (const item of section.items) {
      if (
        typeof item.photoStorageId === "string" &&
        item.photoStorageId.length > 0
      ) {
        ids.push(item.photoStorageId);
      }
    }
  }
  return ids;
}

/** Borra el fichero salvo que otro CV del usuario lo use. */
export async function deletePhotoIfUnreferenced(
  ctx: MutationCtx,
  userId: string,
  storageId: string,
  exceptResumeId: Id<"resumes">,
): Promise<void> {
  const others = await ctx.db
    .query("resumes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const referenced = others.some(
    (resume) =>
      String(resume._id) !== String(exceptResumeId) &&
      photoStorageIdsOf(resume.content).includes(storageId),
  );
  if (referenced) {
    return;
  }
  try {
    await ctx.storage.delete(storageId as Id<"_storage">);
  } catch {
    // El fichero ya no existe o el ID es inválido: el documento manda.
  }
}

/** URL firmada de subida (el cliente envía el binario ya redimensionado). */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getIdentityUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * URL firmada de la foto de un CV propio. Exige que el `storageId` pedido
 * sea el referenciado por el documento: no sirve para leer ficheros ajenos.
 */
export const photoUrl = query({
  args: { resumeId: v.id("resumes"), storageId: v.string() },
  handler: async (ctx, args) => {
    const resume = await requireOwnedResume(ctx, args.resumeId);
    if (!photoStorageIdsOf(resume.content).includes(args.storageId)) {
      return null;
    }
    try {
      return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
    } catch {
      return null;
    }
  },
});

/** Quita la foto del CV y borra el fichero si queda sin referencias. */
export const deletePhoto = mutation({
  args: { resumeId: v.id("resumes") },
  handler: async (ctx, args) => {
    const resume = await requireOwnedResume(ctx, args.resumeId);
    const ids = photoStorageIdsOf(resume.content);
    if (ids.length === 0) {
      return null;
    }
    await ctx.db.patch(resume._id, {
      content: {
        sections: resume.content.sections.map((section) => {
          if (section.type !== "personal") {
            return section;
          }
          return {
            ...section,
            items: section.items.map((item) => {
              const copy: Record<string, unknown> = { ...item };
              delete copy.photoStorageId;
              return copy;
            }),
          };
        }),
      } as typeof resume.content,
      updatedAt: Date.now(),
    });
    for (const storageId of new Set(ids)) {
      await deletePhotoIfUnreferenced(
        ctx,
        resume.userId,
        storageId,
        resume._id,
      );
    }
    return null;
  },
});
