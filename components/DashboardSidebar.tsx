"use client";

import { Archive, LayoutGrid, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS: {
  label: string;
  links: { href: string; label: string; Icon: typeof Archive }[];
}[] = [
  {
    label: "Panel",
    links: [
      { href: "/dashboard", label: "Mis currículums", Icon: LayoutGrid },
      { href: "/dashboard/archivados", label: "Archivados", Icon: Archive },
    ],
  },
  {
    label: "Crear",
    links: [
      { href: "/dashboard#nuevo-cv", label: "Nuevo currículum", Icon: Plus },
    ],
  },
  {
    label: "Cuenta",
    links: [{ href: "/cuenta", label: "Mi cuenta", Icon: User }],
  },
];

/** Navegación del panel: lateral en escritorio, fila superior en móvil. */
export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación del panel"
      className="shrink-0 md:sticky md:top-20 md:w-56 md:self-start"
    >
      <div className="flex gap-4 overflow-x-auto pb-1 md:flex-col md:gap-5 md:overflow-visible md:pb-0">
        {SECTIONS.map((section) => (
          <div key={section.label} className="min-w-0 md:block">
            <p className="mb-1 hidden text-xs font-medium text-zinc-500 md:block dark:text-zinc-400">
              {section.label.toUpperCase()}
            </p>
            <ul className="flex gap-1 md:flex-col">
              {section.links.map(({ href, label, Icon }) => {
                const active =
                  href === "/dashboard#nuevo-cv" ? false : pathname === href;
                return (
                  <li key={href} className="shrink-0">
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap ${
                        active
                          ? "bg-zinc-900 font-medium text-zinc-50 dark:bg-zinc-800 dark:text-zinc-100"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
        ))}
      </div>
    </nav>
  );
}
