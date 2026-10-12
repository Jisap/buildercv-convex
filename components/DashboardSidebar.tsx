"use client";

import { Archive, LayoutGrid, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

const ENLACES: { href: string; label: string; Icon: typeof Archive }[] = [
  { href: "/dashboard", label: "Mis currículums", Icon: LayoutGrid },
  { href: "/dashboard/archivados", label: "Archivados", Icon: Archive },
  { href: "/cuenta", label: "Mi cuenta", Icon: User },
];

/** Navegación del panel: botón primario + enlaces, fila en móvil. */
export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación del panel"
      className="shrink-0 md:sticky md:top-20 md:w-56 md:self-start"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        <Button asChild className="shrink-0 md:w-full">
          <Link href="/dashboard#nuevo-cv">
            <Plus />
            Nuevo currículum
          </Link>
        </Button>
        <ul className="flex gap-1 md:flex-col">
          {ENLACES.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap ${
                    active
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
