import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PalmInsight - Palm Oil Plantation Tracker",
    template: "%s | PalmInsight",
  },
  description: "Track palm oil plantation productivity, manage team leaders, log daily harvest entries, and generate insightful reports.",
  keywords: ["palm oil", "plantation", "productivity", "tracker", "harvest", "agriculture"],
  authors: [{ name: "PalmInsight" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-4 focus:bg-white focus:text-black">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
