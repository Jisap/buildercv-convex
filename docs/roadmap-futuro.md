# Roadmap futuro — Editor BuilderCV / CV Studio

**Nota (2026-10-13):** `docs/ROADMAP_AGENTES.md` es desde hoy la fuente de
verdad del plan (oleadas B0–Final). Este archivo queda como histórico de las
sesiones 2026-10-11/12; su punto D (QA manual) sigue vigente como lista de
comprobación hasta que T1/T2 lo automaticen.

**Fecha:** 2026-10-12 · **Estado:** serie UI + ronda 2 + 3 plantillas nuevas (9 en total) en verde (66/66 tests, e2e 50/50); pendiente QA manual consolidada.

## Sesión 2026-10-13 — oleadas B0–T2 ✅ (comiteado, todo en verde)

Serie ejecutada secuencialmente (decisión del responsable: eficiencia sobre
paralelo; despliegue aparcado al final):

| Tarea | Commit | Estado |
|---|---|---|
| B0 línea base + H1 higiene (`proxy.ts`, docs) | `5bca3f0` | ✅ |
| Auth por recurso (fin de `createRouteMatcher`) | `2a7106b` | ✅ |
| F1 enlaces clicables en 9 plantillas + PDF | `441360e` | ✅ |
| S1 fotos en servidor (`attachPhoto`, tope, cron) | `e04bdf5` | ✅ |
| S2 tope 30 CV por usuario | `c3452ea` | ✅ |
| S3 PDF robusto (cola, tasa, timeout, aviso) | `2b7e217` | ✅ |
| T1 matriz paridad 72 celdas + 9 capturas | `ae97412` | ✅ |
| T2 E2E con sesión (tickets) + fix recarga editor | `3d1ee38` | ✅ |

Verificación: tsc 0, lint 0, **90 unit**, **50 e2e base + 8 con sesión**,
**81 paridad**, build OK, Convex en sync (`ardent-shrimp-95`).
Hallazgos: `delete + throw` no borra (`_storage` es transaccional);
Chromium sí emite anotaciones `/Link` (F1 verificado); recarga del editor
rota 3/3 (queries sin gate → corregido con `<Authenticated>`).
Decisiones humano: H-1…H-3/H-6 por defecto (30 CV, 6 PDF/min, 5 MB,
jpeg/png/webp, 24 h, 20 subidas/día); archivados cuentan para el tope;
**R1 diferido** (ver abajo).

## Próxima sesión (orden propuesto)

### A. Landing page real ✅ HECHA 2026-10-12 (flujo D, `eba91b5`)
1. Hecho: héroe + 3 puntos de valor + mosaico de plantillas (miniaturas reales en solo lectura, hoy 9) + CTA por sesión. Sin pie ni “cómo funciona” (no se pidieron en el plan UI).
2. Responsive + oscuro desde el primer día; E2E axe/responsive ampliadas en F.
3. Criterio: cumplido salvo pie (diferido).

### B. Ampliar themes ✅ BASE HECHA 2026-10-12 (flujo A, `6bd8625`)
1. Hecho: chrome migrado de `zinc-*` a 16 tokens semánticos; documento intacto (papel claro).
2. Pendiente: 2–3 temas de color (hoy solo claro/oscuro/sistema + marca índigo única).
3. Pendiente (opcional): persistir el tema por usuario en Convex.
4. Criterio: lint/tsc/tests/E2E en verde ✅; revisión visual manual pendiente.

### C. Vista previa en “Mis currículums” ✅ HECHA 2026-10-12 (flujo C, `6f5fa14`)
1. Hecho: miniatura real por CV (mismo renderizador escalado, `memo`, clic → editor).
2. Coste vigilado con `memo`; sin regresión medida (listas típicas).
3. Decisión: foto omitida en miniatura (el listado no trae URLs firmadas); editor y PDF sí la muestran.
4. Criterio: pendiente revisión visual con CV reales.

### D. QA manual consolidada (verificada 2026-10-15: H1–H7 ✅, G4 aparcada)
1. PDF de las 9 plantillas en 1–2 columnas (corto + largo). Ojo a las 3 nuevas: hilos de la línea de tiempo y barras (técnica), banda oscura con texto blanco (ejecutiva), bloque de acento y anillo de foto (enérgica). ✅ 2026-10-15 (más paridad auto 81/81 en verde).
2. Foto: subida, 6 plantillas que la muestran (moderna, lateral, elegante, compacta, enérgica, ejecutiva), PDF con/sin foto, duplicado y borrado. Clásica, mínima y técnica la omiten por diseño. ✅ 2026-10-15.
3. Temas: recorrer landing (mosaico de 9), panel + editor en claro/oscuro/sistema. ✅ 2026-10-15.
4. Navegación: navbar, sidebar, archivados, cuenta. ✅ 2026-10-15.
5. Preview auto-ajustada en móvil real + ventana estrecha en desktop. ✅ 2026-10-15.
6. Nuevo: arrastre ratón/táctil/teclado tras B, deshacer de sección/diseño, editor a 380 px, tarjetas del panel a 360 px. ✅ 2026-10-15. Incluye pestaña Compatibilidad (ATS Capa 1) con nivel, «Ir a la sección» y fixes.
7. Medición G4 con ~30 CVs (primer pintado del panel y nodos DOM, antes/después). Requiere datos reales con sesión. **Aparcada por decisión del responsable (2026-10-15).**
Extra 2026-10-15: fix flaky E2E PDF 401 (`page.request` en vez de fixture `request`; el JWT de Clerk rota cada ~60 s). Commit `3d5d177`; 59/59 e2e en verde.

### E. Lo que falta (no olvidar, próxima sesión)
1. **Despliegue:** hosting con Node por Chromium/PDF (`docs/deployment.md`); Vercel serverless sigue descartado sin alternativa de render.
2. **E2E autenticada:** ✅ HECHA 2026-10-13 (T2, `3d1ee38`): tickets por Backend API, 8 specs, 3 pasadas seguidas. Necesita `E2E_CLERK_EMAIL` + `CLERK_SECRET_KEY` en `.env.local`; sin ellas se salta en silencio.
3. **R1: DIFERIDO por decisión conjunta 2026-10-13.** El editor es grande pero estable y cubierto (90/58+8/81); el refactor solo se pagará con el primer cambio de producto que toque el editor (P4/P6/P7/P8). No hacerlo preventivo.
4. **Oleada 4 (producto, con usuarios tras despliegue):** P1 importar, P2 IA, P3 compartir por enlace, P4 numeración PDF, P5 temas, P6 recorte foto, P7 undo/redo, P8 distribuciones. Sin empezar sin confirmación de prioridad.
5. **F4:** canvas libre como experimento futuro (vías A→B→C, §3); sin tocar el modelo hasta tener señal de usuarios reales.
6. **Menores diferidos:** Undo/redo local (B6, opcional), recorte manual de foto, persistir el tema por usuario en Convex (opcional), 2–3 temas de color (hoy claro/oscuro/sistema + marca única).
7. **Higiene docs:** ✅ HECHA (`data-model.md` corregido + tabla `uploads`; `deployment.md` y `setup-convex-clerk.md` al día con proxy/auth por recurso y T2).
8. **QA manual con sesión (D.2 + S1/S3, ojo humano):** foto (subir/sustituir/borrar, 6 plantillas que la muestran), pinchar enlaces en un PDF real, matar Chromium y comprobar recuperación, carga de PDF concurrente, aviso 429. Revisar `CV_STUDIO_AGENT_BRIEF.md`: existe en disco pero está en `.gitignore` (decidir: mover a `docs/` o quitar la referencia del README).
9. **G3 hecha (2026-10-12, `adfed5f`):** primitivos `dropdown-menu`/`toast` con identificadores en inglés (`ToastData`, `dismissToast`, `setOpen`, `triggerRef`…); textos visibles intactos en castellano. Alcance: los dos primitivos + las 2 llamadas a `toast()`; los diálogos propios del panel quedan como están.

### F. Regla operativa: backend y frontend van juntos
Todo cambio en `convex/` **o en sus imports** (`features/templates/types.ts`, `lib/*`, etc.) exige `npm run convex:push` (`convex dev --once`) antes de dar por buena la funcionalidad. Sin push, el despliegue (`ardent-shrimp-95`) corre código antiguo y el guardado falla con errores engañosos — 2026-10-12: las 3 plantillas nuevas daban «Plantilla desconocida» (`assertDesign` en `convex/resumes.ts:53`) hasta el push. Regla para el agente futuro: tras tocar el backend, push + re-verificación manual del guardado con sesión.

## Ronda 2 — correcciones (2026-10-12, `docs/UI_REVISION_Y_QA_AGENTES.md`)

Hecho y verificado (typegen+tsc 0, lint 0, 63/63 tests, build OK, e2e 50/50):
- G1 (`4861df6`): `PhotoUploader` sin `zinc-*` ni `red-*`, solo tokens.
- G2 (`5f8b280`): botón de zoom «Ajustar» → «100 %» (sin `aria-pressed`; la vista previa ya auto-escala al ancho).
- G4 (`b4b791f`): miniaturas del panel con `IntersectionObserver` (`rootMargin` 200 px) y recuadro `h-40` de reserva; `memo` intacto. Medición con 30 CVs pendiente de QA manual (requiere datos reales con sesión).
- G5 (`2e80c0c`): `overflow-hidden` movido de la tarjeta al enlace (el menú ya no se recorta); PDF de la barra superior oculto en `< md` (queda el de la inferior); `DropdownMenuContent` encadena su `onKeyDown` con el del consumidor.
- Pendiente: QA manual H1–H7 e informe final (I).

## Plantillas nuevas (2026-10-12: enérgica, técnica, ejecutiva)

Receta verificada (sin migraciones): `XTemplate.tsx` con el contrato (`partitionForLayout`, `docRootStyle`, ganchos `cv-*`, estructura en estilos en línea para que viaje al PDF) + alta en `TEMPLATES` y `TemplateRenderer`. La allowlist del servidor, miniaturas, picker y panel entran solas desde el registro.
- Enérgica (`8d1e13c`): cabecera asimétrica con bloque de acento, foto con anillo, píldoras. No ATS.
- Técnica (`0f856f2`): línea de tiempo, barras con texto de nivel, monoespaciada, secciones numeradas. Sin foto.
- Ejecutiva (`7911137`): banda oscura (`cv-band` reutilizada) con foto y filete en acento, cuerpo sobrio.
- Tests 66/66 (lista de IDs + bucle de contenido + foto + 3 tests propios). Sin cambios en `printCss` (todo viaja en línea o con ganchos existentes).
- Pendiente: QA visual tuya (corto+largo, 1–2 columnas, con/sin foto) y PDFs reales de las 3; la matriz de `docs/pdf-testing.md` ya las incluye.

## Sesión 2026-10-12 (cierre serie UI): avance y próxima sesión

Hecho en esta sesión (todo verificado: tsc 0, lint 0, 63/63 tests, build OK, E2E 50/50):
- A (`6bd8625`): fuente Geist, 16 tokens semánticos (marca índigo, contrastes medidos 4,6–12,9), primitivas `card/select/dropdown-menu/toast/skeleton`, `button/input` a tokens, chrome compartido sin `zinc-*`, `<Toaster/>` en el layout.
- B (`fd275fd`): Navbar oculta en `/editor`, toolbar única fija (volver, título, guardado, PDF, tema, avatar), zoom compacto, filas con menú ⋯, borrado con Deshacer, banner de validación con Revisar, barra inferior móvil.
- C (`6f5fa14`): panel en cuadrícula con miniatura real, tarjeta Nuevo CV con diálogo visual, vacío sin jerga, esqueletos, sidebar con botón primario, borrado con diálogo nativo.
- D (`eba91b5`): landing con héroe real + CTA por sesión, `Brand` centralizado, Clerk con la marca (variables v7).
- E (`e3d86d9`): Diseño plegable en 4 secciones, distribución con iconos, numérico con `clamp`, restablecer con Deshacer, `Select` y tokens.
- F (`022a795`): axe en claro+oscuro (rutas públicas + tarjetas Clerk), 360 px sin desborde, espera a `Clerk.loaded`; insignia «Secured by Clerk» excluida del análisis (marca de terceros, contraste 3,33, sin API para corregirla).
- Fix (`10fd8fe`): tinta explícita en el desplegable del avatar en oscuro (heredaba el blanco del `body`).

Decisiones (ver plan en `docs/UI_MEJORAS_AGENTES.md`): nombre visible «CV Studio» (confirmado 2026-10-12); diálogo nativo para borrar CV (recrear cambiaría el ID); sin dependencias nuevas (menú y toast propios); plantillas excluidas de la migración (son papel, no chrome).

Próxima sesión (deuda): QA manual del punto D de arriba, E2E autenticada, despliegue Node para PDF, avisos `middleware→proxy` y `createRouteMatcher`, higiene de `docs/data-model.md`.

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

### Fase F4 — Evaluación de posicionamiento libre (decisión 2026-10-12: experimento futuro, sin tocar el modelo)
- Idea original del usuario ("mover todo a gusto") aparcada por coste: paginación manual, doble motor pantalla/impresión, persistencia `x,y,w,h` por breakpoint, rotura ATS, móvil y accesibilidad.
- Invariante que lo bloquea: **preview = print** (mismo renderizador, mismo HTML/CSS, Chromium). La edición libre lo ataca por cinco flancos: paginación manual, segundo motor de impresión (se pierde texto seleccionable/ATS), orden de lectura DOM vs visual, espejo x4 con geometría por breakpoint, y arrastre 2D en táctil/teclado.
- Vías ordenadas por coste: **A. libertad contenida** (más `layoutId` predefinidos y variantes de cabecera; riesgo cero sobre el invariante) → **B. decoraciones libres** (marcas/insignias sin mover el contenido) → **C. canvas real** (`react-grid-layout` o 2D propio).
- Condiciones para C: spike en rama aparte que demuestre paridad preview≈PDF (texto extraído idéntico, sin cortes, ATS preservado) antes de comprometer arquitectura. Hasta que las plantillas nuevas + la vía A se queden cortas con usuarios reales, no se toca el modelo.

## 4. Decisiones diferidas y motivo

| Decisión | Estado | Motivo |
|---|---|---|
| `columns: {main, sidebar}` ahora | Diferida a F1 | Evita doble fuente de orden (`order` + `columns`) y migración prematura sin UI de drag. |
| `dnd-kit` ahora | Diferida a F2 | Minimizar errores: primero renderer + diseño + layout por selector. |
| `UndoRedo` en toolbar | Diferida a F3 | Choca con autosave/debounce/last-write-wins; definir solo local si se retoma. |
| `react-grid-layout` / canvas libre | Experimento futuro (F4) | Vías A→B→C; spike con paridad PDF demostrada antes de tocar el modelo. |
| Mermaid roto en `design.md:116` | Pendiente fase actual | Limpiar o eliminar el diagrama. |

## 5. Cómo retomar (instrucciones para el agente futuro)

1. Leer este archivo + `docs/design.md` + `docs/data-model.md` + `docs/implementation-plan.md` (+ `docs/UI_REVISION_Y_QA_AGENTES.md` si hay QA pendiente).
2. Verificación base antes de proponer cambios: `npx next typegen && npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`. No avanzar con fallos.
3. Ante cualquier cambio de modelo o validación, actualizar el espejo completo (`types/resume.ts` + `lib/validation/resume.ts` + `convex/resumeModel.ts` + `lib/resume.ts`) + tests y `docs/data-model.md`.
4. Tras tocar `convex/` o sus imports: `npm run convex:push` (ver §F) + reverificación del guardado con sesión.
5. Plantilla nueva: seguir la receta de «Plantillas nuevas (2026-10-12)» + QA visual (corto+largo, 1–2 columnas, con/sin foto) y PDFs reales.
6. Invariante intocable salvo spike F4: **preview = print** (mismo renderizador, estilos estructurales en línea o ganchos `cv-*`; el documento siempre en papel claro).
