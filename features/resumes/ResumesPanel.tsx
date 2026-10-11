"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { TEMPLATES } from "@/features/templates/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resumeTitleSchema } from "@/lib/validation/resume";

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function ResumesPanel({
  archived = false,
  hideForm = false,
}: {
  /** Vista de archivados en vez de activos. */
  archived?: boolean;
  /** Oculta el formulario de creación (p. ej. en Archivados). */
  hideForm?: boolean;
}) {
  const resumes = useQuery(api.resumes.list);
  const createResume = useMutation(api.resumes.create);
  const updateResume = useMutation(api.resumes.update);
  const duplicateResume = useMutation(api.resumes.duplicate);
  const removeResume = useMutation(api.resumes.remove);
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<Id<"resumes"> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (resumes === undefined) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
        Cargando tus currículums…
      </p>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = resumeTitleSchema.safeParse(title);
    if (!parsed.success) {
      setTitleError(parsed.error.issues[0]?.message ?? "Título no válido.");
      return;
    }
    setTitleError(null);
    setActionError(null);
    setCreating(true);
    try {
      await createResume({ title: parsed.data, templateId });
      setTitle("");
    } catch {
      setActionError("No se pudo crear el currículum. Inténtalo de nuevo.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: Id<"resumes">) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    setActionError(null);
    try {
      await removeResume({ id });
    } catch {
      setActionError("No se pudo eliminar el currículum.");
    }
  };

  const handleDuplicate = async (id: Id<"resumes">) => {
    setActionError(null);
    try {
      await duplicateResume({ id });
    } catch {
      setActionError("No se pudo duplicar el currículum.");
    }
  };

  const handleArchive = async (
    id: Id<"resumes">,
    status: "draft" | "archived",
  ) => {
    setActionError(null);
    try {
      await updateResume({ id, status });
    } catch {
      setActionError(
        status === "archived"
          ? "No se pudo archivar el currículum."
          : "No se pudo desarchivar el currículum.",
      );
    }
  };

  const visible = (resumes ?? []).filter((resume) =>
    archived ? resume.status === "archived" : resume.status !== "archived",
  );

  return (
    <div>
      {!hideForm && (
        <form
          id="nuevo-cv"
          onSubmit={handleCreate}
          className="flex scroll-mt-24 flex-col gap-2 sm:flex-row"
          noValidate
        >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre del currículum (p. ej. «CV comercial»)"
          aria-label="Nombre del currículum"
          maxLength={200}
          className="flex-1"
        />
        <label className="sr-only" htmlFor="new-template">
          Plantilla inicial
        </label>
        <select
          id="new-template"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="flex h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={creating}>
          <Plus />
          {creating ? "Creando…" : "Nuevo CV"}
        </Button>
        </form>
      )}
      {titleError && !hideForm && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {titleError}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <FileText className="mx-auto size-8 text-zinc-400" aria-hidden />
          <p className="mt-3 font-medium">
            {archived ? "Nada archivado" : "Aún no tienes currículums"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            {archived
              ? "Los currículums que archives aparecerán aquí."
              : "Crea el primero con el formulario de arriba. Se guarda con contenido vacío válido y diseño clásico."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((resume) => (
            <li
              key={resume._id}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{resume.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Modificado el {formatDate(resume.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/editor/${resume._id}`}>Editar</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleDuplicate(resume._id)}
                  title="Duplicar"
                >
                  <Copy />
                  <span className="sr-only">Duplicar</span>
                </Button>
                {archived ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleArchive(resume._id, "draft")}
                    title="Desarchivar"
                  >
                    <ArchiveRestore />
                    <span className="sr-only">Desarchivar</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleArchive(resume._id, "archived")}
                    title="Archivar"
                  >
                    <Archive />
                    <span className="sr-only">Archivar</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={confirmDeleteId === resume._id ? "default" : "outline"}
                  onClick={() => void handleDelete(resume._id)}
                  title={
                    confirmDeleteId === resume._id
                      ? "Pulsa de nuevo para confirmar"
                      : "Eliminar"
                  }
                >
                  <Trash2 />
                  {confirmDeleteId === resume._id ? "Confirmar" : ""}
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
