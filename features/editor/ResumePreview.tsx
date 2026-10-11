"use client";

import type { CSSProperties } from "react";
import type { ResumeContent, ResumeDesign, ResumeLayout } from "@/types/resume";
import { TemplateRenderer } from "@/features/templates/TemplateRenderer";

/**
 * Vista previa A4 del documento. Usa el MISMO renderizador que el PDF
 * (`TemplateRenderer`); solo añade el cromo de pantalla (ancho A4 y zoom).
 *
 * El zoom escala el contenedor completo de forma uniforme, así que las
 * proporciones se conservan. Incluye el factor del tamaño de fuente para
 * que la vista previa refleje ese ajuste de forma aproximada; el PDF
 * siempre usa medidas de impresión exactas (mm/pt).
 */
export function ResumePreview({
  content,
  design,
  layout,
  zoom,
}: {
  content: ResumeContent;
  design: ResumeDesign;
  layout: ResumeLayout;
  zoom: number;
}) {
  const style = {
    zoom: zoom * (design.fontSize / 11),
  } as CSSProperties;
  return (
    <div className="mx-auto w-full max-w-[210mm]" style={style}>
      <TemplateRenderer content={content} design={design} layout={layout} mode="preview" />
    </div>
  );
}
