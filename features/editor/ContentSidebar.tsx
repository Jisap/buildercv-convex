"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ComponentProps } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
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

type Column = "main" | "sidebar";

function SortableRow({
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
  column: Column | "combined";
  showColumnMove: boolean;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, dir: -1 | 1) => void;
  onMoveColumn: (sectionId: string, column: Column) => void;
  onToggleVisible: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });
  const other: Column = column === "sidebar" ? "main" : "sidebar";
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={isDragging ? "relative z-10 opacity-60" : undefined}
    >
      <div
        className={`flex items-center gap-1 rounded-md px-2 py-1.5 ${
          selected ? "bg-zinc-100" : "bg-white"
        }`}
      >
        <button
          type="button"
          title={`Arrastrar ${section.title} (o usa las flechas)`}
          aria-label={`Arrastrar ${section.title}`}
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
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
    </li>
  );
}

function ColumnGroup({
  column,
  label,
  ids,
  byId,
  emptyHint,
  rowProps,
}: {
  column: Column | "combined";
  label: string | null;
  ids: string[];
  byId: Map<string, ResumeSection>;
  emptyHint: string | null;
  rowProps: Omit<
    ComponentProps<typeof SortableRow>,
    "section" | "isFirst" | "isLast" | "column" | "selected" | "confirmDelete"
  > & { selectedId: string | null; confirmSectionId: string | null };
}) {
  // Zona de soltado para la columna (imprescindible cuando está vacía).
  const { setNodeRef } = useDroppable({
    id: `column:${column}`,
    data: { column },
  });
  const list = ids
    .map((id) => byId.get(id))
    .filter((s): s is ResumeSection => s !== undefined);
  const { selectedId, confirmSectionId, ...rest } = rowProps;
  return (
    <div>
      {label && (
        <p className="mb-1 text-xs font-medium text-zinc-500">{label}</p>
      )}
      <div ref={setNodeRef}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {list.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-200 px-2 py-1.5 text-xs text-zinc-400">
              {emptyHint}
            </p>
          ) : (
            <ul className="space-y-1">
              {list.map((s, i) => (
                <SortableRow
                  key={s.id}
                  section={s}
                  selected={s.id === selectedId}
                  confirmDelete={confirmSectionId === s.id}
                  isFirst={i === 0}
                  isLast={i === list.length - 1}
                  column={column}
                  {...rest}
                />
              ))}
            </ul>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

/**
 * Lista de secciones agrupada por columna del layout, reordenable por
 * arrastre (dnd-kit) con las flechas como alternativa accesible.
 * En una columna se muestra plana; en dos, con grupos Principal/Lateral
 * y soltado entre columnas. La vista previa sigue siendo de solo lectura:
 * el arrastre vive solo aquí para no comprometer la fidelidad del PDF.
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
  onLayoutChange,
}: {
  sections: ResumeSection[];
  /** Layout ya sanado frente a `sections`. */
  layout: ResumeLayout;
  layoutId: LayoutId;
  selectedId: string | null;
  confirmSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, dir: -1 | 1) => void;
  onMoveColumn: (sectionId: string, column: Column) => void;
  onToggleVisible: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onAdd: (type: SectionType) => void;
  /** Nuevo layout tras un drop (el shell lo sana y sincroniza). */
  onLayoutChange: (next: ResumeLayout) => void;
}) {
  // Ratón con distancia (clics normales intactos), táctil con retardo
  // (no roba el scroll), teclado con coordenadas ordenables.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byId = new Map(sections.map((s) => [s.id, s]));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    if (layoutId !== "two-col") {
      // Lista plana: se reordena el combinado y se reparte conservando
      // el tamaño de cada columna (la pertenencia no cambia en 1 columna).
      const combined = [...layout.main, ...layout.sidebar];
      const from = combined.indexOf(activeId);
      const to = overId.startsWith("column:")
        ? combined.length - 1
        : combined.indexOf(overId);
      if (from === -1 || to === -1) {
        return;
      }
      const next = [...combined];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      onLayoutChange({
        main: next.slice(0, layout.main.length),
        sidebar: next.slice(layout.main.length),
      });
      return;
    }
    const overColumn: Column | null = layout.main.includes(overId)
      ? "main"
      : layout.sidebar.includes(overId)
        ? "sidebar"
        : null;
    if (overId.startsWith("column:")) {
      const column = overId.replace("column:", "") as Column;
      if (column !== "main" && column !== "sidebar") {
        return;
      }
      const ids = layout[column].filter((id) => id !== activeId);
      onLayoutChange({
        ...layout,
        [column]: [...ids, activeId],
      });
      return;
    }
    if (overColumn === null) {
      return;
    }
    const column = overColumn;
    const ids = layout[column].filter((id) => id !== activeId);
    const rawIndex = layout[column].indexOf(overId);
    const at = Math.max(0, Math.min(rawIndex, ids.length));
    onLayoutChange({
      main:
        column === "main"
          ? [...ids.slice(0, at), activeId, ...ids.slice(at)]
          : layout.main.filter((id) => id !== activeId),
      sidebar:
        column === "sidebar"
          ? [...ids.slice(0, at), activeId, ...ids.slice(at)]
          : layout.sidebar.filter((id) => id !== activeId),
    });
  }

  const rowProps = {
    selectedId,
    confirmSectionId,
    showColumnMove: layoutId === "two-col",
    onSelect,
    onMove,
    onMoveColumn,
    onToggleVisible,
    onDelete,
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {layoutId === "two-col" ? (
          <div className="space-y-3">
            <ColumnGroup
              column="main"
              label="Columna principal"
              ids={layout.main}
              byId={byId}
              emptyHint="Vacía: arrastra aquí una sección o usa →."
              rowProps={rowProps}
            />
            <ColumnGroup
              column="sidebar"
              label="Columna lateral"
              ids={layout.sidebar}
              byId={byId}
              emptyHint="Vacía: arrastra aquí una sección o usa ←."
              rowProps={rowProps}
            />
          </div>
        ) : (
          <ColumnGroup
            column="combined"
            label={null}
            ids={[...layout.main, ...layout.sidebar]}
            byId={byId}
            emptyHint={null}
            rowProps={rowProps}
          />
        )}
      </DndContext>
      <p className="mt-2 text-xs text-zinc-400">
        Arrastra desde el asa para reordenar. Con teclado: enfoca el asa,
        pulsa Espacio y mueve con las flechas.
      </p>
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
