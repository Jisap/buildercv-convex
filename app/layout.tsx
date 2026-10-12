import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "./ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CV Studio",
  description: "Crea, edita y exporta currículums profesionales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // D3: marca en las tarjetas de Clerk (variables claras). Límite
    // documentado: Clerk no sigue el tema oscuro de la app; sus tarjetas
    // quedan en claro también con tema oscuro.
    <ClerkProvider
      localization={esES}
      appearance={{
        variables: {
          colorPrimary: "#312e81",
          colorForeground: "#18181b",
          colorBackground: "#ffffff",
          colorInput: "#ffffff",
          colorInputForeground: "#18181b",
          colorBorder: "#d4d4d8",
          colorRing: "#4f46e5",
          borderRadius: "0.625rem",
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
        },
      }}
    >
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider>
            <ConvexClientProvider>
              <Navbar />
              {children}
              <Toaster />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
