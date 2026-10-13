// Reglas canónicas de enlaces del CV (F1). Sin imports para que Convex
// pueda usarlas con import relativo (el typecheck de Convex no resuelve
// el alias `@/*`). Tres consumidores, una sola regla:
// - render (`features/templates/shared.tsx`): tolerante, normaliza.
// - Zod (`lib/validation/resume.ts`): avisa en el formulario.
// - Convex (`convex/contentLimits.ts`): autoritativo, rechaza.

const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/** Esquema de la URL en minúsculas, o null si no trae esquema. */
export function urlScheme(raw: string): string | null {
  const match = SCHEME_RE.exec(raw.trim());
  return match ? match[0].slice(0, -1).toLowerCase() : null;
}

/** Solo `http`, `https` y `mailto` llegan a un `href`. Sin esquema también
 * vale (se normaliza al pintar); cualquier otro esquema se rechaza. */
export function isAllowedUrlScheme(raw: string): boolean {
  const scheme = urlScheme(raw);
  return (
    scheme === null ||
    scheme === "http" ||
    scheme === "https" ||
    scheme === "mailto"
  );
}

/**
 * Normaliza una URL para `href`. Devuelve null cuando no es enlazable:
 * vacía, con espacios, con esquema no permitido o sin pinta de dominio.
 * Tolerante a propósito: los CV antiguos con texto raro se pintan como
 * texto plano en lugar de romperse o exigir migración.
 */
export function normalizeLinkUrl(raw?: string): string | null {
  const url = (raw ?? "").trim();
  if (!url || /\s/.test(url)) {
    return null;
  }
  const scheme = urlScheme(url);
  if (scheme !== null) {
    return scheme === "http" || scheme === "https" || scheme === "mailto"
      ? url
      : null;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) {
    return `mailto:${url}`;
  }
  if (/^[^\s@]+(\.[^\s@]+)+(:\d+)?(\/\S*)?$/.test(url)) {
    return `https://${url}`;
  }
  return null;
}
