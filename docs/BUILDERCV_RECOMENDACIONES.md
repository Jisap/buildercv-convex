# Recomendaciones técnicas para BuilderCV (Convex)

**Proyecto:** `Jisap/buildercv-convex`  
**Objetivo:** mejorar la fiabilidad del MVP sin reescribir lo que ya funciona.  
**Estado:** documento de recomendaciones basado en una revisión estática del ZIP del proyecto. Las pruebas no se han ejecutado de nuevo en este entorno.

---

## 1. Resumen ejecutivo

La arquitectura general es adecuada para continuar: Next.js, TypeScript, Convex, Clerk, un editor de currículums, plantillas y exportación PDF. La separación entre contenido y presentación es una buena base para ampliar plantillas e incorporar IA más adelante.

La prioridad no debería ser añadir más funcionalidades de inmediato, sino consolidar tres aspectos:

1. Evitar que el usuario pierda cambios al abandonar el editor.
2. Aplicar validación robusta en el backend, además de en los formularios.
3. Probar la exportación PDF con documentos reales y casos extremos.

**Principio de trabajo:** cambios pequeños, verificables y con pruebas. No introducir otra base de datos, Prisma ni una segunda solución de autenticación sin una necesidad concreta.

## 2. Prioridades

| Prioridad | Área | Recomendación | Resultado esperado |
|---|---|---|---|
| P0 | Autoguardado | Gestionar correctamente cambios pendientes al navegar o desmontar el editor | Menor riesgo de perder datos |
| P0 | Validación del backend | Reforzar límites y reglas en las mutaciones de Convex | Datos consistentes y límites efectivos |
| P1 | React | Eliminar actualizaciones de estado anidadas dentro de actualizadores | Estado más predecible |
| P1 | PDF | Añadir pruebas de PDF real y paginación | Exportaciones más fiables |
| P1 | Despliegue | Elegir y probar un entorno compatible con Chromium/Playwright | Generación de PDF operativa en producción |
| P2 | Documentación | Alinear README, plan de implementación y estado real | Menos confusión para futuros agentes |
| P2 | Tipos y validadores | Detectar divergencias entre TypeScript, Zod y Convex | Menos errores de mantenimiento |
| P2 | Experiencia de edición | Mejorar estados de guardado, accesibilidad y recuperación de cambios | Editor más robusto |

---

## 3. P0 — Autoguardado y navegación segura

### Observación

En `features/editor/EditorShell.tsx` se usa `beforeunload` para advertir ante una salida de la página. Este evento no cubre necesariamente la navegación interna de Next.js. Además, si `useAutosave` limpia un temporizador al desmontarse, un cambio pendiente podría no llegar a guardarse.

### Recomendaciones

- Representar explícitamente los estados del guardado: `clean`, `dirty`, `saving`, `saved` y `error`.
- No considerar guardado un cambio hasta recibir confirmación de la mutación de Convex.
- Evitar que una petición anterior sobrescriba una versión más reciente del contenido.
- Al abandonar el editor, detectar si existen cambios pendientes y permitir guardar, esperar a la operación en curso o cancelar la salida.
- Mantener `beforeunload` como protección adicional para recargas y cierre de pestaña, no como único mecanismo.
- Mostrar un indicador de guardado claro y accesible.
- Evitar prometer que los cambios están guardados cuando solo se ha programado un temporizador.

### Pruebas de aceptación

- Editar un campo y navegar al panel antes de que venza el debounce.
- Navegar mientras hay una mutación en curso.
- Simular un fallo de red y comprobar que se informa del error y se conservan los cambios locales.
- Realizar cambios rápidos consecutivos y comprobar que el servidor termina con la versión más reciente.
- Recargar o cerrar la pestaña con cambios pendientes y verificar la advertencia correspondiente.

### Criterio de finalización

Ningún cambio pendiente debe descartarse silenciosamente durante una navegación normal. Los fallos de guardado deben ser visibles y permitir reintentar.

---

## 4. P0 — Validación y límites en Convex

### Observación

El proyecto contiene validación en cliente, por ejemplo en `lib/validation/resume.ts`, mientras que `convex/resumeModel.ts` parece centrarse principalmente en estructura y tipos. La validación del cliente no es una frontera de seguridad: las mutaciones pueden invocarse directamente.

### Recomendaciones

- Validar en el backend todos los datos recibidos por las mutaciones.
- Definir límites razonables para:
  - longitud de nombre del currículum;
  - longitud de campos de texto;
  - número de secciones;
  - número de elementos por sección;
  - tamaño total del contenido;
  - longitud de URL y otros campos con formato específico.
- Comprobar reglas semánticas, no solo tipos: campos obligatorios, identificadores duplicados, fechas válidas y tipos de sección permitidos.
- Mantener la autorización por usuario en cada consulta y mutación que lea o modifique un currículum.
- No confiar en `userId`, identificadores de propietario ni permisos enviados por el cliente sin contrastarlos con la identidad autenticada.
- Evitar duplicar reglas manualmente sin pruebas de coherencia entre Zod, TypeScript y validadores de Convex.

### Pruebas de aceptación

- Invocar las mutaciones con cadenas que superen los límites.
- Enviar demasiadas secciones o elementos.
- Enviar una sección con un tipo no permitido o datos incompatibles.
- Intentar leer, editar o eliminar un currículum perteneciente a otra cuenta.
- Comprobar que los datos inválidos se rechazan con errores controlados, sin dejar documentos parcialmente actualizados.

### Criterio de finalización

Las reglas críticas se aplican en el servidor y las operaciones sensibles verifican siempre la propiedad del documento.

---

## 5. P1 — React y actualizaciones de estado

### Observación

En `features/editor/EditorShell.tsx`, `addSection` parece actualizar `selectedId` desde dentro del actualizador de `setContent`. Los actualizadores de estado deben ser puros: no conviene introducir otra actualización de estado como efecto secundario dentro de ellos.

### Recomendaciones

- Crear el identificador y el objeto de sección fuera del actualizador cuando sea posible.
- Mantener las funciones pasadas a `setContent` libres de efectos secundarios.
- Separar la actualización del contenido y la selección de la sección.
- Comprobar que los cambios siguen siendo correctos cuando React repite actualizadores durante comprobaciones de desarrollo.
- Añadir una prueba para crear una sección y verificar que aparece seleccionada sin duplicados.

### Criterio de finalización

Crear, editar, duplicar, eliminar y reordenar secciones produce un único resultado coherente y sin efectos secundarios dentro de actualizadores.

---

## 6. P1 — Exportación PDF y paginación

### Situación

La implementación usa Playwright/Chromium y estilos de impresión. Compartir el renderizador entre vista previa y PDF es una buena decisión, pero las pruebas de HTML o de presencia de texto no garantizan que la composición visual sea correcta.

### Recomendaciones

- Generar PDFs reales con Chromium en las pruebas de integración.
- Verificar que el PDF contiene el texto esperado y que el número de páginas es razonable.
- Revisar visualmente cada plantilla con documentos cortos, medios y largos.
- Probar contenido extremo: párrafos largos, nombres extensos, URLs, caracteres españoles, fechas parciales y secciones que comienzan cerca del final de una página.
- Revisar reglas `break-inside`, `page-break-inside`, márgenes, tamaños de fuente, interlineado y encabezados.
- No asumir que un bloque puede mantenerse unido si su altura supera la de una página disponible.
- Evitar que botones, controles del editor o elementos de navegación aparezcan en el PDF.
- Comprobar que fuentes e imágenes han terminado de cargar antes de generar el PDF.
- Definir el tamaño A4 y los márgenes de forma consistente.
- Añadir una prueba de regresión por plantilla cuando se corrija un defecto visual.

### Matriz mínima de pruebas

| Caso | Qué comprobar |
|---|---|
| CV corto | No deja espacios extraños ni páginas vacías |
| CV de varias páginas | No omite contenido ni crea páginas inesperadas |
| Párrafo muy largo | El texto fluye correctamente entre páginas |
| Sección al final de página | Encabezado y contenido quedan bien distribuidos |
| Nombre o empresa largos | No desbordan columnas ni márgenes |
| Caracteres españoles | Acentos y `ñ` se muestran correctamente |
| Plantilla de dos columnas | No hay cortes ni desbordamientos |
| CV sin una sección opcional | No aparecen huecos ni encabezados vacíos |

### Criterio de finalización

Las tres plantillas se exportan correctamente con contenido realista y extremo, sin pérdida de texto ni desbordamientos visuales conocidos.

---

## 7. P1 — Compatibilidad del despliegue con Playwright

La generación de PDF con Chromium requiere un entorno que pueda ejecutar el navegador y sus dependencias. No se debe dar por hecho que el despliegue serverless elegido lo soporta sin ajustes.

### Recomendaciones

- Documentar los requisitos del navegador y del sistema operativo.
- Probar la generación de PDF en un entorno equivalente al de producción.
- Medir tiempo de ejecución, memoria y tamaño del resultado.
- Definir límites razonables de contenido y tiempos de espera.
- Si el hosting no soporta Chromium de forma fiable, valorar un servicio de exportación separado.
- Mantener la generación de PDF en el servidor; no exponer credenciales ni confiar en parámetros de autorización del cliente.
- Documentar variables de entorno necesarias sin incluir secretos en el repositorio.

### Criterio de finalización

Una prueba de despliegue demuestra que la exportación funciona con la configuración de producción y con un currículum de varias páginas.

---

## 8. P2 — Documentación y consistencia del proyecto

### Observación

El README parece describir una fase temprana, mientras que `docs/implementation-plan.md` marca más fases como completadas. Conviene comprobar si la discrepancia refleja documentación desactualizada.

### Recomendaciones

- Actualizar el README para reflejar el estado real del MVP.
- Mantener una única fuente de verdad para tareas pendientes y completadas.
- Documentar claramente:
  - requisitos y comandos de instalación;
  - variables de entorno;
  - configuración de Clerk y Convex;
  - ejecución de pruebas;
  - generación de PDF;
  - despliegue;
  - limitaciones conocidas.
- Distinguir entre «implementado», «probado localmente» y «verificado en producción».
- Revisar las notas históricas sobre middleware y autenticación.
- No marcar una fase como completada solo porque exista código; exigir pruebas de aceptación.

---

## 9. P2 — Tipos, validación y modelo de datos

El proyecto utiliza TypeScript, validadores de Convex y esquemas de validación de formularios. Es razonable mantener validación en varios límites, pero hay que evitar que las reglas diverjan.

### Recomendaciones

- Definir con claridad qué valida cada capa:
  - **TypeScript:** coherencia durante el desarrollo.
  - **Zod/cliente:** feedback inmediato en los formularios.
  - **Convex/backend:** validación autoritativa de las operaciones.
- Añadir pruebas con ejemplos válidos e inválidos compartidos entre las capas.
- Centralizar constantes de límites cuando sea compatible con las restricciones de importación de Convex.
- Mantener discriminados los tipos de sección y evitar estructuras excesivamente genéricas.
- Evaluar versiones del documento y recuperación de cambios como mejora posterior, no como requisito para corregir los riesgos P0.

---

## 10. Mejoras de experiencia de usuario

Después de resolver los riesgos principales, priorizaría:

1. Indicador fiable de guardado.
2. Mensajes de error claros y opción de reintentar.
3. Confirmación al eliminar secciones o currículums.
4. Deshacer y rehacer acciones del editor.
5. Duplicación de currículums y plantillas.
6. Navegación por teclado y etiquetas accesibles.
7. Buen comportamiento en pantallas pequeñas.
8. Recuperación de versiones anteriores.
9. Validación visual del resultado antes de descargar el PDF.

No implementaría todas estas mejoras a la vez. Conviene escogerlas según el impacto real y mantener el MVP estable.

---

## 11. Preparación para incorporar IA más adelante

La IA debe ser una ampliación del producto, no una dependencia del editor.

### Recomendaciones

- Mantener el contenido del currículum como modelo independiente del proveedor de IA.
- Definir en el futuro una interfaz de servicio, por ejemplo `ResumeAssistant`, detrás de la cual pueda cambiarse de proveedor.
- Enviar a la IA solo los datos necesarios para la tarea.
- Exigir que las respuestas estructuradas cumplan un esquema validado antes de aplicarlas.
- Mostrar al usuario los cambios propuestos y permitir aceptarlos o rechazarlos.
- No sobrescribir automáticamente el CV completo.
- Proteger las claves de proveedor exclusivamente en el servidor.
- Añadir límites de uso, gestión de errores y controles de privacidad antes de lanzar funciones de IA.

**Fuera del alcance inmediato:** selección de proveedor, prompts definitivos, facturación por uso y funciones de IA en producción.

---

## 12. Plan de implementación para agentes de IA

Los agentes deben trabajar en tareas acotadas. Es preferible un agente coordinador y tareas separadas con archivos y criterios de aceptación claros.

### Fase A — Diagnóstico reproducible

- Revisar los archivos indicados y confirmar que las observaciones siguen presentes.
- Instalar dependencias según el lockfile.
- Ejecutar lint, comprobación de tipos y pruebas existentes.
- Registrar resultados reales y no asumir que las pruebas pasan.
- No modificar todavía la arquitectura general.

**Entrega:** informe breve de estado inicial y lista de fallos reproducibles.

### Fase B — Autoguardado

- Corregir el flujo de salida y cambios pendientes.
- Definir los estados del guardado.
- Añadir pruebas para navegación, petición en curso y error de red.

**Entrega:** código, pruebas y explicación del comportamiento resultante.

### Fase C — Validación de Convex

- Añadir validación de límites y reglas semánticas en el backend.
- Revisar autorización por propietario.
- Añadir pruebas de datos inválidos y acceso entre usuarios.

**Entrega:** cambios de backend y pruebas de seguridad funcional.

### Fase D — React y editor

- Eliminar efectos secundarios de actualizadores de estado.
- Probar crear, editar, eliminar y reordenar secciones.
- Verificar que no se pierden cambios ni aparecen elementos duplicados.

### Fase E — PDF

- Crear pruebas de integración con Chromium.
- Generar documentos de distintos tamaños para cada plantilla.
- Documentar cualquier limitación que requiera revisión visual manual.
- Probar el entorno real de despliegue antes de dar la tarea por cerrada.

### Fase F — Documentación y pulido

- Actualizar README y plan de implementación.
- Documentar comandos y variables de entorno.
- Registrar limitaciones conocidas y futuras mejoras.
- No incorporar IA ni nuevas dependencias principales en esta fase.

---

## 13. Prompt de arranque para el agente coordinador

> Trabaja sobre el repositorio existente de BuilderCV. No rehagas la aplicación ni cambies de stack. Antes de editar, inspecciona los archivos y ejecuta las comprobaciones que permita el entorno. Confirma cada observación de este documento con el código actual y distingue los problemas reproducidos de los riesgos potenciales.
>
> Prioriza: (1) evitar la pérdida de cambios pendientes en el editor, (2) validar los datos y la autorización en Convex, (3) eliminar efectos secundarios dentro de actualizadores de React y (4) probar la exportación PDF real con Chromium.
>
> Trabaja en cambios pequeños. Añade pruebas para cada corrección. No declares una tarea completada sin indicar los comandos ejecutados y sus resultados. No inventes resultados de pruebas. No añadas Prisma, otra base de datos ni IA en esta fase. Conserva las decisiones de arquitectura existentes salvo que encuentres una razón demostrable para modificarlas.
>
> Al terminar, entrega: resumen de cambios, archivos modificados, pruebas ejecutadas y resultado, riesgos restantes y siguiente tarea recomendada.

---

## 14. Definición de «terminado»

Una tarea no se considera terminada hasta que:

- [ ] El problema y su causa se han confirmado en el código actual.
- [ ] El cambio es acotado y no introduce una reescritura innecesaria.
- [ ] Se han añadido o actualizado pruebas relevantes.
- [ ] Se han ejecutado las comprobaciones disponibles y se han comunicado sus resultados reales.
- [ ] Se han revisado errores, estados de carga y casos límite.
- [ ] La documentación afectada está actualizada.
- [ ] Se indican expresamente los riesgos que siguen pendientes.

## Conclusión

BuilderCV tiene una base técnica razonable. La estrategia recomendada es consolidar primero la integridad de los datos, la validación del backend y la fiabilidad del PDF. Después se puede mejorar la experiencia de edición y ampliar las plantillas. La IA debe incorporarse cuando el núcleo sea estable y exista una forma segura de revisar y aceptar los cambios sugeridos.
