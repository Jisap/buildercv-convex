"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type AccionAviso = {
  etiqueta: string;
  alPulsar: () => void;
};

export type DatosAviso = {
  titulo: string;
  descripcion?: string;
  accion?: AccionAviso;
  /** Milisegundos visible; 0 o negativo = permanente. Por defecto 5000. */
  duracion?: number;
};

type Aviso = DatosAviso & { id: number };

let avisosActuales: Aviso[] = [];
let siguienteId = 1;
const oyentes = new Set<(avisos: Aviso[]) => void>();

function emitir() {
  for (const oyente of oyentes) {
    oyente([...avisosActuales]);
  }
}

function descartarInterno(id: number) {
  if (!avisosActuales.some((aviso) => aviso.id === id)) {
    return;
  }
  avisosActuales = avisosActuales.filter((aviso) => aviso.id !== id);
  emitir();
}

/**
 * Muestra un aviso ligero (una sola implementación en toda la app).
 * Pensado para “Deshacer” al eliminar secciones o currículums (flujos B/C).
 */
export function toast(datos: DatosAviso): number {
  const id = siguienteId++;
  avisosActuales = [...avisosActuales, { ...datos, id }];
  emitir();
  const duracion = datos.duracion ?? 5000;
  if (duracion > 0) {
    window.setTimeout(() => descartarInterno(id), duracion);
  }
  return id;
}

export function descartarAviso(id: number) {
  descartarInterno(id);
}

/** Región que pinta los avisos. Montar una sola vez en `app/layout.tsx`. */
export function Toaster({ className }: { className?: string }) {
  const [avisos, fijarAvisos] = React.useState<Aviso[]>(avisosActuales);

  React.useEffect(() => {
    const oyente = (siguientes: Aviso[]) => fijarAvisos(siguientes);
    oyentes.add(oyente);
    return () => {
      oyentes.delete(oyente);
    };
  }, []);

  if (avisos.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:items-end",
        className,
      )}
    >
      {avisos.map((aviso) => (
        <div
          key={aviso.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground shadow-lg"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{aviso.titulo}</p>
            {aviso.descripcion && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {aviso.descripcion}
              </p>
            )}
          </div>
          {aviso.accion && (
            <button
              type="button"
              onClick={() => {
                aviso.accion!.alPulsar();
                descartarInterno(aviso.id);
              }}
              className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {aviso.accion.etiqueta}
            </button>
          )}
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => descartarInterno(aviso.id)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
