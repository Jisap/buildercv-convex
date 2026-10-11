"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
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
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResumeContent, ResumeSection } from "@/types/resume";
import { moveItemToIndex, newId } from "@/lib/resume";
import { matchesFilter, summarizeItem } from "./sectionFields";
import {
  ADD_ITEM_LABEL,
  ITEM_FIELDS,
  type ItemFieldSpec,
} from "./sectionFields";

type ItemPatchValue =
  | string
  | number
  | boolean
  | string[]
  | { id: string; label?: string; url?: string }[]
  | undefined;

/** Elemento de sección con forma mínima para la tarjeta ordenable. */
type ItemRecord = { id: string } & Record<string, unknown>;

interface SectionFormProps {
  section: ResumeSection;
  issues: z.ZodIssue[];
  onPatch: (patch: { title?: string; visible?: boolean }) => void;
  onChangeContent: React.Dispatch<
    React.SetStateAction<ResumeContent | null>
  >;
}

function fieldError(issues: z.ZodIssue[], itemIndex: number, key: string) {
  const hit = issues.find(
    (issue) =>
      issue.path.length === 3 &&
      issue.path[0] === "items" &&
      issue.path[1] === itemIndex &&
      issue.path[2] === key,
  );
  return hit?.message ?? null;
}

/** Si algún campo del elemento tiene error (para marcar la fila compacta). */
function itemHasError(issues: z.ZodIssue[], itemIndex: number) {
  return issues.some(
    (issue) =>
      issue.path.length === 3 &&
      issue.path[0] === "items" &&
      issue.path[1] === itemIndex,
  );
}

function readValue(item: Record<string, unknown>, spec: ItemFieldSpec) {
  const raw = item[spec.key];
  if (spec.type === "checkbox") {
    return raw === true;
  }
  if (spec.type === "number") {
    return typeof raw === "number" ? raw : "";
  }
  if (spec.key === "technologies" && Array.isArray(raw)) {
    return raw.join(", ");
  }
  return typeof raw === "string" ? raw : "";
}

export function SectionForm({
  section,
  issues,
  onPatch,
  onChangeContent,
}: SectionFormProps) {
  const specs = ITEM_FIELDS[section.type];

  // Filas compactas: colapsadas por defecto, salvo secciones de un solo
  // elemento (datos personales, perfil) que siguen expandidas como antes.
  // El formulario se monta con `key` por sección, así que este estado
  // nace de cada sección y no necesita sincronizarse.
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        section.items.length <= 1
          ? section.items.map((item) => item.id)
          : [],
      ),
  );

  const toggleExpand = (itemId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(section.items.map((item) => item.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Filtro por texto del resumen (tildes y mayúsculas aparte). Con pocos
  // elementos no compensa: el campo aparece a partir de 5.
  const [filter, setFilter] = useState("");
  const summaries = new Map(
    section.items.map((item) => [
      item.id,
      summarizeItem(section.type, item as unknown as Record<string, unknown>),
    ]),
  );
  const visibleItems = section.items.filter((item) =>
    matchesFilter(summaries.get(item.id) ?? "", filter),
  );

  const updateItem = (itemId: string, key: string, value: ItemPatchValue) => {
    onChangeContent((current) => {
      if (!current) {
        return current;
      }
      return {
        sections: current.sections.map((s) => {
          if (s.id !== section.id) {
            return s;
          }
          // Cast contenido: los parches son JSON válido y se verifican con
          // Zod al guardar; los tipos literales no admiten spread genérico.
          return {
            ...s,
            items: (s.items as unknown as Record<string, unknown>[]).map((item) =>
              item.id === itemId ? { ...item, [key]: value } : item,
            ),
          } as unknown as ResumeSection;
        }),
      };
    });
  };

  const addItem = () => {
    // El elemento nuevo nace expandido para rellenarlo al momento; si hay
    // un filtro activo se limpia para que no quede oculto tras crearlo.
    const id = newId();
    setExpandedIds((prev) => new Set(prev).add(id));
    setFilter("");
    onChangeContent((current) => {
      if (!current) {
        return current;
      }
      return {
        sections: current.sections.map((s) => {
          if (s.id !== section.id) {
            return s;
          }
          const base = { id };
          const item =
            s.type === "projects"
              ? { ...base, technologies: [] as string[] }
              : s.type === "personal"
                ? { ...base, links: [] as { id: string }[] }
                : base;
          return { ...s, items: [...s.items, item] } as unknown as ResumeSection;
        }),
      };
    });
  };

  const deleteItem = (itemId: string) => {
    onChangeContent((current) => {
      if (!current) {
        return current;
      }
      return {
        sections: current.sections.map((s) => {
          if (s.id !== section.id) {
            return s;
          }
          return {
            ...s,
            items: s.items.filter((item) => item.id !== itemId),
          } as unknown as ResumeSection;
        }),
      };
    });
  };

  const reorderItems = (itemId: string, index: number) => {
    onChangeContent((current) => {
      if (!current) {
        return current;
      }
      return {
        sections: current.sections.map((s) =>
          s.id === section.id ? moveItemToIndex(s, itemId, index) : s,
        ),
      };
    });
  };

  const moveItem = (itemId: string, dir: -1 | 1) => {
    const index = section.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      return;
    }
    reorderItems(itemId, index + dir);
  };

  // Mismos sensores que el sidebar (F2): ratón con distancia, táctil con
  // retardo para no robar el scroll del formulario, teclado ordenable.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    const to = section.items.findIndex((item) => item.id === overId);
    if (to === -1) {
      return;
    }
    reorderItems(activeId, to);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900">
      <div className="grid gap-3">
        <div>
          <Label htmlFor={`section-title-${section.id}`}>Título de la sección</Label>
          <Input
            id={`section-title-${section.id}`}
            value={section.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            maxLength={200}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.visible}
            onChange={(e) => onPatch({ visible: e.target.checked })}
            className="size-4 accent-zinc-900"
          />
          Visible en el documento
        </label>
      </div>

      <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
        {section.items.length > 1 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500" aria-live="polite">
              {filter.trim() === ""
                ? `${section.items.length} elementos`
                : `${visibleItems.length} de ${section.items.length}`}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={expandAll}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                Expandir todas
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                Contraer todas
              </button>
            </div>
          </div>
        )}
        {section.items.length > 4 && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar elementos…"
              aria-label="Filtrar elementos de la sección"
              maxLength={100}
              className="pr-8 pl-8"
            />
            {filter !== "" && (
              <button
                type="button"
                onClick={() => setFilter("")}
                title="Limpiar filtro"
                aria-label="Limpiar filtro"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleItems.map((item) => {
              const itemIndex = section.items.findIndex((s) => s.id === item.id);
              return (
                <SortableItemCard
                  key={item.id}
                  item={item as unknown as ItemRecord}
                  itemIndex={itemIndex}
                  total={section.items.length}
                  sectionId={section.id}
                  summary={summaries.get(item.id) ?? ""}
                  expanded={expandedIds.has(item.id)}
                  hasError={itemHasError(issues, itemIndex)}
                  specs={specs}
                  issues={issues}
                  onToggleExpand={toggleExpand}
                  onUpdateItem={updateItem}
                  onMoveItem={moveItem}
                  onDeleteItem={deleteItem}
                />
              );
            })}
          </SortableContext>
        </DndContext>
        {visibleItems.length === 0 && (
          <p className="rounded-md border border-dashed border-zinc-200 px-2 py-3 text-center text-sm text-zinc-500">
            Sin coincidencias para «{filter.trim()}».
          </p>
        )}
        {visibleItems.length > 1 && (
          <p className="text-xs text-zinc-400">
            Arrastra desde el asa para reordenar. Con teclado: enfoca el asa,
            pulsa Espacio y mueve con las flechas.
          </p>
        )}
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus />
          {ADD_ITEM_LABEL[section.type]}
        </Button>
        {section.type === "personal" && section.items[0] && (
          <PersonalLinksEditor
            links={(section.items[0] as { links?: { id: string; label?: string; url?: string }[] })
              ?.links ?? []}
            onChange={(links) => {
              updateItem(section.items[0].id, "links", links);
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Fila compacta de elemento, reordenable por arrastre (dnd-kit) con las
 * flechas como alternativa accesible. Colapsada muestra el resumen;
 * expandida, los campos. El asa es el único punto de arrastre.
 */
function SortableItemCard({
  item,
  itemIndex,
  total,
  sectionId,
  summary,
  expanded,
  hasError,
  specs,
  issues,
  onToggleExpand,
  onUpdateItem,
  onMoveItem,
  onDeleteItem,
}: {
  item: ItemRecord;
  itemIndex: number;
  total: number;
  sectionId: string;
  summary: string;
  expanded: boolean;
  hasError: boolean;
  specs: ItemFieldSpec[];
  issues: z.ZodIssue[];
  onToggleExpand: (itemId: string) => void;
  onUpdateItem: (itemId: string, key: string, value: ItemPatchValue) => void;
  onMoveItem: (itemId: string, dir: -1 | 1) => void;
  onDeleteItem: (itemId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const fieldsId = `${sectionId}-${item.id}-fields`;
  const ExpandIcon = expanded ? ChevronDown : ChevronRight;
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      aria-label={`Elemento ${itemIndex + 1}${summary ? `: ${summary}` : ""}`}
      className={`rounded-lg border bg-white p-2.5 ${
        hasError && !expanded
          ? "border-red-300"
          : "border-zinc-200"
      } ${isDragging ? "relative z-10 opacity-60" : ""}`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          title={`Arrastrar elemento ${itemIndex + 1} (o usa las flechas)`}
          aria-label={`Arrastrar elemento ${itemIndex + 1}`}
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 active:cursor-grabbing"
        >
          <GripVertical className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => onToggleExpand(item.id)}
          aria-expanded={expanded}
          aria-controls={fieldsId}
          title={expanded ? "Contraer" : "Expandir para editar"}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-1.5 text-left hover:bg-zinc-50"
        >
          <ExpandIcon className="size-4 shrink-0 text-zinc-400" />
          {summary ? (
            <span className="truncate text-sm font-medium text-zinc-900">
              {summary}
            </span>
          ) : (
            <span className="truncate text-sm text-zinc-400">
              Elemento {itemIndex + 1} · sin contenido
            </span>
          )}
          {hasError && !expanded && (
            <span title="Tiene campos con errores" className="shrink-0">
              <AlertCircle className="size-4 text-red-500" />
            </span>
          )}
        </button>
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            title="Subir"
            aria-label="Subir elemento"
            disabled={itemIndex === 0}
            onClick={() => onMoveItem(item.id, -1)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            title="Bajar"
            aria-label="Bajar elemento"
            disabled={itemIndex === total - 1}
            onClick={() => onMoveItem(item.id, 1)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            title="Eliminar elemento"
            aria-label="Eliminar elemento"
            onClick={() => onDeleteItem(item.id)}
            className="rounded p-1 text-zinc-500 hover:bg-red-100 hover:text-red-700"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div id={fieldsId} className="mt-2 border-t border-zinc-100 pt-3">
          <ItemFields
            item={item}
            itemIndex={itemIndex}
            sectionId={sectionId}
            specs={specs}
            issues={issues}
            onUpdateItem={onUpdateItem}
          />
        </div>
      )}
    </article>
  );
}

function ItemFields({
  item,
  itemIndex,
  sectionId,
  specs,
  issues,
  onUpdateItem,
}: {
  item: ItemRecord;
  itemIndex: number;
  sectionId: string;
  specs: ItemFieldSpec[];
  issues: z.ZodIssue[];
  onUpdateItem: (itemId: string, key: string, value: ItemPatchValue) => void;
}) {
  return (
    <div className="grid gap-3">
      {specs.map((spec) => {
        const fieldId = `${sectionId}-${item.id}-${spec.key}`;
        const error = fieldError(issues, itemIndex, spec.key);
        if (spec.type === "checkbox") {
          return (
            <label key={spec.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={readValue(item, spec) as boolean}
                onChange={(e) =>
                  onUpdateItem(item.id, spec.key, e.target.checked)
                }
                className="size-4 accent-zinc-900"
              />
              {spec.label}
            </label>
          );
        }
        if (spec.type === "textarea") {
          return (
            <div key={spec.key}>
              <Label htmlFor={fieldId}>{spec.label}</Label>
              <textarea
                id={fieldId}
                value={readValue(item, spec) as string}
                onChange={(e) =>
                  onUpdateItem(item.id, spec.key, e.target.value)
                }
                rows={4}
                placeholder={spec.placeholder}
                className="mt-1 flex min-h-20 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-950"
              />
              {error && (
                <p role="alert" className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          );
        }
        return (
          <div key={spec.key}>
            <Label htmlFor={fieldId}>{spec.label}</Label>
            <Input
              id={fieldId}
              type={spec.type === "number" ? "number" : spec.type}
              value={readValue(item, spec) as string | number}
              min={spec.min}
              max={spec.max}
              placeholder={spec.placeholder}
              onChange={(e) => {
                if (spec.type === "number") {
                  const parsed = e.target.valueAsNumber;
                  onUpdateItem(
                    item.id,
                    spec.key,
                    Number.isNaN(parsed) ? undefined : parsed,
                  );
                } else if (spec.key === "technologies") {
                  onUpdateItem(
                    item.id,
                    spec.key,
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  );
                } else {
                  onUpdateItem(item.id, spec.key, e.target.value);
                }
              }}
            />
            {error && (
              <p role="alert" className="mt-1 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PersonalLinksEditor({
  links,
  onChange,
}: {
  links: { id: string; label?: string; url?: string }[];
  onChange: (links: { id: string; label?: string; url?: string }[]) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <p className="mb-2 text-sm font-medium">Enlaces</p>
      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="flex gap-2">
            <Input
              value={link.label ?? ""}
              onChange={(e) =>
                onChange(
                  links.map((l) =>
                    l.id === link.id ? { ...l, label: e.target.value } : l,
                  ),
                )
              }
              placeholder="Etiqueta (p. ej. LinkedIn)"
              aria-label="Etiqueta del enlace"
              maxLength={100}
            />
            <Input
              value={link.url ?? ""}
              onChange={(e) =>
                onChange(
                  links.map((l) =>
                    l.id === link.id ? { ...l, url: e.target.value } : l,
                  ),
                )
              }
              placeholder="https://"
              aria-label="URL del enlace"
              inputMode="url"
              maxLength={500}
            />
            <Button
              size="sm"
              variant="outline"
              aria-label="Eliminar enlace"
              onClick={() =>
                onChange(links.filter((l) => l.id !== link.id))
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange([...links, { id: newId() }])}
        >
          <Plus />
          Añadir enlace
        </Button>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Aparecen junto a tus datos personales.
      </p>
    </div>
  );
}
