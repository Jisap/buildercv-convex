"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import type {
  ResumeContent,
  ResumeDesign,
  SectionType,
} from "@/types/resume";
import { createSection, newId, withDesignDefaults } from "@/lib/resume";import {
  resumeContentSchema,
  resumeDesignSchema,
  resumeSectionSchema,
  resumeTitleSchema,
} from "@/lib/validation/resume";
import { useAutosave } from "./useAutosave";
import { SectionForm } from "./SectionForm";
import { ContentSidebar } from "./ContentSidebar";
import { DesignSidebar } from "./DesignSidebar";
import { EditorToolbar } from "./EditorToolbar";
import { ResumePreview } from "./ResumePreview";

type MobileTab = "sections" | "edit" | "design" | "preview";

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
  const [design, setDesign] = useState<ResumeDesign | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmSectionId, setConfirmSectionId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Hidratación inicial desde el servidor. Ajuste durante el render
  // (patrón documentado de React): solo se aplica una vez por documento.
  // El diseño se normaliza con valores por defecto para migrar CV guardados
  // antes de la fase de personalización visual.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  if (serverDoc && hydratedFor !== serverDoc._id) {
    setHydratedFor(serverDoc._id);
    setTitle(serverDoc.title);
    setContent(serverDoc.content);
    setDesign(withDesignDefaults(serverDoc.design));
    setSelectedId((current) =>
      current && serverDoc.content.sections.some((s) => s.id === current)
        ? current
        : (serverDoc.content.sections[0]?.id ?? null),
    );
  }

  const draft = useMemo(
    () => (content === null || design === null ? null : { title, content, design }),
    [title, content, design],
  );
  const saved = useMemo(
    () =>
      serverDoc === undefined || serverDoc === null
        ? undefined
        : {
            title: serverDoc.title,
            content: serverDoc.content,
            design: withDesignDefaults(serverDoc.design),
          },
    [serverDoc],
  );

  const onSave = useCallback(
    async (value: { title: string; content: ResumeContent; design: ResumeDesign }) => {
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
      const designParsed = resumeDesignSchema.safeParse(value.design);
      if (!designParsed.success) {
        setValidationError("La configuración de diseño no es válida.");
        throw new Error("invalid-design");
      }
      await updateResume({
        id,
        title: titleParsed.data,
        content: contentParsed.data,
        design: designParsed.data,
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
      if (confirmSectionId !== sectionId) {
        setConfirmSectionId(sectionId);
        return;
      }
      setConfirmSectionId(null);
      setContent((current) => {
        if (!current) {
          return current;
        }
        const sections = current.sections.filter((s) => s.id !== sectionId);
        return { sections: sections.map((s, i) => ({ ...s, order: i })) };
      });
      setSelectedId((current) => (current === sectionId ? null : current));
    },
    [confirmSectionId],
  );

  // Puro: sin efectos secundarios dentro del actualizador (React puede
  // reejecutarlo en comprobaciones de desarrollo).
  const addSection = useCallback((type: SectionType) => {
    const id = newId();
    setSelectedId(id);
    setContent((current) => {
      if (!current) {
        return current;
      }
      return {
        sections: [
          ...current.sections,
          createSection(type, current.sections.length, id),
        ],
      };
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

  if (content === null || design === null) {
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
      <EditorToolbar
        title={title}
        onTitleChange={setTitle}
        titleError={titleError}
        status={status}
        onRetry={retry}
        resumeId={resumeId}
      />
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
            ["design", "Diseño"],
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
          <ContentSidebar
            sections={sorted}
            selectedId={selectedId}
            confirmSectionId={confirmSectionId}
            onSelect={(id) => {
              setSelectedId(id);
              setMobileTab("edit");
            }}
            onMove={moveSection}
            onToggleVisible={(id) => {
              const target = content.sections.find((s) => s.id === id);
              if (target) {
                patchSection(id, { visible: !target.visible });
              }
            }}
            onDelete={deleteSection}
            onAdd={addSection}
          />
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

        <div className={mobileTab === "design" ? "block md:hidden" : "hidden"}>
          <DesignSidebar design={design} onChange={setDesign} />
        </div>

        <section
          aria-label="Vista previa"
          className={mobileTab === "preview" ? "block" : "hidden md:block"}
        >
          <div className="hidden md:block">
            <DesignSidebar design={design} onChange={setDesign} />
          </div>
          <div
            className="mt-3 flex items-center justify-between gap-2 md:mt-4"
            role="group"
            aria-label="Zoom de la vista previa"
          >
            <p className="text-xs font-medium text-zinc-500">VISTA PREVIA</p>
            <div className="flex gap-1">
              {([0.75, 1, 1.25] as const).map((z) => (
                <Button
                  key={z}
                  size="sm"
                  variant={zoom === z ? "default" : "outline"}
                  aria-pressed={zoom === z}
                  onClick={() => setZoom(z)}
                >
                  {Math.round(z * 100)} %
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <ResumePreview content={content} design={design} zoom={zoom} />
          </div>
        </section>
      </div>
    </div>
  );
}
