import type { MetadataRoute } from 'next';

const base = 'https://www.casanoppalu.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: bungalows, error } = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bungalows?select=slug,publie&publie=eq.true`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  ).then((res) => res.json());

  if (error) {
    console.error('Erreur fetch bungalows:', error);
    return [
      { url: base },
      { url: `${base}/bungalows` },
      { url: `${base}/contact` },
    ];
  }

  return [
    { url: base },
    { url: `${base}/bungalows` },
    { url: `${base}/contact` },
    ...bungalows.map((b: { slug: string }) => ({
      url: `${base}/bungalows/${b.slug}`,
    })),
  ];
}