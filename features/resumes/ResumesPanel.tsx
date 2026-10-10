"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Copy, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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

export function ResumesPanel() {
  const resumes = useQuery(api.resumes.list);
  const createResume = useMutation(api.resumes.create);
  const duplicateResume = useMutation(api.resumes.duplicate);
  const removeResume = useMutation(api.resumes.remove);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<Id<"resumes"> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (resumes === undefined) {
    return (
      <p className="text-sm text-zinc-600" role="status">
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
      await createResume({ title: parsed.data });
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

  return (
    <div>
      <form onSubmit={handleCreate} className="flex gap-2" noValidate>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre del currículum (p. ej. «CV comercial»)"
          aria-label="Nombre del currículum"
          maxLength={200}
        />
        <Button type="submit" disabled={creating}>
          <Plus />
          {creating ? "Creando…" : "Nuevo CV"}
        </Button>
      </form>
      {titleError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {titleError}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {actionError}
        </p>
      )}

      {resumes.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-900">
          <FileText className="mx-auto size-8 text-zinc-400" aria-hidden />
          <p className="mt-3 font-medium">Aún no tienes currículums</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600">
            Crea el primero con el formulario de arriba. Se guarda con
            contenido vacío válido y diseño clásico.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {resumes.map((resume) => (
            <li
              key={resume._id}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{resume.title}</p>
                <p className="text-sm text-zinc-500">
                  Modificado el {formatDate(resume.updatedAt)}
                  {resume.status === "archived" ? " · Archivado" : ""}
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
