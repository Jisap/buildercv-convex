"use client";

import type { FontFamily, ResumeDesign } from "@/types/resume";
import { FONT_FAMILIES } from "@/types/resume";
import { Label } from "@/components/ui/label";
import { FONT_STACKS, TEMPLATES } from "./types";

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
  return (
    <div className="mb-3 rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900">
      <p className="mb-2 text-xs font-medium text-zinc-500">PLANTILLA</p>
      <div className="grid gap-1.5" role="radiogroup" aria-label="Plantilla">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={design.templateId === t.id}
            onClick={() =>
              onChange({ ...design, templateId: t.id, templateVersion: t.version })
            }
            className={`rounded-md border px-2.5 py-1.5 text-left ${
              design.templateId === t.id
                ? "border-zinc-900 bg-zinc-50"
                : "border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <span className="block text-sm font-medium">{t.name}</span>
            <span className="block text-xs text-zinc-500">{t.description}</span>
          </button>
        ))}
      </div>
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
