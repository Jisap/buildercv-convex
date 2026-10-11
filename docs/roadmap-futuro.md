# Roadmap futuro — Editor BuilderCV / CV Studio

**Fecha:** 2026-10-11 · **Estado:** fase actual implementada (pendiente solo revisión visual manual); F1–F4 no empezadas. Este documento es la constancia para retomar el proyecto más adelante.
**Documentos base:** `docs/design.md`, `CV_STUDIO_AGENT_BRIEF.md`, `docs/architecture.md`, `docs/implementation-plan.md`, `docs/data-model.md`.

## 1. Punto de partida (lo que ya existe)

- Stack: Next.js 16.4.0, React 19.3, Tailwind v4 CSS-first, TypeScript estricto, Convex + Clerk, Zod + React Hook Form, Vitest + Playwright.
- Editor actual: `features/editor/EditorShell.tsx` (monolito ~479 líneas) con grid de 3 paneles: navegación de secciones + formulario + vista previa. Móvil con 3 tabs (`sections/edit/preview`). Guardado con `useAutosave` (debounce 800 ms, sin optimismo falso).
- Modelo actual: secciones con `{ id, type, title, order, visible, items[] }`. Diseño con `{ templateId, templateVersion, accentColor, fontFamily }`. Sin `layout` separado. Cuádruple espejo obligatorio ante cualquier cambio: `types/resume.ts` + `lib/validation/resume.ts` + `convex/resumeModel.ts` + `lib/resume.ts`.
- Plantillas: `features/templates/` con contrato `ResumeTemplateProps = { content, design, mode: "preview" | "print" }`. Tres renderizadores (classic/modern/compact). PDF en `GET /api/resumes/[id]/pdf` con Chromium, mismo renderizador en modo `print`.

## 2. Fase actual acordada (implementada 2026-10-11)

**Objetivo:** consolidar renderizado + personalización controlada + layouts predefinidos, sin arrastrar y soltar.

Implementado:
1. Tipos + validación + defaults para `design` ampliado: `fontSize, pageMargin, sectionSpacing` (con rangos) + `layoutId: "single" | "two-col"` (o `columns: 1 | 2` dentro de `design`). Mantener `section.order` como única fuente de orden.
2. Refactor del shell sin cambiar lógica de guardado:
   - `editor-toolbar.tsx` (título, `SaveBadge`, reintentar, botón PDF).
   - `content-sidebar.tsx` (lista actual: subir/bajar/ocultar/borrar/añadir).
   - `design-sidebar.tsx` (evolución de `TemplatePicker.tsx`: plantilla + tipografía + color + spacing + selector de layout).
   - `resume-preview.tsx` (contenedor A4, zoom por CSS al contenedor, nunca al documento que va a PDF).
   - Móvil: pasar de 3 a 4 tabs (`sections/edit/diseño/preview`).
3. Print CSS con variables (`--cv-margin, --cv-spacing, --cv-font-size`), reglas `@page A4`, `break-inside`, color exacto.
4. Paridad preview/PDF con fixtures corto/largo y test de texto íntegro en las 3 plantillas.
5. Limpieza de `docs/design.md` línea 116 (diagrama mermaid roto con dump CSS pegado).

Excluido explícitamente de esta fase: `dnd-kit`, `ResumeLayout.columns`, `UndoRedo`, `react-grid-layout`, posicionamiento libre.

Criterios de cierre de esta fase:
- [x] `design` ampliado persiste y sobrevive a recarga.
- [x] Selector 1/2 columnas funciona en las 3 plantillas sin pérdida de datos.
- [x] Vista previa y PDF usan la misma configuración (márgenes, fuentes, spacing).
- [x] `lint` + `tsc` + `npm test` en verde, `build` OK (2026-10-11: lint 0, tsc 0, 31/31 tests, build OK).
- [ ] Revisión visual del usuario (corto + largo en 3 plantillas).

## 3. Fases futuras (no empezar hasta cerrar la §2)

### Fase F1 — Modelo de distribución por columnas (sin drag todavía)
- Introducir `ResumeLayout = { columns: { main: string[], sidebar: string[] } }` con IDs estables de sección (no títulos).
- Decidir y documentar: ¿`order` se elimina o se deriva de `columns`? Recomendación actual: `columns` pasa a ser la única fuente de orden; `order` se elimina o se deja como derivado en migración. Evitar doble fuente de verdad.
- Migración + backfill de CV existentes (`order` → `columns` según `layoutId` + plantilla), validación en los 4 ficheros del espejo, reglas: sin duplicados, sin IDs huérfanos, secciones ocultas (`visible=false`) permanecen en `columns` pero no se renderizan.
- UI sin drag: botones "subir / bajar / mover a otra columna" (esto además será el fallback accesible de la fase F2).
- Criterio: cambiar de plantilla 2col → 1col no pierde ni duplica secciones.

### Fase F2 — Integración de dnd-kit
- Instalar `dnd-kit` (verificar versión vigente, no mezclar generaciones de API antiguas/nuevas).
- Alcance: reordenar secciones (grip) + mover entre columnas. Opcional después: reordenar items dentro de sección (empleos, estudios).
- Reglas: IDs estables, guardar en Convex solo al `drop` (no por puntero), estado local optimista inmediato, validación de destino, informar + reintentar si falla el guardado, alternativa completa de teclado.
- Columnas = diseños predefinidos; prohibido posicionamiento arbitrario x/y y redimensionado libre en esta fase.
- Tests: mover entre columnas persiste tras recarga, funciona con ratón + teclado, sin duplicados.

### Fase F3 — Items reordenables + pulido (opcional)
- Reordenar elementos dentro de sección con `dnd-kit` (mismo patrón que F2).
- Evaluar `UndoRedo` solo local (complejo con autosave + Convex; fuera del MVP salvo diseño simple documentado).
- `ZoomControls` de vista previa si aporta valor (solo escala contenedor).

### Fase F4 — Evaluación de posicionamiento libre (hoy descartada)
- Idea original del usuario ("mover todo a gusto") aparcada por coste: paginación manual, doble motor pantalla/impresión, persistencia `x,y,w,h` por breakpoint, rotura ATS, móvil y accesibilidad.
- Condiciones para reconsiderarla: F1–F2 validadas con usuarios reales pidiendo más libertad, y spike en rama aparte que demuestre paridad PDF antes de comprometer arquitectura. Candidatos solo entonces: `react-grid-layout` u otro canvas. No instalar sin ese spike.

## 4. Decisiones diferidas y motivo

| Decisión | Estado | Motivo |
|---|---|---|
| `columns: {main, sidebar}` ahora | Diferida a F1 | Evita doble fuente de orden (`order` + `columns`) y migración prematura sin UI de drag. |
| `dnd-kit` ahora | Diferida a F2 | Minimizar errores: primero renderer + diseño + layout por selector. |
| `UndoRedo` en toolbar | Diferida a F3 | Choca con autosave/debounce/last-write-wins; definir solo local si se retoma. |
| `react-grid-layout` / canvas libre | Descartada salvo spike F4 | Rompe paginación A4, fidelidad PDF, ATS y accesibilidad. |
| Mermaid roto en `design.md:116` | Pendiente fase actual | Limpiar o eliminar el diagrama. |

## 5. Cómo retomar (instrucciones para el agente futuro)

1. Leer este archivo + `docs/design.md` + `docs/data-model.md` + `docs/implementation-plan.md`.
2. Verificar estado de la fase §2 (criterios de cierre). Si no está cerrada, terminarla antes de tocar F1.
3. Antes de F1: inspeccionar `types/resume.ts`, `lib/validation/resume.ts`, `convex/resumeModel.ts`, `lib/resume.ts`, `features/editor/EditorShell.tsx`, `features/templates/TemplateRenderer.tsx` y la ruta PDF. Los nombres pueden haber cambiado por el refactor de la §2; localizar los 4 componentes (toolbar, content, design, preview).
4. Ejecutar `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` antes de proponer cambios; no avanzar de fase con fallos críticos.
5. Para F1/F2, actualizar siempre los 4 ficheros del espejo + tests (`convex/resumes.test.ts`, tests de plantillas y de autosave) y documentar la migración en `docs/data-model.md`.
