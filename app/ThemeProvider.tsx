"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Tema claro/oscuro/sistema (clase `.dark` en <html>, sin FOUC). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
