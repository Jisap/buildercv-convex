"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResumeContent, ResumeSection } from "@/types/resume";
import { newId } from "@/lib/resume";
import {
  ADD_ITEM_LABEL,
  ITEM_FIELDS,
  type ItemFieldSpec,
} from "./sectionFields";

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

  const updateItem = (
    itemId: string,
    key: string,
    value:
      | string
      | number
      | boolean
      | string[]
      | { id: string; label?: string; url?: string }[]
      | undefined,
  ) => {
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
    onChangeContent((current) => {
      if (!current) {
        return current;
      }
      return {
        sections: current.sections.map((s) => {
          if (s.id !== section.id) {
            return s;
          }
          const base = { id: newId() };
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

  const moveItem = (itemId: string, dir: -1 | 1) => {
    onChangeContent((current) => {
      if (!current) {
        return current;
      }
      return {
        sections: current.sections.map((s) => {
          if (s.id !== section.id) {
            return s;
          }
          const index = s.items.findIndex((item) => item.id === itemId);
          const target = index + dir;
          if (index === -1 || target < 0 || target >= s.items.length) {
            return s;
          }
          const items = [...s.items];
          [items[index], items[target]] = [items[target], items[index]];
          return { ...s, items } as unknown as ResumeSection;
        }),
      };
    });
  };

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

      <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
        {section.items.map((item, itemIndex) => (
          <article
            key={item.id}
            aria-label={`Elemento ${itemIndex + 1}`}
            className="rounded-lg border border-zinc-200 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                {itemIndex + 1} de {section.items.length}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  title="Subir"
                  aria-label="Subir elemento"
                  disabled={itemIndex === 0}
                  onClick={() => moveItem(item.id, -1)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  title="Bajar"
                  aria-label="Bajar elemento"
                  disabled={itemIndex === section.items.length - 1}
                  onClick={() => moveItem(item.id, 1)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar elemento"
                  aria-label="Eliminar elemento"
                  onClick={() => deleteItem(item.id)}
                  className="rounded p-1 text-zinc-500 hover:bg-red-100 hover:text-red-700"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {specs.map((spec) => {
                const fieldId = `${section.id}-${item.id}-${spec.key}`;
                const error = fieldError(issues, itemIndex, spec.key);
                const record = item as unknown as Record<string, unknown>;
                if (spec.type === "checkbox") {
                  return (
                    <label key={spec.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={readValue(record, spec) as boolean}
                        onChange={(e) =>
                          updateItem(item.id, spec.key, e.target.checked)
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
                        value={readValue(record, spec) as string}
                        onChange={(e) =>
                          updateItem(item.id, spec.key, e.target.value)
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
                      value={readValue(record, spec) as string | number}
                      min={spec.min}
                      max={spec.max}
                      placeholder={spec.placeholder}
                      onChange={(e) => {
                        if (spec.type === "number") {
                          const parsed = e.target.valueAsNumber;
                          updateItem(
                            item.id,
                            spec.key,
                            Number.isNaN(parsed) ? undefined : parsed,
                          );
                        } else if (spec.key === "technologies") {
                          updateItem(
                            item.id,
                            spec.key,
                            e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          );
                        } else {
                          updateItem(item.id, spec.key, e.target.value);
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
          </article>
        ))}
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
