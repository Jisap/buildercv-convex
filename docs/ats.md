# Compatibilidad de lectura automática

Pestaña «Compatibilidad» del editor. Es **orientativa**: cada sistema de
selección interpreta los currículums de forma distinta. No garantiza nada
ante ningún sistema concreto.

## Lo que muestra

- Nivel **Alta / Media / Baja** (el número 0–100 es secundario y está sin
  calibrar con CV reales).
- Lista de problemas con explicación y cómo arreglarlo.
- Botones «Ir a la sección» y, donde es seguro, corrección de un clic
  (título estándar, una columna, tamaño de letra, márgenes).

## Las 12 reglas (MVP)

| Regla | Severidad | Qué mira |
|---|---|---|
| Nombre / correo ausentes | error | Datos personales |
| Texto de relleno («Puesto», «Titulación»…) | error | Elementos sin completar |
| Sin experiencia / sin formación | aviso | Secciones visibles con contenido |
| Sección vacía | aviso | Secciones visibles |
| Título poco habitual | aviso | Se reconoce mejor «Experiencia», «Formación»… |
| Símbolos decorativos o emojis | aviso | Texto de secciones visibles |
| Enlace roto | aviso | Enlaces personales y de proyectos |
| Dos columnas | aviso | Distribución del diseño |
| Letra pequeña (<10 pt) | info | Tamaño de letra |
| Márgenes estrechos (<10 mm) | info | Margen de página |

Pesos: error 15, aviso 6, info 0; tope por regla 30/12/0; niveles Alta ≥85,
Media 60–84, Baja <60. Valores iniciales a calibrar.

## Capa 3 — Puesto objetivo y palabras clave de la oferta

La pestaña «Compatibilidad» pregunta **para qué puesto va destinado el
CV**: campo «Puesto objetivo» + «Texto de la oferta» (hasta 8000
caracteres). De ambos se extraen unigramas y bigramas (frecuencia,
stopwords es/en, sin acentos) y se comprueba cuáles aparecen en el CV
(tolerando singular/plural y género: «desarrolladores» casa con
«desarrolladora»). Muestra «Cobertura: X de Y términos», lista de
cubiertos y de ausentes.

Límites deliberados: **informativa, no resta puntos** (evita falsa
precisión); el texto **no se guarda** en Convex ni sale del navegador
(vive en estado local y se vacía al recargar); sin LLM ni llamadas
externas; el aviso honesto («Solo añade términos que reflejen tu
experiencia real») desincentiva el relleno. Implementación:
`lib/ats/keywords.ts` (`extractKeywords`, `matchKeywords`,
`analyzeKeywords`) + `keywords.test.ts`.

## Reglas futuras (diferidas y por qué)

Teléfono y formato de correo, experiencia sin fechas o sin descripción,
párrafos muy largos, CV muy corto o muy largo, niveles de competencia,
elementos gráficos (línea de tiempo, barras), bloques de color, foto y
nombre del fichero. Requieren perfilar cada plantilla o calibrar umbrales;
se harán tras validar este MVP con uso real.
