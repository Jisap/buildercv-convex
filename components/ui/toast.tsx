"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ToastAction = {
  label: string;
  onPress: () => void;
};

export type ToastData = {
  title: string;
  description?: string;
  action?: ToastAction;
  /** Milisegundos visible; 0 o negativo = permanente. Por defecto 5000. */
  duration?: number;
};

type Toast = ToastData & { id: number };

let currentToasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<(toasts: Toast[]) => void>();

function emit() {
  for (const listener of listeners) {
    listener([...currentToasts]);
  }
}

function dismissInternal(id: number) {
  if (!currentToasts.some((item) => item.id === id)) {
    return;
  }
  currentToasts = currentToasts.filter((item) => item.id !== id);
  emit();
}

/**
 * Muestra un aviso ligero (una sola implementación en toda la app).
 * Pensado para “Deshacer” al eliminar secciones o currículums (flujos B/C).
 */
export function toast(data: ToastData): number {
  const id = nextId++;
  currentToasts = [...currentToasts, { ...data, id }];
  emit();
  const duration = data.duration ?? 5000;
  if (duration > 0) {
    window.setTimeout(() => dismissInternal(id), duration);
  }
  return id;
}

export function dismissToast(id: number) {
  dismissInternal(id);
}

/** Región que pinta los avisos. Montar una sola vez en `app/layout.tsx`. */
export function Toaster({ className }: { className?: string }) {
  const [toasts, setToasts] = React.useState<Toast[]>(currentToasts);

  React.useEffect(() => {
    const listener = (next: Toast[]) => setToasts(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:items-end",
        className,
      )}
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground shadow-lg"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          {item.action && (
            <button
              type="button"
              onClick={() => {
                item.action!.onPress();
                dismissInternal(item.id);
              }}
              className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {item.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => dismissInternal(item.id)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
