// Capa 3 del ATS: cobertura de palabras clave de una oferta.
// 100 % determinista y local: sin llamadas externas, sin LLM, sin
// persistencia (el texto de la oferta nunca sale del navegador ni se
// guarda). Heurística orientativa, no una medición de «pasar el ATS».

import type { ResumeContent } from "../../types/resume";
import type { AtsKeywordReport, AtsKeywordTerm } from "./types";

/** Límite de entrada (igual que el plan: 8000 caracteres). */
export const JOB_TEXT_MAX_CHARS = 8000;

/** Tope de términos por informe (ordenados por frecuencia). */
export const MAX_KEYWORDS = 30;

/** Minúsculas, sin acentos, espacios colapsados. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Palabras vacías es/en: ruido que nunca es una competencia. Incluye
// verbos típicos de oferta (buscamos, valoran…), años/años de experiencia
// y títulos de sección (acierto regalado: ya están en el CV).
const STOPWORDS = new Set(
  "el la los las un una unos unas lo al del de en y e o u que se su sus con por para como mas muy pero porque pues entre hasta desde donde cuando cada todo todos todas tambien tampoco sino sobre tras ante bajo hacia durante mediante segun otro otra otros otras mismo misma tan tanto cual cuales quien quienes cuyo cuya ademas asi aqui alli entonces luego despues antes siempre nunca jamas poco mucho bastante demasiado casi solo solamente incluso excepto salvo ambos cualquiera hay son es sea sean ser estar estoy esta estan este estos esta estas ese esa eso aquel aquella aquello mi mis tu tus nuestra nuestro nuestras nuestros vuestra vuestro nos os les me te le les nosotras vosotros ellos ellas nosotros ello ello mismo misma mismos mismas cual cuales cuanto cuanta cuantos cuantas donde adonde cual cuando como porque sino tampoco demas demas buscamos buscan buscar valoran valora valorar valorable requiere requieren necesita necesitan ofrece ofrecen persona personas perfil puesto empresa equipo trabajo jornada contrato salario anos experiencia formacion competencias idiomas the a an and or of to in on for with as by at from is are was were be been being have has had do does did will would can could should shall may might must this that these those it its we you they he she his her our your their them our but not no yes so if then than too very more most other some such only own same into over after before between through during about each both few many much while where when how what which who whom within without under again once here there their been than then seeking looking join offering required requires requirement plus team company role position years year experience".split(
    " ",
  ),
);

/** Variantes de una palabra (heurística es/en): singular/plural y
 * género («desarrolladores» casa con «desarrolladora»).
 * Genera candidatos en vez de reducir: «clases»→{clases,clase}. */
export function wordVariants(word: string): string[] {
  const base = new Set([word]);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    base.add(word.slice(0, -1));
  }
  if (word.length > 5 && word.endsWith("es")) {
    const sinEs = word.slice(0, -2);
    // Plural con -es tras consonante (desarrollador→desarrolladores).
    if (/[rlndjz]$/.test(sinEs)) {
      base.add(sinEs);
    }
  }
  const variantes = new Set<string>();
  for (const b of base) {
    variantes.add(b);
    // Plural desde el singular (test→tests, clase→clases).
    if (!b.endsWith("s") && b.length > 2) {
      variantes.add(`${b}s`);
      if (/[rlndjz]$/.test(b)) {
        variantes.add(`${b}es`);
      }
    }
    // Género desde la forma en -e (desarrolladore→desarrolladora/or).
    if (b.length > 5 && b.endsWith("e")) {
      variantes.add(`${b.slice(0, -1)}a`);
      variantes.add(`${b.slice(0, -1)}o`);
    }
    if (b.length > 4 && (b.endsWith("a") || b.endsWith("o"))) {
      variantes.add(`${b.slice(0, -1)}${b.endsWith("a") ? "o" : "a"}`);
    }
  }
  return [...variantes];
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Alternancia con todas las variantes de una palabra. */
function alternation(word: string): string {
  return `(?:${wordVariants(word).map(escapeRegex).join("|")})`;
}

/** Patrón de palabra completa para cualquiera de sus variantes. */
function wordPattern(word: string): string {
  return `(?:^|[^a-z0-9])${alternation(word)}(?:[^a-z0-9]|$)`;
}

/** ¿Aparece el término (unigrama o bigrama) en el texto normalizado? */
export function termMatches(cvText: string, term: string): boolean {
  const words = term.split(" ").filter(Boolean);
  if (words.length === 0) {
    return false;
  }
  const padded = ` ${cvText} `;
  if (words.length === 1) {
    return new RegExp(wordPattern(words[0]), "i").test(padded);
  }
  // Fronteras solo en los extremos: el espacio intermedio es flexible.
  const pattern = `(?:^|[^a-z0-9])${words.map(alternation).join("\\s+")}(?:[^a-z0-9]|$)`;
  return new RegExp(pattern, "i").test(padded);
}

export interface ExtractedKeyword {
  term: string;
  count: number;
}

/** Extrae unigramas y bigramas ordenados por frecuencia (determinista).
 * Bigramas solo entre palabras adyacentes dentro de la misma frase
 * (no se cruzan puntos ni saltos de línea). */
export function extractKeywords(text: string): {
  terms: ExtractedKeyword[];
  truncated: boolean;
} {
  const truncated = text.length > JOB_TEXT_MAX_CHARS;
  const fuente = truncated ? text.slice(0, JOB_TEXT_MAX_CHARS) : text;
  const unigramCounts = new Map<string, number>();
  const bigramCounts = new Map<string, number>();
  for (const frase of fuente.split(/[.!?;\n]+/)) {
    const tokens = normalizeText(frase).split(" ").filter(Boolean);
    const utiles = tokens.map((t) => !STOPWORDS.has(t) && t.length >= 2);
    tokens.forEach((token, i) => {
      if (!utiles[i]) {
        return;
      }
      unigramCounts.set(token, (unigramCounts.get(token) ?? 0) + 1);
      const siguiente = tokens[i + 1];
      if (siguiente !== undefined && utiles[i + 1]) {
        const bigrama = `${token} ${siguiente}`;
        bigramCounts.set(bigrama, (bigramCounts.get(bigrama) ?? 0) + 1);
      }
    });
  }
  const todos: ExtractedKeyword[] = [
    ...[...bigramCounts].map(([term, count]) => ({ term, count, words: 2 })),
    ...[...unigramCounts].map(([term, count]) => ({ term, count, words: 1 })),
  ]
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.words - a.words ||
        (a.term < b.term ? -1 : a.term > b.term ? 1 : 0),
    )
    .slice(0, MAX_KEYWORDS)
    .map(({ term, count }) => ({ term, count }));
  return { terms: todos, truncated };
}

/** Texto plano del CV: títulos + campos de texto de secciones visibles
 * (la cabecera personal siempre, como en las reglas de la Capa 1). */
export function cvToPlainText(content: ResumeContent): string {
  const partes: string[] = [];
  for (const section of content.sections) {
    if (!section.visible && section.type !== "personal") {
      continue;
    }
    partes.push(section.title);
    for (const item of section.items) {
      recogerTexto(item as unknown as Record<string, unknown>, partes);
    }
  }
  return normalizeText(partes.join("\n"));
}

const CLAVES_IGNORADAS = new Set(["id", "photoStorageId"]);

function recogerTexto(valor: unknown, partes: string[]): void {
  if (typeof valor === "string") {
    partes.push(valor);
    return;
  }
  if (Array.isArray(valor)) {
    for (const v of valor) {
      recogerTexto(v, partes);
    }
    return;
  }
  if (typeof valor === "object" && valor !== null) {
    for (const [clave, v] of Object.entries(valor)) {
      if (!CLAVES_IGNORADAS.has(clave)) {
        recogerTexto(v, partes);
      }
    }
  }
}

/** Informe de cobertura: qué términos de la oferta aparecen en el CV.
 * Devuelve `null` si no hay puesto ni oferta (nada que analizar).
 * Informativo: no resta puntos (evita falsa precisión). */
export function analyzeKeywords(args: {
  content: ResumeContent;
  targetRole?: string;
  jobPosting?: string;
}): AtsKeywordReport | null {
  const fuente = [args.targetRole ?? "", args.jobPosting ?? ""]
    .join("\n")
    .trim();
  if (fuente === "") {
    return null;
  }
  const { terms, truncated } = extractKeywords(fuente);
  const cvText = cvToPlainText(args.content);
  const matched: AtsKeywordTerm[] = terms.map(({ term, count }) => ({
    term,
    count,
    found: termMatches(cvText, term),
  }));
  const covered = matched.filter((t) => t.found).length;
  return { terms: matched, covered, total: matched.length, truncated };
}
