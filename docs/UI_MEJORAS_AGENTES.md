# Plan de mejora de la interfaz — CV Studio / BuilderCV

Documento de trabajo para el grupo de agentes. Léelo entero antes de tocar código. Cada agente trabaja **solo** en su flujo (sección 4) y respeta la propiedad de archivos para evitar conflictos.

## 0. Reglas generales (obligatorias)

1. **Next.js 16.4 con cambios incompatibles.** Antes de escribir código de Next, lee la guía relevante en `node_modules/next/dist/docs/` (ver `AGENTS.md`). No des por buena la memoria de versiones anteriores.
2. **Idioma:** toda la UI y los comentarios en castellano de España, sin voseo ni argentinismos.
3. **No tocar la lógica de negocio.** Alcance: capa visual y estructura de componentes. Quedan fuera `convex/`, `lib/validation/`, `useAutosave`, `lib/resume-layout.ts`, y el renderizado de plantillas (`features/templates/*Template.tsx`, `shared.tsx`, `printCss.ts`, `printDocument.ts`). El PDF debe seguir idéntico a la vista previa.
4. **El documento A4 es siempre papel claro** (`.cv-doc`). Los tokens nuevos afectan solo al "chrome" de la aplicación, nunca al CV.
5. **Accesibilidad no negociable:** conservar roles/ARIA existentes, controles de teclado del arrastre (dnd-kit), foco visible, contraste mínimo 4,5:1 en claro y oscuro. No quitar `aria-label` ni `sr-only`.
6. **Cuádruple espejo del modelo** (`types/resume.ts`, `lib/validation/resume.ts`, `convex/resumeModel.ts`, `lib/resume.ts`): no se modifica en este plan. Si un cambio lo exigiera, parar y consultar.
7. **Verificación de cada entrega:** `npx tsc --noEmit`, `npm run lint`, `npm test` y `npm run build` en verde. Para cambios visibles, ejecutar `npm run test:e2e` (a11y, responsive, theme) y revisar a 360, 768 y 1280 px en claro y oscuro.
8. **Commits pequeños** por tarea, con mensaje en castellano. No mezclar flujos en un mismo commit.
9. Si hay duda entre dos opciones razonables, elegir la más simple y anotarla en la sección "Decisiones" del PR.

## 1. Diagnóstico (resumen)

- Base sólida: arquitectura limpia, accesibilidad cuidada, temas claro/oscuro, vista previa A4 fiel al PDF.
- Problemas: sin identidad visual (todo `zinc`, botón principal negro), ~228 usos de `zinc-*` repetidos, bloques de tarjeta y `<select>` copiados en varios archivos, editor con cabeceras apiladas, filas de sección con hasta 7 iconos, panel en lista sin miniaturas, landing escasa, fuente de la app anulada por Arial.

## 2. Orden y dependencias

```
A (tokens + fuente + primitivas UI)  ──►  B (editor)      ─┐
                                     ├──►  C (panel)       ├──► F (QA final)
                                     ├──►  D (landing/auth)─┤
                                     └──►  E (panel Diseño) ┘
```

- **A va primero y se fusiona antes que el resto.** B, C, D y E dependen de los tokens y primitivas.
- B, C, D y E pueden ir en paralelo cuando A esté fusionado.
- F (QA) se ejecuta al final.

## 3. Propiedad de archivos

| Flujo | Puede modificar | No puede tocar |
|---|---|---|
| A | `app/globals.css`, `app/layout.tsx`, `components/ui/*` (nuevos y existentes), `lib/utils.ts` | Resto de pantallas |
| B | `features/editor/EditorShell.tsx`, `EditorToolbar.tsx`, `ContentSidebar.tsx`, `SectionForm.tsx` (solo UI), `ResumePreview.tsx`, `components/Navbar.tsx` (ocultar en editor) | `useAutosave.ts`, lógica de layout |
| C | `features/resumes/ResumesPanel.tsx`, `components/DashboardSidebar.tsx`, `app/(dashboard)/**` | Editor |
| D | `app/page.tsx`, `app/(auth)/**`, apariencia de Clerk | Panel y editor |
| E | `features/editor/DesignSidebar.tsx`, `features/templates/TemplatePicker.tsx`, `TemplateThumbnails.tsx` | Renderizadores de plantillas |
| F | `e2e/**`, informes | Código de producción salvo correcciones triviales acordadas |

Si un flujo necesita un cambio en archivos de otro, lo pide por escrito (comentario en el PR) en vez de editarlo.

## 4. Flujos de trabajo

### A. Fundamentos: tokens, fuente y primitivas  *(prioridad 1, bloqueante)*

**A1. Corregir la fuente del cuerpo.**
En `app/globals.css`, el `body` fija `font-family: Arial, Helvetica, sans-serif`, lo que anula Geist. Cambiar a `var(--font-sans)` (ya declarado en `@theme inline`).
*Hecho cuando:* la app renderiza Geist; el CV no cambia (usa sus propias fuentes).

**A2. Tokens semánticos de color.**
Definir en `:root` y `.dark` variables y exponerlas en `@theme inline`: `background`, `foreground`, `card`, `card-foreground`, `muted`, `muted-foreground`, `border`, `input`, `ring`, `primary`, `primary-foreground`, `accent`, `destructive`, `success`.
- Elegir un color de marca (propuesta: azul-índigo sobrio; justificar la elección y comprobar contraste en ambos temas).
- `primary` sustituye al negro actual del botón principal.
*Hecho cuando:* los tokens existen, son documentados con un comentario y pasan contraste 4,5:1 para texto sobre cada fondo.

**A3. Primitivas reutilizables** en `components/ui/`:
- `card.tsx` (`Card`, `CardHeader`, `CardContent`) que sustituya el patrón repetido `rounded-xl border border-zinc-200 bg-white … dark:…`.
- `select.tsx` (envoltorio estilado del `<select>` nativo; mismo aspecto que `Input`).
- `dropdown-menu.tsx` accesible para el menú "⋯" (valorar Radix `react-dropdown-menu`; si se añade dependencia, justificarla en el PR). Debe funcionar con teclado (flechas, Esc, foco devuelto al disparador).
- `toast` ligero (una sola implementación) con acción opcional ("Deshacer") y `role="status"`.
- `skeleton.tsx`.
- Actualizar `button.tsx` e `input.tsx` para usar los tokens (mantener la API actual para no romper llamadas).

**A4. Migración mecánica de `zinc-*` a tokens** en `components/` (solo los compartidos: `Navbar`, `ThemeToggle`, `DashboardSidebar`, `ui/*`). Los flujos B–E migran sus propios archivos.
*Hecho cuando:* no quedan clases `zinc-*` en los archivos del flujo A y ninguna variante `dark:` faltante (p. ej. `border-zinc-100` sin pareja oscura en `SectionForm`, que corrige B).

---

### B. Editor  *(depende de A)*

**B1. Una sola barra superior en el editor.**
- Ocultar la `Navbar` global en `/editor/*` (por segmento de ruta, p. ej. mediante layout de la ruta o comprobación de `usePathname`; elegir la opción más simple compatible con Next 16).
- La barra del editor reúne: volver, título editable, estado de guardado, zoom, tema, botón PDF y avatar (`UserButton`).
- *Hecho cuando:* se gana al menos ~56 px de alto útil y el flujo de guardado/reintento no cambia.

**B2. Zoom compacto en la vista previa.**
Sustituir los tres botones (75/100/125 %) por un control −, valor, +, y "Ajustar". Mantener `aria-pressed`/etiquetas accesibles y el rango actual como mínimo.

**B3. Filas de sección simplificadas** (`ContentSidebar.tsx`, `SortableRow`).
- Visibles siempre: asa de arrastre, título, ojo (mostrar/ocultar).
- Menú "⋯" con: Subir, Bajar, Mover a columna lateral/principal, Eliminar.
- Sustituir el "pulsa de nuevo para confirmar" de eliminar por **toast con "Deshacer"** (restaurar sección y su posición en el layout; usar los helpers existentes, sin modificar `lib/resume-layout.ts`; si no hay forma limpia, parar y consultar).
- Conservar el arrastre por teclado y todas las etiquetas `aria-label` existentes (ahora dentro del menú).
- *Hecho cuando:* a 380 px el título de la sección es legible en la mayoría de casos y los tests e2e de a11y siguen verdes.

**B4. Aviso de errores de validación.**
Reemplazar el texto rojo suelto (`validationError`) por un banner/toast visible con enlace/foco a la sección con errores.

**B5. Móvil.**
Pasar de 2 pestañas a una barra inferior fija: Editar · Diseño · Vista previa · PDF. Respetar áreas seguras (`env(safe-area-inset-bottom)`).

**B6. Deshacer/rehacer (opcional, solo si B1–B5 están cerrados).**
Pila local de estados del editor (contenido, diseño y layout) con atajos Ctrl/Cmd+Z y Mayús+Z. No interferir con el autoguardado: documentar cómo se integra y pedir revisión antes de fusionar.

---

### C. Panel (dashboard)  *(depende de A)*

**C1. De lista a cuadrícula de tarjetas** (`ResumesPanel.tsx`).
Cada tarjeta: miniatura del CV (reutilizar `TemplateThumbnails` o renderizar el documento escalado en solo lectura; elegir lo más ligero), título, nombre de plantilla, fecha de modificación.
- Acción principal: "Editar" (toda la tarjeta navega).
- Resto de acciones en menú "⋯": Duplicar, Archivar/Desarchivar, Eliminar.
- Eliminar con diálogo de confirmación accesible o toast con "Deshacer" (coherente con B3).

**C2. Crear CV.**
Tarjeta "+ Nuevo CV" dentro de la cuadrícula que abre un diálogo con nombre y selección visual de plantilla (miniaturas). Mantener la validación `resumeTitleSchema`.

**C3. Estado vacío y carga.**
- Texto orientado al usuario (sin "contenido vacío válido…") y botón claro "Crear mi primer CV".
- Esqueletos (`Skeleton`) en lugar de "Cargando…".

**C4. Barra lateral del panel** (`DashboardSidebar.tsx`).
Botón primario "Nuevo currículum" arriba (no un enlace ancla que nunca está activo). Eliminar los rótulos de grupo si quedan solo 3–4 enlaces. Conservar `aria-current` y el comportamiento en móvil.

---

### D. Landing y acceso  *(depende de A)*

**D1. Landing** (`app/page.tsx`).
- Héroe con vista previa real de un CV (miniaturas existentes) junto al título.
- Tres puntos de valor: plantillas, PDF A4 idéntico a la vista previa, autoguardado.
- Retirar el texto "Empieza gratis en local" y similares de entorno de desarrollo.
- CTA principal según sesión (usar `Show` de Clerk como en `Navbar`).

**D2. Marca.**
Decidir un único nombre (hoy "CV Studio" en la UI y "BuilderCV" en repo/documentos). Proponer nombre y logotipo sencillo (SVG) y centralizarlos en un componente `Brand`. **Confirmar con el responsable del producto antes de cambiar el nombre visible.**

**D3. Clerk.**
Configurar `appearance` de Clerk con los tokens para que `SignIn`/`SignUp`/`UserProfile` respeten el tema oscuro y la marca; si no es posible por completo, documentar el límite.

---

### E. Panel de Diseño  *(depende de A)*

**E1. Secciones plegables y ordenadas:** Plantilla · Color y tipografía · Distribución · Tamaño y espaciado. Estado abierto/cerrado recordado en memoria (no en `localStorage` sin `try/catch`).

**E2. Distribución:** sustituir las dos tarjetas de texto por dos opciones con icono/miniatura (una y dos columnas) y etiqueta corta; mantener `role="radiogroup"`.

**E3. Deslizadores:** añadir campo numérico pequeño junto a cada `Slider` para precisión (con `clamp` a los límites de `DESIGN_LIMITS`).

**E4. "Restablecer diseño":** pedir confirmación o ofrecer "Deshacer" en toast, ya que descarta todos los ajustes.

**E5.** Sustituir el `<select>` de tipografía y los bloques tarjeta por las primitivas de A3.

---

### F. QA final  *(al terminar B–E)*

1. `tsc`, `lint`, `test`, `build` y `test:e2e` en verde.
2. Ampliar `e2e/a11y.spec.ts` (axe) para cubrir: editor (pestaña Contenido y Diseño), panel con tarjetas, menú "⋯" abierto y landing, en claro y oscuro.
3. Ampliar `e2e/responsive.spec.ts`: sin desbordamiento horizontal a 360 px en landing, panel y editor.
4. Comprobar contraste en modo oscuro de todos los textos secundarios (sustituyen a `text-zinc-400`).
5. Probar manualmente: arrastre con ratón, táctil y teclado; deshacer de eliminación; exportar PDF de las 6 plantillas en 1 y 2 columnas y comprobar que **no cambia** respecto a antes.
6. Informe final: lista de cambios, capturas antes/después (claro/oscuro, escritorio/móvil), decisiones tomadas y deuda pendiente.

## 5. Criterios de aceptación globales

- [ ] La app usa Geist y un color de marca coherente en claro y oscuro.
- [ ] No quedan colores `zinc-*` sueltos en los archivos migrados; todo pasa por tokens.
- [ ] El editor tiene una única barra superior y filas de sección con menú "⋯".
- [ ] Eliminar secciones y CV es reversible (toast "Deshacer") o confirma con diálogo accesible.
- [ ] El panel muestra tarjetas con miniatura y creación guiada por plantilla visual.
- [ ] La landing muestra el producto real y no contiene texto de entorno de desarrollo.
- [ ] El PDF de cualquier plantilla es idéntico al previo a estos cambios.
- [ ] Sin regresiones en tests unitarios, e2e ni accesibilidad.

## 6. Fuera de alcance

Canvas libre, `react-grid-layout`, cambios en el modelo de datos o en Convex, nuevas plantillas, cambios en el motor de PDF, temas de color múltiples para el usuario (solo claro/sistema/oscuro).

## 7. Formato de entrega de cada agente

Cada PR o entrega incluye: qué tareas (A1, B3…) cubre, archivos tocados, resultado de los comandos de verificación, capturas si hay cambio visual y una sección "Decisiones" con cualquier elección no trivial.
