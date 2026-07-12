import type { Metadata } from "next";

// Used for metadataBase so relative canonical/OG/Twitter URLs resolve to absolute.
// Override with NEXT_PUBLIC_SITE_URL in production.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://palm-insight.app";
export const SITE_NAME = "PalmInsight";
export const OG_IMAGE = "/opengraph-image";

/**
 * Builds page metadata with Open Graph + Twitter Card + canonical URL filled in.
 * Every route's metadata.ts should call this so social sharing + SEO stay consistent.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const { title, description, path = "/" } = opts;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} — ${title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
