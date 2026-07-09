import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Sistema Gastronómico",
    default: "Sistema Gastronómico | Gestión de Restaurante",
  },
  description:
    "Sistema completo de gestión para restaurantes y cafeterías. Administra pedidos, personal, menú, delivery y más.",
  metadataBase: new URL("https://sistema-comida-cafeteria.vercel.app"),
  keywords: ["restaurante", "cafetería", "gestión", "POS", "delivery", "pedidos"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
