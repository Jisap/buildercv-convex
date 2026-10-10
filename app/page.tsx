import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24">
      <main className="w-full max-w-2xl text-center">
        <p className="text-sm font-medium text-zinc-500">CV Studio</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
          Tus currículums, una sola fuente de información
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">
          Crea, edita y exporta currículums profesionales en PDF con tamaño
          A4. Empieza gratis en local.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/dashboard">Ir a mi panel</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signin">Iniciar sesión</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
