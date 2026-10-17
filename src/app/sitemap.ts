import type { MetadataRoute } from "next";
import { bungalows } from "@/lib/bungalows";

// Liste toutes les pages que tu veux voir indexées.
// Aide Google à découvrir tes pages plus vite, surtout sur un site neuf qui n’a pas encore de liens entrants. 

const base = "https://www.casanoppalu.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base },
    { url: `${base}/bungalows` },
    { url: `${base}/contact` },
    ...bungalows
      .filter((b) => b.publie)
      .map((b) => ({ url: `${base}/bungalows/${b.slug}` })),
  ];
}