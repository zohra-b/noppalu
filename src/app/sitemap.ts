import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBungalows } from "@/lib/data";

const base = "https://www.casanoppalu.com";

// Le sitemap se met à jour au plus toutes les heures
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = [];
  try {
    const bungalows = await getBungalows();
    slugs = bungalows.filter((b) => b.publie).map((b) => b.slug);
  } catch (e) {
    // Si la base est injoignable, on liste au moins les pages fixes
    console.error("Sitemap : lecture des bungalows impossible", e);
  }

  const chemins = [
    "",
    "/bungalows",
    "/contact",
    ...slugs.map((slug) => `/bungalows/${slug}`),
  ];

  return routing.locales.flatMap((locale) =>
    chemins.map((chemin) => ({ url: `${base}/${locale}${chemin}` })),
  );
}