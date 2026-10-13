import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import type { ResumeContent } from "../types/resume";
import { getIdentityUserId, requireOwnedResume } from "./access";

// Fotos de candidato en Convex Storage. El documento solo guarda
// `photoStorageId` (referencia); los binarios nunca entran en `resumes`.
// Las URLs firmadas son impredecibles y solo se entregan tras verificar
// la propiedad del CV. Duplicar comparte el fichero; al borrar se elimina
// únicamente si ningún otro CV del usuario lo referencia.
//
// Seguridad (S1): Convex no permite restringir tipo/tamaño en
// `generateUploadUrl`, así que la validación ocurre al asociar (ver
// `assertPhotoAssociations`, llamado desde `resumes.update`): el fichero
// no válido se borra en el acto y la mutación se rechaza. El cliente ya
// filtra (JPG/PNG/WebP, 5 MB, redimensión), pero la autoridad es esta.
/** Tipos y tamaño máximos de foto (H-2; igual que el cliente). */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
/** Tope de generaciones de URL de subida por usuario y día. */
export const MAX_UPLOADS_PER_DAY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Clasifica los metadatos de un fichero de Storage: null = válido,
 * "invalid" = tamaño excesivo o tipo declarado no permitido (hay que
 * borrarlo y rechazar), "missing" = el fichero no existe. Lo inexistente
 * se tolera: no ocupa almacenamiento y `photoUrl` devuelve null (en
 * producción solo ocurre si el fichero se borró fuera).
 *
 * Nota: un `contentType` ausente se tolera. El control vinculante contra
 * llenar el Storage es el tamaño (5 MB) más el tope diario de subidas; la
 * cabecera `Content-Type` la fija quien sube y no es prueba por sí sola
 * (validar bytes mágicos exigiría una action intermedia: sobrediseño para
 * el MVP; el cliente además ya redimensiona a JPEG en cliente).
 */
export function photoProblem(meta: {
  size?: number;
  contentType?: unknown;
} | null): "invalid" | "missing" | null {
  if (meta === null) {
    return "missing";
  }
  if (typeof meta.size === "number" && meta.size > PHOTO_MAX_BYTES) {
    return "invalid";
  }
  if (
    typeof meta.contentType === "string" &&
    !PHOTO_TYPES.includes(meta.contentType)
  ) {
    return "invalid";
  }
  return null;
}

/**
 * Valida los `storageId` recién asociados (los que están en `nextIds`
 * pero no en `prevIds`). Red de seguridad de `resumes.update`: rechaza
 * sin borrar. No intenta borrar porque `_storage` forma parte de la
 * transacción: `delete + throw` en la misma mutación se revierte y el
 * fichero quedaría igualmente huérfano. El borrado real ocurre en
 * `attachPhoto`, cuya mutación confirma.
 */
export async function assertPhotoAssociations(
  ctx: MutationCtx,
  prevIds: string[],
  nextIds: string[],
): Promise<void> {
  const prev = new Set(prevIds);
  for (const storageId of new Set(nextIds)) {
    if (prev.has(storageId)) {
      continue;
    }
    let meta: { size?: number; contentType?: unknown } | null = null;
    try {
      meta = await ctx.db.system.get(storageId as Id<"_storage">);
    } catch {
      meta = null;
    }
    const problem = photoProblem(meta);
    if (problem === "missing") {
      continue;
    }
    if (problem === "invalid") {
      throw new ConvexError(
        "La foto no es válida (JPG, PNG o WebP de hasta 5 MB).",
      );
    }
  }
}

/**
 * Asocia una foto recién subida al CV (camino único de validación).
 * Valida tipo y tamaño contra Storage: si no cumple, borra el fichero y
 * devuelve el error SIN lanzar (la mutación confirma y el borrado
 * persiste); si cumple, lo asocia y sustituye la anterior (borrándola si
 * queda sin referencias). El cliente llama aquí en lugar de meter el ID
 * directamente en el contenido.
 */
export const attachPhoto = mutation({
  args: { resumeId: v.id("resumes"), storageId: v.string() },
  handler: async (ctx, args) => {
    const resume = await requireOwnedResume(ctx, args.resumeId);
    let meta: { size?: number; contentType?: unknown } | null = null;
    try {
      meta = await ctx.db.system.get(args.storageId as Id<"_storage">);
    } catch {
      meta = null;
    }
    const badTypeOrSize = photoProblem(meta) !== null;
    const personal = resume.content.sections.find(
      (s) => s.type === "personal",
    );
    const firstItem =
      personal && personal.items.length > 0 ? personal.items[0] : undefined;
    if (badTypeOrSize || firstItem === undefined) {
      try {
        await ctx.storage.delete(args.storageId as Id<"_storage">);
      } catch {
        // Ya no existe o el ID es inválido: el error manda igual.
      }
      return {
        ok: false as const,
        error:
          firstItem === undefined
            ? "El currículum no tiene datos personales para la foto."
            : meta === null
              ? "No se encontró el fichero subido. Inténtalo de nuevo."
              : "La foto no es válida (JPG, PNG o WebP de hasta 5 MB).",
      };
    }
    const prevIds = photoStorageIdsOf(resume.content);
    await ctx.db.patch(resume._id, {
      content: {
        sections: resume.content.sections.map((section) => {
          if (section.type !== "personal") {
            return section;
          }
          return {
            ...section,
            items: section.items.map((item, i) =>
              i === 0
                ? { ...item, photoStorageId: args.storageId }
                : item,
            ),
          };
        }),
      } as typeof resume.content,
      updatedAt: Date.now(),
    });
    // La anterior queda huérfana al sustituir: limpiarla aquí (antes el
    // botón «Cambiar» la abandonaba en Storage).
    for (const oldId of new Set(prevIds)) {
      if (oldId !== args.storageId) {
        await deletePhotoIfUnreferenced(ctx, resume.userId, oldId, resume._id);
      }
    }
    return { ok: true as const };
  },
});

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

/** Borra el fichero salvo que otro CV del usuario lo use. Recorre los CV
 * del usuario: acotado por el tope (MAX_RESUMES_PER_USER, 30 documentos
 * completos como máximo). */
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

/** URL firmada de subida (el cliente envía el binario ya redimensionado).
 * Cada llamada deja una fila en `uploads`: con más de
 * `MAX_UPLOADS_PER_DAY` en las últimas 24 h se rechaza, para que las
 * subidas abandonadas (que el cron no puede descubrir como ficheros,
 * porque Storage no se puede listar) queden acotadas. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getIdentityUserId(ctx);
    const since = Date.now() - DAY_MS;
    const recent = await ctx.db
      .query("uploads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (recent.filter((u) => u.createdAt >= since).length >= MAX_UPLOADS_PER_DAY) {
      throw new ConvexError(
        "Demasiadas subidas hoy. Inténtalo de nuevo mañana.",
      );
    }
    await ctx.db.insert("uploads", { userId, createdAt: Date.now() });
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

/**
 * Higiene de `uploads` (llamado por el cron diario): elimina las filas de
 * hace más de 24 h. Interna (sin sesión): solo la invoca el planificador.
 */
export const cleanupUploads = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - DAY_MS;
    const rows = await ctx.db.query("uploads").collect();
    let removed = 0;
    for (const row of rows) {
      if (row.createdAt < cutoff) {
        await ctx.db.delete(row._id);
        removed += 1;
      }
    }
    return removed;
  },
});
