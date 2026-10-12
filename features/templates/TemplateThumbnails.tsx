"use client";

import { memo, useMemo } from "react";
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
}: {
  templateId: string;
}) {
  const design = useMemo(() => {
    const meta = getTemplateMeta(templateId);
    return createDefaultDesign(meta.id, meta.version);
  }, [templateId]);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex h-24 justify-center overflow-hidden rounded-md border border-border bg-white select-none"
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
