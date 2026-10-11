"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DESIGN_LIMITS,
  HEADING_SIZES,
  type HeadingSize,
  type LayoutId,
  type ResumeDesign,
} from "@/types/resume";
import { createDefaultDesign } from "@/lib/resume";
import { TemplatePicker } from "@/features/templates/TemplatePicker";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-zinc-500" aria-live="polite">
          {value} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
        className="mt-1 w-full accent-zinc-900"
      />
    </div>
  );
}

/**
 * Panel de personalización visual: plantilla, distribución, tipografía,
 * titulares, interlineado y espaciado. Valores cerrados y validados en
 * servidor; vista previa y PDF comparten el mismo renderizador.
 */
export function DesignSidebar({
  design,
  onChange,
}: {
  design: ResumeDesign;
  onChange: (design: ResumeDesign) => void;
}) {
  return (
    <div className="space-y-3">
      <TemplatePicker design={design} onChange={onChange} />

      <div className="rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900">
        <p className="mb-2 text-xs font-medium text-zinc-500">DISTRIBUCIÓN</p>
        <div className="grid gap-1.5" role="radiogroup" aria-label="Distribución">
          {(
            [
              ["single", "Una columna", "Todo el contenido en una sola columna."],
              [
                "two-col",
                "Dos columnas",
                "Competencias e idiomas en el lateral; el resto en la principal.",
              ],
            ] as [LayoutId, string, string][]
          ).map(([id, name, description]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={design.layoutId === id}
                onClick={() => onChange({ ...design, layoutId: id })}
                className={`rounded-md border px-2.5 py-1.5 text-left ${
                  design.layoutId === id
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <span className="block text-sm font-medium">{name}</span>
                <span className="block text-xs text-zinc-500">{description}</span>
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900">
        <p className="text-xs font-medium text-zinc-500">TAMAÑO Y ESPACIADO</p>
        <HeadingSizePicker
          value={design.headingSize}
          onChange={(headingSize) => onChange({ ...design, headingSize })}
        />
        <Slider
          id="design-font-size"
          label="Tamaño del texto"
          value={design.fontSize}
          min={DESIGN_LIMITS.minFontSize}
          max={DESIGN_LIMITS.maxFontSize}
          step={0.5}
          unit="pt"
          onChange={(fontSize) => onChange({ ...design, fontSize })}
        />
        <Slider
          id="design-line-height"
          label="Interlineado"
          value={design.lineHeight}
          min={DESIGN_LIMITS.minLineHeight}
          max={DESIGN_LIMITS.maxLineHeight}
          step={0.05}
          unit="×"
          onChange={(lineHeight) => onChange({ ...design, lineHeight })}
        />
        <Slider
          id="design-page-margin"
          label="Margen de página"
          value={design.pageMargin}
          min={DESIGN_LIMITS.minPageMargin}
          max={DESIGN_LIMITS.maxPageMargin}
          step={1}
          unit="mm"
          onChange={(pageMargin) => onChange({ ...design, pageMargin })}
        />
        <Slider
          id="design-section-spacing"
          label="Separación entre secciones"
          value={design.sectionSpacing}
          min={DESIGN_LIMITS.minSectionSpacing}
          max={DESIGN_LIMITS.maxSectionSpacing}
          step={0.5}
          unit="mm"
          onChange={(sectionSpacing) => onChange({ ...design, sectionSpacing })}
        />
        {design.layoutId === "two-col" && (
          <Slider
            id="design-sidebar-width"
            label="Ancho de la columna lateral"
            value={design.sidebarWidth}
            min={DESIGN_LIMITS.minSidebarWidth}
            max={DESIGN_LIMITS.maxSidebarWidth}
            step={1}
            unit="%"
            onChange={(sidebarWidth) => onChange({ ...design, sidebarWidth })}
          />
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange(
            createDefaultDesign(design.templateId, design.templateVersion),
          )
        }
        title="Volver a los valores iniciales conservando la plantilla"
      >
        <RotateCcw />
        Restablecer diseño
      </Button>
    </div>
  );
}

const HEADING_LABELS: Record<HeadingSize, string> = {
  compact: "Compactos",
  regular: "Normales",
  large: "Grandes",
};

function HeadingSizePicker({
  value,
  onChange,
}: {
  value: HeadingSize;
  onChange: (size: HeadingSize) => void;
}) {
  return (
    <div>
      <span id="design-heading-size-label" className="text-sm font-medium">
        Titulares
      </span>
      <div
        className="mt-1 grid grid-cols-3 gap-1.5"
        role="radiogroup"
        aria-labelledby="design-heading-size-label"
      >
        {HEADING_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={value === size}
            onClick={() => onChange(size)}
            className={`rounded-md border px-2 py-1.5 text-sm ${
              value === size
                ? "border-zinc-900 bg-zinc-50 font-medium"
                : "border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {HEADING_LABELS[size]}
          </button>
        ))}
      </div>
    </div>
  );
}
