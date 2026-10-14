# Análisis de compatibilidad ATS — plan de implementación para agente

Destino sugerido en el repo: `docs/ATS_COMPATIBILIDAD_AGENTES.md`.
Estado de partida: **no existe ningún análisis ATS**. «ATS» solo aparece como
etiqueta de dos plantillas (`features/templates/types.ts`: «Clásico / ATS» y
«Mínima / ATS») y en comentarios de plantillas/tests.

Este documento está escrito para ejecutarse por fases, con commits pequeños y
verificación entre tareas. **Lee entero «Reglas del repo» y «No hacer» antes de
tocar nada.**

---

## 0. Objetivo y alcance (MVP)

Mostrar en el editor una **«Compatibilidad de lectura automática»**: nivel
Alta / Media / Baja, lista de problemas con explicación y, solo donde sea
seguro, corrección de un clic.

**No es un % de «pasar el ATS».** No existe un ATS único. El panel muestra
siempre el aviso: *«Orientativo: cada sistema de selección interpreta los
currículums de forma distinta.»* Nunca escribir «% de que pase el ATS» ni
garantizar nada.

**Solo Capa 1, solo cliente, sin backend.** Todo es
`useMemo(analyzeAts({ content, design, layout, title }))` sobre el borrador en
edición (no el guardado). Cero cambios en `convex/`, `types/resume.ts`,
`lib/validation/resume.ts`, `lib/resume.ts`, `lib/links.ts`,
`features/templates/types.ts` y plantillas. Sin dependencias nuevas, sin
persistencia, sin `localStorage`.

Se construye en tres capas independientes, pero **este MVP es solo la Capa 1
con 12 reglas** (ver 2.3). El resto del catálogo queda diferido como «reglas
futuras» en `docs/ats.md`. Cada regla deja el repo en verde por sí sola.

| Capa | Qué hace | Dónde corre | Estado |
|---|---|---|---|
| **1. Análisis estático** | Reglas puras sobre `content` + `design` + `layout` | Cliente (`useMemo`) | **MVP (12 reglas)** |
| **2. Verificación round-trip** | Genera el PDF real, extrae su texto y mide integridad y orden de lectura | Servidor (ruta nueva) | Diferida (ver §3) |
| **3. Palabras clave de una oferta** | Cobertura de términos de una oferta pegada por el usuario | Cliente | Diferida (ver §4) |

**UX:** no romper `EditorShell.tsx`. En desktop, tercera pestaña
`content | design | ats`. En móvil se mantiene `grid-cols-4`
(Editar / Diseño / Vista previa / PDF): el tab ATS no añade botón inferior,
se entra por banner «Revisar compatibilidad» y por la `tablist` de desktop.
Sin regresión a 360 px ni en `e2e/a11y.spec.ts`.

---

## 1. Reglas del repo (leer antes de empezar)

1. Lee `AGENTS.md`: esta versión de Next (16.4) tiene cambios de API. Antes de
   escribir código Next (rutas, config, `serverExternalPackages`…) consulta
   `node_modules/next/dist/docs/`.
2. **Verificación en dos niveles** (no avanzar con fallos en el nivel que toque):
   - Rápida, tras cada tarea:
     ```bash
     npx next typegen && npx tsc --noEmit
     npm run lint
     npm test
     ```
   - Completa, pre-merge de la Capa 1:
     ```bash
     npm run build
     npm run test:e2e        # arranca solo `npm run dev`
     ```
     (`npm run test:pdf` solo necesario en Capa 2.)
   Anota la línea base (el README declara 90 unit, 50 e2e + 8 con sesión, 81 de
   paridad). Si la base ya falla, **detente e informa**.
3. **Regla F (backend/frontend):** todo cambio en `convex/` **o en archivos que
   `convex/` importe** exige `npm run convex:push`. Importa de `lib/*` y
   `features/templates/types.ts` está permitido (solo lectura), pero **no los
   modifiques** en la Capa 1. Archivos que Convex importa y que NO debes tocar:
   `features/templates/types.ts`, `lib/resume.ts`, `lib/links.ts`,
   `lib/validation/resume.ts`, `types/resume.ts`, `convex/*`.
4. **Espejo cuádruple** (`types/resume.ts` + `lib/validation/resume.ts` +
   `convex/resumeModel.ts` + `lib/resume.ts`): esta funcionalidad **no** cambia
   el modelo de datos; si te encuentras tocándolo, estás fuera de plan.
5. **Invariante intocable: preview = print.** Mismo renderizador, estilos
   estructurales en línea o ganchos `cv-*`, documento siempre en papel claro. No
   modificar plantillas en la Capa 1.
6. Convenciones: TypeScript estricto, sin `any`; alias `@/`; **textos visibles en
   castellano**, identificadores nuevos en inglés; chrome de la app solo con
   tokens semánticos de Tailwind (`bg-card`, `text-muted-foreground`,
   `text-destructive`, `text-success`, `border-border`…), nunca `zinc-*` ni
   colores fijos. Comprueba en `app/globals.css` qué token existe para
   «advertencia»; si no hay, **no inventes colores**: distingue por icono y texto
   (la severidad nunca debe depender solo del color).
7. Accesibilidad: hay pruebas axe (`e2e/a11y.spec.ts`) en claro y oscuro. El panel
   nuevo no puede introducir violaciones.
8. Commits pequeños, uno por tarea. Mensaje en castellano, imperativo.

---

## 2. Capa 1 — Análisis estático

### 2.1 Estructura de archivos (todo nuevo)

```
lib/ats/
  types.ts            # tipos públicos
  sectionTitles.ts    # diccionario es/en + normalización
  rules.ts            # 12 reglas MVP (array de funciones puras)
  scoring.ts          # constantes de pesos y cálculo
  analyze.ts          # analyzeAts(): orquesta reglas + puntuación
  analyze.test.ts     # unit tests por regla
features/editor/AtsPanel.tsx        # UI del tab
```

`lib/ats/*` **no debe importar React** ni nada de `convex/`. Puede importar
`partitionForLayout` (`features/templates/layout`), `normalizeLinkUrl`
(`lib/links`) y tipos de `types/resume`.

> MVP sin `features/templates/atsProfiles.ts`: basta con
> `isAtsTemplate = templateId === "classic" || templateId === "minimal"`
> (sale de `features/templates/types.ts`, solo lectura). Los perfiles por
> plantilla (`showsPhoto`, `rendersSkillLevels`, `usesGraphicElements`…)
> quedan diferidos a «reglas futuras». No pongas nada nuevo en
> `features/templates/types.ts`: lo importa `convex/` y obligaría a
> `convex:push`.

### 2.2 Tipos (`lib/ats/types.ts`)

```ts
import type { ResumeContent, ResumeDesign, ResumeLayout } from "@/types/resume";

export type AtsSeverity = "error" | "warning" | "info";
export type AtsCategory = "structure" | "content" | "design" | "file";

export type AtsFix =
  | { kind: "setDesign"; label: string; patch: Partial<ResumeDesign> }
  | { kind: "renameSection"; label: string; sectionId: string; title: string };
  // MVP: sin `setTitle` ni cambio de plantilla. Solo `setDesign` para
  // `layoutId`, `fontSize` y `pageMargin` (ver 2.3).

export interface AtsIssue {
  /** `ruleId` + destino: estable entre renders (clave de React). */
  id: string;
  ruleId: string;
  severity: AtsSeverity;
  category: AtsCategory;
  message: string; // qué pasa (castellano)
  hint: string;    // cómo arreglarlo (castellano)
  target?: { sectionId?: string; itemId?: string; panel?: "design" };
  fix?: AtsFix;
}

export interface AtsInput {
  content: ResumeContent;
  design: ResumeDesign;
  layout?: ResumeLayout | null;
  /** Título interno del CV (da nombre al PDF descargado). */
  title: string;
}

export type AtsLevel = "high" | "medium" | "low";

export interface AtsReport {
  score: number; // 0–100, entero
  level: AtsLevel;
  issues: AtsIssue[]; // ordenadas: error > warning > info, luego categoría
  counts: Record<AtsSeverity, number>;
}

export type AtsRule = (input: AtsInput) => AtsIssue[];
```

`analyzeAts(input: AtsInput): AtsReport` — pura, determinista, sin efectos, sin
`Date.now()` ni aleatoriedad.

### 2.3 Catálogo de reglas (`rules.ts`) — MVP de 12

Solo se evalúan **secciones visibles** (`section.visible`), con una excepción: la
cabecera personal. `partitionForLayout` renderiza la sección `personal` aunque
`visible` sea `false`, así que las reglas de contacto evalúan **el contenido**
de `personal.items[0]`, no su visibilidad.

Un issue por elemento afectado (con `target.itemId`); la penalización se acota
por regla (ver 2.5).

| `ruleId` | Cat. | Sev. | Condición | `fix` |
|---|---|---|---|---|
| `contact.name-missing` | structure | error | `personal.items[0].fullName` vacío o solo espacios | — |
| `contact.email-missing` | structure | error | sin `email` | — |
| `content.placeholder` | content | error | la plantilla pintaría un texto de relleno: `experience` sin `position` (→ «Puesto»); `education` sin `degree` ni `field` (→ «Titulación»); `projects` sin `name` (→ «Proyecto»); `languages` sin `name` (→ «—») | — |
| `structure.experience-missing` | structure | warning | ninguna sección `experience` visible con ≥1 elemento | — |
| `structure.education-missing` | structure | warning | ídem `education` | — |
| `structure.section-empty` | structure | warning | sección visible (≠ `personal`) sin elementos, o `profile` con texto vacío | — |
| `structure.section-title-nonstandard` | structure | warning | sección **no** `custom` y no `personal` cuyo título normalizado no está en el diccionario de su tipo | `renameSection` al título canónico |
| `content.decorative-symbols` | content | warning | en cualquier campo de texto de secciones visibles: emoji (`\p{Extended_Pictographic}`), caracteres en `U+2190–U+21FF`, `U+2500–U+27BF`, `U+2B00–U+2BFF`, `U+FE0F`, o de control (`U+0000–U+0008`, `U+000B`, `U+000C`, `U+000E–U+001F`). **Permitidos:** `-`, `•` (U+2022), `·`, `–`, `—` | — |
| `content.link-invalid` | content | warning | enlace con `label` pero sin `url`, o `url` para la que `normalizeLinkUrl` devuelve `null` (incluye `projects[].url`) | — |
| `design.two-columns` | design | warning | `partitionForLayout(...).sidebar.length > 0` con `design.layoutId === "two-col"` | `setDesign { layoutId: "single" }` |
| `design.font-size` | design | info | `fontSize < 10` | `setDesign { fontSize: 11 }` |
| `design.margin` | design | info | `pageMargin < 10` | `setDesign { pageMargin: 13 }` |

Mensajes: frase corta + `hint` accionable. Ejemplo:
`message: "«Experiencia» tiene un puesto sin completar."`,
`hint: "El PDF mostraría el texto «Puesto». Rellénalo o elimina el elemento."`.

**Reglas futuras (no implementar en el MVP, documentar en `docs/ats.md`):**
`contact.email-invalid`, `contact.phone-missing`, `contact.phone-invalid`
(<9 dígitos falla en internacional; calibrar o usar rango 7–15),
`structure.skills-missing`, `structure.profile-missing`,
`structure.custom-title-unknown`, `content.experience-dates`,
`content.experience-description-missing`, `content.long-paragraph` (600 chars),
`content.too-short` (120 palabras) / `content.too-long` (1200 palabras),
`design.skill-levels`, `design.graphic-elements`, `design.color-blocks`,
`design.photo` (exigen `atsProfiles.ts` por plantilla),
`file.title-as-filename` (choca con validación de 200 chars).
Cambio de plantilla a «Clásico / ATS»: diferido — antes de hacerlo hay que
leer cómo `DesignSidebar.tsx`/`TemplatePicker.tsx` cambian de plantilla
(`templateId` + `templateVersion` + posibles campos extra) y replicar el
contrato exacto.

### 2.4 Diccionario (MVP) y perfiles (diferido)

**`sectionTitles.ts`** — normalizar con
`s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim()`.
Títulos aceptados (ya normalizados) por tipo:

- `profile`: perfil profesional, perfil, resumen, resumen profesional, sobre mi, summary, professional summary, profile, about me
- `experience`: experiencia, experiencia profesional, experiencia laboral, trayectoria profesional, experience, work experience, professional experience, employment history
- `education`: formacion, formacion academica, educacion, estudios, education, academic background
- `skills`: competencias, habilidades, aptitudes, conocimientos, competencias tecnicas, skills, technical skills
- `digitalSkills`: competencias digitales, habilidades digitales, herramientas, digital skills, tools
- `languages`: idiomas, lenguas, languages
- `projects`: proyectos, proyectos personales, projects

Títulos canónicos para el `fix` de renombrado (**duplícalos aquí**; no exportes
`SECTION_TITLES` de `lib/resume.ts`, que lo importa Convex): Perfil profesional,
Experiencia, Formación, Competencias, Competencias digitales, Idiomas, Proyectos.

**Perfiles por plantilla: diferido.** El MVP no necesita
`features/templates/atsProfiles.ts`. Si se retoman las reglas futuras
(`design.skill-levels`, `design.graphic-elements`, `design.color-blocks`,
`design.photo`), crear entonces:

```ts
export interface AtsTemplateProfile {
  showsPhoto: boolean;
  rendersSkillLevels: boolean;
  usesGraphicElements: boolean;
  usesColorBlocks: boolean;
  intrinsicTwoColumns: boolean;
  monospace: boolean;
}
export const ATS_PROFILES: Record<string, AtsTemplateProfile> = { /* … */ };
```

Rellenarlo leyendo el código de cada plantilla (hipótesis sin verificar:
classic/minimal limpias; compact/modern/sidebar/elegant/energetic/technical/
executive por confirmar, en especial `intrinsicTwoColumns`). Test asociado:
para cada id de `TEMPLATE_IDS` existe perfil, y no hay perfiles de ids
inexistentes.

### 2.5 Puntuación (`scoring.ts`)

Constantes exportadas en un único sitio (son valores **iniciales** a calibrar
con CV reales antes de dar peso visual al número):

```ts
export const WEIGHTS = { error: 15, warning: 6, info: 0 } as const;
export const CAP_PER_RULE = { error: 30, warning: 12, info: 0 } as const;
export const LEVEL_THRESHOLDS = { high: 85, medium: 60 } as const;
```

- `penalty(rule) = min(CAP_PER_RULE[sev], nIssues * WEIGHTS[sev])`.
- `score = clamp(round(100 - Σ penalty), 0, 100)`.
- `level`: `≥85` high, `60–84` medium, `<60` low.
- Los `info` aparecen en la lista pero no restan.
- UI: mostrar en grande el **nivel en texto** (Alta / Media / Baja); el número
  va en secundario y pequeño hasta calibrar (evita falsa precisión).

### 2.6 Tests unitarios (`analyze.test.ts`)

Vitest (revisa `vitest.config.mts` para confirmar el patrón de inclusión y el
entorno). Mínimo (MVP: 12 `ruleId` → 24 casos + integración):

- Un caso **positivo** y uno **negativo** por cada `ruleId` del MVP.
- CV de `SHORT_CONTENT`/`LONG_CONTENT` (`features/exports/fixtures.ts`) con
  `classic`: score alto y sin errores; comprobar aserciones concretas, no
  snapshots opacos.
- Determinismo: dos llamadas con la misma entrada → resultado igual
  (`toEqual`).
- Una sección oculta no genera issues (salvo la cabecera personal, ver 2.3).
- Cap por regla: 10 placeholders no restan más de `CAP_PER_RULE.error`.
- Orden de salida: error → warning → info.
- Normalización: «Formación», «FORMACION », «Education» aceptados.

### 2.7 UI (`AtsPanel.tsx` + `EditorShell.tsx`)

1. **Tab nuevo solo en desktop.** En `EditorShell.tsx`: `type PanelTab = "content" | "design" | "ats"`;
   añadir `["ats", "Compatibilidad"]` al array del `tablist` (`role="tablist"`,
   desktop). **No añadir botón en la barra inferior móvil** (`grid-cols-4` intacto:
   Editar / Diseño / Vista previa / PDF): en móvil se entra al tab por el banner
   «Revisar compatibilidad» y por navegación programática. **Sin romper la prueba
   responsive a 360 px** (`e2e/responsive.spec.ts`).
   Lee el shell completo antes de editar: es un archivo grande y estable;
   **cambios mínimos, sin refactor** (R1 está diferido por decisión).
2. **Cálculo.** `const report = useMemo(() => analyzeAts({ content, design, layout: healedLayout, title }), [...])`
   sobre el estado en edición (no el guardado). `healedLayout` ya existe en el
   shell (sanado en cada render). No calcular si `content`/`design` son
   `null` (hidratación). Sin `useDeferredValue` de entrada (son regex +
   conteos, <1ms); solo añadirlo si se mide lag al teclear.
3. **Panel.** Cabecera con nivel en **texto grande** («Compatibilidad: Alta/Media/Baja»)
   + número en secundario pequeño + aviso orientativo. Debajo, issues agrupados por
   severidad; cada uno con icono (lucide) + texto de severidad accesible, `message`,
   `hint`, botón **«Ir a la sección»** si hay `target` y botón de `fix.label` si hay
   `fix`. Estado vacío cuando no hay issues («Sin problemas detectados»). Región
   `aria-live="polite"` solo para el nivel, no para toda la lista.
4. **Navegar al elemento.** Reutiliza el mecanismo que ya usa el banner de
   validación («Revisar», cerca de la línea ~446 de `EditorShell`): fija
   `selectedId`, cambia a `setPanelTab("content")` y `setMobileTab("edit")`. Para
   `target.panel === "design"` cambia a `"design"`.
5. **Aplicar `fix` (solo seguros en MVP).** Mapear a los manejadores **existentes**,
   sin crear caminos de guardado nuevos:
   - `setDesign` (`layoutId`, `fontSize`, `pageMargin`) → `setDesign(prev => ({ ...prev, ...patch }))`
     por el mismo camino que usa `DesignSidebar` (respeta autoguardado y deshacer).
   - `renameSection` → el mismo `onChangeContent` que usa el formulario de
     sección.
   Tras aplicar, el informe se recalcula solo (es derivado).
6. Sin persistencia: **no guardar el informe** en Convex ni en storage.

### 2.8 E2E

En `e2e/autenticado.spec.ts` (sesión, se salta sin `E2E_CLERK_EMAIL` +
`CLERK_SECRET_KEY`; sigue su patrón): abrir un CV, entrar en el tab
«Compatibilidad», comprobar que aparece el nivel y que aplicar el `fix` de una
columna actualiza el estado «Guardado». Añadir el panel a la comprobación axe
si el patrón de `e2e/a11y.spec.ts` lo permite sin sesión; si no, cubrirlo en el
spec autenticado.

### 2.9 Criterios de cierre de la Capa 1 (MVP)

- [ ] `tsc` 0, `lint` 0, `npm test` en verde (24 casos de reglas + integración), `build` OK.
- [ ] `npm run test:e2e` sin regresiones respecto a la línea base.
- [ ] **Cero cambios** en `convex/`, `types/resume.ts`, `lib/validation/`,
      `lib/resume.ts`, `lib/links.ts`, `features/templates/types.ts` y en las
      plantillas (`git diff --stat` lo demuestra). No hace falta `convex:push`.
- [ ] Sin dependencias nuevas. Sin `atsProfiles.ts` en el MVP.
- [ ] Panel usable a 360 px (móvil sin botón extra, `grid-cols-4` intacto), en claro
      y oscuro, sin violaciones axe.
- [ ] `docs/ats.md` creado: las 12 reglas MVP + lista de «reglas futuras» con motivo
      del diferido, pesos, límites y aviso de que es orientativo.

---

## 3. Capa 2 — Verificación round-trip del PDF (solo si se pide)

Objetivo: comprobar lo que ninguna heurística ve — que el PDF real tiene capa de
texto, conserva todo el contenido, y **no mezcla el orden de lectura** (el caso
crítico son las dos columnas).

### 3.1 Refactor previo (commit separado, sin cambio de comportamiento)

`app/api/resumes/[id]/pdf/route.ts` define `puerta` (`PuertaPdf(2, 10)`) y `tasa`
(`LimiteTasa(6, 60_000)`) como constantes **del módulo de la ruta**. Una ruta
nueva con las suyas duplicaría la capacidad real. Extrae a `lib/pdf/`:

- `lib/pdf/service.ts`: exporta las instancias compartidas `puerta` y `tasa`, y
  `TIMEOUT_MS`.
- `lib/pdf/export.ts`: `loadResumeForExport({ id, userId, getToken })` (consulta
  Convex + URL de foto con el mismo manejo de errores) y
  `renderResumePdf(resume, photoUrl): Promise<Uint8Array>` (HTML + Chromium +
  espera de imágenes + timeout).
- La ruta PDF queda delgada y **mantiene exactamente** los códigos (401, 404,
  500, 429 con `Retry-After`, 503 con `Retry-After`), cabeceras y registro
  estructurado actuales.

Verificación obligatoria del refactor: `npm test`, `npm run build` y
`npm run test:pdf` iguales a la línea base **antes** de añadir nada.

### 3.2 Ruta nueva

`GET /api/resumes/[id]/ats` (runtime Node): misma autenticación y errores que la
ruta PDF, **comparte `tasa` y `puerta`** (una verificación cuenta como una
exportación; documéntalo), genera el PDF con `renderResumePdf`, ejecuta
`analyzePdfRoundtrip` y devuelve JSON pequeño (`AtsRoundtripReport`), nunca el
PDF.

`pdf-parse` hoy es `devDependency` (la usa `paridad/`). Pásala a `dependencies`
con la **misma versión** (`npm install pdf-parse@<versión actual> --save`).
Comprueba en la documentación de Next si hace falta
`serverExternalPackages` en `next.config.ts`; el `build` debe pasar.

### 3.3 Algoritmo (`lib/ats/roundtrip.ts`, función pura sobre texto)

Entrada: texto extraído (por página) + `AtsInput`. Salida:

```ts
interface AtsRoundtripReport {
  hasTextLayer: boolean;
  pages: number;
  missingFragments: string[];       // fragmentos esperados que no aparecen
  sectionCoherence: number;         // 0–1
  headingsFound: Record<string, boolean>; // por sectionId visible
  contactNearTop: boolean;          // nombre y email en el primer ~600 caracteres
  linkAnnotations: { expected: number; found: number };
}
```

- Normalizar ambos textos (minúsculas, sin acentos, espacios colapsados).
- **Fragmentos esperados** por sección visible: su título, y para cada elemento
  las primeras ~4 palabras de su campo principal (`position`, `degree`, `name`,
  `title`…). Localizar cada fragmento en el texto extraído.
- **Coherencia de sección:** una sección es coherente si las posiciones de sus
  fragmentos son crecientes y **ningún fragmento de otra sección cae entre el
  primero y el último**. `sectionCoherence = coherentes / total`. Es lo que
  detecta el entrelazado de columnas. No exigir un orden concreto *entre*
  secciones.
- `hasTextLayer = false` si el texto extraído tiene menos de ~20 caracteres.

Issues derivados (categoría nueva `"pdf"`; añádela a `AtsCategory`):

| `ruleId` | Sev. | Condición |
|---|---|---|
| `pdf.no-text-layer` | error | `!hasTextLayer` |
| `pdf.text-missing` | error | `missingFragments.length > 0` |
| `pdf.reading-order` | warning | `sectionCoherence < 0.9` |
| `pdf.headings-missing` | warning | algún encabezado visible no aparece |
| `pdf.contact-not-near-top` | warning | `!contactNearTop` |
| `pdf.links-lost` | info | `found < expected` |

Estos issues se **fusionan** con los de la Capa 1 y entran en la misma
puntuación.

### 3.4 UI

Botón **«Verificar con el PDF real»** en el panel, con estados cargando / error
y mensajes de 429/503 coherentes con `PdfDownloadButton.tsx` (léelo y sigue su
patrón). El resultado vive en estado local (no se persiste) y se invalida al
cambiar contenido o diseño (marcar como «desactualizado», no recalcular solo:
cuesta un render de Chromium).

### 3.5 Tests

- Unit (`roundtrip.test.ts`) con textos sintéticos: texto íntegro → coherencia 1;
  secciones entrelazadas → coherencia < 0.9; fragmento ausente; sin capa de
  texto.
- Playwright (`paridad/ats-roundtrip.spec.ts`): reutiliza o extrae a un helper
  `pdfDe`/`textoDe` de `pdf-parity.spec.ts` (evita duplicar). Con `LONG_CONTENT`:
  Clásica y Mínima en una columna → `missingFragments` vacío y coherencia ≥ 0.9.
  Las 9 plantillas en 1 y 2 columnas deben generar informe sin lanzar. **Si una
  hipótesis falla, investiga y documenta el hallazgo; no relajes la aserción en
  silencio.**
- Añade la nueva suite a `docs/pdf-testing.md`.

### 3.6 Criterios de cierre

- [ ] Refactor sin regresión (`test:pdf` igual que la base).
- [ ] Ruta con auth por recurso, comparte límites, sin devolver datos
      personales en logs (mismo registro mínimo que la ruta PDF).
- [ ] Todo en verde; documentación actualizada.

---

## 4. Capa 3 — Palabras clave de una oferta (solo si se pide)

- `lib/ats/keywords.ts`, 100 % determinista, **sin llamadas externas**:
  `extractKeywords(jobText)` y `matchKeywords(cvText, keywords)`.
- Tokenización sin acentos, stopwords es/en, unigramas y bigramas, ordenados por
  frecuencia; lematización ligera (plurales `-s`/`-es`); límite de entrada
  8000 caracteres. Salida: términos cubiertos / ausentes.
- UI: textarea en el panel; el texto de la oferta **no se persiste**.
- **Fuera de alcance:** usar un LLM. Implica enviar datos personales a un tercero
  (RGPD, consentimiento explícito); decisión del responsable, no del agente.

---

## 5. No hacer

- No persistir el informe ni la puntuación en Convex.
- No modificar el modelo de datos, la validación ni el backend en la Capa 1.
- No modificar plantillas ni `printCss` (invariante preview = print).
- No añadir dependencias en la Capa 1.
- No afirmar compatibilidad garantizada con ningún ATS concreto.
- No relajar ni borrar tests existentes para que pasen.
- No refactorizar `EditorShell` más allá del tab nuevo (R1 diferido).
- No usar `localStorage`/`sessionStorage` para el informe.

## 6. Decisiones que requieren confirmación del responsable

No las ejecutes por tu cuenta; déjalas anotadas en `docs/ats.md`:

1. **Nombre del PDF y `<title>`:** hoy salen del título interno del CV
   (`printDocument.ts` y `safeFilename` en la ruta PDF). Cambiarlos al nombre de
   la persona altera lo que descargan los usuarios.
2. **Textos de relleno en el PDF** («Puesto», «Titulación», «Proyecto»): se
   podrían omitir en modo `print` dentro de las plantillas. Toca el invariante
   preview = print y los tests de plantillas; por eso la Capa 1 solo los avisa.
3. **PDF etiquetado:** `page.pdf({ tagged: true })` (Playwright ≥ 1.42; confirmar
   en la versión instalada) mejora accesibilidad; su efecto en ATS **no está
   verificado**.
4. **Pesos y umbrales** de 2.5: calibrar con CV reales antes de dar peso al
   número en la interfaz.
5. **Compartir `tasa` con la ruta PDF** (Capa 2): una verificación consume una de
   las 6 exportaciones por minuto.

## 7. Informe final esperado del agente

Al cerrar cada capa, responde con: commits realizados, salida resumida de la
verificación base (antes/después), `git diff --stat` mostrando qué archivos
protegidos **no** se tocaron, hipótesis de `atsProfiles.ts` que resultaron
falsas, y las decisiones de la sección 6 que sigan abiertas.
