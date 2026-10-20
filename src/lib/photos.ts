const PHOTOS: Record<string, string[]> = {
  manguier: ["/images/bungalow1.jpg", "/images/bungalow2.jpg"],
  cocotier: ["/images/bungalow2.jpg"],
  bananier: ["/images/bungalow3.jpg"],
};

export function photosDe(slug: string): string[] {
  return PHOTOS[slug] ?? [];
}