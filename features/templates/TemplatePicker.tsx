"use client";

import type { FontFamily, ResumeDesign } from "@/types/resume";
import { FONT_FAMILIES } from "@/types/resume";
import { Label } from "@/components/ui/label";
import { getTemplateMeta, FONT_STACKS } from "./types";
import { TemplateThumbnails } from "./TemplateThumbnails";

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

export function TemplatePicker({
  design,
  onChange,
}: {
  design: ResumeDesign;
  onChange: (design: ResumeDesign) => void;
}) {
  const selected = getTemplateMeta(design.templateId);
  const pickTemplate = (templateId: string) => {
    const meta = getTemplateMeta(templateId);
    onChange({
      ...design,
      templateId: meta.id,
      templateVersion: meta.version,
    });
  };
  return (
    <div className="mb-3 rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      <span id="template-label" className="text-sm font-medium">
        Plantilla
      </span>
      <TemplateThumbnails
        selectedId={design.templateId}
        onSelect={pickTemplate}
      />
      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{selected.description}</p>
      <div className="mt-3">
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
                className={`size-7 rounded-full border border-black/10 dark:border-white/20 ${
                  active
                    ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900"
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
              className="h-7 w-9 cursor-pointer rounded border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900"
              aria-label="Color de acento personalizado"
              title="Personalizado"
            />
            <span
              className="text-xs text-zinc-500 dark:text-zinc-400"
              style={{ fontFamily: FONT_STACKS[design.fontFamily] }}
            >
              {design.accentColor}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="font">Tipografía</Label>
        <select
          id="font"
          value={design.fontFamily}
          onChange={(e) =>
            onChange({ ...design, fontFamily: e.target.value as FontFamily })
          }
          className="mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {FONT_LABELS[f]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
