import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import PwaInstallBanner from "@/components/PwaInstallBanner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#f59e0b",
};

export const metadata: Metadata = {
  title: {
    default: "PalmInsight - Palm Oil Plantation Tracker",
    template: "%s | PalmInsight",
  },
  description: "Track palm oil plantation productivity, manage team leaders, log daily harvest entries, and generate insightful reports.",
  keywords: ["palm oil", "plantation", "productivity", "tracker", "harvest", "agriculture"],
  authors: [{ name: "PalmInsight" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PalmInsight",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PalmInsight" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} font-body`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-4 focus:bg-white focus:text-black">
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <PwaInstallBanner />
      </body>
    </html>
  );
}
