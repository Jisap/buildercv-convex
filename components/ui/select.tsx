import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Envoltorio estilado del `<select>` nativo con el mismo aspecto que `Input`.
 * Se mantiene nativo a propósito: accesibilidad y teclado del navegador
 * sin añadir dependencias.
 */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <span className="relative inline-flex w-full items-center">
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none rounded-md border border-input bg-background py-2 pr-9 pl-3 text-sm text-foreground ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 size-4 text-muted-foreground"
      aria-hidden
    />
  </span>
));
Select.displayName = "Select";

export { Select };
