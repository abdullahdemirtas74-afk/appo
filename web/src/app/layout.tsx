import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  variable: "--font-appo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppO — Le bon pro, sans attendre",
  description:
    "Plomberie, électricité, serrurerie… AppO trouve un professionnel vérifié autour de vous, suit la mission et sécurise le paiement.",
  appleWebApp: {
    capable: true,
    title: "AppO",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ff4d1c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-ink">{children}</body>
    </html>
  );
}
