"use client";

import type { FontFamily, ResumeDesign } from "@/types/resume";
import { FONT_FAMILIES } from "@/types/resume";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getTemplateMeta, FONT_STACKS } from "./types";
import { TemplateCarousel } from "./TemplateThumbnails";

const FONT_LABELS: Record<FontFamily, string> = {
  inter: "Inter (moderna)",
  georgia: "Georgia (serif)",
  system: "Sistema",
  arial: "Arial (universal)",
  calibri: "Calibri (ofimática)",
  verdana: "Verdana (legible)",
};

/** Acentos curados: un clic sin tener que afinar el selector de color. */
const ACCENT_PRESETS: { hex: string; name: string }[] = [
  { hex: "#1d4ed8", name: "Azul" },
  { hex: "#0f766e", name: "Verde azulado" },
  { hex: "#166534", name: "Verde" },
  { hex: "#7e22ce", name: "Púrpura" },
  { hex: "#991b1b", name: "Granate" },
  { hex: "#c2410c", name: "Naranja" },
  { hex: "#be185d", name: "Rosa" },
  { hex: "#334155", name: "Pizarra" },
];

/** Miniaturas de plantilla + descripción (sección «Plantilla»). */
export function SelectorPlantilla({
  design,
  onChange,
}: {
  design: ResumeDesign;
  onChange: (design: ResumeDesign) => void;
}) {
  const selected = getTemplateMeta(design.templateId);
  return (
    <div>
      <span id="template-label" className="text-sm font-medium">
        Plantilla
      </span>
      <TemplateCarousel
        selectedId={design.templateId}
        onSelect={(templateId) => {
          const meta = getTemplateMeta(templateId);
          onChange({
            ...design,
            templateId: meta.id,
            templateVersion: meta.version,
          });
        }}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {selected.description}
      </p>
    </div>
  );
}

/** Acento y tipografía (sección «Color y tipografía»). */
export function ColorTipografia({
  design,
  onChange,
}: {
  design: ResumeDesign;
  onChange: (design: ResumeDesign) => void;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <span id="accent-label" className="text-sm font-medium">
          Acento
        </span>
        <div
          className="mt-1.5 flex flex-wrap items-center gap-1.5"
          role="group"
          aria-labelledby="accent-label"
        >
          {ACCENT_PRESETS.map((preset) => {
            const active =
              design.accentColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                title={preset.name}
                aria-label={`Acento ${preset.name}`}
                aria-pressed={active}
                onClick={() =>
                  onChange({ ...design, accentColor: preset.hex })
                }
                style={{ backgroundColor: preset.hex }}
                className={`size-7 rounded-full border border-black/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-white/20 ${
                  active
                    ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                    : "hover:scale-110"
                }`}
              />
            );
          })}
          <div className="flex items-center gap-1.5">
            <input
              id="accent"
              type="color"
              value={design.accentColor}
              onChange={(e) =>
                onChange({ ...design, accentColor: e.target.value })
              }
              className="h-7 w-9 cursor-pointer rounded border border-input bg-background p-0.5"
              aria-label="Color de acento personalizado"
              title="Personalizado"
            />
            <span
              className="text-xs text-muted-foreground"
              style={{ fontFamily: FONT_STACKS[design.fontFamily] }}
            >
              {design.accentColor}
            </span>
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="font">Tipografía</Label>
        <Select
          id="font"
          value={design.fontFamily}
          onChange={(e) =>
            onChange({ ...design, fontFamily: e.target.value as FontFamily })
          }
          className="mt-1"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {FONT_LABELS[f]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
