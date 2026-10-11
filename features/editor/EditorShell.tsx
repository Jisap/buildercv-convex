"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import type {
  ResumeContent,
  ResumeDesign,
  ResumeLayout,
  ResumeSection,
  SectionType,
} from "@/types/resume";
import { createSection, newId, withDesignDefaults } from "@/lib/resume";
import {
  addSectionToLayout,
  healLayout,
  moveSectionInLayout,
  moveSectionToColumn,
  removeSectionFromLayout,
  syncOrders,
} from "@/lib/resume-layout";
import {
  resumeContentSchema,
  resumeDesignSchema,
  resumeLayoutSchema,
  resumeSectionSchema,
  resumeTitleSchema,
} from "@/lib/validation/resume";
import { useAutosave } from "./useAutosave";
import { SectionForm } from "./SectionForm";
import { ContentSidebar } from "./ContentSidebar";
import { DesignSidebar } from "./DesignSidebar";
import { EditorToolbar } from "./EditorToolbar";
import { ResumePreview } from "./ResumePreview";

type MobileTab = "edit" | "preview";

type PanelTab = "content" | "design";

export function EditorShell({ resumeId }: { resumeId: string }) {
  const id = resumeId as Id<"resumes">;
  const serverDoc = useQuery(api.resumes.get, { id });
  const updateResume = useMutation(api.resumes.update);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesign | null>(null);
  const [layout, setLayout] = useState<ResumeLayout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmSectionId, setConfirmSectionId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [panelTab, setPanelTab] = useState<PanelTab>("content");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Espejos para mutar contenido+layout de forma atómica desde manejadores
  // (evita cierres obsoletos y clics rápidos perdidos). Se sincronizan en
  // efecto (nunca durante el render) y tras cada mutación propia.
  const contentRef = useRef<ResumeContent | null>(null);
  const layoutRef = useRef<ResumeLayout | null>(null);
  useEffect(() => {
    contentRef.current = content;
    layoutRef.current = layout;
  });

  /**
   * Aplica un cambio de layout sincronizando `order` en el contenido local.
   * Sin esto, lo enviado (sincronizado en onSave) nunca igualaría lo local
   * y el autoguardado entraría en bucle mostrando "Guardando" sin fin.
   */
  const commitLayout = useCallback(
    (fn: (layout: ResumeLayout) => ResumeLayout) => {
      const c = contentRef.current;
      const l = layoutRef.current;
      if (c === null || l === null) {
        return;
      }
      const next = healLayout(c.sections, fn(l));
      const synced = syncOrders(c, next);
      layoutRef.current = next;
      contentRef.current = synced;
      setLayout(next);
      setContent(synced);
    },
    [],
  );

  // Hidratación inicial desde el servidor. Ajuste durante el render
  // (patrón documentado de React): solo se aplica una vez por documento.
  // El diseño se normaliza con valores por defecto para migrar CV guardados
  // antes de la fase de personalización visual; el layout se sana frente
  // al contenido (CV antiguos sin layout se derivan por tipo).
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  if (serverDoc && hydratedFor !== serverDoc._id) {
    setHydratedFor(serverDoc._id);
    setTitle(serverDoc.title);
    setContent(serverDoc.content);
    setDesign(withDesignDefaults(serverDoc.design));
    setLayout(healLayout(serverDoc.content.sections, serverDoc.layout ?? null));
    setSelectedId((current) =>
      current && serverDoc.content.sections.some((s) => s.id === current)
        ? current
        : (serverDoc.content.sections[0]?.id ?? null),
    );
  }

  const draft = useMemo(
    () =>
      content === null || design === null || layout === null
        ? null
        : { title, content, design, layout },
    [title, content, design, layout],
  );
  const saved = useMemo(
    () =>
      serverDoc === undefined || serverDoc === null
        ? undefined
        : {
            title: serverDoc.title,
            content: serverDoc.content,
            design: withDesignDefaults(serverDoc.design),
            layout: healLayout(serverDoc.content.sections, serverDoc.layout ?? null),
          },
    [serverDoc],
  );

  const onSave = useCallback(
    async (value: {
      title: string;
      content: ResumeContent;
      design: ResumeDesign;
      layout: ResumeLayout;
    }) => {
      const titleParsed = resumeTitleSchema.safeParse(value.title);
      if (!titleParsed.success) {
        setTitleError(
          titleParsed.error.issues[0]?.message ?? "Título no válido.",
        );
        throw new Error("invalid-title");
      }
      setTitleError(null);
      // El layout manda: se sana frente al contenido y se sincroniza `order`
      // antes de validar y enviar, así el guardado nunca deja mitades.
      const healedLayout = healLayout(value.content.sections, value.layout);
      const syncedContent = syncOrders(value.content, healedLayout);
      const contentParsed = resumeContentSchema.safeParse(syncedContent);
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
      const layoutParsed = resumeLayoutSchema.safeParse(healedLayout);
      if (!layoutParsed.success) {
        setValidationError("La distribución de secciones no es válida.");
        throw new Error("invalid-layout");
      }
      await updateResume({
        id,
        title: titleParsed.data,
        content: contentParsed.data,
        design: designParsed.data,
        layout: layoutParsed.data,
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

  // Foto del primer perfil (si hay): URL firmada para la vista previa.
  // Depende del contenido local para reflejar subidas al momento.
  const personalSection = content?.sections.find(
    (s): s is Extract<ResumeSection, { type: "personal" }> =>
      s.type === "personal",
  );
  const photoStorageId = personalSection?.items[0]?.photoStorageId;
  const photoUrl = useQuery(
    api.files.photoUrl,
    photoStorageId ? { resumeId: id, storageId: photoStorageId } : "skip",
  );

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
      commitLayout((current) => moveSectionInLayout(current, sectionId, dir));
    },
    [commitLayout],
  );

  const moveSectionColumn = useCallback(
    (sectionId: string, column: "main" | "sidebar") => {
      commitLayout((current) => moveSectionToColumn(current, sectionId, column));
    },
    [commitLayout],
  );

  // Destino de un drop de dnd-kit: el sidebar ya calcula el layout
  // completo; aquí solo se sana y sincroniza (igual que el resto).
  const dropLayout = useCallback(
    (next: ResumeLayout) => {
      commitLayout(() => next);
    },
    [commitLayout],
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      if (confirmSectionId !== sectionId) {
        setConfirmSectionId(sectionId);
        return;
      }
      setConfirmSectionId(null);
      const c = contentRef.current;
      const l = layoutRef.current;
      if (c !== null && l !== null) {
        const sections = c.sections.filter((s) => s.id !== sectionId);
        const nextLayout = healLayout(
          sections,
          removeSectionFromLayout(l, sectionId),
        );
        const synced = syncOrders({ sections }, nextLayout);
        layoutRef.current = nextLayout;
        contentRef.current = synced;
        setLayout(nextLayout);
        setContent(synced);
      }
      setSelectedId((current) => (current === sectionId ? null : current));
    },
    [confirmSectionId],
  );

  // Puro: sin efectos secundarios dentro del actualizador (React puede
  // reejecutarlo en comprobaciones de desarrollo).
  const addSection = useCallback(
    (type: SectionType) => {
      const c = contentRef.current;
      const l = layoutRef.current;
      if (c === null || l === null) {
        return;
      }
      const id = newId();
      setSelectedId(id);
      const section = createSection(type, c.sections.length, id);
      const nextContent = { sections: [...c.sections, section] };
      const nextLayout = healLayout(
        nextContent.sections,
        addSectionToLayout(l, section),
      );
      const synced = syncOrders(nextContent, nextLayout);
      layoutRef.current = nextLayout;
      contentRef.current = synced;
      setLayout(nextLayout);
      setContent(synced);
    },
    [],
  );

  if (serverDoc === undefined) {
    return (
      <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400" role="status">
        Cargando el editor…
      </p>
    );
  }

  if (serverDoc === null) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">No se encontró el currículum</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Puede que se haya eliminado o que no tengas acceso.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  if (content === null || design === null || layout === null) {
    return (
      <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400" role="status">
        Preparando el editor…
      </p>
    );
  }

  // El layout se sana en cada render: cualquier desajuste (sección nueva
  // aún no registrada, IDs antiguos) se corrige aquí y al guardar.
  const healedLayout = healLayout(content.sections, layout);
  const selected = content.sections.find((s) => s.id === selectedId) ?? null;
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
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {validationError}
        </p>
      )}

      <div className="mt-3 flex gap-2 md:hidden" role="tablist" aria-label="Vistas del editor">
        {(
          [
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

      <div className="mt-3 grid flex-1 items-start gap-4 md:grid-cols-[380px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
        <section
          aria-label="Panel de edición"
          className={mobileTab === "edit" ? "block" : "hidden md:block"}
        >
          <div
            className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
            role="tablist"
            aria-label="Contenido o diseño"
          >
            {(
              [
                ["content", "Contenido"],
                ["design", "Diseño"],
              ] as [PanelTab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={panelTab === tab}
                onClick={() => setPanelTab(tab)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  panelTab === tab
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            {panelTab === "content" ? (
              <div>
                <ContentSidebar
                  sections={content.sections}
                  layout={healedLayout}
                  layoutId={design.layoutId}
                  selectedId={selectedId}
                  confirmSectionId={confirmSectionId}
                  onSelect={setSelectedId}
                  onMove={moveSection}
                  onMoveColumn={moveSectionColumn}
                  onToggleVisible={(id) => {
                    const target = content.sections.find((s) => s.id === id);
                    if (target) {
                      patchSection(id, { visible: !target.visible });
                    }
                  }}
                  onDelete={deleteSection}
                  onAdd={addSection}
                  onLayoutChange={dropLayout}
                />
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  {selected ? (
                    <SectionForm
                      key={selected.id}
                      section={selected}
                      issues={sectionIssues && !sectionIssues.success ? sectionIssues.error.issues : []}
                      resumeId={resumeId}
                      onPatch={(patch) => patchSection(selected.id, patch)}
                      onChangeContent={setContent}
                    />
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Selecciona una sección para editarla.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <DesignSidebar design={design} onChange={setDesign} />
            )}
          </div>
        </section>

        <section
          aria-label="Vista previa"
          className={mobileTab === "preview" ? "block" : "hidden md:block"}
        >
          <div className="md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:self-start md:overflow-y-auto md:rounded-xl md:border md:border-zinc-200 md:bg-zinc-50 md:p-3 dark:md:border-zinc-800 dark:md:bg-zinc-900">
            <div
              className="flex items-center justify-between gap-2 md:sticky md:top-0 md:z-10 md:bg-zinc-50/95 md:py-1 md:backdrop-blur dark:md:bg-zinc-900/95"
              role="group"
              aria-label="Zoom de la vista previa"
            >
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">VISTA PREVIA · A4</p>
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
              <ResumePreview content={content} design={design} layout={healedLayout} zoom={zoom} photoUrl={photoUrl ?? null} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
