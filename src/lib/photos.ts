const PHOTOS: Record<string, string[]> = {

  manguier: ["/images/manguier.jpg"],

  cocotier: ["/images/cocotier.jpeg"],
  
  bananier: ["/images/bananier.jpg"],
};

export function photosDe(slug: string): string[] {
  return PHOTOS[slug] ?? [];
}