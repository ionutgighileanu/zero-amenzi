import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { SITE_URL } from "@/lib/constants";
import { CookieBanner } from "@/components/ui/CookieBanner";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // Face absolute toate URL-urile relative din metadata (og:image, canonical).
  // Fără el, og:image ar rămâne o cale relativă, pe care rețelele sociale nu o
  // pot rezolva, iar cardul de partajare ar apărea gol.
  metadataBase: new URL(SITE_URL),
  title: "AutoDocs",
  description: "Verificare automată a actelor auto și alerte înainte de expirare.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zero Amenzi",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "Zero Amenzi",
    title: "Zero Amenzi — actele auto, verificate automat",
    description:
      "Verifică gratuit dacă ITP-ul, RCA-ul și rovinieta sunt valabile. Primești alerte înainte de expirare, ca să nu mai iei amenzi.",
    url: SITE_URL,
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Zero Amenzi — actele auto, verificate automat. Alertate înainte să coste.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Amenzi — actele auto, verificate automat",
    description:
      "Verifică gratuit dacă ITP-ul, RCA-ul și rovinieta sunt valabile. Primești alerte înainte de expirare.",
    images: ["/og-default.jpg"],
  },
  // Next.js generează azi doar varianta standard "mobile-web-app-capable"
  // din appleWebApp.capable — adăugăm și forma prefixată, citită de Safari.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#003399",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
