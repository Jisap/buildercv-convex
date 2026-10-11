"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  LayoutId,
  ResumeLayout,
  ResumeSection,
  SectionType,
} from "@/types/resume";
import { ADD_SECTION_LABEL } from "./sectionFields";

function SectionRow({
  section,
  selected,
  confirmDelete,
  isFirst,
  isLast,
  column,
  showColumnMove,
  onSelect,
  onMove,
  onMoveColumn,
  onToggleVisible,
  onDelete,
}: {
  section: ResumeSection;
  selected: boolean;
  confirmDelete: boolean;
  isFirst: boolean;
  isLast: boolean;
  column: "main" | "sidebar";
  showColumnMove: boolean;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, dir: -1 | 1) => void;
  onMoveColumn: (sectionId: string, column: "main" | "sidebar") => void;
  onToggleVisible: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
}) {
  const other = column === "main" ? "sidebar" : "main";
  return (
    <div
      className={`flex items-center gap-1 rounded-md px-2 py-1.5 ${
        selected ? "bg-zinc-100" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(section.id)}
        className="min-w-0 flex-1 truncate text-left text-sm text-zinc-900"
        aria-current={selected}
      >
        {section.title}
        {section.visible ? "" : " (oculta)"}
      </button>
      <button
        type="button"
        title="Subir"
        aria-label={`Subir ${section.title}`}
        disabled={isFirst}
        onClick={() => onMove(section.id, -1)}
        className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        title="Bajar"
        aria-label={`Bajar ${section.title}`}
        disabled={isLast}
        onClick={() => onMove(section.id, 1)}
        className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
      >
        <ArrowDown className="size-4" />
      </button>
      {showColumnMove &&
        (column === "main" ? (
          <button
            type="button"
            title="Mover a la columna lateral"
            aria-label={`Mover ${section.title} a la columna lateral`}
            onClick={() => onMoveColumn(section.id, other)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200"
          >
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            title="Mover a la columna principal"
            aria-label={`Mover ${section.title} a la columna principal`}
            onClick={() => onMoveColumn(section.id, other)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200"
          >
            <ArrowLeft className="size-4" />
          </button>
        ))}
      <button
        type="button"
        title={section.visible ? "Ocultar" : "Mostrar"}
        aria-label={`${section.visible ? "Ocultar" : "Mostrar"} ${section.title}`}
        aria-pressed={section.visible}
        onClick={() => onToggleVisible(section.id)}
        className="rounded p-1 text-zinc-500 hover:bg-zinc-200"
      >
        {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
      <button
        type="button"
        title={
          confirmDelete ? "Pulsa de nuevo para confirmar" : "Eliminar sección"
        }
        aria-label={`Eliminar ${section.title}`}
        onClick={() => onDelete(section.id)}
        className={`rounded p-1 hover:bg-red-100 hover:text-red-700 ${
          confirmDelete ? "bg-red-100 text-red-700" : "text-zinc-500"
        }`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

/**
 * Lista de secciones agrupada por columna del layout. En una columna se
 * muestra plana; en dos, con grupos Principal/Lateral y botones para
 * trasladar secciones entre columnas (alternativa sin arrastre, que será
 * el fallback accesible de la fase F2 con dnd-kit).
 */
export function ContentSidebar({
  sections,
  layout,
  layoutId,
  selectedId,
  confirmSectionId,
  onSelect,
  onMove,
  onMoveColumn,
  onToggleVisible,
  onDelete,
  onAdd,
}: {
  sections: ResumeSection[];
  /** Layout ya sanado frente a `sections`. */
  layout: ResumeLayout;
  layoutId: LayoutId;
  selectedId: string | null;
  confirmSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, dir: -1 | 1) => void;
  onMoveColumn: (sectionId: string, column: "main" | "sidebar") => void;
  onToggleVisible: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onAdd: (type: SectionType) => void;
}) {
  const byId = new Map(sections.map((s) => [s.id, s]));
  const inColumn = (ids: string[]): ResumeSection[] =>
    ids
      .map((id) => byId.get(id))
      .filter((s): s is ResumeSection => s !== undefined);
  const row = (
    section: ResumeSection,
    index: number,
    total: number,
    column: "main" | "sidebar",
  ) => (
    <li key={section.id}>
      <SectionRow
        section={section}
        selected={section.id === selectedId}
        confirmDelete={confirmSectionId === section.id}
        isFirst={index === 0}
        isLast={index === total - 1}
        column={column}
        showColumnMove={layoutId === "two-col"}
        onSelect={onSelect}
        onMove={onMove}
        onMoveColumn={onMoveColumn}
        onToggleVisible={onToggleVisible}
        onDelete={onDelete}
      />
    </li>
  );

  return (
    <div>
      {layoutId === "two-col" ? (
        <div className="space-y-3">
          {(
            [
              ["main", "Columna principal", layout.main],
              ["sidebar", "Columna lateral", layout.sidebar],
            ] as const
          ).map(([column, label, ids]) => {
            const list = inColumn(ids);
            return (
              <div key={column}>
                <p className="mb-1 text-xs font-medium text-zinc-500">{label}</p>
                {list.length === 0 ? (
                  <p className="rounded-md border border-dashed border-zinc-200 px-2 py-1.5 text-xs text-zinc-400">
                    Vacía: traslada aquí una sección con →.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {list.map((s, i) => row(s, i, list.length, column))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-1">
          {inColumn([...layout.main, ...layout.sidebar]).map((s, i, list) =>
            row(s, i, list.length, "main"),
          )}
        </ul>
      )}
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
