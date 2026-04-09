import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontApp = Plus_Jakarta_Sans({
  variable: "--font-app",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lista de mercado",
  description: "Listas de compras claras, rápidas e no seu ritmo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mercado" },
};

export const viewport: Viewport = {
  themeColor: "#e9ecf5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fontApp.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[var(--background)] text-[var(--ink)]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
