"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type MenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const MenuContext = React.createContext<MenuContextValue | null>(null);

function useMenu() {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error("El elemento del menú debe estar dentro de <DropdownMenu>.");
  }
  return context;
}

/** Contenedor del menú desplegable (sin dependencias nuevas). */
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const value = React.useMemo(
    () => ({ open, setOpen, triggerRef }),
    [open],
  );
  return (
    <MenuContext.Provider value={value}>
      <span className="relative inline-block">{children}</span>
    </MenuContext.Provider>
  );
}

type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Botón que abre el menú. Devuelve el foco aquí al cerrar con Esc. */
export function DropdownMenuTrigger({
  onClick,
  onKeyDown,
  ...props
}: TriggerProps) {
  const { open, setOpen, triggerRef } = useMenu();
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      {...props}
      ref={triggerRef}
      onClick={(event) => {
        setOpen(!open);
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" && !open) {
          event.preventDefault();
          setOpen(true);
        }
        onKeyDown?.(event);
      }}
    />
  );
}

function getMenuItems(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
  ).filter((item) => !item.disabled);
}

/** Contenido del menú: flechas para moverse, Esc para cerrar. */
export function DropdownMenuContent({
  className,
  children,
  onKeyDown,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen, triggerRef } = useMenu();
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const content = contentRef.current;
    getMenuItems(content!).at(0)?.focus();

    const onPointerOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !contentRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerOutside);
    return () => document.removeEventListener("pointerdown", onPointerOutside);
  }, [open, setOpen, triggerRef]);

  if (!open) {
    return null;
  }

  const closeAndRestoreFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute top-full right-0 z-50 mt-1 min-w-44 rounded-md border border-border bg-card p-1 text-card-foreground shadow-md",
        className,
      )}
      onKeyDown={(event) => {
        const content = event.currentTarget;
        const items = getMenuItems(content);
        const current = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (event.key === "Escape") {
          event.preventDefault();
          closeAndRestoreFocus();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          items[(current + 1) % items.length]?.focus();
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          items[(current - 1 + items.length) % items.length]?.focus();
        } else if (event.key === "Home") {
          event.preventDefault();
          items.at(0)?.focus();
        } else if (event.key === "End") {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (event.key === "Tab") {
          setOpen(false);
        }
        onKeyDown?.(event);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

type ItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Acción al elegir el elemento; después se cierra y vuelve el foco. */
  onSelect?: () => void;
};

/** Elemento del menú. Conserva las `aria-label` que ya existían. */
export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, ItemProps>(
  ({ className, onSelect, onClick, ...props }, ref) => {
    const { setOpen, triggerRef } = useMenu();
    return (
      <button
        type="button"
        role="menuitem"
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-card-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          onSelect?.();
          setOpen(false);
          triggerRef.current?.focus();
        }}
        {...props}
      />
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";
