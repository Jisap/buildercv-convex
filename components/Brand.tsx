import { cn } from "@/lib/utils";

/**
 * Marca centralizada (D2). El nombre visible («CV Studio») no cambia sin
 * confirmación del responsable del producto; «BuilderCV» queda solo para
 * repo y documentos. Logotipo sencillo en SVG con el primario de marca.
 */
export function Brand({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      </span>
      CV Studio
    </span>
  );
}
