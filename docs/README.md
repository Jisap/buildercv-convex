# Docs — índice

Orden de lectura para agentes: `ROADMAP_AGENTES.md` → `data-model.md` →
`roadmap-futuro.md` (solo QA H1–H7 pendiente) → `pdf-testing.md`.

## Vigentes (7)

| Doc | Qué es | Estado |
|---|---|---|
| `ROADMAP_AGENTES.md` | Fuente de verdad del plan (oleadas B0–Final) | Vigente |
| `ATS_COMPATIBILIDAD_AGENTES.md` | Plan ATS, MVP Capa 1 con 12 reglas | Vigente, en curso |
| `data-model.md` | Modelo canónico (`types` + Zod + Convex + fábricas) | Vigente |
| `pdf-testing.md` | Paridad preview/PDF (T1, 72 celdas) + robustez ruta (S3) | Vigente |
| `deployment.md` | Guía de despliegue | Vigente con deuda: dice "sin modo oscuro" (falso) y `middleware` deprecado; lo reescribe la Fase Final (D2–D8) |
| `setup-convex-clerk.md` | Instalación Convex + Clerk | Vigente |
| `roadmap-futuro.md` | Log sesiones 11–13/10 + QA manual H1–H7 pendiente | Parcialmente vigente: solo el punto D (QA) sigue vivo; el resto es histórico y `ROADMAP_AGENTES.md` lo sustituye como plan |

## Archivo (6, congelados en `docs/archivo/`)

Planes ya ejecutados. No usar como guía; solo trazabilidad.
Los enlaces internos entre ellos apuntan a las rutas antiguas y no se corrigen.

| Doc | Por qué se archiva |
|---|---|
| `archivo/architecture.md` | Fase 0 (2026-10-10): "sin código, sin Convex". Obsoleto. |
| `archivo/implementation-plan.md` | Log Fases 0–6 completadas + triaje auditoría. Cerrado. |
| `archivo/design.md` | Propuesta editor híbrido (F1–F3 ya implementadas). Cerrada. |
| `archivo/BUILDERCV_RECOMENDACIONES.md` | Auditoría externa 10/10, ya triada y aplicada. Cerrada. |
| `archivo/UI_MEJORAS_AGENTES.md` | Serie UI rondas A–F, fusionada 12/10. Cerrada. |
| `archivo/UI_REVISION_Y_QA_AGENTES.md` | Ronda 2 (G1–G5 fusionados). La QA viva está en `roadmap-futuro.md` punto D. |

## Reglas

- Un cambio de modelo/validación actualiza el espejo cuádruple + `data-model.md`.
- Tocar `convex/` o sus imports exige `npm run convex:push`.
- No resucitar docs de `archivo/` sin moverlos de vuelta y actualizar este índice.
