"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type MenuContexto = {
  abierto: boolean;
  fijarAbierto: (abierto: boolean) => void;
  referenciaDisparador: React.RefObject<HTMLButtonElement | null>;
};

const ContextoMenu = React.createContext<MenuContexto | null>(null);

function useMenu() {
  const contexto = React.useContext(ContextoMenu);
  if (!contexto) {
    throw new Error("El elemento del menú debe estar dentro de <DropdownMenu>.");
  }
  return contexto;
}

/** Contenedor del menú desplegable (sin dependencias nuevas). */
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [abierto, fijarAbierto] = React.useState(false);
  const referenciaDisparador = React.useRef<HTMLButtonElement | null>(null);
  const valor = React.useMemo(
    () => ({ abierto, fijarAbierto, referenciaDisparador }),
    [abierto],
  );
  return (
    <ContextoMenu.Provider value={valor}>
      <span className="relative inline-block">{children}</span>
    </ContextoMenu.Provider>
  );
}

type PropiedadesDisparador = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Botón que abre el menú. Devuelve el foco aquí al cerrar con Esc. */
export function DropdownMenuTrigger({
  onClick,
  onKeyDown,
  ...props
}: PropiedadesDisparador) {
  const { abierto, fijarAbierto, referenciaDisparador } = useMenu();
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={abierto}
      {...props}
      ref={referenciaDisparador}
      onClick={(evento) => {
        fijarAbierto(!abierto);
        onClick?.(evento);
      }}
      onKeyDown={(evento) => {
        if (evento.key === "ArrowDown" && !abierto) {
          evento.preventDefault();
          fijarAbierto(true);
        }
        onKeyDown?.(evento);
      }}
    />
  );
}

function primerosElementos(contenedor: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    contenedor.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
  ).filter((elemento) => !elemento.disabled);
}

/** Contenido del menú: flechas para moverse, Esc para cerrar. */
export function DropdownMenuContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { abierto, fijarAbierto, referenciaDisparador } = useMenu();
  const referenciaContenido = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!abierto) {
      return;
    }
    const contenido = referenciaContenido.current;
    primerosElementos(contenido!).at(0)?.focus();

    const alPulsarFuera = (evento: PointerEvent) => {
      const objetivo = evento.target as Node;
      if (
        !referenciaContenido.current?.contains(objetivo) &&
        !referenciaDisparador.current?.contains(objetivo)
      ) {
        fijarAbierto(false);
      }
    };
    document.addEventListener("pointerdown", alPulsarFuera);
    return () => document.removeEventListener("pointerdown", alPulsarFuera);
  }, [abierto, fijarAbierto, referenciaDisparador]);

  if (!abierto) {
    return null;
  }

  const cerrarYDevolverFoco = () => {
    fijarAbierto(false);
    referenciaDisparador.current?.focus();
  };

  return (
    <div
      ref={referenciaContenido}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute top-full right-0 z-50 mt-1 min-w-44 rounded-md border border-border bg-card p-1 text-card-foreground shadow-md",
        className,
      )}
      onKeyDown={(evento) => {
        const contenido = evento.currentTarget;
        const elementos = primerosElementos(contenido);
        const actual = elementos.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (evento.key === "Escape") {
          evento.preventDefault();
          cerrarYDevolverFoco();
        } else if (evento.key === "ArrowDown") {
          evento.preventDefault();
          elementos[(actual + 1) % elementos.length]?.focus();
        } else if (evento.key === "ArrowUp") {
          evento.preventDefault();
          elementos[
            (actual - 1 + elementos.length) % elementos.length
          ]?.focus();
        } else if (evento.key === "Home") {
          evento.preventDefault();
          elementos.at(0)?.focus();
        } else if (evento.key === "End") {
          evento.preventDefault();
          elementos.at(-1)?.focus();
        } else if (evento.key === "Tab") {
          fijarAbierto(false);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

type PropiedadesElemento = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Acción al elegir el elemento; después se cierra y vuelve el foco. */
  onSelect?: () => void;
};

/** Elemento del menú. Conserva las `aria-label` que ya existían. */
export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  PropiedadesElemento
>(({ className, onSelect, onClick, ...props }, ref) => {
  const { fijarAbierto, referenciaDisparador } = useMenu();
  return (
    <button
      type="button"
      role="menuitem"
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-card-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={(evento) => {
        onClick?.(evento);
        onSelect?.();
        fijarAbierto(false);
        referenciaDisparador.current?.focus();
      }}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";
