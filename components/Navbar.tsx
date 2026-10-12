"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { FileText } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

/** Barra superior global: marca, tema y sesión. Fina en todas las rutas. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <Show
          when="signed-in"
          fallback={
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <FileText className="size-5" aria-hidden />
              CV Studio
            </Link>
          }
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <FileText className="size-5" aria-hidden />
            CV Studio
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
