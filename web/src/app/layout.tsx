import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  variable: "--font-appo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppO — Votre projet. Le bon pro.",
  description: "Trouvez un professionnel vérifié autour de vous, maintenant ou sur rendez-vous.",
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
