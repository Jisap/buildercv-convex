import type { ResumeContent, ResumeDesign, ResumeLayout } from "@/types/resume";
import { TemplateRenderer } from "@/features/templates/TemplateRenderer";
import { PRINT_CSS, buildDesignCss } from "./printCss";

// Construye el documento HTML autónomo que Chromium convierte en PDF.
// Usa el MISMO renderizador que la vista previa (mode "print").
//
// Nota Next 16: `react-dom/server` no admite import estático desde Route
// Handlers (el compilador lo rechaza), así que se importa en diferido.
// En ejecución (runtime nodejs) funciona con normalidad.
export async function buildPrintHtml(
  title: string,
  content: ResumeContent,
  design: ResumeDesign,
  layout?: ResumeLayout | null,
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const body = renderToStaticMarkup(
    TemplateRenderer({ content, design, layout, mode: "print" }),
  );
  const safeTitle = title.replace(/[<>&"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      default:
        return "&quot;";
    }
  });
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>${PRINT_CSS}</style>
<style>${buildDesignCss(design)}</style>
</head>
<body>${body}</body>
</html>`;
}
