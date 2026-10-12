"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Download,
  FileText,
  Minus,
  Palette,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
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
  columnOf,
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

// B2: control compacto. El rango incluye como mínimo el anterior
// (75/100/125 %) y lo amplía a 50–200 % en pasos de 25.
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_PASO = 0.25;

function redondearZoom(valor: number): number {
  return Math.round(valor * 4) / 4;
}

export function EditorShell({ resumeId }: { resumeId: string }) {
  const id = resumeId as Id<"resumes">;
  const serverDoc = useQuery(api.resumes.get, { id });
  const updateResume = useMutation(api.resumes.update);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesign | null>(null);
  const [layout, setLayout] = useState<ResumeLayout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [panelTab, setPanelTab] = useState<PanelTab>("content");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  // Destino del foco al pulsar «Revisar» en el aviso de validación (B4).
  const panelRef = useRef<HTMLElement | null>(null);

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

  const deleteSection = useCallback((sectionId: string) => {
    const c = contentRef.current;
    const l = layoutRef.current;
    if (c === null || l === null) {
      return;
    }
    const eliminada = c.sections.find((s) => s.id === sectionId);
    if (!eliminada) {
      return;
    }
    // Posición previa para restaurar con «Deshacer» sin perder otros
    // cambios que ocurran mientras el aviso está visible.
    const indicePrevio = c.sections.findIndex((s) => s.id === sectionId);
    const columnaPrevia = columnOf(l, sectionId) ?? "main";
    const indiceColumna = l[columnaPrevia].indexOf(sectionId);
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
    setSelectedId((current) => (current === sectionId ? null : current));
    toast({
      title: `Sección «${eliminada.title}» eliminada.`,
      action: {
        label: "Deshacer",
        onPress: () => {
          const actual = contentRef.current;
          const layoutActual = layoutRef.current;
          if (actual === null || layoutActual === null) {
            return;
          }
          if (actual.sections.some((s) => s.id === sectionId)) {
            return;
          }
          const restauradas = [...actual.sections];
          restauradas.splice(
            Math.max(0, Math.min(indicePrevio, restauradas.length)),
            0,
            eliminada,
          );
          const ids = layoutActual[columnaPrevia].filter(
            (id) => id !== sectionId,
          );
          const en =
            indiceColumna < 0
              ? ids.length
              : Math.max(0, Math.min(indiceColumna, ids.length));
          const restauradoLayout = healLayout(restauradas, {
            ...layoutActual,
            [columnaPrevia]: [
              ...ids.slice(0, en),
              sectionId,
              ...ids.slice(en),
            ],
          });
          const restaurado = syncOrders(
            { sections: restauradas },
            restauradoLayout,
          );
          layoutRef.current = restauradoLayout;
          contentRef.current = restaurado;
          setLayout(restauradoLayout);
          setContent(restaurado);
          setSelectedId(sectionId);
        },
      },
    });
  }, []);

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
      <p className="p-6 text-sm text-muted-foreground" role="status">
        Cargando el editor…
      </p>
    );
  }

  if (serverDoc === null) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="font-medium text-foreground">No se encontró el currículum</p>
        <p className="mt-1 text-sm text-muted-foreground">
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
      <p className="p-6 text-sm text-muted-foreground" role="status">
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

  // B4: lleva el foco a la primera sección con errores (o al panel de
  // diseño si el diseño es lo inválido) desde el aviso de validación.
  const revisarErrores = () => {
    const actual = contentRef.current;
    const primeraConError = actual?.sections.find(
      (s) => !resumeSectionSchema.safeParse(s).success,
    );
    if (primeraConError) {
      setPanelTab("content");
      setSelectedId(primeraConError.id);
    } else if (!resumeDesignSchema.safeParse(design).success) {
      setPanelTab("design");
    }
    setMobileTab("edit");
    requestAnimationFrame(() => panelRef.current?.focus());
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-4 pb-24 md:px-6 md:pb-4">
      <EditorToolbar
        title={title}
        onTitleChange={setTitle}
        titleError={titleError}
        status={status}
        onRetry={retry}
        resumeId={resumeId}
      />
      {validationError && (
        <div
          role="alert"
          className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-foreground"
        >
          <TriangleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
          <p className="min-w-0 flex-1">{validationError}</p>
          <Button size="sm" variant="outline" onClick={revisarErrores}>
            Revisar
          </Button>
        </div>
      )}

      <nav
        aria-label="Vistas del editor"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-4 gap-1 px-2 pt-2">
          <Button
            size="sm"
            variant={
              mobileTab === "edit" && panelTab === "content"
                ? "default"
                : "ghost"
            }
            aria-pressed={mobileTab === "edit" && panelTab === "content"}
            onClick={() => {
              setPanelTab("content");
              setMobileTab("edit");
            }}
            className="h-auto flex-col gap-1 py-1.5 text-xs"
          >
            <Pencil />
            Editar
          </Button>
          <Button
            size="sm"
            variant={
              mobileTab === "edit" && panelTab === "design"
                ? "default"
                : "ghost"
            }
            aria-pressed={mobileTab === "edit" && panelTab === "design"}
            onClick={() => {
              setPanelTab("design");
              setMobileTab("edit");
            }}
            className="h-auto flex-col gap-1 py-1.5 text-xs"
          >
            <Palette />
            Diseño
          </Button>
          <Button
            size="sm"
            variant={mobileTab === "preview" ? "default" : "ghost"}
            aria-pressed={mobileTab === "preview"}
            onClick={() => setMobileTab("preview")}
            className="h-auto flex-col gap-1 py-1.5 text-xs"
          >
            <FileText />
            Vista previa
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-auto flex-col gap-1 py-1.5 text-xs"
          >
            <a href={`/api/resumes/${resumeId}/pdf`} download>
              <Download />
              PDF
            </a>
          </Button>
        </div>
      </nav>

      <div className="mt-3 grid flex-1 items-start gap-4 md:grid-cols-[380px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
        <section
          ref={panelRef}
          tabIndex={-1}
          aria-label="Panel de edición"
          className={
            mobileTab === "edit"
              ? "block focus:outline-none"
              : "hidden focus:outline-none md:block"
          }
        >
          <div
            className="hidden gap-1 rounded-lg bg-muted p-1 md:flex"
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
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
                <div className="mt-4 border-t border-border pt-4">
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
                    <p className="text-sm text-muted-foreground">
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
          <div className="md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:self-start md:overflow-y-auto md:rounded-xl md:border md:border-border md:bg-muted md:p-3">
            <div
              className="flex items-center justify-between gap-2 md:sticky md:top-0 md:z-10 md:bg-muted/95 md:py-1 md:backdrop-blur"
              role="group"
              aria-label="Zoom de la vista previa"
            >
              <p className="text-xs font-medium text-muted-foreground">VISTA PREVIA · A4</p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Reducir zoom"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() =>
                    setZoom((actual) =>
                      redondearZoom(Math.max(ZOOM_MIN, actual - ZOOM_PASO)),
                    )
                  }
                >
                  <Minus />
                </Button>
                <span
                  role="status"
                  aria-label={`Nivel de zoom: ${Math.round(zoom * 100)} por ciento`}
                  className="min-w-14 text-center text-sm text-muted-foreground tabular-nums"
                >
                  {Math.round(zoom * 100)} %
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Ampliar zoom"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() =>
                    setZoom((actual) =>
                      redondearZoom(Math.min(ZOOM_MAX, actual + ZOOM_PASO)),
                    )
                  }
                >
                  <Plus />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Restablecer zoom al 100 %"
                  onClick={() => setZoom(1)}
                >
                  100 %
                </Button>
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
