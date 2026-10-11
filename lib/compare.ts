/**
 * Serialización canónica: igual que JSON.stringify pero con las claves de
 * objeto ordenadas. El servidor (Zod/Convex) puede devolver los mismos
 * datos con distinto orden de claves (p. ej. `order` al final tras un
 * spread local frente a su posición en el esquema); sin esto, el
 * autoguardado entraría en bucle mostrando "Guardando" sin fin aunque
 * todo esté al día.
 */
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? "null" : stableStringify(item))).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && typeof v !== "function")
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function snapshotsEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}
