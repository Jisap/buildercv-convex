"use client";

import type { FontFamily, ResumeDesign } from "@/types/resume";
import { FONT_FAMILIES } from "@/types/resume";
import { Label } from "@/components/ui/label";
import { getTemplateMeta, FONT_STACKS, TEMPLATES } from "./types";

const FONT_LABELS: Record<FontFamily, string> = {
  inter: "Inter (moderna)",
  georgia: "Georgia (serif)",
  system: "Sistema",
};

export function TemplatePicker({
  design,
  onChange,
}: {
  design: ResumeDesign;
  onChange: (design: ResumeDesign) => void;
}) {
  const selected = getTemplateMeta(design.templateId);
  return (
    <div className="mb-3 rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900">
      <Label htmlFor="template">Plantilla</Label>
      <select
        id="template"
        value={design.templateId}
        onChange={(e) => {
          const meta = getTemplateMeta(e.target.value);
          onChange({ ...design, templateId: meta.id, templateVersion: meta.version });
        }}
        className="mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
      >
        {TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-xs text-zinc-500">{selected.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="accent">Acento</Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="accent"
              type="color"
              value={design.accentColor}
              onChange={(e) => onChange({ ...design, accentColor: e.target.value })}
              className="h-9 w-10 cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
              aria-label="Color de acento"
            />
            <span className="text-xs text-zinc-500" style={{ fontFamily: FONT_STACKS[design.fontFamily] }}>
              {design.accentColor}
            </span>
          </div>
        </div>
        <div>
          <Label htmlFor="font">Tipografía</Label>
          <select
            id="font"
            value={design.fontFamily}
            onChange={(e) =>
              onChange({ ...design, fontFamily: e.target.value as FontFamily })
            }
            className="mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {FONT_LABELS[f]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
