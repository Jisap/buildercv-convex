import { ConvexError } from "convex/values";
import { isAllowedUrlScheme } from "../lib/links";
import { ITEM_LIMITS, LIMITS } from "../lib/validation/resume";
import type { ResumeContent } from "../types/resume";

// Reglas autoritativas del backend (el cliente puede invocarse directamente).
// Espejan `lib/validation/resume.ts` usando las mismas constantes LIMITS.
// Se aplican en `update` cuando llega `content` nuevo.

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_STRING = LIMITS.maxText;

function fail(message: string): never {
  throw new ConvexError(message);
}

function checkString(value: unknown, what: string): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string" || value.length > MAX_STRING) {
    fail(`${what} no válido.`);
  }
}

function checkUrl(value: unknown, what: string): void {
  if (value === undefined) {
    return;
  }
  if (
    typeof value !== "string" ||
    value.length > MAX_STRING ||
    !isAllowedUrlScheme(value)
  ) {
    fail(`${what} no válido (usa https://, http:// o mailto:).`);
  }
}

/**
 * Lanza ConvexError si el contenido viola límites o reglas semánticas:
 * conteos, IDs duplicados/ausentes, títulos, fechas YYYY-MM, niveles 1–5,
 * longitudes y tamaño total.
 */
export function assertContentLimits(content: ResumeContent): void {
  if (content.sections.length > LIMITS.maxSections) {
    fail(`Máximo ${LIMITS.maxSections} secciones.`);
  }
  const sectionIds = new Set<string>();
  for (const section of content.sections) {
    if (!section.id || sectionIds.has(section.id)) {
      fail("IDs de sección duplicados o ausentes.");
    }
    sectionIds.add(section.id);
    if (!section.title.trim() || section.title.length > LIMITS.maxTitle) {
      fail("Título de sección no válido.");
    }
    const maxItems = ITEM_LIMITS[section.type];
    if (maxItems === undefined || section.items.length > maxItems) {
      fail(`Demasiados elementos en «${section.title}».`);
    }
    const itemIds = new Set<string>();
    for (const item of section.items) {
      const record = item as unknown as Record<string, unknown>;
      if (typeof record.id !== "string" || !record.id || itemIds.has(record.id)) {
        fail("IDs de elemento duplicados o ausentes.");
      }
      itemIds.add(record.id);
      for (const [key, value] of Object.entries(record)) {
        if (key === "id") {
          continue;
        }
        if (key === "links" && Array.isArray(value)) {
          if (value.length > 20) {
            fail("Demasiados enlaces.");
          }
          const linkIds = new Set<string>();
          for (const link of value as Record<string, unknown>[]) {
            if (typeof link.id !== "string" || !link.id || linkIds.has(link.id)) {
              fail("IDs de enlace duplicados o ausentes.");
            }
            linkIds.add(link.id);
            checkString(link.label, "Etiqueta de enlace");
            checkUrl(link.url, "URL de enlace");
          }
          continue;
        }
        if (key === "technologies" && Array.isArray(value)) {
          if (value.length > 30) {
            fail("Demasiadas tecnologías.");
          }
          for (const t of value) {
            checkString(t, "Tecnología");
          }
          continue;
        }
        if (key === "level" && typeof value === "number") {
          if (!Number.isInteger(value) || value < 1 || value > 5) {
            fail("Nivel fuera de rango (1–5).");
          }
          continue;
        }
        if ((key === "startDate" || key === "endDate") && value !== undefined) {
          if (typeof value !== "string" || !DATE_RE.test(value)) {
            fail("Fecha no válida (YYYY-MM).");
          }
          continue;
        }
        if (typeof value === "boolean" || value === undefined) {
          continue;
        }
        if (key === "url") {
          checkUrl(value, "URL");
          continue;
        }
        checkString(value, "Campo");
      }
    }
  }
  if (JSON.stringify(content).length > LIMITS.maxTotalChars) {
    fail("El contenido supera el tamaño máximo.");
  }
}
