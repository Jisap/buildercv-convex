"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

/** Barra superior global: marca, tema y sesión. Fina en todas las rutas. */
export function Navbar() {
  const pathname = usePathname();
  // En el editor hay una sola barra superior (la del propio editor, B1):
  // ocultar la global gana ~56 px de alto útil.
  if (pathname?.startsWith("/editor")) {
    return null;
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <Show
          when="signed-in"
          fallback={
            <Link href="/" aria-label="CV Studio, inicio">
              <Brand />
            </Link>
          }
        >
          <Link href="/dashboard" aria-label="CV Studio, ir al panel">
            <Brand />
          </Link>
        </Show>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-out">
            <Button asChild size="sm">
              <Link href="/signin">Entrar</Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
