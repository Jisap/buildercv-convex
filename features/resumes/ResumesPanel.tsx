"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  EllipsisVertical,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { withDesignDefaults } from "@/lib/resume";
import { healLayout } from "@/lib/resume-layout";
import {
  MAX_RESUMES_PER_USER,
  resumeTitleSchema,
} from "@/lib/validation/resume";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TEMPLATES } from "@/features/templates/types";
import { TemplateRenderer } from "@/features/templates/TemplateRenderer";
import { TemplateThumbnails } from "@/features/templates/TemplateThumbnails";

type CV = Doc<"resumes">;

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function nombrePlantilla(templateId: string): string {
  return (
    TEMPLATES.find((t) => t.id === templateId)?.name ?? "Plantilla clásica"
  );
}

/**
 * Si el servidor rechaza por tope de CV, su mensaje ya es apto para el
 * usuario y se muestra tal cual; si no, null para el genérico.
 */
function mensajeLimite(error: unknown): string | null {
  const texto = error instanceof Error ? error.message : "";
  const m = /Has llegado al máximo[\s\S]*$/.exec(texto);
  return m ? m[0] : null;
}

/**
 * Miniatura real del CV (mismo renderizador que la vista previa y el PDF),
 * escalada y en solo lectura. La foto se omite: el listado no incluye URLs
 * firmadas y una consulta por CV sería demasiado costosa (decisión
 * documentada; el editor y el PDF sí muestran la foto).
 */
const MiniaturaCV = memo(function MiniaturaCV({ resume }: { resume: CV }) {
  const design = useMemo(
    () => withDesignDefaults(resume.design),
    [resume.design],
  );
  const layout = useMemo(
    () => healLayout(resume.content.sections, resume.layout ?? null),
    [resume.content.sections, resume.layout],
  );
  // G4: el documento completo solo se monta al entrar en el viewport; el
  // recuadro (misma altura) reserva el espacio para no provocar saltos.
  const referencia = useRef<HTMLDivElement>(null);
  // Sin IntersectionObserver (entornos antiguos) se muestra directamente.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  useEffect(() => {
    const nodo = referencia.current;
    if (!nodo || visible) {
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [visible]);
  return (
    <div
      ref={referencia}
      aria-hidden="true"
      className="pointer-events-none h-40 overflow-hidden border-b border-border bg-white select-none"
    >
      {visible && (
        <div style={{ width: "210mm", zoom: 0.22 } as CSSProperties}>
          <TemplateRenderer
            content={resume.content}
            design={design}
            layout={layout}
            mode="preview"
          />
        </div>
      )}
    </div>
  );
});

/** Diálogo de confirmación para eliminar (nativo: Esc y foco incluidos). */
function DialogoEliminar({
  titulo,
  ocupado,
  alCancelar,
  alConfirmar,
}: {
  titulo: string;
  ocupado: boolean;
  alCancelar: () => void;
  alConfirmar: () => void;
}) {
  const referencia = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    referencia.current?.showModal();
  }, []);
  return (
    <dialog
      ref={referencia}
      aria-labelledby="eliminar-cv-titulo"
      onClose={alCancelar}
      className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <h2 id="eliminar-cv-titulo" className="font-semibold">
        Eliminar «{titulo}»
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta acción no se puede deshacer. El currículum desaparecerá de tu
        panel y de sus archivados.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" autoFocus onClick={alCancelar}>
          Cancelar
        </Button>
        <Button
          onClick={alConfirmar}
          disabled={ocupado}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <Trash2 />
          {ocupado ? "Eliminando…" : "Eliminar"}
        </Button>
      </div>
    </dialog>
  );
}

/** Diálogo de creación: nombre + plantilla visual (miniaturas reales). */
function DialogoCrear({
  titulo,
  alCambiarTitulo,
  plantillaId,
  alCambiarPlantilla,
  errorTitulo,
  creando,
  alCancelar,
  alCrear,
}: {
  titulo: string;
  alCambiarTitulo: (valor: string) => void;
  plantillaId: string;
  alCambiarPlantilla: (id: string) => void;
  errorTitulo: string | null;
  creando: boolean;
  alCancelar: () => void;
  alCrear: () => void;
}) {
  const referencia = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    referencia.current?.showModal();
  }, []);
  return (
    <dialog
      ref={referencia}
      aria-labelledby="crear-cv-titulo"
      onClose={alCancelar}
      className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <h2 id="crear-cv-titulo" className="font-semibold">
        Nuevo currículum
      </h2>
      <div className="mt-4 grid gap-4">
        <div>
          <Label htmlFor="nuevo-cv-titulo">Nombre del currículum</Label>
          <Input
            id="nuevo-cv-titulo"
            value={titulo}
            onChange={(e) => alCambiarTitulo(e.target.value)}
            placeholder="P. ej. «CV comercial»"
            maxLength={200}
            autoFocus
          />
          {errorTitulo && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {errorTitulo}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">Plantilla inicial</p>
          <TemplateThumbnails
            selectedId={plantillaId}
            onSelect={alCambiarPlantilla}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={alCancelar}>
          Cancelar
        </Button>
        <Button onClick={alCrear} disabled={creando}>
          <Plus />
          {creando ? "Creando…" : "Crear"}
        </Button>
      </div>
    </dialog>
  );
}

export function ResumesPanel({
  archived = false,
  hideForm = false,
}: {
  /** Vista de archivados en vez de activos. */
  archived?: boolean;
  /** Oculta la creación (p. ej. en Archivados). */
  hideForm?: boolean;
}) {
  const resumes = useQuery(api.resumes.list);
  const createResume = useMutation(api.resumes.create);
  const updateResume = useMutation(api.resumes.update);
  const duplicateResume = useMutation(api.resumes.duplicate);
  const removeResume = useMutation(api.resumes.remove);
  const [titulo, setTitulo] = useState("");
  const [plantillaId, setPlantillaId] = useState(TEMPLATES[0].id);
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [eliminarId, setEliminarId] = useState<Id<"resumes"> | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  if (resumes === undefined) {
    return (
      <div
        role="status"
        aria-label="Cargando tus currículums"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <Skeleton className="h-40 rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
        <span className="sr-only">Cargando tus currículums…</span>
      </div>
    );
  }

  const abrirCrear = () => {
    setTitulo("");
    setPlantillaId(TEMPLATES[0].id);
    setErrorTitulo(null);
    setCrearAbierto(true);
  };

  const handleCreate = async () => {
    const parsed = resumeTitleSchema.safeParse(titulo);
    if (!parsed.success) {
      setErrorTitulo(parsed.error.issues[0]?.message ?? "Título no válido.");
      return;
    }
    setErrorTitulo(null);
    setErrorAccion(null);
    setCreando(true);
    try {
      await createResume({ title: parsed.data, templateId: plantillaId });
      setCrearAbierto(false);
      setTitulo("");
    } catch (e) {
      setErrorAccion(
        mensajeLimite(e) ??
          "No se pudo crear el currículum. Inténtalo de nuevo.",
      );
    } finally {
      setCreando(false);
    }
  };

  const cvAEliminar =
    eliminarId === null
      ? null
      : (resumes ?? []).find((r) => r._id === eliminarId) ?? null;

  const handleDelete = async () => {
    if (eliminarId === null) {
      return;
    }
    setEliminando(true);
    setErrorAccion(null);
    try {
      await removeResume({ id: eliminarId });
      setEliminarId(null);
    } catch {
      setErrorAccion("No se pudo eliminar el currículum.");
    } finally {
      setEliminando(false);
    }
  };

  const handleDuplicate = async (id: Id<"resumes">) => {
    setErrorAccion(null);
    try {
      await duplicateResume({ id });
    } catch (e) {
      setErrorAccion(
        mensajeLimite(e) ?? "No se pudo duplicar el currículum.",
      );
    }
  };

  const handleArchive = async (
    id: Id<"resumes">,
    status: "draft" | "archived",
  ) => {
    setErrorAccion(null);
    try {
      await updateResume({ id, status });
    } catch {
      setErrorAccion(
        status === "archived"
          ? "No se pudo archivar el currículum."
          : "No se pudo desarchivar el currículum.",
      );
    }
  };

  const visible = (resumes ?? []).filter((resume) =>
    archived ? resume.status === "archived" : resume.status !== "archived",
  );
  // El tope cuenta archivados también (decisión documentada en el
  // servidor): con el panel lleno se explica en vez de fallar al crear.
  const alTope = (resumes ?? []).length >= MAX_RESUMES_PER_USER;

  return (
    <div>
      {errorAccion && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {errorAccion}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center text-card-foreground">
          <FileText
            className="mx-auto size-8 text-muted-foreground"
            aria-hidden
          />
          <p className="mt-3 font-medium">
            {archived ? "Nada archivado" : "Aún no tienes currículums"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {archived
              ? "Los currículums que archives aparecerán aquí."
              : "Crea el primero en un minuto: ponle nombre, elige una plantilla y edítalo a tu ritmo."}
          </p>
          {!hideForm && !archived && !alTope && (
            <Button className="mt-4" onClick={abrirCrear}>
              <Plus />
              Crear mi primer CV
            </Button>
          )}
          {!hideForm && !archived && alTope && (
            <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
              Has llegado al máximo de {MAX_RESUMES_PER_USER} currículums.
              Elimina alguno para crear otro.
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {!hideForm && (
            <li id="nuevo-cv" className="scroll-mt-24">
              {alTope ? (
                <div className="flex min-h-64 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-card p-6 text-center">
                  <p className="font-medium">Panel lleno</p>
                  <span className="text-sm text-muted-foreground">
                    Máximo de {MAX_RESUMES_PER_USER} currículums. Elimina
                    alguno para crear otro.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={abrirCrear}
                  className="flex min-h-64 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-card p-6 text-card-foreground hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Plus
                    className="size-8 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="font-medium">Nuevo CV</span>
                  <span className="text-sm text-muted-foreground">
                    Elige plantilla y empieza
                  </span>
                </button>
              )}
            </li>
          )}
          {visible.map((resume) => (
            <li
              key={resume._id}
              className="relative flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              <Link
                href={`/editor/${resume._id}`}
                aria-label={`Editar ${resume.title}`}
                className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
              >
                <MiniaturaCV resume={resume} />
                <div className="p-4">
                  <p className="truncate font-medium">{resume.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nombrePlantilla(resume.design.templateId)} · Modificado
                    el {formatDate(resume.updatedAt)}
                  </p>
                </div>
              </Link>
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`Acciones para ${resume.title}`}
                    className="rounded-md border border-border bg-card/95 p-1.5 text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <EllipsisVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      aria-label={`Duplicar ${resume.title}`}
                      onSelect={() => void handleDuplicate(resume._id)}
                    >
                      <Copy className="size-4" aria-hidden />
                      Duplicar
                    </DropdownMenuItem>
                    {archived ? (
                      <DropdownMenuItem
                        aria-label={`Desarchivar ${resume.title}`}
                        onSelect={() => void handleArchive(resume._id, "draft")}
                      >
                        <ArchiveRestore className="size-4" aria-hidden />
                        Desarchivar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        aria-label={`Archivar ${resume.title}`}
                        onSelect={() =>
                          void handleArchive(resume._id, "archived")
                        }
                      >
                        <Archive className="size-4" aria-hidden />
                        Archivar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      aria-label={`Eliminar ${resume.title}`}
                      onSelect={() => setEliminarId(resume._id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      {crearAbierto && (
        <DialogoCrear
          titulo={titulo}
          alCambiarTitulo={setTitulo}
          plantillaId={plantillaId}
          alCambiarPlantilla={setPlantillaId}
          errorTitulo={errorTitulo}
          creando={creando}
          alCancelar={() => setCrearAbierto(false)}
          alCrear={() => void handleCreate()}
        />
      )}
      {cvAEliminar && (
        <DialogoEliminar
          titulo={cvAEliminar.title}
          ocupado={eliminando}
          alCancelar={() => {
            if (!eliminando) {
              setEliminarId(null);
            }
          }}
          alConfirmar={() => void handleDelete()}
        />
      )}
    </div>
  );
}
