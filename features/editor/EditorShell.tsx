"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ResumeContent,
  ResumeSection,
  SectionType,
} from "@/types/resume";
import { newId } from "@/lib/resume";
import {
  resumeContentSchema,
  resumeSectionSchema,
  resumeTitleSchema,
} from "@/lib/validation/resume";
import { useAutosave, type SaveStatus } from "./useAutosave";
import { ADD_SECTION_LABEL } from "./sectionFields";
import { SectionForm } from "./SectionForm";
import { ResumePreview } from "./ResumePreview";

type MobileTab = "sections" | "edit" | "preview";

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Cargando…
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Guardando…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-red-600" role="alert">
        Error al guardar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-green-700" role="status">
      <Check className="size-4" aria-hidden />
      Guardado
    </span>
  );
}

function moveInArray<T extends { order: number }>(
  arr: T[],
  index: number,
  dir: -1 | 1,
): T[] {
  const next = [...arr];
  const target = index + dir;
  if (target < 0 || target >= next.length) {
    return next;
  }
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((item, i) => ({ ...item, order: i }));
}

export function EditorShell({ resumeId }: { resumeId: string }) {
  const id = resumeId as Id<"resumes">;
  const serverDoc = useQuery(api.resumes.get, { id });
  const updateResume = useMutation(api.resumes.update);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Hidratación inicial desde el servidor. Ajuste durante el render
  // (patrón documentado de React): solo se aplica una vez por documento.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  if (serverDoc && hydratedFor !== serverDoc._id) {
    setHydratedFor(serverDoc._id);
    setTitle(serverDoc.title);
    setContent(serverDoc.content);
    setSelectedId((current) =>
      current && serverDoc.content.sections.some((s) => s.id === current)
        ? current
        : (serverDoc.content.sections[0]?.id ?? null),
    );
  }

  const draft = useMemo(
    () => (content === null ? null : { title, content }),
    [title, content],
  );
  const saved = useMemo(
    () =>
      serverDoc === undefined || serverDoc === null
        ? undefined
        : { title: serverDoc.title, content: serverDoc.content },
    [serverDoc],
  );

  const onSave = useCallback(
    async (value: { title: string; content: ResumeContent }) => {
      const titleParsed = resumeTitleSchema.safeParse(value.title);
      if (!titleParsed.success) {
        setTitleError(
          titleParsed.error.issues[0]?.message ?? "Título no válido.",
        );
        throw new Error("invalid-title");
      }
      setTitleError(null);
      const contentParsed = resumeContentSchema.safeParse(value.content);
      if (!contentParsed.success) {
        setValidationError(
          "Hay campos con errores. Revísalos antes de guardar.",
        );
        throw new Error("invalid-content");
      }
      setValidationError(null);
      await updateResume({
        id,
        title: titleParsed.data,
        content: contentParsed.data,
      });
    },
    [id, updateResume],
  );

  const { status, retry, dirty } = useAutosave({
    value: draft,
    savedValue: saved,
    onSave,
    enabled: draft !== null && saved !== undefined,
  });

  useEffect(() => {
    if (!dirty) {
      return;
    }
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const patchSection = useCallback(
    (sectionId: string, patch: { title?: string; visible?: boolean }) => {
      setContent((current) => {
        if (!current) {
          return current;
        }
        return {
          sections: current.sections.map((s) =>
            s.id === sectionId ? { ...s, ...patch } : s,
          ),
        };
      });
    },
    [],
  );

  const moveSection = useCallback(
    (sectionId: string, dir: -1 | 1) => {
      setContent((current) => {
        if (!current) {
          return current;
        }
        const index = current.sections.findIndex((s) => s.id === sectionId);
        if (index === -1) {
          return current;
        }
        return { sections: moveInArray(current.sections, index, dir) };
      });
    },
    [],
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      setContent((current) => {
        if (!current) {
          return current;
        }
        const sections = current.sections.filter((s) => s.id !== sectionId);
        return { sections: sections.map((s, i) => ({ ...s, order: i })) };
      });
      setSelectedId((current) => (current === sectionId ? null : current));
    },
    [],
  );

  const addSection = useCallback((type: SectionType) => {
    const titles: Record<SectionType, string> = {
      personal: "Datos personales",
      profile: "Perfil profesional",
      experience: "Experiencia",
      education: "Formación",
      skills: "Competencias",
      digitalSkills: "Competencias digitales",
      languages: "Idiomas",
      projects: "Proyectos",
      custom: "Sección personalizada",
    };
    setContent((current) => {
      if (!current) {
        return current;
      }
      const section = {
        id: newId(),
        title: titles[type],
        order: current.sections.length,
        visible: true,
        type,
        items: [],
      } as ResumeSection;
      setSelectedId(section.id);
      return { sections: [...current.sections, section] };
    });
  }, []);

  if (serverDoc === undefined) {
    return (
      <p className="p-6 text-sm text-zinc-600" role="status">
        Cargando el editor…
      </p>
    );
  }

  if (serverDoc === null) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="font-medium text-zinc-900">No se encontró el currículum</p>
        <p className="mt-1 text-sm text-zinc-600">
          Puede que se haya eliminado o que no tengas acceso.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  if (content === null) {
    return (
      <p className="p-6 text-sm text-zinc-600" role="status">
        Preparando el editor…
      </p>
    );
  }

  const sorted = [...content.sections].sort((a, b) => a.order - b.order);
  const selected = sorted.find((s) => s.id === selectedId) ?? null;
  const sectionIssues = selected
    ? resumeSectionSchema.safeParse(selected)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 md:px-6">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 pb-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard" aria-label="Volver al panel">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <Label htmlFor="resume-title" className="sr-only">
            Título del currículum
          </Label>
          <Input
            id="resume-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-md border-transparent text-lg font-semibold shadow-none focus-visible:border-zinc-200"
            maxLength={200}
          />
          {titleError && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {titleError}
            </p>
          )}
        </div>
        <SaveBadge status={status} />
        {status === "error" && (
          <Button size="sm" variant="outline" onClick={retry}>
            <RefreshCw />
            Reintentar
          </Button>
        )}
      </header>
      {validationError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {validationError}
        </p>
      )}

      <div className="mt-3 flex gap-2 md:hidden" role="tablist" aria-label="Vistas del editor">
        {(
          [
            ["sections", "Secciones"],
            ["edit", "Editar"],
            ["preview", "Vista previa"],
          ] as [MobileTab, string][]
        ).map(([tab, label]) => (
          <Button
            key={tab}
            size="sm"
            role="tab"
            aria-selected={mobileTab === tab}
            variant={mobileTab === tab ? "default" : "outline"}
            onClick={() => setMobileTab(tab)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid flex-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
        <nav
          aria-label="Secciones"
          className={mobileTab === "sections" ? "block" : "hidden md:block"}
        >
          <ul className="space-y-1">
            {sorted.map((s, index) => (
              <li key={s.id}>
                <div
                  className={`flex items-center gap-1 rounded-md px-2 py-1.5 ${
                    s.id === selectedId ? "bg-zinc-100" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      setMobileTab("edit");
                    }}
                    className="min-w-0 flex-1 truncate text-left text-sm text-zinc-900"
                    aria-current={s.id === selectedId}
                  >
                    {s.title}
                    {s.visible ? "" : " (oculta)"}
                  </button>
                  <button
                    type="button"
                    title="Subir"
                    aria-label={`Subir ${s.title}`}
                    disabled={index === 0}
                    onClick={() => moveSection(s.id, -1)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Bajar"
                    aria-label={`Bajar ${s.title}`}
                    disabled={index === sorted.length - 1}
                    onClick={() => moveSection(s.id, 1)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    title={s.visible ? "Ocultar" : "Mostrar"}
                    aria-label={`${s.visible ? "Ocultar" : "Mostrar"} ${s.title}`}
                    aria-pressed={s.visible}
                    onClick={() => patchSection(s.id, { visible: !s.visible })}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200"
                  >
                    {s.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    type="button"
                    title="Eliminar sección"
                    aria-label={`Eliminar ${s.title}`}
                    onClick={() => deleteSection(s.id)}
                    className="rounded p-1 text-zinc-500 hover:bg-red-100 hover:text-red-700"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-zinc-200 pt-3">
            <p className="mb-2 text-xs font-medium text-zinc-500">AÑADIR SECCIÓN</p>
            <div className="flex flex-wrap gap-1.5">
              {ADD_SECTION_LABEL.map(({ type, label }) => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  onClick={() => addSection(type)}
                >
                  <Plus />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </nav>

        <section
          aria-label="Formulario"
          className={mobileTab === "edit" ? "block" : "hidden md:block"}
        >
          {selected ? (
            <SectionForm
              key={selected.id}
              section={selected}
              issues={sectionIssues && !sectionIssues.success ? sectionIssues.error.issues : []}
              onPatch={(patch) => patchSection(selected.id, patch)}
              onChangeContent={setContent}
            />
          ) : (
            <p className="text-sm text-zinc-500">
              Selecciona una sección para editarla.
            </p>
          )}
        </section>

        <section
          aria-label="Vista previa"
          className={mobileTab === "preview" ? "block" : "hidden md:block"}
        >
          <ResumePreview title={title} content={content} />
        </section>
      </div>
    </div>
  );
}
