import type { Metadata } from "next";
import "./globals.css";

// OJO: quitamos next/font/google a propósito. Esa fuente se descarga de Google
// durante `next build`; en un build de Docker eso vuelve el build lento y no reproducible.
export const metadata: Metadata = {
  title: "Catálogo de Productos | Ecosistema Docker",
  description: "Frontend Next.js que consume una API Laravel con MySQL, todo en contenedores",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
