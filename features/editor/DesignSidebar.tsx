"use client";

import {
  ChevronDown,
  Columns2,
  RectangleVertical,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  DESIGN_LIMITS,
  HEADING_SIZES,
  type HeadingSize,
  type LayoutId,
  type ResumeDesign,
} from "@/types/resume";
import { createDefaultDesign } from "@/lib/resume";
import {
  ColorTipografia,
  SelectorPlantilla,
} from "@/features/templates/TemplatePicker";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Sección plegable del panel (E1). El estado vive en memoria mientras se
 * edita; no se persiste en localStorage.
 */
function SeccionDiseno({
  id,
  titulo,
  abierta,
  alCambiar,
  children,
}: {
  id: string;
  titulo: string;
  abierta: boolean;
  alCambiar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground">
      <h3>
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={`${id}-panel`}
          id={`${id}-boton`}
          onClick={alCambiar}
          className="flex w-full items-center justify-between gap-2 rounded-xl p-3 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {titulo.toUpperCase()}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              abierta && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h3>
      {abierta && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-boton`}
          className="px-3 pb-3"
        >
          {children}
        </div>
      )}
    </div>
  );
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
  // Texto local solo mientras se edita el numérico: permite borrar y
  // escribir sin saltos; al salir se resincroniza con el valor real.
  const [enfocado, setEnfocado] = useState(false);
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
          className="w-full min-w-0 flex-1 accent-primary"
        />
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={enfocado && texto !== null ? texto : String(value)}
          aria-label={`${label} (valor numérico)`}
          onFocus={() => {
            setEnfocado(true);
            setTexto(String(value));
          }}
          onChange={(e) => {
            const crudo = e.target.value;
            setTexto(crudo);
            const n = Number(crudo);
            if (crudo.trim() !== "" && !Number.isNaN(n)) {
              onChange(clamp(n, min, max));
            }
          }}
          onBlur={() => {
            setEnfocado(false);
            setTexto(null);
          }}
          className="h-8 w-[4.5rem] shrink-0 px-2 text-right tabular-nums"
        />
        <span
          aria-hidden="true"
          className="w-6 shrink-0 text-xs text-muted-foreground"
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

const DISTRIBUCIONES: {
  id: LayoutId;
  nombre: string;
  descripcion: string;
  Icon: typeof Columns2;
}[] = [
  {
    id: "single",
    nombre: "Una columna",
    descripcion: "Todo el contenido seguido.",
    Icon: RectangleVertical,
  },
  {
    id: "two-col",
    nombre: "Dos columnas",
    descripcion: "Lateral para competencias e idiomas.",
    Icon: Columns2,
  },
];

/**
 * Panel de personalización visual: plantilla, color y tipografía,
 * distribución, tamaño y espaciado. Valores cerrados y validados en
 * servidor; vista previa y PDF comparten el mismo renderizador.
 */
export function DesignSidebar({
  design,
  onChange,
}: {
  design: ResumeDesign;
  onChange: (design: ResumeDesign) => void;
}) {
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(
    () => new Set(["plantilla", "color", "distribucion", "medidas"]),
  );
  const alternar = (id: string) =>
    setAbiertas((previas) => {
      const siguientes = new Set(previas);
      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }
      return siguientes;
    });

  // E4: restablecer con «Deshacer» (conserva la plantilla).
  const restablecer = () => {
    const previo = design;
    onChange(createDefaultDesign(design.templateId, design.templateVersion));
    toast({
      titulo: "Diseño restablecido.",
      descripcion: "Se conservó la plantilla.",
      accion: {
        etiqueta: "Deshacer",
        alPulsar: () => onChange(previo),
      },
    });
  };

  return (
    <div className="space-y-3">
      <SeccionDiseno
        id="diseno-plantilla"
        titulo="Plantilla"
        abierta={abiertas.has("plantilla")}
        alCambiar={() => alternar("plantilla")}
      >
        <SelectorPlantilla design={design} onChange={onChange} />
      </SeccionDiseno>

      <SeccionDiseno
        id="diseno-color"
        titulo="Color y tipografía"
        abierta={abiertas.has("color")}
        alCambiar={() => alternar("color")}
      >
        <ColorTipografia design={design} onChange={onChange} />
      </SeccionDiseno>

      <SeccionDiseno
        id="diseno-distribucion"
        titulo="Distribución"
        abierta={abiertas.has("distribucion")}
        alCambiar={() => alternar("distribucion")}
      >
        <div
          className="grid grid-cols-2 gap-1.5"
          role="radiogroup"
          aria-label="Distribución"
        >
          {DISTRIBUCIONES.map(({ id, nombre, descripcion, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={design.layoutId === id}
              onClick={() => onChange({ ...design, layoutId: id })}
              className={`rounded-md border p-2.5 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                design.layoutId === id
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-accent/60"
              }`}
            >
              <Icon
                className="size-6 text-muted-foreground"
                aria-hidden
              />
              <span className="mt-1.5 block text-sm font-medium">
                {nombre}
              </span>
              <span className="block text-xs text-muted-foreground">
                {descripcion}
              </span>
            </button>
          ))}
        </div>
      </SeccionDiseno>

      <SeccionDiseno
        id="diseno-medidas"
        titulo="Tamaño y espaciado"
        abierta={abiertas.has("medidas")}
        alCambiar={() => alternar("medidas")}
      >
        <div className="grid gap-3">
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
            onChange={(sectionSpacing) =>
              onChange({ ...design, sectionSpacing })
            }
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
              onChange={(sidebarWidth) =>
                onChange({ ...design, sidebarWidth })
              }
            />
          )}
        </div>
      </SeccionDiseno>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={restablecer}
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
            className={`rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              value === size
                ? "border-primary bg-accent font-medium"
                : "border-border hover:bg-accent/60"
            }`}
          >
            {HEADING_LABELS[size]}
          </button>
        ))}
      </div>
    </div>
  );
}
