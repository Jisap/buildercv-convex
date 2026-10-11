import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Navbar } from "@/components/Navbar";
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
    <ClerkProvider localization={esES}>
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
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
