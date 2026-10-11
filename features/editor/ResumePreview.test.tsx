import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { layoutFromContent } from "@/lib/resume-layout";
import { SHORT_CONTENT, SHORT_DESIGN } from "@/features/exports/fixtures";
import { ResumePreview } from "./ResumePreview";

const layout = layoutFromContent(SHORT_CONTENT);

test("la vista previa combina zoom de usuario y tamaño de fuente", () => {
  const base = renderToStaticMarkup(
    <ResumePreview
      content={SHORT_CONTENT}
      design={SHORT_DESIGN}
      layout={layout}
      zoom={1}
    />,
  );
  expect(base).toContain("zoom:1");
  expect(base).toContain("Ana Ruiz");
  const scaled = renderToStaticMarkup(
    <ResumePreview
      content={SHORT_CONTENT}
      design={{ ...SHORT_DESIGN, fontSize: 12 }}
      layout={layout}
      zoom={0.75}
    />,
  );
  // 0.75 * 12/11 con ajuste inicial 1 (sin ResizeObserver en servidor).
  expect(scaled).toContain(`zoom:${0.75 * (12 / 11)}`);
});
