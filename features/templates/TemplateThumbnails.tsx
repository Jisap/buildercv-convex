"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ResumeContent } from "@/types/resume";
import { createDefaultDesign } from "@/lib/resume";
import { TEMPLATES, getTemplateMeta } from "./types";
import { TemplateRenderer } from "./TemplateRenderer";

// Contenido breve para las miniaturas: cabecera, experiencia, una sección
// lateral y un idioma. Basta para distinguir las plantillas sin pesar.
const THUMB_CONTENT: ResumeContent = {
  sections: [
    {
      id: "t-personal",
      type: "personal",
      title: "Datos personales",
      order: 0,
      visible: true,
      items: [
        {
          id: "t-p1",
          fullName: "Ana Ruiz",
          email: "ana@example.es",
          location: "Madrid",
        },
      ],
    },
    {
      id: "t-exp",
      type: "experience",
      title: "Experiencia",
      order: 1,
      visible: true,
      items: [
        {
          id: "t-e1",
          position: "Diseñadora",
          company: "Acme",
          startDate: "2021-03",
          current: true,
          description: "Diseño de producto.",
        },
        {
          id: "t-e2",
          position: "Becaria",
          company: "Beta",
          startDate: "2020-01",
          endDate: "2021-02",
          description: "Apoyo al equipo.",
        },
      ],
    },
    {
      id: "t-skills",
      type: "skills",
      title: "Competencias",
      order: 2,
      visible: true,
      items: [
        { id: "t-s1", name: "Figma", level: 5 },
        { id: "t-s2", name: "Accesibilidad", level: 4 },
      ],
    },
    {
      id: "t-lang",
      type: "languages",
      title: "Idiomas",
      order: 3,
      visible: true,
      items: [{ id: "t-l1", name: "Inglés", level: "B2" }],
    },
  ],
};

/** Miniatura real de una plantilla (mismo renderizador que la vista previa). */
export const TemplateThumbnail = memo(function TemplateThumbnail({
  templateId,
  tall = false,
}: {
  templateId: string;
  /** Versión más alta para el carrusel del panel de diseño. */
  tall?: boolean;
}) {
  const design = useMemo(() => {
    const meta = getTemplateMeta(templateId);
    return createDefaultDesign(meta.id, meta.version);
  }, [templateId]);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex justify-center overflow-hidden rounded-md border border-border bg-white select-none ${
        tall ? "h-40" : "h-24"
      }`}
    >
      <div style={{ width: "210mm", zoom: 0.18 }}>
        <TemplateRenderer
          content={THUMB_CONTENT}
          design={design}
          layout={null}
          mode="preview"
        />
      </div>
    </div>
  );
});

/** Carrusel horizontal de plantillas para el panel de diseño.
 * Scroll-snap nativo (sin dependencias): asoma la siguiente para invitar
 * al desplazamiento. Mantiene la semántica de radiogroup (las flechas,
 * Inicio y Fin mueven la selección) y el mismo contrato `onSelect` que la
 * cuadrícula, así que el autoguardado no cambia. */
export function TemplateCarousel({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (templateId: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicial = Math.max(
    0,
    TEMPLATES.findIndex((meta) => meta.id === selectedId),
  );
  const [activo, setActivo] = useState(inicial);

  /** Centra un item dentro del carrusel sin mover el scroll de la página. */
  function centrar(indice: number, suave: boolean) {
    const track = trackRef.current;
    const item = itemRefs.current[indice];
    if (!track || !item) {
      return;
    }
    track.scrollTo({
      left: item.offsetLeft - (track.clientWidth - item.clientWidth) / 2,
      behavior: suave ? "smooth" : "auto",
    });
  }

  // Muestra la plantilla activa al montar (sin animación).
  useEffect(() => {
    centrar(inicial, false);
    // Solo al montar: `inicial` es la selección de entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /** Actualiza el contador al terminar el desplazamiento (sin saturar). */
  function alDesplazar() {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      const centro = (trackRef.current?.scrollLeft ?? 0) + track.clientWidth / 2;
      let mejor = 0;
      itemRefs.current.forEach((item, i) => {
        if (!item) {
          return;
        }
        const centroItem = item.offsetLeft + item.clientWidth / 2;
        const actual = itemRefs.current[mejor];
        const centroMejor =
          (actual?.offsetLeft ?? 0) + (actual?.clientWidth ?? 0) / 2;
        if (Math.abs(centroItem - centro) < Math.abs(centroMejor - centro)) {
          mejor = i;
        }
      });
      setActivo(mejor);
    }, 150);
  }

  /** Desplaza sin cambiar la selección (botones anterior/siguiente). */
  function desplazar(direccion: 1 | -1) {
    const siguiente =
      (activo + direccion + TEMPLATES.length) % TEMPLATES.length;
    setActivo(siguiente);
    centrar(siguiente, true);
  }

  /** Elige, centra y enfoca (teclado con semántica de grupo de radios). */
  function elegir(indice: number) {
    const meta = TEMPLATES[indice];
    if (!meta) {
      return;
    }
    setActivo(indice);
    onSelect(meta.id);
    centrar(indice, true);
    itemRefs.current[indice]?.focus();
  }

  function alTeclado(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      elegir((activo + 1) % TEMPLATES.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      elegir((activo - 1 + TEMPLATES.length) % TEMPLATES.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      elegir(0);
    } else if (e.key === "End") {
      e.preventDefault();
      elegir(TEMPLATES.length - 1);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {activo + 1} de {TEMPLATES.length}: {TEMPLATES[activo]?.name}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => desplazar(-1)}
            aria-label="Plantilla anterior"
            className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => desplazar(1)}
            aria-label="Plantilla siguiente"
            className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        onScroll={alDesplazar}
        onKeyDown={alTeclado}
        role="radiogroup"
        aria-label="Plantilla"
        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1"
      >
        {TEMPLATES.map((meta, i) => {
          const selected = meta.id === selectedId;
          return (
            <button
              key={meta.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => elegir(i)}
              className={`w-[72%] shrink-0 snap-center rounded-lg border p-1.5 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                selected
                  ? "border-primary ring-1 ring-ring"
                  : "border-border hover:bg-accent"
              }`}
            >
              <TemplateThumbnail templateId={meta.id} tall />
              <span className="mt-1 block truncate text-xs font-medium text-foreground">
                {meta.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Selector visual de plantilla con miniaturas reales. */
export function TemplateThumbnails({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (templateId: string) => void;
}) {
  return (
    <div
      className="mt-1 grid grid-cols-2 gap-2"
      role="radiogroup"
      aria-label="Plantilla"
    >
      {TEMPLATES.map((meta) => {
        const selected = meta.id === selectedId;
        return (
          <button
            key={meta.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(meta.id)}
            className={`rounded-lg border p-1.5 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              selected
                ? "border-primary ring-1 ring-ring"
                : "border-border hover:bg-accent"
            }`}
          >
            <TemplateThumbnail templateId={meta.id} />
            <span className="mt-1 block truncate text-xs font-medium text-foreground">
              {meta.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
