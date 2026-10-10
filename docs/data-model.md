# CV Studio — Modelo de datos (Fase 2)

Tipos canónicos en `types/resume.ts`. Validadores normativos para
almacenamiento en `convex/resumeModel.ts` (validadores `v` de Convex).
Espejo Zod para formularios en `lib/validation/resume.ts`. Fábricas puras
compartidas por cliente y servidor en `lib/resume.ts`. Ante cualquier cambio,
actualizar los cuatro.

## Principios

- El contenido es **independiente de la plantilla**: cambiar `design` nunca
  reescribe `content`.
- Toda sección tiene `id` estable, `type`, `title`, `order`, `visible` e
  `items`. Todo item tiene `id` estable. Editar, borrar o reordenar nunca
  depende de índices de arrays.
- La identidad (`userId`) se resuelve **siempre** desde `ctx.auth`
  (JWT de Clerk verificado por la plataforma). Ninguna función acepta
  `userId` del cliente.
- Fechas internas en formato `YYYY-MM`; la localización visible (es-ES) se
  hace al renderizar (Fase 3+).
- Sin CSS arbitrario: el diseño solo admite `templateId`, `templateVersion`,
  `accentColor` (hex `#rrggbb`, validado en servidor) y `fontFamily` de una
  lista cerrada (`inter` | `georgia` | `system`).

## Tabla `resumes`

| Campo      | Tipo                    | Notas |
| ---------- | ----------------------- | ----- |
| `userId`   | `string`                | `subject` de Clerk. |
| `title`    | `string`                | 1–200 caracteres (recortado; validado en servidor). |
| `status`   | `"draft"` \| `"archived"` | `draft` al crear/duplicar. |
| `content`  | `ResumeContent`         | Unión discriminada por `type` (9 tipos). |
| `design`   | `ResumeDesign`          | Ver arriba. |
| `updatedAt`| `number`                | `Date.now()` en cada mutación; orden del panel. |

Índice `by_user` sobre `["userId", "updatedAt"]`: el listado filtra por
propietario en el índice y ordena por modificación descendente. Nunca se
descargan todos los CV para filtrar en cliente.

## Funciones (`convex/resumes.ts`)

| Función     | Hace |
| ----------- | ---- |
| `list`      | CV del usuario ordenados por `updatedAt` desc. |
| `get`       | Un CV si es del usuario; si no, `Currículum no encontrado.` (mismo error exista o no, para no filtrar IDs válidos). |
| `create`    | Crea con título validado, estado `draft`, contenido vacío válido (`createDefaultContent`) y diseño clásico. |
| `update`    | Parche parcial (`title`/`status`/`content`/`design`); actualiza `updatedAt`. Renombrar = `update` con `title`. |
| `duplicate` | Copia profunda con **IDs nuevos** (`cloneContentWithNewIds`), título `Copia de …`, estado `draft`. |
| `remove`    | Elimina tras comprobar propiedad (la UI pide confirmación en dos clics). |

Reglas de servidor además de los validadores: título no vacío (tras `trim`),
`accentColor` con regex hex, `templateId` no vacío. Los límites de longitud
finos viven en Zod (cliente); el servidor garantiza forma, tipos y propiedad.

## Tipos de sección e items

`personal` (datos + enlaces), `profile` (texto), `experience`
(puesto/empresa/fechas `YYYY-MM`/descripción), `education`,
`skills` + `digitalSkills` (nombre + nivel 1–5), `languages` (nombre + nivel
libre), `projects` (nombre/descripción/url/tecnologías), `custom`
(título/descripción). Todos los campos salvo IDs son opcionales en Fase 2:
un CV recién creado es válido con datos vacíos; Fase 3 añade los formularios.

## Pruebas

`convex/resumes.test.ts` (Vitest + `convex-test`, backend en memoria):
aislamiento de listado, lectura/actualización/duplicado/borrado ajenos,
operaciones sin identidad, validación de título y color, e IDs nuevos al
duplicar. Ejecutar con `npm test`. Config en `vitest.config.mts` (incluye
`convex-test` en `server.deps.inline` porque usa `import.meta.glob`).
