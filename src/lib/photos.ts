const PHOTOS: Record<string, string[]> = {
  manguier: ["/images/manguier.jpeg"],
  cocotier: ["/images/cocotier.jpeg"],
  bananier: ["/images/bananier.jpeg"],
};

export function photosDe(slug: string): string[] {
  return PHOTOS[slug] ?? [];
}