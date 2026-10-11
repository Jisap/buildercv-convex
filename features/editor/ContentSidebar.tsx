"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeSection, SectionType } from "@/types/resume";
import { ADD_SECTION_LABEL } from "./sectionFields";

export function ContentSidebar({
  sections,
  selectedId,
  confirmSectionId,
  onSelect,
  onMove,
  onToggleVisible,
  onDelete,
  onAdd,
}: {
  /** Secciones ya ordenadas por `order`. */
  sections: ResumeSection[];
  selectedId: string | null;
  confirmSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, dir: -1 | 1) => void;
  onToggleVisible: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onAdd: (type: SectionType) => void;
}) {
  return (
    <div>
      <ul className="space-y-1">
        {sections.map((s, index) => (
          <li key={s.id}>
            <div
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 ${
                s.id === selectedId ? "bg-zinc-100" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className="min-w-0 flex-1 truncate text-left text-sm text-zinc-900"
                aria-current={s.id === selectedId}
              >
                {s.title}
                {s.visible ? "" : " (oculta)"}
              </button>
              <button
                type="button"
                title="Subir"
                aria-label={`Subir ${s.title}`}
                disabled={index === 0}
                onClick={() => onMove(s.id, -1)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                title="Bajar"
                aria-label={`Bajar ${s.title}`}
                disabled={index === sections.length - 1}
                onClick={() => onMove(s.id, 1)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                title={s.visible ? "Ocultar" : "Mostrar"}
                aria-label={`${s.visible ? "Ocultar" : "Mostrar"} ${s.title}`}
                aria-pressed={s.visible}
                onClick={() => onToggleVisible(s.id)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200"
              >
                {s.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <button
                type="button"
                title={
                  confirmSectionId === s.id
                    ? "Pulsa de nuevo para confirmar"
                    : "Eliminar sección"
                }
                aria-label={`Eliminar ${s.title}`}
                onClick={() => onDelete(s.id)}
                className={`rounded p-1 hover:bg-red-100 hover:text-red-700 ${
                  confirmSectionId === s.id
                    ? "bg-red-100 text-red-700"
                    : "text-zinc-500"
                }`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-zinc-200 pt-3">
        <p className="mb-2 text-xs font-medium text-zinc-500">AÑADIR SECCIÓN</p>
        <div className="flex flex-wrap gap-1.5">
          {ADD_SECTION_LABEL.map(({ type, label }) => (
            <Button
              key={type}
              size="sm"
              variant="outline"
              onClick={() => onAdd(type)}
            >
              <Plus />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
