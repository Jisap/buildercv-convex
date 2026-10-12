import { ClassicTemplate } from "./ClassicTemplate";
import { CompactTemplate } from "./CompactTemplate";
import { ElegantTemplate } from "./ElegantTemplate";
import { EnergeticTemplate } from "./EnergeticTemplate";
import { ExecutiveTemplate } from "./ExecutiveTemplate";
import { TechnicalTemplate } from "./TechnicalTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { SidebarTemplate } from "./SidebarTemplate";
import type { ResumeTemplateProps } from "./types";

/** Renderizador único: elige plantilla por `design.templateId`. */
export function TemplateRenderer(props: ResumeTemplateProps) {
  switch (props.design.templateId) {
    case "modern":
      return <ModernTemplate {...props} />;
    case "compact":
      return <CompactTemplate {...props} />;
    case "sidebar":
      return <SidebarTemplate {...props} />;
    case "elegant":
      return <ElegantTemplate {...props} />;
    case "energetic":
      return <EnergeticTemplate {...props} />;
    case "technical":
      return <TechnicalTemplate {...props} />;
    case "executive":
      return <ExecutiveTemplate {...props} />;
    case "minimal":
      return <MinimalTemplate {...props} />;
    case "classic":
    default:
      return <ClassicTemplate {...props} />;
  }
}
