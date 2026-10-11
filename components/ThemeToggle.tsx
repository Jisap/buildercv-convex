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
        className="inline-block h-9 w-[104px] rounded-md border border-zinc-200"
      />
    );
  }
  return (
    <div
      role="group"
      aria-label="Tema de la aplicación"
      className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
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
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
