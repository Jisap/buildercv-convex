# Ronda 2 — Correcciones y QA de la interfaz (CV Studio)

Continuación de `docs/UI_MEJORAS_AGENTES.md`. La ronda 1 (flujos A–F) está implementada: `tsc`, lint y 63 tests unitarios pasan. Esta ronda cierra los fallos detectados en la revisión y reparte la QA manual que falta. Léelo entero antes de tocar código.

## 0. Reglas (las mismas de la ronda 1, más estas)

1. **Next.js 16.4 con cambios incompatibles:** antes de escribir código de Next, lee la guía relevante en `node_modules/next/dist/docs/` (ver `AGENTS.md`).
2. **UI y comentarios en castellano de España.** Código nuevo con identificadores en inglés (convención del repo), salvo decisión contraria en la tarea G3.
3. **No tocar:** `convex/`, `lib/validation/`, `useAutosave`, `lib/resume-layout.ts`, renderizadores de plantillas (`features/templates/*Template.tsx`, `shared.tsx`), `printCss.ts`, `printDocument.ts`. El PDF no puede cambiar.
4. El documento A4 (`.cv-doc`) es siempre papel claro; los tokens afectan solo al chrome.
5. **Accesibilidad no negociable:** foco visible, contraste mínimo 4,5:1 en claro y oscuro, ARIA y `aria-label` existentes intactos.
6. **Verificación de cada entrega:** `npx next typegen && npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`. Nota: `tsc` sin `next typegen` falla con `Cannot find name 'LayoutProps'`; no es un error real.
7. Commits pequeños, uno por tarea, mensajes en castellano.
8. Cada tarea declara qué archivos toca. Si necesitas tocar otro, pídelo por escrito en el PR.

## 1. Orden

```
G1, G2, G4, G5 (independientes, en paralelo)
G3 (decisión de nomenclatura) ─ solo si se aprueba; va al final de las correcciones
        │
        ▼
H (QA manual, repartida) ─► I (informe final)
```

## 2. Correcciones

### G1. Terminar la migración a tokens  *(archivo: `features/editor/PhotoUploader.tsx`)*
- Sustituir las 5 clases `zinc-*` por tokens (`border-border`, `bg-card`, `text-muted-foreground`, etc.).
- El mensaje de error (`text-red-600 dark:text-red-400`) pasa a `text-destructive`.
- **Hecho cuando:** `grep -n "zinc-\|red-[0-9]\|green-[0-9]" features/editor/PhotoUploader.tsx` no devuelve nada, y se ve bien en claro y oscuro (estado vacío, con foto, error).

### G2. Botón "Ajustar" del zoom  *(archivo: `features/editor/EditorShell.tsx`, y `ResumePreview.tsx` solo si es imprescindible)*
Hoy "Ajustar" solo vuelve al 100 % y la vista previa ya se auto-escala al ancho, así que el nombre engaña.
- Opción preferida: renombrarlo a **"100 %"** (y quitar `aria-pressed` si no aporta).
- Opción alternativa: hacer que ajuste de verdad al alto o ancho disponible. Solo si no complica `ResumePreview`.
- Elegir una y anotarla en "Decisiones".
- **Hecho cuando:** la etiqueta describe lo que hace el botón y los tests e2e de zoom (si existen) siguen verdes.

### G3. Nomenclatura de los primitivos nuevos  *(OPCIONAL: pedir confirmación al responsable antes de empezar)*
Los componentes nuevos usan identificadores en español (`fijarAbierto`, `alPulsar`, `DatosAviso`, `descartarAviso`…), mientras el resto del repo usa inglés en el código y castellano en los textos.
- Si se aprueba: renombrar a inglés en `components/ui/dropdown-menu.tsx` y `components/ui/toast.tsx`, y actualizar todos los usos (`EditorShell`, `DesignSidebar`, `ResumesPanel`…). Mantener los textos visibles en castellano.
- Si no se aprueba: no hacer nada y dejar constancia en el roadmap.
- **Hecho cuando:** `tsc`, lint y tests en verde, y `grep` no encuentra los nombres antiguos.

### G4. Rendimiento de las miniaturas del panel  *(archivo: `features/resumes/ResumesPanel.tsx`)*
Cada tarjeta monta un `TemplateRenderer` completo con `zoom: 0.22`. Con muchos CVs puede notarse.
- Renderizar la miniatura solo cuando la tarjeta entra en el viewport (`IntersectionObserver`), con un recuadro vacío del mismo tamaño mientras tanto para no provocar saltos de maquetación.
- Mantener `memo` y que no se renderice el documento completo fuera de pantalla.
- Medir antes y después con 30 CVs de prueba (tiempo hasta primer pintado del panel y nº de nodos DOM) y anotar los números en el PR.
- **Hecho cuando:** la mejora es medible y las miniaturas siguen igual a la vista del usuario.

### G5. Robustez del menú "⋯" y barra móvil  *(archivos: `components/ui/dropdown-menu.tsx`, `features/resumes/ResumesPanel.tsx`, `features/editor/EditorShell.tsx`)*
1. **Menú dentro de tarjetas con `overflow-hidden`:** hoy cabe justo y se cortaría si la tarjeta se hace más baja o el menú gana una acción. Solución: que la tarjeta no recorte el menú (mover `overflow-hidden` solo a la miniatura y a las esquinas redondeadas) o renderizar el contenido del menú en un portal. Probar con tarjeta a 360 px.
2. **"PDF" duplicado en móvil:** aparece en la barra superior y en la inferior. En pantallas `< md`, ocultar el de la barra superior y conservar el de la inferior (en `md+` se mantiene el de arriba).
3. En `DropdownMenuContent`, el `onKeyDown` propio se pisa si el consumidor pasa su `onKeyDown` (`{...props}` va después). Encadenar ambos manejadores en vez de sobrescribir.
- **Hecho cuando:** el menú se ve completo en cualquier tarjeta, "PDF" aparece una sola vez en cada ancho, y los tests de a11y siguen verdes.

## 3. QA manual (H)

Las pruebas se hacen con un CV **corto** (1 página) y uno **largo** (3+ páginas con experiencias extensas), con y sin foto. Cada fila se marca ✅/❌ y, si falla, se adjunta captura y pasos.

### H1. PDF  *(el criterio más importante: no debe haber cambiado respecto a antes de la ronda 1)*

| Plantilla | 1 col. corto | 1 col. largo | 2 col. corto | 2 col. largo | Con foto | Sin foto |
|---|---|---|---|---|---|---|
| Clásica | | | | | n/a | |
| Moderna | | | | | | |
| Compacta | | | | | | |
| Elegante | | | | | | |
| Mínima | | | | | n/a | |
| Lateral | | | | | | |

Para cada celda comprobar: la vista previa y el PDF coinciden (tipografías, color de acento, márgenes, espaciado); no hay cortes dentro de una entrada de experiencia; no hay páginas en blanco; los textos largos y caracteres especiales (ñ, tildes, «», €) salen bien.

### H2. Editor
- [ ] Una sola barra superior; guardado ("Guardando…/Guardado/Error") visible y estable al editar, mover y añadir secciones.
- [ ] Arrastre de secciones con ratón, táctil (retardo de 250 ms) y teclado (asa → Espacio → flechas), en 1 y 2 columnas, incluido soltar en una columna vacía.
- [ ] Menú "⋯" de cada fila: Subir, Bajar, Mover de columna y Eliminar funcionan con ratón y teclado (flechas, Home/End, Esc devuelve el foco al disparador).
- [ ] Eliminar una sección → toast "Deshacer" → la sección vuelve a su **posición y columna** originales, incluso tras mover otras en medio.
- [ ] Eliminar sin deshacer, recargar y comprobar que no reaparece.
- [ ] Banner de validación: provocar un error (p. ej. título vacío o campo inválido) → "Revisar" lleva el foco a la sección con error o a la pestaña de diseño.
- [ ] Zoom: −/+ respetan 50–200 %; el valor mostrado coincide con el aplicado.
- [ ] Reordenar elementos dentro de una sección (empleos, estudios) y filtro por texto con 5+ elementos.
- [ ] Foto: subir, ver en las 4 plantillas que la muestran, borrar, duplicar el CV con foto.

### H3. Diseño
- [ ] Las cuatro secciones plegables abren/cierran con ratón y teclado y recuerdan su estado mientras se edita.
- [ ] Una vs dos columnas: el cambio no pierde ni duplica secciones.
- [ ] Deslizador y campo numérico coinciden; escribir un valor fuera de rango se ajusta al límite.
- [ ] "Restablecer diseño" → toast "Deshacer" recupera todos los valores anteriores.
- [ ] Los cambios sobreviven a una recarga y llegan igual al PDF.

### H4. Panel y navegación
- [ ] Cuadrícula con miniaturas: correcta en 360, 768 y 1280 px; sin desbordes.
- [ ] Crear CV desde la tarjeta "Nuevo CV": nombre vacío muestra error; elegir plantilla visual; el CV se crea con esa plantilla.
- [ ] Duplicar, archivar, desarchivar y eliminar (diálogo con Esc, foco inicial en "Cancelar").
- [ ] Estado vacío en Mis CV y en Archivados.
- [ ] Sidebar del panel: botón "Nuevo currículum" abre el diálogo; enlace activo correcto en Mis CV, Archivados y Cuenta.

### H5. Landing, acceso y marca
- [ ] Landing: héroe, tres puntos de valor y mosaico de plantillas; CTA correcto con sesión iniciada y sin ella.
- [ ] No queda texto de entorno de desarrollo ("en local", "formulario de arriba"…).
- [ ] Inicio y registro (Clerk) con la marca; aceptar que las tarjetas de Clerk siguen en claro con tema oscuro (límite conocido).
- [ ] Desplegable del avatar legible en tema oscuro (texto no blanco sobre blanco).
- [ ] Nombre y logotipo coherentes en navbar, landing y título de la pestaña.

### H6. Temas y responsive
- [ ] Recorrer landing, panel, editor y cuenta en **claro, oscuro y sistema**, sin parpadeo inicial.
- [ ] Comprobar que ningún texto secundario baja de 4,5:1 en oscuro (usar axe o una herramienta de contraste) y que ningún texto informativo es ilegible.
- [ ] Móvil real (o emulación 360 px): barra inferior Editar · Diseño · Vista previa · PDF sin tapar contenido, con área segura en iPhone; sin scroll horizontal en ninguna pantalla.
- [ ] Ventana de escritorio estrecha (~800 px): la vista previa se auto-ajusta sin desbordar.

### H7. Accesibilidad (teclado y lector de pantalla)
- [ ] Todo el flujo del editor es operable solo con teclado, con foco visible en todos los controles nuevos.
- [ ] Los toasts se anuncian (`role="status"`) y el botón "Deshacer" se alcanza con Tab antes de que desaparezca (5 s por defecto). Si no es razonable, proponer ampliar la duración o pausar al enfocar/pasar el ratón.
- [ ] Menús, diálogos y banners tienen nombre accesible correcto.

## 4. Pruebas automáticas a ampliar (I)

1. `e2e/a11y.spec.ts`: añadir editor (pestañas Contenido y Diseño) y panel con tarjetas, con el menú "⋯" abierto, en claro y oscuro. Requiere entorno de testing de Clerk; si no se puede, dejar los casos escritos y marcados como `skip` con el motivo.
2. Tests unitarios de `DropdownMenu` (apertura, navegación con flechas, Esc y devolución de foco) y de `toast` (acción, caducidad, descarte).
3. Test del restaurado de "Deshacer" de eliminar sección (posición y columna correctas con 1 y 2 columnas).

## 5. Criterios de cierre de la ronda

- [ ] G1, G2, G4 y G5 hechos; G3 hecho o descartado con constancia.
- [ ] `tsc`, lint, tests, build y e2e en verde.
- [ ] Tabla H1 completa sin ❌ (o con ❌ documentados y abiertos como incidencias).
- [ ] Listas H2–H7 completas, con capturas de los fallos.
- [ ] Miniaturas del panel con medición antes/después.

## 6. Informe final

Cada agente entrega: tareas cubiertas (G1, H2…), archivos tocados, resultado de los comandos de verificación, capturas (claro/oscuro, escritorio/móvil) y una sección "Decisiones" con cualquier elección no trivial. Quien coordine consolida todo en un único informe y actualiza `docs/roadmap-futuro.md` con lo que quede pendiente (despliegue Node para el PDF, e2e autenticada, B6 deshacer/rehacer general).

## 7. Fuera de alcance

Cambios en Convex o el modelo de datos, nuevas plantillas, motor de PDF, temas de color adicionales para el usuario, deshacer/rehacer general del editor (B6), canvas libre.
