"use client";

import { ArrowLeft, Check, Download, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaveStatus } from "./useAutosave";

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Cargando…
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Guardando…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
        Error al guardar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400" role="status">
      <Check className="size-4" aria-hidden />
      Guardado
    </span>
  );
}

export function EditorToolbar({
  title,
  onTitleChange,
  titleError,
  status,
  onRetry,
  resumeId,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  titleError: string | null;
  status: SaveStatus;
  onRetry: () => void;
  resumeId: string;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      <Button asChild size="sm" variant="ghost">
        <Link href="/dashboard" aria-label="Volver al panel">
          <ArrowLeft />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <Label htmlFor="resume-title" className="sr-only">
          Título del currículum
        </Label>
        <Input
          id="resume-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="max-w-md border-transparent text-lg font-semibold shadow-none focus-visible:border-zinc-200 dark:focus-visible:border-zinc-700"
          maxLength={200}
        />
        {titleError && (
          <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {titleError}
          </p>
        )}
      </div>
      <SaveBadge status={status} />
      {status === "error" && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw />
          Reintentar
        </Button>
      )}
      <Button asChild size="sm" variant="outline">
        <a href={`/api/resumes/${resumeId}/pdf`} download>
          <Download />
          PDF
        </a>
      </Button>
      <ThemeToggle />
    </header>
  );
}
