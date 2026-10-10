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
import { cloneContentWithNewIds, createDefaultContent } from "../lib/resume";
import { TEMPLATE_IDS } from "../features/templates/types";

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
  accentColor: string;
  templateId: string;
}): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(design.accentColor)) {
    throw new ConvexError("Color de acento no válido (hex #rrggbb).");
  }
  if (!TEMPLATE_IDS.includes(design.templateId)) {
    throw new ConvexError("Plantilla desconocida.");
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
    const design = {
      templateId: args.templateId?.trim() || "classic",
      templateVersion: 1,
      accentColor: "#1d4ed8",
      fontFamily: "inter" as const,
    };
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
      patch.content = args.content;
    }
    if (args.design !== undefined) {
      assertDesign(args.design);
      patch.design = args.design;
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
