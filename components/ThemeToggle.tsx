"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const OPTIONS = [
  { value: "light", label: "Tema claro", Icon: Sun },
  { value: "system", label: "Tema del sistema", Icon: Monitor },
  { value: "dark", label: "Tema oscuro", Icon: Moon },
] as const;

/** Conmutador claro/sistema/oscuro. Sin montar no se pinta (evita parpadeo). */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Solo en cliente (evita parpadeo e hidrata sin desajustes).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-9 w-[104px] rounded-md border border-border bg-muted"
      />
    );
  }
  return (
    <div
      role="group"
      aria-label="Tema de la aplicación"
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={`rounded p-1.5 ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
