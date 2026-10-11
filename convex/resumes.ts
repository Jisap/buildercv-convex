import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  resumeContentValidator,
  resumeDesignValidator,
  resumeStatusValidator,
} from "./resumeModel";
import { cloneContentWithNewIds, createDefaultContent, createDefaultDesign, withDesignDefaults } from "../lib/resume";
import { TEMPLATE_IDS } from "../features/templates/types";
import { assertContentLimits } from "./contentLimits";

// Todas las funciones resuelven la identidad desde `ctx.auth` (JWT de Clerk
// verificado por la plataforma). Jamás se acepta un userId del cliente.

async function getIdentityUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new ConvexError("No autenticado.");
  }
  return identity.subject;
}

async function requireOwnedResume(
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

function assertTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > 200) {
    throw new ConvexError("El título debe tener entre 1 y 200 caracteres.");
  }
  return trimmed;
}

function assertDesign(design: {
  accentColor?: string;
  templateId?: string;
  fontSize?: number;
  pageMargin?: number;
  sectionSpacing?: number;
  layoutId?: string;
}): void {
  if (
    design.accentColor !== undefined &&
    !/^#[0-9a-fA-F]{6}$/.test(design.accentColor)
  ) {
    throw new ConvexError("Color de acento no válido (hex #rrggbb).");
  }
  if (
    design.templateId !== undefined &&
    !TEMPLATE_IDS.includes(design.templateId)
  ) {
    throw new ConvexError("Plantilla desconocida.");
  }
  if (
    design.fontSize !== undefined &&
    (!Number.isFinite(design.fontSize) ||
      design.fontSize < 9 ||
      design.fontSize > 13)
  ) {
    throw new ConvexError("Tamaño de fuente fuera de rango (9–13 pt).");
  }
  if (
    design.pageMargin !== undefined &&
    (!Number.isFinite(design.pageMargin) ||
      design.pageMargin < 8 ||
      design.pageMargin > 20)
  ) {
    throw new ConvexError("Margen de página fuera de rango (8–20 mm).");
  }
  if (
    design.sectionSpacing !== undefined &&
    (!Number.isFinite(design.sectionSpacing) ||
      design.sectionSpacing < 2 ||
      design.sectionSpacing > 10)
  ) {
    throw new ConvexError("Separación fuera de rango (2–10 mm).");
  }
  if (
    design.layoutId !== undefined &&
    design.layoutId !== "single" &&
    design.layoutId !== "two-col"
  ) {
    throw new ConvexError("Distribución desconocida.");
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getIdentityUserId(ctx);
    return await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("resumes") },
  handler: async (ctx, args) => {
    return await requireOwnedResume(ctx, args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityUserId(ctx);
    const title = assertTitle(args.title);
    const design = createDefaultDesign(args.templateId?.trim() || "classic", 1);
    assertDesign(design);
    return await ctx.db.insert("resumes", {
      userId,
      title,
      status: "draft",
      content: createDefaultContent(),
      design,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("resumes"),
    title: v.optional(v.string()),
    status: v.optional(resumeStatusValidator),
    content: v.optional(resumeContentValidator),
    design: v.optional(resumeDesignValidator),
  },
  handler: async (ctx, args) => {
    const resume = await requireOwnedResume(ctx, args.id);
    const patch: {
      updatedAt: number;
      title?: string;
      status?: Doc<"resumes">["status"];
      content?: Doc<"resumes">["content"];
      design?: Doc<"resumes">["design"];
    } = { updatedAt: Date.now() };
    if (args.title !== undefined) {
      patch.title = assertTitle(args.title);
    }
    if (args.status !== undefined) {
      patch.status = args.status;
    }
    if (args.content !== undefined) {
      assertContentLimits(args.content);
      patch.content = args.content;
    }
    if (args.design !== undefined) {
      assertDesign(args.design);
      // Fusión con lo guardado + defaults: el parche sustituye el objeto
      // completo, así que un diseño parcial (o un CV antiguo sin los campos
      // nuevos) nunca debe borrar valores existentes.
      patch.design = withDesignDefaults({ ...resume.design, ...args.design });
    }
    await ctx.db.patch(resume._id, patch);
    return resume._id;
  },
});

export const duplicate = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, args) => {
    const resume = await requireOwnedResume(ctx, args.id);
    const userId = await getIdentityUserId(ctx);
    return await ctx.db.insert("resumes", {
      userId,
      title: `Copia de ${resume.title}`.slice(0, 200),
      status: "draft",
      content: cloneContentWithNewIds(resume.content),
      design: resume.design,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, args) => {
    const resume = await requireOwnedResume(ctx, args.id);
    await ctx.db.delete(resume._id);
    return resume._id;
  },
});
