import { ClassicTemplate } from "./ClassicTemplate";
import { CompactTemplate } from "./CompactTemplate";
import { ModernTemplate } from "./ModernTemplate";
import type { ResumeTemplateProps } from "./types";

/** Renderizador único: elige plantilla por `design.templateId`. */
export function TemplateRenderer(props: ResumeTemplateProps) {
  switch (props.design.templateId) {
    case "modern":
      return <ModernTemplate {...props} />;
    case "compact":
      return <CompactTemplate {...props} />;
    case "classic":
    default:
      return <ClassicTemplate {...props} />;
  }
}
