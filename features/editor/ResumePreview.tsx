"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { ResumeContent, ResumeDesign, ResumeLayout } from "@/types/resume";
import { TemplateRenderer } from "@/features/templates/TemplateRenderer";

/** Ancho de una página A4 en píxeles CSS (210 mm a 96 ppp). */
const A4_WIDTH_PX = (210 * 96) / 25.4;

/**
 * Vista previa A4 del documento. Usa el MISMO renderizador que el PDF
 * (`TemplateRenderer`); solo añade el cromo de pantalla (ancho A4 y zoom).
 *
 * La hoja se auto-ajusta al ancho disponible (móvil, pantallas medianas y
 * escritorio) con un escalado uniforme: proporciones y estructura
 * idénticas al documento, sin scroll horizontal. El zoom del usuario y el
 * factor del tamaño de fuente multiplican sobre ese ajuste; el PDF siempre
 * usa medidas de impresión exactas (mm/pt).
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }
    const update = () => {
      const width = node.clientWidth;
      // Nunca amplía más del tamaño natural: solo encoge si no cabe.
      if (width > 0) {
        setFit(Math.min(1, width / A4_WIDTH_PX));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style = {
    zoom: fit * zoom * (design.fontSize / 11),
  } as CSSProperties;
  return (
    <div ref={containerRef} className="w-full">
      <div className="mx-auto w-full max-w-[210mm]" style={style}>
        <TemplateRenderer content={content} design={design} layout={layout} mode="preview" />
      </div>
    </div>
  );
}
