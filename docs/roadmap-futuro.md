# Roadmap futuro — Editor BuilderCV / CV Studio

**Fecha:** 2026-10-11 · **Estado:** F1 y F2 implementadas y verificadas (ver sesión de cierre abajo); pendientes F3 (opcional), E2E y despliegue. Este documento es la constancia para retomar el proyecto.

## Sesión 2026-10-11 (cierre): avance y próxima sesión

Hecho en esta sesión (todo verificado: tsc 0, lint 0, 49/49 tests, build OK, push Convex OK):
- F1: `ResumeLayout {main, sidebar}` persistido (fuente de verdad de columna y orden), derivación para CV antiguos, `assertLayout` en servidor, `duplicate` remapea IDs, sidebar agrupada con botones →/←.
- F2: dnd-kit (core 6 + sortable 10) solo en el sidebar — asa por fila, drop en columna y entre columnas, sensores ratón/táctil/teclado; flechas como fallback; preview intacto.
- Fijado guardado en bucle (2 causas): `order` no sincronizado en local + comparación `JSON.stringify` sensible al orden de claves → `lib/compare.ts` canónica + `commitLayout` atómico.
- Antes: 6 plantillas (lateral, elegante rediseñada, mínima) con `<select>` nativo, editor en 2 zonas (panel Contenido/Diseño + preview sticky), diseño visual (tamaño/margen/espaciado, 1–2 columnas), script `npm run convex:push`.

Próxima sesión (en orden):
1. Verificación manual: arrastre con ratón/táctil/teclado ✅ y estabilidad de "Guardado" al mover/añadir ✅ (verificados por el usuario 2026-10-11). Pendiente: PDF de las 6 plantillas en 1–2 columnas.
2. F3 implementada y verificada por el usuario (arrastre de elementos + filas compactas colapsables con resumen, auto-expand y aviso de errores). Extra 2026-10-11: secciones con muchos elementos — contador, expandir/contraer todas y filtro por texto (ignora tildes y mayúsculas, aparece con 5+).
3. Diseño (2026-10-11, pendiente verificación manual): `lineHeight` (1.2–1.7), `headingSize` (compacto/normal/grande, zoom proporcional en titulares), `sidebarWidth` (25–40 % en dos columnas) con espejo x4 + `assertDesign`; estilo raíz centralizado (`docRootStyle` + vars `--cv-leading/--cv-heading` en pantalla e impresión); paleta de 8 acentos + color personalizado; restablecer diseño (conserva plantilla); selector de plantillas con miniaturas reales.
4. E2E completa tras los cambios + despliegue.
5. Navegación (2026-10-11, pendiente revisión visual): navbar global (marca, tema, sesión) + sidebar del panel (Mis CV, Archivados, Nuevo, Mi cuenta); archivar/desarchivar en el panel; página de cuenta con UserProfile. Tarjetas de Clerk quedan en claro.
6. Vista previa auto-ajustada al ancho (2026-10-11, verificado a 360 px sin desborde): `ResumePreview` mide su contenedor (`ResizeObserver`) y escala la hoja A4 de forma uniforme; zoom de usuario y tamaño de fuente multiplican; el PDF no cambia.
7. Foto del candidato (2026-10-11, pendiente verificación manual): `photoStorageId` + Convex Storage, subida con redimensión, foto en moderna/lateral/elegante/compacta (clásica y mínima la omiten), PDF con espera de imagen, borrado en cascada.
6. Temas claro/oscuro/sistema (2026-10-11, pendiente revisión visual): `next-themes` (clase `.dark`, sin FOUC), variante `dark` CSS-first, conmutador en landing/panel/editor; documento siempre en papel claro. Tarjetas de Clerk quedan en claro (limite documentado).
7. [FUTURO] Temas de colores: `next-themes` admite N temas; migrar el chrome de `zinc-*` fijo a tokens semánticos (`bg-background`, `text-foreground`, `bg-card`, `border-border`…) y definir un bloque de variables por tema. El documento sigue en papel claro. Opcional: persistir el tema por usuario en Convex.
8. F4 solo con spike previo (canvas libre sigue descartado).
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

### Fase F1 — Modelo de distribución por columnas (implementada 2026-10-11)
- `ResumeLayout = { main: string[], sidebar: string[] }` persistido (fuente de verdad de columna y orden; `order` sincronizado como higiene).
- CV antiguos sin layout se derivan por tipo sin sorpresas visuales; `healLayout` sanea en cada render y al guardar.
- UI sin drag: subir/bajar dentro de columna + botones →/← entre columnas (es el fallback accesible de F2). Sidebar agrupada Principal/Lateral.
- Servidor: `layout` opcional en esquema, `assertLayout` (sin duplicados, total, IDs conocidos), `duplicate` remapea IDs.
- Verificado: tsc 0, lint 0, 45/45 tests, build OK, push Convex OK.

### Fase F2 — Integración de dnd-kit (implementada 2026-10-11)
- `@dnd-kit/core 6 + sortable 10` (compatibles con React 19) solo en el sidebar; la vista previa sigue siendo de solo lectura.
- Asa de arrastre por fila (el resto de botones intactos), soltado dentro de la columna y entre columnas (incluidas columnas vacías), sensores ratón (distancia) + táctil (retardo para no robar scroll) + teclado (Espacio + flechas).
- Las flechas y →/← quedan como alternativa accesible. Guardado solo al soltar (vía `onLayoutChange` → `commitLayout` → autoguardado con debounce).
- Verificado: tsc 0, lint 0, 49/49 tests, build OK, push Convex OK. Pendiente: prueba manual con ratón, táctil y teclado.

### Fase F3 — Items reordenables + pulido (implementada 2026-10-11)
- Reordenar elementos dentro de sección con `dnd-kit` (mismo patrón que F2): asa por tarjeta en `SectionForm`, sensores ratón/táctil/teclado, flechas ↑/↓ como alternativa accesible, guardado vía `onChangeContent` → autoguardado existente.
- Helper puro `moveItemToIndex` en `lib/resume.ts` (misma semántica que `moveSectionToIndex`) + test; `moveItem` por flechas reutiliza el helper.
- Verificado: tsc 0, lint 0, 50/50 tests, build OK, push Convex OK. Pendiente: prueba manual con ratón, táctil y teclado.
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
