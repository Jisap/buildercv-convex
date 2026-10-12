"use client";

import { Show } from "@clerk/nextjs";
import { FileDown, LayoutTemplate, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/features/templates/types";
import { TemplateThumbnail } from "@/features/templates/TemplateThumbnails";

const VALORES = [
  {
    Icon: LayoutTemplate,
    titulo: "9 plantillas profesionales",
    texto: "Clásicas, modernas y compactas, listas para cualquier sector.",
  },
  {
    Icon: FileDown,
    titulo: "PDF A4 idéntico a la vista previa",
    texto: "Lo que ves en pantalla es lo que se exporta, página a página.",
  },
  {
    Icon: Save,
    titulo: "Guardado automático",
    texto: "Cada cambio se guarda solo; retoma donde lo dejaste.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-sm font-medium text-muted-foreground">CV Studio</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Tus currículums, listos para enviar
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Crea, edita y exporta currículums profesionales en PDF con tamaño
            A4. Empieza ahora y ten el primero listo en minutos.
          </p>
          <Show
            when="signed-in"
            fallback={
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/signup">Empezar ahora</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">Ir a mi panel</Link>
                </Button>
              </div>
            }
          >
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">Ir a mi panel</Link>
              </Button>
            </div>
          </Show>
          <ul className="mt-10 space-y-5">
            {VALORES.map(({ Icon, titulo, texto }) => (
              <li key={titulo} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-medium text-foreground">
                    {titulo}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {texto}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div
            aria-hidden="true"
            className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 shadow-sm select-none"
          >
            {TEMPLATES.map((meta) => (
              <TemplateThumbnail key={meta.id} templateId={meta.id} />
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Seis plantillas reales: elige la tuya al crear cada currículum.
          </p>
        </div>
      </main>
    </div>
  );
}
